// Shapes returned by the Django API. Field names are the backend's, so these
// stay a faithful mirror of the DRF serialisers rather than a re-spelling.

export type UUID = string;
/** ISO-8601 timestamp. */
export type Timestamp = string;

export type OrganisationType =
  "mining_company" | "compliance_partner" | "regulator" | "laboratory" | "inspection_body";

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
};

/** All fifteen roles the backend's MembershipRole defines, labelled as it labels them. */
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

// ---------------------------------------------------------------------------
// Compliance
//
// These mirror compliance/serializers.py. The seven section payloads are the
// backend's `data` objects verbatim: each section PATCH validates the whole
// object, so a partial save is not possible and every required key below must
// be sent on every write.
// ---------------------------------------------------------------------------

export type ApplicationStatus =
  "draft" | "under_review" | "action_required" | "conditionally_approved" | "verified" | "rejected";

export type DocumentStatus = "requested" | "submitted" | "verified" | "rejected";

/** `document_requirements` reports this for a type with no upload yet. */
export type DocumentRequirementStatus = DocumentStatus | "not_submitted";

export interface OrganisationProfileData {
  name: string;
  organisation_type: OrganisationType;
  registration_number: string;
  tax_identifier: string;
  year_established: number;
  website?: string;
  registered_address: string;
  operating_address: string;
  country?: string;
  state: string;
  lga: string;
}

export interface RepresentativeData {
  full_name: string;
  position: string;
  official_email: string;
  /** E.164; the backend regex is `^\+[1-9]\d{7,14}$`. */
  official_phone: string;
  /** Must be true or the section is rejected. */
  authorised: boolean;
}

export interface ServicesData {
  selected_services: string[];
  geographic_coverage: "nationwide" | "selected_states";
  states_covered?: string[];
}

export interface ProfessionalCapabilityData {
  years_mining_experience: number;
  compliance_professionals?: number;
  mining_engineers?: number;
  geologists?: number;
  environmental_specialists?: number;
  hse_specialists?: number;
  legal_regulatory_specialists?: number;
  field_inspectors?: number;
  other_technical_personnel?: number;
}

export interface InspectionCapabilityData {
  conducts_physical_inspections: boolean;
  active_inspectors?: number;
  maximum_inspections_per_month?: number;
  average_turnaround_time?: string;
  typical_mobilisation_time?: string;
  equipment?: Record<string, unknown>;
  inspection_evidence_standards?: string[];
}

export interface ConflictDeclarationData {
  owns_assets: boolean;
  serves_mining_companies: boolean;
  trades_minerals: boolean;
  relationships: string;
  /** Must be true or the section is rejected. */
  agreed: boolean;
}

export interface DeclarationData {
  accuracy_confirmed: boolean;
  documents_genuine: boolean;
  compliance_agreed: boolean;
  disclose_changes: boolean;
  authorised: boolean;
  confirmed: boolean;
  signatory_name?: string;
  signatory_position?: string;
  /** ISO date (YYYY-MM-DD). */
  declaration_date?: string;
}

export interface Personnel {
  id: UUID;
  full_name: string;
  role: string;
  discipline: string;
  qualification: string;
  years_experience: number;
  registration_number: string;
  /** Absolute URL, or null when nothing was uploaded. */
  cv_url: string | null;
  certificate_url: string | null;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface ComplianceDocument {
  id: UUID;
  document_type: string;
  title: string;
  file_url: string | null;
  original_name: string;
  status: DocumentStatus;
  request_message: string;
  review_notes: string;
  reviewed_at: Timestamp | null;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface DocumentRequirement {
  document_type: string;
  title: string;
  required: boolean;
  status: DocumentRequirementStatus;
}

export interface ApplicationMessage {
  id: UUID;
  author_email: string;
  body: string;
  is_internal: boolean;
  read_at: Timestamp | null;
  created_at: Timestamp;
}

/** Which of the seven progress gates the backend counts as done. */
export interface ApplicationProgressSections {
  account: boolean;
  organisation: boolean;
  documents: boolean;
  personnel: boolean;
  inspection_capability: boolean;
  conflict_declaration: boolean;
  declaration: boolean;
}

export interface ApplicationProgress {
  percent: number;
  completed: number;
  total: number;
  sections: ApplicationProgressSections;
  documents: { submitted: number; required: number };
}

export interface ComplianceApplication {
  id: UUID;
  /** Human-readable identifier, `BLD-APP-<year>-<hex>`. Null on rows predating it. */
  reference: string | null;
  organisation: UUID;
  status: ApplicationStatus;
  /** Empty object until the matching section has been saved. */
  organisation_profile: Partial<OrganisationProfileData>;
  representative: Partial<RepresentativeData>;
  services: Partial<ServicesData>;
  professional_capability: Partial<ProfessionalCapabilityData>;
  inspection_capability: Partial<InspectionCapabilityData>;
  conflict_declaration: Partial<ConflictDeclarationData>;
  declaration: Partial<DeclarationData>;
  submitted_at: Timestamp | null;
  reviewed_at: Timestamp | null;
  review_notes: string;
  conditional_requirements: string;
  personnel: Personnel[];
  documents: ComplianceDocument[];
  progress: ApplicationProgress;
  created_at: Timestamp;
  updated_at: Timestamp;
}

/** One row of `GET /dashboard/`. Assembled in the view, not by a serializer. */
export interface DashboardApplication {
  application_id: UUID;
  reference: string | null;
  organisation_id: UUID;
  organisation_name: string;
  status: ApplicationStatus;
  progress: ApplicationProgress;
  personnel_count: number;
  documents_submitted: number;
  documents_required: number;
  documents_requested: number;
  unread_messages: number;
  review_notes: string;
  conditional_requirements: string;
}

/** One entry in an application's activity feed. */
export interface ApplicationActivity {
  id: UUID;
  event_type: string;
  /** A colleague's name, or "Beldium review team" for a reviewer. */
  actor: string;
  description: string;
  created_at: Timestamp;
}

export interface DashboardResponse {
  applications: DashboardApplication[];
}

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  draft: "Draft",
  under_review: "Under review",
  action_required: "Information required",
  conditionally_approved: "Conditionally verified",
  verified: "Verified",
  rejected: "Rejected",
};

export const DOCUMENT_STATUS_LABELS: Record<DocumentRequirementStatus, string> = {
  not_submitted: "Not submitted",
  requested: "Requested",
  submitted: "Submitted",
  verified: "Verified",
  rejected: "Rejected",
};
