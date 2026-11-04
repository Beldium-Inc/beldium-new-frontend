/**
 * A declaration is signed with the signer's full name, exactly as recorded.
 *
 * Mirrors compliance/signatory.py on the API, which refuses a mismatch on
 * save and again on submit. Only spaces at either end and repeated spaces
 * inside the name are ignored; letter case and spelling must match.
 */

export function normaliseName(value: string | null | undefined): string {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

export function namesMatch(signed: string, fullName: string): boolean {
  const expected = normaliseName(fullName);
  return expected !== "" && normaliseName(signed) === expected;
}

/** Why `signed` is not accepted, or null when it matches `fullName`. */
export function signatoryMismatch(signed: string, fullName: string, whose: string): string | null {
  if (namesMatch(signed, fullName)) return null;
  const expected = normaliseName(fullName);
  if (!expected) return `Enter ${whose} first. The signatory name must match it exactly.`;
  return `The signatory name must match ${whose} exactly: ${expected}.`;
}
