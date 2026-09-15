import { apiFetch } from "./client";
import type { Paginated, UUID } from "./types";

// The Export Compliance register: exporters, their admission applications
// (reviewed domain-by-domain), the products/buyers/shipments they operate,
// and the evidence and findings raised against them. Mirrors
// `beldium-backend/export/serializers.py` field-for-field. Names that would
// otherwise collide with another vertical's module carry an `Export` prefix,
// same convention as `mining.ts` / `logistics.ts`.

const BASE = "/export";

export interface ExportListQuery {
  page?: number;
  page_size?: number;
  search?: string;
  ordering?: string;
  [key: string]: string | number | boolean | null | undefined;
}

const FULL_PAGE: ExportListQuery = { page_size: 100 };

export type ExportDomainKey =
  | "exporter"
  | "product"
  | "buyer"
  | "shipment"
  | "customs"
  | "quality"
  | "logistics"
  | "finance";

export const EXPORT_DOMAIN_KEYS: ExportDomainKey[] = [
  "exporter",
  "product",
  "buyer",
  "shipment",
  "customs",
  "quality",
  "logistics",
  "finance",
];

export const EXPORT_DOMAIN_LABELS: Record<ExportDomainKey, string> = {
  exporter: "Exporter profile",
  product: "Product classification",
  buyer: "Buyer and destination",
  shipment: "Shipment plan",
  customs: "Customs documentation",
  quality: "Quality certificate",
  logistics: "Logistics handoff",
  finance: "Finance and proceeds",
};

export type ExportApplicationStatus =
  | "draft"
  | "submitted"
  | "under_review"
  | "awaiting_information"
  | "conditionally_approved"
  | "approved"
  | "rejected";

export type ExportDomainStatus = "pending" | "passed" | "attention" | "failed";

export type ExportEvidenceStatus = "pending" | "verified" | "rejected";

export type ExportDocumentValidity = "current" | "expiring" | "expired";

export interface Exporter {
  id: UUID;
  organisation: UUID;
  name: string;
  registration_number: string;
  reference: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  export_license_number: string;
  license_expires_on: string | null;
  destinations: string[];
  product_categories: string[];
  created_at: string;
  updated_at: string;
}

