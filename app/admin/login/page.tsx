'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginForm />
    </Suspense>
  );
}

function LoginFallback() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-16">
      <p className="text-sm text-muted">Memuat…</p>
    </main>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/admin';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    if (!email.trim() || !password) {
      setErrorMsg('Email dan password wajib diisi.');
      return;
    }

    setLoading(true);
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);

    if (error) {
      setErrorMsg(
        error.message === 'Invalid login credentials'
          ? 'Email atau password salah.'
          : error.message,
      );
      return;
    }

    router.replace(redirect);
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="mb-10 text-center">
          <p className="font-display text-[0.7rem] font-bold uppercase tracking-kicker text-accent">
            Deep Cut · Barber Shop
          </p>
          <h1 className="mt-3 font-display text-4xl font-bold uppercase italic leading-none tracking-tight">
            Admin Login
          </h1>
          <p className="mt-3 text-sm text-body">
            Masuk untuk mengelola booking &amp; jadwal.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-line bg-surface-secondary p-6 shadow-2xl shadow-black/40"
        >
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">
              Email
            </span>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@deepcut.id"
              className="w-full rounded-lg border border-line bg-surface-tertiary px-3.5 py-2.5 text-sm text-ink outline-none transition placeholder:text-muted focus:border-accent focus:ring-2 focus:ring-accent/30"
            />
          </label>

          <label className="mt-4 block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">
              Password
            </span>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-lg border border-line bg-surface-tertiary px-3.5 py-2.5 text-sm text-ink outline-none transition placeholder:text-muted focus:border-accent focus:ring-2 focus:ring-accent/30"
            />
          </label>

          {errorMsg && (
            <p className="mt-4 rounded-lg border border-accent/30 bg-accent/10 px-3 py-2 text-sm text-accent">
              {errorMsg}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full rounded-lg bg-accent px-4 py-3 font-display text-sm font-bold uppercase tracking-wide text-white transition hover:bg-[#e04900] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Memproses…' : 'Masuk'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-muted">
          <a href="/" className="underline-offset-4 hover:text-ink hover:underline">
            ← Kembali ke beranda
          </a>
        </p>
      </div>
    </main>
  );
}
