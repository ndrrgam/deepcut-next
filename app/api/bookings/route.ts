import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { error, getAdminUser, json, tooManyRequests } from '@/lib/api';
import { BOOKING_RATE, checkRateLimit, clientIp } from '@/lib/rate-limit';
import { jamSelesai, isSlotBookable, isValidSlot } from '@/lib/slots';
import { normalizePhone } from '@/lib/validation';
import { BLOCKED_BOOKING_NAME, SLOT_CAPACITY } from '@/lib/constants';
import { todayWIB } from '@/lib/datetime';

export const dynamic = 'force-dynamic';

// ----------------------------------------------------------------
// Schema validasi
// ----------------------------------------------------------------
const createBookingSchema = z.object({
  nama: z.string().trim().min(1, 'Nama wajib diisi').max(100),
  no_wa: z
    .string()
    .trim()
    .refine((v) => v === '' || normalizePhone(v) !== null, {
      message: 'Format No. WhatsApp Indonesia tidak valid (08xxx / 628xxx)',
    })
    .optional(),
  branch_id: z.string().uuid(),
  tanggal: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD'),
  jam_mulai: z
    .string()
    .regex(/^\d{2}:\d{2}$/, 'Format jam harus HH:mm'),
});

const listQuerySchema = z.object({
  branch_id: z.string().uuid().optional(),
  tanggal: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  status: z.enum(['pending', 'confirmed', 'cancelled']).optional(),
});

// ----------------------------------------------------------------
// POST /api/bookings — buat booking (customer, publik)
// ----------------------------------------------------------------
export async function POST(req: NextRequest) {
  // 0. Rate limit per IP. Tanpa ini satu skrip bisa mengunci seluruh
  //    slot kalender: POST langsung berulang tanpa jeda.
  const rl = checkRateLimit(
    `booking:${clientIp(req)}`,
    BOOKING_RATE.limit,
    BOOKING_RATE.windowMs,
  );
  if (!rl.ok) {
    return tooManyRequests(
      rl.retryAfterSec,
      'Terlalu banyak percobaan booking. Tunggu beberapa menit lalu coba lagi.',
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = createBookingSchema.safeParse(body);

  if (!parsed.success) {
    return error('Data booking tidak valid', 400, parsed.error.flatten().fieldErrors);
  }

  const { nama, no_wa, branch_id, tanggal, jam_mulai } = parsed.data;

  // 1. Validasi jam mulai adalah slot valid (interval 30 menit)
  if (!isValidSlot(jam_mulai)) {
    return error(
      'Jam booking tidak valid. Pilih slot dengan interval 30 menit (10.00–20.00).',
      400,
    );
  }

  // 2. Validasi tanggal tidak lewat + minimal lead time
  if (!isSlotBookable(tanggal, jam_mulai)) {
    return error(
      'Slot ini tidak bisa dibooking. Pilih tanggal yang belum lewat dan minimal 1 jam sebelum jam mulai.',
      400,
    );
  }

  // 3. Validasi cabang ada (pakai anon client untuk SELECT cabang)
  const supabase = await createSupabaseServerClient();

  const { data: branch, error: branchError } = await supabase
    .from('branches')
    .select('id')
    .eq('id', branch_id)
    .single();

  if (branchError || !branch) {
    return error('Cabang tidak ditemukan', 404);
  }

  // 4. Cegah booking bentrok — slot penuh jika sudah 2 booking aktif.
  //    (race-condition safe berkat unique index per-kursi di DB).
  //    Pakai service role agar cek tidak terfilter RLS.
  const { data: existing } = await createSupabaseAdminClient()
    .from('bookings')
    .select('id, kursi')
    .eq('branch_id', branch_id)
    .eq('tanggal', tanggal)
    .eq('jam_mulai', jam_mulai)
    .neq('status', 'cancelled');

  const active = existing ?? [];
  if (active.length >= SLOT_CAPACITY) {
    return error('Slot sudah penuh. Silakan pilih jam lain.', 409);
  }

  // Pilih kursi kosong (1 dulu, lalu 2).
  const takenSeats = new Set(active.map((b) => b.kursi));
  const kursi = [1, 2].find((k) => !takenSeats.has(k)) ?? 1;

  // 5. Simpan booking dengan status pending — admin konfirmasi via WhatsApp.
  //    Pakai service role client agar tidak terblokir RLS.
  const adminClient = createSupabaseAdminClient();
  const jam_selesai = jamSelesai(jam_mulai);
  const { data: booking, error: insertError } = await adminClient
    .from('bookings')
    .insert({
      nama,
      no_wa: no_wa ? normalizePhone(no_wa) : null,
      branch_id,
      tanggal,
      jam_mulai,
      jam_selesai,
      kursi,
      status: 'pending',
    })
    .select()
    .single();

  if (insertError) {
    // Unique constraint violation = bentrok (dari race condition)
    if (insertError.code === '23505') {
      return error('Slot sudah penuh. Silakan pilih jam lain.', 409);
    }
    return error('Gagal menyimpan booking', 500, insertError.message);
  }

  return json(
    {
      data: booking,
      message: 'Booking tersimpan. Menunggu konfirmasi admin.',
    },
    201,
  );
}

// ----------------------------------------------------------------
// GET /api/bookings — daftar booking (admin saja)
// ----------------------------------------------------------------
export async function GET(req: NextRequest) {
  const admin = await getAdminUser();
  if (!admin) {
    return error('Unauthorized', 401);
  }

  const raw = {
    branch_id: req.nextUrl.searchParams.get('branch_id') ?? undefined,
    tanggal: req.nextUrl.searchParams.get('tanggal') ?? undefined,
    status: req.nextUrl.searchParams.get('status') ?? undefined,
  };
  const parsed = listQuerySchema.safeParse(raw);
  if (!parsed.success) {
    return error('Query tidak valid', 400, parsed.error.flatten().fieldErrors);
  }

  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from('bookings')
    .select('*, branches(nama_cabang)')
    .order('tanggal', { ascending: true })
    .order('jam_mulai', { ascending: true });

  if (parsed.data.branch_id) query = query.eq('branch_id', parsed.data.branch_id);
  if (parsed.data.tanggal) query = query.eq('tanggal', parsed.data.tanggal);
  if (parsed.data.status) query = query.eq('status', parsed.data.status);

  const { data, error: dbError } = await query;

  if (dbError) {
    return error('Gagal memuat booking', 500, dbError.message);
  }

  return json({ data });
}
