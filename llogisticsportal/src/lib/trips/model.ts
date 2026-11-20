// Transport trip lifecycle shared by the independent operator workspace.
//
// Ported from the Lovable logistics prototype. The backend has no trip,
// milestone or proof-of-delivery resource for independent operators yet, so
// these rules run against browser-local records (see lib/independent/store).
// Organisation movements use the real movement API instead; `stageForMovement`
// maps those onto the same ten stages for display.

import type { MovementStatus } from "@/lib/api/operations";

export const TRIP_STAGES = [
  "Requested",
  "Accepted",
  "Scheduled",
  "Mobilized",
  "Arrived at Pickup",
  "Loaded",
  "In Transit",
  "Arrived at Destination",
  "Delivered",
  "Closed",
] as const;

export type TripStage = (typeof TRIP_STAGES)[number];
export type TripStatus = TripStage | "Exception" | "Disputed" | "Cancelled";

/** Events that are not the next stage in sequence. */
export const SIDE_EVENTS = ["Exception", "Disputed", "Correction", "Resume", "Cancelled"] as const;
export type SideEvent = (typeof SIDE_EVENTS)[number];
export type TripEvent = TripStage | SideEvent;

export interface TransportMilestone {
  id: string;
  type: string;
  at: string;
  actor: string;
  location: string;
  evidence: string;
  notes: string;
}

export interface MineralCargo {
  reference: string;
  mineral: string;
  description: string;
  quantity: number;
  unit: string;
  loadedQuantity?: number | undefined;
  weighbridge?: string | undefined;
  seal?: string | undefined;
}

export type DeliveryReviewStatus =
  "Delivery evidence submitted" | "Delivery evidence reviewed" | "Delivery accepted in demo";

export interface DeliveryRecord {
  id: string;
  at: string;
  quantity: number;
  unit: string;
  receiver: string;
  representative: string;
  arrival: string;
  condition: string;
  weighbridge: string;
  /** Proof of delivery is a filename placeholder; no file contents are kept. */
  filename: string;
  discrepancy: string;
  /** Receiving-party acknowledgment as declared by the submitter, not verified. */
  acknowledged: boolean;
  status: DeliveryReviewStatus;
}

export interface OperationalException {
  id: string;
  at: string;
  type: string;
  notes: string;
  actor: string;
}

export interface TransportAssignment {
  id: string;
  operatorId: string;
  sector: string;
  rfq: string;
  cargo: MineralCargo;
  pickupOrganization: string;
  pickup: string;
  deliveryOrganization: string;
  destination: string;
  pickupDate: string;
  service: string;
  vehicleId: string;
  vehicleLabel: string;
  driverId: string;
  status: TripStatus;
  /** The stage an exception or dispute interrupted; Resume returns to it. */
  resumeStatus?: TripStatus | undefined;
  /** Append-only. Corrections add an entry; nothing is edited or removed. */
  milestones: TransportMilestone[];
  deliveries: DeliveryRecord[];
  exceptions: OperationalException[];
}

export const isActiveTrip = (t: Pick<TransportAssignment, "status">) =>
  t.status !== "Closed" && t.status !== "Cancelled";

export function nextStage(status: TripStatus): TripStage | undefined {
  const index = TRIP_STAGES.indexOf(status as TripStage);
  return index < 0 ? undefined : TRIP_STAGES[index + 1];
}

export interface EventInput {
  type: TripEvent;
  location: string;
  notes: string;
  evidence: string;
  loaded?: number | undefined;
  weighbridge?: string | undefined;
  seal?: string | undefined;
}

export interface Actor {
  name: string;
  /** Drivers may not cancel or close; independent operators drive their own trips. */
  canClose: boolean;
}

const uid = () => crypto.randomUUID();

