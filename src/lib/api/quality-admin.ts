// Q&C administration endpoints from Release 1: roles and role assignments
// (backend G3), the audit log (G4) and rule settings (G5).
import { apiFetch } from "./client";
import type { QualityAction, QualityRecordType, QualityRoleCode } from "./quality";
import type { Paginated, UUID } from "./types";

const BASE = "/quality";

// --- roles --------------------------------------------------------------------

export interface QualityRoleDefinition {
  role_code: QualityRoleCode;
  role_name: string;
  is_internal: boolean;
  second_factor_required: boolean;
  grid: Partial<Record<QualityRecordType, QualityAction[]>>;
  restricted: QualityRecordType[];
}

export function listQualityRoles(signal?: AbortSignal): Promise<QualityRoleDefinition[]> {
  return apiFetch<QualityRoleDefinition[]>(`${BASE}/roles/`, { signal });
}

export type RoleAssignmentStatus = "pending_approval" | "active" | "ended" | "rejected";

export interface RoleAssignment {
  id: UUID;
  user_id: UUID;
  user_email: string;
  user_name: string;
  role_code: QualityRoleCode;
  organisation_id: UUID | null;
  organisation_name: string;
  valid_from: string;
  valid_to: string | null;
  status: RoleAssignmentStatus;
  granted_by: UUID | null;
  approved_by: UUID | null;
  decided_at: string | null;
  decision_reason: string;
  ended_by: UUID | null;
  ended_at: string | null;
  end_reason: string;
  created_at: string;
}

export type RoleAssignmentQuery = {
  page?: number;
  status?: RoleAssignmentStatus | "";
  role_code?: QualityRoleCode | "";
  user_id?: UUID;
};

export function listRoleAssignments(
  query: RoleAssignmentQuery = {},
  signal?: AbortSignal,
): Promise<Paginated<RoleAssignment>> {
  return apiFetch<Paginated<RoleAssignment>>(`${BASE}/role-assignments/`, { query, signal });
}

export interface NewRoleAssignment {
  /** Name the person by id or by email address. */
  user_id?: UUID;
  user_email?: string;
  role_code: QualityRoleCode;
  organisation_id?: UUID | null;
  valid_from: string;
  valid_to?: string | null;
}

export function createRoleAssignment(input: NewRoleAssignment): Promise<RoleAssignment> {
  return apiFetch<RoleAssignment>(`${BASE}/role-assignments/`, { method: "POST", body: input });
}

export function decideRoleAssignment(
  id: UUID,
  input: { decision: "approve" | "reject"; reason?: string },
): Promise<RoleAssignment> {
  return apiFetch<RoleAssignment>(`${BASE}/role-assignments/${id}/approve/`, {
    method: "POST",
    body: input,
  });
}

export function endRoleAssignment(id: UUID, reason: string): Promise<RoleAssignment> {
  return apiFetch<RoleAssignment>(`${BASE}/role-assignments/${id}/end/`, {
    method: "POST",
    body: { reason },
  });
}

// --- audit log ----------------------------------------------------------------

export interface AuditEntry {
  id: UUID;
  occurred_at: string;
  actor_id: UUID | null;
  actor_name: string;
  actor_role_code: string;
  action: string;
  record_type: string;
  record_id: string;
  record_label: string;
  batch_id: string;
  outcome: "success" | "refused";
  reason: string;
  before: unknown;
  after: unknown;
  ip_address: string;
  rule_version: string;
}

export type AuditLogQuery = {
  page?: number;
  record_type?: string;
  record_id?: string;
  actor_id?: string;
  action?: string;
  outcome?: "success" | "refused" | "";
  from?: string;
  to?: string;
};

export function listAuditLog(
  query: AuditLogQuery = {},
  signal?: AbortSignal,
): Promise<Paginated<AuditEntry>> {
  return apiFetch<Paginated<AuditEntry>>(`${BASE}/audit-log/`, { query, signal });
}

// --- settings -----------------------------------------------------------------

export type SettingValue = number | boolean | string | number[] | string[] | object | null;

export interface QualitySetting {
  setting_key: string;
  label: string;
  value: SettingValue;
  unit: string | null;
  value_type: "positive_int" | "positive_int_list" | "boolean" | "text" | "text_list" | "json";
  effective_from: string | null;
  is_placeholder: boolean;
  owner: string;
  note: string;
  rule_version: number | string | null;
  pending_change: { value: SettingValue; effective_from: string } | null;
}

export interface QualitySettings {
  rule_version: string;
  rule_version_effective_from: string | null;
  results: QualitySetting[];
}

export function listQualitySettings(signal?: AbortSignal): Promise<QualitySettings> {
  return apiFetch<QualitySettings>(`${BASE}/settings/`, { signal });
}

export interface SettingChange {
  id: UUID;
  setting_key: string;
  new_value: SettingValue;
  unit: string;
  effective_from: string;
  reason: string;
  changed_by: UUID | null;
  changed_by_name: string;
  changed_at: string;
  rule_version: string;
}

export function listSettingChanges(
  key: string,
  page = 1,
  signal?: AbortSignal,
): Promise<Paginated<SettingChange>> {
  return apiFetch<Paginated<SettingChange>>(`${BASE}/settings/${key}/changes/`, {
    query: { page },
    signal,
  });
}

export function changeSetting(
  key: string,
  input: { value: SettingValue; effective_from: string; reason: string },
): Promise<SettingChange> {
  return apiFetch<SettingChange>(`${BASE}/settings/${key}/changes/`, {
    method: "POST",
    body: input,
  });
}
