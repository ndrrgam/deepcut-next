fix: integritas slot, allowlist admin, rate limit, dan hardening build

Menyelesaikan 6 temuan dari review kode. Semua perubahan sudah
diverifikasi lewat `npm run verify` (typecheck + test + build) dan
pengujian HTTP nyata terhadap `next start` di lokal.

## 1. Booking kedua selalu ditolak (blocker)

`20260813000001_fix_rls.sql` dan `20260813000001_kapasitas2_autoconfirm.sql`
memakai NOMOR VERSI YANG SAMA, sehingga urutan apply-nya tidak
deterministik. `fix_rls` men-`CREATE` kembali `bookings_unique_slot_idx`
yang sudah di-`DROP` oleh `kapasitas2_autoconfirm`. Kalau `fix_rls` jalan
belakangan, database hanya mengizinkan SATU booking per slot dan booking
kedua ditolak 409 "Slot sudah penuh" meski kursi 2 kosong.

- Migration baru `20260815000000_fix_slot_index_and_admin.sql`: idempotent,
  drop index lama, pastikan `bookings_unique_seat_idx` ada, backfill kolom
  `kursi`, dan **gagalkan migration** kalau kondisi akhir tidak benar.

## 2. Siapa pun bisa jadi admin (self-signup)

`getAdminUser()` hanya mengecek ada session Supabase Auth. Supabase
mengizinkan sign-up self-service, jadi siapa pun yang bisa memanggil
`/auth/v1/signup` otomatis mendapat akses penuh: baca semua booking, hapus
booking, ubah konten situs, upload file. RLS juga memakai
`TO authenticated USING (true)`.

- Tabel `public.admins` + fungsi `public.is_deepcut_admin()`
  (SECURITY DEFINER, `search_path` terkunci).
- Semua policy admin sekarang memakai `is_deepcut_admin()`.
- `getAdminUser()` **fail closed**: kalau RPC tidak tersedia (migration
  belum jalan), akses ditolak — bukan dibuka.
- Lapis opsional env `ADMIN_EMAILS`.

## 3. Tidak ada rate limit sama sekali

`POST /api/bookings` adalah endpoint publik tanpa batas; satu skrip bisa
mengunci seluruh kalender.

- `lib/rate-limit.ts` — sliding window in-memory, 5 booking / 10 menit per IP
  (upload 20, login 10), plus `Retry-After` yang benar.
- Batasannya didokumentasikan sebagai per-instance; upgrade path ke
  Redis/Upstash/Cloudflare ada di komentar. API-nya tidak perlu berubah.

## 4. `anon` bisa INSERT booking langsung ke database

Policy `bookings_insert_public` memakai `WITH CHECK (true)` untuk `anon`.
Anon key bersifat publik (ada di bundle browser), jadi booking 'confirmed'
bisa disuntik lewat PostgREST tanpa validasi jam, cek kapasitas, atau rate
limit.

- Insert publik dihapus; booking customer selalu lewat `/api/bookings`
  (service role + validasi + rate limit).

## 5. Operasi admin memakai klien anon + RLS

`slots/block` dan `bookings/[id]` memakai `createSupabaseServerClient()`.
Akibatnya DELETE bisa menghapus NOL baris lalu tetap membalas 200 "Blokir
slot dibuka.", dan PATCH memindahkan booking ke slot terisi mengembalikan
500 dengan pesan mentah constraint, bukan 409.

- Keduanya pindah ke service-role (setelah guard admin).
- `DELETE /api/slots/block` mengembalikan jumlah baris yang benar-benar
  terhapus; `DELETE /api/bookings/[id]` membalas 404 kalau tidak ada.
- PATCH sekarang otomatis memilih kursi kosong saat slot berpindah.

## 6. Hardening

- `next.config.js`: header keamanan (HSTS, X-Frame-Options DENY, nosniff,
  Referrer-Policy, Permissions-Policy), `poweredByHeader: false`,
  `/admin/*` no-store.
- Project ref Supabase tidak lagi di-hardcode di `next.config.js` dan
  `.env.local.example` (dulu bocor ke bundle publik).
- `scripts/cleanup-test.cjs` dan `scripts/diag-rls.cjs` dihapus — keduanya
  berisi key `eyJhbG...Tidk` yang terpotong dan kodenya tidak akan pernah
  jalan.
- `postcss` 8.5.22 → 8.5.28 (4 advisory hilang).

## Verifikasi

```
npm run verify          # typecheck + test + build, semua hijau
node scripts/selfcheck.mjs   # 9 pass
node --test lib/rate-limit.test.mjs   # 8 pass
```

Diuji HTTP nyata terhadap `next start`:

| Uji | Hasil |
|---|---|
| `GET /api/bookings` tanpa session | 401 |
| `PATCH /api/bookings/:id` tanpa session | 401 |
| `DELETE /api/bookings/:id` tanpa session | 401 |
| `PUT /api/content` tanpa session | 401 |
| `POST /api/slots/block` tanpa session | 401 |
| 5 booking berturut | 400 (lolos ke validasi) |
| booking ke-6 | **429** + `Retry-After: 588` |
| IP berbeda | 400 (tidak ikut terblokir) |
| Header keamanan | kelima terpasang, `x-powered-by` absen |

## ⚠️ Langkah manual setelah merge

Migration tidak jalan otomatis. Setelah deploy:

1. Jalankan `20260815000000_fix_slot_index_and_admin.sql` di Supabase SQL
   Editor.
2. **GANTI email placeholder** di blok `INSERT INTO public.admins` dengan
   email admin sebenarnya (jalankan ulang blok itu setelah akun dibuat).
3. Matikan sign-up publik: Dashboard Supabase → Authentication → Providers
   → Email → **Disable sign-ups**.
4. Set env `ADMIN_EMAILS` di Vercel (tipe Secret).

Selama langkah 1 belum dijalankan, `getAdminUser()` gagal tertutup dan
semua endpoint admin membalas 401 — ini disengaja.

## Belum dikerjakan

Upgrade Next.js 14.2.35 → 15/16. `npm audit` masih menemukan 22 advisory
(CRITICAL) di 14.2.35, dan **tidak ada patch di jalur 14.x** — 14.2.35
adalah rilis terakhir sebelum dukungan berakhir. Termasuk di dalamnya RCE
tanpa autentikasi pada server Windows dan pada Image Optimization API saat
AVIF dipakai. Di Vercel sebagian besar tidak terekspos (Linux), tetapi ini
upgrade tersendiri karena breaking. Sebaiknya dikerjakan sebagai PR
terpisah.