/** Applies one milestone or side event, or throws with the reason it is refused. */
export function applyEvent(
  t: TransportAssignment,
  input: EventInput,
  actor: Actor,
  at = new Date().toISOString(),
): TransportAssignment {
  const { type } = input;
  if (!isActiveTrip(t)) throw Error("This assignment is closed.");
  if (!input.location.trim()) throw Error("Enter the declared milestone location.");
  if (type === "Delivered") throw Error("Use the proof of delivery form.");
  if (type === "Closed") {
    if (!actor.canClose) throw Error("You cannot close this trip.");
    if (!t.deliveries.some((d) => d.status === "Delivery accepted in demo"))
      throw Error("A compliance officer must accept the delivery evidence before the trip closes.");
  }
  if (type === "Cancelled" && !actor.canClose) throw Error("You cannot cancel this trip.");
  const interrupted = t.status === "Exception" || t.status === "Disputed";
  if (type === "Resume" && !interrupted) throw Error("There is no exception to resume from.");
  if ((type === "Exception" || type === "Disputed") && interrupted)
    throw Error("Resume the trip before recording another exception.");
  if (!(SIDE_EVENTS as readonly string[]).includes(type)) {
    if (interrupted) throw Error("Resume the recorded stage before continuing.");
    if (nextStage(t.status) !== type) throw Error("Record the next milestone in sequence.");
  }
  if ((type === "Exception" || type === "Disputed" || type === "Correction") && !input.notes.trim())
    throw Error("Enter exception or correction notes.");
  if (type === "Loaded" && !(Number.isFinite(input.loaded) && Number(input.loaded) > 0))
    throw Error("Enter a positive loaded quantity.");

  const status: TripStatus =
    type === "Correction" ? t.status : type === "Resume" ? (t.resumeStatus ?? "Requested") : type;
  const isException = type === "Exception" || type === "Disputed";
  return {
    ...t,
    status,
    resumeStatus: isException ? t.status : type === "Resume" ? undefined : t.resumeStatus,
    cargo:
      type === "Loaded"
        ? {
            ...t.cargo,
            loadedQuantity: input.loaded,
            weighbridge: input.weighbridge,
            seal: input.seal,
          }
        : t.cargo,
    milestones: [
      ...t.milestones,
      {
        id: uid(),
        type,
        at,
        actor: actor.name,
        location: input.location,
        evidence: input.evidence,
        notes: input.notes,
      },
    ],
    exceptions: isException
      ? [...t.exceptions, { id: uid(), at, type, notes: input.notes, actor: actor.name }]
      : t.exceptions,
  };
}

export type DeliveryInput = Omit<DeliveryRecord, "id" | "at" | "status" | "unit">;

/** Records proof of delivery. Transport completion is not recipient verification. */
export function applyDelivery(
  t: TransportAssignment,
  d: DeliveryInput,
  actor: Actor,
  at = new Date().toISOString(),
): TransportAssignment {
  if (t.status !== "Arrived at Destination") throw Error("Record destination arrival first.");
  if (!d.filename.trim() || !d.receiver.trim() || !d.representative.trim() || !d.arrival)
    throw Error("Complete the receiving party, arrival time and proof-of-delivery filename.");
  if (!(d.quantity > 0)) throw Error("Enter the delivered quantity.");
  if (!d.acknowledged) throw Error("Declare the receiving party's acknowledgment.");
  const expected = t.cargo.loadedQuantity ?? t.cargo.quantity;
  if (d.quantity !== expected && !d.discrepancy.trim())
    throw Error("Declare the quantity discrepancy.");
  return {
    ...t,
    status: "Delivered",
    deliveries: [
      ...t.deliveries,
      { ...d, unit: t.cargo.unit, id: uid(), at, status: "Delivery evidence submitted" },
    ],
    milestones: [
      ...t.milestones,
      {
        id: uid(),
        type: "Delivered",
        at,
        actor: actor.name,
        location: t.destination,
        evidence: d.filename,
        notes:
          `Transport completed; recipient verification is not implied. ${d.discrepancy}`.trim(),
      },
    ],
  };
}

/**
 * Where an organisation movement sits on the ten-stage lifecycle. The movement
 * API has no Mobilized, Arrived at Pickup or Closed status, so those stages are
 * inferred and marked as such.
 */
export function stageForMovement(
  status: MovementStatus,
  deliveryCompleted: boolean,
): { stage: TripStatus; inferred: boolean } {
  switch (status) {
    case "scheduled":
      return { stage: "Scheduled", inferred: false };
    case "assigned":
      return { stage: "Mobilized", inferred: true };
    case "loading":
      return { stage: "Loaded", inferred: false };
    case "in_transit":
      return { stage: "In Transit", inferred: false };
    case "delayed":
      return { stage: "Exception", inferred: false };
    case "arrived":
      return { stage: "Arrived at Destination", inferred: false };
    case "delivered":
      return deliveryCompleted
        ? { stage: "Closed", inferred: true }
        : { stage: "Delivered", inferred: false };
    case "cancelled":
      return { stage: "Cancelled", inferred: false };
  }
}
