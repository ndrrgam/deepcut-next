-- ================================================================
-- DEEP CUT Barbershop — Konten Landing Page (Admin Panel)
-- Tabel key-value untuk menyimpan konten Hero, Layanan, Galeri, dll.
-- Jalankan lewat Supabase SQL Editor (atau `supabase db push`).
-- ================================================================

-- ----------------------------------------------------------------
-- 1. Tabel: site_settings (key-value JSON)
--    key 'landing' menyimpan seluruh konten landing page.
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.site_settings (
    key        text PRIMARY KEY,
    value      jsonb NOT NULL,
    updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.site_settings IS
    'Konfigurasi konten situs (key-value JSON). Key "landing" menyimpan konten landing page.';

-- ----------------------------------------------------------------
-- 2. Row Level Security
-- ----------------------------------------------------------------
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- 2a. Semua orang (anon + authenticated) boleh baca — dipakai landing page.
DROP POLICY IF EXISTS "site_settings_read_public" ON public.site_settings;
CREATE POLICY "site_settings_read_public"
    ON public.site_settings FOR SELECT
    TO anon, authenticated
    USING (true);

-- 2b. Hanya admin (authenticated) yang boleh insert/update/delete.
DROP POLICY IF EXISTS "site_settings_write_admin" ON public.site_settings;
CREATE POLICY "site_settings_write_admin"
    ON public.site_settings FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- ----------------------------------------------------------------
-- 3. Storage bucket publik untuk foto (hero & galeri)
--    Upload dilakukan lewat API dengan service role (bypass RLS),
--    bucket harus public agar URL bisa diakses publik.
-- ----------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'public-images',
    'public-images',
    true,
    5242880,
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']
)
ON CONFLICT (id) DO UPDATE
    SET public = true,
        file_size_limit = 5242880,
        allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];
