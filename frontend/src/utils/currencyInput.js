/**
 * formatNumberInput — Format angka dengan titik pemisah ribuan saat user mengetik
 * Contoh: "150000" → "150.000", "1250000" → "1.250.000"
 *
 * @param {string|number} value — Raw number string (bisa sudah mengandung titik)
 * @returns {string} — Formatted string dengan titik pemisah ribuan
 */
export const formatNumberInput = (value) => {
  if (value === null || value === undefined) return '';
  // Strip semua karakter bukan digit
  const digits = String(value).replace(/[^\d]/g, '');
  if (!digits) return '';
  // Format dengan titik sebagai pemisah ribuan (Indonesian style)
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

/**
 * parseNumberInput — Ambil angka mentah dari string terformat
 * Contoh: "1.250.000" → 1250000, "150.000" → 150000
 *
 * @param {string} value — Formatted number string dengan titik
 * @returns {number} — Parsed number (0 jika kosong/invalid)
 */
export const parseNumberInput = (value) => {
  if (!value) return 0;
  const digits = String(value).replace(/[^\d]/g, '');
  return digits ? Number(digits) : 0;
};