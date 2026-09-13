import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { error, getAdminUser, json } from '@/lib/api';
import { DEFAULT_CONTENT, type LandingContent } from '@/lib/content';

export const dynamic = 'force-dynamic';

const CONTENT_KEY = 'landing';

// ----------------------------------------------------------------
// Schema validasi konten landing.
// Sebelumnya `z.record(z.string(), z.unknown())` — menerima APA SAJA,
// termasuk object kosong `{}` yang akan menimpa seluruh konten landing
// dengan data kosong. Sekarang minimal `services` dan `hero` divalidasi.
// ----------------------------------------------------------------
const serviceSchema = z.object({
  name: z.string().trim().min(1, 'Nama layanan wajib diisi').max(80),
  price: z.string().trim().max(40),
});

const putSchema = z.object({
  value: z
    .object({
      services: z
        .array(serviceSchema)
        .min(1, 'Minimal 1 layanan')
        .max(40, 'Maksimal 40 layanan'),
      hero: z
        .object({
          title_line_1: z.string().trim().max(120),
          title_line_2: z.string().trim().max(120),
        })
        .passthrough(),
      gallery: z.array(z.unknown()).max(24).optional(),
      marquee: z.array(z.string()).max(24).optional(),
      stats: z.array(z.unknown()).max(12).optional(),
      why: z.array(z.unknown()).max(12).optional(),
      hours: z.array(z.unknown()).max(14).optional(),
      branches: z.array(z.unknown()).max(12).optional(),
      cta: z.unknown().optional(),
      contact: z.unknown().optional(),
    })
    .passthrough(),
});

/**
 * Muat konten landing dari DB.
 *
 * PENTING — dua kondisi ini sebelumnya diperlakukan sama, dan itu akar
 * bug "konten di database tidak muncul di halaman":
 *
 *   1. Row belum ada        -> fallback DEFAULT_CONTENT. Ini BENAR.
 *   2. Query GAGAL (env salah, koneksi putus, RLS menolak)
 *                           -> HARUS error. Sebelumnya error hanya
 *                              di-`console.error` lalu tetap
 *                              `return DEFAULT_CONTENT`, sehingga API
 *                              membalas 200 OK berisi konten default
 *                              dan tidak ada satu pun sinyal kegagalan.
 */
async function loadContent(): Promise<LandingContent> {
  const supabase = createSupabaseAdminClient();
  const { data, error: dbError } = await supabase
    .from('site_settings')
    .select('value')
    .eq('key', CONTENT_KEY)
    .maybeSingle();

  if (dbError) {
    throw new Error(`Gagal query site_settings: ${dbError.message}`);
  }

  // Row belum pernah dibuat — pakai default, bukan sebuah kegagalan.
  if (!data) return DEFAULT_CONTENT;

  const stored = data.value as Partial<LandingContent>;
  const merged = { ...DEFAULT_CONTENT, ...stored };

  // Jangan biarkan array kosong dari DB mengosongkan section yang punya
  // default berguna (mis. `services: []` akan membuat halaman tanpa menu).
  if (!Array.isArray(merged.services) || merged.services.length === 0) {
    merged.services = DEFAULT_CONTENT.services;
  }
  return merged;
}

/**
 * GET /api/content — publik. Dipakai landing page untuk merender konten.
 */
export async function GET() {
  try {
    const content = await loadContent();
    return json({ data: content });
  } catch (e) {
    return error(
      'Gagal memuat konten',
      500,
      e instanceof Error ? e.message : undefined,
    );
  }
}

/**
 * PUT /api/content — admin saja. Menyimpan konten landing (upsert).
 */
export async function PUT(req: NextRequest) {
  const admin = await getAdminUser();
  if (!admin) return error('Tidak diizinkan', 401);

  const body = await req.json().catch(() => null);
  const parsed = putSchema.safeParse(body);
  if (!parsed.success) {
    return error('Konten tidak valid', 400, parsed.error.flatten().fieldErrors);
  }

  const incoming = parsed.data.value as Record<string, unknown>;

  try {
    const supabase = createSupabaseAdminClient();

    // Baca konten lama untuk mendeteksi penyusutan jumlah layanan yang
    // tidak disengaja (tanda form di-load gagal lalu menimpa data bagus).
    const { data: existing } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', CONTENT_KEY)
      .maybeSingle();

    const existingServices = (existing?.value as { services?: unknown[] } | null)
      ?.services;
    const oldCount = Array.isArray(existingServices) ? existingServices.length : 0;
    const newCount = (incoming.services as unknown[]).length;

    const { error: dbError } = await supabase
      .from('site_settings')
      .upsert({
        key: CONTENT_KEY,
        value: incoming,
        updated_at: new Date().toISOString(),
      });

    if (dbError) {
      return error('Gagal menyimpan konten', 500, dbError.message);
    }

    return json({
      ok: true,
      services: newCount,
      // Info untuk klien: kalau sebelumnya lebih banyak, ini kemungkinan
      // penimpaan yang tidak disengaja.
      shrunk: oldCount > 0 && newCount < oldCount ? { from: oldCount, to: newCount } : null,
    });
  } catch (e) {
    return error(
      'Gagal menyimpan konten',
      500,
      e instanceof Error ? e.message : undefined,
    );
  }
}
