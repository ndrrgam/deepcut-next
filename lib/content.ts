/**
 * Tipe & nilai default konten landing page DEEP CUT.
 * Konten ini bisa diedit dari Admin Panel (tab "Konten") dan disimpan
 * ke tabel `site_settings` di Supabase (key = 'landing').
 */

import { DEFAULT_WHATSAPP_NUMBER } from './contact';

export type Service = {
  name: string;
  price: string;
};

export type GalleryItem = {
  image_url: string;
  alt: string;
};

export type HeroContent = {
  title_line_1: string;
  title_line_2: string;
  subtitle: string;
  image_url: string;
  meta_jam_buka: string;
  meta_instagram: string;
  meta_status: string;
};

export type StatItem = {
  value: string;
  label: string;
};

export type WhyPoint = {
  num: string;
  title: string;
  body: string;
};

export type HourRow = {
  day: string;
  time: string;
};

export type BranchInfo = {
  nama: string;
  alamat: string;
};

export type CtaContent = {
  heading: string;
  subtitle: string;
};

export type ContactInfo = {
  wa_number: string;
  instagram_handle: string;
};

export type LandingContent = {
  hero: HeroContent;
  services: Service[];
  gallery: GalleryItem[];
  marquee: string[];
  stats: StatItem[];
  why: WhyPoint[];
  hours: HourRow[];
  branches: BranchInfo[];
  cta: CtaContent;
  contact: ContactInfo;
};

export const DEFAULT_CONTENT: LandingContent = {
  hero: {
    title_line_1: 'Bukan Sekadar',
    title_line_2: 'Potong Rambut',
    subtitle:
      'Ini soal presisi, detail, dan vibe yang bikin lo balik lagi. Bukan janji — hasil.',
    image_url: '/hero-barber.webp',
    meta_jam_buka: '10.00 – 21.00 WIB',
    meta_instagram: '@deepcut.id',
    meta_status: 'Walk-in & Booking',
  },
  services: [
    { name: 'Haircut Reguler', price: '35.000' },
    { name: 'Keramas + Styling', price: '20.000' },
    { name: 'Special Haircut', price: '40.000' },
    { name: 'Creambath / Treatment', price: '60.000' },
    // Rentang harga ditulis sebagai "awal ... akhir". Halaman menampilkan
    // otomatis sebagai "start from Rp <awal>" — lihat formatPrice().
    { name: 'Hair Coloring', price: '70.000 ... 250.000' },
    { name: 'Special Toning', price: '70.000 ... 250.000' },
    { name: 'Keratin', price: '200.000' },
    { name: 'Perming', price: '200.000' },
    { name: 'Shaving', price: '15.000' },
  ],
  gallery: [
    {
      image_url: '',
      alt: 'Fade presisi low-taper — hasil potongan DEEP CUT',
    },
    {
      image_url: '',
      alt: 'Beard line-up rapi — grooming DEEP CUT',
    },
    {
      image_url: '',
      alt: 'Hot towel razor shave — servis unggulan DEEP CUT',
    },
    {
      image_url: '',
      alt: 'Side profile fade — detail transisi blade DEEP CUT',
    },
  ],
  marquee: [
    'Fade Presisi',
    'Beard Grooming',
    'Hot Towel Shave',
    'Hair Coloring',
    'Kids Cut',
    'Creambath',
  ],
  stats: [
    { value: '2', label: 'Cabang di Pati' },
    { value: '4.9★', label: 'Rating Google Maps' },
    { value: '2022', label: 'Berdiri Sejak' },
  ],
  why: [
    {
      num: '01',
      title: 'Presisi di Setiap Garis',
      body: 'Fade lo diukur, bukan ditebak. Setiap transisi di blade — dari skin sampai bulk — dikerjain dengan mata detail yang sama.',
    },
    {
      num: '02',
      title: 'Alat & Produk Serius',
      body: 'Pisau selalu tajam, handuk panas bukan basa-basi, dan produk yang beneran rawat rambut lo — bukan cuma pajangan di rak.',
    },
    {
      num: '03',
      title: 'Bukan Sekadar Cukur',
      body: 'Ini ruang di mana lo duduk nyaman, ngobrol atau diem, dan keluar dengan kepala tegak. Bukan salon, bukan tempat nongkrong norak.',
    },
  ],
  hours: [
    { day: 'Senin – Minggu', time: '10.00 – 21.00 WIB' },
    { day: 'Hari Libur Nasional', time: 'Konfirmasi via WA' },
  ],
  branches: [
    { nama: 'Cabang Penjawi', alamat: 'Penjawi No. 49A, Pati, Jawa Tengah' },
    { nama: 'Cabang Jiwonolo', alamat: 'Jiwonolo, Pati, Jawa Tengah' },
  ],
  cta: {
    heading: 'Siap Dapetin Potongan Terbaik Lo?',
    subtitle:
      'Booking sekarang, duduk santai, dan keluar dengan gaya yang lo percaya diri pakai. Cukup satu klik.',
  },
  contact: {
    wa_number: DEFAULT_WHATSAPP_NUMBER,
    instagram_handle: 'deepcut.id',
  },
};
