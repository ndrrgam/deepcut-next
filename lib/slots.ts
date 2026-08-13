import {
  CLOSE_TIME,
  MIN_LEAD_HOURS,
  OPEN_TIME,
  SLOT_INTERVAL_MINUTES,
} from './constants';
import { getWIBParts } from './datetime';

export interface Slot {
  jam_mulai: string;
  jam_selesai: string;
}

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

function toHHMM(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Daftar semua slot booking dalam rentang operasional.
 * Contoh: 10:00–10:30, 10:30–11:00, ..., 19:30–20:00.
 */
export function generateSlots(): Slot[] {
  const slots: Slot[] = [];
  const open = toMinutes(OPEN_TIME);
  const close = toMinutes(CLOSE_TIME);

  for (let t = open; t < close; t += SLOT_INTERVAL_MINUTES) {
    slots.push({
      jam_mulai: toHHMM(t),
      jam_selesai: toHHMM(t + SLOT_INTERVAL_MINUTES),
    });
  }

  return slots;
}

/** True jika `jam_mulai` adalah salah satu slot mulai yang valid. */
export function isValidSlot(jam_mulai: string): boolean {
  return generateSlots().some((s) => s.jam_mulai === jam_mulai);
}

/** Hitung jam_selesai dari jam_mulai + interval slot. */
export function jamSelesai(jam_mulai: string): string {
  return toHHMM(toMinutes(jam_mulai) + SLOT_INTERVAL_MINUTES);
}

/**
 * True jika slot pada `tanggal` + `jam_mulai` masih boleh dibooking:
 * - tanggal tidak boleh lewat,
 * - untuk tanggal hari ini, minimal MIN_LEAD_HOURS sebelum jam mulai.
 */
export function isSlotBookable(tanggal: string, jam_mulai: string): boolean {
  const now = getWIBParts();

  if (tanggal < now.date) return false; // tanggal sudah lewat
  if (tanggal > now.date) return true; // tanggal di masa depan

  // Tanggal hari ini: harus >= MIN_LEAD_HOURS sebelum jam mulai
  return toMinutes(jam_mulai) - toMinutes(now.time) >= MIN_LEAD_HOURS * 60;
}
