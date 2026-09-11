import { apiFetch } from "./client";
import type { Paginated, UUID } from "./types";

// The Mining Compliance register: mine sites, their licensing/admission
// applications, and the operational evidence that accumulates against them.
// Everything here mirrors `beldium-backend/mining/serializers.py`
// field-for-field, so the shapes below are the backend's, not a re-spelling.
// Mirrors `./processing.ts`'s structure closely — see that file for the
// sibling vertical.

const BASE = "/mining";

export type MiningAudience = "operator" | "regulator" | "miner" | "partner";

export type SectionKey =
  | "corporate"
  | "licence"
  | "site"
  | "ownership"
  | "environmental"
  | "safety"
  | "equipment"
  | "production"
  | "sampling"
  | "inspection";

export type ReviewSectionStatus =
  | "pending"
  | "under_review"
  | "verified"
  | "rejected"
  | "info_requested"
  | "inspection_requested"
  | "flagged";

export type MineSiteStatus = "operational" | "under_review" | "suspended" | "care_maintenance";
export type MineSiteRisk = "low" | "medium" | "high";

export interface MiningCapabilities {
  audience: MiningAudience | null;
  can_decide: boolean;
  can_read_register: boolean;
  is_staff: boolean;
}

export interface MiningSectionField {
  label: string;
  value?: string;
  flag?: "ok" | "warn" | "bad";
  note?: string;
}

export interface ScoreFactor {
  id: UUID;
  site: UUID;
  label: string;
  weight: number;
  score: number;
  reason: string;
  trend: string;
  created_at: string;
}

export type MiningEvidenceStatus = "pending" | "verified" | "rejected" | "expired";

export interface Evidence {
  id: UUID;
  section: UUID;
  name: string;
  kind: string;
  file_url: string | null;
  original_name: string;
  status: MiningEvidenceStatus;
  uploaded_by_name: string;
  created_at: string;
  updated_at: string;
}

export interface ReviewSection {
  id: UUID;
  site: UUID;
  key: SectionKey;
  label: string;
  title: string;
  summary: string;
  weight: number;
  score: number;
  status: ReviewSectionStatus;
  fields: MiningSectionField[];
  decision_note: string;
  decided_by_name: string | null;
  decided_at: string | null;
  evidence: Evidence[];
  created_at: string;
  updated_at: string;
}

export interface MineSite {
  id: UUID;
  code: string;
  organisation: UUID | null;
  name: string;
  mineral: string;
  state: string;
  lga: string;
  latitude: number | null;
  longitude: number | null;
  area_ha: number | null;
  status: MineSiteStatus;
  compliance_score: number;
  risk: MineSiteRisk;
  capacity_tpa: number | null;
  current_tpa: number | null;
  workforce: number | null;
  last_inspection_on: string | null;
  /** Free-form, e.g. {inspector, permit, company}; not strongly typed server-side. */
  verification: Record<string, unknown>;
  risk_reasons: string[];
  production: Record<string, unknown>;
  inventory: Record<string, unknown>;
  transactions: Record<string, unknown>;
  compliance_percent: number;
  open_non_conformities: number;
  score_factors: ScoreFactor[];
  created_at: string;
  updated_at: string;
}

/** One section's remaining gaps, as the API computes them. */
export interface MiningSectionGap {
  section: SectionKey;
  label: string;
  missing_prompts: string[];
  missing_documents: string[];
}

export interface MineSiteDetail extends MineSite {
  sections: ReviewSection[];
  review: {
    sections_total: number;
    sections_present: number;
    sections_verified: number;
    sections_rejected: number;
    sections_flagged: number;
  };
  /** Empty exactly when the site's register entry is complete. */
  outstanding: MiningSectionGap[];
}

export interface MiningChecklistSection {
  key: SectionKey;
  label: string;
  prompts: { label: string; required: boolean }[];
  documents: { name: string; issuer: string; expires: boolean }[];
}

export interface MiningChecklist {
  sections: MiningChecklistSection[];
}

