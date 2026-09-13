'use client';

import { useCallback, useEffect, useState } from 'react';
import { todayWIB } from '@/lib/datetime';
import { BLOCKED_BOOKING_NAME } from '@/lib/constants';
import CustomSelect from '@/components/CustomSelect';
import DatePickerField from '@/components/DatePickerField';
import ContentEditor from '@/components/admin/ContentEditor';

type BookingStatus = 'pending' | 'confirmed' | 'cancelled';

type Branch = {
  id: string;
  nama_cabang: string;
};

type BookingRow = {
  id: string;
  nama: string;
  no_wa: string | null;
  branch_id: string;
  tanggal: string;
  jam_mulai: string;
  jam_selesai: string;
  kursi: number;
  status: BookingStatus;
  created_at: string;
  branches?: { nama_cabang: string } | null;
};

type ScheduleSlot = {
  jam_mulai: string;
  jam_selesai: string;
  terisi: boolean;
  booking: {
    id: string;
    nama: string;
    no_wa: string | null;
    kursi: number;
    status: BookingStatus;
  }[];
};

type ScheduleData = {
  total_slots: number;
  filled: number;
  empty: number;
  slots: ScheduleSlot[];
};

const STATUS_META: Record<BookingStatus, { label: string; className: string }> = {
  pending: { label: 'Pending', className: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
  confirmed: { label: 'Confirmed', className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
  cancelled: { label: 'Cancelled', className: 'bg-red-500/15 text-red-400 border-red-500/30' },
};

function formatDate(id: string) {
  const d = new Date(`${id}T00:00:00`);
  return d.toLocaleDateString('id-ID', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

async function api<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options?.headers ?? {}) },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body.error || `Request gagal (${res.status})`);
  }
  return body as T;
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'bookings' | 'schedule' | 'content'>('bookings');
  const [branches, setBranches] = useState<Branch[]>([]);

  useEffect(() => {
    api<{ data: Branch[] }>('/api/branches')
      .then((r) => setBranches(r.data))
      .catch(() => setBranches([]));
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-display text-xs font-bold uppercase tracking-kicker text-accent">
            Dashboard
          </p>
          <h1 className="mt-2 font-display text-4xl font-bold uppercase italic leading-none tracking-tight">
            Manajemen Booking
          </h1>
        </div>

        <div className="flex gap-1 rounded-lg border border-line bg-surface-secondary p-1">
          <TabButton
            active={activeTab === 'bookings'}
            onClick={() => setActiveTab('bookings')}
          >
            Booking
          </TabButton>
          <TabButton
            active={activeTab === 'schedule'}
            onClick={() => setActiveTab('schedule')}
          >
            Jadwal Harian
          </TabButton>
          <TabButton
            active={activeTab === 'content'}
            onClick={() => setActiveTab('content')}
          >
            Konten
          </TabButton>
        </div>
      </div>

      {activeTab === 'bookings' ? (
        <BookingsPanel branches={branches} />
      ) : activeTab === 'schedule' ? (
        <SchedulePanel branches={branches} />
      ) : (
        <ContentEditor />
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-md px-4 py-2 text-sm font-semibold transition ${
        active ? 'bg-accent text-white' : 'text-body hover:text-ink'
      }`}
    >
      {children}
    </button>
  );
}

/* ============================ BOOKINGS ============================ */

function BookingsPanel({ branches }: { branches: Branch[] }) {
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filterBranch, setFilterBranch] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const [editing, setEditing] = useState<BookingRow | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (filterBranch) params.set('branch_id', filterBranch);
    if (filterDate) params.set('tanggal', filterDate);
    if (filterStatus) params.set('status', filterStatus);
    try {
      const r = await api<{ data: BookingRow[] }>(
        `/api/bookings?${params.toString()}`,
      );
      setBookings(r.data ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal memuat booking.');
    } finally {
      setLoading(false);
    }
  }, [filterBranch, filterDate, filterStatus]);

  useEffect(() => {
    load();
  }, [load]);

  async function updateStatus(id: string, status: BookingStatus) {
    try {
      await api(`/api/bookings/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Gagal update status.');
    }
  }

  async function remove(id: string) {
    if (!confirm('Hapus booking ini? Tindakan tidak bisa dibatalkan.')) return;
    try {
      await api(`/api/bookings/${id}`, { method: 'DELETE' });
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Gagal menghapus.');
    }
  }

  return (
    <div>
      {/* Filter bar */}
      <div className="mb-5 grid grid-cols-1 gap-3 rounded-xl border border-line bg-surface-secondary p-4 sm:grid-cols-4">
        <Field label="Cabang">
          <CustomSelect
            value={filterBranch}
            onChange={setFilterBranch}
            placeholder="Semua cabang"
            options={branches.map((b) => ({ value: b.id, label: b.nama_cabang }))}
          />
        </Field>
        <Field label="Tanggal">
          <DatePickerField
            value={filterDate}
            onChange={setFilterDate}
            placeholder="Semua tanggal"
          />
        </Field>
        <Field label="Status">
          <CustomSelect
            value={filterStatus}
            onChange={setFilterStatus}
            placeholder="Semua status"
            options={[
              { value: 'pending', label: 'Pending' },
              { value: 'confirmed', label: 'Confirmed' },
              { value: 'cancelled', label: 'Cancelled' },
            ]}
          />
        </Field>
        <div className="flex items-end">
          <button
            onClick={() => {
              setFilterBranch('');
              setFilterDate('');
              setFilterStatus('');
            }}
            className="w-full rounded-lg border border-line px-4 py-2.5 text-sm text-body transition hover:text-ink"
          >
            Reset Filter
          </button>
        </div>
      </div>

      {error && <Alert message={error} />}

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-line bg-surface-secondary">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead>
            <tr className="border-b border-line text-xs uppercase tracking-wide text-muted">
              <th className="px-4 py-3 font-semibold">Customer</th>
              <th className="px-4 py-3 font-semibold">Cabang</th>
              <th className="px-4 py-3 font-semibold">Jadwal</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 text-right font-semibold">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-muted">
                  Memuat…
                </td>
              </tr>
            ) : bookings.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-muted">
                  Tidak ada booking ditemukan.
                </td>
              </tr>
            ) : (
              bookings.map((b) => (
                <tr key={b.id} className="border-b border-line/60 last:border-0 hover:bg-surface-tertiary/50">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-ink">{b.nama}</p>
                    {b.no_wa ? (
                      <a
                        href={`https://wa.me/${b.no_wa}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-copper hover:underline"
                      >
                        {b.no_wa}
                      </a>
                    ) : (
                      <span className="text-xs text-muted">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-body">{b.branches?.nama_cabang ?? '—'}</td>
                  <td className="px-4 py-3 text-body">
                    {formatDate(b.tanggal)}
                    <span className="text-muted"> · {b.jam_mulai}–{b.jam_selesai}</span>
                    <span className="ml-1 text-copper">· Kursi #{b.kursi}</span>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={b.status} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1.5">
                      {b.status !== 'cancelled' && (
                        <ActionButton
                          onClick={() => updateStatus(b.id, 'cancelled')}
                          className="text-amber-400 hover:bg-amber-500/10"
                        >
                          Batalkan
                        </ActionButton>
                      )}
                      <ActionButton
                        onClick={() => setEditing(b)}
                        className="text-copper hover:bg-copper/10"
                      >
                        Edit
                      </ActionButton>
                      <ActionButton
                        onClick={() => remove(b.id)}
                        className="text-red-400 hover:bg-red-500/10"
                      >
                        Hapus
                      </ActionButton>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <EditBookingModal
          booking={editing}
          branches={branches}
          onClose={() => setEditing(null)}
          onSaved={load}
        />
      )}
    </div>
  );
}

function EditBookingModal({
  booking,
  branches,
  onClose,
  onSaved,
}: {
  booking: BookingRow;
  branches: Branch[];
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [nama, setNama] = useState(booking.nama);
  const [noWa, setNoWa] = useState(booking.no_wa ?? '');
  const [branchId, setBranchId] = useState(booking.branch_id);
  const [tanggal, setTanggal] = useState(booking.tanggal);
  const [jamMulai, setJamMulai] = useState(booking.jam_mulai);
  const [kursi, setKursi] = useState(booking.kursi);
  const [status, setStatus] = useState<BookingStatus>(booking.status);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErr(null);
    try {
      // `no_wa` HARUS dikirim sebagai string kosong, bukan null.
      // Schema di /api/bookings/[id] memakai z.string().refine(...) yang
      // menolak null — mengirim null membuat setiap edit dengan nomor WA
      // dikosongkan gagal dengan 400. API sendiri yang mengubah '' -> null.
      await api(`/api/bookings/${booking.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          nama,
          no_wa: noWa,
          branch_id: branchId,
          tanggal,
          jam_mulai: jamMulai,
          kursi,
          status,
        }),
      });
      await onSaved();
      onClose();
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : 'Gagal menyimpan.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
      onClick={onClose}
    >
      <form
        onSubmit={handleSave}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-line bg-surface-secondary p-6"
      >
        <h2 className="font-display text-2xl font-bold uppercase italic">Edit Booking</h2>

        <div className="mt-5 space-y-4">
          <Field label="Nama">
            <input value={nama} onChange={(e) => setNama(e.target.value)} className={inputClass} />
          </Field>
          <Field label="No. WhatsApp">
            <input value={noWa} onChange={(e) => setNoWa(e.target.value)} className={inputClass} />
          </Field>
          <Field label="Cabang">
            <CustomSelect
              value={branchId}
              onChange={setBranchId}
              options={branches.map((b) => ({ value: b.id, label: b.nama_cabang }))}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Tanggal">
              <DatePickerField value={tanggal} onChange={setTanggal} />
            </Field>
            <Field label="Jam Mulai">
              <input type="time" step={1800} value={jamMulai} onChange={(e) => setJamMulai(e.target.value)} className={inputClass} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Kursi">
              <CustomSelect
                value={String(kursi)}
                onChange={(v) => setKursi(Number(v))}
                options={[
                  { value: '1', label: 'Kursi #1' },
                  { value: '2', label: 'Kursi #2' },
                ]}
              />
            </Field>
            <Field label="Status">
              <CustomSelect
                value={status}
                onChange={(v) => setStatus(v as BookingStatus)}
                options={[
                  { value: 'pending', label: 'Pending' },
                  { value: 'confirmed', label: 'Confirmed' },
                  { value: 'cancelled', label: 'Cancelled' },
                ]}
              />
            </Field>
          </div>
        </div>

        {err && <Alert message={err} />}

        <div className="mt-6 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-line px-4 py-2.5 text-sm text-body transition hover:text-ink"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#e04900] disabled:opacity-60"
          >
            {saving ? 'Menyimpan…' : 'Simpan'}
          </button>
        </div>
      </form>
    </div>
  );
}

/* ============================ SCHEDULE ============================ */

function SchedulePanel({ branches }: { branches: Branch[] }) {
  const [branchId, setBranchId] = useState('');
  const [date, setDate] = useState(todayWIB());
  const [data, setData] = useState<ScheduleData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (branches.length > 0 && !branchId) setBranchId(branches[0].id);
  }, [branches, branchId]);

  const load = useCallback(async () => {
    if (!branchId || !date) return;
    setLoading(true);
    setError(null);
    try {
      const r = await api<{ data: ScheduleData }>(
        `/api/schedule?branch_id=${branchId}&date=${date}`,
      );
      setData(r.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal memuat jadwal.');
    } finally {
      setLoading(false);
    }
  }, [branchId, date]);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleBlock(slot: ScheduleSlot) {
    setBusy(true);
    setError(null);
    const body = JSON.stringify({ branch_id: branchId, tanggal: date, jam_mulai: slot.jam_mulai });
    try {
      const hasBlocked = slot.booking.some((b) => b.nama === BLOCKED_BOOKING_NAME);
      if (hasBlocked) {
        // Buka blokir: hapus booking bertanda blokir.
        await api('/api/slots/block', { method: 'DELETE', body });
      } else if (slot.booking.length < 2) {
        // Blokir kursi yang masih kosong.
        await api('/api/slots/block', { method: 'POST', body });
      } else {
        // Slot sudah penuh oleh 2 booking asli — tidak ada aksi.
        setError('Slot sudah penuh (2 kursi).');
        return;
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal mengubah slot.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="mb-5 grid grid-cols-1 gap-3 rounded-xl border border-line bg-surface-secondary p-4 sm:grid-cols-3">
        <Field label="Cabang">
          <CustomSelect
            value={branchId}
            onChange={setBranchId}
            options={branches.map((b) => ({ value: b.id, label: b.nama_cabang }))}
          />
        </Field>
        <Field label="Tanggal">
          <DatePickerField value={date} onChange={setDate} />
        </Field>
        <div className="flex items-end">
          <button
            onClick={load}
            disabled={loading}
            className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#e04900] disabled:opacity-60"
          >
            {loading ? 'Memuat…' : 'Muat Jadwal'}
          </button>
        </div>
      </div>

      {error && <Alert message={error} />}

      {data && (
        <>
          <div className="mb-5 grid grid-cols-3 gap-3">
            <Stat label="Total Slot" value={data.total_slots} />
            <Stat label="Terisi" value={data.filled} accent="text-emerald-400" />
            <Stat label="Kosong" value={data.empty} accent="text-accent" />
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {data.slots.map((slot) => (
              <button
                key={slot.jam_mulai}
                onClick={() => toggleBlock(slot)}
                disabled={busy}
                className={`group rounded-xl border p-4 text-left transition disabled:opacity-60 ${
                  slot.terisi
                    ? 'border-line bg-surface-secondary'
                    : 'border-accent/30 bg-accent/5 hover:border-accent'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-display text-lg font-bold tracking-tight">
                    {slot.jam_mulai}
                  </span>
                  <span
                    className={`h-2 w-2 rounded-full ${
                      slot.terisi ? 'bg-muted' : 'bg-accent'
                    }`}
                  />
                </div>
                <p className="text-xs text-muted">s/d {slot.jam_selesai}</p>

                {slot.terisi ? (
                  <div className="mt-2 space-y-1.5 text-xs">
                    {slot.booking.map((b) => (
                      <div key={b.id} className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-ink">{b.nama}</p>
                          {b.no_wa && <p className="truncate text-muted">{b.no_wa}</p>}
                        </div>
                        <span className="shrink-0 rounded bg-copper/15 px-1.5 py-0.5 text-[0.65rem] font-semibold text-copper">
                          #{b.kursi}
                        </span>
                      </div>
                    ))}
                    {slot.booking.length < 2 && (
                      <p className="text-body">Klik untuk blokir kursi kosong</p>
                    )}
                  </div>
                ) : (
                  <p className="mt-2 text-xs text-body">Kosong — klik untuk blokir</p>
                )}

                {slot.terisi && (
                  <p className="mt-2 text-[0.65rem] font-semibold uppercase tracking-wide text-red-400 opacity-0 transition group-hover:opacity-100">
                    Klik untuk buka blokir / lihat
                  </p>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ============================ UI HELPERS ============================ */

const inputClass =
  'w-full rounded-lg border border-line bg-surface-tertiary px-3.5 py-2.5 text-sm text-ink outline-none transition placeholder:text-muted focus:border-accent focus:ring-2 focus:ring-accent/30';

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

function StatusBadge({ status }: { status: BookingStatus }) {
  const meta = STATUS_META[status];
  return (
    <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-semibold ${meta.className}`}>
      {meta.label}
    </span>
  );
}

function ActionButton({
  onClick,
  className,
  children,
}: {
  onClick: () => void;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-md px-2.5 py-1.5 text-xs font-semibold transition ${className ?? ''}`}
    >
      {children}
    </button>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: string;
}) {
  return (
    <div className="rounded-xl border border-line bg-surface-secondary p-4">
      <p className="text-xs uppercase tracking-wide text-muted">{label}</p>
      <p className={`mt-1 font-display text-3xl font-bold ${accent ?? 'text-ink'}`}>{value}</p>
    </div>
  );
}

function Alert({ message }: { message: string }) {
  return (
    <p className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
      {message}
    </p>
  );
}
