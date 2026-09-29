import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

import {
  FieldGrid,
  ResourceTable,
  errorMessage,
  fmtDateTime,
  pretty,
  type Column,
  withResults,
} from "@/components/beldium/ops";
import { PageHeader } from "@/components/beldium/shell";
import { Panel } from "@/components/beldium/stat-card";
import { StatusBadge } from "@/components/beldium/status-badge";
import { Button } from "@/components/ui/button";
import { listMovements, type Movement } from "@/lib/api/operations";
import {
  useAcceptTransportRequest,
  useOpsList,
  useTransportRequest,
} from "@/lib/api/operations-queries";

export const Route = createFileRoute("/portal/transport-requests_/$requestId")({
  head: () => ({ meta: [{ title: "Transport Request - Beldium Logistics Hub" }] }),
  component: TransportRequestPage,
});

const movementColumns: Column<Movement>[] = [
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
  { header: "Driver", cell: (m) => m.driver_name ?? "-" },
  { header: "Pickup", cell: (m) => fmtDateTime(m.pickup_at) },
  { header: "Status", cell: (m) => <StatusBadge value={pretty(m.status)} /> },
];

function TransportRequestPage() {
  const { requestId } = Route.useParams();
  const request = useTransportRequest(requestId);
  // The movements endpoint can't filter by request yet, so match on the page.
  const movements = useOpsList(
    "movements",
    listMovements,
    { page_size: 100, search: request.data?.transaction_id || undefined },
    { enabled: Boolean(request.data) },
  );
  const linked = movements.data
    ? withResults(
        movements.data,
        movements.data.results.filter((m) => m.request === requestId),
      )
    : undefined;
  const accept = useAcceptTransportRequest();
  const r = request.data;

  if (request.isLoading) return <p className="text-sm text-muted-foreground">Loading request…</p>;
  if (request.error || !r)
    return (
      <p className="text-sm text-destructive">
        {errorMessage(request.error, "Could not load this request.")}
      </p>
    );

  return (
    <>
      <Link
        to="/portal/transport-requests"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Transport requests
      </Link>
      <PageHeader
        title={`${r.reference} · ${r.movement_type}`}
        description={`${r.origin} → ${r.destination}`}
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge value={pretty(r.status)} />
            {r.status === "new" ? (
              <Button
                disabled={accept.isPending}
                onClick={() =>
                  accept.mutate(r.id, {
                    onSuccess: () => toast.success(`${r.reference} accepted`),
                    onError: (e) => toast.error(errorMessage(e)),
                  })
                }
              >
                {accept.isPending ? "Accepting…" : "Accept request"}
              </Button>
            ) : null}
          </div>
        }
      />

      {r.status === "blocked" && r.blocked_reason ? (
        <div className="mb-6 rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          Blocked: {r.blocked_reason}
        </div>
      ) : null}

      <div className="space-y-4">
        <Panel title="Request">
          <FieldGrid
            items={[
              ["Requester", r.requester],
              ["Miner", r.miner],
              ["Buyer", r.buyer],
              ["Mineral", r.mineral],
              ["Quantity", r.quantity_display],
              ["Required pickup", fmtDateTime(r.required_pickup_at)],
              ["RFQ", r.rfq_id],
              ["Transaction", r.transaction_id],
              ["Received", fmtDateTime(r.created_at)],
            ]}
          />
        </Panel>
        <Panel title="Movements for this request">
          <ResourceTable
            columns={movementColumns}
            data={linked}
            isLoading={movements.isLoading}
            error={movements.error}
            empty={
              r.status === "new"
                ? "Accept the request to schedule a movement."
                : "No movement has been created for this request yet."
            }
          />
        </Panel>
      </div>
    </>
  );
}
