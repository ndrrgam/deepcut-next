'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import BookingForm from '@/components/BookingForm';

/* ================================================================
   DATA
   ================================================================ */

const SERVICES = [
  { name: 'Haircut Reguler', price: '60.000' },
  { name: 'Fade / UnderCut', price: '75.000' },
  { name: 'Haircut + Beard', price: '100.000' },
  { name: 'Razor Shave (Hot Towel)', price: '65.000' },
  { name: 'Beard Trim / Grooming', price: '45.000' },
  { name: 'Kids Cut (≤ 10 th)', price: '50.000' },
  { name: 'Creambath / Treatment', price: '85.000' },
  { name: 'Hair Coloring', price: '250.000' },
];

const MARQUEE_ITEMS = [
  'Fade Presisi',
  'Beard Grooming',
  'Hot Towel Shave',
  'Hair Coloring',
  'Kids Cut',
  'Creambath',
];

/* ================================================================
   COMPONENTS
   ================================================================ */

function ScissorsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-[17px] h-[17px] text-copper/70 flex-shrink-0">
      <circle cx="6" cy="6" r="3" />
      <circle cx="6" cy="18" r="3" />
      <line x1="20" y1="4" x2="8.12" y2="15.88" />
      <line x1="14.47" y1="14.48" x2="20" y2="20" />
      <line x1="8.12" y1="8.12" x2="12" y2="12" />
    </svg>
  );
}

