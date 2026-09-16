import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { error, getAdminUser, json } from '@/lib/api';
import { BOOKING_STATUSES, SLOT_CAPACITY } from '@/lib/constants';
import { jamSelesai, isValidSlot } from '@/lib/slots';
import { normalizePhone } from '@/lib/validation';

export const dynamic = 'force-dynamic';

const statusEnum = z.enum(BOOKING_STATUSES);

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
  status: statusEnum.optional(),
});

/**
 * PATCH /api/bookings/[id] — update status / edit booking (admin saja).
 * Mendukung update parsial: status saja, atau kombinasi field lain.
 *
 * CATATAN PERBAIKAN: dulu memakai `createSupabaseServerClient()` (anon +
 * RLS). Akibatnya saat memindahkan booking ke slot yang sudah terisi,
 * PATCH mengembalikan 500 dengan pesan mentah "duplicate key value
 * violates unique constraint ...", bukan 409 yang bisa ditangani UI.
 * Service-role client + normalisasi kode error memperbaiki itu.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const admin = await getAdminUser();
  if (!admin) return error('Unauthorized', 401);

  // Validasi id supaya nilai non-UUID tidak menghasilkan error PostgREST
  // yang membingungkan (500 dengan pesan internal database).
  const idParsed = z.string().uuid().safeParse(params.id);
  if (!idParsed.success) return error('ID booking tidak valid', 400);

  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return error('Data tidak valid', 400, parsed.error.flatten().fieldErrors);
  }

  const patch = parsed.data;

  if (Object.keys(patch).length === 0) {
    return error('Tidak ada field yang diubah', 400);
  }

  const supabase = createSupabaseAdminClient();
  const id = idParsed.data;

  // Booking harus ada sebelum diubah — kalau tidak, balas 404, bukan 500.
  const { data: current, error: readError } = await supabase
    .from('bookings')
    .select('id, jam_mulai, kursi, branch_id, tanggal')
    .eq('id', id)
    .maybeSingle();

  if (readError) return error('Gagal membaca booking', 500, readError.message);
  if (!current) return error('Booking tidak ditemukan', 404);

  // Bangun objek update. jam_selesai selalu diturunkan dari jam_mulai,
  // dan kursi wajib eksplisit saat memindahkan slot supaya unique index
  // per-kursi tidak menabrak kursi yang sudah terisi.
  const update: {
    nama?: string;
    no_wa?: string | null;
    branch_id?: string;
    tanggal?: string;
    jam_mulai?: string;
    jam_selesai?: string;
    kursi?: number;
    status?: 'pending' | 'confirmed' | 'cancelled';
  } = {};

  if (patch.nama !== undefined) update.nama = patch.nama;
  if (patch.branch_id !== undefined) update.branch_id = patch.branch_id;
  if (patch.tanggal !== undefined) update.tanggal = patch.tanggal;
  if (patch.status !== undefined) update.status = patch.status;
  if (patch.kursi !== undefined) update.kursi = patch.kursi;

  if (patch.jam_mulai !== undefined) {
    if (!isValidSlot(patch.jam_mulai)) {
      return error('Jam mulai tidak valid (interval 30 menit, 10.00–20.00)', 400);
    }
    update.jam_mulai = patch.jam_mulai;
    update.jam_selesai = jamSelesai(patch.jam_mulai);
  }

  if (patch.no_wa !== undefined) {
    update.no_wa = patch.no_wa === '' ? null : normalizePhone(patch.no_wa);
  }

  // Kalau slot berpindah, cari kursi kosong di slot tujuan supaya edit
  // tidak gagal hanya karena kursi lama sudah dipakai.
  const slotBerubah =
    (patch.branch_id !== undefined && patch.branch_id !== current.branch_id) ||
    (patch.tanggal !== undefined && patch.tanggal !== current.tanggal) ||
    (patch.jam_mulai !== undefined && patch.jam_mulai !== current.jam_mulai);

  if (slotBerubah && patch.kursi === undefined) {
    const targetBranch = patch.branch_id ?? current.branch_id;
    const targetTanggal = patch.tanggal ?? current.tanggal;
    const targetJam = patch.jam_mulai ?? current.jam_mulai;

    const { data: siblings, error: siblingsError } = await supabase
      .from('bookings')
      .select('kursi')
      .eq('branch_id', targetBranch)
      .eq('tanggal', targetTanggal)
      .eq('jam_mulai', targetJam)
      .neq('status', 'cancelled')
      .neq('id', id);

    if (siblingsError) {
      return error('Gagal memeriksa slot tujuan', 500, siblingsError.message);
    }

    const takenSeats = new Set((siblings ?? []).map((b) => b.kursi));
    if (takenSeats.size >= SLOT_CAPACITY) {
      return error('Slot tujuan sudah penuh. Pilih jam lain.', 409);
    }

    update.kursi = [1, 2].find((k) => !takenSeats.has(k)) ?? 1;
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
    if (dbError.code === '23514') {
      return error('Nilai kursi tidak valid (harus 1 atau 2)', 400);
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
  const admin = await getAdminUser();
  if (!admin) return error('Unauthorized', 401);

  const idParsed = z.string().uuid().safeParse(params.id);
  if (!idParsed.success) return error('ID booking tidak valid', 400);

  const supabase = createSupabaseAdminClient();
  const { data, error: dbError } = await supabase
    .from('bookings')
    .delete()
    .eq('id', idParsed.data)
    .select('id');

  if (dbError) return error('Gagal menghapus booking', 500, dbError.message);

  if (!data || data.length === 0) {
    return error('Booking tidak ditemukan', 404);
  }

  return json({ message: 'Booking dihapus.' });
}