export interface OrganisationProfile {
  id: UUID;
  organisation: UUID;
  directors: Record<string, unknown>[];
  beneficial_owners: Record<string, unknown>[];
  created_at: string;
  updated_at: string;
}

export type NonConformitySeverity = "minor" | "major" | "critical";
export type NonConformityStatus =
  "open" | "in_progress" | "awaiting_review" | "closed" | "escalated";

export interface CorrectiveSubmission {
  id: UUID;
  non_conformity: UUID;
  message: string;
  submitted_by_name: string;
  file: string | null;
  decision: "" | "accepted" | "rejected";
  decision_note: string;
  decided_at: string | null;
  created_at: string;
}

export interface MiningNonConformity {
  id: UUID;
  reference: string;
  site: UUID;
  site_name: string;
  title: string;
  category: string;
  severity: NonConformitySeverity;
  required_action: string;
  responsible_person: string;
  deadline: string;
  status: NonConformityStatus;
  is_overdue: boolean;
  submissions: CorrectiveSubmission[];
  created_at: string;
  updated_at: string;
}

export type InspectionType = "pre_approval" | "routine" | "follow_up" | "incident_triggered";
export type InspectionStatus = "requested" | "scheduled" | "completed" | "overdue";
export type InspectionResult = "pass" | "pass_with_observations" | "fail" | "";

