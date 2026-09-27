import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { PageHeader } from "@/components/beldium/shell";
import { Panel } from "@/components/beldium/stat-card";
import { RowAction } from "@/components/beldium/data-table";
import { StatusBadge } from "@/components/beldium/status-badge";
import { QueueView, IdLink, tabSearch, type QCol } from "@/components/beldium/ops-ui";
import { acceptRequest, fmt, partyName, requestStatus, siteName, txnOf, useOps, type TransportRequest } from "@/lib/ops-store";

export const Route = createFileRoute("/portal/transport-requests")({
  validateSearch: tabSearch,
  head: () => ({
    meta: [
      { title: "Transport Requests - Beldium Logistics Hub" },
      { name: "description", content: "Transport request queue: new, awaiting decision, accepted, scheduled, active, completed and declined jobs." },
      { property: "og:title", content: "Transport Requests - Beldium Logistics Hub" },
      { property: "og:description", content: "Accept, assign and schedule every inbound Beldium transport request." },
    ],
  }),
  component: Page,
});

const tabs = ["New", "Awaiting Decision", "Accepted", "Scheduled", "Active", "Completed", "Declined"] as const;

function Page() {
  const s = useOps();
  const { tab } = Route.useSearch();
  const navigate = useNavigate();
  const cols: QCol<TransportRequest>[] = [
    { key: "id", header: "Request", render: (r) => <IdLink kind="request" id={r.id} />, sort: (r) => r.id },
    { key: "txn", header: "RFQ / Transaction", render: (r) => <span className="beldium-mono">{txnOf(s, r.txnId)?.rfqId} · {r.txnId}</span>, sort: (r) => r.txnId },
    { key: "type", header: "Movement type", render: (r) => r.movementType, sort: (r) => r.movementType },
    { key: "src", header: "Source", render: (r) => r.source },
    { key: "miner", header: "Miner", render: (r) => partyName(s, txnOf(s, r.txnId)?.minerId) },
    { key: "mat", header: "Material / Batch", render: (r) => `${txnOf(s, r.txnId)?.mineral} · ${txnOf(s, r.txnId)?.batchId}` },
    { key: "qty", header: "Quantity", render: (r) => `${r.quantity} ${r.unit}`, sort: (r) => r.quantity },
    { key: "route", header: "Pickup → Destination", render: (r) => `${siteName(s, r.originId)} → ${siteName(s, r.destinationId)}` },
    { key: "pickup", header: "Pickup by", render: (r) => fmt(r.pickupBy), sort: (r) => r.pickupBy },
    { key: "deadline", header: "Delivery deadline", render: (r) => fmt(r.deliverBy), sort: (r) => r.deliverBy },
    { key: "quality", header: "Quality", render: (r) => <StatusBadge value={txnOf(s, r.txnId)?.quality ?? "-"} /> },
    { key: "status", header: "Status", render: (r) => <StatusBadge value={requestStatus(s, r)} />, sort: (r) => requestStatus(s, r) },
  ];
  const open = (r: TransportRequest) => navigate({ to: "/portal/transport-requests/$requestId", params: { requestId: r.id } });
  return (
    <>
      <PageHeader title="Transport Requests" />
      <Panel title="Request Queue">
        <QueueView
          rows={s.requests}
          columns={cols}
          getKey={(r) => r.id}
          tabs={[{ label: "All", test: () => true }, ...tabs.map((t) => ({ label: t, test: (r: TransportRequest) => requestStatus(s, r) === t }))]}
          initialTab={tab ?? "All"}
          searchText={(r) => `${r.id} ${r.txnId} ${txnOf(s, r.txnId)?.rfqId} ${txnOf(s, r.txnId)?.batchId} ${r.requestedBy} ${siteName(s, r.originId)} ${siteName(s, r.destinationId)}`}
          filters={[
            { label: "Movement type", get: (r) => r.movementType },
            { label: "Source", get: (r) => r.source },
            { label: "Mineral", get: (r) => txnOf(s, r.txnId)?.mineral ?? "" },
          ]}
          onOpen={open}
          actions={(r) =>
            r.status === "New" || r.status === "Awaiting Decision" ? (
              <>
                <RowAction onClick={() => open(r)}>View</RowAction>
                <RowAction
                  onClick={() => {
                    const id = acceptRequest(r.id);
                    toast.success(`${r.id} accepted: ${id} created`);
                  }}
                >
                  Accept
                </RowAction>
              </>
            ) : (
              <RowAction onClick={() => open(r)}>View</RowAction>
            )
          }
        />
      </Panel>
    </>
  );
}
