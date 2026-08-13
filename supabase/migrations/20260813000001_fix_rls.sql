-- ============================================================
-- PERBAIKAN RLS — jalankan ini di Supabase SQL Editor
-- (jika tabel sudah ada tapi policy belum terpasang)
-- ============================================================

-- Pastikan RLS aktif (idempotent)
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- 1. branches: publik boleh SELECT (dropdown cabang)
DROP POLICY IF EXISTS "branches_read_public" ON public.branches;
CREATE POLICY "branches_read_public"
    ON public.branches FOR SELECT
    TO anon, authenticated
    USING (true);

-- 2. bookings — Insert: publik boleh insert (booking customer)
DROP POLICY IF EXISTS "bookings_insert_public" ON public.bookings;
CREATE POLICY "bookings_insert_public"
    ON public.bookings FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- 3. bookings — Select/Update/Delete: hanya authenticated (admin)
DROP POLICY IF EXISTS "bookings_read_admin" ON public.bookings;
CREATE POLICY "bookings_read_admin"
    ON public.bookings FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "bookings_update_admin" ON public.bookings;
CREATE POLICY "bookings_update_admin"
    ON public.bookings FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "bookings_delete_admin" ON public.bookings;
CREATE POLICY "bookings_delete_admin"
    ON public.bookings FOR DELETE
    TO authenticated
    USING (true);

-- 4. Pastikan unique index anti-bentrok ada
CREATE UNIQUE INDEX IF NOT EXISTS bookings_unique_slot_idx
    ON public.bookings (branch_id, tanggal, jam_mulai)
    WHERE status <> 'cancelled';
