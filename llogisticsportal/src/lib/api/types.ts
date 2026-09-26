// Shapes returned by the Django API. Field names are the backend's, so these
// stay a faithful mirror of the DRF serialisers rather than a re-spelling.
// Copied from Miner Hub so both portals speak the same auth/organisation shapes.

export type UUID = string;
/** ISO-8601 timestamp. */
export type Timestamp = string;

export type OrganisationType =
  | "mining_company"
  | "compliance_partner"
  | "regulator"
  | "laboratory"
  | "inspection_body"
  /** Not in organisations.models.OrganisationType yet; see lib/api/README.md. */
  | "logistics_company";

export type MembershipRole =
  | "owner"
  | "admin"
  | "reviewer"
  | "inspector"
  | "member"
  | "compliance_manager"
  | "mining_compliance_officer"
  | "mining_engineer"
  | "geologist"
  | "environmental_specialist"
  | "hse_specialist"
  | "legal_regulatory_specialist"
  | "analyst"
  | "read_only"
  | "other";

export type VerificationStatus = "draft" | "under_review" | "verified" | "rejected" | "suspended";

export type JoinRequestStatus = "pending" | "approved" | "rejected" | "cancelled";

export interface User {
  id: UUID;
  email: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  country: string;
  onboarding_role: string;
  /** Null until the signup code is consumed. The API is the authority on this. */
  email_verified_at: Timestamp | null;
  /** Null until a phone OTP is confirmed. Separate from email verification. */
  phone_verified_at: Timestamp | null;
  is_staff: boolean;
  created_at: Timestamp;
}

export interface Organisation {
  id: UUID;
  /** Server-issued reference, `BLD-ORG-<year>-<hex>`. Null on rows predating it. */
  beldium_id: string | null;
  name: string;
  organisation_type: OrganisationType;
  registration_number: string;
  tax_identifier: string;
  email: string;
  phone_number: string;
  website: string;
  address: string;
  country: string;
  state: string;
  verification_status: VerificationStatus;
  submitted_at: Timestamp | null;
  verified_at: Timestamp | null;
  rejection_reason: string;
  /** The signed-in user's role here, or null when they are not a member. */
  my_role: MembershipRole | null;
  member_count: number;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface OrganisationMembership {
  id: UUID;
  user: User;
  role: MembershipRole;
  title: string;
  is_active: boolean;
  created_at: Timestamp;
}

export interface OrganisationInvitation {
  id: UUID;
  organisation: UUID;
  email: string;
  role: MembershipRole;
  token: string;
  expires_at: Timestamp;
  accepted_at: Timestamp | null;
  revoked_at: Timestamp | null;
  created_at: Timestamp;
}

export interface JoinRequest {
  id: UUID;
  organisation: UUID;
  organisation_name: string;
  requester: User;
  requested_role: MembershipRole;
  justification: string;
  status: JoinRequestStatus;
  decision_notes: string;
  decided_at: Timestamp | null;
  created_at: Timestamp;
}

/** DRF PageNumberPagination envelope. */
export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export const ORGANISATION_TYPE_LABELS: Record<OrganisationType, string> = {
  mining_company: "Mining company",
  compliance_partner: "Compliance partner",
  regulator: "Regulator",
  laboratory: "Laboratory",
  inspection_body: "Inspection body",
  logistics_company: "Logistics company",
};

export const MEMBERSHIP_ROLE_LABELS: Record<MembershipRole, string> = {
  owner: "Owner",
  admin: "Administrator",
  reviewer: "Reviewer",
  inspector: "Inspector",
  member: "Member",
  compliance_manager: "Compliance Manager",
  mining_compliance_officer: "Mining Compliance Officer",
  mining_engineer: "Mining Engineer",
  geologist: "Geologist",
  environmental_specialist: "Environmental Specialist",
  hse_specialist: "HSE Specialist",
  legal_regulatory_specialist: "Legal / Regulatory Specialist",
  analyst: "Analyst",
  read_only: "Read Only User",
  other: "Other",
};

/** Roles an organisation administrator may hold. */
export const ORGANISATION_ADMIN_ROLES: MembershipRole[] = ["owner", "admin"];

export const JOIN_REQUEST_STATUS_LABELS: Record<JoinRequestStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Declined",
  cancelled: "Cancelled",
};

export function fullName(user: Pick<User, "first_name" | "last_name" | "email">): string {
  const name = `${user.first_name} ${user.last_name}`.trim();
  return name || user.email;
}
