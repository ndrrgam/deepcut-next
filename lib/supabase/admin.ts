import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types';

/**
 * Next.js patches the global `fetch` in server runtime and applies HTTP
 * caching to GET requests by default. supabase-js does NOT pass
 * `cache: 'no-store'`, so its queries can get served a stale cached
 * response (e.g. `[]` for a row inserted later). Force `no-store` to
 * always hit PostgREST directly.
 */
const noStoreFetch: typeof fetch = (input, init) =>
  fetch(input, { ...init, cache: 'no-store' });

/**
 * Supabase Admin Client menggunakan SERVICE ROLE KEY.
 * ⚠️  HANYA untuk server-side (Route Handlers). Jangan pernah import ini
 * dari client component — service role key mem-bypass RLS.
 *
 * Dipakai untuk operasi yang butuh akses penuh, misal insert booking
 * customer dengan tetap menjaga RLS, atau operasi admin tertentu.
 * Untuk validasi session admin tetap gunakan createSupabaseServerClient.
 */
export function createSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  if (!url || !serviceRoleKey) {
    throw new Error(
      'Missing Supabase env vars: NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY',
    );
  }

  return createClient<Database>(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      fetch: noStoreFetch,
    },
  });
}
