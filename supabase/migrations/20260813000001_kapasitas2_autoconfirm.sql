-- ================================================================
-- DEEP CUT Barbershop — Kapasitas 2 kursi per slot + auto-confirm
-- (Hapus verifikasi WhatsApp; 2 tukang cukur per cabang)
-- Jalankan lewat Supabase SQL Editor (atau `supabase db push`)
-- ================================================================

-- 1. Hapus unique index anti-bentrok lama (hanya 1 booking per slot).
--    Diganti dengan index per-kursi di bawah supaya 2 booking bisa
--    berbagi slot yang sama (cabang + tanggal + jam mulai).
DROP INDEX IF EXISTS public.bookings_unique_slot_idx;

-- 2. no_wa opsional — tidak ada lagi verifikasi WhatsApp.
ALTER TABLE public.bookings ALTER COLUMN no_wa DROP NOT NULL;

-- 3. Kolom kursi: 1 atau 2 (2 tukang cukur per cabang).
ALTER TABLE public.bookings
    ADD COLUMN IF NOT EXISTS kursi smallint NOT NULL DEFAULT 1;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_kursi_range'
    ) THEN
        ALTER TABLE public.bookings
            ADD CONSTRAINT chk_kursi_range CHECK (kursi IN (1, 2));
    END IF;
END$$;

-- 4. Booking baru langsung 'confirmed' (tanpa verifikasi admin).
ALTER TABLE public.bookings ALTER COLUMN status SET DEFAULT 'confirmed';

-- 5. Unique index baru: maksimal 1 booking aktif per kursi per slot.
--    Ini memungkinkan 2 booking aktif pada slot yang sama (kursi 1 & 2),
--    dan tetap race-condition safe.
CREATE UNIQUE INDEX IF NOT EXISTS bookings_unique_seat_idx
    ON public.bookings (branch_id, tanggal, jam_mulai, kursi)
    WHERE status <> 'cancelled';
