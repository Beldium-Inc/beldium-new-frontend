import { apiFetch } from "./client";
import type { Paginated, UUID } from "./types";

// The Logistics Compliance register: haulage/logistics companies, their
// onboarding applications, fleet & driver records, and the operational
// evidence that accumulates against them. Everything here mirrors
// `beldium-backend/logistics/serializers.py` field-for-field, so the shapes
// below are the backend's, not a re-spelling.

const BASE = "/logistics";

export type LogisticsDomainKey =
  | "corporate"
  | "regulatory"
  | "fleet"
  | "driver"
  | "insurance"
  | "hs"
  | "operational"
  | "mineral"
  | "data";

export type LogisticsApplicationStatus =
  | "draft"
  | "submitted"
  | "under_review"
  | "awaiting_information"
  | "conditionally_approved"
  | "approved"
  | "rejected";

export type EvidenceStatus = "pending" | "verified" | "rejected";

export type DomainReviewStatus = "pending" | "passed" | "attention" | "failed";

export type CredentialValidity = "current" | "expiring" | "expired";

export interface LogisticsListQuery {
  page?: number;
  page_size?: number;
  search?: string;
  ordering?: string;
  [key: string]: string | number | boolean | null | undefined;
}

// --- companies ---------------------------------------------------------------

export interface LogisticsCompany {
  id: UUID;
  organisation: UUID;
  reference: string;
  name: string;
  registration_number: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  incorporated_on: string | null;
  employees: number;
  annual_tonnage: string;
  services: string[];
  created_at: string;
  updated_at: string;
}

export interface NewCompanyInput {
  organisation: UUID;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  incorporated_on?: string | null | undefined;
  employees?: number | undefined;
  annual_tonnage?: string | number | undefined;
  services: string[];
}

export function listCompanies(query: LogisticsListQuery = {}): Promise<Paginated<LogisticsCompany>> {
  return apiFetch<Paginated<LogisticsCompany>>(`${BASE}/companies/`, { query });
}

export function getCompany(id: UUID): Promise<LogisticsCompany> {
  return apiFetch<LogisticsCompany>(`${BASE}/companies/${id}/`);
}

export function createCompany(input: NewCompanyInput): Promise<LogisticsCompany> {
  return apiFetch<LogisticsCompany>(`${BASE}/companies/`, { method: "POST", body: input });
}

export function updateCompany(
  id: UUID,
  patch: Partial<NewCompanyInput>,
): Promise<LogisticsCompany> {
  return apiFetch<LogisticsCompany>(`${BASE}/companies/${id}/`, { method: "PATCH", body: patch });
}

// --- operating locations ------------------------------------------------------

export interface OperatingLocation {
  id: UUID;
  company: UUID;
  name: string;
  location_type: string;
  address: string;
  state: string;
  country: string;
  staff_count: number;
  created_at: string;
  updated_at: string;
}

export function listLocations(query: LogisticsListQuery = {}): Promise<Paginated<OperatingLocation>> {
  return apiFetch<Paginated<OperatingLocation>>(`${BASE}/locations/`, { query });
}

export function createLocation(
  input: Omit<OperatingLocation, "id" | "created_at" | "updated_at">,
): Promise<OperatingLocation> {
  return apiFetch<OperatingLocation>(`${BASE}/locations/`, { method: "POST", body: input });
}

export function updateLocation(
  id: UUID,
  patch: Partial<Omit<OperatingLocation, "id" | "company" | "created_at" | "updated_at">>,
): Promise<OperatingLocation> {
  return apiFetch<OperatingLocation>(`${BASE}/locations/${id}/`, { method: "PATCH", body: patch });
}

// --- vehicles ------------------------------------------------------------------

export interface Vehicle {
  id: UUID;
  company: UUID;
  registration: string;
  vin: string;
  vehicle_type: string;
  make: string;
  model: string;
  year: number;
  capacity: string;
  capacity_unit: "tonnes" | "litres" | "seats";
  ownership: "owned" | "leased" | "contracted";
  insurer: string;
  insurance_expiry: string;
  roadworthiness_expiry: string;
  gps_status: "unknown" | "active" | "intermittent" | "inactive";
  location: string;
  is_active: boolean;
  credential_status: CredentialValidity;
  created_at: string;
  updated_at: string;
}

export type NewVehicleInput = Omit<
  Vehicle,
  "id" | "credential_status" | "created_at" | "updated_at"
>;

export function listVehicles(query: LogisticsListQuery = {}): Promise<Paginated<Vehicle>> {
  return apiFetch<Paginated<Vehicle>>(`${BASE}/vehicles/`, { query });
}

