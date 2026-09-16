-- ================================================================
-- DEEP CUT — Konsolidasi integritas slot + admin allowlist
-- Jalankan lewat Supabase SQL Editor (atau `supabase db push`).
--
-- KENAPA MIGRATION INI ADA
-- ----------------------------------------------------------------
-- Dua migration sebelumnya memakai nomor versi yang SAMA
-- (20260813000001_fix_rls.sql dan 20260813000001_kapasitas2_autoconfirm.sql),
-- sehingga urutan apply-nya tidak deterministik:
--
--   * kapasitas2_autoconfirm  -> DROP bookings_unique_slot_idx, bikin
--                                bookings_unique_seat_idx (per kursi)
--   * fix_rls                 -> CREATE bookings_unique_slot_idx LAGI
--
-- Jika fix_rls dieksekusi belakangan, index lama hidup kembali dan
-- database hanya mengizinkan SATU booking per slot — padahal aplikasi
-- (SLOT_CAPACITY = 2) dan UI memilih kursi 1/2. Booking kedua selalu
-- ditolak 409 "Slot sudah penuh" meski kursi kedua masih kosong.
--
-- Migration ini idempotent: aman dijalankan berapa kali pun, dan
-- menghasilkan kondisi akhir yang sama terlepas dari urutan migration
-- lama.
-- ================================================================


-- ----------------------------------------------------------------
-- 1. Pastikan kolom `kursi` ada (dependency: konstraint & index).
-- ----------------------------------------------------------------
ALTER TABLE public.bookings
    ADD COLUMN IF NOT EXISTS kursi smallint;

-- Backfill baris lama yang belum punya kursi. Baris hasil backfill
-- bisa bentrok dengan index unik seat, jadi sementara lepas dulu
-- nilainya per slot (row_number) sebelum constraint dipasang.
WITH numbered AS (
    SELECT id,
           ROW_NUMBER() OVER (
               PARTITION BY branch_id, tanggal, jam_mulai
               ORDER BY created_at, id
           ) AS rn
    FROM public.bookings
    WHERE kursi IS NULL
)
UPDATE public.bookings b
   SET kursi = LEAST(n.rn, 2)
  FROM numbered n
 WHERE b.id = n.id;

ALTER TABLE public.bookings
    ALTER COLUMN kursi SET NOT NULL,
    ALTER COLUMN kursi SET DEFAULT 1;


-- ----------------------------------------------------------------
-- 2. Buang unique index lama (1 booking per slot).
--    `DROP INDEX IF EXISTS` aman walau index tidak ada.
-- ----------------------------------------------------------------
DROP INDEX IF EXISTS public.bookings_unique_slot_idx;


-- ----------------------------------------------------------------
-- 3. Index yang benar: maksimal 1 booking aktif per KURSI per slot.
--    Ini yang mengizinkan 2 booking berbagi slot (kursi 1 & 2) dan
--    tetap race-condition safe di level DB.
-- ----------------------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS bookings_unique_seat_idx
    ON public.bookings (branch_id, tanggal, jam_mulai, kursi)
    WHERE status <> 'cancelled';


-- ----------------------------------------------------------------
-- 4. Constraint rentang kursi (idempotent).
-- ----------------------------------------------------------------
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_kursi_range'
    ) THEN
        ALTER TABLE public.bookings
            ADD CONSTRAINT chk_kursi_range CHECK (kursi IN (1, 2));
    END IF;
END$$;


-- ----------------------------------------------------------------
-- 5. Kolom index / constraint lain tidak boleh menyisakan index lama.
--    Guard: gagalkan migration kalau index lama masih ada, supaya
--    masalahnya kelihatan dan tidak diam-diam lolos ke produksi.
-- ----------------------------------------------------------------
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE schemaname = 'public'
          AND indexname  = 'bookings_unique_slot_idx'
    ) THEN
        RAISE EXCEPTION
            'bookings_unique_slot_idx masih ada — slot akan terkunci ke 1 booking. Periksa manual.';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE schemaname = 'public'
          AND indexname  = 'bookings_unique_seat_idx'
    ) THEN
        RAISE EXCEPTION
            'bookings_unique_seat_idx gagal dibuat — booking kedua akan selalu ditolak.';
    END IF;
END$$;


-- ----------------------------------------------------------------
-- 6. RLS bookings — jangan biarkan `anon` INSERT langsung.
--
-- SEBELUM: policy `bookings_insert_public ... TO anon, authenticated
-- WITH CHECK (true)`. Anon key bersifat publik (ada di bundle browser),
-- jadi siapa pun bisa POST langsung ke PostgREST dan menyuntik booking
-- 'confirmed' tanpa lewat API kita: tidak ada validasi jam, tidak ada
-- cek kapasitas, tidak ada rate limit. Kalender bisa dikunci total
-- dalam hitungan detik.
--
-- SESUDAH: anon TIDAK boleh insert. Booking customer selalu lewat
-- /api/bookings yang memakai service role (bypass RLS) dan melakukan
-- validasi + rate limit. Admin (authenticated + allowlist) tetap bisa.
-- ----------------------------------------------------------------
DROP POLICY IF EXISTS "bookings_insert_public" ON public.bookings;

