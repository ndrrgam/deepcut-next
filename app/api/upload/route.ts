import { NextRequest } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { error, getAdminUser, json, tooManyRequests } from '@/lib/api';
import { UPLOAD_RATE, checkRateLimit, clientIp } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

const BUCKET = 'public-images';
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

/**
 * POST /api/upload — admin saja. Upload gambar (hero/galeri) ke Storage.
 * Body: FormData dengan field `file`.
 * Mengembalikan URL publik gambar.
 */
export async function POST(req: NextRequest) {
  const admin = await getAdminUser();
  if (!admin) return error('Tidak diizinkan', 401);

  // Rate limit per admin: upload adalah operasi manual, tidak perlu sering.
  const rl = checkRateLimit(
    `upload:${admin.id}:${clientIp(req)}`,
    UPLOAD_RATE.limit,
    UPLOAD_RATE.windowMs,
  );
  if (!rl.ok) return tooManyRequests(rl.retryAfterSec);

  const formData = await req.formData().catch(() => null);
  if (!formData) return error('Request harus berupa FormData', 400);

  const file = formData.get('file');
  if (!(file instanceof File)) {
    return error('File tidak ditemukan', 400);
  }

  if (file.size > MAX_SIZE) {
    return error('Ukuran file maksimal 5 MB', 400);
  }

  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
  const safeExt = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif'].includes(ext) ? ext : 'jpg';
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${safeExt}`;
  const bytes = await file.arrayBuffer();

  const supabase = createSupabaseAdminClient();
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(filename, bytes, {
      contentType: file.type || 'image/jpeg',
      upsert: false,
    });

  if (uploadError) {
    return error('Gagal mengupload gambar', 500, uploadError.message);
  }

  const { data: publicUrl } = supabase.storage.from(BUCKET).getPublicUrl(filename);

  return json({ data: { url: publicUrl.publicUrl } });
}