export interface ExportProduct {
  id: UUID;
  exporter: UUID;
  name: string;
  description: string;
  hs_code: string;
  origin_state: string;
  unit: string;
  annual_capacity: string;
  controlled: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ExportBuyer {
  id: UUID;
  exporter: UUID;
  name: string;
  country: string;
  address: string;
  contact_email: string;
  tax_identifier: string;
  screening_status: "pending" | "cleared" | "flagged";
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type ExportShipmentStatus = "planned" | "ready" | "cleared" | "shipped" | "held" | "cancelled";

export interface ExportShipment {
  id: UUID;
  exporter: UUID;
  reference: string;
  product: UUID;
  buyer: UUID;
  destination_country: string;
  port_of_loading: string;
  port_of_discharge: string;
  quantity: string;
  unit: string;
  estimated_value: string;
  currency: string;
  expected_ship_date: string;
  status: ExportShipmentStatus;
  decision_outcome: "" | "cleared" | "conditionally_cleared" | "declined";
  decision_by: UUID | null;
  decision_at: string | null;
  decision_rationale: string;
  decision_conditions: string;
  checklist: ExportShipmentChecklistItem[];
  non_conformities: ExportShipmentNonConformity[];
  readiness: number | null;
  created_at: string;
  updated_at: string;
}

export type ExportChecklistState = "pass" | "open" | "fail";

export interface ExportShipmentChecklistItem {
  id: UUID;
  shipment: UUID;
  domain: ExportDomainKey;
  label: string;
  detail: string;
  state: ExportChecklistState;
  created_at: string;
  updated_at: string;
}

export type ExportNonConformitySeverity = "minor" | "major" | "critical";
export type ExportNonConformityStatus = "open" | "responded" | "closed";

export interface ExportShipmentNonConformity {
  id: UUID;
  shipment: UUID;
  domain: ExportDomainKey;
  title: string;
  detail: string;
  severity: ExportNonConformitySeverity;
  status: ExportNonConformityStatus;
  raised_by: UUID | null;
  response: string;
  created_at: string;
  updated_at: string;
}

export interface ExportAccessGrant {
  id: UUID;
  exporter: UUID;
  user: UUID;
  role: "reviewer" | "regulator";
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ExportDomainReview {
  key: ExportDomainKey;
  data: Record<string, unknown>;
  applicable: boolean;
  status: ExportDomainStatus;
  score: number;
  review_notes: string;
  reviewed_at: string | null;
}

export interface ExportCondition {
  id: UUID;
  title: string;
  description: string;
  due_date: string;
  domain: ExportDomainKey | "";
  cleared_at: string | null;
  is_overdue: boolean;
}

export interface ExportDocument {
  id: UUID;
  application: UUID;
  domain: ExportDomainKey;
  document_type: string;
  title: string;
  issuer: string;
  reference: string;
  issued_on: string | null;
  expires_on: string | null;
  shipment: UUID | null;
  condition: UUID | null;
  original_name: string;
  version: number;
  is_current: boolean;
  status: ExportEvidenceStatus;
  uploaded_by: UUID;
  reviewed_by: UUID | null;
  reviewed_at: string | null;
  review_notes: string;
  download_url: string;
  validity: ExportDocumentValidity;
  created_at: string;
  updated_at: string;
}

export interface ExportRequestResponse {
  id: UUID;
  message: string;
  documents: UUID[];
  author: UUID;
  created_at: string;
}

export interface ExportInformationRequest {
  id: UUID;
  application: UUID;
  reason: string;
  message: string;
  items: string[];
  due_date: string;
  status: "open" | "responded" | "accepted";
  raised_by: UUID;
  review_notes: string;
  responses: ExportRequestResponse[];
  is_overdue: boolean;
  created_at: string;
}

export interface ExportApplication {
  id: UUID;
  exporter: UUID;
  created_by: UUID;
  reviewer: UUID | null;
  status: ExportApplicationStatus;
  submitted_at: string | null;
  reviewed_at: string | null;
  rationale: string;
  policy_version: string;
  domain_weights: Record<string, number>;
  sections: ExportDomainReview[];
  conditions: ExportCondition[];
  progress: { total: number; complete: number; percent: number };
  risk: { compliance_score: number; risk_band: "low" | "medium" | "high" };
  created_at: string;
  updated_at: string;
}

export interface ExportNotification {
  id: UUID;
  exporter: UUID;
  title: string;
  body: string;
  read_at: string | null;
  created_at: string;
}

export interface ExportReport {
  id: UUID;
  report_type: string;
  created_at: string;
}

export interface ExportCapabilities {
  is_staff: boolean;
  exporters: { id: UUID; name: string; can_edit: boolean; can_review: boolean; can_read: boolean }[];
}

export interface ExportDashboardRow {
  exporter_id: UUID;
  reference: string;
  name: string;
  application_id: UUID | null;
  status: ExportApplicationStatus | "not_started";
  progress: { total: number; complete: number; percent: number } | null;
  risk: { compliance_score: number; risk_band: "low" | "medium" | "high" } | null;
  products: number;
  buyers: number;
  shipments: number;
  open_requests: number;
  expiring_documents: number;
}

export interface ExportDashboard {
  exporters: ExportDashboardRow[];
  exporter_count: number;
  totals: {
    products: number;
    buyers: number;
    shipments: number;
    open_requests: number;
    expiring_documents: number;
  };
  unread_notifications: number;
}

export interface ExportRiskRow {
  exporter_id: UUID;
  application_id: UUID;
  compliance_score: number;
  risk_band: "low" | "medium" | "high";
}

export interface ExportAuditEvent {
  id: UUID;
  event_type: string;
  created_at: string;
  actor_id: UUID | null;
}

// --- capabilities / dashboard / risk / audit --------------------------------

export function fetchExportCapabilities(signal?: AbortSignal): Promise<ExportCapabilities> {
  return apiFetch<ExportCapabilities>(`${BASE}/me/`, { signal });
}

export function fetchExportDashboard(signal?: AbortSignal): Promise<ExportDashboard> {
  return apiFetch<ExportDashboard>(`${BASE}/dashboard/`, { signal });
}

export function fetchExportRisk(signal?: AbortSignal): Promise<{ applications: ExportRiskRow[] }> {
  return apiFetch<{ applications: ExportRiskRow[] }>(`${BASE}/risk/`, { signal });
}

export function fetchExportAudit(signal?: AbortSignal): Promise<{ events: ExportAuditEvent[] }> {
  return apiFetch<{ events: ExportAuditEvent[] }>(`${BASE}/audit/`, { signal });
}

// --- exporters ---------------------------------------------------------------

export function listExporters(query: ExportListQuery = FULL_PAGE): Promise<Paginated<Exporter>> {
  return apiFetch<Paginated<Exporter>>(`${BASE}/exporters/`, { query });
}

export function getExporter(id: UUID): Promise<Exporter> {
  return apiFetch<Exporter>(`${BASE}/exporters/${id}/`);
}

export interface NewExporterInput {
  organisation: UUID;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  export_license_number?: string | undefined;
  license_expires_on?: string | null | undefined;
  destinations: string[];
  product_categories: string[];
}

export function createExporter(input: NewExporterInput): Promise<Exporter> {
  return apiFetch<Exporter>(`${BASE}/exporters/`, { method: "POST", body: input });
}

export function updateExporter(id: UUID, patch: Partial<NewExporterInput>): Promise<Exporter> {
  return apiFetch<Exporter>(`${BASE}/exporters/${id}/`, { method: "PATCH", body: patch });
}

// --- products / buyers / shipments -------------------------------------------

export function listExportProducts(query: ExportListQuery = FULL_PAGE): Promise<Paginated<ExportProduct>> {
  return apiFetch<Paginated<ExportProduct>>(`${BASE}/products/`, { query });
}

export function createExportProduct(
  input: Omit<ExportProduct, "id" | "created_at" | "updated_at">,
): Promise<ExportProduct> {
  return apiFetch<ExportProduct>(`${BASE}/products/`, { method: "POST", body: input });
}

export function updateExportProduct(id: UUID, patch: Partial<ExportProduct>): Promise<ExportProduct> {
  return apiFetch<ExportProduct>(`${BASE}/products/${id}/`, { method: "PATCH", body: patch });
}

export function listExportBuyers(query: ExportListQuery = FULL_PAGE): Promise<Paginated<ExportBuyer>> {
  return apiFetch<Paginated<ExportBuyer>>(`${BASE}/buyers/`, { query });
}

export function createExportBuyer(
  input: Omit<ExportBuyer, "id" | "created_at" | "updated_at">,
): Promise<ExportBuyer> {
  return apiFetch<ExportBuyer>(`${BASE}/buyers/`, { method: "POST", body: input });
}

export function updateExportBuyer(id: UUID, patch: Partial<ExportBuyer>): Promise<ExportBuyer> {
  return apiFetch<ExportBuyer>(`${BASE}/buyers/${id}/`, { method: "PATCH", body: patch });
}

export function listExportShipments(query: ExportListQuery = FULL_PAGE): Promise<Paginated<ExportShipment>> {
  return apiFetch<Paginated<ExportShipment>>(`${BASE}/shipments/`, { query });
}

export function createExportShipment(
  input: Omit<
    ExportShipment,
    | "id"
    | "reference"
    | "created_at"
    | "updated_at"
    | "decision_outcome"
    | "decision_by"
    | "decision_at"
    | "decision_rationale"
    | "decision_conditions"
    | "checklist"
    | "non_conformities"
    | "readiness"
  >,
): Promise<ExportShipment> {
  return apiFetch<ExportShipment>(`${BASE}/shipments/`, { method: "POST", body: input });
}

export function updateExportShipment(id: UUID, patch: Partial<ExportShipment>): Promise<ExportShipment> {
  return apiFetch<ExportShipment>(`${BASE}/shipments/${id}/`, { method: "PATCH", body: patch });
}

export function listShipmentChecklist(shipmentId: UUID): Promise<ExportShipmentChecklistItem[]> {
  return apiFetch<ExportShipmentChecklistItem[]>(`${BASE}/shipments/${shipmentId}/checklist/`);
}

export function createShipmentChecklistItem(
  shipmentId: UUID,
  input: { domain: ExportDomainKey; label: string; detail?: string | undefined; state?: ExportChecklistState | undefined },
): Promise<ExportShipmentChecklistItem> {
  return apiFetch<ExportShipmentChecklistItem>(`${BASE}/shipments/${shipmentId}/checklist/`, {
    method: "POST",
    body: input,
  });
}

export function setShipmentChecklistState(
  shipmentId: UUID,
  itemId: UUID,
  state: ExportChecklistState,
): Promise<ExportShipmentChecklistItem> {
  return apiFetch<ExportShipmentChecklistItem>(`${BASE}/shipments/${shipmentId}/checklist/${itemId}/`, {
    method: "PATCH",
    body: { state },
  });
}

export function listShipmentNonConformities(shipmentId: UUID): Promise<ExportShipmentNonConformity[]> {
  return apiFetch<ExportShipmentNonConformity[]>(`${BASE}/shipments/${shipmentId}/non-conformities/`);
}

export function raiseShipmentNonConformity(
  shipmentId: UUID,
  input: { domain: ExportDomainKey; title: string; detail?: string | undefined; severity: ExportNonConformitySeverity },
): Promise<ExportShipmentNonConformity> {
  return apiFetch<ExportShipmentNonConformity>(`${BASE}/shipments/${shipmentId}/non-conformities/`, {
    method: "POST",
    body: input,
  });
}

export function respondToShipmentNonConformity(
  shipmentId: UUID,
  ncId: UUID,
  response: string,
): Promise<ExportShipmentNonConformity> {
  return apiFetch<ExportShipmentNonConformity>(
    `${BASE}/shipments/${shipmentId}/non-conformities/${ncId}/respond/`,
    { method: "POST", body: { response } },
  );
}

export function closeShipmentNonConformity(
  shipmentId: UUID,
  ncId: UUID,
): Promise<ExportShipmentNonConformity> {
  return apiFetch<ExportShipmentNonConformity>(
    `${BASE}/shipments/${shipmentId}/non-conformities/${ncId}/close/`,
    { method: "POST" },
  );
}

export function decideShipment(
  shipmentId: UUID,
  input: { outcome: "cleared" | "conditionally_cleared" | "declined"; rationale: string; conditions?: string | undefined },
): Promise<ExportShipment> {
  return apiFetch<ExportShipment>(`${BASE}/shipments/${shipmentId}/decide/`, { method: "POST", body: input });
}

// --- access grants -------------------------------------------------------------

export function listExportAccessGrants(
  query: ExportListQuery = FULL_PAGE,
): Promise<Paginated<ExportAccessGrant>> {
  return apiFetch<Paginated<ExportAccessGrant>>(`${BASE}/access-grants/`, { query });
}

export function createExportAccessGrant(
  input: Pick<ExportAccessGrant, "exporter" | "user" | "role">,
): Promise<ExportAccessGrant> {
  return apiFetch<ExportAccessGrant>(`${BASE}/access-grants/`, { method: "POST", body: input });
}

export function updateExportAccessGrant(
  id: UUID,
  patch: Partial<Pick<ExportAccessGrant, "is_active" | "role">>,
): Promise<ExportAccessGrant> {
  return apiFetch<ExportAccessGrant>(`${BASE}/access-grants/${id}/`, { method: "PATCH", body: patch });
}

// --- applications --------------------------------------------------------------

export function listExportApplications(
  query: ExportListQuery = FULL_PAGE,
): Promise<Paginated<ExportApplication>> {
  return apiFetch<Paginated<ExportApplication>>(`${BASE}/applications/`, { query });
}

export function getExportApplication(id: UUID): Promise<ExportApplication> {
  return apiFetch<ExportApplication>(`${BASE}/applications/${id}/`);
}

export function createExportApplication(exporter: UUID): Promise<ExportApplication> {
  return apiFetch<ExportApplication>(`${BASE}/applications/`, { method: "POST", body: { exporter } });
}

/** Applicant-side save of one domain's answers. Returns it to `pending` review. */
export function saveExportSection(
  id: UUID,
  key: ExportDomainKey,
  data: Record<string, unknown>,
): Promise<ExportDomainReview> {
  return apiFetch<ExportDomainReview>(`${BASE}/applications/${id}/sections/${key}/`, {
    method: "PATCH",
    body: { data },
  });
}

/** Desk-side verdict on one domain. */
export function reviewExportSection(
  id: UUID,
  key: ExportDomainKey,
  input: { status: ExportDomainStatus; score: number; notes: string; applicable?: boolean | undefined },
): Promise<ExportDomainReview> {
  return apiFetch<ExportDomainReview>(`${BASE}/applications/${id}/sections/${key}/review/`, {
    method: "POST",
    body: input,
  });
}

export function assignExportReviewer(id: UUID, reviewer: UUID): Promise<ExportApplication> {
  return apiFetch<ExportApplication>(`${BASE}/applications/${id}/assign-reviewer/`, {
    method: "POST",
    body: { reviewer },
  });
}

export function startExportReview(id: UUID): Promise<ExportApplication> {
  return apiFetch<ExportApplication>(`${BASE}/applications/${id}/start-review/`, { method: "POST" });
}

/** Submit for review. Rejected while any domain is incomplete. */
export function submitExportApplication(id: UUID): Promise<ExportApplication> {
  return apiFetch<ExportApplication>(`${BASE}/applications/${id}/submit/`, { method: "POST" });
}

export function decideExportApplication(
  id: UUID,
  input: {
    status: "approved" | "conditionally_approved" | "rejected";
    rationale: string;
    conditions?:
      | { title: string; description: string; due_date: string; domain?: ExportDomainKey | "" | undefined }[]
      | undefined;
  },
): Promise<ExportApplication> {
  return apiFetch<ExportApplication>(`${BASE}/applications/${id}/decide/`, { method: "POST", body: input });
}

export function listExportApplicationDocuments(id: UUID): Promise<ExportDocument[]> {
  return apiFetch<ExportDocument[]>(`${BASE}/applications/${id}/documents/`);
}

export function uploadExportDocument(
  id: UUID,
  input: {
    domain: ExportDomainKey;
    document_type: string;
    title: string;
    issuer?: string | undefined;
    reference?: string | undefined;
    issued_on?: string | null | undefined;
    expires_on?: string | null | undefined;
    shipment?: UUID | null | undefined;
    condition?: UUID | null | undefined;
    file: File;
  },
): Promise<ExportDocument> {
  const form = new FormData();
  for (const [key, value] of Object.entries(input)) {
    if (value === undefined || value === null || value === "") continue;
    form.append(key, value as string | Blob);
  }
  return apiFetch<ExportDocument>(`${BASE}/applications/${id}/documents/`, { method: "POST", body: form });
}

export function listExportApplicationRequests(id: UUID): Promise<ExportInformationRequest[]> {
  return apiFetch<ExportInformationRequest[]>(`${BASE}/applications/${id}/requests/`);
}

export function createExportRequest(
  id: UUID,
  input: { reason: string; message: string; items: string[]; due_date: string },
): Promise<ExportInformationRequest> {
  return apiFetch<ExportInformationRequest>(`${BASE}/applications/${id}/requests/`, {
    method: "POST",
    body: input,
  });
}

export function respondToExportRequest(
  requestId: UUID,
  input: { message: string; documents: UUID[] },
): Promise<ExportRequestResponse> {
  return apiFetch<ExportRequestResponse>(`${BASE}/requests/${requestId}/responses/`, {
    method: "POST",
    body: input,
  });
}

export function reviewExportRequestResponse(
  requestId: UUID,
  input: { accepted: boolean; notes: string },
): Promise<ExportInformationRequest> {
  return apiFetch<ExportInformationRequest>(`${BASE}/requests/${requestId}/review-response/`, {
    method: "POST",
    body: input,
  });
}

export function listExportApplicationConditions(id: UUID): Promise<ExportCondition[]> {
  return apiFetch<ExportCondition[]>(`${BASE}/applications/${id}/conditions/`);
}

export function createExportCondition(
  id: UUID,
  input: { title: string; description: string; due_date: string; domain?: ExportDomainKey | "" | undefined },
): Promise<ExportCondition> {
  return apiFetch<ExportCondition>(`${BASE}/applications/${id}/conditions/`, {
    method: "POST",
    body: input,
  });
}

export function reviewExportCondition(conditionId: UUID, notes: string): Promise<ExportCondition> {
  return apiFetch<ExportCondition>(`${BASE}/conditions/${conditionId}/review/`, {
    method: "POST",
    body: { notes },
  });
}

export function listExportApplicationActivity(id: UUID): Promise<{ events: ExportAuditEvent[] }> {
  return apiFetch<{ events: ExportAuditEvent[] }>(`${BASE}/applications/${id}/activity/`);
}

// --- documents (top-level) ----------------------------------------------------

export function listExportDocuments(query: ExportListQuery = FULL_PAGE): Promise<Paginated<ExportDocument>> {
  return apiFetch<Paginated<ExportDocument>>(`${BASE}/documents/`, { query });
}

export function listExpiringExportDocuments(): Promise<ExportDocument[]> {
  return apiFetch<ExportDocument[]>(`${BASE}/documents/expiring/`);
}

export function reviewExportDocument(
  id: UUID,
  input: { status: "verified" | "rejected"; notes: string },
): Promise<ExportDocument> {
  return apiFetch<ExportDocument>(`${BASE}/documents/${id}/review/`, { method: "POST", body: input });
}

export function exportDocumentDownloadUrl(id: UUID): string {
  return `${BASE}/documents/${id}/download/`;
}

// --- requests / conditions (top-level, filterable) ----------------------------

export function listExportRequests(
  query: ExportListQuery = FULL_PAGE,
): Promise<Paginated<ExportInformationRequest>> {
  return apiFetch<Paginated<ExportInformationRequest>>(`${BASE}/requests/`, { query });
}

export function listExportConditions(
  query: ExportListQuery = FULL_PAGE,
): Promise<Paginated<ExportCondition>> {
  return apiFetch<Paginated<ExportCondition>>(`${BASE}/conditions/`, { query });
}

// --- notifications ---------------------------------------------------------------

export function listExportNotifications(
  query: ExportListQuery = FULL_PAGE,
): Promise<Paginated<ExportNotification>> {
  return apiFetch<Paginated<ExportNotification>>(`${BASE}/notifications/`, { query });
}

export function markExportNotificationRead(id: UUID): Promise<ExportNotification> {
  return apiFetch<ExportNotification>(`${BASE}/notifications/${id}/mark-read/`, { method: "POST" });
}

// --- reports ---------------------------------------------------------------------

export function listExportReports(query: ExportListQuery = FULL_PAGE): Promise<Paginated<ExportReport>> {
  return apiFetch<Paginated<ExportReport>>(`${BASE}/reports/`, { query });
}

/** Compile a CSV register export across every exporter the caller can see. */
export function generateExportReport(): Promise<ExportReport> {
  return apiFetch<ExportReport>(`${BASE}/reports/`, { method: "POST" });
}

export function exportReportDownloadUrl(id: UUID): string {
  return `${BASE}/reports/${id}/download/`;
}
