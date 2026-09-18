// The backend requires E.164 (`^\+[1-9]\d{7,14}$`, see accounts/serializers.py),
// but miners type numbers in whatever local format is natural to them. This
// normalises common Nigerian formats to E.164 so the field never has to show
// a validation error for something the user typed correctly by local
// convention.

const DEFAULT_COUNTRY_CODE = "234";

/**
 * Turn a phone number typed in any common format into E.164.
 *  - "08012345678" (11-digit local, leading 0)      -> "+2348012345678"
 *  - "8012345678" (10-digit local, no leading 0)     -> "+2348012345678"
 *  - "2348012345678" (country code, no +)            -> "+2348012345678"
 *  - "+2348012345678" (already E.164)                -> unchanged
 * Anything else is returned with non-digits stripped and a leading "+",
 * since the backend only ever rejects a missing "+" or a leading zero.
 */
export function formatPhoneNumber(raw: string): string {
  const hadPlus = raw.trim().startsWith("+");
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";

  if (hadPlus) return `+${digits.replace(/^0+/, "")}`;

  if (digits.length === 11 && digits.startsWith("0")) {
    return `+${DEFAULT_COUNTRY_CODE}${digits.slice(1)}`;
  }
  if (digits.length === 10) {
    return `+${DEFAULT_COUNTRY_CODE}${digits}`;
  }
  if (digits.startsWith(DEFAULT_COUNTRY_CODE) && digits.length === 13) {
    return `+${digits}`;
  }
  // Already looks like <country code><number>, e.g. a non-Nigerian number.
  if (digits.length >= 8 && digits.length <= 15) {
    return `+${digits}`;
  }
  return `+${digits}`;
}

/** True once the value matches the backend's E.164 rule. */
export function isValidPhoneNumber(value: string): boolean {
  return /^\+[1-9]\d{7,14}$/.test(value);
}
