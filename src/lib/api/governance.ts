import { apiFetch, apiFetchBlob } from "./client";
import { apiUrl } from "./config";
import type { Paginated, UUID } from "./types";

// Governance, Risk and Policy Intelligence: Beldium's own oversight
// workspace. Mirrors `beldium-backend/governance/serializers.py` field for
// field. Every export carries a `Governance` prefix so the barrel's
// `export *` stays unambiguous next to the sector modules.
//
// What a caller may do comes from `GET /governance/me/` (`capabilities`),
// never from the role remembered in the browser session.

const BASE = "/governance";
const FULL_PAGE = { page_size: 100 };

export type GovernanceRole =
  "super_admin" | "executive" | "analyst" | "risk_officer" | "reviewer" | "viewer";

export type GovernanceCapability =
  "read" | "author" | "review" | "approve" | "escalate" | "manage_access" | "view_audit" | "report";

export type GovernanceSector =
  | "all"
  | "mining"
  | "quality"
  | "logistics"
  | "warehousing"
  | "processing"
  | "export"
  | "marketplace";

export const GOVERNANCE_SECTORS: { value: GovernanceSector; label: string }[] = [
  { value: "all", label: "All sectors" },
  { value: "mining", label: "Mining" },
  { value: "quality", label: "Quality & Control" },
  { value: "logistics", label: "Logistics" },
  { value: "warehousing", label: "Warehousing" },
  { value: "processing", label: "Processing" },
  { value: "export", label: "Exports" },
  { value: "marketplace", label: "Marketplace" },
];

export interface GovernancePerson {
  id: UUID;
  name: string;
  email: string;
}

export type GovernanceMemberStatus = "pending" | "active" | "suspended" | "declined";

export interface GovernanceMember {
  id: UUID;
  user: GovernancePerson;
  role: GovernanceRole;
  role_label: string;
  status: GovernanceMemberStatus;
  status_label: string;
  organisation: string;
  job_title: string;
  profile: Record<string, unknown>;
  scope: string[];
  decided_by: GovernancePerson | null;
  decided_at: string | null;
  decision_notes: string;
  created_at: string;
}

export interface GovernanceMe {
  member: GovernanceMember | null;
  status: GovernanceMemberStatus | "none";
  role: GovernanceRole | null;
  role_label: string | null;
  capabilities: Record<GovernanceCapability, boolean>;
  classifications: GovernanceClassification[];
  roles: { id: GovernanceRole; label: string }[];
}

export interface GovernancePeopleRow extends GovernancePerson {
  role: GovernanceRole;
  role_label: string;
}

// Policies ---------------------------------------------------------------

export type GovernancePolicyStatus =
  | "draft"
  | "submitted"
  | "under_review"
  | "revision_requested"
  | "recommended"
  | "approved"
  | "published"
  | "rejected"
  | "archived";

export type GovernancePolicyAction =
  | "submit"
  | "start_review"
  | "request_revision"
  | "recommend"
  | "approve"
  | "reject"
  | "publish"
  | "archive";

export interface GovernancePolicyEvent {
  id: UUID;
  action: string;
  from_status: string;
  to_status: string;
  version: string;
  comment: string;
  actor: GovernancePerson;
  created_at: string;
}

export interface GovernancePolicy {
  id: UUID;
  reference: string;
  title: string;
  domain: string;
  sector: GovernanceSector;
  responsible_organisation: string;
  jurisdiction: string;
  owner: UUID;
  owner_detail: GovernancePerson;
  review_date: string | null;
  status: GovernancePolicyStatus;
  status_label: string;
  version: string;
  executive_summary: string;
  strategic_context: string;
  objectives: string;
  stakeholders: string;
  regulatory_instruments: string;
  expected_outcomes: string;
  created_by: GovernancePerson;
  approved_by: GovernancePerson | null;
  approved_at: string | null;
  published_at: string | null;
  allowed_actions: GovernancePolicyAction[];
  created_at: string;
  updated_at: string;
  events?: GovernancePolicyEvent[];
}

export type GovernancePolicyInput = Partial<
  Pick<
    GovernancePolicy,
    | "title"
    | "domain"
    | "sector"
    | "responsible_organisation"
    | "jurisdiction"
    | "owner"
    | "review_date"
    | "executive_summary"
    | "strategic_context"
    | "objectives"
    | "stakeholders"
    | "regulatory_instruments"
    | "expected_outcomes"
  >
>;

// Risks ------------------------------------------------------------------

