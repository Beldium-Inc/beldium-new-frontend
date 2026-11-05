import type { DemoUser, Role } from "./types";

export type Environment = "operations" | "verification" | "oversight";
export type Permission = "view" | "review" | "operate" | "request" | "respond";
export interface Membership {
  id: string;
  organization: string;
  sector: string;
  role: Role;
  environment: Environment;
  permissions: Permission[];
  facilities?: string[];
}
export interface VerificationRecord {
  id: string;
  subject: string;
  requirement: string;
  evidence: string;
  source: string;
  method: string;
  officer: string;
  at: string;
  findings: string;
  decision: "accepted" | "information_requested" | "deficiency" | "rejected";
  scope: string;
  nextReview: string;
  simulated: true;
  audit: { at: string; actor: string; action: string }[];
}
export type VerificationInput = Omit<VerificationRecord, "id" | "officer" | "at" | "simulated" | "audit">;

export function membershipsFor(user: DemoUser | null): Membership[] {
  if (!user) return [];
  if (user.memberships) return user.memberships;
  // Only explicitly provisioned demonstration identities receive delegated authority.
  const environment: Environment = user.id === "u-op" ? "verification" : user.id === "u-re" ? "oversight" : "operations";
  if (user.role === "regulator" && user.id !== "u-re") return [];
  return [{ id: `membership-${user.id}`, organization: user.org, sector: "Quality & Control", role: user.role, environment,
    permissions: environment === "verification" ? ["view", "review"] : environment === "oversight" ? ["view"] : user.role === "buyer" ? ["view"] : ["view", "operate", "request", "respond"] }];
}
export function can(user: DemoUser | null, permission: Permission, organization?: string, facility?: string, sector = "Quality & Control") {
  return membershipsFor(user).some((m) => m.sector === sector && m.permissions.includes(permission) &&
    (m.environment !== "operations" || !organization || m.organization === organization) &&
    (!facility || !m.facilities?.length || m.facilities.includes(facility)));
}
export function canReview(user: DemoUser | null, subjectOrganization: string) {
  return can(user, "review") && !membershipsFor(user).some((m) => m.organization === subjectOrganization);
}
export function environmentFor(user: DemoUser | null) {
  return membershipsFor(user)[0]?.environment;
}
export function canAccessPath(user: DemoUser | null, path: string) {
  if (!user) return false;
  if (path === "/application-status") return true;
  if (!can(user, "view")) return false;
  if (path.startsWith("/applications") || path.startsWith("/compliance-review") || path === "/audit") return environmentFor(user) !== "operations";
  return true;
}
export function makeVerification(input: VerificationInput, officer: string): VerificationRecord {
  if (![input.subject, input.requirement, input.evidence, input.source, input.method, input.findings, input.scope].every((v) => v.trim())) throw new Error("Complete the verification evidence and scope.");
  const at = new Date().toISOString();
  return { ...input, id: `verification-${crypto.randomUUID()}`, officer, at, simulated: true, audit: [{ at, actor: officer, action: "Simulated source verification recorded" }] };
}