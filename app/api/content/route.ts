import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { error, getAdminUser, json } from '@/lib/api';
import { DEFAULT_CONTENT, type LandingContent } from '@/lib/content';

export const dynamic = 'force-dynamic';

const CONTENT_KEY = 'landing';

// Schema minimal: pastikan `value` berupa object (konten landing).
const putSchema = z.object({
  value: z.record(z.string(), z.unknown()),
});

/** Muat konten landing dari DB, fallback ke default bila belum ada. */
async function loadContent(): Promise<LandingContent> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from('site_settings')
    .select('value')
    .eq('key', CONTENT_KEY)
    .maybeSingle();

  if (error) {
    console.error('[loadContent] Gagal memuat site_settings:', error.message);
  }

  if (!data) return DEFAULT_CONTENT;
  return { ...DEFAULT_CONTENT, ...(data.value as Partial<LandingContent>) };
}

/**
 * GET /api/content — publik. Dipakai landing page untuk merender konten.
 */
export async function GET() {
  try {
    const content = await loadContent();
    return json({ data: content });
  } catch (e) {
    return error('Gagal memuat konten', 500, e instanceof Error ? e.message : undefined);
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

  const supabase = createSupabaseAdminClient();
  const { error: dbError } = await supabase
    .from('site_settings')
    .upsert({ key: CONTENT_KEY, value: parsed.data.value, updated_at: new Date().toISOString() });

  if (dbError) {
    return error('Gagal menyimpan konten', 500, dbError.message);
  }

  return json({ ok: true });
}
