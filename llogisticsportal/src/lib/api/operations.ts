import { apiFetch } from "./client";
import type { Paginated, UUID } from "./types";

// Operator-side logistics operations: transport requests, movements,
// deliveries, transactions, payments, incidents and the records around them.
// Mirrors beldium-backend/logistics (models.py / serializers.py, commit
// f0ba53b) field-for-field. Decimals arrive as strings, as DRF serialises them.

const BASE = "/logistics";

export interface OpsListQuery {
  page?: number | undefined;
  page_size?: number | undefined;
  search?: string | undefined;
  ordering?: string | undefined;
  [filter: string]: string | number | boolean | null | undefined;
}

type Stamp = { id: UUID; company: UUID; created_at: string; updated_at: string };
type Meta = { metadata: Record<string, unknown> };

// --- transport requests ------------------------------------------------------

export type TransportRequestStatus = "new" | "accepted" | "assigned" | "blocked" | "cancelled";

export interface TransportRequest extends Stamp, Meta {
  reference: string;
  rfq_id: string;
  transaction_id: string;
  movement_type: string;
  requester: string;
  miner: string;
  buyer: string;
  mineral: string;
  quantity: string;
  quantity_unit: string;
  quantity_display: string;
  origin: string;
  destination: string;
  required_pickup_at: string | null;
  status: TransportRequestStatus;
  blocked_reason: string;
}

export const listTransportRequests = (query: OpsListQuery = {}) =>
  apiFetch<Paginated<TransportRequest>>(`${BASE}/transport-requests/`, { query });

export const getTransportRequest = (id: UUID) =>
  apiFetch<TransportRequest>(`${BASE}/transport-requests/${id}/`);

export const acceptTransportRequest = (id: UUID) =>
  apiFetch<TransportRequest>(`${BASE}/transport-requests/${id}/accept/`, { method: "POST" });

// --- movements ---------------------------------------------------------------

export type MovementStatus =
  "scheduled" | "assigned" | "loading" | "in_transit" | "delayed" | "delivered" | "cancelled";

export const MOVEMENT_STATUSES: MovementStatus[] = [
  "scheduled",
  "assigned",
  "loading",
  "in_transit",
  "delayed",
  "delivered",
  "cancelled",
];

export interface Movement extends Stamp, Meta {
  reference: string;
  request: UUID | null;
  batch_id: string;
  rfq_id: string;
  transaction_id: string;
  movement_type: string;
  miner: string;
  buyer: string;
  mineral: string;
  quantity: string;
  quantity_unit: string;
  quantity_display: string;
  origin: string;
  destination: string;
  vehicle: UUID | null;
  vehicle_registration?: string | undefined;
  driver: UUID | null;
  driver_name?: string | undefined;
  pickup_at: string | null;
  eta_at: string | null;
  delivered_at: string | null;
  status: MovementStatus;
  last_latitude: string | null;
  last_longitude: string | null;
  last_gps_at: string | null;
}

export const listMovements = (query: OpsListQuery = {}) =>
  apiFetch<Paginated<Movement>>(`${BASE}/movements/`, { query });

export const getMovement = (id: UUID) => apiFetch<Movement>(`${BASE}/movements/${id}/`);

/** Server rejects vehicles/drivers from another company, or a driver tied to a different vehicle. */
export const assignMovement = (
  id: UUID,
  input: { vehicle?: UUID | undefined; driver?: UUID | undefined },
) => apiFetch<Movement>(`${BASE}/movements/${id}/assign/`, { method: "POST", body: input });

export interface MovementStatusInput {
  status: MovementStatus;
  occurred_at?: string | undefined;
  latitude?: string | undefined;
  longitude?: string | undefined;
  /** Recorded as an operations event on the company's feed. */
  note?: string | undefined;
}

export const setMovementStatus = (id: UUID, input: MovementStatusInput) =>
  apiFetch<Movement>(`${BASE}/movements/${id}/status/`, { method: "POST", body: input });

// --- deliveries ----------------------------------------------------------------

export interface Delivery extends Stamp, Meta {
  reference: string;
  movement: UUID;
  movement_reference: string;
  transaction_id: string;
  destination_type: string;
  destination: string;
  expected_quantity: string;
  received_quantity: string | null;
  quantity_unit: string;
  receipt_reference: string;
  arrived_at: string | null;
  custody_transferred_at: string | null;
  status: string;
  variance: string | null;
}

export const listDeliveries = (query: OpsListQuery = {}) =>
  apiFetch<Paginated<Delivery>>(`${BASE}/deliveries/`, { query });

export const completeDelivery = (
  id: UUID,
  input: {
    received_quantity: string;
    receipt_reference?: string | undefined;
    custody_transferred_at?: string | undefined;
  },
) => apiFetch<Delivery>(`${BASE}/deliveries/${id}/complete/`, { method: "POST", body: input });

// --- transactions & payments ---------------------------------------------------

export interface LogisticsTransaction extends Stamp, Meta {
  transaction_id: string;
  rfq_id: string;
  buyer: string;
  miner: string;
  material: string;
  quantity: string;
  quantity_unit: string;
  origin: string;
  destination: string;
  movement: UUID | null;
  movement_reference?: string | undefined;
  transport_fee: string;
  stage: string;
  delivery_status: string;
  payment_status: string;
}

export const listTransactions = (query: OpsListQuery = {}) =>
  apiFetch<Paginated<LogisticsTransaction>>(`${BASE}/operations-transactions/`, { query });

export const getTransaction = (id: UUID) =>
  apiFetch<LogisticsTransaction>(`${BASE}/operations-transactions/${id}/`);

