import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '../types';

/**
 * Supabase Browser Client untuk client-side (form booking & login admin).
 * Hanya memakai anon key — aman untuk publik.
 */
export function createSupabaseBrowserClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
