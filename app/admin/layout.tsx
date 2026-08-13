import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin — DEEP CUT Barber Shop',
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-surface text-ink">
      {children}
    </div>
  );
}
