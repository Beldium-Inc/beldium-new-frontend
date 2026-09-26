import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/beldium/shell";
import { Panel } from "@/components/beldium/stat-card";
import { FieldGrid } from "@/components/beldium/data-table";
import { StatusBadge } from "@/components/beldium/status-badge";
import { AssignmentWizard } from "@/components/beldium/ops-dialogs";
import { Btn, FormField, IdLink, Modal, fieldCls } from "@/components/beldium/ops-ui";
import {
  acceptRequest,
  declineRequest,
  driverOf,
  fmt,
  movementOf,
  partyName,
  qualityGate,
  requestStatus,
  runAction,
  siteName,
  txnOf,
  useOps,
  vehicleOf,
  viewRequest,
} from "@/lib/ops-store";

export const Route = createFileRoute("/_ops/transport-requests_/$requestId")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.requestId} | Transport Request | Beldium Logistics` },
      { name: "description", content: `Transport request ${params.requestId}: route, cargo, linked transaction and decision.` },
      { property: "og:title", content: `${params.requestId} | Beldium Logistics` },
      { property: "og:description", content: "Transport request detail and assignment." },
    ],
  }),
  component: RequestDetail,
});

function RequestDetail() {
  const { requestId } = Route.useParams();
  const s = useOps();
  const navigate = useNavigate();
  const r = s.requests.find((x) => x.id === requestId);
  const [decline, setDecline] = useState(false);
  const [reason, setReason] = useState("");
  const [wizard, setWizard] = useState(false);
  useEffect(() => {
    if (r?.status === "New") viewRequest(r.id);
  }, [r?.id, r?.status]);

  if (!r) {
    return (
      <Panel title="Request not found">
        <Link to="/transport-requests" className="text-sm font-semibold text-colorLink">
          Back to Transport Requests
        </Link>
      </Panel>
    );
  }
  const t = txnOf(s, r.txnId);
  const m = movementOf(s, r.movementId);
  const status = requestStatus(s, r);
  const pending = r.status === "New" || r.status === "Awaiting Decision";
  const gate = m ? qualityGate(s, m) : null;

  return (
    <>
      <PageHeader title={`Transport Request ${r.id}`}>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge value={status} />
          {pending ? (
            <>
              <Btn variant="outline" onClick={() => setDecline(true)}>
                Decline
              </Btn>
              <Btn
                onClick={() => {
                  const id = acceptRequest(r.id);
                  toast.success(`Accepted — ${id} created`);
                  setWizard(true);
                }}
              >
                Accept
              </Btn>
            </>
          ) : null}
          {m && m.stage === "Awaiting Assignment" ? (
            <>
              <Btn variant="outline" onClick={() => setWizard(true)}>
                Assign Vehicle
              </Btn>
              <Btn variant="outline" onClick={() => setWizard(true)}>
                Assign Driver
              </Btn>
              <Btn onClick={() => setWizard(true)}>Schedule Pickup</Btn>
            </>
          ) : null}
          {m && m.stage === "Scheduled" ? (
            <Btn
              onClick={() => {
                runAction(m.id, "dispatch");
                toast.success(`${m.id} started — driver dispatched`);
                navigate({ to: "/movements/$movementId", params: { movementId: m.id } });
              }}
            >
              Start Movement
            </Btn>
          ) : null}
          {m && m.stage !== "Awaiting Assignment" && m.stage !== "Scheduled" ? (
            <Link to="/movements/$movementId" params={{ movementId: m.id }}>
              <Btn>Open Movement</Btn>
            </Link>
          ) : null}
        </div>
      </PageHeader>

      <div className="space-y-5">
        <Panel title="Request">
          <FieldGrid
            items={[
              { label: "Request ID", value: r.id },
              { label: "RFQ ID", value: t?.rfqId },
              { label: "Transaction ID", value: <IdLink kind="transaction" id={r.txnId} /> },
              { label: "Movement type", value: r.movementType },
              { label: "Source", value: r.source },
              { label: "Requesting organisation", value: r.requestedBy },
              { label: "Miner", value: partyName(s, t?.minerId) },
              { label: "Mining site", value: siteName(s, t?.mineId) },
              { label: "Buyer", value: partyName(s, t?.buyerId) },
              { label: "Material", value: t?.mineral },
              { label: "Batch ID", value: t?.batchId },
              { label: "Quantity", value: `${r.quantity} ${r.unit}` },
              { label: "Pickup location", value: siteName(s, r.originId) },
              { label: "Destination", value: siteName(s, r.destinationId) },
              { label: "Required pickup", value: fmt(r.pickupBy) },
              { label: "Delivery deadline", value: fmt(r.deliverBy) },
              { label: "Special handling", value: r.handling },
              { label: "Quality status", value: <StatusBadge value={t?.quality ?? "-"} /> },
              { label: "Compliance status", value: <StatusBadge value={gate ? "Pickup blocked" : "Cleared"} /> },
              { label: "Payment terms", value: r.paymentTerms },
              { label: "Received", value: fmt(r.createdAt) },
              ...(r.declineReason ? [{ label: "Decline reason", value: r.declineReason }] : []),
            ]}
          />
        </Panel>

        {m ? (
          <Panel title="Movement">
            <FieldGrid
              items={[
                { label: "Movement", value: <IdLink kind="movement" id={m.id} /> },
                { label: "Stage", value: <StatusBadge value={m.stage} /> },
                { label: "Vehicle", value: m.vehicleId ? `${m.vehicleId} · ${vehicleOf(s, m.vehicleId)?.registration}` : "-" },
                { label: "Driver", value: driverOf(s, m.driverId)?.name ?? "-" },
                { label: "Pickup scheduled", value: fmt(m.pickupAt) },
              ]}
            />
          </Panel>
        ) : null}
      </div>

      {m && wizard ? <AssignmentWizard movement={m} open={wizard} onClose={() => setWizard(false)} /> : null}
      <Modal
        open={decline}
        onClose={() => setDecline(false)}
        title={`Decline ${r.id}`}
        footer={
          <>
            <Btn variant="outline" onClick={() => setDecline(false)}>
              Cancel
            </Btn>
            <Btn
              variant="danger"
              disabled={!reason.trim()}
              onClick={() => {
                declineRequest(r.id, reason.trim());
                setDecline(false);
                toast.success(`${r.id} declined`);
              }}
            >
              Decline Request
            </Btn>
          </>
        }
      >
        <FormField label="Reason">
          <select value={reason} onChange={(e) => setReason(e.target.value)} className={fieldCls}>
            <option value="">Select reason</option>
            <option>No eligible vehicle in required window</option>
            <option>Route outside operating coverage</option>
            <option>Cargo type not supported</option>
            <option>Security conditions on route</option>
          </select>
        </FormField>
      </Modal>
    </>
  );
}
