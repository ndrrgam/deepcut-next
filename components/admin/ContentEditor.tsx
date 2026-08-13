'use client';

import { useEffect, useState } from 'react';
import {
  DEFAULT_CONTENT,
  type LandingContent,
  type Service,
  type GalleryItem,
  type StatItem,
  type WhyPoint,
  type HourRow,
  type BranchInfo,
} from '@/lib/content';

const inputClass =
  'w-full rounded-lg border border-line bg-surface-tertiary px-3.5 py-2.5 text-sm text-ink outline-none transition placeholder:text-muted focus:border-accent focus:ring-2 focus:ring-accent/30';

const btnPrimary =
  'rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-50';

const btnGhost =
  'rounded-lg border border-line bg-surface-secondary px-3 py-2 text-sm font-semibold text-body transition hover:text-ink';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">
        {label}
      </span>
      {children}
    </label>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-line bg-surface-secondary p-5">
      <h2 className="mb-4 font-display text-xl font-bold uppercase italic tracking-tight">
        {title}
      </h2>
      {children}
    </section>
  );
}

export default function ContentEditor() {
  const [content, setContent] = useState<LandingContent>(DEFAULT_CONTENT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    fetch('/api/content')
      .then((r) => (r.ok ? r.json() : null))
      .then((r) => {
        if (r?.data) setContent({ ...DEFAULT_CONTENT, ...r.data });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function setHero<K extends keyof typeof content.hero>(key: K, value: string) {
    setContent((c) => ({ ...c, hero: { ...c.hero, [key]: value } }));
  }

  function setService(i: number, patch: Partial<Service>) {
    setContent((c) => ({
      ...c,
      services: c.services.map((s, idx) => (idx === i ? { ...s, ...patch } : s)),
    }));
  }
  function addService() {
    setContent((c) => ({
      ...c,
      services: [...c.services, { name: '', price: '' }],
    }));
  }

  function removeService(i: number) {
    setContent((c) => ({
      ...c,
      services: c.services.filter((_, idx) => idx !== i),
    }));
  }

  function moveService(i: number, dir: -1 | 1) {
    setContent((c) => {
      const next = [...c.services];
      const j = i + dir;
      if (j < 0 || j >= next.length) return c;
      [next[i], next[j]] = [next[j], next[i]];
      return { ...c, services: next };
    });
  }

  function setGallery(i: number, patch: Partial<GalleryItem>) {
    setContent((c) => ({
      ...c,
      gallery: c.gallery.map((g, idx) => (idx === i ? { ...g, ...patch } : g)),
    }));
  }

  function addGallery() {
    setContent((c) => ({
      ...c,
      gallery: [...c.gallery, { image_url: '', alt: '' }],
    }));
  }

  function removeGallery(i: number) {
    setContent((c) => ({
      ...c,
      gallery: c.gallery.filter((_, idx) => idx !== i),
    }));
  }

  function setMarquee(i: number, value: string) {
    setContent((c) => ({
      ...c,
      marquee: c.marquee.map((m, idx) => (idx === i ? value : m)),
    }));
  }

  function addMarquee() {
    setContent((c) => ({ ...c, marquee: [...c.marquee, ''] }));
  }

  function removeMarquee(i: number) {
    setContent((c) => ({ ...c, marquee: c.marquee.filter((_, idx) => idx !== i) }));
  }

  function setStat(i: number, patch: Partial<StatItem>) {
    setContent((c) => ({
      ...c,
      stats: c.stats.map((s, idx) => (idx === i ? { ...s, ...patch } : s)),
    }));
  }

  function addStat() {
    setContent((c) => ({ ...c, stats: [...c.stats, { value: '', label: '' }] }));
  }

  function removeStat(i: number) {
    setContent((c) => ({ ...c, stats: c.stats.filter((_, idx) => idx !== i) }));
  }

  function setWhy(i: number, patch: Partial<WhyPoint>) {
    setContent((c) => ({
      ...c,
      why: c.why.map((w, idx) => (idx === i ? { ...w, ...patch } : w)),
    }));
  }

  function addWhy() {
    setContent((c) => ({
      ...c,
      why: [...c.why, { num: String(c.why.length + 1).padStart(2, '0'), title: '', body: '' }],
    }));
  }

  function removeWhy(i: number) {
    setContent((c) => ({ ...c, why: c.why.filter((_, idx) => idx !== i) }));
  }

  function setHour(i: number, patch: Partial<HourRow>) {
    setContent((c) => ({
      ...c,
      hours: c.hours.map((h, idx) => (idx === i ? { ...h, ...patch } : h)),
    }));
  }

  function addHour() {
    setContent((c) => ({ ...c, hours: [...c.hours, { day: '', time: '' }] }));
  }

  function removeHour(i: number) {
    setContent((c) => ({ ...c, hours: c.hours.filter((_, idx) => idx !== i) }));
  }

  function setBranch(i: number, patch: Partial<BranchInfo>) {
    setContent((c) => ({
      ...c,
      branches: c.branches.map((b, idx) => (idx === i ? { ...b, ...patch } : b)),
    }));
  }

  function addBranch() {
    setContent((c) => ({ ...c, branches: [...c.branches, { nama: '', alamat: '' }] }));
  }

  function removeBranch(i: number) {
    setContent((c) => ({ ...c, branches: c.branches.filter((_, idx) => idx !== i) }));
  }

  function setCta(key: 'heading' | 'subtitle', value: string) {
    setContent((c) => ({ ...c, cta: { ...c.cta, [key]: value } }));
  }

  function setContact(key: 'wa_number' | 'instagram_handle', value: string) {
    setContent((c) => ({ ...c, contact: { ...c.contact, [key]: value } }));
  }

  async function uploadImage(file: File): Promise<string> {
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch('/api/upload', { method: 'POST', body: fd });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body.error || 'Upload gagal');
    return body.data.url as string;
  }

  async function save() {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: content }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || 'Gagal menyimpan');
      setMessage({ type: 'ok', text: 'Konten berhasil disimpan.' });
    } catch (e) {
      setMessage({ type: 'err', text: e instanceof Error ? e.message : 'Gagal menyimpan' });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-muted">Memuat konten…</p>;
  }

  return (
    <div className="space-y-5">
      {message && (
        <p
          className={`rounded-lg border px-3 py-2 text-sm ${
            message.type === 'ok'
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
              : 'border-red-500/30 bg-red-500/10 text-red-400'
          }`}
        >
          {message.text}
        </p>
      )}

      {/* HERO */}
      <Section title="Hero">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Judul baris 1">
            <input
              className={inputClass}
              value={content.hero.title_line_1}
              onChange={(e) => setHero('title_line_1', e.target.value)}
            />
          </Field>
          <Field label="Judul baris 2">
            <input
              className={inputClass}
              value={content.hero.title_line_2}
              onChange={(e) => setHero('title_line_2', e.target.value)}
            />
          </Field>
        </div>
        <div className="mt-4">
          <Field label="Subjudul">
            <textarea
              className={inputClass}
              rows={2}
              value={content.hero.subtitle}
              onChange={(e) => setHero('subtitle', e.target.value)}
            />
          </Field>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Jam Buka">
            <input
              className={inputClass}
              value={content.hero.meta_jam_buka}
              onChange={(e) => setHero('meta_jam_buka', e.target.value)}
            />
          </Field>
          <Field label="Instagram">
            <input
              className={inputClass}
              value={content.hero.meta_instagram}
              onChange={(e) => setHero('meta_instagram', e.target.value)}
            />
          </Field>
          <Field label="Status">
            <input
              className={inputClass}
              value={content.hero.meta_status}
              onChange={(e) => setHero('meta_status', e.target.value)}
            />
          </Field>
        </div>
        <HeroImageField
          value={content.hero.image_url}
          onChange={(url) => setHero('image_url', url)}
          onUpload={uploadImage}
        />
      </Section>

      {/* MENU & HARGA */}
      <Section title="Menu & Harga">
        <div className="space-y-3">
          {content.services.map((s, i) => (
            <div key={i} className="flex items-start gap-2">
              <input
                className={inputClass}
                placeholder="Nama layanan"
                value={s.name}
                onChange={(e) => setService(i, { name: e.target.value })}
              />
              <input
                className={`${inputClass} !w-36`}
                placeholder="Harga"
                value={s.price}
                onChange={(e) => setService(i, { price: e.target.value })}
              />
              <div className="flex shrink-0 gap-1 pt-1">
                <button
                  type="button"
                  className={btnGhost}
                  onClick={() => moveService(i, -1)}
                  title="Naik"
                >
                  ↑
                </button>
                <button
                  type="button"
                  className={btnGhost}
                  onClick={() => moveService(i, 1)}
                  title="Turun"
                >
                  ↓
                </button>
                <button
                  type="button"
                  className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm font-semibold text-red-400 transition hover:bg-red-500/20"
                  onClick={() => removeService(i)}
                  title="Hapus"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
        <button type="button" className={`${btnGhost} mt-3`} onClick={addService}>
          + Tambah Layanan
        </button>
      </Section>

      {/* GALERI */}
      <Section title="Galeri">
        <div className="space-y-4">
          {content.gallery.map((g, i) => (
            <div key={i} className="rounded-lg border border-line bg-surface-tertiary p-3">
              <GalleryImageField
                value={g.image_url}
                alt={g.alt}
                onChange={(url) => setGallery(i, { image_url: url })}
                onUpload={uploadImage}
              />
              <div className="mt-3 flex items-start gap-2">
                <input
                  className={inputClass}
                  placeholder="Keterangan (alt)"
                  value={g.alt}
                  onChange={(e) => setGallery(i, { alt: e.target.value })}
                />
                <button
                  type="button"
                  className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm font-semibold text-red-400 transition hover:bg-red-500/20"
                  onClick={() => removeGallery(i)}
                  title="Hapus"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
        <button type="button" className={`${btnGhost} mt-3`} onClick={addGallery}>
          + Tambah Gambar
        </button>
      </Section>

      {/* STATISTIK */}
      <Section title="Statistik (Social Proof)">
        <div className="space-y-3">
          {content.stats.map((s, i) => (
            <div key={i} className="flex items-start gap-2">
              <input
                className={`${inputClass} !w-32`}
                placeholder="Nilai"
                value={s.value}
                onChange={(e) => setStat(i, { value: e.target.value })}
              />
              <input
                className={inputClass}
                placeholder="Label"
                value={s.label}
                onChange={(e) => setStat(i, { label: e.target.value })}
              />
              <button
                type="button"
                className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm font-semibold text-red-400 transition hover:bg-red-500/20"
                onClick={() => removeStat(i)}
                title="Hapus"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        <button type="button" className={`${btnGhost} mt-3`} onClick={addStat}>
          + Tambah Statistik
        </button>
      </Section>

      {/* MARQUEE */}
      <Section title="Marquee (Teks Berjalan)">
        <div className="space-y-3">
          {content.marquee.map((m, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                className={inputClass}
                placeholder="Teks marquee"
                value={m}
                onChange={(e) => setMarquee(i, e.target.value)}
              />
              <button
                type="button"
                className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm font-semibold text-red-400 transition hover:bg-red-500/20"
                onClick={() => removeMarquee(i)}
                title="Hapus"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        <button type="button" className={`${btnGhost} mt-3`} onClick={addMarquee}>
          + Tambah Teks
        </button>
      </Section>

      {/* KENAPA DEEP CUT */}
      <Section title="Kenapa DEEP CUT">
        <div className="space-y-4">
          {content.why.map((w, i) => (
            <div key={i} className="rounded-lg border border-line bg-surface-tertiary p-3 space-y-2">
              <div className="flex items-center gap-2">
                <input
                  className={`${inputClass} !w-20`}
                  placeholder="No"
                  value={w.num}
                  onChange={(e) => setWhy(i, { num: e.target.value })}
                />
                <input
                  className={inputClass}
                  placeholder="Judul"
                  value={w.title}
                  onChange={(e) => setWhy(i, { title: e.target.value })}
                />
                <button
                  type="button"
                  className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm font-semibold text-red-400 transition hover:bg-red-500/20"
                  onClick={() => removeWhy(i)}
                  title="Hapus"
                >
                  ✕
                </button>
              </div>
              <textarea
                className={inputClass}
                rows={2}
                placeholder="Deskripsi"
                value={w.body}
                onChange={(e) => setWhy(i, { body: e.target.value })}
              />
            </div>
          ))}
        </div>
        <button type="button" className={`${btnGhost} mt-3`} onClick={addWhy}>
          + Tambah Poin
        </button>
      </Section>

      {/* JAM BUKA */}
      <Section title="Jam Buka">
        <div className="space-y-3">
          {content.hours.map((h, i) => (
            <div key={i} className="flex items-start gap-2">
              <input
                className={inputClass}
                placeholder="Hari"
                value={h.day}
                onChange={(e) => setHour(i, { day: e.target.value })}
              />
              <input
                className={inputClass}
                placeholder="Jam"
                value={h.time}
                onChange={(e) => setHour(i, { time: e.target.value })}
              />
              <button
                type="button"
                className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm font-semibold text-red-400 transition hover:bg-red-500/20"
                onClick={() => removeHour(i)}
                title="Hapus"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        <button type="button" className={`${btnGhost} mt-3`} onClick={addHour}>
          + Tambah Jam
        </button>
      </Section>

      {/* CABANG / ALAMAT */}
      <Section title="Cabang & Alamat">
        <div className="space-y-4">
          {content.branches.map((b, i) => (
            <div key={i} className="rounded-lg border border-line bg-surface-tertiary p-3 space-y-2">
              <div className="flex items-center gap-2">
                <input
                  className={inputClass}
                  placeholder="Nama cabang"
                  value={b.nama}
                  onChange={(e) => setBranch(i, { nama: e.target.value })}
                />
                <button
                  type="button"
                  className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm font-semibold text-red-400 transition hover:bg-red-500/20"
                  onClick={() => removeBranch(i)}
                  title="Hapus"
                >
                  ✕
                </button>
              </div>
              <input
                className={inputClass}
                placeholder="Alamat"
                value={b.alamat}
                onChange={(e) => setBranch(i, { alamat: e.target.value })}
              />
            </div>
          ))}
        </div>
        <button type="button" className={`${btnGhost} mt-3`} onClick={addBranch}>
          + Tambah Cabang
        </button>
      </Section>

      {/* CTA */}
      <Section title="Call to Action (Akhir)">
        <div className="space-y-4">
          <Field label="Judul">
            <input
              className={inputClass}
              value={content.cta.heading}
              onChange={(e) => setCta('heading', e.target.value)}
            />
          </Field>
          <Field label="Subjudul">
            <textarea
              className={inputClass}
              rows={2}
              value={content.cta.subtitle}
              onChange={(e) => setCta('subtitle', e.target.value)}
            />
          </Field>
        </div>
      </Section>

      {/* KONTAK */}
      <Section title="Kontak (WA & Instagram)">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Nomor WhatsApp (tanpa +)">
            <input
              className={inputClass}
              value={content.contact.wa_number}
              onChange={(e) => setContact('wa_number', e.target.value)}
            />
          </Field>
          <Field label="Username Instagram (tanpa @)">
            <input
              className={inputClass}
              value={content.contact.instagram_handle}
              onChange={(e) => setContact('instagram_handle', e.target.value)}
            />
          </Field>
        </div>
      </Section>

      <div className="flex items-center gap-3">
        <button type="button" className={btnPrimary} onClick={save} disabled={saving}>
          {saving ? 'Menyimpan…' : 'Simpan Konten'}
        </button>
      </div>
    </div>
  );
}

function HeroImageField({
  value,
  onChange,
  onUpload,
}: {
  value: string;
  onChange: (url: string) => void;
  onUpload: (file: File) => Promise<string>;
}) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setErr(null);
    try {
      const url = await onUpload(file);
      onChange(url);
    } catch (er) {
      setErr(er instanceof Error ? er.message : 'Upload gagal');
    } finally {
      setBusy(false);
      e.target.value = '';
    }
  }

  return (
    <div className="mt-4">
      <Field label="Gambar Hero (URL)">
        <input
          className={inputClass}
          placeholder="Kosongkan untuk pakai default /hero-barber.webp"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </Field>
      <div className="mt-2 flex items-center gap-3">
        <label className="cursor-pointer rounded-lg border border-line bg-surface-secondary px-3 py-2 text-sm font-semibold text-body transition hover:text-ink">
          {busy ? 'Mengupload…' : 'Upload Gambar'}
          <input type="file" accept="image/*" className="hidden" onChange={handleFile} disabled={busy} />
        </label>
        {value && <span className="truncate text-xs text-muted">{value}</span>}
      </div>
      {err && <p className="mt-2 text-xs text-red-400">{err}</p>}
    </div>
  );
}

function GalleryImageField({
  value,
  alt,
  onChange,
  onUpload,
}: {
  value: string;
  alt: string;
  onChange: (url: string) => void;
  onUpload: (file: File) => Promise<string>;
}) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setErr(null);
    try {
      const url = await onUpload(file);
      onChange(url);
    } catch (er) {
      setErr(er instanceof Error ? er.message : 'Upload gagal');
    } finally {
      setBusy(false);
      e.target.value = '';
    }
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-md border border-line bg-surface-secondary">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt={alt} className="h-full w-full object-cover" />
        ) : (
          <span className="text-xs text-muted">Kosong</span>
        )}
      </div>
      <div className="flex-1">
        <input
          className={inputClass}
          placeholder="URL gambar (otomatis terisi setelah upload)"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        {err && <p className="mt-1 text-xs text-red-400">{err}</p>}
      </div>
      <label className="shrink-0 cursor-pointer rounded-lg border border-line bg-surface-secondary px-3 py-2 text-sm font-semibold text-body transition hover:text-ink">
        {busy ? '…' : 'Upload'}
        <input type="file" accept="image/*" className="hidden" onChange={handleFile} disabled={busy} />
      </label>
    </div>
  );
}
