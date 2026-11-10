import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiFetch } from "./client";
import type { Driver, LogisticsListQuery, Vehicle } from "./logistics";
import { useHasTokens } from "./queries";
import type { Paginated, UUID } from "./types";

// Read side of logistics operations for the compliance desk and regulators:
// trips (movements), their deliveries and incidents, plus the per-vehicle and
// per-driver review. Shapes mirror `beldium-backend/logistics/serializers.py`.
// The Logistics Portal (llogisticsportal) owns the partner's write side.

const BASE = "/logistics";

// --- movements -------------------------------------------------------------------

export type MovementStatus =
  | "scheduled"
  | "assigned"
  | "loading"
  | "in_transit"
  | "delayed"
  | "arrived"
  | "delivered"
  | "cancelled";

export const MOVEMENT_STATUS_LABEL: Record<MovementStatus, string> = {
  scheduled: "Scheduled",
  assigned: "Assigned",
  loading: "Loading",
  in_transit: "In transit",
  delayed: "Delayed",
  arrived: "Arrived",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

/** The order a trip moves through, for the progress strip. Delayed and cancelled sit outside it. */
export const MOVEMENT_STAGES: MovementStatus[] = [
  "scheduled",
  "assigned",
  "loading",
  "in_transit",
  "arrived",
  "delivered",
];

export interface Movement {
  id: UUID;
  company: UUID;
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
  /** Holds seal number, weighbridge ticket and loaded quantity until they become columns (BE-L4). */
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export function listMovements(query: LogisticsListQuery = {}): Promise<Paginated<Movement>> {
  return apiFetch<Paginated<Movement>>(`${BASE}/movements/`, { query });
}

export function getMovement(id: UUID): Promise<Movement> {
  return apiFetch<Movement>(`${BASE}/movements/${id}/`);
}

// --- deliveries --------------------------------------------------------------------

export type DeliveryStatus =
  "pending" | "in_transit" | "arrived" | "completed" | "variance_flagged" | "cancelled";

export const DELIVERY_STATUS_LABEL: Record<DeliveryStatus, string> = {
  pending: "Pending",
  in_transit: "In transit",
  arrived: "Arrived",
  completed: "Completed",
  variance_flagged: "Variance flagged",
  cancelled: "Cancelled",
};

export interface Delivery {
  id: UUID;
  company: UUID;
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
  status: DeliveryStatus;
  variance: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export function listDeliveries(query: LogisticsListQuery = {}): Promise<Paginated<Delivery>> {
  return apiFetch<Paginated<Delivery>>(`${BASE}/deliveries/`, { query });
}

// --- incidents ---------------------------------------------------------------------

export type IncidentStatus = "open" | "under_investigation" | "resolved" | "closed";

export const INCIDENT_STATUS_LABEL: Record<IncidentStatus, string> = {
  open: "Open",
  under_investigation: "Under investigation",
  resolved: "Resolved",
  closed: "Closed",
};

export interface Incident {
  id: UUID;
  company: UUID;
  reference: string;
  movement: UUID | null;
  movement_reference?: string | undefined;
  vehicle_registration?: string | undefined;
  driver_name?: string | undefined;
  incident_type: string;
  severity: "low" | "medium" | "high" | "critical";
  status: IncidentStatus;
  location: string;
  occurred_at: string;
  description: string;
  immediate_action: string;
  resolution: string;
  created_at: string;
  updated_at: string;
}

export function listIncidents(query: LogisticsListQuery = {}): Promise<Paginated<Incident>> {
  return apiFetch<Paginated<Incident>>(`${BASE}/incidents/`, { query });
}

// --- per-asset review (backend task BE-L1) -----------------------------------------

/**
 * The review state of one vehicle or driver. Not served yet: the backend adds
 * `review_status` (and the review endpoints) in BE-L1. Until then the field is
 * absent and the readiness page shows credential checks only.
 */
export type AssetReviewStatus =
  "draft" | "submitted" | "under_review" | "info_requested" | "eligible" | "restricted";

export const ASSET_REVIEW_LABEL: Record<AssetReviewStatus, string> = {
  draft: "Draft",
  submitted: "Submitted",
  under_review: "Under review",
  info_requested: "Information requested",
  eligible: "Eligible",
  restricted: "Restricted",
};

export type AssetReviewFields = {
  review_status?: AssetReviewStatus;
  review_reason?: string;
  reviewed_at?: string | null;
  reviewed_by_name?: string | null;
};

export type ReviewedVehicle = Vehicle & AssetReviewFields;
export type ReviewedDriver = Driver & AssetReviewFields;

export type AssetDecision = "eligible" | "restricted" | "info_requested";

export function reviewAsset(
  kind: "vehicles" | "drivers",
  id: UUID,
  input: { decision: AssetDecision; reason: string },
): Promise<ReviewedVehicle | ReviewedDriver> {
  return apiFetch(`${BASE}/${kind}/${id}/review/`, { method: "POST", body: input });
}

/** True once the backend serves per-asset review on these rows. */
export function hasAssetReview(rows: AssetReviewFields[]): boolean {
  return rows.some((r) => r.review_status !== undefined);
}

// --- hooks -------------------------------------------------------------------------

const FULL_PAGE: LogisticsListQuery = { page_size: 100 };
const STALE = 30_000;

export const operationsKeys = {
  movements: (q: LogisticsListQuery) => ["logistics", "movements", q] as const,
  movement: (id: UUID) => ["logistics", "movement", id] as const,
  deliveries: (q: LogisticsListQuery) => ["logistics", "deliveries", q] as const,
  incidents: (q: LogisticsListQuery) => ["logistics", "incidents", q] as const,
};

export function useMovements(query: LogisticsListQuery = FULL_PAGE) {
  const hasTokens = useHasTokens();
  return useQuery({
    queryKey: operationsKeys.movements(query),
    queryFn: () => listMovements(query),
    enabled: hasTokens,
    staleTime: STALE,
  });
}

export function useMovement(id: UUID | null) {
  const hasTokens = useHasTokens();
  return useQuery({
    queryKey: operationsKeys.movement(id ?? ""),
    queryFn: () => getMovement(id as UUID),
    enabled: hasTokens && Boolean(id),
  });
}

export function useDeliveries(query: LogisticsListQuery = FULL_PAGE) {
  const hasTokens = useHasTokens();
  return useQuery({
    queryKey: operationsKeys.deliveries(query),
    queryFn: () => listDeliveries(query),
    enabled: hasTokens,
    staleTime: STALE,
  });
}

export function useIncidents(query: LogisticsListQuery = FULL_PAGE) {
  const hasTokens = useHasTokens();
  return useQuery({
    queryKey: operationsKeys.incidents(query),
    queryFn: () => listIncidents(query),
    enabled: hasTokens,
    staleTime: STALE,
  });
}

export function useReviewAsset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      kind: "vehicles" | "drivers";
      id: UUID;
      decision: AssetDecision;
      reason: string;
    }) => reviewAsset(input.kind, input.id, { decision: input.decision, reason: input.reason }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["logistics"] }),
  });
}
