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
  // Pembuatan client bisa melempar kalau env Supabase tidak sehat. Tanpa
  // penangkapan di sini, sembilan endpoint admin (bookings, content, schedule,
  // slots/block, upload) akan membalas 500 dan stack trace mentah ke log —
  // bukan 401 yang rapi. Guard harus gagal TERTUTUP dan tetap tenang.
  let supabase;
  try {
    supabase = await createSupabaseServerClient();
  } catch (e) {
    console.error(
      '[admin-guard] client Supabase tidak bisa dibuat — cek NEXT_PUBLIC_SUPABASE_URL ' +
        '/ NEXT_PUBLIC_SUPABASE_ANON_KEY di Vercel (harus Plain Text). Akses ditolak.',
    );
    return null;
  }

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
    //
    // Log sengaja TIDAK menyertakan pesan mentah dari PostgREST. Pesan itu
    // memuat nama fungsi/internal schema (mis. "Could not find the function
    // public.is_deepcut_admin ... in the schema cache") dan ikut terkirim ke
    // log runtime Vercel, yang bisa dibaca siapa pun yang punya akses project.
    // Yang kita simpan hanya kode error + apakah ini masalah "belum ada".
    const code = rpcError.code ?? 'unknown';
    const missing = code === 'PGRST202' || /could not find the function/i.test(rpcError.message ?? '');
    console.error(
      `[admin-guard] pengecekan admin gagal (kode=${code}${missing ? ', RPC belum ada' : ''}). ` +
        'Jalankan migration 20260815000000_fix_slot_index_and_admin.sql; ' +
        'selama itu, akses admin ditolak.',
    );
    return null;
  }

  if (isAdmin !== true) return null;

  return user;
}
