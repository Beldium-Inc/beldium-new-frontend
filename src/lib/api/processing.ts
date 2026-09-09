import { apiFetch } from "./client";
import type { Paginated, UUID } from "./types";

// The Processing Compliance register: processors, their admission
// applications, and the operational evidence that accumulates against them.
// Everything here mirrors `beldium-backend/processing/serializers.py`
// field-for-field, so the shapes below are the backend's, not a re-spelling.

const BASE = "/processing";

export type ProcessingAudience = "operator" | "regulator" | "processor";

export type ProcessingTypeKey =
  "crushing_milling" | "chemical_refining" | "smelting" | "sorting_baling";

export type ProcessingSectionKey =
  | "corporate"
  | "regulatory"
  | "facility"
  | "environmental"
  | "health_safety"
  | "equipment"
  | "operational"
  | "quality"
  | "waste"
  | "inspection";

export type ProcessingReviewState =
  "pending" | "verified" | "rejected" | "info_requested" | "flagged";

export type ApplicationStage = "new" | "in_review" | "awaiting_info" | "inspection" | "decided";

export type ApplicationDecisionValue =
  "approved" | "conditional_approval" | "more_info_required" | "rejected";

export type ProcessorStatus = "under_review" | "approved" | "conditional" | "suspended";

/** Derived from the expiry date on read, never stored. */
export type DocumentValidity = "valid" | "expiring" | "expired" | "missing";

export interface ProcessingCapabilities {
  audience: ProcessingAudience | null;
  can_review: boolean;
  can_decide: boolean;
  can_read_register: boolean;
  is_staff: boolean;
}

export interface ProcessingDocument {
  id: UUID;
  application: UUID | null;
  processor: UUID | null;
  section: ProcessingSectionKey;
  name: string;
  reference: string;
  issuer: string;
  issued_on: string | null;
  expires_on: string | null;
  status: DocumentValidity;
  days_to_expiry: number | null;
  /** The desk's verdict on this piece of evidence, separate from its validity. */
  review_state: ProcessingReviewState;
  review_note: string;
  reviewed_at: string | null;
  file_url: string | null;
  original_name: string;
  created_at: string;
  updated_at: string;
}

export interface ExpiringDocument {
  id: UUID;
  name: string;
  reference: string;
  company: string;
  issuer: string;
  expires_on: string;
  days_to_expiry: number;
  status: DocumentValidity;
}

export interface SectionField {
  label: string;
  value?: string;
  flag?: "ok" | "warn" | "bad";
}

export interface ApplicationSection {
  id: UUID;
  key: ProcessingSectionKey;
  label: string;
  fields: SectionField[];
  notes: string;
  review_state: ProcessingReviewState;
  review_note: string;
  reviewed_by_name: string | null;
  reviewed_at: string | null;
  documents: ProcessingDocument[];
  created_at: string;
  updated_at: string;
}

export interface RiskCause {
  id: UUID;
  cause: string;
  weight: number;
  detail: string;
  created_at: string;
}

export interface ProcessingApplication {
  id: UUID;
  /** Human reference, `BPC-APP-<year>-<hex>`. What people quote to each other. */
  reference: string;
  processor: UUID | null;
  organisation: UUID | null;
  company: string;
  rc_number: string;
  tin: string;
  processing_type: ProcessingTypeKey;
  processing_type_label: string;
  state: string;
  lga: string;
  facility_name: string;
  capacity: string;
  workforce: number;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  stage: ApplicationStage;
  decision: ApplicationDecisionValue | "";
  decision_note: string;
  decided_at: string | null;
  submitted_on: string | null;
  /** Sum of the weighted risk causes, capped at 100. */
  risk_score: number;
  risk_band: "low" | "medium" | "high";
  /** Percent of the ten evidence sections that are complete. */
  completeness: number;
  open_non_conformities: number;
  risk_causes: RiskCause[];
  created_at: string;
  updated_at: string;
}

export interface ProcessingApplicationDetail extends ProcessingApplication {
  sections: ApplicationSection[];
  review: {
    sections_total: number;
    sections_present: number;
    sections_verified: number;
    sections_rejected: number;
    sections_flagged: number;
  };
}

