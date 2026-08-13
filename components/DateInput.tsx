'use client';

/* ================================================================
   Custom input tanggal yang sesuai design system DEEP CUT
   (dark, accent orange) — pengganti <input type="date"> native.
   Menampilkan tanggal dalam format Indonesia dan membuka kalender
   native browser saat diklik.
   ================================================================ */

const BULAN = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

/** "2026-08-13" -> "Kamis, 13 Agustus 2026" */
function formatTanggal(value: string): string {
  if (!value) return '';
  const [y, m, d] = value.split('-').map(Number);
  if (!y || !m || !d) return '';
  const date = new Date(y, m - 1, d);
  const hari = HARI[date.getDay()];
  return `${hari}, ${d} ${BULAN[m - 1]} ${y}`;
}

function CalendarIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4 shrink-0 text-muted"
      aria-hidden="true"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}

interface DateInputProps {
  value: string;
  onChange: (value: string) => void;
  /** Batas minimum (format YYYY-MM-DD). */
  min?: string;
  id?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export default function DateInput({
  value,
  onChange,
  min,
  id,
  placeholder = 'Pilih tanggal',
  disabled = false,
  className = '',
}: DateInputProps) {
  const display = formatTanggal(value);

  return (
    <div className={`group relative ${className}`}>
      {/* Tampilan custom (di belakang input native) */}
      <div
        className={`pointer-events-none flex w-full items-center justify-between gap-3 rounded-lg border border-line bg-surface-tertiary px-3.5 py-2.5 text-sm transition-colors group-hover:border-accent/50 group-focus-within:border-accent group-focus-within:ring-2 group-focus-within:ring-accent/30 ${
          disabled ? 'opacity-60' : ''
        }`}
      >
        <span className={`truncate ${display ? 'text-ink' : 'text-muted'}`}>
          {display || placeholder}
        </span>
        <CalendarIcon />
      </div>

      {/* Input native transparan di atas untuk membuka kalender & menyimpan nilai */}
      <input
        id={id}
        type="date"
        value={value}
        min={min}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        onClick={(e) => {
          const input = e.currentTarget as HTMLInputElement;
          try {
            input.showPicker?.();
          } catch {
            /* browser tidak mendukung showPicker — biarkan perilaku native */
          }
        }}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        aria-label={placeholder}
      />
    </div>
  );
}
