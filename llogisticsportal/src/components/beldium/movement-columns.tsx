import { StatusBadge } from "./status-badge";
import { IdLink, type QCol, type QFilter } from "./ops-ui";
import { driverOf, fmt, movementStatus, partyName, siteName, txnOf, vehicleOf, type Movement, type OpsState } from "@/lib/ops-store";

export function movementColumns(s: OpsState, extra: QCol<Movement>[] = []): QCol<Movement>[] {
  return [
    { key: "id", header: "Movement", render: (m) => <IdLink kind="movement" id={m.id} />, sort: (m) => m.id },
    { key: "txn", header: "RFQ / Transaction", render: (m) => <span className="beldium-mono">{txnOf(s, m.txnId)?.rfqId} · {m.txnId}</span>, sort: (m) => m.txnId },
    { key: "batch", header: "Batch", render: (m) => <span className="beldium-mono">{m.sampleId ?? txnOf(s, m.txnId)?.batchId}</span> },
    { key: "type", header: "Type", render: (m) => m.movementType, sort: (m) => m.movementType },
    { key: "mineral", header: "Mineral", render: (m) => txnOf(s, m.txnId)?.mineral },
    { key: "qty", header: "Quantity", render: (m) => `${m.loaded ?? m.quantity} ${m.unit}`, sort: (m) => m.quantity },
    { key: "route", header: "Origin → Destination", render: (m) => `${siteName(s, m.originId)} → ${siteName(s, m.destinationId)}` },
    { key: "vehicle", header: "Vehicle", render: (m) => (m.vehicleId ? `${m.vehicleId} · ${vehicleOf(s, m.vehicleId)?.registration}` : "-"), sort: (m) => m.vehicleId ?? "" },
    { key: "driver", header: "Driver", render: (m) => driverOf(s, m.driverId)?.name ?? "-" },
    ...extra,
    { key: "eta", header: "ETA / Deadline", render: (m) => (m.stage === "In Transit" ? `${m.etaMin} min` : fmt(m.deliverBy)), sort: (m) => m.deliverBy },
    { key: "status", header: "Status", render: (m) => <StatusBadge value={movementStatus(m)} />, sort: (m) => movementStatus(m) },
  ];
}

export const movementSearch = (s: OpsState) => (m: Movement) => {
  const t = txnOf(s, m.txnId);
  return `${m.id} ${m.txnId} ${t?.rfqId} ${t?.batchId} ${m.sampleId ?? ""} ${m.vehicleId ?? ""} ${vehicleOf(s, m.vehicleId)?.registration ?? ""} ${driverOf(s, m.driverId)?.name ?? ""} ${siteName(s, m.originId)} ${siteName(s, m.destinationId)} ${t?.mineral}`;
};

export const movementFilters = (s: OpsState): QFilter<Movement>[] => [
  { label: "Movement type", get: (m) => m.movementType },
  { label: "Mineral", get: (m) => txnOf(s, m.txnId)?.mineral ?? "" },
  { label: "Buyer", get: (m) => partyName(s, txnOf(s, m.txnId)?.buyerId) },
  { label: "Vehicle", get: (m) => m.vehicleId ?? "" },
];
