import { createFileRoute } from "@tanstack/react-router";

import { PageHeader, StatCard } from "@/components/miner-shell";
import { DataTable, EmptyState, Panel, StatusPill, Td, TxLink } from "@/components/ecosystem-ui";
import { useLogisticsMoves, useTransactions } from "@/lib/api/ecosystem-queries";

function tonnes(v: number): string {
  return `${v.toLocaleString(undefined, { maximumFractionDigits: 1 })} t`;
}

export const Route = createFileRoute("/portal/logistics")({ component: LogisticsPage });

function LogisticsPage() {
  const movesQuery = useLogisticsMoves();
  const transactionsQuery = useTransactions();
  const moves = Array.isArray(movesQuery.data) ? movesQuery.data : (movesQuery.data?.results ?? []);
  const transactions = Array.isArray(transactionsQuery.data) ? transactionsQuery.data : (transactionsQuery.data?.results ?? []);
  const txById = new Map(transactions.map((tx) => [tx.id, tx]));

  return (
    <div>
      <PageHeader title="Logistics" description="Sample courier and bulk haulage assignments, pickups and arrivals across all transactions." />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Moves in transit" value={String(moves.filter((m) => m.status === "in_transit").length)} />
        <StatCard
          label="Tonnes in transit"
          value={tonnes(moves.filter((m) => m.kind === "bulk" && m.status === "in_transit").reduce((s, m) => s + m.tonnes, 0))}
        />
        <StatCard label="Completed moves" value={String(moves.filter((m) => m.status === "delivered").length)} />
      </div>
      <Panel title="Movement register">
        {moves.length === 0 ? (
          <EmptyState label="No logistics moves yet." />
        ) : (
          <DataTable head={["Move", "Transaction", "Carrier", "Route", "Tonnes", "Assigned", "Picked up", "Arrived", "Status"]}>
            {moves.map((move) => {
              const tx = txById.get(move.transaction);
              return (
                <tr key={move.id}>
                  <Td className="font-medium">{move.kind === "bulk" ? "Bulk" : "Sample"}</Td>
                  <Td>{tx ? <TxLink id={tx.id} reference={tx.reference} /> : move.reference}</Td>
                  <Td>{move.carrier}<div className="text-xs text-muted-foreground">{move.vehicle} · {move.driver}</div></Td>
                  <Td className="text-xs">{move.from_location} → {move.to_location}</Td>
                  <Td>{move.tonnes}</Td>
                  <Td className="text-xs">{move.assigned_at}</Td>
                  <Td className="text-xs">{move.picked_up_at ?? "—"}</Td>
                  <Td className="text-xs">{move.arrived_at ?? "—"}</Td>
                  <Td><StatusPill value={move.status} /></Td>
                </tr>
              );
            })}
          </DataTable>
        )}
      </Panel>
    </div>
  );
}
