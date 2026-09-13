import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types';
import { supabaseServiceRoleKey, supabaseUrl } from './env';

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
 * Env di-resolve lewat `./env` agar format key lama (JWT) maupun baru
 * (`sb_secret_*`) sama-sama jalan, dan agar nilai placeholder seperti
 * "[SENSITIVE]" ditolak keras dengan pesan yang jelas.
 */
export function createSupabaseAdminClient() {
  return createClient<Database>(supabaseUrl(), supabaseServiceRoleKey(), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      fetch: noStoreFetch,
    },
  });
}
