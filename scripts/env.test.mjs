/**
 * Test untuk `lib/supabase/env.ts` — resolver env Supabase.
 *
 * Kenapa ini penting: kegagalan env adalah satu-satunya bug di project ini
 * yang pernah membuat SELURUH API balas 500, dan penyebabnya tidak kelihatan
 * dari luar (halo, log Vercel). Resolver ini yang menentukan apakah client
 * Supabase bisa dibentuk sama sekali, jadi perilakunya dikunci di sini.
 *
 * env.ts adalah TypeScript dengan hanya anotasi tipe sederhana, jadi
 * di-strip dulu seperti test lain di repo ini.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

let pass = 0;
let fail = 0;
function ok(name, cond, extra = '') {
  if (cond) {
    pass++;
    console.log(`  \u2714 ${name}`);
  } else {
    fail++;
    console.log(`  \u2716 ${name}${extra ? `\n      ${extra}` : ''}`);
  }
}

// --- Muat env.ts dengan anotasi tipe di-strip ---------------------------
//
// Type-only annotation stripper. Dijalankan berurutan: yang paling spesifik
// dulu, supaya `value: string` di dalam parameter list tidak keburu diubah
// oleh aturan generik.
const src = readFileSync(join(ROOT, 'lib/supabase/env.ts'), 'utf8')
  .replace(/\r\n/g, '\n')
  .replace(/^export function/gm, 'function')
  // hapus import (module ini tidak butuh)
  .replace(/^\s*import\b[^\n]*\n/gm, '')
  // anotasi parameter bergaya `(...candidates: (string | undefined)[])`
  .replace(/(\.\.\.\w+)\s*:\s*\([^)]*\)\[\]/g, '$1')
  .replace(/(\.\.\.\w+)\s*:\s*[^,)]+/g, '$1')
  // anotasi parameter `value: string | undefined`
  .replace(/(\w+)\s*\??\s*:\s*[A-Za-z_$][\w$.]*(\s*\|\s*[A-Za-z_$][\w$.]*)*/g, '$1')
  // anotasi return `): string {` dan `): value is string {`
  .replace(/\)\s*:\s*[A-Za-z_$][\w$.]*(\s+is\s+[A-Za-z_$][\w$.]*)?\s*\{/g, ') {')
  // sisa `as Foo`
  .replace(/\bas\s+[A-Za-z_$][\w$.]*(\[\])?/g, '')
  // anotasi return multi-baris: `): string | undefined {`
  .replace(/\)\s*:\s*[A-Za-z_$][\w$.]*(\s*\|\s*[A-Za-z_$][\w$.]*)*\s*\{/g, ') {');

const module = new Function(
  src + '\nreturn { supabaseUrl, supabaseAnonKey, supabaseServiceRoleKey };',
)();

// --- Env disimpan & dipulihkan -----------------------------------------
const KEYS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_SECRET_KEY',
];
const saved = Object.fromEntries(KEYS.map((k) => [k, process.env[k]]));
function reset(overrides = {}) {
  for (const k of KEYS) delete process.env[k];
  Object.assign(process.env, overrides);
}

const URL_OK = 'https://exampleproject.supabase.co';

console.log('\n=== supabaseUrl() ===');
reset({ NEXT_PUBLIC_SUPABASE_URL: URL_OK });
ok('url normal diterima', module.supabaseUrl() === URL_OK);

reset({ SUPABASE_URL: URL_OK });
ok('fallback ke SUPABASE_URL (tanpa prefix NEXT_PUBLIC_)', module.supabaseUrl() === URL_OK);

reset({ NEXT_PUBLIC_SUPABASE_URL: '', SUPABASE_URL: URL_OK });
ok('NEXT_PUBLIC_ kosong -> pakai SUPABASE_URL', module.supabaseUrl() === URL_OK);

reset({ NEXT_PUBLIC_SUPABASE_URL: '[SENSITIVE]', SUPABASE_URL: URL_OK });
ok('NEXT_PUBLIC_ ter-inline [SENSITIVE] -> pakai SUPABASE_URL', module.supabaseUrl() === URL_OK);

reset({});
ok('tanpa env sama sekali -> melempar', (() => {
  try { module.supabaseUrl(); return false; } catch { return true; }
})());

reset({ NEXT_PUBLIC_SUPABASE_URL: '[SENSITIVE]' });
const msg = (() => { try { module.supabaseUrl(); return ''; } catch (e) { return e.message; } })();
ok('pesan error menyebut penyebab "Secret"', /Secret/i.test(msg), msg);
ok('pesan error TIDAK memuat nilai mentah [SENSITIVE]',
   !msg.includes('[SENSITIVE]') || /Secret/i.test(msg), msg);
ok('pesan error menyebut nama variabel', msg.includes('NEXT_PUBLIC_SUPABASE_URL'), msg);

reset({ NEXT_PUBLIC_SUPABASE_URL: '   ' });
const msg2 = (() => { try { module.supabaseUrl(); return ''; } catch (e) { return e.message; } })();
ok('spasi saja dianggap kosong', /kosong/i.test(msg2), msg2);

console.log('\n=== supabaseAnonKey() ===');
const ANON = 'sb_publishable_abcdef';
reset({ NEXT_PUBLIC_SUPABASE_ANON_KEY: ANON });
ok('anon key diterima', module.supabaseAnonKey() === ANON);
reset({ NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: ANON });
ok('fallback ke PUBLISHABLE_KEY', module.supabaseAnonKey() === ANON);
reset({});
ok('tanpa env -> melempar', (() => {
  try { module.supabaseAnonKey(); return false; } catch { return true; }
})());

console.log('\n=== supabaseServiceRoleKey() ===');
const SRV = 'sb_secret_xyz';
reset({ SUPABASE_SERVICE_ROLE_KEY: SRV });
ok('service role key diterima', module.supabaseServiceRoleKey() === SRV);
reset({ SUPABASE_SECRET_KEY: SRV });
ok('fallback ke SUPABASE_SECRET_KEY (format sb_secret_*)',
   module.supabaseServiceRoleKey() === SRV);
reset({ SUPABASE_SERVICE_ROLE_KEY: 'YOUR_SERVICE_ROLE_KEY' });
ok('nilai template ditolak', (() => {
  try { module.supabaseServiceRoleKey(); return false; } catch { return true; }
})());

// pulihkan
for (const k of KEYS) {
  if (saved[k] === undefined) delete process.env[k];
  else process.env[k] = saved[k];
}

console.log(`\n${pass} lulus, ${fail} gagal`);
if (fail > 0) process.exit(1);
