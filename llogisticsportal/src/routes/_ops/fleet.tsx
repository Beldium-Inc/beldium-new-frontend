import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { PageHeader } from "@/components/beldium/shell";
import { Panel } from "@/components/beldium/stat-card";
import { StatusBadge } from "@/components/beldium/status-badge";
import { IdLink, QueueView, tabSearch } from "@/components/beldium/ops-ui";
import { fmtDate, movementOf, siteName, useOps, vehicleAvailability, vehicleBlock, type Vehicle } from "@/lib/ops-store";

export const Route = createFileRoute("/_ops/fleet")({
  validateSearch: tabSearch,
  head: () => ({
    meta: [
      { title: "Fleet | Beldium Logistics" },
      { name: "description", content: "Fleet queues: available, assigned, in transit, maintenance and compliance hold." },
      { property: "og:title", content: "Fleet | Beldium Logistics" },
      { property: "og:description", content: "Vehicle readiness for Beldium movement assignment." },
    ],
  }),
  component: Page,
});

function Page() {
  const s = useOps();
  const { tab } = Route.useSearch();
  const navigate = useNavigate();
  const av = (v: Vehicle) => vehicleAvailability(v, s);
  return (
    <>
      <PageHeader title="Fleet" />
      <Panel title="Fleet Queue">
        <QueueView
          rows={s.vehicles}
          getKey={(v) => v.id}
          initialTab={tab ?? "Available"}
          tabs={["All", "Available", "Assigned", "In Transit", "Maintenance", "Compliance Hold"].map((l) => ({ label: l, test: (v: Vehicle) => l === "All" || av(v) === l }))}
          columns={[
            { key: "id", header: "Vehicle", render: (v) => <IdLink kind="vehicle" id={v.id} />, sort: (v) => v.id },
            { key: "reg", header: "Registration", render: (v) => v.registration, sort: (v) => v.registration },
            { key: "type", header: "Type", render: (v) => v.type },
            { key: "cap", header: "Capacity", render: (v) => `${v.capacity} t`, sort: (v) => v.capacity },
            { key: "job", header: "Current job", render: (v) => (v.movementId ? <IdLink kind="movement" id={v.movementId} /> : "-") },
            { key: "loc", header: "Location", render: (v) => { const m = movementOf(s, v.movementId); return m ? (m.stage === "In Transit" ? `En route to ${siteName(s, m.destinationId)}` : siteName(s, ["At Destination", "Unloading", "Delivered"].includes(m.stage) ? m.destinationId : m.originId)) : "Depot"; } },
            { key: "comp", header: "Compliance", render: (v) => <StatusBadge value={vehicleBlock(s, v) ? "Restricted" : "Cleared"} /> },
            { key: "reason", header: "Restriction", render: (v) => vehicleBlock(s, v) ?? "-" },
            { key: "tracker", header: "Tracker", render: (v) => <StatusBadge value={v.tracker} /> },
            { key: "svc", header: "Next service", render: (v) => fmtDate(v.nextService), sort: (v) => v.nextService },
            { key: "av", header: "Availability", render: (v) => <StatusBadge value={av(v)} />, sort: av },
          ]}
          searchText={(v) => `${v.id} ${v.registration} ${v.make} ${v.type}`}
          filters={[{ label: "Type", get: (v) => v.type }]}
          onOpen={(v) => navigate({ to: "/vehicles/$vehicleId", params: { vehicleId: v.id } })}
        />
      </Panel>
    </>
  );
}
