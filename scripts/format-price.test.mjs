/**
 * Self-check formatPrice() — dijalankan terhadap fungsi ASLI dari app/page.tsx.
 * Tanpa framework, cukup `node --test`.
 *
 * Jalankan: node --test scripts/format-price.test.mjs
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// Ambil fungsi asli dari app/page.tsx supaya test tidak bisa drift dari kode.
let src = readFileSync('app/page.tsx', 'utf8').replace(/\r\n/g, '\n');
const start = src.indexOf('function formatPrice(');
if (start === -1) {
  throw new Error('formatPrice() tidak ditemukan di app/page.tsx — perbarui test ini.');
}
// Ambil dari awal fungsi sampai kurung kurawal penutup yang seimbang.
let depth = 0;
let end = start;
for (let i = src.indexOf('{', start); i < src.length; i++) {
  if (src[i] === '{') depth++;
  else if (src[i] === '}') {
    depth--;
    if (depth === 0) {
      end = i + 1;
      break;
    }
  }
}
const body = src.slice(start, end);
// Buang anotasi tipe TypeScript supaya bisa dieval sebagai JS murni.
const jsBody = body
  .replace(/:\s*string\b/g, '')
  .replace(/:\s*number\b/g, '')
  .replace(/:\s*boolean\b/g, '');
if (/:\s*\w+\s*[),=]/.test(jsBody)) {
  throw new Error('Stripper tipe tidak cocok dengan formatPrice() — perbarui test ini.');
}
const formatPrice = new Function(`${jsBody}; return formatPrice;`)();

test('harga tunggal diberi prefix Rp', () => {
  assert.equal(formatPrice('35.000'), 'Rp 35.000');
  assert.equal(formatPrice('60.000'), 'Rp 60.000');
  assert.equal(formatPrice('200.000'), 'Rp 200.000');
});

test('rentang dengan "..." jadi "start from Rp <awal>"', () => {
  assert.equal(formatPrice('70.000 ... 250.000'), 'start from Rp 70.000');
  assert.equal(formatPrice('200.000 ... 500.000'), 'start from Rp 200.000');
});

test('rentang tanpa spasi juga tertangani', () => {
  assert.equal(formatPrice('70.000...250.000'), 'start from Rp 70.000');
});

test('rentang dengan tanda hubung & s/d tertangani', () => {
  assert.equal(formatPrice('70.000 - 250.000'), 'start from Rp 70.000');
  assert.equal(formatPrice('70.000 – 250.000'), 'start from Rp 70.000');
  assert.equal(formatPrice('70.000 s/d 250.000'), 'start from Rp 70.000');
});

test('rentang dengan elipsis unicode tertangani', () => {
  assert.equal(formatPrice('70.000 … 250.000'), 'start from Rp 70.000');
});

test('nilai yang sudah ada "Rp"-nya tidak dobel', () => {
  assert.equal(formatPrice('Rp 50.000'), 'Rp 50.000');
  assert.equal(formatPrice('rp 50.000'), 'rp 50.000');
});

test('nilai yang sudah ada "start from" tidak dobel', () => {
  assert.equal(formatPrice('start from 70.000'), 'start from Rp 70.000');
  assert.equal(formatPrice('start from Rp 70.000'), 'start from Rp 70.000');
  assert.equal(formatPrice('Mulai 50.000'), 'start from Rp 50.000');
});

test('spasi berlebih dibersihkan', () => {
  assert.equal(formatPrice('   35.000   '), 'Rp 35.000');
});

test('nilai kosong tidak menghasilkan "Rp undefined"', () => {
  assert.equal(formatPrice(''), '');
  assert.equal(formatPrice(undefined), '');
  assert.equal(formatPrice(null), '');
});

test('data asli dari /api/content terformat benar semua', () => {
  // Bentuk persis yang dipakai produksi.
  const dariDB = [
    ['Haircut Reguler', '35.000', 'Rp 35.000'],
    ['Keramas + Styling', '20.000', 'Rp 20.000'],
    ['Special Haircut', '40.000', 'Rp 40.000'],
    ['Creambath / Treatment', '60.000', 'Rp 60.000'],
    ['Hair Coloring', '70.000 ... 250.000', 'start from Rp 70.000'],
    ['Special Toning', '70.000 ... 250.000', 'start from Rp 70.000'],
    ['Keratin', '200.000', 'Rp 200.000'],
    ['Perming', '200.000', 'Rp 200.000'],
    ['Shaving', '15.000', 'Rp 15.000'],
  ];
  for (const [name, raw, want] of dariDB) {
    assert.equal(formatPrice(raw), want, `${name}: "${raw}"`);
  }
});
