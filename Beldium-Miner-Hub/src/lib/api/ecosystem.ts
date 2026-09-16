import { apiFetch } from "./client";
import type { Paginated, UUID } from "./types";

// The cross-domain lifecycle hub: RFQs, transactions, material batches,
// logistics moves and commitments. This backs the miner portal's
// processing/quality/warehousing/logistics/export/finance *rows*, which are
// all derived from `Transaction`, not from those apps' own operator-facing
// REST resources.
//
// Two backend gaps confirmed against ecosystem/views.py: there is no
// accept/decline action on Rfq, and no allocate/fulfil action on Commitment —
// both are plain PATCH-based here until the backend adds dedicated actions.

export type RfqStatus = "open" | "accepted" | "partially_accepted" | "declined" | "expired";

export interface Rfq {
  id: UUID;
  reference: string;
  buyer_organisation: UUID;
  buyer_name: string;
  seller_organisation: UUID;
  seller_name: string;
  mineral: string;
  grade_spec: string;
  quantity_requested: number;
  unit: string;
  indicative_price: number | null;
  currency: string;
  incoterm: string;
  destination: string;
  received_at: string;
  respond_by: string | null;
  notes: string;
  status: RfqStatus;
  committed_quantity: number | null;
  decided_at: string | null;
  created_at: string;
  updated_at: string;
}

export function listRfqs(query: { status?: RfqStatus } = {}): Promise<Paginated<Rfq> | Rfq[]> {
  return apiFetch("/ecosystem/rfqs/", { query });
}

export function getRfq(id: UUID): Promise<Rfq> {
  return apiFetch<Rfq>(`/ecosystem/rfqs/${id}/`);
}

/** No dedicated accept action exists on the backend — PATCH the status directly. */
export function acceptRfq(id: UUID, committedQuantity: number): Promise<Rfq> {
  return apiFetch<Rfq>(`/ecosystem/rfqs/${id}/`, {
    method: "PATCH",
    body: { status: "accepted", committed_quantity: committedQuantity, decided_at: new Date().toISOString() },
  });
}

export function declineRfq(id: UUID): Promise<Rfq> {
  return apiFetch<Rfq>(`/ecosystem/rfqs/${id}/`, {
    method: "PATCH",
    body: { status: "declined", decided_at: new Date().toISOString() },
  });
}

export type LifecycleStage =
  | "rfq_received"
  | "accepted"
  | "aggregation"
  | "sample_requested"
  | "sample_logistics"
  | "sample_collected"
  | "lab_received"
  | "testing"
  | "results_published"
  | "buyer_quality_acceptance"
  | "bulk_logistics"
  | "material_picked_up"
  | "in_transit"
  | "warehouse_received"
  | "processing_started"
  | "processing_completed"
  | "output_recorded"
  | "post_processing_quality"
  | "export_compliance"
  | "export_ready"
  | "shipped"
  | "buyer_destination"
  | "delivered"
  | "payment_settlement";

export const LIFECYCLE_STAGES: LifecycleStage[] = [
  "rfq_received", "accepted", "aggregation", "sample_requested", "sample_logistics", "sample_collected",
  "lab_received", "testing", "results_published", "buyer_quality_acceptance", "bulk_logistics",
  "material_picked_up", "in_transit", "warehouse_received", "processing_started", "processing_completed",
  "output_recorded", "post_processing_quality", "export_compliance", "export_ready", "shipped",
  "buyer_destination", "delivered", "payment_settlement",
];

export interface TransactionStageEvent {
  id: UUID;
  stage: LifecycleStage;
  occurred_at: string;
  actor: UUID | null;
  actor_email: string | null;
  note: string;
}

export interface MaterialBatch {
  id: UUID;
  reference: string;
  mine_site: UUID;
  mineral: string;
  tonnes: number;
  grade: number | null;
  stage: "stockpile" | "allocated" | "in_transit" | "warehouse" | "processing" | "export_ready" | "shipped" | "delivered";
  location: string;
  transaction: UUID | null;
  created_at: string;
  updated_at: string;
}