export function createVehicle(input: NewVehicleInput): Promise<Vehicle> {
  return apiFetch<Vehicle>(`${BASE}/vehicles/`, { method: "POST", body: input });
}

export function updateVehicle(id: UUID, patch: Partial<NewVehicleInput>): Promise<Vehicle> {
  return apiFetch<Vehicle>(`${BASE}/vehicles/${id}/`, { method: "PATCH", body: patch });
}

// --- drivers ---------------------------------------------------------------

export interface Driver {
  id: UUID;
  company: UUID;
  full_name: string;
  licence_number: string;
  licence_class: string;
  licence_expiry: string;
  national_id: string;
  years_experience: number;
  assigned_vehicle: UUID | null;
  training: string[];
  medical_expiry: string;
  is_active: boolean;
  credential_status: CredentialValidity;
  created_at: string;
  updated_at: string;
}

export type NewDriverInput = Omit<
  Driver,
  "id" | "credential_status" | "created_at" | "updated_at"
>;

export function listDrivers(query: LogisticsListQuery = {}): Promise<Paginated<Driver>> {
  return apiFetch<Paginated<Driver>>(`${BASE}/drivers/`, { query });
}

export function createDriver(input: NewDriverInput): Promise<Driver> {
  return apiFetch<Driver>(`${BASE}/drivers/`, { method: "POST", body: input });
}

export function updateDriver(id: UUID, patch: Partial<NewDriverInput>): Promise<Driver> {
  return apiFetch<Driver>(`${BASE}/drivers/${id}/`, { method: "PATCH", body: patch });
}

// --- access grants -----------------------------------------------------------

