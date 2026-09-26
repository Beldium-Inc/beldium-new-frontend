import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { PageHeader } from "@/components/beldium/shell";
import { Panel } from "@/components/beldium/stat-card";
import { StageActionButton } from "@/components/beldium/ops-dialogs";
import { QueueView, tabSearch } from "@/components/beldium/ops-ui";
import { movementColumns, movementFilters, movementSearch } from "@/components/beldium/movement-columns";
import { useOps, type Movement } from "@/lib/ops-store";

export const Route = createFileRoute("/_ops/active-movements")({
  validateSearch: tabSearch,
  head: () => ({
    meta: [
      { title: "Active Movements | Beldium Logistics" },
      { name: "description", content: "Every Beldium movement by stage with vehicle, driver, route, ETA and linked transaction." },
      { property: "og:title", content: "Active Movements | Beldium Logistics" },
      { property: "og:description", content: "Where every sample and bulk mineral load is right now." },
    ],
  }),
  component: Page,
});

function Page() {
  const s = useOps();
  const { tab } = Route.useSearch();
  const navigate = useNavigate();
  const is = (...st: string[]) => (m: Movement) => st.includes(m.stage) && !m.exception;
  return (
    <>
      <PageHeader title="Active Movements" />
      <Panel title="Movement Queue">
        <QueueView
          rows={s.movements}
          columns={movementColumns(s)}
          getKey={(m) => m.id}
          initialTab={tab ?? "Active"}
          tabs={[
            { label: "Active", test: (m) => m.stage !== "Completed" },
            { label: "Awaiting Assignment", test: is("Awaiting Assignment") },
            { label: "Scheduled", test: is("Scheduled") },
            { label: "At Origin", test: is("Driver En Route", "At Origin", "Loading", "Loaded", "Collected") },
            { label: "In Transit", test: is("In Transit") },
            { label: "At Destination", test: is("At Destination", "Unloading", "Delivered") },
            { label: "Exceptions", test: (m) => m.stage !== "Completed" && (m.exception || m.delayed || m.deviated) },
            { label: "Completed", test: (m) => m.stage === "Completed" },
          ]}
          searchText={movementSearch(s)}
          filters={movementFilters(s)}
          onOpen={(m) => navigate({ to: "/movements/$movementId", params: { movementId: m.id } })}
          actions={(m) => <StageActionButton movement={m} size="sm" />}
        />
      </Panel>
    </>
  );
}
