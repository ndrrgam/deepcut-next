import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { error, getAdminUser, json } from '@/lib/api';
import { jamSelesai, isValidSlot } from '@/lib/slots';
import { normalizePhone } from '@/lib/validation';
import type { Database } from '@/lib/types';

type BookingUpdate = Database['public']['Tables']['bookings']['Update'];

export const dynamic = 'force-dynamic';

const updateSchema = z.object({
  nama: z.string().trim().min(1).max(100).optional(),
  no_wa: z
    .string()
    .trim()
    .refine((v) => v === '' || normalizePhone(v) !== null, {
      message: 'Format No. WhatsApp Indonesia tidak valid',
    })
    .optional(),
  branch_id: z.string().uuid().optional(),
  tanggal: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  jam_mulai: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  kursi: z.number().int().min(1).max(2).optional(),
  status: z.enum(['pending', 'confirmed', 'cancelled']).optional(),
});

async function requireAdmin() {
  const admin = await getAdminUser();
  if (!admin) return null;
  return admin;
}

/**
 * PATCH /api/bookings/[id] — update status / edit booking (admin saja).
 * Mendukung update parsial: status saja, atau kombinasi field lain.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const admin = await requireAdmin();
  if (!admin) return error('Unauthorized', 401);

  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return error('Data tidak valid', 400, parsed.error.flatten().fieldErrors);
  }

  const { id } = params;
  const patch = parsed.data;

  // Pastikan tidak ada field yang dikirim
  if (Object.keys(patch).length === 0) {
    return error('Tidak ada field yang diubah', 400);
  }

  const supabase = await createSupabaseServerClient();

  // Jika jam mulai diubah, validasi & hitung ulang jam_selesai.
  const update: BookingUpdate = { ...patch };
  if (patch.jam_mulai) {
    if (!isValidSlot(patch.jam_mulai)) {
      return error('Jam mulai tidak valid (interval 30 menit, 10.00–20.00)', 400);
    }
    update.jam_selesai = jamSelesai(patch.jam_mulai);
  }

  if (patch.no_wa !== undefined) {
    update.no_wa = patch.no_wa === '' ? null : normalizePhone(patch.no_wa);
  }

  const { data, error: dbError } = await supabase
    .from('bookings')
    .update(update)
    .eq('id', id)
    .select()
    .single();

  if (dbError) {
    if (dbError.code === '23505') {
      return error('Slot bentrok dengan booking lain', 409);
    }
    return error('Gagal mengupdate booking', 500, dbError.message);
  }

  return json({ data, message: 'Booking diperbarui.' });
}

/**
 * DELETE /api/bookings/[id] — hapus booking (admin saja).
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const admin = await requireAdmin();
  if (!admin) return error('Unauthorized', 401);

  const supabase = await createSupabaseServerClient();
  const { error: dbError } = await supabase
    .from('bookings')
    .delete()
    .eq('id', params.id);

  if (dbError) {
    return error('Gagal menghapus booking', 500, dbError.message);
  }

  return json({ message: 'Booking dihapus.' });
}