export interface AccessGrant {
  id: UUID;
  company: UUID;
  user: UUID;
  role: "reviewer" | "regulator";
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function listAccessGrants(query: LogisticsListQuery = {}): Promise<Paginated<AccessGrant>> {
  return apiFetch<Paginated<AccessGrant>>(`${BASE}/access-grants/`, { query });
}

export function createAccessGrant(input: {
  company: UUID;
  user: UUID;
  role: AccessGrant["role"];
  is_active?: boolean | undefined;
}): Promise<AccessGrant> {
  return apiFetch<AccessGrant>(`${BASE}/access-grants/`, { method: "POST", body: input });
}

export function updateAccessGrant(
  id: UUID,
  patch: { is_active?: boolean | undefined; role?: AccessGrant["role"] | undefined },
): Promise<AccessGrant> {
  return apiFetch<AccessGrant>(`${BASE}/access-grants/${id}/`, { method: "PATCH", body: patch });
}

// --- applications ------------------------------------------------------------

export interface DomainReview {
  key: LogisticsDomainKey;
  data: Record<string, unknown>;
  applicable: boolean;
  status: DomainReviewStatus;
  score: number;
  review_notes: string;
  reviewed_at: string | null;
}

export interface ApprovalCondition {
  id: UUID;
  title: string;
  description: string;
  due_date: string;
  service_scope: string;
  cleared_at: string | null;
  is_overdue: boolean;
}

export interface LogisticsApplication {
  id: UUID;
  company: UUID;
  created_by: UUID;
  reviewer: UUID | null;
  status: LogisticsApplicationStatus;
  submitted_at: string | null;
  reviewed_at: string | null;
  rationale: string;
  policy_version: string;
  domain_weights: Record<string, number>;
  sections: DomainReview[];
  conditions: ApprovalCondition[];
  progress: {
    percent: number;
    checks: Record<string, boolean>;
    missing_sections: string[];
    missing_document_domains: string[];
    documents_submitted: number;
    domains_required: number;
  };
  risk: {
    compliance_score: number;
    risk_band: "low" | "medium" | "high";
    policy_version: string;
    weights: Record<string, number>;
    domains: Record<string, { score: number; status: DomainReviewStatus }>;
  };
  created_at: string;
  updated_at: string;
}

export interface NewLogisticsApplicationInput {
  company: UUID;
}

export function listApplications(query: LogisticsListQuery = {}): Promise<Paginated<LogisticsApplication>> {
  return apiFetch<Paginated<LogisticsApplication>>(`${BASE}/applications/`, { query });
}

export function getApplication(id: UUID): Promise<LogisticsApplication> {
  return apiFetch<LogisticsApplication>(`${BASE}/applications/${id}/`);
}

export function createApplication(input: NewLogisticsApplicationInput): Promise<LogisticsApplication> {
  return apiFetch<LogisticsApplication>(`${BASE}/applications/`, { method: "POST", body: input });
}

/** Applicant-side save of one domain section. Returns it to `pending` review. */
export function saveLogisticsApplicationSection(
  id: UUID,
  key: LogisticsDomainKey,
  data: Record<string, unknown>,
): Promise<DomainReview> {
  return apiFetch<DomainReview>(`${BASE}/applications/${id}/sections/${key}/`, {
    method: "PATCH",
    body: { data },
  });
}

/** Operator-side verdict on one domain section. */
export function reviewLogisticsApplicationSection(
  id: UUID,
  key: LogisticsDomainKey,
  input: { status: "passed" | "attention" | "failed"; score: number; notes: string; applicable?: boolean | undefined },
): Promise<DomainReview> {
  return apiFetch<DomainReview>(`${BASE}/applications/${id}/sections/${key}/review/`, {
    method: "POST",
    body: input,
  });
}

export function assignReviewer(id: UUID, reviewer: UUID): Promise<LogisticsApplication> {
  return apiFetch<LogisticsApplication>(`${BASE}/applications/${id}/assign-reviewer/`, {
    method: "POST",
    body: { reviewer },
  });
}

export function startReview(id: UUID): Promise<LogisticsApplication> {
  return apiFetch<LogisticsApplication>(`${BASE}/applications/${id}/start-review/`, {
    method: "POST",
  });
}

export function submitLogisticsApplication(id: UUID): Promise<LogisticsApplication> {
  return apiFetch<LogisticsApplication>(`${BASE}/applications/${id}/submit/`, { method: "POST" });
}

export function decideApplication(
  id: UUID,
  input: {
    status: "approved" | "conditionally_approved" | "rejected";
    rationale: string;
    conditions?:
      | { title: string; description: string; due_date: string; service_scope?: string | undefined }[]
      | undefined;
  },
): Promise<LogisticsApplication> {
  return apiFetch<LogisticsApplication>(`${BASE}/applications/${id}/decide/`, {
    method: "POST",
    body: input,
  });
}

export interface LogisticsAuditEvent {
  id: UUID;
  event_type: string;
  created_at: string;
  actor_id: UUID | null;
}

export function listLogisticsApplicationActivity(id: UUID): Promise<{ events: LogisticsAuditEvent[] }> {
  return apiFetch<{ events: LogisticsAuditEvent[] }>(`${BASE}/applications/${id}/activity/`);
}

// --- documents (nested under an application) ----------------------------------

export interface LogisticsDocument {
  id: UUID;
  application: UUID;
  domain: LogisticsDomainKey;
  document_type: string;
  title: string;
  issuer: string;
  reference: string;
  issued_on: string | null;
  expires_on: string | null;
  service_scope: string;
  vehicle: UUID | null;
  driver: UUID | null;
  condition: UUID | null;
  original_name: string;
  version: number;
  is_current: boolean;
  status: EvidenceStatus;
  uploaded_by: UUID;
  reviewed_by: UUID | null;
  reviewed_at: string | null;
  review_notes: string;
  download_url: string;
  validity: CredentialValidity;
  created_at: string;
  updated_at: string;
}

export function listLogisticsApplicationDocuments(id: UUID): Promise<LogisticsDocument[]> {
  return apiFetch<LogisticsDocument[]>(`${BASE}/applications/${id}/documents/`);
}

export interface UploadDocumentInput {
  domain: LogisticsDomainKey;
  document_type: string;
  title: string;
  file: File;
  issuer?: string | undefined;
  reference?: string | undefined;
  issued_on?: string | null | undefined;
  expires_on?: string | null | undefined;
  service_scope?: string | undefined;
  vehicle?: UUID | null | undefined;
  driver?: UUID | null | undefined;
  condition?: UUID | null | undefined;
}

function documentForm(input: object): FormData {
  const form = new FormData();
  for (const [key, value] of Object.entries(input)) {
    if (value === undefined || value === null || value === "") continue;
    form.append(key, value instanceof File ? value : String(value));
  }
  return form;
}

export function uploadLogisticsApplicationDocument(
  id: UUID,
  input: UploadDocumentInput,
): Promise<LogisticsDocument> {
  return apiFetch<LogisticsDocument>(`${BASE}/applications/${id}/documents/`, {
    method: "POST",
    body: documentForm(input),
  });
}

export function listLogisticsDocuments(query: LogisticsListQuery = {}): Promise<Paginated<LogisticsDocument>> {
  return apiFetch<Paginated<LogisticsDocument>>(`${BASE}/documents/`, { query });
}

export function documentDownloadUrl(id: UUID): string {
  return `${BASE}/documents/${id}/download/`;
}

export function listExpiringLogisticsDocuments(): Promise<LogisticsDocument[]> {
  return apiFetch<LogisticsDocument[]>(`${BASE}/documents/expiring/`);
}

export function reviewDocument(
  id: UUID,
  input: { status: "verified" | "rejected"; notes: string },
): Promise<LogisticsDocument> {
  return apiFetch<LogisticsDocument>(`${BASE}/documents/${id}/review/`, {
    method: "POST",
    body: input,
  });
}

export interface DocumentNote {
  id: UUID;
  body: string;
  internal: boolean;
  author: UUID;
  created_at: string;
}

export function listDocumentNotes(id: UUID): Promise<DocumentNote[]> {
  return apiFetch<DocumentNote[]>(`${BASE}/documents/${id}/notes/`);
}

export function addDocumentNote(
  id: UUID,
  input: { body: string; internal?: boolean | undefined },
): Promise<DocumentNote> {
  return apiFetch<DocumentNote>(`${BASE}/documents/${id}/notes/`, { method: "POST", body: input });
}

// --- information requests -----------------------------------------------------

export interface RequestResponse {
  id: UUID;
  message: string;
  documents: UUID[];
  author: UUID;
  created_at: string;
}

export interface InformationRequest {
  id: UUID;
  application: UUID;
  reason: string;
  message: string;
  items: string[];
  due_date: string;
  status: "open" | "responded" | "accepted";
  raised_by: UUID;
  review_notes: string;
  responses: RequestResponse[];
  is_overdue: boolean;
  created_at: string;
}

export function listApplicationRequests(id: UUID): Promise<InformationRequest[]> {
  return apiFetch<InformationRequest[]>(`${BASE}/applications/${id}/requests/`);
}

export function createInformationRequest(
  id: UUID,
  input: { reason: string; message: string; items: string[]; due_date: string },
): Promise<InformationRequest> {
  return apiFetch<InformationRequest>(`${BASE}/applications/${id}/requests/`, {
    method: "POST",
    body: input,
  });
}

export function listRequests(query: LogisticsListQuery = {}): Promise<Paginated<InformationRequest>> {
  return apiFetch<Paginated<InformationRequest>>(`${BASE}/requests/`, { query });
}

export function respondToRequest(
  id: UUID,
  input: { message: string; documents: UUID[] },
): Promise<RequestResponse> {
  return apiFetch<RequestResponse>(`${BASE}/requests/${id}/responses/`, {
    method: "POST",
    body: input,
  });
}

export function reviewRequestResponse(
  id: UUID,
  input: { accepted: boolean; notes: string },
): Promise<InformationRequest> {
  return apiFetch<InformationRequest>(`${BASE}/requests/${id}/review-response/`, {
    method: "POST",
    body: input,
  });
}

// --- conditions ----------------------------------------------------------------

export function listApplicationConditions(id: UUID): Promise<ApprovalCondition[]> {
  return apiFetch<ApprovalCondition[]>(`${BASE}/applications/${id}/conditions/`);
}

export function createCondition(
  id: UUID,
  input: { title: string; description: string; due_date: string; service_scope?: string | undefined },
): Promise<ApprovalCondition> {
  return apiFetch<ApprovalCondition>(`${BASE}/applications/${id}/conditions/`, {
    method: "POST",
    body: input,
  });
}

export function listConditions(query: LogisticsListQuery = {}): Promise<Paginated<ApprovalCondition>> {
  return apiFetch<Paginated<ApprovalCondition>>(`${BASE}/conditions/`, { query });
}

export function submitConditionEvidence(
  id: UUID,
  input: {
    domain: LogisticsDomainKey;
    document_type: string;
    title: string;
    file: File;
    issuer?: string | undefined;
    reference?: string | undefined;
    issued_on?: string | null | undefined;
    expires_on?: string | null | undefined;
  },
): Promise<LogisticsDocument> {
  return apiFetch<LogisticsDocument>(`${BASE}/conditions/${id}/evidence/`, {
    method: "POST",
    body: documentForm(input),
  });
}

export function reviewCondition(
  id: UUID,
  input: { notes: string },
): Promise<ApprovalCondition> {
  return apiFetch<ApprovalCondition>(`${BASE}/conditions/${id}/review/`, {
    method: "POST",
    body: input,
  });
}

// --- restrictions ----------------------------------------------------------------

export interface ScopeRestriction {
  id: UUID;
  company: UUID;
  service_scope: string;
  reason: string;
  source_document: UUID | null;
  source_condition: UUID | null;
  automatic: boolean;
  applied_by: UUID | null;
  resolved_at: string | null;
  resolved_by: UUID | null;
  resolution_notes: string;
  created_at: string;
  updated_at: string;
}

export function listRestrictions(query: LogisticsListQuery = {}): Promise<Paginated<ScopeRestriction>> {
  return apiFetch<Paginated<ScopeRestriction>>(`${BASE}/restrictions/`, { query });
}

export function createRestriction(input: {
  company: UUID;
  service_scope: string;
  reason: string;
}): Promise<ScopeRestriction> {
  return apiFetch<ScopeRestriction>(`${BASE}/restrictions/`, { method: "POST", body: input });
}

export function resolveRestriction(
  id: UUID,
  input: { notes: string },
): Promise<ScopeRestriction> {
  return apiFetch<ScopeRestriction>(`${BASE}/restrictions/${id}/resolve/`, {
    method: "POST",
    body: input,
  });
}

// --- notifications & alerts ---------------------------------------------------

export interface Notification {
  id: UUID;
  company: UUID;
  title: string;
  body: string;
  read_at: string | null;
  created_at: string;
}

export function listNotifications(query: LogisticsListQuery = {}): Promise<Paginated<Notification>> {
  return apiFetch<Paginated<Notification>>(`${BASE}/notifications/`, { query });
}

export function markNotificationRead(id: UUID): Promise<Notification> {
  return apiFetch<Notification>(`${BASE}/notifications/${id}/mark-read/`, { method: "POST" });
}

export interface MonitoringEvent {
  id: UUID;
  company: UUID;
  event_key: string;
  kind: string;
  message: string;
  document: UUID | null;
  created_at: string;
  updated_at: string;
}

export function listAlerts(query: LogisticsListQuery = {}): Promise<Paginated<MonitoringEvent>> {
  return apiFetch<Paginated<MonitoringEvent>>(`${BASE}/alerts/`, { query });
}

// --- reports ---------------------------------------------------------------

export interface LogisticsReport {
  id: UUID;
  report_type: string;
  created_at: string;
}

export function listReports(query: LogisticsListQuery = {}): Promise<Paginated<LogisticsReport>> {
  return apiFetch<Paginated<LogisticsReport>>(`${BASE}/reports/`, { query });
}

/** Compile a CSV register export and store it. Spans every company the caller can see. */
export function generateLogisticsReport(): Promise<LogisticsReport> {
  return apiFetch<LogisticsReport>(`${BASE}/reports/`, { method: "POST" });
}

export function reportDownloadUrl(id: UUID): string {
  return `${BASE}/reports/${id}/download/`;
}

// --- summary / flat routes ---------------------------------------------------

export interface LogisticsMe {
  is_staff: boolean;
  companies: {
    id: UUID;
    name: string;
    can_edit: boolean;
    can_review: boolean;
    can_read: boolean;
  }[];
}

export function fetchMe(signal?: AbortSignal): Promise<LogisticsMe> {
  return apiFetch<LogisticsMe>(`${BASE}/me/`, { signal });
}

export interface LogisticsDashboardCompany {
  company_id: UUID;
  reference: string;
  name: string;
  application_id: UUID | null;
  status: LogisticsApplicationStatus | "not_started";
  progress: LogisticsApplication["progress"] | null;
  risk: LogisticsApplication["risk"] | null;
  fleet_count: number;
  driver_count: number;
  open_requests: number;
  expiring_documents: number;
  open_alerts: number;
  permitted_scopes: string[];
  restricted_scopes: string[];
}

export interface LogisticsDashboard {
  companies: LogisticsDashboardCompany[];
  company_count: number;
  totals: {
    fleet_count: number;
    driver_count: number;
    open_requests: number;
    expiring_documents: number;
    open_alerts: number;
    restricted_scopes: number;
  };
  unread_notifications: number;
}

export function fetchLogisticsDashboard(signal?: AbortSignal): Promise<LogisticsDashboard> {
  return apiFetch<LogisticsDashboard>(`${BASE}/dashboard/`, { signal });
}

export interface LogisticsRiskRow {
  company_id: UUID;
  application_id: UUID;
  compliance_score: number;
  risk_band: "low" | "medium" | "high";
  policy_version: string;
  weights: Record<string, number>;
  domains: Record<string, { score: number; status: DomainReviewStatus }>;
}

export function fetchRisk(signal?: AbortSignal): Promise<{ applications: LogisticsRiskRow[] }> {
  return apiFetch<{ applications: LogisticsRiskRow[] }>(`${BASE}/risk/`, { signal });
}

export function fetchAudit(signal?: AbortSignal): Promise<{ events: LogisticsAuditEvent[] }> {
  return apiFetch<{ events: LogisticsAuditEvent[] }>(`${BASE}/audit/`, { signal });
}