export interface LogisticsMove {
  id: UUID;
  reference: string;
  transaction: UUID;
  batch: UUID | null;
  kind: "sample" | "bulk";
  carrier_company: UUID | null;
  carrier_name: string;
  carrier: string;
  vehicle: string;
  driver: string;
  from_location: string;
  to_location: string;
  tonnes: number;
  status: "assigned" | "in_transit" | "delivered";
  assigned_at: string;
  picked_up_at: string | null;
  arrived_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: UUID;
  reference: string;
  rfq: UUID | null;
  mine_site: UUID;
  mine_site_name: string;
  buyer_organisation: UUID;
  buyer_name: string;
  seller_organisation: UUID;
  seller_name: string;
  mineral: string;
  grade_spec: string;
  committed_tonnes: number;
  aggregated_tonnes: number;
  unit_price: number | null;
  currency: string;
  incoterm: string;
  destination: string;
  stage: LifecycleStage;
  progress_percent: number;
  value: number;
  is_closed: boolean;
  quality_sample: UUID | null;
  warehousing_lot: UUID | null;
  processing_run: UUID | null;
  export_shipment: UUID | null;
  finance_invoice: UUID | null;
  stage_events: TransactionStageEvent[];
  batches: MaterialBatch[];
  logistics_moves: LogisticsMove[];
  created_at: string;
  updated_at: string;
}

export type TransactionListItem = Omit<Transaction, "stage_events" | "batches" | "logistics_moves">;

export function listTransactions(): Promise<Paginated<TransactionListItem> | TransactionListItem[]> {
  return apiFetch("/ecosystem/transactions/");
}

export function getTransaction(id: UUID): Promise<Transaction> {
  return apiFetch<Transaction>(`/ecosystem/transactions/${id}/`);
}

export function advanceTransactionStage(id: UUID, stage: LifecycleStage, note = ""): Promise<Transaction> {
  return apiFetch<Transaction>(`/ecosystem/transactions/${id}/advance-stage/`, {
    method: "POST",
    body: { stage, note },
  });
}

export function patchTransaction(id: UUID, patch: Partial<Transaction>): Promise<Transaction> {
  return apiFetch<Transaction>(`/ecosystem/transactions/${id}/`, { method: "PATCH", body: patch });
}

export function listMaterialBatches(): Promise<Paginated<MaterialBatch> | MaterialBatch[]> {
  return apiFetch("/ecosystem/batches/");
}

export function createMaterialBatch(input: {
  mine_site: UUID;
  mineral: string;
  tonnes: number;
  grade?: number;
  stage?: MaterialBatch["stage"];
  location?: string;
  transaction?: UUID | null;
}): Promise<MaterialBatch> {
  return apiFetch<MaterialBatch>("/ecosystem/batches/", { method: "POST", body: input });
}

export function listLogisticsMoves(): Promise<Paginated<LogisticsMove> | LogisticsMove[]> {
  return apiFetch("/ecosystem/logistics-moves/");
}

export interface Commitment {
  id: UUID;
  transaction: UUID;
  mine_site: UUID;
  requested: number;
  committed: number;
  aggregated: number;
  remaining: number;
  fulfilment_percent: number;
  created_at: string;
}

export function listCommitments(): Promise<Paginated<Commitment> | Commitment[]> {
  return apiFetch("/ecosystem/commitments/");
}

/**
 * No allocate/fulfil action exists on the backend: Commitment fields are all
 * derived from the linked Transaction, so "allocating" tonnage means PATCHing
 * `Transaction.aggregated_tonnes` directly.
 */
export function allocateToCommitment(commitment: Commitment, additionalTonnes: number): Promise<Transaction> {
  return patchTransaction(commitment.transaction, {
    aggregated_tonnes: commitment.aggregated + additionalTonnes,
  });
}

export interface EcosystemDashboard {
  compliance_status: number | null;
  active_rfqs: number;
  active_supply_commitments: number;
  aggregated_to_date: number;
  available_inventory: number;
  in_transit: number;
  in_processing: number;
  export_ready: number;
  active_transactions: number;
  outstanding_payments: number;
  unread_notifications: number;
  actions_required: {
    id: string;
    title: string;
    detail: string;
    domain: "marketplace" | "logistics" | "finance";
    severity: "high" | "medium";
    due_at: string | null;
    transaction_id: string | null;
  }[];
  live_ecosystem_activity: { id: string; at: string; stage: string; message: string; reference: string }[];
}

export function fetchDashboard(signal?: AbortSignal): Promise<EcosystemDashboard> {
  return apiFetch<EcosystemDashboard>("/ecosystem/dashboard/", { signal });
}

export function nextStage(stage: LifecycleStage): LifecycleStage {
  const i = LIFECYCLE_STAGES.indexOf(stage);
  return LIFECYCLE_STAGES[Math.min(i + 1, LIFECYCLE_STAGES.length - 1)] ?? stage;
}
