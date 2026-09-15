import { apiFetch } from "./client";
import type { Paginated, UUID } from "./types";

// The cross-domain transaction spine: a buyer's Rfq becomes a Transaction,
// which aggregates MaterialBatch stock and moves it with LogisticsMove
// records, linking out to the real per-domain record once each stage is
// reached. Mirrors `beldium-backend/ecosystem/serializers.py` field-for-field.

const BASE = "/ecosystem";

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

export const LIFECYCLE_STAGES: { id: LifecycleStage; label: string }[] = [
  { id: "rfq_received", label: "RFQ received" },
  { id: "accepted", label: "Accepted" },
  { id: "aggregation", label: "Aggregation" },
  { id: "sample_requested", label: "Sample requested" },
  { id: "sample_logistics", label: "Sample logistics assigned" },
  { id: "sample_collected", label: "Sample collected" },
  { id: "lab_received", label: "Laboratory received" },
  { id: "testing", label: "Testing" },
  { id: "results_published", label: "Results published" },
  { id: "buyer_quality_acceptance", label: "Buyer quality acceptance" },
  { id: "bulk_logistics", label: "Bulk logistics assigned" },
  { id: "material_picked_up", label: "Material picked up" },
  { id: "in_transit", label: "In transit" },
  { id: "warehouse_received", label: "Warehouse / processor received" },
  { id: "processing_started", label: "Processing started" },
  { id: "processing_completed", label: "Processing completed" },
  { id: "output_recorded", label: "Output tonnage recorded" },
  { id: "post_processing_quality", label: "Post processing quality" },
  { id: "export_compliance", label: "Export compliance" },
  { id: "export_ready", label: "Export ready" },
  { id: "shipped", label: "Shipped" },
  { id: "buyer_destination", label: "Buyer destination" },
  { id: "delivered", label: "Delivered" },
  { id: "payment_settlement", label: "Payment / settlement" },
];

export function stageIndexOf(stage: LifecycleStage): number {
  return LIFECYCLE_STAGES.findIndex((s) => s.id === stage);
}

export function stageLabel(stage: LifecycleStage): string {
  return LIFECYCLE_STAGES.find((s) => s.id === stage)?.label ?? stage;
}

export type EcosystemRfqStatus = "open" | "accepted" | "partially_accepted" | "declined" | "expired";

export interface EcosystemRfq {
  id: UUID;
  reference: string;
  buyer_organisation: UUID;
  buyer_name: string;
  seller_organisation: UUID;
  seller_name: string;
  mineral: string;
  grade_spec: string;
  quantity_requested: string;
  unit: string;
  indicative_price: string;
  currency: string;
  incoterm: string;
  destination: string;
  received_at: string;
  respond_by: string | null;
  notes: string;
  status: EcosystemRfqStatus;
  committed_quantity: string;
  decided_at: string | null;
  created_at: string;
  updated_at: string;
}

export type BatchStage =
  | "stockpile" | "allocated" | "in_transit" | "warehouse"
  | "processing" | "export_ready" | "shipped" | "delivered";

export interface MaterialBatch {
  id: UUID;
  reference: string;
  mine_site: UUID;
  mineral: string;
  tonnes: string;
  grade: string;
  stage: BatchStage;
  location: string;
  transaction: UUID | null;
  created_at: string;
  updated_at: string;
}

export type MoveKind = "sample" | "bulk";
export type MoveStatus = "assigned" | "in_transit" | "delivered";

