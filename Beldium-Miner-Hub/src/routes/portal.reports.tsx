import { createFileRoute } from "@tanstack/react-router";

import { PageHeader, StatCard } from "@/components/miner-shell";
import { Bar, DataTable, Panel, Td, TxLink } from "@/components/ecosystem-ui";
import { useCommitments, useEcosystemDashboard, useTransactions } from "@/lib/api/ecosystem-queries";

function tonnes(v: number): string {
  return `${v.toLocaleString(undefined, { maximumFractionDigits: 1 })} t`;
}
function usd(v: number): string {
  return `$${v.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

export const Route = createFileRoute("/portal/reports")({ component: ReportsPage });

function ReportsPage() {
  const dashboard = useEcosystemDashboard();
  const commitmentsQuery = useCommitments();
  const transactionsQuery = useTransactions();

  const e = dashboard.data;
  const commitments = Array.isArray(commitmentsQuery.data) ? commitmentsQuery.data : (commitmentsQuery.data?.results ?? []);
  const transactions = Array.isArray(transactionsQuery.data) ? transactionsQuery.data : (transactionsQuery.data?.results ?? []);
  const txById = new Map(transactions.map((tx) => [tx.id, tx]));

  const stageTotals = e
    ? [
        { label: "Available stockpile", value: e.available_inventory },
        { label: "In transit", value: e.in_transit },
        { label: "In processing", value: e.in_processing },
        { label: "Export ready", value: e.export_ready },
      ]
    : [];
  const maxStage = Math.max(...stageTotals.map((s) => s.value), 1);

  return (
    <div>
      <PageHeader title="Reports" description="Aggregated ecosystem performance across marketplace, material flow and settlement." />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active RFQs" value={e ? String(e.active_rfqs) : "-"} />
        <StatCard label="Committed to date" value={e ? tonnes(e.active_supply_commitments) : "-"} />
        <StatCard label="Aggregated" value={e ? tonnes(e.aggregated_to_date) : "-"} />
        <StatCard label="Outstanding payments" value={e ? usd(e.outstanding_payments) : "-"} />
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
            {commitments.map((c) => {
              const tx = txById.get(c.transaction);
              if (!tx) return null;
              return (
                <tr key={c.id}>
                  <Td><TxLink id={tx.id} reference={tx.reference} /></Td>
                  <Td>{tx.buyer_name}</Td>
                  <Td>{tonnes(c.committed)}</Td>
                  <Td>{tonnes(c.aggregated)}</Td>
                  <Td className="w-32"><Bar pct={c.fulfilment_percent} /><div className="mt-1 text-xs text-muted-foreground">{c.fulfilment_percent}%</div></Td>
                </tr>
              );
            })}
          </DataTable>
        </Panel>
      </div>
    </div>
  );
}
