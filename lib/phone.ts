/**
 * Normalize a Pakistani mobile number to a canonical 11-digit string:
 *   "0300-8632334"  → "03008632334"
 *   "+923008632334" → "03008632334"
 *   "923008632334"  → "03008632334"
 *   "03008632334"   → "03008632334"
 *
 * Called on every read and write so save/load always use the same key.
 */
export function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, ''); // strip everything except digits
  // International prefix 92 → local 0 prefix
  if (digits.startsWith('92') && digits.length >= 12) {
    return '0' + digits.slice(2);
  }
  return digits;
}