export interface LogisticsPayment extends Stamp, Meta {
  reference: string;
  transaction: UUID | null;
  transaction_id?: string | undefined;
  movement: UUID | null;
  movement_reference?: string | undefined;
  invoice_reference: string;
  job_value: string;
  due_amount: string;
  paid_amount: string;
  outstanding_amount: string;
  status: string;
  payment_date: string | null;
}

export const listPayments = (query: OpsListQuery = {}) =>
  apiFetch<Paginated<LogisticsPayment>>(`${BASE}/operations-payments/`, { query });

// --- incidents -------------------------------------------------------------------

export type IncidentSeverity = "low" | "medium" | "high" | "critical";

export interface Incident extends Stamp, Meta {
  reference: string;
  movement: UUID | null;
  movement_reference?: string | undefined;
  vehicle_registration?: string | undefined;
  driver_name?: string | undefined;
  incident_type: string;
  severity: IncidentSeverity;
  status: string;
  location: string;
  occurred_at: string;
  description: string;
  immediate_action: string;
  resolution: string;
}

export interface NewIncidentInput {
  company: UUID;
  /** Client-supplied: the backend has no reference generator for incidents yet. */
  reference: string;
  movement?: UUID | null | undefined;
  incident_type: string;
  severity: IncidentSeverity;
  status: string;
  location?: string | undefined;
  occurred_at: string;
  description: string;
  immediate_action?: string | undefined;
}

export const listIncidents = (query: OpsListQuery = {}) =>
  apiFetch<Paginated<Incident>>(`${BASE}/incidents/`, { query });

export const reportIncident = (input: NewIncidentInput) =>
  apiFetch<Incident>(`${BASE}/incidents/`, { method: "POST", body: input });

export const resolveIncident = (
  id: UUID,
  input: { resolution: string; status?: string | undefined },
) => apiFetch<Incident>(`${BASE}/incidents/${id}/resolve/`, { method: "POST", body: input });

// --- documents, findings, quality -------------------------------------------------

/** Register entry only: the model has no file field. Uploaded evidence lives in logistics.ts documents. */
export interface OperationsDocument extends Stamp, Meta {
  reference: string;
  name: string;
  document_type: string;
  related_asset: string;
  issue_date: string | null;
  expiry_date: string | null;
  verification_status: string;
  compliance_status: string;
}

export const listOperationsDocuments = (query: OpsListQuery = {}) =>
  apiFetch<Paginated<OperationsDocument>>(`${BASE}/operations-documents/`, { query });

export interface ComplianceFinding extends Stamp, Meta {
  reference: string;
  area: string;
  detail: string;
  action: string;
  owner: string;
  status: string;
  raised_at: string;
}

export const listFindings = (query: OpsListQuery = {}) =>
  apiFetch<Paginated<ComplianceFinding>>(`${BASE}/compliance-findings/`, { query });

/** Record the corrective action taken; the status wording is free text on the backend. */
export const updateFinding = (
  id: UUID,
  patch: { action?: string; owner?: string; status?: string },
) =>
  apiFetch<ComplianceFinding>(`${BASE}/compliance-findings/${id}/`, {
    method: "PATCH",
    body: patch,
  });

export interface QualityRecord extends Stamp, Meta {
  transaction_id: string;
  sample_status: string;
  result: string;
  approval: string;
  handling: string;
  certificate: string;
  buyer_acceptance: string;
}

export const listQualityRecords = (query: OpsListQuery = {}) =>
  apiFetch<Paginated<QualityRecord>>(`${BASE}/quality-records/`, { query });

// --- events & action items ------------------------------------------------------------

export interface OperationsEvent extends Stamp, Meta {
  occurred_at: string;
  text: string;
  sector: string;
  event_type: string;
  unread: boolean;
}

export const listOperationsEvents = (query: OpsListQuery = {}) =>
  apiFetch<Paginated<OperationsEvent>>(`${BASE}/operations-events/`, { query });

export const markEventRead = (id: UUID) =>
  apiFetch<OperationsEvent>(`${BASE}/operations-events/${id}/mark-read/`, { method: "POST" });

export interface ActionItem extends Stamp, Meta {
  action: string;
  target: string;
  urgency: string;
  status: "open" | "done" | "dismissed";
  related_movement: UUID | null;
  movement_reference?: string | undefined;
}

export const listActionItems = (query: OpsListQuery = {}) =>
  apiFetch<Paginated<ActionItem>>(`${BASE}/action-items/`, { query });

export const completeActionItem = (id: UUID) =>
  apiFetch<ActionItem>(`${BASE}/action-items/${id}/complete/`, { method: "POST" });

// --- dashboard -------------------------------------------------------------------------

export interface OperationsDashboard {
  stats: {
    active_jobs: number;
    new_transport_requests: number;
    awaiting_acceptance: number;
    vehicles_assigned: number;
    drivers_active: number;
    awaiting_pickup: number;
    loading: number;
    in_transit: number;
    delayed_shipments: number;
    open_incidents: number;
    compliance_alerts: number;
    available_vehicles: number;
    unread_notifications: number;
    tonnes_moved: string | number;
    outstanding_payments: string | number;
  };
  status_breakdown: { status: MovementStatus; count: number }[];
  action_items: ActionItem[];
  events: OperationsEvent[];
  active_movements: Movement[];
  transport_requests: TransportRequest[];
  filters: {
    movement_types: string[];
    statuses: string[];
    miners: string[];
    buyers: string[];
    minerals: string[];
  };
}

export const fetchOperationsDashboard = (signal?: AbortSignal) =>
  apiFetch<OperationsDashboard>(`${BASE}/operations_dashboard/`, { signal });
