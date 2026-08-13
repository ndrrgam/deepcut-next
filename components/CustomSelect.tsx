'use client';

import { useEffect, useRef, useState } from 'react';

/* ================================================================
   Custom dropdown yang sesuai design system DEEP CUT
   (dark, accent orange, Barlow Condensed) — pengganti <select> native.
   ================================================================ */

export interface SelectOption {
  value: string;
  label: string;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  /** Ditampilkan saat `value === ''`. */
  placeholder?: string;
  disabled?: boolean;
  /** Class untuk tombol trigger. */
  className?: string;
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`h-4 w-4 shrink-0 text-muted transition-transform duration-200 ${open ? 'rotate-180 text-accent' : ''}`}
      aria-hidden="true"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export default function CustomSelect({
  value,
  onChange,
  options,
  placeholder = '— Pilih —',
  disabled = false,
  className = '',
}: CustomSelectProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value);

  /* Tutup dropdown saat klik di luar */
  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent | TouchEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
    };
  }, [open]);

  /* Tutup dengan tombol Escape */
  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open]);

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`flex w-full items-center justify-between gap-3 rounded-lg border border-line bg-surface-tertiary px-3.5 py-2.5 text-left text-sm transition-colors ${
          disabled
            ? 'cursor-not-allowed opacity-60'
            : 'hover:border-accent/50 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30'
        }`}
      >
        <span className={`truncate ${selected ? 'text-ink' : 'text-muted'}`}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronIcon open={open} />
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute left-0 right-0 top-[calc(100%+6px)] z-30 max-h-64 overflow-y-auto rounded-lg border border-line bg-surface-secondary py-1 shadow-2xl shadow-black/60 animate-[dropfade_0.16s_ease-out]"
        >
          {options.length === 0 && (
            <li className="px-3.5 py-2.5 text-sm text-muted">Tidak ada pilihan</li>
          )}
          {options.map((o) => {
            const active = o.value === value;
            return (
              <li key={o.value} role="option" aria-selected={active}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(o.value);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center justify-between px-3.5 py-2.5 text-left text-sm transition-colors ${
                    active
                      ? 'bg-accent/15 text-accent'
                      : 'text-body hover:bg-surface-tertiary hover:text-ink'
                  }`}
                >
                  <span className="truncate">{o.label}</span>
                  {active && (
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2.5}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-4 w-4 shrink-0"
                      aria-hidden="true"
                    >
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
