import { createFileRoute, Link } from "@tanstack/react-router";

import { PageHeader } from "@/components/beldium/shell";
import { Panel } from "@/components/beldium/stat-card";
import { FieldGrid } from "@/components/beldium/data-table";
import { StatusBadge } from "@/components/beldium/status-badge";
import { IdLink } from "@/components/beldium/ops-ui";
import { fmt, movementStatus, naira, partyName, requestStatus, siteName, useOps } from "@/lib/ops-store";

export const Route = createFileRoute("/_ops/transactions_/$txnId")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.txnId} | Transaction | Beldium Logistics` },
      { name: "description", content: `Complete logistics history for transaction ${params.txnId}.` },
      { property: "og:title", content: `${params.txnId} | Beldium Logistics` },
      { property: "og:description", content: "RFQ, batch, quality, movements, deliveries and settlement." },
    ],
  }),
  component: TxnDetail,
});

const chainSteps = ["RFQ", "Transaction", "Supply Commitment", "Mine", "Batch", "Sample", "Quality", "Logistics Movement", "Warehouse / Processor", "Export", "Delivery", "Settlement"];

function TxnDetail() {
  const { txnId } = Route.useParams();
  const s = useOps();
  const t = s.transactions.find((x) => x.id === txnId);
  if (!t) {
    return (
      <Panel title="Transaction not found">
        <Link to="/transactions" className="text-sm font-semibold text-colorLink">
          Back to Transactions
        </Link>
      </Panel>
    );
  }
  const reqs = s.requests.filter((r) => r.txnId === t.id);
  const moves = s.movements.filter((m) => m.txnId === t.id);
  const invs = s.invoices.filter((i) => i.txnId === t.id);
  const sample = moves.find((m) => m.kind === "Sample");
  const reached = [
    true,
    true,
    true,
    true,
    true,
    !!sample,
    t.quality === "Buyer accepted" || t.quality === "Result published",
    moves.some((m) => m.kind === "Bulk"),
    ["At Warehouse", "At Processor", "Processing Complete", "Export Movement", "At Port", "Logistics Completed"].includes(t.stage),
    ["Export Movement", "At Port", "Logistics Completed"].includes(t.stage),
    t.stage === "Logistics Completed",
    invs.length > 0 && invs.every((i) => i.status === "Paid"),
  ];

  return (
    <>
      <PageHeader title={`Transaction ${t.id}`}>
        <StatusBadge value={t.stage} />
      </PageHeader>
      <div className="space-y-5">
        <Panel title="Shared Record">
          <ol className="mb-4 flex flex-wrap gap-2">
            {chainSteps.map((c, i) => (
              <li key={c} className={reached[i] ? "rounded-full border border-success/40 bg-success/10 px-3 py-1 text-[11px] font-medium text-success" : "rounded-full border border-border px-3 py-1 text-[11px] font-medium text-muted-foreground"}>
                {c}
              </li>
            ))}
          </ol>
          <FieldGrid
            items={[
              { label: "RFQ ID", value: t.rfqId },
              { label: "Transaction ID", value: t.id },
              { label: "Supply commitment", value: t.commitmentId },
              { label: "Buyer", value: partyName(s, t.buyerId) },
              { label: "Miner", value: partyName(s, t.minerId) },
              { label: "Mine", value: siteName(s, t.mineId) },
              { label: "Batch", value: t.batchId },
              { label: "Mineral", value: t.mineral },
              { label: "Quantity", value: `${t.quantity} t` },
              { label: "Origin", value: siteName(s, t.mineId) },
              { label: "Destination", value: siteName(s, t.destinationId) },
              { label: "Export port", value: siteName(s, t.portId) },
              { label: "Quality", value: <StatusBadge value={t.quality} /> },
              { label: "Quality result", value: t.qualityResult ?? "-" },
              { label: "Contract value", value: naira(t.quantity * t.unitPrice) },
            ]}
          />
        </Panel>

        <div className="grid gap-5 xl:grid-cols-2">
          <Panel title="Transport Requests">
            <ul className="divide-y divide-border">
              {reqs.length === 0 ? <li className="py-2 text-sm text-muted-foreground">None.</li> : null}
              {reqs.map((r) => (
                <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                  <span>
                    <IdLink kind="request" id={r.id} /> <span className="beldium-small ml-2">{r.movementType}</span>
                  </span>
                  <StatusBadge value={requestStatus(s, r)} />
                </li>
              ))}
            </ul>
          </Panel>
          <Panel title="Movements">
            <ul className="divide-y divide-border">
              {moves.length === 0 ? <li className="py-2 text-sm text-muted-foreground">None.</li> : null}
              {moves.map((m) => (
                <li key={m.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                  <span>
                    <IdLink kind="movement" id={m.id} />
                    <span className="beldium-small ml-2">
                      {siteName(s, m.originId)} → {siteName(s, m.destinationId)} · {m.received ?? m.loaded ?? m.quantity} {m.unit}
                    </span>
                  </span>
                  <StatusBadge value={movementStatus(m)} />
                </li>
              ))}
            </ul>
          </Panel>
        </div>

        {invs.length ? (
          <Panel title="Settlement">
            <ul className="divide-y divide-border">
              {invs.map((i) => (
                <li key={i.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                  <span>
                    {i.id} · {i.movementId} · {naira(i.amount)}
                  </span>
                  <Link to="/payments" search={{ tab: i.status }}>
                    <StatusBadge value={i.status} />
                  </Link>
                </li>
              ))}
            </ul>
          </Panel>
        ) : null}

        <Panel title="Logistics History">
          <ol className="relative space-y-3 border-l border-border pl-5">
            {[...t.timeline, ...moves.flatMap((m) => m.timeline.map((e) => ({ at: e.at, sector: `Logistics · ${m.id}`, event: e.event, ref: m.id })))]
              .sort((a, b) => (a.at < b.at ? 1 : -1))
              .map((e, i) => (
                <li key={i} className="relative">
                  <span className="absolute -left-[26px] top-1.5 size-2.5 rounded-full bg-primary ring-4 ring-card" />
                  <p className="text-sm">
                    <span className="beldium-mono mr-2 font-semibold text-primary">{fmt(e.at)}</span>
                    {e.event}
                  </p>
                  <p className="beldium-small">{e.sector}</p>
                </li>
              ))}
          </ol>
        </Panel>
      </div>
    </>
  );
}
