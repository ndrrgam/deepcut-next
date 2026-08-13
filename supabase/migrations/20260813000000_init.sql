-- ================================================================
-- DEEP CUT Barbershop — Reservasi System
-- SQL Migration untuk Supabase (PostgreSQL)
-- Jalankan lewat Supabase SQL Editor (atau `supabase db push`)
-- ================================================================

-- ----------------------------------------------------------------
-- 1. ENUM untuk status booking
-- ----------------------------------------------------------------
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'booking_status') THEN
        CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'cancelled');
    END IF;
END$$;

-- ----------------------------------------------------------------
-- 2. Tabel: branches
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.branches (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    nama_cabang  text NOT NULL UNIQUE,
    created_at   timestamptz NOT NULL DEFAULT now()
);

-- Seed data cabang
INSERT INTO public.branches (nama_cabang)
VALUES
    ('Cabang Penjawi'),
    ('Cabang Jiwonolo')
ON CONFLICT (nama_cabang) DO NOTHING;

-- ----------------------------------------------------------------
-- 3. Tabel: bookings
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.bookings (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    nama         text NOT NULL,
    no_wa        text NOT NULL,
    branch_id    uuid NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
    tanggal      date NOT NULL,
    jam_mulai    time NOT NULL,
    jam_selesai  time NOT NULL,
    status       booking_status NOT NULL DEFAULT 'pending',
    created_at   timestamptz NOT NULL DEFAULT now(),

    -- Jam mulai harus sebelum jam selesai
    CONSTRAINT chk_jam_selesai_gt_mulai CHECK (jam_selesai > jam_mulai),

    -- Jam booking harus dalam rentang operasional 10.00–20.00 WIB
    -- (jam_selesai boleh tepat 20.00; slot terakhir 19.30–20.00)
    CONSTRAINT chk_jam_mulai_range CHECK (jam_mulai >= TIME '10:00' AND jam_mulai < TIME '20:00'),
    CONSTRAINT chk_jam_selesai_range CHECK (jam_selesai > TIME '10:00' AND jam_selesai <= TIME '20:00')
);

-- ----------------------------------------------------------------
-- 4. Unique constraint anti-bentrok (branch_id, tanggal, jam_mulai)
--    Dua booking tidak boleh share cabang + tanggal + jam mulai yang sama
-- ----------------------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS bookings_unique_slot_idx
    ON public.bookings (branch_id, tanggal, jam_mulai)
    WHERE status <> 'cancelled';

-- ----------------------------------------------------------------
-- 5. Row Level Security (RLS)
-- ----------------------------------------------------------------
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- 5a. branches: semua orang boleh baca (publik butuh daftar cabang)
DROP POLICY IF EXISTS "branches_read_public" ON public.branches;
CREATE POLICY "branches_read_public"
    ON public.branches FOR SELECT
    TO anon, authenticated
    USING (true);

-- 5b. bookings — Insert: publik boleh insert (booking dari customer)
DROP POLICY IF EXISTS "bookings_insert_public" ON public.bookings;
CREATE POLICY "bookings_insert_public"
    ON public.bookings FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- 5c. bookings — Select/Update/Delete: hanya authenticated (admin)
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

-- ----------------------------------------------------------------
-- 6. Helper: blokir slot manual (opsional)
--    Admin bisa insert booking dengan nama 'BLOCKED' / status khusus
--    agar slot tampak terisi. Disimpan sebagai booking dengan
--    nama = '-- BLOKIR --' dan status 'confirmed' oleh admin.
--    (Tidak perlu tabel terpisah.)
-- ----------------------------------------------------------------
COMMENT ON TABLE public.bookings IS
    'Bookings customer. Gunakan nama "-- BLOKIR --" untuk memblokir slot manual (admin).';
