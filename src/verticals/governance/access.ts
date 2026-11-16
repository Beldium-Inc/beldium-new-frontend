import type { GovernanceRole } from "@/lib/api";

// Two small pieces of glue between the governance pages and the shared
// sign-in: which sign-in seat a governance role lands on, and a governance
// invitation token parked while its recipient signs in.

/** The sign-in seat (see lib/verticals.ts) for a server-side governance role. */
export function governanceSeat(role: GovernanceRole): "internal" | "external" {
  return role === "reviewer" || role === "viewer" ? "external" : "internal";
}

const KEY = "beldium.governanceInvitation.v1";

export function rememberGovernanceInvitation(token: string): void {
  try {
    localStorage.setItem(KEY, token);
  } catch {
    /* private mode: the emailed link can be opened again */
  }
}

export function pendingGovernanceInvitation(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function clearGovernanceInvitation(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
