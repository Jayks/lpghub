/**
 * Normalise a raw phone string to E.164 format for India (+91XXXXXXXXXX).
 *
 * Accepts:
 *   - 10-digit number            → +91XXXXXXXXXX
 *   - +91XXXXXXXXXX              → unchanged
 *   - 91XXXXXXXXXX (12 digits)   → +91XXXXXXXXXX
 *   - anything else              → best-effort: prepend +
 */
export function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("91") && digits.length === 12) return `+${digits}`;
  if (digits.length === 10) return `+91${digits}`;
  return `+${digits}`;
}

/** Return true if the value looks like a valid Indian mobile number in E.164. */
export function isValidIndianPhone(value: string): boolean {
  return /^\+91[6-9]\d{9}$/.test(value);
}
