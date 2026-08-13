'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

export default function AdminHeader() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.replace('/admin/login');
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-surface/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-accent font-display text-lg font-bold uppercase italic leading-none text-white">
            DC
          </span>
          <div>
            <p className="font-display text-sm font-bold uppercase tracking-wide leading-none">
              Deep Cut Admin
            </p>
            <p className="text-xs text-muted">Panel Manajemen Booking</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="/"
            className="hidden text-sm text-body transition hover:text-ink sm:inline"
          >
            Lihat Situs
          </a>
          <button
            onClick={handleLogout}
            disabled={loading}
            className="rounded-lg border border-line bg-surface-secondary px-3.5 py-2 text-sm font-semibold text-ink transition hover:border-accent hover:text-accent disabled:opacity-60"
          >
            {loading ? 'Keluar…' : 'Logout'}
          </button>
        </div>
      </div>
    </header>
  );
}
