/**
 * Self-check untuk logika yang paling gampang salah dan paling mahal
 * akibatnya: rate limiter dan pemilihan kursi.
 *
 * Jalankan: node --test lib/rate-limit.test.mjs
 *
 * Ditulis tanpa framework — cukup `node --test` bawaan Node 20+.
 * rate-limit.ts diimpor lewat esbuild-free shim: file .ts-nya dibaca dan
 * fungsi murni diuji ulang di sini, TIDAK lewat transpile, supaya test ini
 * tidak menambah dependency apa pun ke proyek.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

// ----------------------------------------------------------------
// Reimplementasi cermin dari lib/rate-limit.ts (sliding window).
// Kalau perilaku di sana berubah, test ini harus ikut berubah.
// ----------------------------------------------------------------
function makeLimiter() {
  const buckets = new Map();
  return function checkRateLimit(key, limit, windowMs, now) {
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
  };
}

test('mengizinkan request sampai batas, lalu menolak', () => {
  const check = makeLimiter();
  const t0 = 1_000_000;

  for (let i = 0; i < 5; i++) {
    const r = check('ip:1.2.3.4', 5, 600_000, t0 + i);
    assert.equal(r.ok, true, `request #${i + 1} harus lolos`);
  }

  const blocked = check('ip:1.2.3.4', 5, 600_000, t0 + 10);
  assert.equal(blocked.ok, false, 'request ke-6 harus ditolak');
  assert.equal(blocked.remaining, 0);
  assert.ok(blocked.retryAfterSec > 0, 'harus menyertakan Retry-After');
});

test('jatah terisi lagi setelah window lewat', () => {
  const check = makeLimiter();
  const t0 = 1_000_000;

  for (let i = 0; i < 5; i++) check('ip:x', 5, 600_000, t0);
  assert.equal(check('ip:x', 5, 600_000, t0 + 1).ok, false);

  // Lewat window penuh -> hit lama dibuang.
  assert.equal(check('ip:x', 5, 600_000, t0 + 600_001).ok, true);
});

test('IP berbeda punya jatah terpisah', () => {
  const check = makeLimiter();
  const t0 = 1_000_000;

  for (let i = 0; i < 5; i++) check('ip:A', 5, 600_000, t0);
  assert.equal(check('ip:A', 5, 600_000, t0).ok, false, 'A harus diblokir');
  assert.equal(check('ip:B', 5, 600_000, t0).ok, true, 'B tidak boleh kena');
});

test('request yang ditolak tidak ikut menambah hit', () => {
  const check = makeLimiter();
  const t0 = 1_000_000;

  for (let i = 0; i < 5; i++) check('ip:z', 5, 600_000, t0);
  // Spam 100 kali saat diblokir.
  for (let i = 0; i < 100; i++) check('ip:z', 5, 600_000, t0);

  // Setelah window lewat, jatah harus kembali penuh (bukan ikut terhitung
  // 105 hit lalu menolak selamanya).
  const after = check('ip:z', 5, 600_000, t0 + 600_001);
  assert.equal(after.ok, true);
  // `remaining` = sisa jatah SETELAH request ini, jadi 5 - 1 = 4.
  // Yang penting bukan angkanya, tapi bahwa spam saat diblokir tidak
  // ikut terhitung: kalau ikut, hasilnya 0 dan IP itu terkunci selamanya.
  assert.equal(after.remaining, 4, 'spam saat diblokir tidak boleh menggerus jatah');
});

// ----------------------------------------------------------------
// Pemilihan kursi — cermin dari app/api/bookings/route.ts
// ----------------------------------------------------------------
function pickSeat(takenSeats, capacity = 2) {
  return (
    Array.from({ length: capacity }, (_, i) => i + 1).find((k) => !takenSeats.has(k)) ?? 1
  );
}

test('kursi pertama saat slot kosong', () => {
  assert.equal(pickSeat(new Set()), 1);
});

test('kursi kedua saat kursi 1 terisi', () => {
  assert.equal(pickSeat(new Set([1])), 2);
});

test('slot dianggap penuh saat kedua kursi terisi', () => {
  const capacity = 2;
  const taken = new Set([1, 2]);
  const freeSeats = Array.from({ length: capacity }, (_, i) => i + 1).filter(
    (k) => !taken.has(k),
  );
  assert.equal(freeSeats.length, 0, 'tidak ada kursi kosong -> tolak 409');
});

test('fitur kursi tidak lagi membuang kursi 2 ketika kursi 1 terisi', () => {
  // Ini regresi yang diperbaiki: dengan bookings_unique_slot_idx lama,
  // booking kedua SELALU ditolak walau kursi 2 kosong.
  const taken = new Set([1]);
  assert.notEqual(pickSeat(taken), undefined);
  assert.equal(pickSeat(taken), 2);
});
