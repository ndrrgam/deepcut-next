import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { error, getAdminUser, json } from '@/lib/api';
import { generateSlots } from '@/lib/slots';

export const dynamic = 'force-dynamic';

const querySchema = z.object({
  branch_id: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD'),
});

/**
 * GET /api/schedule?branch_id=<uuid>&date=YYYY-MM-DD
 * Jadwal harian per cabang (admin saja): daftar semua slot dengan status
 * terisi/kosong beserta detail booking-nya.
 */
export async function GET(req: NextRequest) {
  const admin = await getAdminUser();
  if (!admin) return error('Unauthorized', 401);

  const parsed = querySchema.safeParse({
    branch_id: req.nextUrl.searchParams.get('branch_id'),
    date: req.nextUrl.searchParams.get('date'),
  });
  if (!parsed.success) {
    return error('Query tidak valid', 400, parsed.error.flatten().fieldErrors);
  }

  const { branch_id, date } = parsed.data;
  const supabase = await createSupabaseServerClient();

  const { data: bookings, error: dbError } = await supabase
    .from('bookings')
    .select('id, nama, no_wa, jam_mulai, jam_selesai, kursi, status')
    .eq('branch_id', branch_id)
    .eq('tanggal', date)
    .neq('status', 'cancelled')
    .order('jam_mulai', { ascending: true })
    .order('kursi', { ascending: true });

  if (dbError) return error('Gagal memuat jadwal', 500, dbError.message);

  const bySlot = new Map<string, typeof bookings>();
  for (const b of bookings ?? []) {
    const key = String(b.jam_mulai).slice(0, 5);
    const list = bySlot.get(key) ?? [];
    list.push(b);
    bySlot.set(key, list);
  }

  const slots = generateSlots().map((slot) => {
    const list = bySlot.get(slot.jam_mulai) ?? [];
    return {
      ...slot,
      terisi: list.length > 0,
      booking: list,
    };
  });

  return json({
    data: {
      branch_id,
      date,
      total_slots: slots.length,
      filled: slots.filter((s) => s.terisi).length,
      empty: slots.filter((s) => !s.terisi).length,
      slots,
    },
  });
}
