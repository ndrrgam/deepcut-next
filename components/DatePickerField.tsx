'use client';

import { useMemo } from 'react';
import { parseDate, type CalendarDate } from '@internationalized/date';
import {
  Button,
  Dialog,
  DialogTrigger,
  Popover,
} from 'react-aria-components';
import { DCCalendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

/* ================================================================
   DatePickerField — input tanggal bergaya DEEP CUT yang membuka
   Calendar (react-aria) dengan dropdown bulan/tahun.
   Nilai tetap string YYYY-MM-DD agar kompatibel dengan form/API.
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
export function formatTanggal(value: string): string {
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
      className="h-4 w-4 shrink-0 text-muted transition-colors group-data-[open=true]:text-accent"
      aria-hidden="true"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}

interface DatePickerFieldProps {
  value: string;
  onChange: (value: string) => void;
  /** Batas minimum (format YYYY-MM-DD). */
  min?: string;
  /** Batas maksimum (format YYYY-MM-DD). */
  max?: string;
  id?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export default function DatePickerField({
  value,
  onChange,
  min,
  max,
  id,
  placeholder = 'Pilih tanggal',
  disabled = false,
  className = '',
}: DatePickerFieldProps) {
  const display = formatTanggal(value);

  const calendarValue = useMemo<CalendarDate | null>(() => {
    if (!value) return null;
    try {
      return parseDate(value);
    } catch {
      return null;
    }
  }, [value]);

  const minDate = useMemo<CalendarDate | undefined>(() => {
    if (!min) return undefined;
    try {
      return parseDate(min);
    } catch {
      return undefined;
    }
  }, [min]);

  const maxDate = useMemo<CalendarDate | undefined>(() => {
    if (!max) return undefined;
    try {
      return parseDate(max);
    } catch {
      return undefined;
    }
  }, [max]);

  return (
    <DialogTrigger>
      <Button
        id={id}
        isDisabled={disabled}
        className={cn(
          'group flex w-full items-center justify-between gap-3 rounded-lg border border-line bg-surface-tertiary px-3.5 py-2.5 text-left text-sm text-ink outline-none transition-colors',
          'hover:border-accent/50',
          'focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/30',
          'data-[open=true]:border-accent data-[open=true]:ring-2 data-[open=true]:ring-accent/30',
          'disabled:pointer-events-none disabled:opacity-60',
          'pressed:bg-surface-secondary',
          className,
        )}
      >
        <span className={`truncate ${display ? 'text-ink' : 'text-muted'}`}>
          {display || placeholder}
        </span>
        <CalendarIcon />
      </Button>

      <Popover
        offset={8}
        className="rounded-lg border border-line bg-surface-secondary p-1 shadow-2xl shadow-black/60 outline-none"
      >
        <Dialog className="outline-none">
          <DCCalendar
            aria-label={placeholder}
            value={calendarValue}
            onChange={(date) => onChange(date ? date.toString() : '')}
            minValue={minDate}
            maxValue={maxDate}
            captionLayout="dropdown"
            headerFormat={{
              month: 'long',
              year: 'numeric',
            }}
          />
        </Dialog>
      </Popover>
    </DialogTrigger>
  );
}
