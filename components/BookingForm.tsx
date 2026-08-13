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

// Nomor WhatsApp admin yang menerima pesan booking.
const ADMIN_WA_NUMBER = '6287741445773';

// Susun teks pesan booking untuk WhatsApp.
function buildWaMessage(opts: {
  nama: string;
  noWa: string;
  branchName: string;
  tanggal: string;
  jamMulai: string;
  jamSelesai: string;
}): string {
  const lines = [
    'Halo DEEP CUT, saya mau booking:',
    '',
    `Nama: ${opts.nama}`,
    opts.noWa ? `No. WA: ${opts.noWa}` : '',
    `Cabang: ${opts.branchName}`,
    `Tanggal: ${formatTanggal(opts.tanggal)}`,
    `Jam: ${formatJam(opts.jamMulai)}${
      opts.jamSelesai ? ` – ${formatJam(opts.jamSelesai)} WIB` : ' WIB'
    }`,
  ].filter(Boolean);

  return lines.join('\n');
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
  const [submitted, setSubmitted] = useState(false);
  const [booking, setBooking] = useState<BookingResult | null>(null);

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

  /* ---------- Submit: simpan booking lalu kirim ke WhatsApp admin ---------- */
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

      const result = json.data as BookingResult;
      setBooking(result);

      const branch = branches.find((b) => b.id === branchId);
      const message = buildWaMessage({
        nama: result.nama,
        noWa: result.no_wa ?? '',
        branchName: branch?.nama_cabang ?? branchId,
        tanggal: result.tanggal,
        jamMulai: result.jam_mulai,
        jamSelesai: result.jam_selesai,
      });
      const url = `https://wa.me/${ADMIN_WA_NUMBER}?text=${encodeURIComponent(message)}`;
      window.open(url, '_blank', 'noopener,noreferrer');

      setSubmitted(true);
    } catch {
      setError('Terjadi kesalahan jaringan. Coba lagi.');
    } finally {
      setSubmitting(false);
    }
  }

  /* ---------- Reset form ---------- */
  function resetForm() {
    setSubmitted(false);
    setBooking(null);
    setBranchId('');
    setTanggal('');
    setNama('');
    setNoWa('');
    setSlots([]);
    setSelectedSlot('');
    setError('');
  }

  /* ---------- CONFIRMATION SCREEN (setelah WhatsApp terbuka) ---------- */
  if (submitted) {
    const branch = branches.find((b) => b.id === branchId);
    const b = booking;
    const jamSelesai = b?.jam_selesai ?? slots.find((s) => s.jam_mulai === selectedSlot)?.jam_selesai ?? '';
    const waLink = `https://wa.me/${ADMIN_WA_NUMBER}?text=${encodeURIComponent(
      buildWaMessage({
        nama: b?.nama ?? nama.trim(),
        noWa: b?.no_wa ?? noWa.trim(),
        branchName: branch?.nama_cabang ?? branchId,
        tanggal: b?.tanggal ?? tanggal,
        jamMulai: b?.jam_mulai ?? selectedSlot,
        jamSelesai,
      }),
    )}`;

    return (
      <div className="bg-surface-secondary border border-line rounded-lg p-8 md:p-12 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full border border-accent/40 bg-accent/10 mb-6">
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-accent">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
          </svg>
        </div>
        <h3 className="font-display font-bold italic text-[2rem] uppercase tracking-tight mb-3">
          Booking Tersimpan
        </h3>
        <p className="text-body max-w-[46ch] mx-auto mb-8">
          Booking <strong className="text-ink">{b?.nama ?? nama.trim()}</strong> sudah
          tercatat dan <strong className="text-accent">menunggu konfirmasi admin</strong>.
          WhatsApp juga sudah terbuka — tinggal tekan{' '}
          <strong className="text-ink">kirim</strong> untuk mempercepat konfirmasi.
        </p>

        <div className="max-w-[360px] mx-auto text-left bg-surface-tertiary border border-line rounded-md p-5 mb-8">
          <Row label="Nama" value={b?.nama ?? nama.trim()} />
          <Row label="Cabang" value={branch?.nama_cabang ?? '—'} />
          <Row label="Tanggal" value={formatTanggal(b?.tanggal ?? tanggal)} />
          <Row label="Jam" value={`${formatJam(b?.jam_mulai ?? selectedSlot)} – ${jamSelesai ? formatJam(jamSelesai) : ''} WIB`} />
          {b && <Row label="Kursi" value={`#${b.kursi}`} />}
          <Row label="Status" value="Menunggu konfirmasi admin" last />
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-accent text-white text-xs font-semibold tracking-[0.12em] uppercase px-6 py-4 rounded hover:bg-[#FF6A1F] transition-colors"
          >
            Buka WhatsApp Lagi
          </a>
          <button
            type="button"
            onClick={resetForm}
            className="inline-flex items-center gap-2 border border-white/20 text-ink text-xs font-semibold tracking-[0.12em] uppercase px-6 py-3 rounded hover:border-white/60 transition-all"
          >
            Buat Booking Lain
          </button>
        </div>
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
        {submitting ? 'Mengirim…' : 'Booking via WhatsApp'}
      </button>
      <p className="mt-3 text-center text-xs text-muted">
        Booking tersimpan &amp; dikirim ke WhatsApp admin untuk konfirmasi.
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
