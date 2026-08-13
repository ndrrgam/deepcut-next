import type { Metadata } from 'next';
import { Barlow_Condensed, Inter } from 'next/font/google';
import './globals.css';

const barlow = Barlow_Condensed({
  subsets: ['latin'],
  weight: ['700', '800'],
  variable: '--font-barlow',
  style: ['normal', 'italic'],
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'DEEP CUT Barber Shop — Fade Presisi, Gaya Tanpa Kompromi',
  description:
    'Barber shop dengan fade presisi, hot towel shave, dan vibe yang bikin lo balik lagi. Booking online langsung terkonfirmasi.',
  openGraph: {
    title: 'DEEP CUT Barber Shop',
    description: 'Fade presisi, grooming rapi. Bukan sekadar potong rambut — ini statement.',
    url: 'https://deepcut.id',
    siteName: 'DEEP CUT',
    locale: 'id_ID',
    type: 'website',
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${barlow.variable} ${inter.variable}`}>
      <body className="font-body bg-surface text-ink antialiased">
        {children}
        <noscript>
          <style>{`.reveal-hidden { opacity: 1 !important; transform: none !important; }`}</style>
        </noscript>
      </body>
    </html>
  );
}
