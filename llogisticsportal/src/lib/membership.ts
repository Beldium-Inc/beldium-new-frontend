import type { JoinRequest, MembershipRole } from "./api/types";

// Logistics membership on top of the generic organisation join-request API.
//
// The backend's MembershipRole has no logistics "manager" or "driver" value
// and a join request cannot link to a registered driver, so the portal:
//  - sends `requested_role: "member"` and states the logistics role on the
//    first line of the justification, and
//  - records the linked driver on the first line of the decision notes.
// Both are plain text the server stores, so the organisation, the requester
// and reviewers all see them. See docs/logistics-backend-gaps.md.

export type LogisticsMemberRole = "manager" | "driver";

export const MEMBER_ROLE_LABELS: Record<LogisticsMemberRole, string> = {
  manager: "Fleet / operations manager",
  driver: "Driver / transport personnel",
};

const ROLE_PREFIX = "Requested role: ";
const DRIVER_PREFIX = "Linked driver: ";

export const API_ROLE: MembershipRole = "member";

export function encodeJustification(role: LogisticsMemberRole, message: string) {
  return `${ROLE_PREFIX}${MEMBER_ROLE_LABELS[role]}\n\n${message.trim()}`;
}

/** The requested logistics role and the requester's own message. */
export function decodeJustification(text: string): {
  role: LogisticsMemberRole | null;
  message: string;
} {
  const [first = "", ...rest] = text.split("\n");
  if (!first.startsWith(ROLE_PREFIX)) return { role: null, message: text };
  const label = first.slice(ROLE_PREFIX.length).trim();
  const role =
    (Object.entries(MEMBER_ROLE_LABELS).find(([, l]) => l === label)?.[0] as LogisticsMemberRole) ??
    null;
  return { role, message: rest.join("\n").trim() };
}

export function encodeDecision(driver: { id: string; name: string } | null, notes: string) {
  const line = driver ? `${DRIVER_PREFIX}${driver.name} [${driver.id}]` : "";
  return [line, notes.trim()].filter(Boolean).join("\n\n");
}

export function decodeDecision(text: string): {
  driver: { id: string; name: string } | null;
  notes: string;
} {
  const [first = "", ...rest] = text.split("\n");
  const match = first.startsWith(DRIVER_PREFIX)
    ? /^(.*) \[([^\]]+)\]$/.exec(first.slice(DRIVER_PREFIX.length))
    : null;
  if (!match) return { driver: null, notes: text };
  return { driver: { name: match[1] ?? "", id: match[2] ?? "" }, notes: rest.join("\n").trim() };
}

export const JOIN_STATUS_LABELS: Record<JoinRequest["status"], string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Declined",
  cancelled: "Cancelled",
};
