import { createFileRoute } from "@tanstack/react-router";

import { PageHeader, StatCard } from "@/components/miner-shell";
import { Bar, DataTable, EmptyState, Panel, StatusPill, Td, TxLink } from "@/components/ecosystem-ui";
import { Button } from "@/components/ui/button";

import { commitmentsFrom, ecosystemMetrics, tonnes, usd } from "@/lib/ecosystem-data";
import { useMiner } from "@/lib/miner-store";

export const Route = createFileRoute("/portal/reports")({ component: ReportsPage });

function ReportsPage() {
  const { state, advanceTransaction, recordSettlement } = useMiner();
  void advanceTransaction; void recordSettlement;
  const metrics = ecosystemMetrics(state);
  const commitments = commitmentsFrom(state.rfqs, state.transactions);
  const stageTotals = [
    { label: "Available stockpile", value: metrics.availableInventory },
    { label: "In transit", value: metrics.inTransit },
    { label: "In processing", value: metrics.inProcessing },
    { label: "Export ready", value: metrics.exportReady },
  ];
  const maxStage = Math.max(...stageTotals.map((s) => s.value), 1);
  return (
    <div>
      <PageHeader title="Reports" description="Aggregated ecosystem performance across marketplace, material flow and settlement." />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Demand received" value={tonnes(metrics.demandReceivedTonnes)} hint="Open RFQ quantity" />
        <StatCard label="Committed" value={tonnes(metrics.committedTonnes)} />
        <StatCard label="Aggregated" value={tonnes(metrics.aggregatedTonnes)} />
        <StatCard label="Outstanding payments" value={usd(metrics.outstandingPayments)} />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Material by stage">
          <div className="space-y-3">
            {stageTotals.map((row) => (
              <div key={row.label}>
                <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                  <span>{row.label}</span>
                  <span>{tonnes(row.value)}</span>
                </div>
                <Bar pct={maxStage ? (row.value / maxStage) * 100 : 0} />
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Commitment fulfilment">
          <DataTable head={["Transaction", "Buyer", "Committed", "Aggregated", "Fulfilment"]}>
            {commitments.map((c) => (
              <tr key={c.transaction.id}>
                <Td><TxLink tx={c.transaction} /></Td>
                <Td>{c.transaction.buyer}</Td>
                <Td>{tonnes(c.committed)}</Td>
                <Td>{tonnes(c.aggregated)}</Td>
                <Td className="w-32"><Bar pct={c.fulfilment} /><div className="mt-1 text-xs text-muted-foreground">{c.fulfilment}%</div></Td>
              </tr>
            ))}
          </DataTable>
        </Panel>
      </div>
    </div>
  );
}
