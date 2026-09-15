import { Link, createFileRoute, useParams } from "@tanstack/react-router";

import { PageHeader, StatCard } from "@/components/miner-shell";
import { Bar, DataTable, Panel, StatusPill, Td } from "@/components/ecosystem-ui";
import { StatusChip } from "@/components/status-chip";
import { Button } from "@/components/ui/button";
import { LIFECYCLE_STAGES, domainLabel, stageIndexOf, stageProgress, tonnes, usd } from "@/lib/ecosystem-data";
import { useMiner } from "@/lib/miner-store";

export const Route = createFileRoute("/portal/transactions/$transactionId")({ component: TransactionDetail });

function TransactionDetail() {
  const { transactionId } = useParams({ from: "/portal/transactions/$transactionId" });
  const { state, advanceTransaction, recordSettlement } = useMiner();
  const tx = state.transactions.find((t) => t.id === transactionId);

  if (!tx) {
    return (
      <div>
        <PageHeader title="Transaction not found" description="This transaction is not in your workspace." />
        <Button asChild variant="outline"><Link to="/portal/transactions">Back to transactions</Link></Button>
      </div>
    );
  }

  const current = stageIndexOf(tx.stage);
  const rfq = state.rfqs.find((r) => r.id === tx.rfqId);
  const batches = state.batches.filter((b) => b.transactionId === tx.id);

  return (
    <div>
      <PageHeader
        title={`${tx.reference} — ${tx.buyer}`}
        description={`${rfq?.reference ?? "RFQ"} · ${tx.mineral} · ${tx.gradeSpec} · ${tx.incoterm} → ${tx.destination}`}
        actions={
          <div className="flex gap-2">
            <Button size="sm" onClick={() => advanceTransaction(tx.id)} disabled={tx.stage === "payment_settlement"}>
              Advance stage
            </Button>
            <Button size="sm" variant="outline" onClick={() => recordSettlement(tx.id)} disabled={tx.payment.status === "paid"}>
              Record settlement
            </Button>
          </div>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Committed" value={tonnes(tx.committedTonnes)} hint={`Aggregated ${tonnes(tx.aggregatedTonnes)}`} />
        <StatCard label="Value" value={usd(tx.committedTonnes * tx.unitPriceUsd)} hint={`${usd(tx.unitPriceUsd)} / t`} />
        <StatCard label="Current stage" value={LIFECYCLE_STAGES[current]?.label ?? "—"} hint={`${stageProgress(tx)}% of lifecycle`} />
        <StatCard label="Payment" value={tx.payment.status.replace(/_/g, " ")} hint={`Due ${tx.payment.dueAt}`} />
      </div>

      <div className="mb-6"><Bar pct={stageProgress(tx)} /></div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <Panel title="Live transaction timeline" description="RFQ received through to payment and settlement.">
          <ol className="relative space-y-0 border-l border-border pl-5">
            {LIFECYCLE_STAGES.map((stage, i) => {
              const at = tx.stageLog[stage.id];
              const done = i < current;
              const active = i === current;
              return (
                <li key={stage.id} className="relative py-2.5">
                  <span
                    className={`absolute -left-[26px] top-4 h-2.5 w-2.5 rounded-full border-2 ${
                      active ? "border-primary bg-primary" : done ? "border-success bg-success" : "border-border bg-background"
                    }`}
                  />
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`text-sm ${active ? "font-semibold text-foreground" : done ? "text-foreground" : "text-muted-foreground"}`}>
                      {stage.label}
                    </span>
                    <StatusChip tone={active ? "info" : done ? "success" : "neutral"}>
                      {active ? "Current" : done ? "Complete" : "Upcoming"}
                    </StatusChip>
                    <span className="text-[11px] tracking-wide text-muted-foreground uppercase">{domainLabel[stage.domain]}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">{at ?? "Awaiting"}</div>
                </li>
              );
            })}
          </ol>
        </Panel>

        <div className="grid gap-6">
          <Panel title="Quality & sampling">
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div><dt className="text-xs text-muted-foreground">Sample</dt><dd>{tx.sample.reference}</dd></div>
              <div><dt className="text-xs text-muted-foreground">Laboratory</dt><dd>{tx.sample.laboratory}</dd></div>
              <div><dt className="text-xs text-muted-foreground">Collected</dt><dd>{tx.sample.collectedAt ?? "—"}</dd></div>
              <div><dt className="text-xs text-muted-foreground">Lab received</dt><dd>{tx.sample.labReceivedAt ?? "—"}</dd></div>
              <div><dt className="text-xs text-muted-foreground">Result grade</dt><dd>{tx.sample.resultGrade ?? "—"}</dd></div>
              <div><dt className="text-xs text-muted-foreground">Moisture</dt><dd>{tx.sample.moisture ?? "—"}</dd></div>
              <div><dt className="text-xs text-muted-foreground">Buyer acceptance</dt><dd>{tx.sample.buyerAcceptedAt ?? "Pending"}</dd></div>
              <div><dt className="text-xs text-muted-foreground">Status</dt><dd><StatusPill value={tx.sample.status} /></dd></div>
            </dl>
          </Panel>

          <Panel title="Logistics moves">
            <DataTable head={["Kind", "Carrier", "Route", "Picked up", "Arrived", "Status"]}>
              {tx.logistics.map((m) => (
                <tr key={m.id}>
                  <Td>{m.kind}</Td>
                  <Td>{m.carrier}<div className="text-xs text-muted-foreground">{m.vehicle}</div></Td>
                  <Td className="text-xs">{m.from} → {m.to}</Td>
                  <Td className="text-xs">{m.pickedUpAt ?? "—"}</Td>
                  <Td className="text-xs">{m.arrivedAt ?? "—"}</Td>
                  <Td><StatusPill value={m.status} /></Td>
                </tr>
              ))}
            </DataTable>
          </Panel>

          <Panel title="Warehousing, processing & export">
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div><dt className="text-xs text-muted-foreground">Facility</dt><dd>{tx.warehouse?.facility ?? "Not assigned"}</dd></div>
              <div><dt className="text-xs text-muted-foreground">Received</dt><dd>{tx.warehouse?.receivedAt ?? "—"}</dd></div>
              <div><dt className="text-xs text-muted-foreground">Processing</dt><dd>{tx.processing?.facility ?? "Not started"}</dd></div>
              <div><dt className="text-xs text-muted-foreground">Output</dt><dd>{tx.processing?.outputTonnes ? tonnes(tx.processing.outputTonnes) : "—"}</dd></div>
              <div><dt className="text-xs text-muted-foreground">Export permit</dt><dd>{tx.exportRecord.permitRef}</dd></div>
              <div><dt className="text-xs text-muted-foreground">Compliance</dt><dd><StatusPill value={tx.exportRecord.complianceStatus} /></dd></div>
              <div><dt className="text-xs text-muted-foreground">Vessel</dt><dd>{tx.exportRecord.vessel}</dd></div>
              <div><dt className="text-xs text-muted-foreground">Delivered</dt><dd>{tx.exportRecord.deliveredAt ?? "—"}</dd></div>
            </dl>
          </Panel>

          <Panel title="Allocated material">
            <DataTable head={["Batch", "Site", "Tonnes", "Grade", "Stage", "Location"]}>
              {batches.map((b) => (
                <tr key={b.id}>
                  <Td className="font-medium">{b.reference}</Td>
                  <Td>{state.application.sites.find((s) => s.id === b.siteId)?.name ?? b.siteId}</Td>
                  <Td>{tonnes(b.tonnes)}</Td>
                  <Td>{b.grade}</Td>
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
