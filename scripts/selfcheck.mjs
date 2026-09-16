// Verifikasi perilaku modul ASLI (lib/rate-limit.ts), bukan reimplementasi.
// TypeScript di-strip minimal lalu dieval, supaya tidak perlu menambah
// dependency transpiler ke proyek.
//
// Jalankan: node scripts/selfcheck.mjs
import { readFileSync } from 'node:fs';

let src = readFileSync('lib/rate-limit.ts', 'utf8');
src = src.replace(/^interface Bucket \{[\s\S]*?\n\}\n/m, '');
src = src.replace(/^export interface RateLimitResult \{[\s\S]*?\n\}\n/m, '');
src = src.replace(/: RateLimitResult/g, '').replace(/: Bucket/g, '');
src = src.replace(/: string/g, '').replace(/: number/g, '').replace(/: boolean/g, '');
src = src.replace(/: Request/g, '').replace(/: string \| undefined/g, '');
src = src.replace(/ as const/g, '').replace(/<string, Bucket>/g, '');
src = src.replace(/^export /gm, '');
src += '\nglobalThis.__rl = { checkRateLimit, clientIp, BOOKING_RATE, UPLOAD_RATE, LOGIN_RATE };\n';
new Function(src)();
const { checkRateLimit, clientIp, BOOKING_RATE, UPLOAD_RATE, LOGIN_RATE } = globalThis.__rl;

let pass = 0;
let fail = 0;
const t = (name, fn) => {
  try {
    fn();
    console.log('  ✔', name);
    pass++;
  } catch (e) {
    console.log('  ✖', name, '→', e.message);
    fail++;
  }
};
const eq = (a, b, m) => {
  if (a !== b) throw new Error(`${m ? m + ': ' : ''}harus ${b}, dapat ${a}`);
};

console.log('\nlib/rate-limit.ts — verifikasi modul asli\n');

t('konfigurasi booking = 5 request / 10 menit', () => {
  eq(BOOKING_RATE.limit, 5);
  eq(BOOKING_RATE.windowMs, 600000);
});

t('konfigurasi upload = 20 request / 10 menit', () => {
  eq(UPLOAD_RATE.limit, 20);
});

t('konfigurasi login = 10 request / 10 menit', () => {
  eq(LOGIN_RATE.limit, 10);
});

t('5 request pertama lolos, ke-6 ditolak', () => {
  const key = 'booking:203.0.113.7:' + Date.now();
  for (let i = 0; i < 5; i++) {
    eq(checkRateLimit(key, 5, 600000).ok, true, `request #${i + 1}`);
  }
  eq(checkRateLimit(key, 5, 600000).ok, false, 'request #6');
});

t('ditolak dengan Retry-After minimal 1 detik', () => {
  const key = 'booking:203.0.113.8:' + Date.now();
  for (let i = 0; i < 5; i++) checkRateLimit(key, 5, 600000);
  const r = checkRateLimit(key, 5, 600000);
  if (r.retryAfterSec < 1) throw new Error(`retryAfterSec = ${r.retryAfterSec}`);
});

t('IP berbeda tidak saling memblokir', () => {
  const base = Date.now();
  const a = 'booking:A' + base;
  const b = 'booking:B' + base;
  for (let i = 0; i < 5; i++) checkRateLimit(a, 5, 600000);
  eq(checkRateLimit(a, 5, 600000).ok, false, 'A diblokir');
  eq(checkRateLimit(b, 5, 600000).ok, true, 'B tetap lolos');
});

t('clientIp mengambil elemen pertama x-forwarded-for', () => {
  const req = new Request('https://x.test', {
    headers: { 'x-forwarded-for': '203.0.113.9, 10.0.0.1, 172.16.0.1' },
  });
  eq(clientIp(req), '203.0.113.9');
});

t('clientIp fallback ke x-real-ip', () => {
  const req = new Request('https://x.test', {
    headers: { 'x-real-ip': '198.51.100.4' },
  });
  eq(clientIp(req), '198.51.100.4');
});

t('clientIp tidak crash saat header kosong', () => {
  eq(clientIp(new Request('https://x.test')), 'unknown');
});

console.log(`\n${pass} pass, ${fail} fail\n`);
process.exit(fail ? 1 : 0);
