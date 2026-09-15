import { createFileRoute } from "@tanstack/react-router";

import { PageHeader, StatCard } from "@/components/miner-shell";
import { Bar, DataTable, EmptyState, Panel, StatusPill, Td, TxLink } from "@/components/ecosystem-ui";
import { Button } from "@/components/ui/button";

import { tonnes, warehouseRows } from "@/lib/ecosystem-data";
import { useMiner } from "@/lib/miner-store";

export const Route = createFileRoute("/portal/warehousing")({ component: WarehousingPage });

function WarehousingPage() {
  const { state, advanceTransaction, recordSettlement } = useMiner();
  void recordSettlement;
  const rows = warehouseRows(state.transactions);
  return (
    <div>
      <PageHeader title="Warehousing" description="Warehouse and processor receipts, lots and stored tonnage tied to each transaction." />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Receipts" value={String(rows.length)} />
        <StatCard label="Tonnes received" value={tonnes(rows.reduce((s, r) => s + (r.wh.tonnesReceived ?? 0), 0))} />
        <StatCard label="Awaiting receipt" value={String(rows.filter((r) => !r.wh.receivedAt).length)} />
      </div>
      <Panel title="Warehouse receipts">
        {rows.length === 0 ? <EmptyState label="No warehouse activity yet." /> : (
        <DataTable head={["Lot", "Facility", "Transaction", "Expected", "Received", "Tonnes received", "Status", ""]}>
          {rows.map(({ tx, wh }) => (
            <tr key={wh.lot}>
              <Td className="font-medium">{wh.lot}</Td>
              <Td>{wh.facility}</Td>
              <Td><TxLink tx={tx} /></Td>
              <Td>{tonnes(tx.aggregatedTonnes)}</Td>
              <Td className="text-xs">{wh.receivedAt ?? "—"}</Td>
              <Td>{wh.tonnesReceived ? tonnes(wh.tonnesReceived) : "—"}</Td>
              <Td><StatusPill value={wh.receivedAt ? "closed" : "pending"} /></Td>
              <Td>{!wh.receivedAt ? <Button size="sm" variant="outline" onClick={() => advanceTransaction(tx.id)}>Confirm receipt</Button> : null}</Td>
            </tr>
          ))}
        </DataTable>)}
      </Panel>
    </div>
  );
}
