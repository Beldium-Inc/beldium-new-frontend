import { createFileRoute, useNavigate } from "@tanstack/react-router";

import {
  FilterSelect,
  PillTabs,
  ResourceTable,
  SearchBox,
  fmtDateTime,
  pretty,
  useListQuery,
  type Column,
} from "@/components/beldium/ops";
import { PageHeader } from "@/components/beldium/shell";
import { Panel } from "@/components/beldium/stat-card";
import { StatusBadge } from "@/components/beldium/status-badge";
import { listMovements, type Movement } from "@/lib/api/operations";
import { useOperationsDashboard, useOpsList } from "@/lib/api/operations-queries";

export const Route = createFileRoute("/portal/movements")({
  head: () => ({ meta: [{ title: "Movements - Beldium Logistics Hub" }] }),
  component: MovementsPage,
});

const STATUS_TABS = [
  { value: "", label: "All" },
  { value: "scheduled", label: "Scheduled" },
  { value: "assigned", label: "Assigned" },
  { value: "loading", label: "Loading" },
  { value: "in_transit", label: "In transit" },
  { value: "delayed", label: "Delayed" },
  { value: "arrived", label: "Arrived" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

export const movementColumns: Column<Movement>[] = [
  {
    header: "Movement",
    cell: (m) => <span className="font-medium text-primary">{m.reference}</span>,
  },
  { header: "Type", cell: (m) => m.movement_type },
  { header: "Mineral", cell: (m) => m.mineral },
  { header: "Route", cell: (m) => `${m.origin} → ${m.destination}` },
  { header: "Quantity", cell: (m) => m.quantity_display },
  {
    header: "Vehicle / driver",
    cell: (m) => `${m.vehicle_registration ?? "-"} / ${m.driver_name ?? "-"}`,
  },
  { header: "ETA", cell: (m) => fmtDateTime(m.eta_at) },
  { header: "Status", cell: (m) => <StatusBadge value={pretty(m.status)} /> },
];

function MovementsPage() {
  const navigate = useNavigate();
  const list = useListQuery();
  const filters = useOperationsDashboard().data?.filters;
  const movements = useOpsList("movements", listMovements, list.query);

  return (
    <>
      <PageHeader
        title="Movements"
        description="Every sample and bulk movement your company runs, from scheduling to delivery."
      />
      <Panel title="Movement queue">
        <div className="space-y-4">
          <PillTabs
            tabs={STATUS_TABS}
            value={list.filters["status"] ?? ""}
            onChange={(v) => list.setFilter("status", v)}
          />
          <div className="flex flex-wrap gap-2">
            <SearchBox
              value={list.search}
              onChange={list.setSearch}
              placeholder="Reference, batch, RFQ, transaction, route"
            />
            <FilterSelect
              label="Type"
              value={list.filters["movement_type"] ?? ""}
              options={filters?.movement_types ?? []}
              onChange={(v) => list.setFilter("movement_type", v)}
            />
            <FilterSelect
              label="Mineral"
              value={list.filters["mineral"] ?? ""}
              options={filters?.minerals ?? []}
              onChange={(v) => list.setFilter("mineral", v)}
            />
            <FilterSelect
              label="Miner"
              value={list.filters["miner"] ?? ""}
              options={filters?.miners ?? []}
              onChange={(v) => list.setFilter("miner", v)}
            />
            <FilterSelect
              label="Buyer"
              value={list.filters["buyer"] ?? ""}
              options={filters?.buyers ?? []}
              onChange={(v) => list.setFilter("buyer", v)}
            />
          </div>
          <ResourceTable
            columns={movementColumns}
            data={movements.data}
            isLoading={movements.isLoading}
            error={movements.error}
            page={list.page}
            onPage={list.setPage}
            onRowClick={(m) =>
              navigate({ to: "/portal/movements/$movementId", params: { movementId: m.id } })
            }
            empty="No movements match."
          />
        </div>
      </Panel>
    </>
  );
}
