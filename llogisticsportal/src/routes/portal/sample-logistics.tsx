import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { PageHeader } from "@/components/beldium/shell";
import { Panel } from "@/components/beldium/stat-card";
import { StatusBadge } from "@/components/beldium/status-badge";
import { RowAction } from "@/components/beldium/data-table";
import { StageActionButton } from "@/components/beldium/ops-dialogs";
import { IdLink, QueueView, tabSearch } from "@/components/beldium/ops-ui";
import { movementColumns, movementSearch } from "@/components/beldium/movement-columns";
import { acceptRequest, fmt, movementStatus, siteName, txnOf, useOps, type Movement, type TransportRequest } from "@/lib/ops-store";

export const Route = createFileRoute("/portal/sample-logistics")({
  validateSearch: tabSearch,
  head: () => ({
    meta: [
      { title: "Sample Logistics - Beldium Logistics Hub" },
      { name: "description", content: "Sample pickup queue with chain of custody from mine to laboratory receipt." },
      { property: "og:title", content: "Sample Logistics - Beldium Logistics Hub" },
      { property: "og:description", content: "Mine-to-laboratory sample custody for Beldium Quality & Control." },
    ],
  }),
  component: Page,
});

type Row = { key: string; req?: TransportRequest; mov?: Movement };

function Page() {
  const s = useOps();
  const { tab } = Route.useSearch();
  const navigate = useNavigate();
  const rows: Row[] = [
    ...s.requests.filter((r) => r.kind === "Sample" && (r.status === "New" || r.status === "Awaiting Decision")).map((r) => ({ key: r.id, req: r })),
    ...s.movements.filter((m) => m.kind === "Sample").map((m) => ({ key: m.id, mov: m })),
  ];
  const stage = (r: Row) => (r.req ? "Requested" : r.mov!.stage);
  const is = (...st: string[]) => (r: Row) => st.includes(stage(r));
  const base = movementColumns(s, [{ key: "custody", header: "Custody", render: (m) => m.custodyId ?? "-" }]);

  return (
    <>
      <PageHeader title="Sample Logistics" />
      <Panel title="Sample Queue">
        <QueueView
          rows={rows}
          getKey={(r) => r.key}
          initialTab={tab ?? "Requested"}
          tabs={[
            { label: "Requested", test: is("Requested", "Awaiting Assignment") },
            { label: "Assigned", test: is("Scheduled") },
            { label: "En Route", test: is("Driver En Route") },
            { label: "At Mine", test: is("At Origin") },
            { label: "Collected", test: is("Collected") },
            { label: "In Transit", test: is("In Transit") },
            { label: "At Laboratory", test: is("At Destination") },
            { label: "Delivered", test: is("Delivered", "Completed") },
          ]}
          columns={[
            { key: "id", header: "Record", render: (r) => (r.req ? <IdLink kind="request" id={r.req.id} /> : <IdLink kind="movement" id={r.mov!.id} />), sort: (r) => r.key },
            { key: "txn", header: "Transaction", render: (r) => <span className="beldium-mono">{r.req?.txnId ?? r.mov!.txnId}</span> },
            { key: "sample", header: "Sample / Batch", render: (r) => r.mov?.sampleId ?? txnOf(s, r.req?.txnId ?? r.mov?.txnId)?.batchId },
            { key: "route", header: "Mine → Laboratory", render: (r) => `${siteName(s, (r.req ?? r.mov)!.originId)} → ${siteName(s, (r.req ?? r.mov)!.destinationId)}` },
            ...base.filter((c) => ["vehicle", "driver", "custody"].includes(c.key)).map((c) => ({ key: c.key, header: c.header, render: (r: Row) => (r.mov ? c.render(r.mov) : "-") })),
            { key: "time", header: "Pickup by", render: (r) => fmt(r.req?.pickupBy ?? r.mov?.pickupAt), sort: (r) => r.req?.pickupBy ?? r.mov?.pickupAt ?? "" },
            { key: "status", header: "Status", render: (r) => <StatusBadge value={r.req ? "Requested" : movementStatus(r.mov!)} /> },
          ]}
          searchText={(r) => (r.mov ? movementSearch(s)(r.mov) : `${r.req!.id} ${r.req!.txnId}`)}
          onOpen={(r) => (r.req ? navigate({ to: "/portal/transport-requests/$requestId", params: { requestId: r.req.id } }) : navigate({ to: "/portal/movements/$movementId", params: { movementId: r.mov!.id } }))}
          actions={(r) =>
            r.req ? (
              <RowAction
                onClick={() => {
                  const id = acceptRequest(r.req!.id);
                  toast.success(`Accepted: ${id}`);
                }}
              >
                Accept
              </RowAction>
            ) : (
              <StageActionButton movement={r.mov!} size="sm" />
            )
          }
        />
      </Panel>
    </>
  );
}
