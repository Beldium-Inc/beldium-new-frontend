import { apiFetch } from "./client";
import type { Paginated, UUID } from "./types";

// Miner-scoped calls against the `mining` Django app only — no review/decision
// endpoints (`sections/*/review`, `recompute-score`, non-conformity closure,
// document/licence review, inspection/application decisions). Those belong to
// the regulator/officer compliance app, not this portal.

export type MineSiteStatus = "operational" | "under_review" | "suspended" | "care_maintenance";
export type RiskLevel = "low" | "medium" | "high";

export interface MineSiteInput {
  organisation: UUID;
  name: string;
  mineral: string;
  state?: string | undefined;
  lga?: string | undefined;
  latitude?: number | null | undefined;
  longitude?: number | null | undefined;
  area_ha?: number | undefined;
  status?: MineSiteStatus | undefined;
  risk?: RiskLevel | undefined;
  capacity_tpa?: number | undefined;
  current_tpa?: number | undefined;
  workforce?: number | undefined;
  last_inspection_on?: string | null | undefined;
}

export interface MineSite extends MineSiteInput {
  id: UUID;
  code: string;
  compliance_score: number | null;
  compliance_percent: number;
  open_non_conformities: number;
  created_at: string;
  updated_at: string;
}

export function listMineSites(): Promise<Paginated<MineSite> | MineSite[]> {
  return apiFetch("/mining/sites/");
}

export function createMineSite(input: MineSiteInput): Promise<MineSite> {
  return apiFetch<MineSite>("/mining/sites/", { method: "POST", body: input });
}

export function getMineSite(id: UUID): Promise<MineSite> {
  return apiFetch<MineSite>(`/mining/sites/${id}/`);
}

export type EquipmentStatus = "certified" | "due_inspection" | "out_of_service";

export interface EquipmentInput {
  site: UUID;
  name: string;
  serial: string;
  cert_expires_on?: string | null | undefined;
  status?: EquipmentStatus | undefined;
}

export interface Equipment extends EquipmentInput {
  id: UUID;
  site_name: string;
  created_at: string;
  updated_at: string;
}

export function listEquipment(): Promise<Paginated<Equipment> | Equipment[]> {
  return apiFetch("/mining/equipment/");
}

export function createEquipment(input: EquipmentInput): Promise<Equipment> {
  return apiFetch<Equipment>("/mining/equipment/", { method: "POST", body: input });
}

export function deleteEquipment(id: UUID): Promise<void> {
  return apiFetch<void>(`/mining/equipment/${id}/`, { method: "DELETE" });
}

export interface ProductionRecordInput {
  site: UUID;
  period_start: string;
  period_end: string;
  commodity: string;
  tonnage: number;
  grade?: number | undefined;
  notes?: string | undefined;
}

export interface ProductionRecord extends ProductionRecordInput {
  id: UUID;
  site_name: string;
  created_at: string;
  updated_at: string;
}

export function listProduction(): Promise<Paginated<ProductionRecord> | ProductionRecord[]> {
  return apiFetch("/mining/production/");
}

export function createProduction(input: ProductionRecordInput): Promise<ProductionRecord> {
  return apiFetch<ProductionRecord>("/mining/production/", { method: "POST", body: input });
}

export interface InventoryItemInput {
  site: UUID;
  category: string;
  name: string;
  quantity: number;
  unit: string;
  threshold?: number | undefined;
}

export interface InventoryItem extends InventoryItemInput {
  id: UUID;
  site_name: string;
  created_at: string;
  updated_at: string;
}

export function listInventory(): Promise<Paginated<InventoryItem> | InventoryItem[]> {
  return apiFetch("/mining/inventory/");
}

export function createInventoryItem(input: InventoryItemInput): Promise<InventoryItem> {
  return apiFetch<InventoryItem>("/mining/inventory/", { method: "POST", body: input });
}

export type DocumentStatus = "pending" | "verified" | "rejected" | "expired";

export interface DocumentRecord {
  id: UUID;
  site: UUID;
  name: string;
  category: string;
  expires_on: string | null;
  status: DocumentStatus;
  file_url: string | null;
  original_name: string;
  uploaded_by_name: string;
  created_at: string;
  updated_at: string;
}

export function listDocuments(): Promise<Paginated<DocumentRecord> | DocumentRecord[]> {
  return apiFetch("/mining/documents/");
}

