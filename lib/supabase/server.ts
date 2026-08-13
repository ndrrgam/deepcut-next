import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '../types';

/**
 * Next.js patches the global `fetch` in server runtime and applies HTTP
 * caching to GET requests by default. Force `no-store` so Supabase queries
 * always hit PostgREST directly and never return stale cached responses.
 */
const noStoreFetch: typeof fetch = (input, init) =>
  fetch(input, { ...init, cache: 'no-store' });

/**
 * Supabase Server Client untuk Route Handlers & Server Components.
 * Menggunakan cookie untuk sesi admin. Dipakai untuk operasi yang
 * memerlukan identitas user (mis. validasi session admin di API).
 */
export async function createSupabaseServerClient() {
  const cookieStore = cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component — safe to ignore when
            // middleware is refreshing sessions.
          }
        },
      },
      global: {
        fetch: noStoreFetch,
      },
    },
  );
}
