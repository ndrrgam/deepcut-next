/**
 * Validasi nomor WhatsApp Indonesia.
 * Format yang diterima: 08xxxxxxxxxx, +628xxxxxxxxxx, atau 628xxxxxxxxxx.
 */

const ID_PHONE_REGEX = /^(?:\+?62|0)8\d{7,11}$/;

/** True jika input adalah nomor HP Indonesia yang valid. */
export function isValidIndonesianPhone(input: string): boolean {
  return normalizePhone(input) !== null;
}

/**
 * Normalisasi nomor ke bentuk kanonikal `62xxxxxxxxxx`
 * (tanpa tanda `+` dan tanpa leading `0`). Mengembalikan null jika tidak valid.
 */
export function normalizePhone(input: string): string | null {
  let digits = input.replace(/[\s\-().]/g, '');

  if (!ID_PHONE_REGEX.test(digits)) return null;

  if (digits.startsWith('0')) {
    digits = '62' + digits.slice(1);
  } else if (digits.startsWith('+')) {
    digits = digits.slice(1);
  }

  return digits;
}