export interface MiningInspection {
  id: UUID;
  reference: string;
  site: UUID;
  site_name: string;
  type: InspectionType;
  scheduled_for: string | null;
  inspector: UUID | null;
  inspector_name: string;
  /** The assigned person, or "Unassigned" — already resolved by the backend. */
  inspector_display: string;
  status: InspectionStatus;
  result: InspectionResult;
  findings: string;
  notes: string;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export type MiningSampleStatus = "verified" | "pending" | "disputed";

export interface MiningSample {
  id: UUID;
  reference: string;
  site: UUID;
  site_name: string;
  collected_on: string;
  lab: string;
  certificate: string;
  li2o_percent: number | null;
  fe2o3_percent: number | null;
  moisture_percent: number | null;
  status: MiningSampleStatus;
  method: string;
  chain_of_custody: string;
  created_at: string;
  updated_at: string;
}

export type EnvRecordStatus = "within_limit" | "watch" | "breach";

export interface EnvRecord {
  id: UUID;
  site: UUID;
  site_name: string;
  metric: string;
  value: string;
  limit: string;
  status: EnvRecordStatus;
  measured_on: string;
  created_at: string;
  updated_at: string;
}

export type SafetyIncidentStatus = "investigating" | "closed";

export interface SafetyIncident {
  id: UUID;
  site: UUID;
  site_name: string;
  date: string;
  type: string;
  severity: string;
  lost_days: number;
  status: SafetyIncidentStatus;
  summary: string;
  created_at: string;
  updated_at: string;
}

export type EquipmentStatus = "certified" | "due_inspection" | "out_of_service";

export interface Equipment {
  id: UUID;
  site: UUID;
  site_name: string;
  name: string;
  serial: string;
  cert_expires_on: string | null;
  status: EquipmentStatus;
  created_at: string;
  updated_at: string;
}

export type MiningApplicationStage = string;
export type MiningApplicationStatus =
  "pending" | "under_review" | "approved" | "rejected" | "info_requested";

export interface Application {
  id: UUID;
  reference: string;
  organisation: UUID | null;
  site: UUID | null;
  site_name: string;
  type: string;
  mineral: string;
  submitted_on: string | null;
  stage: MiningApplicationStage;
  status: MiningApplicationStatus;
  assigned_to: UUID | null;
  sla_days: number | null;
  created_at: string;
  updated_at: string;
}

export type PendingReviewStatus = "queued" | "in_progress" | "completed";
export type Priority = "low" | "normal" | "high";

export interface PendingReview {
  id: UUID;
  site: UUID;
  site_name: string;
  subject: string;
  type: string;
  priority: Priority;
  submitted_on: string | null;
  due_on: string | null;
  status: PendingReviewStatus;
  assigned_to: UUID | null;
  created_at: string;
  updated_at: string;
}

export type InfoRequestStatus = "open" | "responded" | "closed";

export interface InfoRequest {
  id: UUID;
  site: UUID;
  site_name: string;
  section: SectionKey | "";
  subject: string;
  details: string;
  requested_by_name: string;
  due_by: string | null;
  priority: Priority;
  status: InfoRequestStatus;
  response_message: string;
  response_at: string | null;
  response_attachments: Record<string, unknown>[];
  created_at: string;
  updated_at: string;
}

export type LicenceStatus = "active" | "expiring" | "expired" | "suspended";

export interface LicenceDoc {
  id: UUID;
  site: UUID;
  site_name: string;
  number: string;
  type: string;
  authority: string;
  issued_on: string | null;
  expires_on: string | null;
  status: LicenceStatus;
  days_to_expiry: number | null;
  file_url: string | null;
  created_at: string;
  updated_at: string;
}

export type MiningDocumentStatus = "pending" | "verified" | "rejected" | "expired";

export interface DocumentRecord {
  id: UUID;
  site: UUID;
  name: string;
  category: string;
  expires_on: string | null;
  status: MiningDocumentStatus;
  file_url: string | null;
  original_name: string;
  uploaded_by_name: string;
  created_at: string;
  updated_at: string;
}

export interface MiningAuditEvent {
  id: UUID;
  created_at: string;
  actor: string;
  role: string;
  action: string;
  target: string;
  detail: string;
}

export interface ExpiringLicence {
  id: UUID;
  number: string;
  type: string;
  site_name: string;
  authority: string;
  expires_on: string | null;
  days_to_expiry: number | null;
  status: LicenceStatus;
}

export interface MiningDashboard {
  audience: MiningAudience | null;
  capabilities: MiningCapabilities;
  totals: {
    sites: number;
    operational_sites: number;
    suspended_sites: number;
    applications: number;
    applications_pending: number;
    applications_under_review: number;
    open_non_conformities: number;
    overdue_non_conformities: number;
    upcoming_inspections: number;
    environmental_watch: number;
    environmental_breaches: number;
    open_safety_incidents: number;
    expiring_licences: number;
    average_compliance_score: number;
  };
  kpi_trend: Record<string, unknown>[];
  regional_compliance: Record<string, unknown>[];
  expiring_licences: ExpiringLicence[];
  notifications: Record<string, unknown>[];
  recent_applications: Application[];
  open_environmental_records: EnvRecord[];
  open_incidents: SafetyIncident[];
}

// --- capabilities, checklist, dashboard --------------------------------------

/**
 * What this caller may actually do. Derived server-side from organisation
 * membership, so the UI can gate actions against real permissions rather
 * than a locally chosen role.
 */
export function fetchMiningCapabilities(signal?: AbortSignal): Promise<MiningCapabilities> {
  return apiFetch<MiningCapabilities>(`${BASE}/me/`, { signal });
}

export function fetchMiningChecklist(signal?: AbortSignal): Promise<MiningChecklist> {
  return apiFetch<MiningChecklist>(`${BASE}/checklist/`, { signal });
}

export function fetchMiningDashboard(signal?: AbortSignal): Promise<MiningDashboard> {
  return apiFetch<MiningDashboard>(`${BASE}/dashboard/`, { signal });
}

export interface MiningListQuery {
  page?: number;
  page_size?: number;
  search?: string;
  ordering?: string;
  [key: string]: string | number | boolean | null | undefined;
}

// --- sites --------------------------------------------------------------------

export function listMineSites(query: MiningListQuery = {}): Promise<Paginated<MineSite>> {
  return apiFetch<Paginated<MineSite>>(`${BASE}/sites/`, { query });
}

export function getMineSite(id: UUID): Promise<MineSiteDetail> {
  return apiFetch<MineSiteDetail>(`${BASE}/sites/${id}/`);
}

export function createMineSite(input: Partial<MineSite>): Promise<MineSite> {
  return apiFetch<MineSite>(`${BASE}/sites/`, { method: "POST", body: input });
}

export function updateMineSite(id: UUID, patch: Partial<MineSite>): Promise<MineSite> {
  return apiFetch<MineSite>(`${BASE}/sites/${id}/`, { method: "PATCH", body: patch });
}

/** Site-side save of one evidence section. Returns it to `pending` review. */
export function saveSiteSection(
  id: UUID,
  key: SectionKey,
  patch: { fields?: MiningSectionField[] | undefined; summary?: string | undefined },
): Promise<ReviewSection> {
  return apiFetch<ReviewSection>(`${BASE}/sites/${id}/sections/${key}/`, {
    method: "PATCH",
    body: patch,
  });
}

/** Operator-side verdict on one evidence section. */
export function reviewSiteSection(
  id: UUID,
  key: SectionKey,
  input: { status: ReviewSectionStatus; note?: string | undefined; score?: number | undefined },
): Promise<ReviewSection> {
  return apiFetch<ReviewSection>(`${BASE}/sites/${id}/sections/${key}/review/`, {
    method: "POST",
    body: input,
  });
}

export function listSectionEvidence(id: UUID, key: SectionKey): Promise<Evidence[]> {
  return apiFetch<Evidence[]>(`${BASE}/sites/${id}/sections/${key}/evidence/`);
}

/**
 * Upload evidence to a section. Multipart, so the browser sets the boundary.
 */
export function uploadSectionEvidence(
  id: UUID,
  key: SectionKey,
  input: { name: string; kind?: string | undefined; file: File },
): Promise<Evidence> {
  const form = new FormData();
  form.append("name", input.name);
  if (input.kind) form.append("kind", input.kind);
  form.append("file", input.file);
  return apiFetch<Evidence>(`${BASE}/sites/${id}/sections/${key}/evidence/`, {
    method: "POST",
    body: form,
  });
}

export function downloadSiteEvidenceUrl(siteId: UUID, evidenceId: UUID): string {
  return `${BASE}/sites/${siteId}/evidence/${evidenceId}/download/`;
}

export function listScoreFactors(id: UUID): Promise<ScoreFactor[]> {
  return apiFetch<ScoreFactor[]>(`${BASE}/sites/${id}/score-factors/`);
}

export function addScoreFactor(
  id: UUID,
  input: {
    label: string;
    weight: number;
    score: number;
    reason?: string | undefined;
    trend?: string | undefined;
  },
): Promise<ScoreFactor> {
  return apiFetch<ScoreFactor>(`${BASE}/sites/${id}/score-factors/`, {
    method: "POST",
    body: input,
  });
}

/** Recomputes `compliance_score` from the site's current score factors. */
export function recomputeSiteScore(id: UUID): Promise<MineSite> {
  return apiFetch<MineSite>(`${BASE}/sites/${id}/recompute-score/`, { method: "POST" });
}

export function listSiteActivity(id: UUID, page?: number): Promise<Paginated<MiningAuditEvent>> {
  return apiFetch<Paginated<MiningAuditEvent>>(`${BASE}/sites/${id}/activity/`, {
    query: page ? { page } : {},
  });
}

// --- organisation profile ------------------------------------------------------

export function listOrganisationProfiles(
  query: MiningListQuery = {},
): Promise<Paginated<OrganisationProfile>> {
  return apiFetch<Paginated<OrganisationProfile>>(`${BASE}/organisation-profiles/`, { query });
}

export function createOrganisationProfile(input: {
  organisation: UUID;
  directors?: Record<string, unknown>[];
  beneficial_owners?: Record<string, unknown>[];
}): Promise<OrganisationProfile> {
  return apiFetch<OrganisationProfile>(`${BASE}/organisation-profiles/`, {
    method: "POST",
    body: input,
  });
}

export function updateOrganisationProfile(
  id: UUID,
  patch: Partial<OrganisationProfile>,
): Promise<OrganisationProfile> {
  return apiFetch<OrganisationProfile>(`${BASE}/organisation-profiles/${id}/`, {
    method: "PATCH",
    body: patch,
  });
}

// --- findings --------------------------------------------------------------------

export function listMiningNonConformities(
  query: MiningListQuery = {},
): Promise<Paginated<MiningNonConformity>> {
  return apiFetch<Paginated<MiningNonConformity>>(`${BASE}/non-conformities/`, { query });
}

export function createMiningNonConformity(input: {
  site: UUID;
  title: string;
  category?: string | undefined;
  severity: NonConformitySeverity;
  required_action?: string | undefined;
  responsible_person?: string | undefined;
  deadline: string;
}): Promise<MiningNonConformity> {
  return apiFetch<MiningNonConformity>(`${BASE}/non-conformities/`, {
    method: "POST",
    body: input,
  });
}

/**
 * Corrective-action evidence. Goes up as multipart when a file is attached, so
 * the browser can set the boundary.
 */
export function submitMiningNonConformityEvidence(
  id: UUID,
  input: { message: string; file?: File | null | undefined },
): Promise<CorrectiveSubmission> {
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
  return apiFetch<CorrectiveSubmission>(`${BASE}/non-conformities/${id}/submissions/`, {
    method: "POST",
    body,
  });
}

/** Accept the latest submission and close, or reject it and reopen the finding. */
export function closeMiningNonConformity(
  id: UUID,
  input: { accept: boolean; note?: string | undefined },
): Promise<MiningNonConformity> {
  return apiFetch<MiningNonConformity>(`${BASE}/non-conformities/${id}/close/`, {
    method: "POST",
    body: input,
  });
}

// --- operations -------------------------------------------------------------

export function listMiningInspections(
  query: MiningListQuery = {},
): Promise<Paginated<MiningInspection>> {
  return apiFetch<Paginated<MiningInspection>>(`${BASE}/inspections/`, { query });
}

export function createInspection(input: {
  site: UUID;
  type: InspectionType;
  scheduled_for?: string | null | undefined;
  inspector?: UUID | null | undefined;
  inspector_name?: string | undefined;
}): Promise<MiningInspection> {
  return apiFetch<MiningInspection>(`${BASE}/inspections/`, { method: "POST", body: input });
}

export function updateMiningInspection(
  id: UUID,
  patch: Partial<MiningInspection>,
): Promise<MiningInspection> {
  return apiFetch<MiningInspection>(`${BASE}/inspections/${id}/`, { method: "PATCH", body: patch });
}

export function listMiningSamples(query: MiningListQuery = {}): Promise<Paginated<MiningSample>> {
  return apiFetch<Paginated<MiningSample>>(`${BASE}/samples/`, { query });
}

export function createSample(
  input: Partial<MiningSample> & { site: UUID; collected_on: string },
): Promise<MiningSample> {
  return apiFetch<MiningSample>(`${BASE}/samples/`, { method: "POST", body: input });
}

export function updateSample(id: UUID, patch: Partial<MiningSample>): Promise<MiningSample> {
  return apiFetch<MiningSample>(`${BASE}/samples/${id}/`, { method: "PATCH", body: patch });
}

export function listEnvironmentalRecords(
  query: MiningListQuery = {},
): Promise<Paginated<EnvRecord>> {
  return apiFetch<Paginated<EnvRecord>>(`${BASE}/environmental-records/`, { query });
}

export function createEnvironmentalRecord(
  input: Partial<EnvRecord> & { site: UUID; metric: string; measured_on: string },
): Promise<EnvRecord> {
  return apiFetch<EnvRecord>(`${BASE}/environmental-records/`, { method: "POST", body: input });
}

export function updateEnvironmentalRecord(id: UUID, patch: Partial<EnvRecord>): Promise<EnvRecord> {
  return apiFetch<EnvRecord>(`${BASE}/environmental-records/${id}/`, {
    method: "PATCH",
    body: patch,
  });
}

export function listSafetyIncidents(
  query: MiningListQuery = {},
): Promise<Paginated<SafetyIncident>> {
  return apiFetch<Paginated<SafetyIncident>>(`${BASE}/safety-incidents/`, { query });
}

export function createSafetyIncident(
  input: Partial<SafetyIncident> & { site: UUID; date: string; type: string },
): Promise<SafetyIncident> {
  return apiFetch<SafetyIncident>(`${BASE}/safety-incidents/`, { method: "POST", body: input });
}

export function updateSafetyIncident(
  id: UUID,
  patch: Partial<SafetyIncident>,
): Promise<SafetyIncident> {
  return apiFetch<SafetyIncident>(`${BASE}/safety-incidents/${id}/`, {
    method: "PATCH",
    body: patch,
  });
}

// --- equipment (full CRUD, incl. delete) -------------------------------------

export function listEquipment(query: MiningListQuery = {}): Promise<Paginated<Equipment>> {
  return apiFetch<Paginated<Equipment>>(`${BASE}/equipment/`, { query });
}

export function createEquipment(
  input: Partial<Equipment> & { site: UUID; name: string },
): Promise<Equipment> {
  return apiFetch<Equipment>(`${BASE}/equipment/`, { method: "POST", body: input });
}

export function updateEquipment(id: UUID, patch: Partial<Equipment>): Promise<Equipment> {
  return apiFetch<Equipment>(`${BASE}/equipment/${id}/`, { method: "PATCH", body: patch });
}

export function deleteEquipment(id: UUID): Promise<void> {
  return apiFetch<void>(`${BASE}/equipment/${id}/`, { method: "DELETE" });
}

// --- applications & pending reviews -------------------------------------------

export function listMiningApplications(
  query: MiningListQuery = {},
): Promise<Paginated<Application>> {
  return apiFetch<Paginated<Application>>(`${BASE}/applications/`, { query });
}

export function createMiningApplication(
  input: Partial<Application> & { organisation: UUID; type: string; mineral: string },
): Promise<Application> {
  return apiFetch<Application>(`${BASE}/applications/`, { method: "POST", body: input });
}

export function updateApplication(id: UUID, patch: Partial<Application>): Promise<Application> {
  return apiFetch<Application>(`${BASE}/applications/${id}/`, { method: "PATCH", body: patch });
}

export function listPendingReviews(query: MiningListQuery = {}): Promise<Paginated<PendingReview>> {
  return apiFetch<Paginated<PendingReview>>(`${BASE}/pending-reviews/`, { query });
}

export function createPendingReview(
  input: Partial<PendingReview> & { site: UUID; subject: string; type: string },
): Promise<PendingReview> {
  return apiFetch<PendingReview>(`${BASE}/pending-reviews/`, { method: "POST", body: input });
}

export function updatePendingReview(
  id: UUID,
  patch: Partial<PendingReview>,
): Promise<PendingReview> {
  return apiFetch<PendingReview>(`${BASE}/pending-reviews/${id}/`, {
    method: "PATCH",
    body: patch,
  });
}

// --- info requests -------------------------------------------------------------

export function listInfoRequests(query: MiningListQuery = {}): Promise<Paginated<InfoRequest>> {
  return apiFetch<Paginated<InfoRequest>>(`${BASE}/info-requests/`, { query });
}

export function createInfoRequest(input: {
  site: UUID;
  section?: SectionKey | undefined;
  subject: string;
  details?: string | undefined;
  due_by?: string | null | undefined;
  priority?: Priority | undefined;
}): Promise<InfoRequest> {
  return apiFetch<InfoRequest>(`${BASE}/info-requests/`, { method: "POST", body: input });
}

/** The site's response. Closes the request server-side and stamps `response_at`. */
export function respondToInfoRequest(id: UUID, input: { message: string }): Promise<InfoRequest> {
  return apiFetch<InfoRequest>(`${BASE}/info-requests/${id}/respond/`, {
    method: "POST",
    body: input,
  });
}

// --- licences & documents -------------------------------------------------------

export function listLicences(query: MiningListQuery = {}): Promise<Paginated<LicenceDoc>> {
  return apiFetch<Paginated<LicenceDoc>>(`${BASE}/licences/`, { query });
}

/** Everything already expired or lapsing inside the register's warning window. */
export function listExpiringLicences(): Promise<ExpiringLicence[]> {
  return apiFetch<ExpiringLicence[]>(`${BASE}/licences/expiring/`);
}

/** Multipart when a file accompanies the licence record. */
export function uploadLicence(input: {
  site: UUID;
  number: string;
  type: string;
  authority?: string | undefined;
  issued_on?: string | null | undefined;
  expires_on?: string | null | undefined;
  file?: File | null | undefined;
}): Promise<LicenceDoc> {
  const { file, ...rest } = input;
  const form = new FormData();
  for (const [key, value] of Object.entries(rest)) {
    if (value === undefined || value === null) continue;
    form.append(key, String(value));
  }
  if (file) form.append("file", file);
  return apiFetch<LicenceDoc>(`${BASE}/licences/`, { method: "POST", body: form });
}

export function updateLicence(id: UUID, patch: Partial<LicenceDoc>): Promise<LicenceDoc> {
  return apiFetch<LicenceDoc>(`${BASE}/licences/${id}/`, { method: "PATCH", body: patch });
}

export function downloadLicenceUrl(id: UUID): string {
  return `${BASE}/licences/${id}/download/`;
}

export function listMiningDocuments(
  query: MiningListQuery = {},
): Promise<Paginated<DocumentRecord>> {
  return apiFetch<Paginated<DocumentRecord>>(`${BASE}/documents/`, { query });
}

export function uploadMiningDocument(input: {
  site: UUID;
  name: string;
  category?: string | undefined;
  expires_on?: string | null | undefined;
  file: File;
}): Promise<DocumentRecord> {
  const { file, ...rest } = input;
  const form = new FormData();
  for (const [key, value] of Object.entries(rest)) {
    if (value === undefined || value === null) continue;
    form.append(key, String(value));
  }
  form.append("file", file);
  return apiFetch<DocumentRecord>(`${BASE}/documents/`, { method: "POST", body: form });
}

/** Accept or reject a document. Separate from `status`'s expiry-derived states. */
export function reviewMiningDocument(
  id: UUID,
  input: { status: "verified" | "rejected" },
): Promise<DocumentRecord> {
  return apiFetch<DocumentRecord>(`${BASE}/documents/${id}/review/`, {
    method: "POST",
    body: input,
  });
}

export function downloadDocumentUrl(id: UUID): string {
  return `${BASE}/documents/${id}/download/`;
}

// --- reports & audit -------------------------------------------------------------

export type MiningReportKind = string;
export type ReportScope = string;
export type MiningReportPeriod = "last_month" | "last_quarter" | "year_to_date" | "all_time";

/**
 * Streams a PDF rather than returning JSON — the caller is expected to open
 * this as a download link / new tab rather than route it through `apiFetch`.
 */
export function miningReportUrl(input: {
  kind: MiningReportKind;
  scope?: ReportScope;
  period?: MiningReportPeriod;
}): string {
  const params = new URLSearchParams();
  params.set("kind", input.kind);
  if (input.scope) params.set("scope", input.scope);
  if (input.period) params.set("period", input.period);
  return `${BASE}/reports/?${params.toString()}`;
}

/** The register-wide trail. Operator/regulator only — it spans organisations. */
export function listMiningAudit(query: MiningListQuery = {}): Promise<Paginated<MiningAuditEvent>> {
  return apiFetch<Paginated<MiningAuditEvent>>(`${BASE}/audit/`, { query });
}