export type GovernanceRiskStatus = "open" | "monitoring" | "escalated" | "closed";
export type GovernanceControl = "effective" | "partial" | "weak" | "none";
export type GovernanceRiskCategory =
  | "governance"
  | "fraud"
  | "cybersecurity"
  | "environmental"
  | "counterparty"
  | "operational"
  | "regulatory"
  | "reputational"
  | "financial";

export interface GovernanceRisk {
  id: UUID;
  reference: string;
  title: string;
  description: string;
  category: GovernanceRiskCategory;
  sector: GovernanceSector;
  owner: UUID;
  owner_detail: GovernancePerson;
  likelihood: number;
  impact: number;
  inherent_score: number;
  controls: string;
  control_effectiveness: GovernanceControl;
  residual_likelihood: number;
  residual_impact: number;
  residual_score: number;
  treatment_plan: string;
  due_date: string | null;
  status: GovernanceRiskStatus;
  status_label: string;
  escalated_at: string | null;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
}

export type GovernanceRiskInput = Partial<
  Pick<
    GovernanceRisk,
    | "title"
    | "description"
    | "category"
    | "sector"
    | "owner"
    | "likelihood"
    | "impact"
    | "controls"
    | "control_effectiveness"
    | "residual_likelihood"
    | "residual_impact"
    | "treatment_plan"
    | "due_date"
  >
>;

// Regulatory findings ----------------------------------------------------

export type GovernanceFindingStatus = "pending_verification" | "verified" | "escalated" | "closed";

export interface GovernanceFinding {
  id: UUID;
  reference: string;
  requirement: string;
  instrument: string;
  authority: string;
  sector: GovernanceSector;
  gap: string;
  source: string;
  status: GovernanceFindingStatus;
  status_label: string;
  recorded_by: GovernancePerson;
  verified_by: GovernancePerson | null;
  verified_at: string | null;
  resolution: string;
  created_at: string;
  updated_at: string;
}

export type GovernanceFindingInput = Partial<
  Pick<GovernanceFinding, "requirement" | "instrument" | "authority" | "sector" | "gap" | "source">
>;

// Stakeholders and milestones -------------------------------------------

export type GovernanceStakeholderCategory =
  | "regulator"
  | "community"
  | "financier"
  | "commercial"
  | "ngo"
  | "industry"
  | "research"
  | "government";

