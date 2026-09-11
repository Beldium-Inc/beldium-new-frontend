import { apiFetch } from "./client";
import type { Paginated, UUID } from "./types";

// The Export Compliance register: exporters, the consignments they submit,
// and the evidence and findings that accumulate against them. Mirrors
// `beldium-backend/export/serializers.py` field-for-field, so the shapes
// below are the backend's, not a re-spelling.

const BASE = "/export";

export type ExportAudience = "operator" | "exporter" | "regulator";

export const EXPORT_SECTION_KEYS = [
  "overview",
  "exporter",
  "product",
  "source",
  "quality",
  "quantity",
  "documents",
  "financial",
  "customs",
  "inspection",
  "logistics",
  "regulatory",
  "audit",
] as const;

export type ExportSectionKey = (typeof EXPORT_SECTION_KEYS)[number];

export const EXPORT_SECTION_LABELS: Record<ExportSectionKey, string> = {
  overview: "Overview",
  exporter: "Exporter",
  product: "Product",
  source: "Source",
  quality: "Quality",
  quantity: "Quantity",
  documents: "Documents",
  financial: "Financial",
  customs: "Customs",
  inspection: "Inspection",
  logistics: "Logistics",
  regulatory: "Regulatory",
  audit: "Audit Trail",
};

export type ExportDocStatus =
  "pending" | "verified" | "rejected" | "replacement_requested" | "clarification_requested";

export type ShipmentStatus =
  | "draft"
  | "submitted"
  | "in_review"
  | "info_requested"
  | "cleared"
  | "conditionally_cleared"
  | "declined";

export interface ExportCapabilities {
  audience: ExportAudience | null;
  can_review: boolean;
  can_decide: boolean;
  can_read_register: boolean;
  is_staff: boolean;
  /** Set only for an `exporter` audience: which exporter record they act as. */
  exporter: UUID | null;
}

export interface ExportField {
  label: string;
  value?: string;
  flag?: "warn" | "fail";
}

export interface ExportDocNote {
  at: string;
  by: string;
  action: string;
  comment: string;
}

export interface ExportDocument {
  id: UUID;
  shipment: UUID;
  name: string;
  category: string;
  issuer: string;
  reference: string;
  issued_on: string;
  expires_on: string | null;
  status: ExportDocStatus;
  mandatory: boolean;
  notes: ExportDocNote[];
  created_at: string;
  updated_at: string;
}

export interface ExporterLicence {
  name: string;
  ref: string;
  expires_on: string | null;
  status: ExportDocStatus;
}

export interface ExporterKycItem {
  label: string;
  value: string;
  ok: boolean;
}

export interface Exporter {
  id: UUID;
  reference: string;
  name: string;
  rc_number: string;
  state: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  minerals: string[];
  verification: "verified" | "in_review" | "action_required";
  compliance_score: number;
  onboarded_on: string;
  licences: ExporterLicence[];
  kyc: ExporterKycItem[];
  created_at: string;
  updated_at: string;
}

export interface ExportChecklistItem {
  id: UUID;
  shipment: UUID;
  label: string;
  section: ExportSectionKey;
  state: "pass" | "open" | "fail";
  detail: string;
}

export interface ExportNonConformity {
  id: UUID;
  shipment: UUID;
  title: string;
  severity: "minor" | "major" | "critical";
  section: ExportSectionKey;
  raised_by: string;
  raised_at: string;
  status: "open" | "responded" | "closed";
  detail: string;
  response: string;
  created_at: string;
  updated_at: string;
}

/** One line of a consignment's trail. `system` covers Beldium's own scoring engine. */
export interface ExportAuditEntry {
  id: UUID;
  shipment: UUID;
  at: string;
  actor: string;
  role: ExportAudience | "system";
  action: string;
  detail: string;
}

export interface RiskFactor {
  label: string;
  weight: number;
  note: string;
}

export interface ExportDecision {
  outcome: "cleared" | "conditionally_cleared" | "declined";
  by: string;
  at: string;
  rationale: string;
  conditions: string;
}

export interface Shipment {
  id: UUID;
  /** Human reference, `BEL/<mineral code>/<seq>`. What people quote to each other. */
  reference: string;
  exporter: UUID;
  exporter_name: string;
  mineral: string;
  hs_code: string;
  grade: string;
  quantity: string;
  destination: string;
  buyer: string;
  port: string;
  incoterm: string;
  value_usd: number;
  etd: string;
  submitted_on: string;
  status: ShipmentStatus;
  risk_score: number;
  risk_band: "low" | "medium" | "high";
  risk_factors: RiskFactor[];
  /** Only the sections with captured evidence are present. */
  sections: Partial<Record<ExportSectionKey, ExportField[]>>;
  documents: ExportDocument[];
  checklist: ExportChecklistItem[];
  non_conformities: ExportNonConformity[];
  audit: ExportAuditEntry[];
  decision: ExportDecision | null;
  created_at: string;
  updated_at: string;
}

export interface ExportMonitoringEvent {
  id: UUID;
  at: string;
  severity: "info" | "warning" | "critical";
  title: string;
  detail: string;
  shipment: UUID | null;
  exporter: UUID | null;
}

