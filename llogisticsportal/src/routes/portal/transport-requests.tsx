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
import { listTransportRequests, type TransportRequest } from "@/lib/api/operations";
import { useOperationsDashboard, useOpsList } from "@/lib/api/operations-queries";

export const Route = createFileRoute("/portal/transport-requests")({
  head: () => ({ meta: [{ title: "Transport Requests - Beldium Logistics Hub" }] }),
  component: TransportRequestsPage,
});

const STATUS_TABS = [
  { value: "", label: "All" },
  { value: "new", label: "New" },
  { value: "accepted", label: "Accepted" },
  { value: "assigned", label: "Assigned" },
  { value: "blocked", label: "Blocked" },
  { value: "cancelled", label: "Cancelled" },
];

const columns: Column<TransportRequest>[] = [
  {
    header: "Request",
    cell: (r) => <span className="font-medium text-primary">{r.reference}</span>,
  },
  { header: "Type", cell: (r) => r.movement_type },
  { header: "Mineral", cell: (r) => r.mineral || "-" },
  { header: "Route", cell: (r) => `${r.origin} → ${r.destination}` },
  { header: "Quantity", cell: (r) => r.quantity_display },
  { header: "Requester", cell: (r) => r.requester },
  { header: "Pickup by", cell: (r) => fmtDateTime(r.required_pickup_at) },
  { header: "Status", cell: (r) => <StatusBadge value={pretty(r.status)} /> },
];

function TransportRequestsPage() {
  const navigate = useNavigate();
  const list = useListQuery({ status: "new" });
  const filters = useOperationsDashboard().data?.filters;
  const requests = useOpsList("transport-requests", listTransportRequests, list.query);

  return (
    <>
      <PageHeader
        title="Transport Requests"
        description="Requests from miners, buyers and other sectors to move samples and minerals. Accept a request to take the job on."
      />
      <Panel title="Request queue">
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
              placeholder="Reference, RFQ, transaction, route"
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
          </div>
          <ResourceTable
            columns={columns}
            data={requests.data}
            isLoading={requests.isLoading}
            error={requests.error}
            page={list.page}
            onPage={list.setPage}
            onRowClick={(r) =>
              navigate({ to: "/portal/transport-requests/$requestId", params: { requestId: r.id } })
            }
            empty="No transport requests match."
          />
        </div>
      </Panel>
    </>
  );
}