export interface GovernanceStakeholder {
  id: UUID;
  name: string;
  category: GovernanceStakeholderCategory;
  influence: number;
  interest: number;
  owner: UUID;
  owner_detail: GovernancePerson;
  engagement_plan: string;
  last_engaged_on: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type GovernanceStakeholderInput = Partial<
  Pick<
    GovernanceStakeholder,
    | "name"
    | "category"
    | "influence"
    | "interest"
    | "owner"
    | "engagement_plan"
    | "last_engaged_on"
    | "is_active"
  >
>;

export type GovernanceMilestoneStatus = "not_started" | "on_track" | "delayed" | "complete";
export type GovernanceMilestonePhase = "design" | "pilot" | "rollout" | "review";

export interface GovernanceMilestone {
  id: UUID;
  policy: UUID;
  policy_reference: string;
  policy_title: string;
  name: string;
  phase: GovernanceMilestonePhase;
  owner: UUID;
  owner_detail: GovernancePerson;
  start_date: string;
  end_date: string;
  progress: number;
  kpi: string;
  status: GovernanceMilestoneStatus;
  created_at: string;
  updated_at: string;
}

export type GovernanceMilestoneInput = Partial<
  Pick<
    GovernanceMilestone,
    | "policy"
    | "name"
    | "phase"
    | "owner"
    | "start_date"
    | "end_date"
    | "progress"
    | "kpi"
    | "status"
  >
>;

// Impact assessments -----------------------------------------------------

export type GovernanceImpactCategory =
  "economic" | "social" | "environmental" | "institutional" | "operational" | "financial";

export interface GovernanceScenario {
  id: UUID;
  assessment: UUID;
  name: string;
  description: string;
  cost: string;
  benefit: string;
  net: string;
  benefit_cost_ratio: string | null;
  verified: boolean;
  is_baseline: boolean;
  scores: Partial<Record<GovernanceImpactCategory, number>>;
  position: number;
  created_at: string;
  updated_at: string;
}

export type GovernanceScenarioInput = Partial<
  Pick<
    GovernanceScenario,
    | "assessment"
    | "name"
    | "description"
    | "cost"
    | "benefit"
    | "verified"
    | "is_baseline"
    | "scores"
    | "position"
  >
>;

export interface GovernanceAssessment {
  id: UUID;
  reference: string;
  title: string;
  policy: UUID | null;
  policy_reference: string | null;
  currency: string;
  unit: string;
  horizon_years: number;
  discount_rate: string;
  assumptions: string;
  scenarios: GovernanceScenario[];
  categories: GovernanceImpactCategory[];
  created_by: GovernancePerson;
  created_at: string;
  updated_at: string;
}

export type GovernanceAssessmentInput = Partial<
  Pick<
    GovernanceAssessment,
    "title" | "policy" | "currency" | "unit" | "horizon_years" | "discount_rate" | "assumptions"
  >
>;

// Documents --------------------------------------------------------------

export type GovernanceClassification = "internal" | "restricted" | "confidential";
export type GovernanceDocumentType =
  | "policy"
  | "assessment"
  | "risk_report"
  | "compliance_report"
  | "audit_finding"
  | "correspondence"
  | "evidence"
  | "other";

export interface GovernanceDocument {
  id: UUID;
  name: string;
  document_type: GovernanceDocumentType;
  classification: GovernanceClassification;
  original_filename: string;
  size: number;
  content_type: string;
  policy: UUID | null;
  risk: UUID | null;
  finding: UUID | null;
  uploaded_by: GovernancePerson;
  created_at: string;
}

// Summaries --------------------------------------------------------------

export interface GovernanceSectorRow {
  sector: Exclude<GovernanceSector, "all">;
  name: string;
  available: boolean;
  source: string;
  registered: number | null;
  verified: number | null;
  verified_rate: number | null;
  open_findings: number | null;
  expiring_30d: number | null;
  open_requests: number | null;
}

export interface GovernanceAlert {
  sector: string;
  name: string;
  level: "warning" | "critical";
  message: string;
}

export interface GovernanceCompliance {
  window_days: number;
  sectors: GovernanceSectorRow[];
  alerts: GovernanceAlert[];
}

export interface GovernanceAuditRow {
  id: UUID;
  event: string;
  actor: string;
  metadata: Record<string, string>;
  created_at: string;
}

export interface GovernanceDashboard {
  sector: GovernanceSector;
  counts: {
    active_policies: number;
    awaiting_review: number;
    open_risks: number;
    escalated_risks: number;
    findings_pending: number;
    delayed_milestones: number;
    sector_open_findings: number;
  };
  top_risks: GovernanceRisk[];
  pending_policies: GovernancePolicy[];
  risk_trend: { month: string; open: number; escalated: number }[];
  sectors: GovernanceSectorRow[];
  recent_activity: GovernanceAuditRow[];
}

export interface GovernanceCitation {
  kind: "policy" | "risk" | "finding" | "stakeholder" | "document";
  id: UUID;
  reference: string;
  title: string;
  detail: string;
}

export interface GovernanceCopilotAnswer {
  question: string;
  terms: string[];
  answer: string;
  citations: GovernanceCitation[];
  method: "retrieval";
  requires_review: boolean;
}

export type GovernanceReportKind =
  "executive" | "policy" | "risk" | "regulatory" | "compliance" | "stakeholder" | "roadmap";

export interface GovernanceReportOption {
  kind: GovernanceReportKind;
  label: string;
  formats: ("csv" | "pdf")[];
}

// Access -----------------------------------------------------------------

export type GovernanceInvitationStatus = "pending" | "accepted" | "revoked" | "expired";

export interface GovernanceInvitation {
  id: UUID;
  email: string;
  name: string;
  organisation: string;
  role: GovernanceRole;
  role_label: string;
  status: GovernanceInvitationStatus;
  status_label: string;
  expires_at: string;
  sent_count: number;
  last_sent_at: string;
  invited_by: GovernancePerson | null;
  accepted_at: string | null;
  created_at: string;
  /** Only on create and resend: the one time the plain token is returned. */
  token?: string;
}

export interface GovernanceInvitationPreview {
  email: string;
  name: string;
  organisation: string;
  role: GovernanceRole;
  role_label: string;
  status: GovernanceInvitationStatus;
  expires_at: string;
}

export interface GovernanceAccessRequestInput {
  organisation: string;
  job_title: string;
  requested_role: Extract<GovernanceRole, "analyst" | "reviewer" | "viewer">;
  profile: Record<string, string>;
  scope: string[];
  declarations: {
    conflict_of_interest: boolean;
    confidentiality: boolean;
    code_of_conduct: boolean;
  };
}

// Fetchers ---------------------------------------------------------------

const list = <T>(path: string, signal?: AbortSignal, query: Record<string, string | number> = {}) =>
  apiFetch<Paginated<T>>(`${BASE}/${path}/`, { query: { ...FULL_PAGE, ...query }, signal }).then(
    (page) => page.results,
  );

export const fetchGovernanceMe = (signal?: AbortSignal) =>
  apiFetch<GovernanceMe>(`${BASE}/me/`, { signal });
export const fetchGovernancePeople = (signal?: AbortSignal) =>
  apiFetch<GovernancePeopleRow[]>(`${BASE}/people/`, { signal });
export const fetchGovernanceDashboard = (sector: GovernanceSector, signal?: AbortSignal) =>
  apiFetch<GovernanceDashboard>(`${BASE}/dashboard/`, { query: { sector }, signal });
export const fetchGovernanceCompliance = (signal?: AbortSignal) =>
  apiFetch<GovernanceCompliance>(`${BASE}/compliance/`, { signal });
export const fetchGovernanceAudit = (signal?: AbortSignal) =>
  apiFetch<GovernanceAuditRow[]>(`${BASE}/audit/`, { query: { limit: 200 }, signal });
export const listGovernanceReports = (signal?: AbortSignal) =>
  apiFetch<GovernanceReportOption[]>(`${BASE}/reports/`, { signal });

export const listGovernancePolicies = (signal?: AbortSignal) =>
  list<GovernancePolicy>("policies", signal);
export const getGovernancePolicy = (id: UUID, signal?: AbortSignal) =>
  apiFetch<GovernancePolicy>(`${BASE}/policies/${id}/`, { signal });
export const createGovernancePolicy = (body: GovernancePolicyInput) =>
  apiFetch<GovernancePolicy>(`${BASE}/policies/`, { method: "POST", body });
export const updateGovernancePolicy = (id: UUID, body: GovernancePolicyInput) =>
  apiFetch<GovernancePolicy>(`${BASE}/policies/${id}/`, { method: "PATCH", body });
export const transitionGovernancePolicy = (
  id: UUID,
  action: GovernancePolicyAction,
  comment = "",
) =>
  apiFetch<GovernancePolicy>(`${BASE}/policies/${id}/transition/`, {
    method: "POST",
    body: { action, comment },
  });

export const listGovernanceRisks = (signal?: AbortSignal) => list<GovernanceRisk>("risks", signal);
export const createGovernanceRisk = (body: GovernanceRiskInput) =>
  apiFetch<GovernanceRisk>(`${BASE}/risks/`, { method: "POST", body });
export const updateGovernanceRisk = (id: UUID, body: GovernanceRiskInput) =>
  apiFetch<GovernanceRisk>(`${BASE}/risks/${id}/`, { method: "PATCH", body });
export const escalateGovernanceRisk = (id: UUID, comment: string) =>
  apiFetch<GovernanceRisk>(`${BASE}/risks/${id}/escalate/`, { method: "POST", body: { comment } });
export const setGovernanceRiskStatus = (
  id: UUID,
  status: Exclude<GovernanceRiskStatus, "escalated">,
  comment = "",
) =>
  apiFetch<GovernanceRisk>(`${BASE}/risks/${id}/set-status/`, {
    method: "POST",
    body: { status, comment },
  });

export const listGovernanceFindings = (signal?: AbortSignal) =>
  list<GovernanceFinding>("findings", signal);
export const createGovernanceFinding = (body: GovernanceFindingInput) =>
  apiFetch<GovernanceFinding>(`${BASE}/findings/`, { method: "POST", body });
export const verifyGovernanceFinding = (id: UUID, comment = "") =>
  apiFetch<GovernanceFinding>(`${BASE}/findings/${id}/verify/`, {
    method: "POST",
    body: { comment },
  });
export const escalateGovernanceFinding = (id: UUID, comment: string) =>
  apiFetch<GovernanceFinding>(`${BASE}/findings/${id}/escalate/`, {
    method: "POST",
    body: { comment },
  });
export const closeGovernanceFinding = (id: UUID, resolution: string) =>
  apiFetch<GovernanceFinding>(`${BASE}/findings/${id}/close/`, {
    method: "POST",
    body: { resolution },
  });

export const listGovernanceStakeholders = (signal?: AbortSignal) =>
  list<GovernanceStakeholder>("stakeholders", signal, { is_active: "true" });
export const createGovernanceStakeholder = (body: GovernanceStakeholderInput) =>
  apiFetch<GovernanceStakeholder>(`${BASE}/stakeholders/`, { method: "POST", body });
export const updateGovernanceStakeholder = (id: UUID, body: GovernanceStakeholderInput) =>
  apiFetch<GovernanceStakeholder>(`${BASE}/stakeholders/${id}/`, { method: "PATCH", body });

export const listGovernanceMilestones = (signal?: AbortSignal) =>
  list<GovernanceMilestone>("milestones", signal);
export const createGovernanceMilestone = (body: GovernanceMilestoneInput) =>
  apiFetch<GovernanceMilestone>(`${BASE}/milestones/`, { method: "POST", body });
export const updateGovernanceMilestone = (id: UUID, body: GovernanceMilestoneInput) =>
  apiFetch<GovernanceMilestone>(`${BASE}/milestones/${id}/`, { method: "PATCH", body });

export const listGovernanceAssessments = (signal?: AbortSignal) =>
  list<GovernanceAssessment>("assessments", signal);
export const createGovernanceAssessment = (body: GovernanceAssessmentInput) =>
  apiFetch<GovernanceAssessment>(`${BASE}/assessments/`, { method: "POST", body });
export const createGovernanceScenario = (body: GovernanceScenarioInput) =>
  apiFetch<GovernanceScenario>(`${BASE}/scenarios/`, { method: "POST", body });
export const updateGovernanceScenario = (id: UUID, body: GovernanceScenarioInput) =>
  apiFetch<GovernanceScenario>(`${BASE}/scenarios/${id}/`, { method: "PATCH", body });

export const listGovernanceDocuments = (signal?: AbortSignal) =>
  list<GovernanceDocument>("documents", signal);
export function uploadGovernanceDocument(input: {
  name: string;
  document_type: GovernanceDocumentType;
  classification: GovernanceClassification;
  file: File;
}) {
  const form = new FormData();
  form.append("name", input.name);
  form.append("document_type", input.document_type);
  form.append("classification", input.classification);
  form.append("file", input.file);
  return apiFetch<GovernanceDocument>(`${BASE}/documents/`, { method: "POST", body: form });
}

function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

export async function downloadGovernanceDocument(doc: GovernanceDocument) {
  saveBlob(
    await apiFetchBlob(apiUrl(`${BASE}/documents/${doc.id}/download/`)),
    doc.original_filename,
  );
}

export async function downloadGovernanceReport(kind: GovernanceReportKind, output: "pdf" | "csv") {
  const blob = await apiFetchBlob(apiUrl(`${BASE}/reports/${kind}/?output=${output}`));
  const stamp = new Date().toISOString().slice(0, 10);
  saveBlob(blob, `beldium-governance-${kind}-${stamp}.${output}`);
}

export const askGovernanceCopilot = (question: string) =>
  apiFetch<GovernanceCopilotAnswer>(`${BASE}/copilot/`, { method: "POST", body: { question } });

export const listGovernanceMembers = (signal?: AbortSignal) =>
  list<GovernanceMember>("members", signal);
export const decideGovernanceMember = (
  id: UUID,
  body: { status: GovernanceMemberStatus; role?: GovernanceRole; notes?: string },
) => apiFetch<GovernanceMember>(`${BASE}/members/${id}/decide/`, { method: "POST", body });

export const listGovernanceInvitations = (signal?: AbortSignal) =>
  list<GovernanceInvitation>("invitations", signal);
export const createGovernanceInvitation = (body: {
  email: string;
  name: string;
  organisation: string;
  role: GovernanceRole;
}) => apiFetch<GovernanceInvitation>(`${BASE}/invitations/`, { method: "POST", body });
export const resendGovernanceInvitation = (id: UUID) =>
  apiFetch<GovernanceInvitation>(`${BASE}/invitations/${id}/resend/`, { method: "POST" });
export const revokeGovernanceInvitation = (id: UUID) =>
  apiFetch<GovernanceInvitation>(`${BASE}/invitations/${id}/revoke/`, { method: "POST" });
export const lookupGovernanceInvitation = (token: string) =>
  apiFetch<GovernanceInvitationPreview>(`${BASE}/invitations/lookup/`, {
    method: "POST",
    body: { token },
    auth: false,
  });
export const acceptGovernanceInvitation = (token: string) =>
  apiFetch<GovernanceMember>(`${BASE}/invitations/accept/`, { method: "POST", body: { token } });

export const requestGovernanceAccess = (body: GovernanceAccessRequestInput) =>
  apiFetch<GovernanceMember>(`${BASE}/access-requests/`, { method: "POST", body });
