/**
 * Helper waktu berbasis WIB (Asia/Jakarta) yang independen dari timezone
 * server. Menggunakan Intl agar tidak bergantung pada konfigurasi OS.
 */

const WIB_TIME_ZONE = 'Asia/Jakarta';

export interface WIBParts {
  /** Tanggal WIB dalam format YYYY-MM-DD */
  date: string;
  /** Jam WIB dalam format HH:mm */
  time: string;
}

export function getWIBParts(): WIBParts {
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: WIB_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });

  const parts = formatter.formatToParts(new Date());
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';

  return {
    date: `${get('year')}-${get('month')}-${get('day')}`,
    time: `${get('hour')}:${get('minute')}`,
  };
}

/** Tanggal hari ini dalam WIB (YYYY-MM-DD). */
export function todayWIB(): string {
  return getWIBParts().date;
}