DROP POLICY IF EXISTS "bookings_insert_admin" ON public.bookings;
CREATE POLICY "bookings_insert_admin"
    ON public.bookings FOR INSERT
    TO authenticated
    WITH CHECK (public.is_deepcut_admin());


-- ----------------------------------------------------------------
-- 7. Admin allowlist.
--
-- SEBELUM: `getAdminUser()` hanya mengecek ada session Supabase Auth.
-- Supabase mengizinkan sign-up self-service, jadi siapa pun yang bisa
-- memanggil /auth/v1/signup menjadi "authenticated" dan otomatis
-- mendapat seluruh akses admin (RLS `TO authenticated USING (true)`,
-- dashboard, hapus booking, upload file).
--
-- SESUDAH: keanggotaan admin ditentukan lewat tabel allowlist yang
-- independen. RLS admin sekarang memakai is_deepcut_admin().
--
-- PENTING — jalankan langkah 7a dan 7b SEKALI:
--   7a. matikan sign-up publik di Dashboard Supabase
--       (Authentication -> Providers -> Email -> Disable sign-ups)
--   7b. insert email admin di bawah, GANTI nilainya.
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admins (
    user_id    uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email      text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- Tidak ada satu pun policy -> tidak ada akses lewat PostgREST untuk
-- anon maupun authenticated. Hanya service role yang bisa membacanya.
REVOKE ALL ON public.admins FROM anon, authenticated;

-- Helper dipakai oleh policy. SECURITY DEFINER + search_path terkunci
-- supaya tidak bisa di-hijack lewat schema lain, dan supaya tidak ada
-- rekursi RLS saat policy tabel lain memanggilnya.
CREATE OR REPLACE FUNCTION public.is_deepcut_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.admins WHERE user_id = auth.uid()
    );
$$;

REVOKE ALL ON FUNCTION public.is_deepcut_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_deepcut_admin() TO anon, authenticated;

-- ---- 7b. GANTI email berikut dengan admin sebenarnya ----
-- Ambil user_id dari auth.users setelah akun admin dibuat.
INSERT INTO public.admins (user_id, email)
SELECT id, email
  FROM auth.users
 WHERE email IN (
        'admin@deepcut.id'   -- <-- GANTI
      )
ON CONFLICT (user_id) DO NOTHING;

-- Kalau akun admin belum ada saat migration dijalankan, jalankan
-- blok INSERT di atas lagi setelah akun dibuat.


-- ----------------------------------------------------------------
-- 8. Policy admin lain: ganti `TO authenticated USING (true)` menjadi
--    benar-benar mengecek allowlist.
-- ----------------------------------------------------------------
DROP POLICY IF EXISTS "bookings_read_admin" ON public.bookings;
CREATE POLICY "bookings_read_admin"
    ON public.bookings FOR SELECT
    TO authenticated
    USING (public.is_deepcut_admin());

DROP POLICY IF EXISTS "bookings_update_admin" ON public.bookings;
CREATE POLICY "bookings_update_admin"
    ON public.bookings FOR UPDATE
    TO authenticated
    USING (public.is_deepcut_admin())
    WITH CHECK (public.is_deepcut_admin());

DROP POLICY IF EXISTS "bookings_delete_admin" ON public.bookings;
CREATE POLICY "bookings_delete_admin"
    ON public.bookings FOR DELETE
    TO authenticated
    USING (public.is_deepcut_admin());

DROP POLICY IF EXISTS "site_settings_write_admin" ON public.site_settings;
CREATE POLICY "site_settings_write_admin"
    ON public.site_settings FOR ALL
    TO authenticated
    USING (public.is_deepcut_admin())
    WITH CHECK (public.is_deepcut_admin());


-- ----------------------------------------------------------------
-- 9. Index bantu untuk query slot & jadwal.
-- ----------------------------------------------------------------
CREATE INDEX IF NOT EXISTS bookings_branch_tanggal_idx
    ON public.bookings (branch_id, tanggal)
    WHERE status <> 'cancelled';


-- ================================================================
-- VERIFIKASI — jalankan manual setelah migration.
-- ================================================================
-- Index (harus tampil bookings_unique_seat_idx, TIDAK ada
-- bookings_unique_slot_idx):
--   SELECT indexname FROM pg_indexes
--    WHERE tablename = 'bookings' ORDER BY indexname;
--
-- Admin allowlist:
--   SELECT * FROM public.admins;
--
-- Policy aktif:
--   SELECT policyname, cmd, roles::text, qual::text
--     FROM pg_policies WHERE tablename = 'bookings';
