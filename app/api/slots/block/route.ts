import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { error, getAdminUser, json } from '@/lib/api';
import { jamSelesai, isValidSlot } from '@/lib/slots';
import { BLOCKED_BOOKING_NAME, SLOT_CAPACITY } from '@/lib/constants';

export const dynamic = 'force-dynamic';

const blockSchema = z.object({
  branch_id: z.string().uuid(),
  tanggal: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  jam_mulai: z.string().regex(/^\d{2}:\d{2}$/),
});

/**
 * POST /api/slots/block — blokir slot manual (admin saja).
 * Membuat booking bertanda "-- BLOKIR --" dengan status 'confirmed'
 * sehingga slot tampak terisi di customer & jadwal.
 *
 * DELETE /api/slots/block — buka blokir (hapus booking bertanda blokir).
 *
 * CATATAN PERBAIKAN: dulu handler ini memakai `createSupabaseServerClient()`
 * (anon key + sesi cookie) sehingga seluruh operasi tunduk pada RLS. Dua
 * akibatnya:
 *   1. SELECT hanya melihat booking yang lolos RLS, jadi hitungan kursi
 *      kosong bisa salah -> blokir tidak menutup semua kursi.
 *   2. DELETE ikut terfilter RLS, jadi tombol "buka blokir" bisa diam-diam
 *      menghapus NOL baris lalu tetap membalas 200 "Blokir slot dibuka."
 *      UI menampilkan sukses padahal slot masih terkunci.
 * Sekarang keduanya memakai service-role client (setelah guard admin),
 * konsisten dengan handler booking lainnya.
 */
export async function POST(req: NextRequest) {
  const admin = await getAdminUser();
  if (!admin) return error('Unauthorized', 401);

  const body = await req.json().catch(() => null);
  const parsed = blockSchema.safeParse(body);
  if (!parsed.success) {
    return error('Data tidak valid', 400, parsed.error.flatten().fieldErrors);
  }

  const { branch_id, tanggal, jam_mulai } = parsed.data;
  if (!isValidSlot(jam_mulai)) {
    return error('Jam mulai tidak valid (interval 30 menit)', 400);
  }

  const supabase = createSupabaseAdminClient();

  // Hitung kursi yang masih kosong pada slot ini, lalu blokir semua kursi
  // kosong agar slot tampak penuh (kapasitas 2).
  const { data: existing, error: checkError } = await supabase
    .from('bookings')
    .select('kursi, nama')
    .eq('branch_id', branch_id)
    .eq('tanggal', tanggal)
    .eq('jam_mulai', jam_mulai)
    .neq('status', 'cancelled');

  if (checkError) return error('Gagal memeriksa slot', 500, checkError.message);

  const rows = existing ?? [];

  // Idempotent: kalau semua kursi sudah diblokir, jangan bikin baris ganda
  // (unique index per kursi akan menolaknya dengan 23505 yang menyesatkan).
  const blockedSeats = new Set(
    rows.filter((b) => b.nama === BLOCKED_BOOKING_NAME).map((b) => b.kursi),
  );
  const takenSeats = new Set(rows.map((b) => b.kursi));
  const freeSeats = Array.from({ length: SLOT_CAPACITY }, (_, i) => i + 1).filter(
    (k) => !takenSeats.has(k),
  );

  if (blockedSeats.size === SLOT_CAPACITY) {
    return json({ data: [], message: 'Slot sudah diblokir sebelumnya.' });
  }

  if (freeSeats.length === 0) {
    return error('Slot sudah penuh oleh booking customer', 409);
  }

  const insertRows = freeSeats.map((kursi) => ({
    nama: BLOCKED_BOOKING_NAME,
    no_wa: null,
    branch_id,
    tanggal,
    jam_mulai,
    jam_selesai: jamSelesai(jam_mulai),
    kursi,
    status: 'confirmed' as const,
  }));

  const { data, error: dbError } = await supabase
    .from('bookings')
    .insert(insertRows)
    .select();

  if (dbError) {
    if (dbError.code === '23505') {
      return error('Slot sudah terisi', 409);
    }
    return error('Gagal memblokir slot', 500, dbError.message);
  }

  return json({ data, message: 'Slot diblokir.' }, 201);
}

export async function DELETE(req: NextRequest) {
  const admin = await getAdminUser();
  if (!admin) return error('Unauthorized', 401);

  const body = await req.json().catch(() => null);
  const parsed = blockSchema.safeParse(body);
  if (!parsed.success) {
    return error('Data tidak valid', 400, parsed.error.flatten().fieldErrors);
  }

  const { branch_id, tanggal, jam_mulai } = parsed.data;
  const supabase = createSupabaseAdminClient();

  const { data, error: dbError } = await supabase
    .from('bookings')
    .delete()
    .eq('branch_id', branch_id)
    .eq('tanggal', tanggal)
    .eq('jam_mulai', jam_mulai)
    .eq('nama', BLOCKED_BOOKING_NAME)
    .select('id');

  if (dbError) return error('Gagal membuka blokir', 500, dbError.message);

  // Laporkan jumlah baris yang benar-benar terhapus. Dulu selalu 200 OK
  // walau nol baris terhapus, sehingga UI bilang sukses padahal tidak.
  const removed = data?.length ?? 0;
  return json({
    data: { removed },
    message:
      removed > 0
        ? 'Blokir slot dibuka.'
        : 'Tidak ada blokir pada slot ini.',
  });
}
