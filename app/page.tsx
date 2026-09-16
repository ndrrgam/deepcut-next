'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import BookingForm from '@/components/BookingForm';
import {
  DEFAULT_CONTENT,
  type HeroContent,
  type Service,
  type GalleryItem,
  type StatItem,
  type WhyPoint,
  type HourRow,
  type BranchInfo,
  type CtaContent,
  type ContactInfo,
} from '@/lib/content';

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
function Header({ contact }: { contact: ContactInfo }) {
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
          href={`https://wa.me/${contact.wa_number}?text=Halo%20DEEP%20CUT%2C%20mau%20booking`}
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
          <a href={`https://wa.me/${contact.wa_number}`} target="_blank" rel="noopener noreferrer" className="pt-4 pb-2 text-sm font-semibold tracking-[0.12em] uppercase text-accent" onClick={() => setOpen(false)}>
            Book via WhatsApp
          </a>
        </nav>
      )}
    </header>
  );
}

/* ---------- HERO ---------- */
function Hero({ content }: { content: HeroContent }) {
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
              <span className="block">{content.title_line_1}</span>
            </span>
            <span className="hero-title-line block" style={{ '--line-delay': '0.32s' } as React.CSSProperties}>
              <span className="block text-accent">{content.title_line_2}</span>
            </span>
          </h1>

          <p className="hero-rise mt-7 max-w-[46ch] text-body text-base sm:text-lg leading-relaxed" style={{ '--rise-delay': '0.48s' } as React.CSSProperties}>
            {content.subtitle}
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
              <span className="text-ink font-medium">{content.meta_jam_buka}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[0.7rem] tracking-[0.22em] uppercase text-muted">Instagram</span>
              <span className="text-ink font-medium">{content.meta_instagram}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[0.7rem] tracking-[0.22em] uppercase text-muted">Status</span>
              <span className="text-ink font-medium">{content.meta_status}</span>
            </div>
          </div>
        </div>

        {/* photo panel — blade-cut diagonal */}
        <div className="relative hidden lg:block min-h-[720px]">
          <div className="absolute inset-0 clip-blade overflow-hidden">
            <Image
              src={content.image_url || '/hero-barber.webp'}
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
function SocialProof({ stats }: { stats: StatItem[] }) {
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
function Marquee({ items }: { items: string[] }) {
  const group = (
    <div className="flex items-center gap-[46px] pr-[46px]">
      {items.map((item) => (
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

/**
 * Format harga untuk ditampilkan.
 *
 * Data di database menyimpan rentang harga sebagai dua titik dengan
 * awalan "start from" di dalam kolom price, mis. "70.000 ... 250.000"
 * untuk Special Toning. Kalau nilai itu dicetak apa adanya setelah "Rp",
 * hasilnya salah: "Rp 70.000 ... 250.000".
 *
 * Fungsi ini menormalkan semuanya ke bentuk yang benar:
 *   "70.000 ... 250.000"  ->  "start from Rp 70.000"   (hanya harga awal)
 *   "60.000"              ->  "Rp 60.000"
 *
 * Ditulis toleran terhadap beberapa cara penulisan rentang ("...", "…",
 * "-", "–", "s/d"), supaya edit di admin panel tidak diam-diam merusak
 * tampilan. Kata "start from" ditambahkan OTOMATIS, jadi admin cukup
 * mengetik angkanya saja.
 */
function formatPrice(raw: string): string {
  const value = (raw ?? '').trim();
  if (!value) return '';

  // Rentang harga: "70.000 ... 250.000", "70.000 - 250.000", "70.000 s/d 250.000"
  //
  // Catatan regex: `[\d.,]+` bersifat greedy, jadi untuk "70.000...250.000"
  // (tanpa spasi) ia ikut menelan titik-titik pemisahnya. Karena itu angka
  // diakhiri `[\d.,]*\d` — titik/desimal di ujung tidak ikut terserap, dan
  // pemisah `\.{2,}` tetap punya sisa yang bisa dikenali.
  const range = value.match(/^([\d.,]*\d)\s*(?:\.{2,}|…|s\/d|[-–—])\s*([\d.,]*\d)/i);
  if (range) return `start from Rp ${range[1]}`;

  // Nilai sudah dalam bentuk siap tampil (mis. diketik manual "Mulai 50.000"
  // atau sudah mengandung "Rp" sendiri) — jangan ditambahi lagi.
  if (/^rp\b/i.test(value)) return value;
  if (/^(start from|mulai|from)\b/i.test(value)) {
    const rest = value.replace(/^(start from|mulai|from)\s*/i, '');
    return /^rp\b/i.test(rest) ? `start from ${rest}` : `start from Rp ${rest}`;
  }

  return `Rp ${value}`;
}

function Services({ services }: { services: Service[] }) {
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
              {services
                .map((s, i) => ({ s, i }))
                .filter(({ i }) => i % 2 === col)
                .map(({ s, i }) => (
                  <div
                    key={`${i}-${s.name}`}
                    className="reveal-hidden flex items-baseline justify-between gap-5 py-[19px] border-b border-line"
                  >
                    <span className="text-[1.02rem] font-medium">{s.name}</span>
                    <span className="flex-1 border-b border-dotted border-white/15 translate-y-[-4px]" aria-hidden="true" />
                    <span className="font-display text-[1.1rem] tracking-[0.04em] text-accent font-bold italic flex-shrink-0 whitespace-nowrap">
                      {formatPrice(s.price)}
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
function Why({ points }: { points: WhyPoint[] }) {
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
function Gallery({ items, instagramHandle }: { items: GalleryItem[]; instagramHandle: string }) {
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
          {items.map((g, i) => (
            <div
              key={i}
              className="reveal-hidden aspect-[4/5] rounded-md border border-line bg-surface-tertiary overflow-hidden relative flex flex-col items-center justify-center gap-2.5 text-center group hover:-translate-y-1.5 hover:border-accent/40 transition-all duration-300"
            >
              {g.image_url ? (
                <>
                  <Image
                    src={g.image_url}
                    alt={g.alt}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, 25vw"
                  />
                  <span className="absolute inset-x-0 bottom-0 bg-black/55 px-3 py-2 text-[0.68rem] tracking-[0.16em] uppercase text-white/80">
                    {g.alt}
                  </span>
                </>
              ) : (
                <>
                  <ScissorsIcon />
                  <span className="text-[0.72rem] tracking-[0.2em] uppercase text-copper/60 group-hover:text-accent/80 transition-colors">
                    {g.alt}
                  </span>
                </>
              )}
            </div>
          ))}
        </div>

        <div className="reveal-hidden mt-9 text-center">
          <p className="text-body text-sm mb-4">Lebih banyak hasil potongan ada di feed Instagram kami.</p>
          <a
            href={`https://www.instagram.com/${instagramHandle}/`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 border border-white/20 text-ink text-xs font-semibold tracking-[0.12em] uppercase px-6 py-3 rounded hover:border-white/60 transition-all"
          >
            Follow @{instagramHandle} ↗
          </a>
        </div>
      </div>
    </section>
  );
}

/* ---------- LOCATION ---------- */
function Location({ hours, branches, contact }: { hours: HourRow[]; branches: BranchInfo[]; contact: ContactInfo }) {
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
              {hours.map((h) => (
                <li key={h.day} className="flex justify-between gap-6 py-3 border-b border-line text-body text-sm">
                  <span>{h.day}</span>
                  <span className="text-ink">{h.time}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="reveal-hidden">
            <h3 className="font-display font-bold italic text-[1.35rem] tracking-[0.08em] uppercase text-copper mb-4">Alamat</h3>
            {branches.map((b) => (
              <p key={b.nama} className={`text-body ${branches.length > 1 ? 'mb-4' : ''}`}>
                <strong className="text-ink font-semibold">{b.nama}</strong>
                <br />
                {b.alamat}
              </p>
            ))}

            <div className="flex flex-col items-start gap-3 mt-8">
              <a
                href={`https://wa.me/${contact.wa_number}?text=Halo%20DEEP%20CUT%2C%20mau%20booking`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-accent text-white text-xs font-semibold tracking-[0.12em] uppercase px-5 py-2.5 rounded hover:bg-[#FF6A1F] transition-colors"
              >
                WhatsApp Booking
              </a>
              <a
                href={`https://www.instagram.com/${contact.instagram_handle}/`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 text-[0.95rem] font-semibold text-ink border-b border-copper pb-1 hover:text-accent transition-colors"
              >
                Instagram @{contact.instagram_handle} ↗
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
function FinalCTA({ cta, contact }: { cta: CtaContent; contact: ContactInfo }) {
  return (
    <section className="py-32 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,rgba(254,82,0,0.12),transparent_65%)]" aria-hidden="true" />
      <div className="mx-auto max-w-[720px] px-[4%] text-center relative z-10">
        <h2 className="font-display font-extrabold italic text-[clamp(2.6rem,7vw,5rem)] leading-[0.92] uppercase tracking-tight">
          {cta.heading}
        </h2>
        <p className="mt-5 text-body max-w-[50ch] mx-auto">
          {cta.subtitle}
        </p>
        <a
          href={`https://wa.me/${contact.wa_number}?text=Halo%20DEEP%20CUT%2C%20mau%20booking`}
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
function Footer({ instagramHandle }: { instagramHandle: string }) {
  return (
    <footer className="border-t border-line py-11">
      <div className="mx-auto max-w-[1120px] px-[4%] flex flex-wrap items-center justify-between gap-6">
        <div className="flex items-center gap-2.5">
          <Image src="/deepcut-logo.webp" alt="DEEP CUT" width={30} height={30} className="h-[30px] w-auto mix-blend-screen" />
          <span className="font-display text-[1.3rem] tracking-[0.08em] italic font-bold">DEEP CUT</span>
        </div>
        <p className="text-muted text-sm">
          © 2026 DEEP CUT Barber Shop ·{' '}
          <a href={`https://www.instagram.com/${instagramHandle}/`} target="_blank" rel="noopener noreferrer" className="text-body border-b border-line hover:text-ink transition-colors">
            @{instagramHandle}
          </a>
        </p>
      </div>
    </footer>
  );
}

/* ================================================================
   SCROLL REVEAL HOOK
   ================================================================
   KENAPA DIREWRITE:
   Versi sebelumnya mengambil `document.querySelectorAll('.reveal-hidden')`
   SEKALI saat mount, lalu memakai daftar statis itu selamanya. Sementara
   `useContent()` men-fetch `/api/content` setelah mount dan mengganti
   seluruh daftar layanan dengan data dari API. Node DOM yang baru tidak
   pernah masuk daftar `els`, sehingga tidak pernah di-`observe()` maupun
   di-reveal oleh `setTimeout` — item menu itu tinggal `opacity: 0`
   permanen. Gejala di produksi: "Menu & Harga cuma tampil sebagian".

   Versi ini memakai MutationObserver untuk ikut memantau item yang
   muncul belakangan, dan mereset timer supaya DOM yang baru selalu punya
   jendela waktu untuk di-reveal. Aturan yang dijaga: `.reveal-hidden`
   TIDAK BOLEH permanen invisible. Kalau observer gagal, JS mati, atau
   elemen tak pernah masuk viewport — `revealAll` tetap menyelamatkannya.
   ================================================================ */
function useScrollReveal() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Reveal tanpa animasi untuk pengguna yang memintanya.
    const prefersReduced = window.matchMedia?.(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    if (prefersReduced || !('IntersectionObserver' in window)) {
      document
        .querySelectorAll('.reveal-hidden')
        .forEach((el) => el.classList.add('reveal-shown'));
      return;
    }

    const observed = new WeakSet<Element>();
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('reveal-shown');
            io.unobserve(entry.target);
          }
        });
      },
      // rootMargin negatif kecil saja: ambang besar membuat elemen yang
      // tinggi (baris menu) tidak pernah dianggap "intersecting".
      { threshold: 0.01, rootMargin: '0px 0px -10px 0px' },
    );

    let timer: ReturnType<typeof setTimeout>;

    /** Jadikan semua yang belum terlihat, terlihat. Ini jaring pengaman. */
    const revealAll = () => {
      document.querySelectorAll('.reveal-hidden').forEach((el) => {
        el.classList.add('reveal-shown');
        io.unobserve(el);
      });
    };

    /** Amati elemen baru; jadwalkan ulang jaring pengaman. */
    const observeNew = () => {
      document.querySelectorAll('.reveal-hidden').forEach((el) => {
        if (observed.has(el)) return;
        observed.add(el);
        io.observe(el);
      });
      clearTimeout(timer);
      timer = setTimeout(revealAll, 2500);
    };

    observeNew();

    // Konten dari `/api/content` datang setelah mount dan mengganti node.
    // Tanpa pemantauan ini, node baru tidak akan pernah di-reveal.
    const mo = new MutationObserver(observeNew);
    mo.observe(document.body, { childList: true, subtree: true });

    // Scroll & resize terakhir: pastikan apa pun yang sudah masuk layar
    // tidak tertinggal kalau observer meleset.
    window.addEventListener('load', observeNew);

    return () => {
      mo.disconnect();
      io.disconnect();
      clearTimeout(timer);
      window.removeEventListener('load', observeNew);
    };
  }, []);
}

/* ================================================================
   CONTENT HOOK
   ================================================================ */
function useContent() {
  const [content, setContent] = useState(DEFAULT_CONTENT);
  useEffect(() => {
    let active = true;
    fetch('/api/content')
      .then((r) => (r.ok ? r.json() : null))
      .then((r) => {
        if (active && r?.data) {
          setContent({ ...DEFAULT_CONTENT, ...r.data });
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);
  return content;
}

/* ================================================================
   PAGE
   ================================================================ */
export default function Home() {
  useScrollReveal();
  const content = useContent();

  return (
    <>
      <Header contact={content.contact} />
      <main>
        <Hero content={content.hero} />
        <SocialProof stats={content.stats} />
        <Marquee items={content.marquee} />
        <Services services={content.services} />
        <Why points={content.why} />
        <Gallery items={content.gallery} instagramHandle={content.contact.instagram_handle} />
        <Booking />
        <Location hours={content.hours} branches={content.branches} contact={content.contact} />
        <FinalCTA cta={content.cta} contact={content.contact} />
      </main>
      <Footer instagramHandle={content.contact.instagram_handle} />
    </>
  );
}
