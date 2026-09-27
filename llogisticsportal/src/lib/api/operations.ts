import { apiFetch } from "./client";
import type { Paginated, UUID } from "./types";

// PROPOSED CONTRACT. The backend has no operational logistics endpoints yet:
// transport requests, movements, incidents and invoices only exist in the demo
// ops-store. These shapes mirror that store in the backend's snake_case, so
// when the endpoints ship, a page moves off `useOps()` onto the hooks in
// operations-queries.ts without its UI changing. Adjust to the real
// serializers once they exist; nothing calls these while VITE_DATA_MODE=demo.
//
// Fleet and drivers are NOT here: /logistics/vehicles/ and /logistics/drivers/
// already exist (see logistics.ts) and should be the first pages migrated.

const BASE = "/logistics/ops";

export type MovementKind = "sample" | "bulk";

export type TransportRequestStatus = "new" | "awaiting_decision" | "accepted" | "declined";

export interface TransportRequest {
  id: UUID;
  reference: string;
  transaction: UUID;
  kind: MovementKind;
  movement_type: string;
  source: string;
  requested_by: string;
  origin: UUID;
  destination: UUID;
  quantity: string;
  unit: string;
  pickup_by: string;
  deliver_by: string;
  handling: string;
  payment_terms: string;
  status: TransportRequestStatus;
  decline_reason: string;
  movement: UUID | null;
  created_at: string;
}

export interface MovementEvent {
  at: string;
  event: string;
  actor: string;
  location: string;
  gps: string;
  quantity: string;
  evidence: string;
  source: string;
}

export interface Movement {
  id: UUID;
  reference: string;
  request: UUID;
  transaction: UUID;
  kind: MovementKind;
  movement_type: string;
  origin: UUID;
  destination: UUID;
  quantity: string;
  unit: string;
  /** One of the stages in BULK_FLOW / SAMPLE_FLOW, snake_cased. */
  stage: string;
  vehicle: UUID | null;
  driver: UUID | null;
  pickup_at: string | null;
  deliver_by: string;
  progress: number;
  is_delayed: boolean;
  is_deviated: boolean;
  is_stopped: boolean;
  has_exception: boolean;
  eta_minutes: number | null;
  loaded_quantity: string | null;
  received_quantity: string | null;
  sample_reference: string;
  custody_reference: string;
  pod_reference: string;
  rate: string;
  timeline: MovementEvent[];
  created_at: string;
  completed_at: string | null;
}

export type IncidentSeverity = "low" | "medium" | "high" | "critical";

export interface Incident {
  id: UUID;
  reference: string;
  movement: UUID;
  incident_type: string;
  severity: IncidentSeverity;
  description: string;
  location: string;
  material: string;
  quantity_affected: string;
  evidence: string;
  immediate_action: string;
  status: "open" | "resolved";
  resolution: string;
  reported_at: string;
  resolved_at: string | null;
}

export type InvoiceStatus =
  "not_invoiced" | "invoice_generated" | "submitted" | "pending" | "partially_paid" | "paid";

export interface Invoice {
  id: UUID;
  reference: string;
  movement: UUID;
  transaction: UUID;
  amount: string;
  paid: string;
  status: InvoiceStatus;
  updated_at: string;
}

export interface OpsListQuery {
  page?: number | undefined;
  page_size?: number | undefined;
  search?: string | undefined;
  status?: string | undefined;
  ordering?: string | undefined;
}

// --- transport requests -------------------------------------------------------

export function listTransportRequests(
  query: OpsListQuery = {},
): Promise<Paginated<TransportRequest>> {
  return apiFetch<Paginated<TransportRequest>>(`${BASE}/transport-requests/`, {
    query: { ...query },
  });
}

export function getTransportRequest(id: UUID): Promise<TransportRequest> {
  return apiFetch<TransportRequest>(`${BASE}/transport-requests/${id}/`);
}

/** Accepting creates the movement; the response carries its id. */
export function acceptTransportRequest(id: UUID): Promise<TransportRequest> {
  return apiFetch<TransportRequest>(`${BASE}/transport-requests/${id}/accept/`, { method: "POST" });
}

export function declineTransportRequest(id: UUID, reason: string): Promise<TransportRequest> {
  return apiFetch<TransportRequest>(`${BASE}/transport-requests/${id}/decline/`, {
    method: "POST",
    body: { reason },
  });
}

// --- movements -----------------------------------------------------------------

export function listMovements(query: OpsListQuery = {}): Promise<Paginated<Movement>> {
  return apiFetch<Paginated<Movement>>(`${BASE}/movements/`, { query: { ...query } });
}

export function getMovement(id: UUID): Promise<Movement> {
  return apiFetch<Movement>(`${BASE}/movements/${id}/`);
}

/** Server re-checks vehicle/driver compliance, as vehicleBlock/driverBlock do in the demo. */
export function assignMovement(
  id: UUID,
  input: { vehicle: UUID; driver: UUID; pickup_at: string },
): Promise<Movement> {
  return apiFetch<Movement>(`${BASE}/movements/${id}/assign/`, { method: "POST", body: input });
}

/** Advance a movement: the demo's runAction(movementId, action, value). */
export function runMovementAction(
  id: UUID,
  input: { action: string; value?: number | undefined },
): Promise<Movement> {
  return apiFetch<Movement>(`${BASE}/movements/${id}/actions/`, { method: "POST", body: input });
}

// --- incidents -------------------------------------------------------------------

export function listIncidents(query: OpsListQuery = {}): Promise<Paginated<Incident>> {
  return apiFetch<Paginated<Incident>>(`${BASE}/incidents/`, { query: { ...query } });
}

export function reportIncident(
  input: Omit<
    Incident,
    "id" | "reference" | "status" | "resolution" | "reported_at" | "resolved_at"
  >,
): Promise<Incident> {
  return apiFetch<Incident>(`${BASE}/incidents/`, { method: "POST", body: input });
}

export function resolveIncident(id: UUID, resolution: string): Promise<Incident> {
  return apiFetch<Incident>(`${BASE}/incidents/${id}/resolve/`, {
    method: "POST",
    body: { resolution },
  });
}

// --- invoices ----------------------------------------------------------------------

export function listInvoices(query: OpsListQuery = {}): Promise<Paginated<Invoice>> {
  return apiFetch<Paginated<Invoice>>(`${BASE}/invoices/`, { query: { ...query } });
}

export type InvoiceAction = "generate" | "submit" | "buyer_ack" | "part_pay" | "pay";

export function runInvoiceAction(id: UUID, action: InvoiceAction): Promise<Invoice> {
  return apiFetch<Invoice>(`${BASE}/invoices/${id}/${action.replace("_", "-")}/`, {
    method: "POST",
  });
}
