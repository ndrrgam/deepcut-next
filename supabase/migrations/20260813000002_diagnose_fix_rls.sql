-- ================================================================
-- DIAGNOSTIK + PERBAIKAN RLS (jalankan SEMUANYA di SQL Editor)
-- ================================================================

-- ---------- BAGIAN 1: Lihat kondisi sebenarnya ----------
SELECT '=== TABLES ===' AS info;
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND tablename IN ('branches', 'bookings');

SELECT '=== POLICIES (bookings) ===' AS info;
SELECT polname, polcmd, polroles::regtype[] AS roles, polqual::text, polwithcheck::text
FROM pg_policy
WHERE polrelid = 'public.bookings'::regclass;

SELECT '=== POLICIES (branches) ===' AS info;
SELECT polname, polcmd, polroles::regtype[] AS roles
FROM pg_policy
WHERE polrelid = 'public.branches'::regclass;

-- ---------- BAGIAN 2: Paksa perbaiki (idempotent) ----------
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- branches: publik boleh SELECT
DROP POLICY IF EXISTS "branches_read_public" ON public.branches;
CREATE POLICY "branches_read_public"
    ON public.branches FOR SELECT
    TO anon, authenticated
    USING (true);

-- bookings: publik boleh INSERT
DROP POLICY IF EXISTS "bookings_insert_public" ON public.bookings;
CREATE POLICY "bookings_insert_public"
    ON public.bookings FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- bookings: hanya authenticated boleh SELECT/UPDATE/DELETE
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

CREATE UNIQUE INDEX IF NOT EXISTS bookings_unique_slot_idx
    ON public.bookings (branch_id, tanggal, jam_mulai)
    WHERE status <> 'cancelled';

-- ---------- BAGIAN 3: Konfirmasi setelah perbaikan ----------
SELECT '=== POLICIES SETELAH FIX (bookings) ===' AS info;
SELECT polname, polcmd
FROM pg_policy
WHERE polrelid = 'public.bookings'::regclass
ORDER BY polname;
