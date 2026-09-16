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

/** Response 429 dengan header Retry-After. */
export function tooManyRequests(retryAfterSec: number, message = 'Terlalu banyak permintaan. Coba lagi nanti.') {
  return NextResponse.json(
    { error: message },
    { status: 429, headers: { 'Retry-After': String(retryAfterSec) } },
  );
}

/**
 * Daftar email admin dari env `ADMIN_EMAILS` (dipisah koma).
 *
 * Jalur utama allowlist ada di database (`public.admins` +
 * `public.is_deepcut_admin()`) karena itulah yang dipakai RLS. Env ini
 * adalah jalur cepat opsional: kalau diisi, hanya email di daftar ini
 * yang lolos guard API — berguna untuk mengunci admin tanpa perlu
 * menyentuh database.
 *
 * Contoh: ADMIN_EMAILS="admin@deepcut.id,owner@deepcut.id"
 */
function adminEmailsFromEnv(): string[] {
  return (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * Guard admin: pastikan ada session Supabase Auth yang valid DAN user
 * tersebut benar-benar admin.
 *
 * KENAPA DIPERKETAT: sebelumnya fungsi ini hanya mengecek `user` ada.
 * Supabase mengizinkan sign-up self-service, jadi siapa pun yang bisa
 * memanggil /auth/v1/signup otomatis menjadi "authenticated" dan
 * mendapat seluruh akses admin — baca semua booking, hapus booking,
 * ubah konten situs, upload file.
 *
 * Sekarang ada dua lapis:
 *   1. session valid (Supabase Auth), dan
 *   2. keanggotaan allowlist — dicek ke `public.admins` lewat RPC
 *      `is_deepcut_admin()` (SECURITY DEFINER, tidak bisa dibaca anon).
 *
 * Kalau `ADMIN_EMAILS` diisi, email juga harus ada di daftar itu.
 * Kalau RPC tidak tersedia (migration belum jalan), guard GAGAL TERTUTUP:
 * akses ditolak, bukan dibuka. Jalankan migration-nya untuk membuka akses.
 */
export async function getAdminUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) return null;

  // Lapis opsional: allowlist dari env.
  const allowlist = adminEmailsFromEnv();
  if (allowlist.length > 0) {
    const email = user.email?.toLowerCase() ?? '';
    if (!allowlist.includes(email)) return null;
  }

  // Lapis wajib: allowlist di database.
  const { data: isAdmin, error: rpcError } = await supabase.rpc('is_deepcut_admin');

  if (rpcError) {
    // Migration belum dijalankan / function tidak ada -> tolak (fail closed).
    console.error('[admin-guard] RPC is_deepcut_admin gagal:', rpcError.message);
    return null;
  }

  if (isAdmin !== true) return null;

  return user;
}
