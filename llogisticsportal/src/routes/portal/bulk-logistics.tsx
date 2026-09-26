import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { PageHeader } from "@/components/beldium/shell";
import { Panel } from "@/components/beldium/stat-card";
import { StageActionButton } from "@/components/beldium/ops-dialogs";
import { QueueView, tabSearch } from "@/components/beldium/ops-ui";
import { movementColumns, movementFilters, movementSearch } from "@/components/beldium/movement-columns";
import { useOps, type Movement } from "@/lib/ops-store";

export const Route = createFileRoute("/portal/bulk-logistics")({
  validateSearch: tabSearch,
  head: () => ({
    meta: [
      { title: "Bulk Mineral Logistics - Beldium Logistics Hub" },
      { name: "description", content: "Bulk mineral haulage queues from pickup through loading, transit, weighbridge and proof of delivery." },
      { property: "og:title", content: "Bulk Mineral Logistics - Beldium Logistics Hub" },
      { property: "og:description", content: "Every bulk load from mine to warehouse, processor and port." },
    ],
  }),
  component: Page,
});

function Page() {
  const s = useOps();
  const { tab } = Route.useSearch();
  const navigate = useNavigate();
  const rows = s.movements.filter((m) => m.kind === "Bulk");
  const is = (...st: string[]) => (m: Movement) => st.includes(m.stage) && !m.exception;
  return (
    <>
      <PageHeader title="Bulk Logistics" />
      <Panel title="Bulk Queue">
        <QueueView
          rows={rows}
          columns={movementColumns(s, [{ key: "wb", header: "Weighbridge", render: (m) => (m.received ? `${m.received} t` : "-") }])}
          getKey={(m) => m.id}
          initialTab={tab ?? "Awaiting Pickup"}
          tabs={[
            { label: "Awaiting Pickup", test: is("Awaiting Assignment") },
            { label: "Scheduled", test: is("Scheduled") },
            { label: "Driver En Route", test: is("Driver En Route") },
            { label: "At Origin", test: is("At Origin") },
            { label: "Loading", test: is("Loading", "Loaded") },
            { label: "In Transit", test: is("In Transit") },
            { label: "At Destination", test: is("At Destination") },
            { label: "Unloading", test: is("Unloading") },
            { label: "Delivered", test: is("Delivered", "Completed") },
            { label: "Exceptions", test: (m) => m.stage !== "Completed" && (m.exception || m.delayed || m.deviated) },
          ]}
          searchText={movementSearch(s)}
          filters={movementFilters(s)}
          onOpen={(m) => navigate({ to: "/portal/movements/$movementId", params: { movementId: m.id } })}
          actions={(m) => <StageActionButton movement={m} size="sm" />}
        />
      </Panel>
    </>
  );
}
