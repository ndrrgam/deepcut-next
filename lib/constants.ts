/**
 * Business rules & constants untuk sistem reservasi DEEP CUT.
 * Semua waktu dalam WIB (Asia/Jakarta).
 */

// Jam operasional (Senin–Minggu, tanpa hari libur)
export const OPEN_TIME = '10:00';
export const CLOSE_TIME = '20:00';

// Interval slot booking (menit)
export const SLOT_INTERVAL_MINUTES = 30;

// Minimal lead time: booking harus dibuat minimal 1 jam sebelum jam mulai.
export const MIN_LEAD_HOURS = 1;

// Kapasitas per slot: 2 tukang cukur per cabang bisa melayani 2 orang
// secara bersamaan pada slot yang sama.
export const SLOT_CAPACITY = 2;

export const BOOKING_STATUSES = ['pending', 'confirmed', 'cancelled'] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export const BRANCH_NAMES = ['Cabang Penjawi', 'Cabang Jiwonolo'] as const;

// Penanda booking manual untuk memblokir slot (admin)
export const BLOCKED_BOOKING_NAME = '-- BLOKIR --';
