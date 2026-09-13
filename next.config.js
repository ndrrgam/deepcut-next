/** @type {import('next').NextConfig} */

// Hostname Supabase diambil dari env supaya pindah project tidak membuat
// gambar galeri gagal render diam-diam (sebelumnya di-hardcode).
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
const remotePatterns = [
  {
    protocol: 'https',
    hostname: 'qdgmxtnqppfrijlvtbhf.supabase.co',
    pathname: '/storage/v1/object/public/**',
  },
];

if (supabaseHost && !remotePatterns.some((p) => p.hostname === supabaseHost)) {
  remotePatterns.push({
    protocol: 'https',
    hostname: supabaseHost,
    pathname: '/storage/v1/object/public/**',
  });
}

const nextConfig = {
  images: {
    formats: ['image/webp', 'image/avif'],
    remotePatterns,
  },
};

module.exports = nextConfig;
