import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from './supabase/server';

/** Bungkus response JSON dengan helper konsisten. */
export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

/** Response error konsisten. */
export function error(message: string, status = 400, details?: unknown) {
  return NextResponse.json(
    { error: message, ...(details !== undefined ? { details } : {}) },
    { status },
  );
}

/**
 * Guard admin: pastikan ada session Supabase Auth yang valid.
 * Mengembalikan user (atau null) jika gagal.
 */
export async function getAdminUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) return null;
  return user;
}
