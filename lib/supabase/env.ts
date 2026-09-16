/**
 * Resolver env Supabase yang tahan terhadap perbedaan penamaan.
 * ... (docstring sama)
 */

/** Nilai placeholder yang ditulis Vercel CLI / dashboard untuk env bertipe Secret. */
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

/**
 * URL proyek Supabase. Wajib ada.
 *
 * Menerima `SUPABASE_URL` sebagai cadangan: Vercel integration Supabase
 * memasang nama itu, dan lingkungan yang sudah ada kadang hanya punya versi
 * tanpa prefix NEXT_PUBLIC_. Membaca keduanya mencegah kegagalan deploy
 * hanya karena beda penamaan.
 */
export function supabaseUrl() {
  const raw = firstUsable(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_URL,
  );
  if (!raw) {
    // Untuk pesan diagnosa, lihat nilai APA ADANYA (termasuk yang kosong),
    // karena alasan kegagalan justru ada di situ.
    const seen = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
    const status =
      seen === undefined ? 'tidak diset sama sekali'
      : seen.trim() === '' ? 'diset tapi kosong'
      : seen === SENSITIVE_PLACEHOLDER ? 'bertipe Secret di Vercel (ter-inline "[SENSITIVE]")'
      : 'berisi nilai template placeholder';
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL tidak dapat dipakai — status: ' + status + '. ' +
        'Set sebagai Plain Text (bukan Secret) di Vercel, nilainya ' +
        'https://<project-ref>.supabase.co',
    );
  }
  return raw;
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
