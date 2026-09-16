import { Link, createFileRoute, useParams } from "@tanstack/react-router";

import { PageHeader, StatCard } from "@/components/miner-shell";
import { Bar, DataTable, Panel, StatusPill, Td } from "@/components/ecosystem-ui";
import { StatusChip } from "@/components/status-chip";
import { Button } from "@/components/ui/button";
import { LIFECYCLE_STAGES, nextStage } from "@/lib/api/ecosystem";
import { useAdvanceTransactionStage, useRecordSettlement, useTransaction } from "@/lib/api/ecosystem-queries";

function tonnes(v: number): string {
  return `${v.toLocaleString(undefined, { maximumFractionDigits: 1 })} t`;
}
function usd(v: number): string {
  return `$${v.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

export const Route = createFileRoute("/portal/transactions/$transactionId")({ component: TransactionDetail });

function TransactionDetail() {
  const { transactionId } = useParams({ from: "/portal/transactions/$transactionId" });
  const txQuery = useTransaction(transactionId);
  const advanceStage = useAdvanceTransactionStage();
  const recordSettlement = useRecordSettlement();

  if (txQuery.isLoading) {
    return <p className="text-sm text-muted-foreground">Loading transaction…</p>;
  }

  const tx = txQuery.data;
  if (!tx) {
    return (
      <div>
        <PageHeader title="Transaction not found" description="This transaction is not in your workspace." />
        <Button asChild variant="outline"><Link to="/portal/transactions">Back to transactions</Link></Button>
      </div>
    );
  }

  const current = LIFECYCLE_STAGES.indexOf(tx.stage);
  const eventAt = (stage: string) => tx.stage_events.find((e) => e.stage === stage)?.occurred_at;

  return (
    <div>
      <PageHeader
        title={`${tx.reference} — ${tx.buyer_name}`}
        description={`${tx.mineral} · ${tx.grade_spec} · ${tx.incoterm} → ${tx.destination}`}
        actions={
          <div className="flex gap-2">
            <Button
              size="sm"
              disabled={tx.stage === "payment_settlement" || advanceStage.isPending}
              onClick={() => advanceStage.mutate({ id: tx.id, stage: nextStage(tx.stage) })}
            >
              Advance stage
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={tx.stage === "payment_settlement" || recordSettlement.isPending}
              onClick={() => recordSettlement.mutate(tx.id)}
            >
              Record settlement
            </Button>
          </div>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Committed" value={tonnes(tx.committed_tonnes)} hint={`Aggregated ${tonnes(tx.aggregated_tonnes)}`} />
        <StatCard label="Value" value={usd(tx.value)} {...(tx.unit_price ? { hint: `${usd(tx.unit_price)} / t` } : {})} />
        <StatCard label="Current stage" value={tx.stage.replace(/_/g, " ")} hint={`${tx.progress_percent}% of lifecycle`} />
        <StatCard label="Closed" value={tx.is_closed ? "Yes" : "No"} />
      </div>

      <div className="mb-6"><Bar pct={tx.progress_percent} /></div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <Panel title="Live transaction timeline" description="RFQ received through to payment and settlement.">
          <ol className="relative space-y-0 border-l border-border pl-5">
            {LIFECYCLE_STAGES.map((stage, i) => {
              const at = eventAt(stage);
              const done = i < current;
              const active = i === current;
              return (
                <li key={stage} className="relative py-2.5">
                  <span
                    className={`absolute -left-[26px] top-4 h-2.5 w-2.5 rounded-full border-2 ${
                      active ? "border-primary bg-primary" : done ? "border-success bg-success" : "border-border bg-background"
                    }`}
                  />
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`text-sm ${active ? "font-semibold text-foreground" : done ? "text-foreground" : "text-muted-foreground"}`}>
                      {stage.replace(/_/g, " ")}
                    </span>
                    <StatusChip tone={active ? "info" : done ? "success" : "neutral"}>
                      {active ? "Current" : done ? "Complete" : "Upcoming"}
                    </StatusChip>
                  </div>
                  <div className="text-xs text-muted-foreground">{at ?? "Awaiting"}</div>
                </li>
              );
            })}
          </ol>
        </Panel>

        <div className="grid gap-6">
          <Panel title="Cross-domain links">
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div><dt className="text-xs text-muted-foreground">Quality sample</dt><dd>{tx.quality_sample ?? "—"}</dd></div>
              <div><dt className="text-xs text-muted-foreground">Warehousing lot</dt><dd>{tx.warehousing_lot ?? "—"}</dd></div>
              <div><dt className="text-xs text-muted-foreground">Processing run</dt><dd>{tx.processing_run ?? "—"}</dd></div>
              <div><dt className="text-xs text-muted-foreground">Export shipment</dt><dd>{tx.export_shipment ?? "—"}</dd></div>
              <div><dt className="text-xs text-muted-foreground">Finance invoice</dt><dd>{tx.finance_invoice ?? "—"}</dd></div>
            </dl>
          </Panel>

          <Panel title="Logistics moves">
            <DataTable head={["Kind", "Carrier", "Route", "Picked up", "Arrived", "Status"]}>
              {tx.logistics_moves.map((m) => (
                <tr key={m.id}>
                  <Td>{m.kind}</Td>
                  <Td>{m.carrier}<div className="text-xs text-muted-foreground">{m.vehicle}</div></Td>
                  <Td className="text-xs">{m.from_location} → {m.to_location}</Td>
                  <Td className="text-xs">{m.picked_up_at ?? "—"}</Td>
                  <Td className="text-xs">{m.arrived_at ?? "—"}</Td>
                  <Td><StatusPill value={m.status} /></Td>
                </tr>
              ))}
            </DataTable>
          </Panel>

          <Panel title="Allocated material">
            <DataTable head={["Batch", "Mineral", "Tonnes", "Grade", "Stage", "Location"]}>
              {tx.batches.map((b) => (
                <tr key={b.id}>
                  <Td className="font-medium">{b.reference}</Td>
                  <Td>{b.mineral}</Td>
                  <Td>{tonnes(b.tonnes)}</Td>
                  <Td>{b.grade ?? "—"}</Td>
                  <Td>{b.stage.replace(/_/g, " ")}</Td>
                  <Td className="text-xs text-muted-foreground">{b.location}</Td>
                </tr>
              ))}
            </DataTable>
          </Panel>
        </div>
      </div>
    </div>
  );
}