export interface LogisticsMove {
  id: UUID;
  reference: string;
  transaction: UUID;
  batch: UUID | null;
  kind: MoveKind;
  carrier_company: UUID | null;
  carrier_name: string;
  carrier: string;
  vehicle: string;
  driver: string;
  from_location: string;
  to_location: string;
  tonnes: string;
  status: MoveStatus;
  assigned_at: string;
  picked_up_at: string | null;
  arrived_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TransactionStageEvent {
  id: UUID;
  stage: LifecycleStage;
  occurred_at: string;
  actor: UUID | null;
  actor_email: string | null;
  note: string;
}

export interface Transaction {
  id: UUID;
  reference: string;
  rfq: UUID;
  mine_site: UUID;
  mine_site_name: string;
  buyer_organisation: UUID;
  buyer_name: string;
  seller_organisation: UUID;
  seller_name: string;
  mineral: string;
  grade_spec: string;
  committed_tonnes: string;
  aggregated_tonnes: string;
  unit_price: string;
  currency: string;
  incoterm: string;
  destination: string;
  stage: LifecycleStage;
  quality_sample: UUID | null;
  warehousing_lot: UUID | null;
  processing_run: UUID | null;
  export_shipment: UUID | null;
  finance_invoice: UUID | null;
  progress_percent: number;
  value: string;
  is_closed: boolean;
  created_at: string;
  updated_at: string;
}

export interface TransactionDetail extends Transaction {
  stage_events: TransactionStageEvent[];
  batches: MaterialBatch[];
  logistics_moves: LogisticsMove[];
}

export interface Commitment {
  id: UUID;
  transaction: UUID;
  mine_site: UUID;
  requested: string;
  committed: string;
  aggregated: string;
  remaining: string;
  fulfilment_percent: number;
  created_at: string;
}

export interface ActionRequiredItem {
  id: string;
  title: string;
  detail: string;
  domain: "marketplace" | "quality" | "logistics" | "warehousing" | "processing" | "export" | "finance";
  severity: "high" | "medium" | "low";
  due_at: string | null;
  transaction_id: string | null;
}

export interface EcosystemActivityItem {
  id: string;
  at: string;
  stage: LifecycleStage;
  message: string;
  reference: string;
}

export interface EcosystemDashboard {
  compliance_status: number | null;
  active_rfqs: number;
  active_supply_commitments: number;
  aggregated_to_date: string;
  available_inventory: string;
  in_transit: string;
  in_processing: string;
  export_ready: string;
  active_transactions: number;
  outstanding_payments: number;
  unread_notifications: number;
  actions_required: ActionRequiredItem[];
  action_centre_items: ActionRequiredItem[];
  live_ecosystem_activity: EcosystemActivityItem[];
}

export interface EcosystemListQuery {
  page?: number;
  page_size?: number;
  search?: string;
  ordering?: string;
  [key: string]: string | number | boolean | null | undefined;
}

export function fetchEcosystemDashboard(signal?: AbortSignal): Promise<EcosystemDashboard> {
  return apiFetch<EcosystemDashboard>(`${BASE}/dashboard/`, { signal });
}

// --- RFQs ---------------------------------------------------------------

export function listEcosystemRfqs(query: EcosystemListQuery = {}): Promise<Paginated<EcosystemRfq>> {
  return apiFetch<Paginated<EcosystemRfq>>(`${BASE}/rfqs/`, { query });
}

export function getEcosystemRfq(id: UUID): Promise<EcosystemRfq> {
  return apiFetch<EcosystemRfq>(`${BASE}/rfqs/${id}/`);
}

export function updateEcosystemRfq(id: UUID, patch: Partial<EcosystemRfq>): Promise<EcosystemRfq> {
  return apiFetch<EcosystemRfq>(`${BASE}/rfqs/${id}/`, { method: "PATCH", body: patch });
}

// --- Transactions ---------------------------------------------------------

export function listTransactions(query: EcosystemListQuery = {}): Promise<Paginated<Transaction>> {
  return apiFetch<Paginated<Transaction>>(`${BASE}/transactions/`, { query });
}

export function getTransaction(id: UUID): Promise<TransactionDetail> {
  return apiFetch<TransactionDetail>(`${BASE}/transactions/${id}/`);
}

export function advanceTransactionStage(
  id: UUID,
  input: { stage: LifecycleStage; note?: string | undefined },
): Promise<TransactionDetail> {
  return apiFetch<TransactionDetail>(`${BASE}/transactions/${id}/advance-stage/`, {
    method: "POST",
    body: input,
  });
}

// --- Material batches -------------------------------------------------------

export function listBatches(query: EcosystemListQuery = {}): Promise<Paginated<MaterialBatch>> {
  return apiFetch<Paginated<MaterialBatch>>(`${BASE}/batches/`, { query });
}

export function updateBatch(id: UUID, patch: Partial<MaterialBatch>): Promise<MaterialBatch> {
  return apiFetch<MaterialBatch>(`${BASE}/batches/${id}/`, { method: "PATCH", body: patch });
}

// --- Logistics moves --------------------------------------------------------

export function listLogisticsMoves(query: EcosystemListQuery = {}): Promise<Paginated<LogisticsMove>> {
  return apiFetch<Paginated<LogisticsMove>>(`${BASE}/logistics-moves/`, { query });
}

export function updateLogisticsMove(id: UUID, patch: Partial<LogisticsMove>): Promise<LogisticsMove> {
  return apiFetch<LogisticsMove>(`${BASE}/logistics-moves/${id}/`, { method: "PATCH", body: patch });
}

// --- Commitments -------------------------------------------------------------

export function listCommitments(query: EcosystemListQuery = {}): Promise<Paginated<Commitment>> {
  return apiFetch<Paginated<Commitment>>(`${BASE}/commitments/`, { query });
}
