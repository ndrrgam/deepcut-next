import { createSupabaseServerClient } from '@/lib/supabase/server';
import { error, json } from '@/lib/api';

export const dynamic = 'force-dynamic';

/**
 * GET /api/branches
 * Mengembalikan daftar cabang (publik, dipakai untuk dropdown booking).
 */
export async function GET() {
  const supabase = await createSupabaseServerClient();

  const { data, error: dbError } = await supabase
    .from('branches')
    .select('*')
    .order('nama_cabang', { ascending: true });

  if (dbError) {
    return error('Gagal mengambil daftar cabang', 500, dbError.message);
  }

  return json({ data });
}