export function uploadDocument(input: {
  site: UUID;
  name: string;
  category: string;
  expires_on?: string;
  file: File;
}): Promise<DocumentRecord> {
  const form = new FormData();
  form.append("site", input.site);
  form.append("name", input.name);
  form.append("category", input.category);
  if (input.expires_on) form.append("expires_on", input.expires_on);
  form.append("file", input.file);
  return apiFetch<DocumentRecord>("/mining/documents/", { method: "POST", body: form });
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

export function listLicences(): Promise<Paginated<LicenceDoc> | LicenceDoc[]> {
  return apiFetch("/mining/licences/");
}

export function createLicence(input: {
  site: UUID;
  number: string;
  type: string;
  authority: string;
  issued_on?: string;
  expires_on?: string;
  file?: File;
}): Promise<LicenceDoc> {
  const form = new FormData();
  form.append("site", input.site);
  form.append("number", input.number);
  form.append("type", input.type);
  form.append("authority", input.authority);
  if (input.issued_on) form.append("issued_on", input.issued_on);
  if (input.expires_on) form.append("expires_on", input.expires_on);
  if (input.file) form.append("file", input.file);
  return apiFetch<LicenceDoc>("/mining/licences/", { method: "POST", body: form });
}

export function listExpiringLicences(): Promise<
  { id: UUID; number: string; type: string; site_name: string; authority: string; expires_on: string; days_to_expiry: number; status: LicenceStatus }[]
> {
  return apiFetch("/mining/licences/expiring/");
}

export interface ApplicationInput {
  organisation: UUID;
  site?: UUID | undefined;
  site_name?: string | undefined;
  type: string;
  mineral?: string | undefined;
  submitted_on?: string | undefined;
  stage?: string | undefined;
  sla_days?: number | undefined;
}

export type MiningApplicationStatus = "pending" | "under_review" | "approved" | "rejected" | "info_requested";

export interface MiningApplication extends ApplicationInput {
  id: UUID;
  reference: string;
  status: MiningApplicationStatus;
  created_at: string;
  updated_at: string;
}

export function listApplications(): Promise<Paginated<MiningApplication> | MiningApplication[]> {
  return apiFetch("/mining/applications/");
}

export function createApplication(input: ApplicationInput): Promise<MiningApplication> {
  return apiFetch<MiningApplication>("/mining/applications/", { method: "POST", body: input });
}

export type NonConformitySeverity = "minor" | "major" | "critical";
export type NonConformityStatus = "open" | "in_progress" | "awaiting_review" | "closed" | "escalated";

export interface NonConformity {
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

export interface CorrectiveSubmission {
  id: UUID;
  message: string;
  submitted_by_name: string;
  decision: "accepted" | "rejected" | "more_info_requested" | null;
  decision_note: string;
  decided_at: string | null;
  created_at: string;
}

export function listNonConformities(): Promise<Paginated<NonConformity> | NonConformity[]> {
  return apiFetch("/mining/non-conformities/");
}

export function submitCorrectiveEvidence(
  nonConformityId: UUID,
  input: { message: string; file?: File },
): Promise<CorrectiveSubmission> {
  const form = new FormData();
  form.append("message", input.message);
  if (input.file) form.append("file", input.file);
  return apiFetch<CorrectiveSubmission>(`/mining/non-conformities/${nonConformityId}/submissions/`, {
    method: "POST",
    body: form,
  });
}

export interface InfoRequest {
  id: UUID;
  site_name: string;
  requested_by_name: string;
  subject: string;
  details: string;
  due_by: string | null;
  priority: "low" | "normal" | "high";
  status: "open" | "responded" | "closed";
  response_message: string;
  response_at: string | null;
  created_at: string;
  updated_at: string;
}

export function listInfoRequests(): Promise<Paginated<InfoRequest> | InfoRequest[]> {
  return apiFetch("/mining/info-requests/");
}

export function respondToInfoRequest(id: UUID, message: string): Promise<InfoRequest> {
  return apiFetch<InfoRequest>(`/mining/info-requests/${id}/respond/`, {
    method: "POST",
    body: { message },
  });
}

export interface MiningDashboard {
  audience: "operator" | "regulator" | "miner" | null;
  capabilities: Record<string, unknown>;
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
  kpi_trend: { month: string; approvals: number; nonconformities: number; inspections: number }[];
  regional_compliance: {
    region: string;
    sites: number;
    operational: number;
    under_review: number;
    suspended: number;
    avg_score: number;
  }[];
  expiring_licences: {
    id: UUID;
    number: string;
    type: string;
    site_name: string;
    authority: string;
    expires_on: string;
    days_to_expiry: number;
    status: LicenceStatus;
  }[];
  notifications: {
    id: string;
    title: string;
    body: string;
    at: string;
    kind: "info" | "error" | "warn";
    entity: string;
    entity_id: string;
    reference: string;
  }[];
  recent_applications: MiningApplication[];
  open_environmental_records: unknown[];
  open_incidents: unknown[];
}

export function fetchDashboard(signal?: AbortSignal): Promise<MiningDashboard> {
  return apiFetch<MiningDashboard>("/mining/dashboard/", { signal });
}

export interface MiningCapabilities {
  audience: "operator" | "regulator" | "miner" | null;
  can_decide: boolean;
  can_read_register: boolean;
  is_staff: boolean;
}

export function fetchMe(signal?: AbortSignal): Promise<MiningCapabilities> {
  return apiFetch<MiningCapabilities>("/mining/me/", { signal });
}

export function fetchChecklist(signal?: AbortSignal): Promise<{ sections: unknown }> {
  return apiFetch("/mining/checklist/", { signal });
}