export interface Facility {
  id: UUID;
  processor: UUID;
  name: string;
  address: string;
  state: string;
  lga: string;
  capacity: string;
  workforce: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Processor {
  id: UUID;
  reference: string;
  organisation: UUID | null;
  name: string;
  rc_number: string;
  tin: string;
  processing_type: ProcessingTypeKey;
  processing_type_label: string;
  country: string;
  state: string;
  lga: string;
  region: string;
  status: ProcessorStatus;
  compliance_score: number;
  registered_on: string;
  last_inspection_on: string | null;
  facilities_count: number;
  open_non_conformities: number;
  created_at: string;
  updated_at: string;
}

export interface ProcessorDetail extends Processor {
  facilities: Facility[];
}

export interface NonConformityEvidence {
  id: UUID;
  name: string;
  note: string;
  file_url: string | null;
  original_name: string;
  submitted_by_name: string;
  created_at: string;
}

export interface NonConformity {
  id: UUID;
  reference: string;
  application: UUID | null;
  processor: UUID | null;
  company: string;
  section: ProcessingSectionKey;
  section_label: string;
  severity: "minor" | "major" | "critical";
  title: string;
  detail: string;
  raised_on: string;
  due_on: string;
  status: "open" | "evidence_submitted" | "closed";
  is_overdue: boolean;
  closure_note: string;
  closed_at: string | null;
  evidence: NonConformityEvidence[];
  created_at: string;
  updated_at: string;
}

export interface Inspection {
  id: UUID;
  reference: string;
  application: UUID | null;
  processor: UUID | null;
  company: string;
  facility: UUID | null;
  facility_name: string;
  state: string;
  scheduled_for: string | null;
  inspector: UUID | null;
  inspector_name: string;
  /** The assigned person, or "Unassigned" — already resolved by the backend. */
  inspector_display: string;
  inspection_type: "pre_approval" | "routine" | "follow_up" | "incident_triggered";
  status: "requested" | "scheduled" | "in_progress" | "completed";
  outcome: string;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface EnvironmentalAlert {
  id: UUID;
  reference: string;
  processor: UUID | null;
  company: string;
  facility: UUID | null;
  facility_name: string;
  state: string;
  parameter: string;
  reading: string;
  threshold: string;
  severity: "warning" | "critical";
  detected_on: string;
  status: "open" | "acknowledged" | "resolved";
  acknowledged_at: string | null;
  resolved_at: string | null;
  resolution_note: string;
  created_at: string;
  updated_at: string;
}

export interface Incident {
  id: UUID;
  reference: string;
  processor: UUID | null;
  company: string;
  facility: UUID | null;
  facility_name: string;
  state: string;
  incident_type: string;
  severity: "low" | "moderate" | "severe";
  reported_on: string;
  status: "reported" | "under_investigation" | "closed";
  summary: string;
  closed_at: string | null;
  closure_note: string;
  created_at: string;
  updated_at: string;
}

export interface TraceabilityRun {
  id: UUID;
  reference: string;
  processor: UUID;
  company: string;
  facility: UUID | null;
  facility_name: string;
  input_batch: string;
  input_source: string;
  /** Kilograms, so the yield reconciles exactly. */
  input_mass_kg: number;
  process: string;
  started_at: string;
  completed_at: string | null;
  output_batch: string;
  output_mass_kg: number;
  yield_percent: number;
  qc_assay: string;
  qc_moisture: string;
  qc_verdict: "pass" | "hold" | "fail";
  qc_lab: string;
  created_at: string;
  updated_at: string;
}

export interface ComplianceReport {
  id: UUID;
  reference: string;
  title: string;
  period_label: string;
  scope: string;
  generated_on: string;
  pages: number;
  file_url: string | null;
  created_at: string;
}

export interface ProcessingAuditEvent {
  id: UUID;
  created_at: string;
  actor: string;
  role: string;
  action: string;
  target: string;
  detail: string;
}

export interface ProcessingDashboard {
  audience: ProcessingAudience | null;
  capabilities: ProcessingCapabilities;
  totals: {
    applications: number;
    applications_in_review: number;
    applications_awaiting_info: number;
    processors: number;
    approved_processors: number;
    suspended_processors: number;
    open_non_conformities: number;
    overdue_non_conformities: number;
    upcoming_inspections: number;
    open_environmental_alerts: number;
    open_incidents: number;
    expiring_documents: number;
    average_compliance_score: number;
  };
  kpi_trend: { month: string; approvals: number; nonconformities: number; inspections: number }[];
  regional_compliance: {
    region: string;
    processors: number;
    compliant: number;
    conditional: number;
    suspended: number;
    avg_score: number;
  }[];
  expiring_documents: ExpiringDocument[];
  notifications: {
    id: string;
    title: string;
    body: string;
    at: string;
    kind: "info" | "warn" | "error";
  }[];
  recent_applications: ProcessingApplication[];
  open_alerts: EnvironmentalAlert[];
  open_incidents: Incident[];
}

// --- capabilities and dashboard ---------------------------------------------

/**
 * What this caller may actually do. The browser stores a chosen dashboard role
 * in localStorage; this is the authoritative answer, derived server-side from
 * organisation membership, so the UI can render against real permissions.
 */
export function fetchCapabilities(signal?: AbortSignal): Promise<ProcessingCapabilities> {
  return apiFetch<ProcessingCapabilities>(`${BASE}/me/`, { signal });
}

export function fetchProcessingDashboard(signal?: AbortSignal): Promise<ProcessingDashboard> {
  return apiFetch<ProcessingDashboard>(`${BASE}/dashboard/`, { signal });
}

// --- register ---------------------------------------------------------------

export interface ListQuery {
  page?: number;
  page_size?: number;
  search?: string;
  ordering?: string;
  [key: string]: string | number | boolean | null | undefined;
}

export function listProcessors(query: ListQuery = {}): Promise<Paginated<Processor>> {
  return apiFetch<Paginated<Processor>>(`${BASE}/processors/`, { query });
}

export function getProcessor(id: UUID): Promise<ProcessorDetail> {
  return apiFetch<ProcessorDetail>(`${BASE}/processors/${id}/`);
}

export function listFacilities(id: UUID): Promise<Facility[]> {
  return apiFetch<Facility[]>(`${BASE}/processors/${id}/facilities/`);
}

// --- applications -----------------------------------------------------------

export function listProcessingApplications(
  query: ListQuery = {},
): Promise<Paginated<ProcessingApplication>> {
  return apiFetch<Paginated<ProcessingApplication>>(`${BASE}/applications/`, { query });
}

export function getProcessingApplication(id: UUID): Promise<ProcessingApplicationDetail> {
  return apiFetch<ProcessingApplicationDetail>(`${BASE}/applications/${id}/`);
}

export function listApplicationDocuments(id: UUID): Promise<ProcessingDocument[]> {
  return apiFetch<ProcessingDocument[]>(`${BASE}/applications/${id}/documents/`);
}

/** Applicant-side save of one evidence section. Returns it to `pending` review. */
export function saveApplicationSection(
  id: UUID,
  key: ProcessingSectionKey,
  patch: { fields?: SectionField[] | undefined; notes?: string | undefined },
): Promise<ApplicationSection> {
  return apiFetch<ApplicationSection>(`${BASE}/applications/${id}/sections/${key}/`, {
    method: "PATCH",
    body: patch,
  });
}

/** Operator-side verdict on one evidence section. */
export function reviewApplicationSection(
  id: UUID,
  key: ProcessingSectionKey,
  input: { review_state: ProcessingReviewState; note?: string | undefined },
): Promise<ApplicationSection> {
  return apiFetch<ApplicationSection>(`${BASE}/applications/${id}/sections/${key}/review/`, {
    method: "POST",
    body: input,
  });
}

/**
 * Submit for review. Rejects with 409 `application_incomplete` unless every
 * one of the ten sections carries data and a file for each document it lists.
 */
export function submitProcessingApplication(id: UUID): Promise<ProcessingApplicationDetail> {
  return apiFetch<ProcessingApplicationDetail>(`${BASE}/applications/${id}/submit/`, {
    method: "POST",
  });
}

/**
 * Record the desk's decision. `approved` is refused with 409 while any section
 * is unverified (`sections_not_verified`) or any finding is open
 * (`non_conformities_open`); `more_info_required` hands the application back to
 * the applicant rather than closing it.
 */
export function decideProcessingApplication(
  id: UUID,
  input: { decision: ApplicationDecisionValue; note?: string | undefined },
): Promise<ProcessingApplicationDetail> {
  return apiFetch<ProcessingApplicationDetail>(`${BASE}/applications/${id}/decide/`, {
    method: "POST",
    body: input,
  });
}

export function requestApplicationInspection(
  id: UUID,
  input: {
    scheduled_for?: string | null | undefined;
    inspection_type?: Inspection["inspection_type"] | undefined;
    inspector_name?: string | undefined;
    note?: string | undefined;
  } = {},
): Promise<Inspection> {
  return apiFetch<Inspection>(`${BASE}/applications/${id}/request-inspection/`, {
    method: "POST",
    body: input,
  });
}

export function listRiskCauses(id: UUID): Promise<RiskCause[]> {
  return apiFetch<RiskCause[]>(`${BASE}/applications/${id}/risk-causes/`);
}

export function addRiskCause(
  id: UUID,
  input: { cause: string; weight: number; detail?: string | undefined },
): Promise<RiskCause> {
  return apiFetch<RiskCause>(`${BASE}/applications/${id}/risk-causes/`, {
    method: "POST",
    body: input,
  });
}

export function removeRiskCause(id: UUID, causeId: UUID): Promise<void> {
  return apiFetch<void>(`${BASE}/applications/${id}/risk-causes/${causeId}/`, { method: "DELETE" });
}

export function listApplicationActivity(
  id: UUID,
  page?: number,
): Promise<Paginated<ProcessingAuditEvent>> {
  return apiFetch<Paginated<ProcessingAuditEvent>>(`${BASE}/applications/${id}/activity/`, {
    query: page ? { page } : {},
  });
}

// --- findings ---------------------------------------------------------------

export function listNonConformities(query: ListQuery = {}): Promise<Paginated<NonConformity>> {
  return apiFetch<Paginated<NonConformity>>(`${BASE}/non-conformities/`, { query });
}

export function createNonConformity(input: {
  application?: UUID | null | undefined;
  processor?: UUID | null | undefined;
  section: ProcessingSectionKey;
  severity: NonConformity["severity"];
  title: string;
  detail?: string | undefined;
  due_on: string;
}): Promise<NonConformity> {
  return apiFetch<NonConformity>(`${BASE}/non-conformities/`, { method: "POST", body: input });
}

/**
 * Corrective-action evidence. Goes up as multipart when a file is attached, so
 * the browser can set the boundary.
 */
export function submitNonConformityEvidence(
  id: UUID,
  input: { name: string; note?: string | undefined; file?: File | null | undefined },
): Promise<NonConformityEvidence> {
  const { file, ...rest } = input;
  let body: FormData | Record<string, unknown> = rest;
  if (file) {
    const form = new FormData();
    for (const [key, value] of Object.entries(rest)) {
      if (value === undefined || value === null) continue;
      form.append(key, String(value));
    }
    form.append("file", file);
    body = form;
  }
  return apiFetch<NonConformityEvidence>(`${BASE}/non-conformities/${id}/evidence/`, {
    method: "POST",
    body,
  });
}

/** Accept the evidence and close, or reject it and reopen the finding. */
export function closeNonConformity(
  id: UUID,
  input: { accept: boolean; note?: string | undefined },
): Promise<NonConformity> {
  return apiFetch<NonConformity>(`${BASE}/non-conformities/${id}/close/`, {
    method: "POST",
    body: input,
  });
}

// --- operations -------------------------------------------------------------

export function listInspections(query: ListQuery = {}): Promise<Paginated<Inspection>> {
  return apiFetch<Paginated<Inspection>>(`${BASE}/inspections/`, { query });
}

export function updateInspection(id: UUID, patch: Partial<Inspection>): Promise<Inspection> {
  return apiFetch<Inspection>(`${BASE}/inspections/${id}/`, { method: "PATCH", body: patch });
}

export function listEnvironmentalAlerts(
  query: ListQuery = {},
): Promise<Paginated<EnvironmentalAlert>> {
  return apiFetch<Paginated<EnvironmentalAlert>>(`${BASE}/environmental-alerts/`, { query });
}

export function setAlertStatus(
  id: UUID,
  input: { status: "acknowledged" | "resolved"; note?: string | undefined },
): Promise<EnvironmentalAlert> {
  return apiFetch<EnvironmentalAlert>(`${BASE}/environmental-alerts/${id}/status/`, {
    method: "POST",
    body: input,
  });
}

export function listIncidents(query: ListQuery = {}): Promise<Paginated<Incident>> {
  return apiFetch<Paginated<Incident>>(`${BASE}/incidents/`, { query });
}

export function listTraceabilityRuns(query: ListQuery = {}): Promise<Paginated<TraceabilityRun>> {
  return apiFetch<Paginated<TraceabilityRun>>(`${BASE}/runs/`, { query });
}

export function listProcessingDocuments(
  query: ListQuery = {},
): Promise<Paginated<ProcessingDocument>> {
  return apiFetch<Paginated<ProcessingDocument>>(`${BASE}/documents/`, { query });
}

/** Everything already expired or lapsing inside the 60-day warning window. */
export function listExpiringDocuments(): Promise<ExpiringDocument[]> {
  return apiFetch<ExpiringDocument[]>(`${BASE}/documents/expiring/`);
}

/** Accept or reject one piece of evidence. Refused while no file is supplied. */
export function reviewProcessingDocument(
  id: UUID,
  input: { review_state: "verified" | "rejected" | "pending"; note?: string | undefined },
): Promise<ProcessingDocument> {
  return apiFetch<ProcessingDocument>(`${BASE}/documents/${id}/review/`, {
    method: "POST",
    body: input,
  });
}

export function listComplianceReports(query: ListQuery = {}): Promise<Paginated<ComplianceReport>> {
  return apiFetch<Paginated<ComplianceReport>>(`${BASE}/reports/`, { query });
}

/** The register-wide trail. Empty for a single processor: it spans companies. */
export function listProcessingAudit(
  query: ListQuery = {},
): Promise<Paginated<ProcessingAuditEvent>> {
  return apiFetch<Paginated<ProcessingAuditEvent>>(`${BASE}/audit/`, { query });
}