/* ---------- HEADER ---------- */
function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const linkClass =
    'text-body text-xs tracking-[0.14em] uppercase font-medium hover:text-ink transition-colors relative after:absolute after:left-0 after:right-0 after:-bottom-1 after:h-px after:bg-accent after:scale-x-0 after:origin-right hover:after:scale-x-100 hover:after:origin-left after:transition-transform after:duration-300';

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 border-b border-line transition-all duration-300 ${
        scrolled ? 'bg-surface/97 shadow-[0_8px_30px_rgba(0,0,0,0.45)]' : 'bg-surface/86 backdrop-blur-xl'
      }`}
    >
      <div className="mx-auto flex h-[68px] max-w-[1120px] items-center justify-between px-[4%]">
        <a href="#" className="flex items-center gap-2.5">
          <Image src="/deepcut-logo.webp" alt="DEEP CUT" width={34} height={34} className="h-[34px] w-auto mix-blend-screen" priority />
          <span className="font-display text-[1.45rem] tracking-[0.08em] italic font-bold">DEEP CUT</span>
        </a>

        <nav className="hidden md:flex items-center gap-9">
          <a href="#layanan" className={linkClass}>Layanan</a>
          <a href="#tentang" className={linkClass}>Tentang</a>
          <a href="#booking" className={linkClass}>Booking</a>
          <a href="#galeri" className={linkClass}>Galeri</a>
          <a href="#lokasi" className={linkClass}>Lokasi</a>
        </nav>

        <a
          href="https://wa.me/6287741445773?text=Halo%20DEEP%20CUT%2C%20mau%20booking"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden md:inline-flex items-center gap-2 bg-accent text-white text-xs font-semibold tracking-[0.12em] uppercase px-5 py-2.5 rounded hover:bg-[#FF6A1F] transition-colors"
        >
          Book via WA
        </a>

        <button
          className="md:hidden w-[42px] h-[42px] flex items-center justify-center border border-line rounded text-ink text-lg"
          onClick={() => setOpen(!open)}
          aria-label="Menu"
          aria-expanded={open}
        >
          {open ? '✕' : '☰'}
        </button>
      </div>

      {open && (
        <nav className="md:hidden border-t border-line px-[4%] py-3 flex flex-col gap-1">
          <a href="#layanan" className="py-3 text-sm tracking-[0.14em] uppercase text-body" onClick={() => setOpen(false)}>Layanan</a>
          <a href="#tentang" className="py-3 text-sm tracking-[0.14em] uppercase text-body" onClick={() => setOpen(false)}>Tentang</a>
          <a href="#booking" className="py-3 text-sm tracking-[0.14em] uppercase text-body" onClick={() => setOpen(false)}>Booking</a>
          <a href="#galeri" className="py-3 text-sm tracking-[0.14em] uppercase text-body" onClick={() => setOpen(false)}>Galeri</a>
          <a href="#lokasi" className="py-3 text-sm tracking-[0.14em] uppercase text-body" onClick={() => setOpen(false)}>Lokasi</a>
          <a href="https://wa.me/6287741445773" target="_blank" rel="noopener noreferrer" className="pt-4 pb-2 text-sm font-semibold tracking-[0.12em] uppercase text-accent" onClick={() => setOpen(false)}>
            Book via WhatsApp
          </a>
        </nav>
      )}
    </header>
  );
}

/* ---------- HERO ---------- */
function Hero() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* background glow */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute inset-0 bg-[radial-gradient(52%_42%_at_50%_18%,rgba(254,82,0,0.14),transparent_70%)] animate-[heroglow_9s_ease-in-out_infinite_alternate]" />
        <div className="absolute inset-0 bg-[radial-gradient(38%_30%_at_82%_70%,rgba(160,117,99,0.07),transparent_70%)]" />
      </div>

      <div className="mx-auto max-w-[1400px] w-full px-[4%] pt-[68px] grid lg:grid-cols-[1.2fr_1fr] items-center relative z-10">
        {/* text panel */}
        <div className="pt-20 lg:pt-0 pb-16 lg:pb-0">
          <div className="hero-rise flex items-center gap-3.5 mb-5 text-copper text-xs font-semibold tracking-kicker uppercase" style={{ '--rise-delay': '0.08s' } as React.CSSProperties}>
            <span className="w-10 h-px bg-copper" aria-hidden="true" />
            Barber Shop — Pati, Jateng
          </div>

          <h1 className="font-display italic font-extrabold leading-[0.88] tracking-tight uppercase text-[clamp(2.8rem,11vw,9rem)]">
            <span className="hero-title-line block" style={{ '--line-delay': '0.18s' } as React.CSSProperties}>
              <span className="block">Bukan Sekadar</span>
            </span>
            <span className="hero-title-line block" style={{ '--line-delay': '0.32s' } as React.CSSProperties}>
              <span className="block text-accent">Potong Rambut</span>
            </span>
          </h1>

          <p className="hero-rise mt-7 max-w-[46ch] text-body text-base sm:text-lg leading-relaxed" style={{ '--rise-delay': '0.48s' } as React.CSSProperties}>
            Ini soal presisi, detail, dan vibe yang bikin lo balik lagi. Bukan janji — <strong className="text-ink font-semibold">hasil</strong>.
          </p>

          <div className="hero-rise flex flex-col sm:flex-row sm:flex-wrap gap-3.5 mt-8" style={{ '--rise-delay': '0.62s' } as React.CSSProperties}>
            <a
              href="#booking"
              className="inline-flex items-center justify-center w-full sm:w-auto gap-2 bg-accent text-white text-xs font-semibold tracking-[0.12em] uppercase px-6 py-3.5 rounded hover:bg-[#FF6A1F] transition-colors group"
            >
              Booking Sekarang
              <span className="inline-block group-hover:translate-x-1 transition-transform">→</span>
            </a>
            <a href="#galeri" className="inline-flex items-center justify-center w-full sm:w-auto gap-2 border border-white/20 text-ink text-xs font-semibold tracking-[0.12em] uppercase px-6 py-3.5 rounded hover:border-white/60 hover:bg-white/[0.04] transition-all">
              Hasil Kerja Kami
            </a>
          </div>

          {/* meta row */}
          <div className="hero-rise flex flex-wrap gap-x-8 sm:gap-x-12 gap-y-3 mt-14 pt-5 border-t border-line text-sm" style={{ '--rise-delay': '0.76s' } as React.CSSProperties}>
            <div className="flex flex-col gap-0.5">
              <span className="text-[0.7rem] tracking-[0.22em] uppercase text-muted">Jam Buka</span>
              <span className="text-ink font-medium">10.00 – 21.00 WIB</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[0.7rem] tracking-[0.22em] uppercase text-muted">Instagram</span>
              <span className="text-ink font-medium">@deepcut.id</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[0.7rem] tracking-[0.22em] uppercase text-muted">Status</span>
              <span className="text-ink font-medium">Walk-in &amp; Booking</span>
            </div>
          </div>
        </div>

        {/* photo panel — blade-cut diagonal */}
        <div className="relative hidden lg:block min-h-[720px]">
          <div className="absolute inset-0 clip-blade overflow-hidden">
            <Image
              src="/hero-barber.webp"
              alt="Barber DEEP CUT mengerjakan fade presisi dengan clipper di depan cermin"
              fill
              className="object-cover"
              priority
              sizes="(max-width: 1400px) 50vw, 640px"
            />
            {/* dark gradient + vignette to blend into the black canvas */}
            <div className="absolute inset-0 bg-gradient-to-l from-transparent via-transparent to-surface/85" />
            <div className="absolute inset-0 bg-gradient-to-t from-surface/90 via-transparent to-transparent" />
            <div className="absolute inset-0 shadow-[inset_0_0_120px_rgba(0,0,0,0.72)]" />
          </div>
          {/* blade-cut accent line */}
          <div className="absolute inset-0 clip-blade-line bg-accent/90" aria-hidden="true" />
        </div>
      </div>
    </section>
  );
}

/* ---------- SOCIAL PROOF BAR ---------- */
function SocialProof() {
  const stats = [
    { value: '2', label: 'Cabang di Pati' },
    { value: '4.9★', label: 'Rating Google Maps' },
    { value: '2022', label: 'Berdiri Sejak' },
  ];
  return (
    <div className="border-y border-line bg-surface-secondary">
      <div className="mx-auto max-w-[1120px] px-[4%] flex flex-wrap justify-center md:justify-between gap-8 py-6">
        {stats.map((s) => (
          <div key={s.label} className="flex items-center gap-4">
            <span className="font-display text-3xl lg:text-4xl italic font-bold text-accent">{s.value}</span>
            <span className="text-xs tracking-[0.16em] uppercase text-muted max-w-[14ch]">{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- MARQUEE ---------- */
function Marquee() {
  const group = (
    <div className="flex items-center gap-[46px] pr-[46px]">
      {MARQUEE_ITEMS.map((item) => (
        <span key={item} className="flex items-center gap-[46px]">
          <span className="font-display text-[1.55rem] tracking-[0.12em] uppercase text-muted whitespace-nowrap italic">{item}</span>
          <ScissorsIcon />
        </span>
      ))}
    </div>
  );
  return (
    <div className="overflow-hidden border-b border-line bg-surface-secondary py-4" aria-hidden="true">
      <div className="marquee-track flex w-max">
        {group}
        {group}
      </div>
    </div>
  );
}

/* ---------- SERVICES ---------- */
function Services() {
  return (
    <section id="layanan" className="py-28 border-b border-line bg-surface-secondary">
      <div className="mx-auto max-w-[1120px] px-[4%]">
        <div className="reveal-hidden max-w-[640px] mb-16">
          <span className="text-[0.78rem] font-semibold tracking-[0.3em] uppercase text-accent mb-3 block">Layanan</span>
          <h2 className="font-display font-bold italic text-[clamp(2.4rem,5.5vw,4rem)] leading-none uppercase tracking-tight">
            Menu &amp; Harga
          </h2>
          <p className="mt-4 text-body">Potong sesuai karakter. Harga all-in, tanpa basa-basi.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-x-20 gap-y-0">
          {[0, 1].map((col) => (
            <div key={col}>
              {SERVICES.filter((_, i) => i % 2 === col).map((s) => (
                <div key={s.name} className="reveal-hidden flex items-baseline justify-between gap-5 py-[19px] border-b border-line" style={{ '--d': `${0.04 + SERVICES.indexOf(s) * 0.08}s` } as React.CSSProperties}>
                  <span className="text-[1.02rem] font-medium">{s.name}</span>
                  <span className="flex-1 border-b border-dotted border-white/15 translate-y-[-4px]" aria-hidden="true" />
                  <span className="font-display text-[1.35rem] tracking-[0.04em] text-accent font-bold italic flex-shrink-0">
                    Rp {s.price}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- WHY DEEP CUT ---------- */
function Why() {
  const points = [
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
  ];
  return (
    <section id="tentang" className="py-28">
      <div className="mx-auto max-w-[1120px] px-[4%]">
        <div className="reveal-hidden max-w-[640px] mb-16">
          <span className="text-[0.78rem] font-semibold tracking-[0.3em] uppercase text-accent mb-3 block">Kenapa DEEP CUT</span>
          <h2 className="font-display font-bold italic text-[clamp(2.4rem,5.5vw,4rem)] leading-none uppercase tracking-tight">
            Standar, Bukan Sekadar Gaya
          </h2>
        </div>

        <div>
          {points.map((p, i) => (
            <div
              key={p.num}
              className={`reveal-hidden grid grid-cols-[56px_1fr] md:grid-cols-[90px_1fr] gap-6 md:gap-10 items-start py-10 border-line ${i === 0 ? 'border-y' : 'border-b'}`}
            >
              <span className="why-number">{p.num}</span>
              <div>
                <h3 className="font-display font-bold italic text-[1.7rem] tracking-[0.04em] uppercase mb-2">{p.title}</h3>
                <p className="text-body max-w-[58ch]">{p.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- GALLERY ---------- */
function Gallery() {
  const altTexts = [
    'Fade presisi low-taper — hasil potongan DEEP CUT',
    'Beard line-up rapi — grooming DEEP CUT',
    'Hot towel razor shave — servis unggulan DEEP CUT',
    'Side profile fade — detail transisi blade DEEP CUT',
  ];
  return (
    <section id="galeri" className="py-28 border-y border-line bg-surface-secondary">
      <div className="mx-auto max-w-[1120px] px-[4%]">
        <div className="reveal-hidden max-w-[640px] mb-14">
          <span className="text-[0.78rem] font-semibold tracking-[0.3em] uppercase text-accent mb-3 block">Galeri</span>
          <h2 className="font-display font-bold italic text-[clamp(2.4rem,5.5vw,4rem)] leading-none uppercase tracking-tight">
            Hasil Kerja
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
          {altTexts.map((alt, i) => (
            <div
              key={i}
              className="reveal-hidden aspect-[4/5] rounded-md border border-line bg-surface-tertiary flex flex-col items-center justify-center gap-2.5 text-center p-5 hover:-translate-y-1.5 hover:border-accent/40 transition-all duration-300 group"
            >
              <ScissorsIcon />
              <span className="text-[0.72rem] tracking-[0.2em] uppercase text-copper/60 group-hover:text-accent/80 transition-colors">{alt}</span>
            </div>
          ))}
        </div>

        <div className="reveal-hidden mt-9 text-center">
          <p className="text-body text-sm mb-4">Lebih banyak hasil potongan ada di feed Instagram kami.</p>
          <a
            href="https://www.instagram.com/deepcut.id/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 border border-white/20 text-ink text-xs font-semibold tracking-[0.12em] uppercase px-6 py-3 rounded hover:border-white/60 transition-all"
          >
            Follow @deepcut.id ↗
          </a>
        </div>
      </div>
    </section>
  );
}

/* ---------- LOCATION ---------- */
function Location() {
  return (
    <section id="lokasi" className="py-28 border-t border-line bg-surface-secondary">
      <div className="mx-auto max-w-[1120px] px-[4%]">
        <div className="reveal-hidden max-w-[640px] mb-14">
          <span className="text-[0.78rem] font-semibold tracking-[0.3em] uppercase text-accent mb-3 block">Kunjungi</span>
          <h2 className="font-display font-bold italic text-[clamp(2.4rem,5.5vw,4rem)] leading-none uppercase tracking-tight">
            Lokasi &amp; Jam
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-16">
          <div className="reveal-hidden">
            <h3 className="font-display font-bold italic text-[1.35rem] tracking-[0.08em] uppercase text-copper mb-4">Jam Buka</h3>
            <ul className="space-y-0">
              {[
                ['Senin – Minggu', '10.00 – 21.00 WIB'],
                ['Hari Libur Nasional', 'Konfirmasi via WA'],
              ].map(([day, time]) => (
                <li key={day} className="flex justify-between gap-6 py-3 border-b border-line text-body text-sm">
                  <span>{day}</span>
                  <span className="text-ink">{time}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="reveal-hidden">
            <h3 className="font-display font-bold italic text-[1.35rem] tracking-[0.08em] uppercase text-copper mb-4">Alamat</h3>
            <p className="text-body">
              <strong className="text-ink font-semibold">Cabang Penjawi</strong>
              <br />
              Penjawi No. 49A, Pati, Jawa Tengah
            </p>
            <p className="text-body mt-4">
              <strong className="text-ink font-semibold">Cabang Jiwonolo</strong>
              <br />
              Jiwonolo, Pati, Jawa Tengah
            </p>

            <div className="flex flex-col items-start gap-3 mt-8">
              <a
                href="https://wa.me/6287741445773?text=Halo%20DEEP%20CUT%2C%20mau%20booking"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-accent text-white text-xs font-semibold tracking-[0.12em] uppercase px-5 py-2.5 rounded hover:bg-[#FF6A1F] transition-colors"
              >
                WhatsApp Booking
              </a>
              <a
                href="https://www.instagram.com/deepcut.id/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 text-[0.95rem] font-semibold text-ink border-b border-copper pb-1 hover:text-accent transition-colors"
              >
                Instagram @deepcut.id ↗
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- BOOKING ---------- */
function Booking() {
  return (
    <section id="booking" className="py-28 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(254,82,0,0.08),transparent_60%)]" aria-hidden="true" />
      <div className="mx-auto max-w-[1120px] px-[4%] relative z-10">
        <div className="reveal-hidden max-w-[640px] mb-14">
          <span className="text-[0.78rem] font-semibold tracking-[0.3em] uppercase text-accent mb-3 block">Reservasi</span>
          <h2 className="font-display font-bold italic text-[clamp(2.4rem,5.5vw,4rem)] leading-none uppercase tracking-tight">
            Booking Slot
          </h2>
          <p className="mt-4 text-body">
            Pilih cabang, tanggal, dan jam — booking langsung terkonfirmasi.
          </p>
        </div>

        <div className="grid lg:grid-cols-[1fr_1.35fr] gap-10 items-start">
          {/* Info panel */}
          <div className="reveal-hidden lg:sticky lg:top-28">
            <div className="space-y-0">
              {[
                ['Jam Operasional', '10.00 – 20.00 WIB'],
                ['Interval Slot', '30 menit'],
                ['Booking Terakhir', 'Min. 1 jam sebelum'],
                ['Tukang Cukur', '2 orang per cabang'],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between gap-6 py-3.5 border-b border-line">
                  <span className="text-[0.7rem] tracking-[0.18em] uppercase text-muted">{label}</span>
                  <span className="text-sm text-ink text-right">{value}</span>
                </div>
              ))}
            </div>
            <p className="mt-6 text-body text-sm">
              Booking langsung terkonfirmasi. Setiap slot bisa dipesan maksimal 2 orang
              secara bersamaan.
            </p>
          </div>

          {/* Form */}
          <div className="reveal-hidden">
            <BookingForm />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- FINAL CTA ---------- */
function FinalCTA() {
  return (
    <section className="py-32 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,rgba(254,82,0,0.12),transparent_65%)]" aria-hidden="true" />
      <div className="mx-auto max-w-[720px] px-[4%] text-center relative z-10">
        <h2 className="font-display font-extrabold italic text-[clamp(2.6rem,7vw,5rem)] leading-[0.92] uppercase tracking-tight">
          Siap Dapetin Potongan Terbaik Lo?
        </h2>
        <p className="mt-5 text-body max-w-[50ch] mx-auto">
          Booking sekarang, duduk santai, dan keluar dengan gaya yang lo percaya diri pakai. Cukup satu klik.
        </p>
        <a
          href="https://wa.me/6287741445773?text=Halo%20DEEP%20CUT%2C%20mau%20booking"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 mt-9 bg-accent text-white text-sm font-semibold tracking-[0.12em] uppercase px-8 py-4 rounded hover:bg-[#FF6A1F] transition-colors group"
        >
          Booking via WhatsApp Sekarang
          <span className="inline-block group-hover:translate-x-1 transition-transform">→</span>
        </a>
      </div>
    </section>
  );
}

/* ---------- FOOTER ---------- */
function Footer() {
  return (
    <footer className="border-t border-line py-11">
      <div className="mx-auto max-w-[1120px] px-[4%] flex flex-wrap items-center justify-between gap-6">
        <div className="flex items-center gap-2.5">
          <Image src="/deepcut-logo.webp" alt="DEEP CUT" width={30} height={30} className="h-[30px] w-auto mix-blend-screen" />
          <span className="font-display text-[1.3rem] tracking-[0.08em] italic font-bold">DEEP CUT</span>
        </div>
        <p className="text-muted text-sm">
          © 2026 DEEP CUT Barber Shop ·{' '}
          <a href="https://www.instagram.com/deepcut.id/" target="_blank" rel="noopener noreferrer" className="text-body border-b border-line hover:text-ink transition-colors">
            @deepcut.id
          </a>
        </p>
      </div>
    </footer>
  );
}

/* ================================================================
   SCROLL REVEAL HOOK
   ================================================================ */
function useScrollReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('.reveal-hidden');
    if (els.length === 0) return;
    const revealAll = () => els.forEach((el) => el.classList.add('reveal-shown'));
    if (!('IntersectionObserver' in window)) {
      revealAll();
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('reveal-shown');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    els.forEach((el) => io.observe(el));
    // Safety net: never leave content hidden (SEO, slow JS, full-page captures)
    const t = setTimeout(revealAll, 2500);
    return () => {
      io.disconnect();
      clearTimeout(t);
    };
  }, []);
}

/* ================================================================
   PAGE
   ================================================================ */
export default function Home() {
  useScrollReveal();

  return (
    <>
      <Header />
      <main>
        <Hero />
        <SocialProof />
        <Marquee />
        <Services />
        <Why />
        <Gallery />
        <Booking />
        <Location />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}
