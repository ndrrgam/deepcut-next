/**
 * Sumber tunggal nomor WhatsApp yang menerima booking.
 *
 * Sebelumnya nomor ini di-hardcode di DUA tempat yang tidak saling
 * terhubung:
 *   - `lib/content.ts` (DEFAULT_CONTENT.contact.wa_number)
 *   - `components/BookingForm.tsx` (ADMIN_WA_NUMBER)
 *
 * Akibatnya mengubah nomor lewat panel admin (tab Konten) hanya mengubah
 * tautan di halaman, sementara form booking tetap mengirim ke nomor lama.
 *
 * Nilai default di sini dipakai bila admin belum pernah menyimpan konten.
 * Konten dari database tetap menang bila tersedia, lewat
 * `resolveBookingWa()`.
 */

/** Nomor default (format internasional tanpa '+'). */
export const DEFAULT_WHATSAPP_NUMBER = '6287741445773';

/** Normalisasi nomor ke bentuk yang diterima wa.me (hanya digit). */
export function toWaLinkNumber(input: string | null | undefined): string {
  const digits = (input ?? '').replace(/\D/g, '');
  if (!digits) return DEFAULT_WHATSAPP_NUMBER;

  // 08xxx -> 628xxx
  if (digits.startsWith('0')) return '62' + digits.slice(1);
  // 8xxx -> 628xxx
  if (digits.startsWith('8')) return '62' + digits;
  return digits;
}

/**
 * Tentukan nomor WA tujuan booking.
 *
 * Prioritas: nilai dari konten landing (database) -> default.
 * Dipakai form booking supaya nomor yang tampil di halaman dan nomor yang
 * menerima pesan selalu identik.
 */
export function resolveBookingWa(
  contentNumber?: string | null,
): string {
  return toWaLinkNumber(contentNumber) || DEFAULT_WHATSAPP_NUMBER;
}

/** Bangun URL wa.me lengkap dengan pesan opsional. */
export function waLink(number: string, message?: string): string {
  const base = `https://wa.me/${toWaLinkNumber(number)}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}
