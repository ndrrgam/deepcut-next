/**
 * Rate limiter in-memory (sliding window).
 *
 * KENAPA: `POST /api/bookings` dan `POST /api/upload` sebelumnya tidak
 * punya batas sama sekali. Satu skrip bisa mengirim ribuan request dan
 * mengunci seluruh slot kalender.
 *
 * BATASAN YANG DISENGAJA (ponytail):
 *   State disimpan di memori proses. Di Vercel tiap lambda instance punya
 *   memorinya sendiri, jadi batas efektif = limit x jumlah instance aktif.
 *   Ini cukup untuk menghentikan skrip brute-force sederhana, TIDAK cukup
 *   untuk penyerang terdistribusi.
 *
 * Upgrade path kalau butuh akurat: ganti `buckets` dengan Redis/Upstash
 * (`INCR` + `EXPIRE`) atau lakukan throttling di Cloudflare WAF — API-nya
 * (`checkRateLimit`) tidak perlu berubah.
 */

interface Bucket {
  /** Timestamp (ms) setiap request dalam window yang masih berlaku. */
  hits: number[];
}

const buckets = new Map<string, Bucket>();

/** Buang bucket yang sudah kosong supaya map tidak tumbuh tanpa batas. */
const SWEEP_INTERVAL_MS = 60_000;
let lastSweep = Date.now();

function sweep(now: number, windowMs: number) {
  if (now - lastSweep < SWEEP_INTERVAL_MS) return;
  lastSweep = now;
  for (const [key, bucket] of buckets) {
    bucket.hits = bucket.hits.filter((t) => now - t < windowMs);
    if (bucket.hits.length === 0) buckets.delete(key);
  }
}

export interface RateLimitResult {
  ok: boolean;
  /** Sisa jatah di window berjalan. */
  remaining: number;
  /** Detik sampai jatah terisi lagi — untuk header Retry-After. */
  retryAfterSec: number;
}

/**
 * Catat satu request untuk `key` dan laporkan apakah masih dalam jatah.
 *
 * @param key        Identifier unik, mis. `booking:203.0.113.7`.
 * @param limit      Maksimal request per window.
 * @param windowMs   Panjang window dalam milidetik.
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  sweep(now, windowMs);

  const bucket = buckets.get(key) ?? { hits: [] };
  bucket.hits = bucket.hits.filter((t) => now - t < windowMs);

  if (bucket.hits.length >= limit) {
    const oldest = bucket.hits[0];
    buckets.set(key, bucket);
    return {
      ok: false,
      remaining: 0,
      retryAfterSec: Math.max(1, Math.ceil((windowMs - (now - oldest)) / 1000)),
    };
  }

  bucket.hits.push(now);
  buckets.set(key, bucket);

  return {
    ok: true,
    remaining: limit - bucket.hits.length,
    retryAfterSec: 0,
  };
}

/**
 * Ambil IP klien dari header proxy.
 *
 * Di Vercel, `x-forwarded-for` diisi platform dan tidak bisa dipalsukan
 * dari luar. Elemen pertama = klien asli, sisanya proxy chain.
 */
export function clientIp(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) {
    const first = fwd.split(',')[0]?.trim();
    if (first) return first;
  }
  return req.headers.get('x-real-ip')?.trim() || 'unknown';
}

// ----------------------------------------------------------------
// Konfigurasi batas per endpoint
// ----------------------------------------------------------------

/** Booking customer: cukup longgar untuk manusia, terlalu ketat untuk skrip. */
export const BOOKING_RATE = { limit: 5, windowMs: 10 * 60_000 } as const;

/** Upload admin: operasi manual, tidak perlu sering. */
export const UPLOAD_RATE = { limit: 20, windowMs: 10 * 60_000 } as const;

/** Login admin: cegah credential stuffing. */
export const LOGIN_RATE = { limit: 10, windowMs: 10 * 60_000 } as const;
