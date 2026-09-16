/** @type {import('next').NextConfig} */

// Hostname Supabase diambil dari env supaya pindah project tidak membuat
// gambar galeri gagal render diam-diam.
//
// CATATAN: project ref TIDAK lagi di-hardcode. Dulu ada
// `hostname: 'qdgmxtnqppfrijlvtbhf.supabase.co'` sebagai fallback statis —
// itu membocorkan project ref ke bundle publik dan tetap salah setelah
// project pindah. Kalau env belum diisi, remotePatterns kosong dan
// next/image akan menolak URL eksternal dengan pesan yang jelas.
const supabaseHost = (() => {
  try {
    const raw = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!raw || raw.includes('YOUR-PROJECT') || raw === '[SENSITIVE]') return null;
    return new URL(raw).hostname;
  } catch {
    return null;
  }
})();

/** @type {NonNullable<import('next').NextConfig['images']>['remotePatterns']} */
const remotePatterns = [];

if (supabaseHost) {
  remotePatterns.push({
    protocol: 'https',
    hostname: supabaseHost,
    pathname: '/storage/v1/object/public/**',
  });
}

/**
 * Header keamanan dasar.
 *
 * - HSTS            : paksa HTTPS (Vercel sudah HTTPS, ini menutup downgrade).
 * - X-Frame-Options : cegah clickjacking pada dashboard admin.
 * - nosniff         : cegah browser menebak MIME type dari isi file.
 * - Referrer-Policy : jangan bocorkan URL admin ke situs luar.
 * - Permissions-Policy: matikan API browser yang tidak dipakai.
 *
 * CSP sengaja BELUM diaktifkan — halaman ini memakai inline style/script
 * Tailwind + Next dan CSP yang salah akan mematahkan admin dashboard.
 * Aktifkan setelah mengumpulkan laporan `Content-Security-Policy-Report-Only`.
 */
const securityHeaders = [
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  },
];

const nextConfig = {
  poweredByHeader: false,
  images: {
    formats: ['image/webp', 'image/avif'],
    remotePatterns,
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
      {
        // Area admin tidak boleh di-cache oleh proxy/CDN mana pun.
        source: '/admin/:path*',
        headers: [{ key: 'Cache-Control', value: 'no-store, must-revalidate' }],
      },
    ];
  },
};

module.exports = nextConfig;
