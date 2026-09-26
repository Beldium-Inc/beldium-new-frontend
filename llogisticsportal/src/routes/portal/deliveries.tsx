import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { PageHeader } from "@/components/beldium/shell";
import { Panel } from "@/components/beldium/stat-card";
import { StageActionButton } from "@/components/beldium/ops-dialogs";
import { QueueView, tabSearch } from "@/components/beldium/ops-ui";
import { movementColumns, movementFilters, movementSearch } from "@/components/beldium/movement-columns";
import { fmt, site, useOps, type Movement } from "@/lib/ops-store";

export const Route = createFileRoute("/portal/deliveries")({
  validateSearch: tabSearch,
  head: () => ({
    meta: [
      { title: "Deliveries - Beldium Logistics Hub" },
      { name: "description", content: "Arrivals, weighbridge quantities, handovers, proof of delivery and completed deliveries." },
      { property: "og:title", content: "Deliveries - Beldium Logistics Hub" },
      { property: "og:description", content: "Destination confirmations across warehouses, processors, laboratories and ports." },
    ],
  }),
  component: Page,
});

function Page() {
  const s = useOps();
  const { tab } = Route.useSearch();
  const navigate = useNavigate();
  const rows = s.movements.filter((m) => ["In Transit", "At Destination", "Unloading", "Delivered", "Completed"].includes(m.stage));
  const is = (...st: string[]) => (m: Movement) => st.includes(m.stage);
  return (
    <>
      <PageHeader title="Deliveries" />
      <Panel title="Delivery Queue">
        <QueueView
          rows={rows}
          getKey={(m) => m.id}
          initialTab={tab ?? "Awaiting Confirmation"}
          tabs={[
            { label: "Arriving", test: is("In Transit") },
            { label: "Awaiting Confirmation", test: is("At Destination", "Unloading", "Delivered") },
            { label: "Completed", test: is("Completed") },
          ]}
          columns={movementColumns(s, [
            { key: "dk", header: "Destination type", render: (m) => site(s, m.destinationId)?.kind },
            { key: "rec", header: "Received", render: (m) => (m.received ? `${m.received} ${m.unit}` : "-") },
            { key: "var", header: "Variance", render: (m) => (m.received && m.loaded ? `${(m.loaded - m.received).toFixed(2)} ${m.unit}` : "-") },
            { key: "pod", header: "POD", render: (m) => m.podId ?? "-" },
            { key: "done", header: "Completed", render: (m) => fmt(m.completedAt), sort: (m) => m.completedAt ?? "" },
          ])}
          searchText={movementSearch(s)}
          filters={[...movementFilters(s), { label: "Destination type", get: (m) => site(s, m.destinationId)?.kind ?? "" }]}
          onOpen={(m) => navigate({ to: "/portal/movements/$movementId", params: { movementId: m.id } })}
          actions={(m) => <StageActionButton movement={m} size="sm" />}
        />
      </Panel>
    </>
  );
}
