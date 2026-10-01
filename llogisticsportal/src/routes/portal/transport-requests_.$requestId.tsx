import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import {
  Field,
  FieldGrid,
  FormDialog,
  ResourceTable,
  errorMessage,
  fmtDateTime,
  pretty,
  type Column,
} from "@/components/beldium/ops";
import { PageHeader } from "@/components/beldium/shell";
import { Panel } from "@/components/beldium/stat-card";
import { StatusBadge } from "@/components/beldium/status-badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { listMovements, type Movement, type TransportRequest } from "@/lib/api/operations";
import {
  useAcceptTransportRequest,
  useDeclineTransportRequest,
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
  const movements = useOpsList("movements", listMovements, { request: requestId });
  const accept = useAcceptTransportRequest();
  const navigate = useNavigate();
  const [declining, setDeclining] = useState(false);
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
            <StatusBadge
              value={r.status === "cancelled" && r.blocked_reason ? "Declined" : pretty(r.status)}
              tone={r.status === "cancelled" ? "danger" : undefined}
            />
            {r.status === "new" || r.status === "blocked" ? (
              <>
                <Button variant="outline" onClick={() => setDeclining(true)}>
                  Decline
                </Button>
                <Button
                  disabled={accept.isPending}
                  onClick={() =>
                    accept.mutate(r.id, {
                      // Accepting creates the movement; take the operator straight to it.
                      onSuccess: async () => {
                        toast.success(`${r.reference} accepted`);
                        const created = await listMovements({ request: r.id });
                        const movement = created.results[0];
                        if (movement) {
                          navigate({
                            to: "/portal/movements/$movementId",
                            params: { movementId: movement.id },
                          });
                        }
                      },
                      onError: (e) => toast.error(errorMessage(e)),
                    })
                  }
                >
                  {accept.isPending ? "Accepting…" : "Accept request"}
                </Button>
              </>
            ) : null}
          </div>
        }
      />

      {(r.status === "blocked" || r.status === "cancelled") && r.blocked_reason ? (
        <div className="mb-6 rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {r.status === "cancelled" ? "Declined" : "Blocked"}: {r.blocked_reason}
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
            data={movements.data}
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
      {declining ? <DeclineDialog request={r} onClose={() => setDeclining(false)} /> : null}
    </>
  );
}

function DeclineDialog({ request, onClose }: { request: TransportRequest; onClose: () => void }) {
  const decline = useDeclineTransportRequest();
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  return (
    <FormDialog
      open
      onClose={onClose}
      title={`Decline ${request.reference}`}
      submitLabel="Decline request"
      busy={decline.isPending}
      error={error}
      onSubmit={() => {
        if (!reason.trim()) return setError("Give a reason; the requester sees it.");
        decline.mutate(
          { id: request.id, reason: reason.trim() },
          {
            onSuccess: () => {
              toast.success(`${request.reference} declined`);
              onClose();
            },
            onError: (e) => setError(errorMessage(e)),
          },
        );
      }}
    >
      <Field label="Reason">
        <Textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} />
      </Field>
    </FormDialog>
  );
}
