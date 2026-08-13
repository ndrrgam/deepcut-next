import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { error, json } from '@/lib/api';
import { generateSlots, isSlotBookable } from '@/lib/slots';
import { SLOT_CAPACITY } from '@/lib/constants';

export const dynamic = 'force-dynamic';

const querySchema = z.object({
  branch_id: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD'),
});

/**
 * GET /api/available-slots?branch_id=<uuid>&date=YYYY-MM-DD
 * Mengembalikan slot kosong untuk cabang & tanggal terpilih.
 * Hanya slot yang (a) belum terisi dan (b) masih bisa dibooking.
 */
export async function GET(req: NextRequest) {
  const parsed = querySchema.safeParse({
    branch_id: req.nextUrl.searchParams.get('branch_id'),
    date: req.nextUrl.searchParams.get('date'),
  });

  if (!parsed.success) {
    return error('Query tidak valid', 400, parsed.error.flatten().fieldErrors);
  }

  const { branch_id, date } = parsed.data;

  const supabase = createSupabaseAdminClient();

  // Ambil booking yang aktif (bukan cancelled) untuk cabang + tanggal tsb.
  const { data: bookings, error: dbError } = await supabase
    .from('bookings')
    .select('jam_mulai, status')
    .eq('branch_id', branch_id)
    .eq('tanggal', date)
    .neq('status', 'cancelled');

  if (dbError) {
    return error('Gagal memuat slot', 500, dbError.message);
  }

  // Hitung jumlah booking aktif per jam; slot penuh jika >= kapasitas (2).
  // DB mengembalikan time sebagai "HH:MM:SS", normalisasi ke "HH:MM".
  const countBySlot = new Map<string, number>();
  for (const b of bookings ?? []) {
    const key = String(b.jam_mulai).slice(0, 5);
    countBySlot.set(key, (countBySlot.get(key) ?? 0) + 1);
  }

  const available = generateSlots()
    .filter((slot) => (countBySlot.get(slot.jam_mulai) ?? 0) < SLOT_CAPACITY)
    .filter((slot) => isSlotBookable(date, slot.jam_mulai));

  return json({
    data: {
      branch_id,
      date,
      available_slots: available,
      total_available: available.length,
    },
  });
}
