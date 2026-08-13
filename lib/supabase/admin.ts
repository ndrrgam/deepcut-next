import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types';

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
  });
}
