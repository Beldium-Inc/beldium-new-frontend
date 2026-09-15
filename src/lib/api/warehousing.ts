import { apiFetch } from "./client";
import type { Paginated, UUID } from "./types";

// The Warehousing Compliance register: warehouse operators, their admission
// applications (reviewed domain-by-domain), the facilities/zones/lots/
// inspections they operate, and the evidence and findings raised against
// them. Mirrors `beldium-backend/warehousing/serializers.py` field-for-field,
// structurally identical to export.ts. Names that would otherwise collide
// with another vertical's module (or with export.ts itself) carry a
// `Warehousing` prefix.

const BASE = "/warehousing";

export interface WarehousingListQuery {
  page?: number;
  page_size?: number;
  search?: string;
  ordering?: string;
  [key: string]: string | number | boolean | null | undefined;
}

const FULL_PAGE: WarehousingListQuery = { page_size: 100 };

export type WarehousingDomainKey =
  | "operator"
  | "facility"
  | "storage"
  | "inventory"
  | "safety"
  | "quality"
  | "equipment"
  | "logistics";

export const WAREHOUSING_DOMAIN_KEYS: WarehousingDomainKey[] = [
  "operator",
  "facility",
  "storage",
  "inventory",
  "safety",
  "quality",
  "equipment",
  "logistics",
];

export const WAREHOUSING_DOMAIN_LABELS: Record<WarehousingDomainKey, string> = {
  operator: "Warehouse operator",
  facility: "Facility and location",
  storage: "Storage controls",
  inventory: "Inventory traceability",
  safety: "Fire, HSE and security",
  quality: "Quality assurance",
  equipment: "Equipment calibration",
  logistics: "Inbound and outbound logistics",
};

export type WarehousingApplicationStatus =
  | "draft"
  | "submitted"
  | "under_review"
  | "awaiting_information"
  | "conditionally_approved"
  | "approved"
  | "rejected";

export type WarehousingDomainStatus = "pending" | "passed" | "attention" | "failed";

export type WarehousingEvidenceStatus = "pending" | "verified" | "rejected";

export type WarehousingDocumentValidity = "current" | "expiring" | "expired";

export interface WarehouseOperator {
  id: UUID;
  organisation: UUID;
  name: string;
  registration_number: string;
  reference: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  warehouse_license_number: string;
  license_expires_on: string | null;
  services: string[];
  storage_categories: string[];
  trading_name: string;
  company_type: string;
  incorporated_on: string | null;
  mineral_title: string;
  head_office_address: string;
  bankers: string;
  annual_turnover: string;
  staff_count: number | null;
  directors: { name: string; role: string; bvn_verified: boolean }[];
  shareholding: { holder: string; percent: number }[];
  created_at: string;
  updated_at: string;
}

export type WarehousingFacilityType = "ambient" | "cold_chain" | "bonded" | "hazmat" | "yard";

export interface WarehousingFacility {
  id: UUID;
  warehouse: UUID;
  name: string;
  facility_type: WarehousingFacilityType;
  address: string;
  state: string;
  country: string;
  capacity: string;
  capacity_unit: "tonnes" | "sqm" | "pallets";
  fire_certificate_expires_on: string | null;
  insurance_expires_on: string | null;
  is_active: boolean;
  coordinates: string;
  land_title: string;
  built_area: string;
  bay_count: number | null;
  loading_dock_count: number | null;
  weighbridge_details: string;
  laboratory_details: string;
  security_details: string;
  fire_system_details: string;
  facility_contact: string;
  created_at: string;
  updated_at: string;
}

