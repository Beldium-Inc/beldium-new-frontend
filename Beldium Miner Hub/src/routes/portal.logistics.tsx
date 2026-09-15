import { createFileRoute } from "@tanstack/react-router";

import { PageHeader, StatCard } from "@/components/miner-shell";
import { Bar, DataTable, EmptyState, Panel, StatusPill, Td, TxLink } from "@/components/ecosystem-ui";
import { Button } from "@/components/ui/button";

import { logisticsRows, tonnes } from "@/lib/ecosystem-data";
import { useMiner } from "@/lib/miner-store";

export const Route = createFileRoute("/portal/logistics")({ component: LogisticsPage });

function LogisticsPage() {
  const { state, advanceTransaction, recordSettlement } = useMiner();
  void recordSettlement;
  const rows = logisticsRows(state.transactions);
  return (
    <div>
      <PageHeader title="Logistics" description="Sample courier and bulk haulage assignments, pickups and arrivals across all transactions." />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Moves in transit" value={String(rows.filter((r) => r.move.status === "in_transit").length)} />
        <StatCard label="Tonnes in transit" value={tonnes(rows.filter((r) => r.move.kind === "bulk" && r.move.status === "in_transit").reduce((s, r) => s + r.move.tonnes, 0))} />
        <StatCard label="Completed moves" value={String(rows.filter((r) => r.move.status === "delivered").length)} />
      </div>
      <Panel title="Movement register">
        {rows.length === 0 ? <EmptyState label="No logistics moves yet." /> : (
        <DataTable head={["Move", "Transaction", "Carrier", "Route", "Tonnes", "Assigned", "Picked up", "Arrived", "Status", ""]}>
          {rows.map(({ tx, move }) => (
            <tr key={move.id}>
              <Td className="font-medium">{move.kind === "bulk" ? "Bulk" : "Sample"}</Td>
              <Td><TxLink tx={tx} /></Td>
              <Td>{move.carrier}<div className="text-xs text-muted-foreground">{move.vehicle} · {move.driver}</div></Td>
              <Td className="text-xs">{move.from} → {move.to}</Td>
              <Td>{move.tonnes}</Td>
              <Td className="text-xs">{move.assignedAt}</Td>
              <Td className="text-xs">{move.pickedUpAt ?? "—"}</Td>
              <Td className="text-xs">{move.arrivedAt ?? "—"}</Td>
              <Td><StatusPill value={move.status} /></Td>
              <Td>{move.status !== "delivered" ? <Button size="sm" variant="outline" onClick={() => advanceTransaction(tx.id)}>Advance</Button> : null}</Td>
            </tr>
          ))}
        </DataTable>)}
      </Panel>
    </div>
  );
}
