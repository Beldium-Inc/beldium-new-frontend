import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";

import {
  PillTabs,
  ResourceTable,
  fmtDateTime,
  pretty,
  type Column,
} from "@/components/beldium/ops";
import { PageHeader } from "@/components/beldium/shell";
import { Panel } from "@/components/beldium/stat-card";
import { StatusBadge } from "@/components/beldium/status-badge";
import { listMovements, type Movement } from "@/lib/api/operations";
import { useOpsList } from "@/lib/api/operations-queries";

export const Route = createFileRoute("/portal/tracking")({
  head: () => ({ meta: [{ title: "Tracking - Beldium Logistics Hub" }] }),
  component: TrackingPage,
});

const STALE_MINUTES = 30;

function freshness(m: Movement) {
  if (!m.last_gps_at) return { label: "No position", tone: "danger" as const };
  const minutes = (Date.now() - new Date(m.last_gps_at).getTime()) / 60_000;
  return minutes > STALE_MINUTES
    ? { label: "Stale", tone: "warning" as const }
    : { label: "Live", tone: "success" as const };
}

const columns: Column<Movement>[] = [
  {
    header: "Movement",
    cell: (m) => (
      <Link
        to="/portal/movements/$movementId"
        params={{ movementId: m.id }}
        className="font-medium text-primary hover:underline"
      >
        {m.reference}
      </Link>
    ),
  },
  { header: "Vehicle", cell: (m) => m.vehicle_registration ?? "-" },
  { header: "Route", cell: (m) => `${m.origin} → ${m.destination}` },
  { header: "Status", cell: (m) => <StatusBadge value={pretty(m.status)} /> },
  {
    header: "Last position",
    cell: (m) =>
      m.last_latitude && m.last_longitude ? (
        <a
          href={`https://www.openstreetmap.org/?mlat=${m.last_latitude}&mlon=${m.last_longitude}#map=12/${m.last_latitude}/${m.last_longitude}`}
          target="_blank"
          rel="noreferrer"
          className="text-primary hover:underline"
        >
          {Number(m.last_latitude).toFixed(4)}, {Number(m.last_longitude).toFixed(4)}
        </a>
      ) : (
        "-"
      ),
  },
  { header: "Reported", cell: (m) => fmtDateTime(m.last_gps_at) },
  {
    header: "Signal",
    cell: (m) => <StatusBadge value={freshness(m).label} tone={freshness(m).tone} />,
  },
  { header: "ETA", cell: (m) => fmtDateTime(m.eta_at) },
];

function TrackingPage() {
  const [status, setStatus] = useState("in_transit");
  const movements = useOpsList(
    "movements",
    listMovements,
    { status, page_size: 100 },
    { refetchInterval: 20_000 },
  );

  return (
    <>
      <PageHeader
        title="Tracking"
        description={`Last reported position of every vehicle on the road. Refreshes every 20 seconds; positions older than ${STALE_MINUTES} minutes are flagged stale.`}
      />
      <Panel title="Vehicles on the road">
        <div className="space-y-4">
          <PillTabs
            tabs={[
              { value: "in_transit", label: "In transit" },
              { value: "delayed", label: "Delayed" },
              { value: "loading", label: "Loading" },
              { value: "assigned", label: "Assigned" },
            ]}
            value={status}
            onChange={setStatus}
          />
          <ResourceTable
            columns={columns}
            data={movements.data}
            isLoading={movements.isLoading}
            error={movements.error}
            empty="No movements in this state."
          />
        </div>
      </Panel>
    </>
  );
}