export interface ExportDashboard {
  audience: ExportAudience | null;
  capabilities: ExportCapabilities;
  totals: {
    shipments: number;
    shipments_in_review: number;
    shipments_info_requested: number;
    exporters: number;
    verified_exporters: number;
    action_required_exporters: number;
    open_non_conformities: number;
    documents_pending: number;
    high_risk_shipments: number;
    average_compliance_score: number;
  };
  recent_shipments: Shipment[];
  events: ExportMonitoringEvent[];
}

// --- capabilities and dashboard ---------------------------------------------

/**
 * What this caller may actually do, and which exporter record they act as.
 * The browser stores a chosen dashboard role in localStorage; this is the
 * authoritative answer, derived server-side from organisation membership.
 */
export function fetchExportCapabilities(signal?: AbortSignal): Promise<ExportCapabilities> {
  return apiFetch<ExportCapabilities>(`${BASE}/me/`, { signal });
}

export function fetchExportDashboard(signal?: AbortSignal): Promise<ExportDashboard> {
  return apiFetch<ExportDashboard>(`${BASE}/dashboard/`, { signal });
}

// --- register ----------------------------------------------------------------

export interface ExportListQuery {
  page?: number;
  page_size?: number;
  search?: string;
  ordering?: string;
  [key: string]: string | number | boolean | null | undefined;
}

export function listExporters(query: ExportListQuery = {}): Promise<Paginated<Exporter>> {
  return apiFetch<Paginated<Exporter>>(`${BASE}/exporters/`, { query });
}

export function getExporter(id: UUID): Promise<Exporter> {
  return apiFetch<Exporter>(`${BASE}/exporters/${id}/`);
}

// --- shipments -----------------------------------------------------------------

export interface NewShipmentInput {
  mineral: string;
  hs_code?: string | undefined;
  grade?: string | undefined;
  quantity?: string | undefined;
  buyer?: string | undefined;
  destination?: string | undefined;
  port?: string | undefined;
  incoterm?: string | undefined;
  value_usd?: number | undefined;
  etd?: string | undefined;
}

export function listShipments(query: ExportListQuery = {}): Promise<Paginated<Shipment>> {
  return apiFetch<Paginated<Shipment>>(`${BASE}/shipments/`, { query });
}

export function getShipment(id: UUID): Promise<Shipment> {
  return apiFetch<Shipment>(`${BASE}/shipments/${id}/`);
}

/**
 * Exporter-side submission. The engine scores it provisionally on creation, so
 * the response already carries `risk_score` and the mandatory document set.
 */
export function createShipment(input: NewShipmentInput): Promise<Shipment> {
  return apiFetch<Shipment>(`${BASE}/shipments/`, { method: "POST", body: input });
}

/** Operator picks up an unassigned, `submitted` consignment. */
export function claimShipment(id: UUID): Promise<Shipment> {
  return apiFetch<Shipment>(`${BASE}/shipments/${id}/claim/`, { method: "POST" });
}

/**
 * Record the desk's decision. `cleared` is refused with 409 while any
 * checklist item is `fail` or any finding is open (`non_conformities_open`).
 */
export function decideExportShipment(
  id: UUID,
  input: { outcome: ExportDecision["outcome"]; rationale: string; conditions?: string | undefined },
): Promise<Shipment> {
  return apiFetch<Shipment>(`${BASE}/shipments/${id}/decide/`, { method: "POST", body: input });
}

/** Verify, reject, or ask the exporter to replace or clarify one document. */
export function reviewExportDocument(
  id: UUID,
  input: { status: ExportDocStatus; action: string; comment?: string | undefined },
): Promise<ExportDocument> {
  return apiFetch<ExportDocument>(`${BASE}/documents/${id}/review/`, {
    method: "POST",
    body: input,
  });
}

export function setChecklistItemState(
  shipmentId: UUID,
  itemId: UUID,
  state: ExportChecklistItem["state"],
): Promise<ExportChecklistItem> {
  return apiFetch<ExportChecklistItem>(`${BASE}/shipments/${shipmentId}/checklist/${itemId}/`, {
    method: "PATCH",
    body: { state },
  });
}

export function raiseExportNonConformity(input: {
  shipment: UUID;
  title: string;
  severity: ExportNonConformity["severity"];
  section: ExportSectionKey;
  detail?: string | undefined;
}): Promise<ExportNonConformity> {
  return apiFetch<ExportNonConformity>(`${BASE}/non-conformities/`, {
    method: "POST",
    body: input,
  });
}

export function updateExportNonConformity(
  id: UUID,
  patch: { status?: ExportNonConformity["status"] | undefined; response?: string | undefined },
): Promise<ExportNonConformity> {
  return apiFetch<ExportNonConformity>(`${BASE}/non-conformities/${id}/`, {
    method: "PATCH",
    body: patch,
  });
}

/**
 * Free-text trail entry: covers both an operator's own note and a regulator's
 * read-only actions (request info, reminder, flag, acknowledge), which are
 * indistinguishable in shape — one endpoint, the actor's role tells them apart.
 */
export function addShipmentAuditNote(
  shipmentId: UUID,
  input: { action: string; detail: string },
): Promise<ExportAuditEntry> {
  return apiFetch<ExportAuditEntry>(`${BASE}/shipments/${shipmentId}/audit/`, {
    method: "POST",
    body: input,
  });
}

// --- monitoring ----------------------------------------------------------------

export function listMonitoringEvents(
  query: ExportListQuery = {},
): Promise<Paginated<ExportMonitoringEvent>> {
  return apiFetch<Paginated<ExportMonitoringEvent>>(`${BASE}/monitoring-events/`, { query });
}
