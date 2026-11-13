// Join codes: the eight-character code an organisation administrator shares
// so colleagues can ask to join. Same scheme as the compliance app.

const PENDING_CODE_KEY = "beldium.miner.pendingJoinCode";

/** Letters and digits only, upper case, at most eight. */
export function cleanJoinCode(value: string): string {
  return value
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 8);
}

/** Show the code the way it is printed: two groups of four. */
export function formatJoinCode(value: string): string {
  const clean = cleanJoinCode(value);
  return clean.length > 4 ? `${clean.slice(0, 4)}-${clean.slice(4)}` : clean;
}

/**
 * Someone who opens a join link before they have an account goes through
 * signup and email verification first. The code is kept here so the join page
 * still has it when they come back.
 */
export function readPendingJoinCode(): string {
  try {
    return window.localStorage.getItem(PENDING_CODE_KEY) ?? "";
  } catch {
    return "";
  }
}

export function writePendingJoinCode(code: string | null) {
  try {
    if (code) window.localStorage.setItem(PENDING_CODE_KEY, cleanJoinCode(code));
    else window.localStorage.removeItem(PENDING_CODE_KEY);
  } catch {
    // Storage can be blocked; the person can still type the code in.
  }
}

/** The Miner Hub's own join link, so a colleague lands here and not on the compliance app. */
export function minerJoinLink(code: string): string {
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  return `${origin}/join?code=${cleanJoinCode(code)}`;
}
