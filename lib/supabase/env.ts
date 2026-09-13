/**
 * Resolver env Supabase yang tahan terhadap perbedaan penamaan.
 *
 * Supabase punya dua format key:
 *   - Lama  : `anon` JWT  (eyJ...)  + `service_role` JWT
 *   - Baru  : `sb_publishable_*`   + `sb_secret_*`
 *
 * Vercel project bisa menamai variabelnya dengan salah satu dari dua skema.
 * Kalau kode hanya membaca satu nama, deployment akan "jalan" tapi gagal
 * diam-diam dengan pesan yang menyesatkan. Helper ini menerima keduanya.
 */

/** Nilai placeholder yang ditulis Vercel CLI untuk env bertipe Secret. */
const SENSITIVE_PLACEHOLDER = '[SENSITIVE]';

/**
 * True jika value ada DAN bukan placeholder/format template.
 * Menangkap kasus nyata: env bertipe `Secret` di Vercel di-pull sebagai
 * literal "[SENSITIVE]" sehingga client terbentuk dengan URL invalid.
 */
function isUsable(value: string | undefined): value is string {
  if (!value) return false;
  const v = value.trim();
  if (!v) return false;
  if (v === SENSITIVE_PLACEHOLDER) return false;
  if (v.includes('YOUR-PROJECT')) return false;
  if (v.includes('YOUR_ANON_KEY')) return false;
  if (v.includes('YOUR_SERVICE_ROLE_KEY')) return false;
  return true;
}

function firstUsable(...candidates: (string | undefined)[]): string | undefined {
  return candidates.find(isUsable);
}

/** URL proyek Supabase. Wajib ada. */
export function supabaseUrl(): string {
  const url = firstUsable(process.env.NEXT_PUBLIC_SUPABASE_URL);
  if (!url) {
    throw new Error(
      'Env var NEXT_PUBLIC_SUPABASE_URL tidak valid atau kosong. ' +
        `Nilai yang diterima: ${JSON.stringify(process.env.NEXT_PUBLIC_SUPABASE_URL ?? null)}. ` +
        'Pastikan variabel ini bertipe "Plain Text" (bukan Secret) di Vercel — ' +
        'env bertipe Secret di-inline sebagai "[SENSITIVE]" saat build.',
    );
  }
  return url;
}

/** Publishable / anon key. Aman dipakai di client. */
export function supabaseAnonKey(): string {
  const key = firstUsable(
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
  if (!key) {
    throw new Error(
      'Env var NEXT_PUBLIC_SUPABASE_ANON_KEY / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ' +
        'tidak valid atau kosong. Pastikan bertipe "Plain Text" (bukan Secret) di Vercel.',
    );
  }
  return key;
}

/** Service role / secret key. HANYA untuk server-side — bypass RLS. */
export function supabaseServiceRoleKey(): string {
  const key = firstUsable(
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    process.env.SUPABASE_SECRET_KEY,
  );
  if (!key) {
    throw new Error(
      'Env var SUPABASE_SERVICE_ROLE_KEY tidak valid atau kosong. ' +
        'Tambahkan nilainya di Vercel/Dashboard Supabase.',
    );
  }
  return key;
}
