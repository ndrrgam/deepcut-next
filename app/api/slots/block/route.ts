import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
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

  const supabase = await createSupabaseServerClient();

  // Hitung kursi yang masih kosong pada slot ini, lalu blokir semua kursi
  // kosong agar slot tampak penuh (kapasitas 2).
  const { data: existing, error: checkError } = await supabase
    .from('bookings')
    .select('kursi')
    .eq('branch_id', branch_id)
    .eq('tanggal', tanggal)
    .eq('jam_mulai', jam_mulai)
    .neq('status', 'cancelled');

  if (checkError) return error('Gagal memeriksa slot', 500, checkError.message);

  const takenSeats = new Set((existing ?? []).map((b) => b.kursi));
  const freeSeats = Array.from({ length: SLOT_CAPACITY }, (_, i) => i + 1).filter(
    (k) => !takenSeats.has(k),
  );

  if (freeSeats.length === 0) {
    return error('Slot sudah penuh', 409);
  }

  const rows = freeSeats.map((kursi) => ({
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
    .insert(rows)
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
  const supabase = await createSupabaseServerClient();

  const { error: dbError } = await supabase
    .from('bookings')
    .delete()
    .eq('branch_id', branch_id)
    .eq('tanggal', tanggal)
    .eq('jam_mulai', jam_mulai)
    .eq('nama', BLOCKED_BOOKING_NAME);

  if (dbError) return error('Gagal membuka blokir', 500, dbError.message);

  return json({ message: 'Blokir slot dibuka.' });
}
