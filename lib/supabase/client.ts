import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '../types';
import { supabaseAnonKey, supabaseUrl } from './env';

/**
 * Supabase Browser Client untuk client-side (form booking & login admin).
 * Hanya memakai anon/publishable key — aman untuk publik.
 */
export function createSupabaseBrowserClient() {
  return createBrowserClient<Database>(supabaseUrl(), supabaseAnonKey());
}
