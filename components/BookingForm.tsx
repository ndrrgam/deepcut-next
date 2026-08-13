'use client';

import { useEffect, useState } from 'react';
import { todayWIB } from '@/lib/datetime';
import CustomSelect from '@/components/CustomSelect';
import DatePickerField from '@/components/DatePickerField';

/* ================================================================
   TYPES
   ================================================================ */
interface Branch {
  id: string;
  nama_cabang: string;
}

interface Slot {
  jam_mulai: string;
  jam_selesai: string;
}

interface BookingResult {
  id: string;
  nama: string;
  no_wa: string | null;
  branch_id: string;
  tanggal: string;
  jam_mulai: string;
  jam_selesai: string;
  kursi: number;
  status: string;
}

/* ================================================================
   HELPERS
   ================================================================ */
function formatTanggal(date: string): string {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatJam(hhmm: string): string {
  return hhmm.slice(0, 5).replace('.', ':');
}

/* ================================================================
   COMPONENT
   ================================================================ */
export default function BookingForm() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(true);

  const [branchId, setBranchId] = useState('');
  const [tanggal, setTanggal] = useState('');
  const [nama, setNama] = useState('');
  const [noWa, setNoWa] = useState('');

  const [slots, setSlots] = useState<Slot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<BookingResult | null>(null);

  const minDate = todayWIB();

  /* ---------- Load cabang ---------- */
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch('/api/branches');
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Gagal memuat cabang');
        if (active) setBranches(json.data ?? []);
      } catch (e) {
        if (active) setError(e instanceof Error ? e.message : 'Gagal memuat cabang');
      } finally {
        if (active) setLoadingBranches(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  /* ---------- Load slot saat cabang + tanggal terpilih ---------- */
  useEffect(() => {
    if (!branchId || !tanggal) {
      setSlots([]);
      setSelectedSlot('');
      return;
    }

    let active = true;
    setLoadingSlots(true);
    setSelectedSlot('');

    (async () => {
      try {
        const res = await fetch(
          `/api/available-slots?branch_id=${branchId}&date=${tanggal}`,
        );
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Gagal memuat slot');
        if (active) setSlots(json.data?.available_slots ?? []);
      } catch (e) {
        if (active) {
          setSlots([]);
          setError(e instanceof Error ? e.message : 'Gagal memuat slot');
        }
      } finally {
        if (active) setLoadingSlots(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [branchId, tanggal]);

  /* ---------- Submit booking ---------- */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!branchId || !tanggal || !selectedSlot || !nama.trim()) {
      setError('Lengkapi cabang, tanggal, jam, dan nama.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nama: nama.trim(),
          no_wa: noWa.trim() || undefined,
          branch_id: branchId,
          tanggal,
          jam_mulai: selectedSlot,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        const msg =
          typeof json.details === 'string'
            ? json.details
            : json.error || 'Gagal membuat booking';
        setError(msg);
        return;
      }
      setSuccess(json.data as BookingResult);
    } catch {
      setError('Terjadi kesalahan jaringan. Coba lagi.');
    } finally {
      setSubmitting(false);
    }
  }

  /* ---------- Reset form ---------- */
  function resetForm() {
    setSuccess(null);
    setBranchId('');
    setTanggal('');
    setNama('');
    setNoWa('');
    setSlots([]);
    setSelectedSlot('');
    setError('');
  }

  /* ---------- SUCCESS SCREEN ---------- */
  if (success) {
    const branch = branches.find((b) => b.id === success.branch_id || b.id === branchId);
    return (
      <div className="bg-surface-secondary border border-line rounded-lg p-8 md:p-12 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full border border-accent/40 bg-accent/10 mb-6">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7 text-accent">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </div>
        <h3 className="font-display font-bold italic text-[2rem] uppercase tracking-tight mb-3">
          Booking Dikonfirmasi
        </h3>
        <p className="text-body max-w-[46ch] mx-auto mb-8">
          Terima kasih, <strong className="text-ink">{success.nama}</strong>. Booking lo
          sudah <strong className="text-accent">terkonfirmasi</strong> — langsung datang
          sesuai jadwal, ya.
        </p>

        <div className="max-w-[360px] mx-auto text-left bg-surface-tertiary border border-line rounded-md p-5 mb-8">
          <Row label="Cabang" value={branch?.nama_cabang ?? '—'} />
          <Row label="Tanggal" value={formatTanggal(success.tanggal)} />
          <Row label="Jam" value={`${formatJam(success.jam_mulai)} – ${formatJam(success.jam_selesai)} WIB`} />
          <Row label="Kursi" value={`#${success.kursi}`} />
          <Row label="Status" value="Terkonfirmasi" last />
        </div>

        <button
          type="button"
          onClick={resetForm}
          className="inline-flex items-center gap-2 border border-white/20 text-ink text-xs font-semibold tracking-[0.12em] uppercase px-6 py-3 rounded hover:border-white/60 transition-all"
        >
          Buat Booking Lain
        </button>
      </div>
    );
  }

  /* ---------- FORM SCREEN ---------- */
  const inputClass =
    'w-full bg-surface-tertiary border border-line rounded px-4 py-3 text-ink placeholder:text-muted text-sm focus:outline-none focus:border-accent/60 transition-colors';

  const labelClass =
    'block text-[0.7rem] tracking-[0.18em] uppercase text-muted mb-2';

  return (
    <form onSubmit={handleSubmit} className="bg-surface-secondary border border-line rounded-lg p-6 md:p-10">
      {/* Pilih cabang + tanggal + data diri */}
      <div className="grid md:grid-cols-2 gap-x-8 gap-y-6">
        <div>
          <label htmlFor="branch" className={labelClass}>
            Pilih Cabang
          </label>
          <CustomSelect
            value={branchId}
            onChange={setBranchId}
            disabled={loadingBranches}
            placeholder={loadingBranches ? 'Memuat cabang…' : '— Pilih cabang —'}
            options={branches.map((b) => ({ value: b.id, label: b.nama_cabang }))}
          />
        </div>

        <div>
          <label htmlFor="tanggal" className={labelClass}>
            Pilih Tanggal
          </label>
          <DatePickerField
            id="tanggal"
            value={tanggal}
            min={minDate}
            onChange={setTanggal}
            placeholder="Pilih tanggal"
          />
        </div>

        <div>
          <label htmlFor="nama" className={labelClass}>
            Nama Lengkap
          </label>
          <input
            id="nama"
            type="text"
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            placeholder="cth: Budi Santoso"
            className={inputClass}
            maxLength={100}
          />
        </div>

        <div>
          <label htmlFor="noWa" className={labelClass}>
            No. WhatsApp <span className="normal-case tracking-normal text-muted/70">(opsional)</span>
          </label>
          <input
            id="noWa"
            type="tel"
            value={noWa}
            onChange={(e) => setNoWa(e.target.value)}
            placeholder="cth: 0812 3456 7890"
            className={inputClass}
            inputMode="tel"
          />
        </div>
      </div>

      {/* Pilih jam */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-3">
          <span className={labelClass + ' !mb-0'}>Pilih Jam</span>
          {tanggal && (
            <span className="text-xs text-body">{formatTanggal(tanggal)}</span>
          )}
        </div>

        {!branchId || !tanggal ? (
          <p className="text-body text-sm py-6 border border-dashed border-line rounded text-center">
            Pilih cabang &amp; tanggal dulu untuk melihat jam tersedia.
          </p>
        ) : loadingSlots ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2.5">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="h-11 rounded border border-line bg-surface-tertiary animate-pulse"
              />
            ))}
          </div>
        ) : slots.length === 0 ? (
          <p className="text-body text-sm py-6 border border-dashed border-line rounded text-center">
            Tidak ada slot tersedia untuk tanggal ini. Pilih tanggal lain.
          </p>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2.5">
            {slots.map((s) => {
              const active = selectedSlot === s.jam_mulai;
              return (
                <button
                  key={s.jam_mulai}
                  type="button"
                  onClick={() => setSelectedSlot(s.jam_mulai)}
                  className={`h-11 rounded border text-sm font-semibold tracking-wide transition-all ${
                    active
                      ? 'bg-accent border-accent text-white shadow-[0_0_0_1px_rgba(254,82,0,0.4)]'
                      : 'border-line text-ink hover:border-accent/60 hover:bg-surface-tertiary'
                  }`}
                >
                  {formatJam(s.jam_mulai)}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <p className="mt-6 text-sm text-red-400 border border-red-500/30 bg-red-500/10 rounded px-4 py-3">
          {error}
        </p>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={submitting || !selectedSlot}
        className="mt-8 inline-flex w-full items-center justify-center gap-2 bg-accent text-white text-xs font-semibold tracking-[0.12em] uppercase px-6 py-4 rounded hover:bg-[#FF6A1F] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {submitting ? 'Mengirim…' : 'Booking Sekarang'}
      </button>
      <p className="mt-3 text-center text-xs text-muted">
        Booking langsung terkonfirmasi — cukup datang sesuai jadwal.
      </p>
    </form>
  );
}

/* ---------- Row kecil untuk ringkasan sukses ---------- */
function Row({
  label,
  value,
  last,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <div className={`py-2.5 ${last ? '' : 'border-b border-line'}`}>
      <span className="block text-[0.68rem] tracking-[0.16em] uppercase text-muted">
        {label}
      </span>
      <span className="text-sm text-ink">{value}</span>
    </div>
  );
}
