import { createFileRoute } from "@tanstack/react-router";

import { PageHeader, StatCard } from "@/components/miner-shell";
import { Bar, DataTable, EmptyState, Panel, StatusPill, Td, TxLink } from "@/components/ecosystem-ui";
import { Button } from "@/components/ui/button";

import { exportRows } from "@/lib/ecosystem-data";
import { useMiner } from "@/lib/miner-store";

export const Route = createFileRoute("/portal/exports")({ component: ExportsPage });

function ExportsPage() {
  const { state, advanceTransaction, recordSettlement } = useMiner();
  void recordSettlement;
  const rows = exportRows(state.transactions);
  return (
    <div>
      <PageHeader title="Exports" description="Export compliance, export-ready cargo, shipment, buyer destination and delivery." />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Export ready" value={String(rows.filter((r) => r.ex.readyAt && !r.ex.shippedAt).length)} />
        <StatCard label="Shipped" value={String(rows.filter((r) => r.ex.shippedAt && !r.ex.deliveredAt).length)} />
        <StatCard label="Delivered" value={String(rows.filter((r) => r.ex.deliveredAt).length)} />
      </div>
      <Panel title="Export pipeline">
        {rows.length === 0 ? <EmptyState label="Nothing has reached export stage yet." /> : (
        <DataTable head={["Permit", "Transaction", "Port", "Vessel", "Compliance", "Export ready", "Shipped", "ETA", "Delivered", ""]}>
          {rows.map(({ tx, ex }) => (
            <tr key={tx.id}>
              <Td className="font-medium">{ex.permitRef}</Td>
              <Td><TxLink tx={tx} /></Td>
              <Td>{ex.port}</Td>
              <Td>{ex.vessel}</Td>
              <Td><StatusPill value={ex.complianceStatus} /></Td>
              <Td className="text-xs">{ex.readyAt ?? "—"}</Td>
              <Td className="text-xs">{ex.shippedAt ?? "—"}</Td>
              <Td className="text-xs">{ex.eta ?? "—"}</Td>
              <Td className="text-xs">{ex.deliveredAt ?? "—"}</Td>
              <Td>{!ex.deliveredAt ? <Button size="sm" variant="outline" onClick={() => advanceTransaction(tx.id)}>Advance</Button> : null}</Td>
            </tr>
          ))}
        </DataTable>)}
      </Panel>
    </div>
  );
}