export interface StorageZone {
  id: UUID;
  warehouse: UUID;
  facility: UUID;
  name: string;
  storage_type: string;
  temperature_min: string | null;
  temperature_max: string | null;
  capacity: string;
  capacity_unit: string;
  restricted: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type InventoryLotStatus = "received" | "stored" | "quarantined" | "released" | "dispatched";

export interface InventoryLot {
  id: UUID;
  warehouse: UUID;
  reference: string;
  facility: UUID;
  zone: UUID;
  product_name: string;
  batch_number: string;
  owner_name: string;
  quantity: string;
  actual_weighbridge_quantity: string | null;
  unit: string;
  received_on: string;
  expires_on: string | null;
  status: InventoryLotStatus;
  variance_percent: number | null;
  created_at: string;
  updated_at: string;
}

export interface WarehousingInspection {
  id: UUID;
  warehouse: UUID;
  facility: UUID;
  inspection_type: string;
  inspected_on: string;
  inspector_name: string;
  outcome: "passed" | "attention" | "failed";
  findings: string;
  next_due_on: string | null;
  created_at: string;
  updated_at: string;
}

export interface WarehousingAccessGrant {
  id: UUID;
  warehouse: UUID;
  user: UUID;
  role: "reviewer" | "regulator";
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WarehousingDomainReview {
  key: WarehousingDomainKey;
  data: Record<string, unknown>;
  applicable: boolean;
  status: WarehousingDomainStatus;
  score: number;
  review_notes: string;
  reviewed_at: string | null;
}

export interface WarehousingCondition {
  id: UUID;
  title: string;
  description: string;
  due_date: string;
  domain: WarehousingDomainKey | "";
  cleared_at: string | null;
  is_overdue: boolean;
}

export interface WarehousingDocument {
  id: UUID;
  application: UUID;
  domain: WarehousingDomainKey;
  document_type: string;
  title: string;
  issuer: string;
  reference: string;
  issued_on: string | null;
  expires_on: string | null;
  lot: UUID | null;
  condition: UUID | null;
  original_name: string;
  version: number;
  is_current: boolean;
  status: WarehousingEvidenceStatus;
  uploaded_by: UUID;
  reviewed_by: UUID | null;
  reviewed_at: string | null;
  review_notes: string;
  download_url: string;
  validity: WarehousingDocumentValidity;
  created_at: string;
  updated_at: string;
}

export interface WarehousingRequestResponse {
  id: UUID;
  message: string;
  documents: UUID[];
  author: UUID;
  created_at: string;
}

export interface WarehousingInformationRequest {
  id: UUID;
  application: UUID;
  reason: string;
  message: string;
  items: string[];
  due_date: string;
  status: "open" | "responded" | "accepted";
  raised_by: UUID;
  review_notes: string;
  responses: WarehousingRequestResponse[];
  is_overdue: boolean;
  created_at: string;
}

export interface WarehousingApplication {
  id: UUID;
  warehouse: UUID;
  created_by: UUID;
  reviewer: UUID | null;
  status: WarehousingApplicationStatus;
  submitted_at: string | null;
  reviewed_at: string | null;
  rationale: string;
  policy_version: string;
  domain_weights: Record<string, number>;
  sections: WarehousingDomainReview[];
  conditions: WarehousingCondition[];
  progress: { total: number; complete: number; percent: number };
  risk: { compliance_score: number; risk_band: "low" | "medium" | "high" };
  created_at: string;
  updated_at: string;
}

export interface WarehousingNotification {
  id: UUID;
  warehouse: UUID;
  title: string;
  body: string;
  read_at: string | null;
  created_at: string;
}

export interface WarehousingReport {
  id: UUID;
  report_type: string;
  warehouse_ids: UUID[];
  facility_count: number;
  created_at: string;
}

// --- incidents / releases / monitoring / inspectors / certificates -----------

export type WarehousingIncidentCategory = "safety" | "environmental" | "security" | "stock_integrity";
export type WarehousingIncidentSeverity = "low" | "medium" | "high";
export type WarehousingIncidentStatus = "open" | "under_investigation" | "closed";

export interface WarehousingIncident {
  id: UUID;
  warehouse: UUID;
  facility: UUID;
  lot: UUID | null;
  title: string;
  category: WarehousingIncidentCategory;
  severity: WarehousingIncidentSeverity;
  occurred_on: string;
  location: string;
  description: string;
  status: WarehousingIncidentStatus;
  reported_by: UUID | null;
  created_at: string;
  updated_at: string;
}

export type ReleaseRequestStatus = "pending" | "authorised" | "declined";

export interface WarehousingReleaseRequest {
  id: UUID;
  warehouse: UUID;
  lot: UUID;
  requested_by_name: string;
  destination: string;
  declared_quantity: string;
  actual_weighbridge_quantity: string | null;
  unit: string;
  status: ReleaseRequestStatus;
  decision_reason: string;
  authorised_by: UUID | null;
  authorised_at: string | null;
  variance_percent: number | null;
  created_at: string;
  updated_at: string;
}

export type MonitoringAlertSeverity = "info" | "warning" | "critical";

export interface WarehousingMonitoringAlert {
  id: UUID;
  warehouse: UUID;
  facility: UUID | null;
  message: string;
  severity: MonitoringAlertSeverity;
  source: string;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface WarehousingInspector {
  id: UUID;
  name: string;
  region: string;
  title: string;
  email: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type CertificateStatus = "active" | "conditional" | "suspended" | "expired";

export interface WarehousingCertificate {
  id: UUID;
  warehouse: UUID;
  facility: UUID;
  application: UUID | null;
  scope: string;
  issued_on: string;
  expires_on: string;
  status: CertificateStatus;
  is_expiring: boolean;
  issued_by: UUID | null;
  created_at: string;
  updated_at: string;
}

export function listWarehousingIncidents(
  query: WarehousingListQuery = FULL_PAGE,
): Promise<Paginated<WarehousingIncident>> {
  return apiFetch<Paginated<WarehousingIncident>>(`${BASE}/incidents/`, { query });
}

export function createWarehousingIncident(
  input: Omit<WarehousingIncident, "id" | "status" | "reported_by" | "created_at" | "updated_at">,
): Promise<WarehousingIncident> {
  return apiFetch<WarehousingIncident>(`${BASE}/incidents/`, { method: "POST", body: input });
}

export function closeWarehousingIncident(id: UUID, notes: string): Promise<WarehousingIncident> {
  return apiFetch<WarehousingIncident>(`${BASE}/incidents/${id}/close/`, {
    method: "POST",
    body: { notes },
  });
}

export function listWarehousingReleaseRequests(
  query: WarehousingListQuery = FULL_PAGE,
): Promise<Paginated<WarehousingReleaseRequest>> {
  return apiFetch<Paginated<WarehousingReleaseRequest>>(`${BASE}/release-requests/`, { query });
}

export function createWarehousingReleaseRequest(
  input: Pick<
    WarehousingReleaseRequest,
    "warehouse" | "lot" | "requested_by_name" | "destination" | "declared_quantity" | "unit"
  >,
): Promise<WarehousingReleaseRequest> {
  return apiFetch<WarehousingReleaseRequest>(`${BASE}/release-requests/`, { method: "POST", body: input });
}

export function decideWarehousingRelease(
  id: UUID,
  input: { status: "authorised" | "declined"; actual_weighbridge_quantity?: number | undefined; reason?: string | undefined },
): Promise<WarehousingReleaseRequest> {
  return apiFetch<WarehousingReleaseRequest>(`${BASE}/release-requests/${id}/decide/`, {
    method: "POST",
    body: input,
  });
}

export function listWarehousingMonitoringAlerts(
  query: WarehousingListQuery = FULL_PAGE,
): Promise<Paginated<WarehousingMonitoringAlert>> {
  return apiFetch<Paginated<WarehousingMonitoringAlert>>(`${BASE}/monitoring-alerts/`, { query });
}

export function createWarehousingMonitoringAlert(
  input: Pick<WarehousingMonitoringAlert, "warehouse" | "facility" | "message" | "severity" | "source">,
): Promise<WarehousingMonitoringAlert> {
  return apiFetch<WarehousingMonitoringAlert>(`${BASE}/monitoring-alerts/`, { method: "POST", body: input });
}

export function resolveWarehousingMonitoringAlert(id: UUID): Promise<WarehousingMonitoringAlert> {
  return apiFetch<WarehousingMonitoringAlert>(`${BASE}/monitoring-alerts/${id}/resolve/`, { method: "POST" });
}

export function listWarehousingInspectors(
  query: WarehousingListQuery = FULL_PAGE,
): Promise<Paginated<WarehousingInspector>> {
  return apiFetch<Paginated<WarehousingInspector>>(`${BASE}/inspectors/`, { query });
}

export function createWarehousingInspector(
  input: Pick<WarehousingInspector, "name" | "region" | "title" | "email">,
): Promise<WarehousingInspector> {
  return apiFetch<WarehousingInspector>(`${BASE}/inspectors/`, { method: "POST", body: input });
}

export function listWarehousingCertificates(
  query: WarehousingListQuery = FULL_PAGE,
): Promise<Paginated<WarehousingCertificate>> {
  return apiFetch<Paginated<WarehousingCertificate>>(`${BASE}/certificates/`, { query });
}

export function issueWarehousingCertificate(
  input: Pick<WarehousingCertificate, "warehouse" | "facility" | "application" | "scope" | "issued_on" | "expires_on">,
): Promise<WarehousingCertificate> {
  return apiFetch<WarehousingCertificate>(`${BASE}/certificates/`, { method: "POST", body: input });
}

export function updateWarehousingCertificate(
  id: UUID,
  patch: Partial<Pick<WarehousingCertificate, "status" | "expires_on" | "scope">>,
): Promise<WarehousingCertificate> {
  return apiFetch<WarehousingCertificate>(`${BASE}/certificates/${id}/`, { method: "PATCH", body: patch });
}

export interface WarehousingCapabilities {
  is_staff: boolean;
  warehouses: { id: UUID; name: string; can_edit: boolean; can_review: boolean; can_read: boolean }[];
}

export interface WarehousingDashboardRow {
  warehouse_id: UUID;
  reference: string;
  name: string;
  application_id: UUID | null;
  status: WarehousingApplicationStatus | "not_started";
  progress: { total: number; complete: number; percent: number } | null;
  risk: { compliance_score: number; risk_band: "low" | "medium" | "high" } | null;
  facilities: number;
  zones: number;
  lots: number;
  open_requests: number;
  expiring_documents: number;
}

export interface WarehousingDashboard {
  warehouses: WarehousingDashboardRow[];
  warehouse_count: number;
  totals: {
    facilities: number;
    zones: number;
    lots: number;
    open_requests: number;
    expiring_documents: number;
  };
  unread_notifications: number;
}

export interface WarehousingRiskRow {
  warehouse_id: UUID;
  application_id: UUID;
  compliance_score: number;
  risk_band: "low" | "medium" | "high";
}

export interface WarehousingAuditEvent {
  id: UUID;
  event_type: string;
  created_at: string;
  actor_id: UUID | null;
}

// --- capabilities / dashboard / risk / audit --------------------------------

export function fetchWarehousingCapabilities(signal?: AbortSignal): Promise<WarehousingCapabilities> {
  return apiFetch<WarehousingCapabilities>(`${BASE}/me/`, { signal });
}

export function fetchWarehousingDashboard(signal?: AbortSignal): Promise<WarehousingDashboard> {
  return apiFetch<WarehousingDashboard>(`${BASE}/dashboard/`, { signal });
}

export function fetchWarehousingRisk(
  signal?: AbortSignal,
): Promise<{ applications: WarehousingRiskRow[] }> {
  return apiFetch<{ applications: WarehousingRiskRow[] }>(`${BASE}/risk/`, { signal });
}

export function fetchWarehousingAudit(
  signal?: AbortSignal,
): Promise<{ events: WarehousingAuditEvent[] }> {
  return apiFetch<{ events: WarehousingAuditEvent[] }>(`${BASE}/audit/`, { signal });
}

// --- warehouses ---------------------------------------------------------------

export function listWarehouses(
  query: WarehousingListQuery = FULL_PAGE,
): Promise<Paginated<WarehouseOperator>> {
  return apiFetch<Paginated<WarehouseOperator>>(`${BASE}/warehouses/`, { query });
}

export function getWarehouse(id: UUID): Promise<WarehouseOperator> {
  return apiFetch<WarehouseOperator>(`${BASE}/warehouses/${id}/`);
}

export interface NewWarehouseInput {
  organisation: UUID;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  warehouse_license_number?: string | undefined;
  license_expires_on?: string | null | undefined;
  services: string[];
  storage_categories: string[];
}

export function createWarehouse(input: NewWarehouseInput): Promise<WarehouseOperator> {
  return apiFetch<WarehouseOperator>(`${BASE}/warehouses/`, { method: "POST", body: input });
}

export function updateWarehouse(
  id: UUID,
  patch: Partial<NewWarehouseInput>,
): Promise<WarehouseOperator> {
  return apiFetch<WarehouseOperator>(`${BASE}/warehouses/${id}/`, { method: "PATCH", body: patch });
}

// --- facilities / zones / lots / inspections ----------------------------------

export function listWarehousingFacilities(
  query: WarehousingListQuery = FULL_PAGE,
): Promise<Paginated<WarehousingFacility>> {
  return apiFetch<Paginated<WarehousingFacility>>(`${BASE}/facilities/`, { query });
}

export function createWarehousingFacility(
  input: Omit<WarehousingFacility, "id" | "created_at" | "updated_at">,
): Promise<WarehousingFacility> {
  return apiFetch<WarehousingFacility>(`${BASE}/facilities/`, { method: "POST", body: input });
}

export function updateWarehousingFacility(
  id: UUID,
  patch: Partial<WarehousingFacility>,
): Promise<WarehousingFacility> {
  return apiFetch<WarehousingFacility>(`${BASE}/facilities/${id}/`, { method: "PATCH", body: patch });
}

export function listStorageZones(
  query: WarehousingListQuery = FULL_PAGE,
): Promise<Paginated<StorageZone>> {
  return apiFetch<Paginated<StorageZone>>(`${BASE}/zones/`, { query });
}

export function createStorageZone(
  input: Omit<StorageZone, "id" | "created_at" | "updated_at">,
): Promise<StorageZone> {
  return apiFetch<StorageZone>(`${BASE}/zones/`, { method: "POST", body: input });
}

export function updateStorageZone(id: UUID, patch: Partial<StorageZone>): Promise<StorageZone> {
  return apiFetch<StorageZone>(`${BASE}/zones/${id}/`, { method: "PATCH", body: patch });
}

export function listInventoryLots(
  query: WarehousingListQuery = FULL_PAGE,
): Promise<Paginated<InventoryLot>> {
  return apiFetch<Paginated<InventoryLot>>(`${BASE}/lots/`, { query });
}

export function createInventoryLot(
  input: Omit<InventoryLot, "id" | "reference" | "variance_percent" | "created_at" | "updated_at">,
): Promise<InventoryLot> {
  return apiFetch<InventoryLot>(`${BASE}/lots/`, { method: "POST", body: input });
}

export function updateInventoryLot(id: UUID, patch: Partial<InventoryLot>): Promise<InventoryLot> {
  return apiFetch<InventoryLot>(`${BASE}/lots/${id}/`, { method: "PATCH", body: patch });
}

export function listWarehousingInspections(
  query: WarehousingListQuery = FULL_PAGE,
): Promise<Paginated<WarehousingInspection>> {
  return apiFetch<Paginated<WarehousingInspection>>(`${BASE}/inspections/`, { query });
}

export function createWarehousingInspection(
  input: Omit<WarehousingInspection, "id" | "created_at" | "updated_at">,
): Promise<WarehousingInspection> {
  return apiFetch<WarehousingInspection>(`${BASE}/inspections/`, { method: "POST", body: input });
}

export function updateWarehousingInspection(
  id: UUID,
  patch: Partial<WarehousingInspection>,
): Promise<WarehousingInspection> {
  return apiFetch<WarehousingInspection>(`${BASE}/inspections/${id}/`, { method: "PATCH", body: patch });
}

// --- access grants -------------------------------------------------------------

export function listWarehousingAccessGrants(
  query: WarehousingListQuery = FULL_PAGE,
): Promise<Paginated<WarehousingAccessGrant>> {
  return apiFetch<Paginated<WarehousingAccessGrant>>(`${BASE}/access-grants/`, { query });
}

export function createWarehousingAccessGrant(
  input: Pick<WarehousingAccessGrant, "warehouse" | "user" | "role">,
): Promise<WarehousingAccessGrant> {
  return apiFetch<WarehousingAccessGrant>(`${BASE}/access-grants/`, { method: "POST", body: input });
}

export function updateWarehousingAccessGrant(
  id: UUID,
  patch: Partial<Pick<WarehousingAccessGrant, "is_active" | "role">>,
): Promise<WarehousingAccessGrant> {
  return apiFetch<WarehousingAccessGrant>(`${BASE}/access-grants/${id}/`, {
    method: "PATCH",
    body: patch,
  });
}

// --- applications --------------------------------------------------------------

export function listWarehousingApplications(
  query: WarehousingListQuery = FULL_PAGE,
): Promise<Paginated<WarehousingApplication>> {
  return apiFetch<Paginated<WarehousingApplication>>(`${BASE}/applications/`, { query });
}

export function getWarehousingApplication(id: UUID): Promise<WarehousingApplication> {
  return apiFetch<WarehousingApplication>(`${BASE}/applications/${id}/`);
}

export function createWarehousingApplication(warehouse: UUID): Promise<WarehousingApplication> {
  return apiFetch<WarehousingApplication>(`${BASE}/applications/`, {
    method: "POST",
    body: { warehouse },
  });
}

/** Applicant-side save of one domain's answers. Returns it to `pending` review. */
export function saveWarehousingSection(
  id: UUID,
  key: WarehousingDomainKey,
  data: Record<string, unknown>,
): Promise<WarehousingDomainReview> {
  return apiFetch<WarehousingDomainReview>(`${BASE}/applications/${id}/sections/${key}/`, {
    method: "PATCH",
    body: { data },
  });
}

/** Desk-side verdict on one domain. */
export function reviewWarehousingSection(
  id: UUID,
  key: WarehousingDomainKey,
  input: {
    status: WarehousingDomainStatus;
    score: number;
    notes: string;
    applicable?: boolean | undefined;
  },
): Promise<WarehousingDomainReview> {
  return apiFetch<WarehousingDomainReview>(`${BASE}/applications/${id}/sections/${key}/review/`, {
    method: "POST",
    body: input,
  });
}

export function assignWarehousingReviewer(
  id: UUID,
  reviewer: UUID,
): Promise<WarehousingApplication> {
  return apiFetch<WarehousingApplication>(`${BASE}/applications/${id}/assign-reviewer/`, {
    method: "POST",
    body: { reviewer },
  });
}

export function startWarehousingReview(id: UUID): Promise<WarehousingApplication> {
  return apiFetch<WarehousingApplication>(`${BASE}/applications/${id}/start-review/`, {
    method: "POST",
  });
}

/** Submit for review. Rejected while any domain is incomplete. */
export function submitWarehousingApplication(id: UUID): Promise<WarehousingApplication> {
  return apiFetch<WarehousingApplication>(`${BASE}/applications/${id}/submit/`, { method: "POST" });
}

export function decideWarehousingApplication(
  id: UUID,
  input: {
    status: "approved" | "conditionally_approved" | "rejected";
    rationale: string;
    conditions?:
      | {
          title: string;
          description: string;
          due_date: string;
          domain?: WarehousingDomainKey | "" | undefined;
        }[]
      | undefined;
  },
): Promise<WarehousingApplication> {
  return apiFetch<WarehousingApplication>(`${BASE}/applications/${id}/decide/`, {
    method: "POST",
    body: input,
  });
}

export function listWarehousingApplicationDocuments(id: UUID): Promise<WarehousingDocument[]> {
  return apiFetch<WarehousingDocument[]>(`${BASE}/applications/${id}/documents/`);
}

export function uploadWarehousingDocument(
  id: UUID,
  input: {
    domain: WarehousingDomainKey;
    document_type: string;
    title: string;
    issuer?: string | undefined;
    reference?: string | undefined;
    issued_on?: string | null | undefined;
    expires_on?: string | null | undefined;
    lot?: UUID | null | undefined;
    condition?: UUID | null | undefined;
    file: File;
  },
): Promise<WarehousingDocument> {
  const form = new FormData();
  for (const [key, value] of Object.entries(input)) {
    if (value === undefined || value === null || value === "") continue;
    form.append(key, value as string | Blob);
  }
  return apiFetch<WarehousingDocument>(`${BASE}/applications/${id}/documents/`, {
    method: "POST",
    body: form,
  });
}

export function listWarehousingApplicationRequests(id: UUID): Promise<WarehousingInformationRequest[]> {
  return apiFetch<WarehousingInformationRequest[]>(`${BASE}/applications/${id}/requests/`);
}

export function createWarehousingRequest(
  id: UUID,
  input: { reason: string; message: string; items: string[]; due_date: string },
): Promise<WarehousingInformationRequest> {
  return apiFetch<WarehousingInformationRequest>(`${BASE}/applications/${id}/requests/`, {
    method: "POST",
    body: input,
  });
}

export function respondToWarehousingRequest(
  requestId: UUID,
  input: { message: string; documents: UUID[] },
): Promise<WarehousingRequestResponse> {
  return apiFetch<WarehousingRequestResponse>(`${BASE}/requests/${requestId}/responses/`, {
    method: "POST",
    body: input,
  });
}

export function reviewWarehousingRequestResponse(
  requestId: UUID,
  input: { accepted: boolean; notes: string },
): Promise<WarehousingInformationRequest> {
  return apiFetch<WarehousingInformationRequest>(`${BASE}/requests/${requestId}/review-response/`, {
    method: "POST",
    body: input,
  });
}

export function listWarehousingApplicationConditions(id: UUID): Promise<WarehousingCondition[]> {
  return apiFetch<WarehousingCondition[]>(`${BASE}/applications/${id}/conditions/`);
}

export function createWarehousingCondition(
  id: UUID,
  input: {
    title: string;
    description: string;
    due_date: string;
    domain?: WarehousingDomainKey | "" | undefined;
  },
): Promise<WarehousingCondition> {
  return apiFetch<WarehousingCondition>(`${BASE}/applications/${id}/conditions/`, {
    method: "POST",
    body: input,
  });
}

export function reviewWarehousingCondition(
  conditionId: UUID,
  notes: string,
): Promise<WarehousingCondition> {
  return apiFetch<WarehousingCondition>(`${BASE}/conditions/${conditionId}/review/`, {
    method: "POST",
    body: { notes },
  });
}

export function listWarehousingApplicationActivity(
  id: UUID,
): Promise<{ events: WarehousingAuditEvent[] }> {
  return apiFetch<{ events: WarehousingAuditEvent[] }>(`${BASE}/applications/${id}/activity/`);
}

// --- documents (top-level) ----------------------------------------------------

export function listWarehousingDocuments(
  query: WarehousingListQuery = FULL_PAGE,
): Promise<Paginated<WarehousingDocument>> {
  return apiFetch<Paginated<WarehousingDocument>>(`${BASE}/documents/`, { query });
}

export function listExpiringWarehousingDocuments(): Promise<WarehousingDocument[]> {
  return apiFetch<WarehousingDocument[]>(`${BASE}/documents/expiring/`);
}

export function reviewWarehousingDocument(
  id: UUID,
  input: { status: "verified" | "rejected"; notes: string },
): Promise<WarehousingDocument> {
  return apiFetch<WarehousingDocument>(`${BASE}/documents/${id}/review/`, {
    method: "POST",
    body: input,
  });
}

export function warehousingDocumentDownloadUrl(id: UUID): string {
  return `${BASE}/documents/${id}/download/`;
}

// --- requests / conditions (top-level, filterable) ----------------------------

export function listWarehousingRequests(
  query: WarehousingListQuery = FULL_PAGE,
): Promise<Paginated<WarehousingInformationRequest>> {
  return apiFetch<Paginated<WarehousingInformationRequest>>(`${BASE}/requests/`, { query });
}

export function listWarehousingConditions(
  query: WarehousingListQuery = FULL_PAGE,
): Promise<Paginated<WarehousingCondition>> {
  return apiFetch<Paginated<WarehousingCondition>>(`${BASE}/conditions/`, { query });
}

// --- notifications ---------------------------------------------------------------

export function listWarehousingNotifications(
  query: WarehousingListQuery = FULL_PAGE,
): Promise<Paginated<WarehousingNotification>> {
  return apiFetch<Paginated<WarehousingNotification>>(`${BASE}/notifications/`, { query });
}

export function markWarehousingNotificationRead(id: UUID): Promise<WarehousingNotification> {
  return apiFetch<WarehousingNotification>(`${BASE}/notifications/${id}/mark-read/`, {
    method: "POST",
  });
}

// --- reports ---------------------------------------------------------------------

export function listWarehousingReports(
  query: WarehousingListQuery = FULL_PAGE,
): Promise<Paginated<WarehousingReport>> {
  return apiFetch<Paginated<WarehousingReport>>(`${BASE}/reports/`, { query });
}

/** Compile a CSV register export across every warehouse the caller can see. */
export function generateWarehousingReport(): Promise<WarehousingReport> {
  return apiFetch<WarehousingReport>(`${BASE}/reports/`, { method: "POST" });
}

export function warehousingReportDownloadUrl(id: UUID): string {
  return `${BASE}/reports/${id}/download/`;
}
