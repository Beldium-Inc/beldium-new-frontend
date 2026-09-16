import { createFileRoute } from "@tanstack/react-router";

import { PageHeader, StatCard } from "@/components/miner-shell";
import { DataTable, EmptyState, Panel, StageChip, Td, TxLink } from "@/components/ecosystem-ui";
import { Button } from "@/components/ui/button";
import { nextStage, type LifecycleStage } from "@/lib/api/ecosystem";
import { useAdvanceTransactionStage, useTransactions } from "@/lib/api/ecosystem-queries";

const EXPORT_STAGES: LifecycleStage[] = [
  "export_compliance",
  "export_ready",
  "shipped",
  "buyer_destination",
  "delivered",
];

export const Route = createFileRoute("/portal/exports")({ component: ExportsPage });

function ExportsPage() {
  const transactionsQuery = useTransactions();
  const advanceStage = useAdvanceTransactionStage();
  const all = Array.isArray(transactionsQuery.data) ? transactionsQuery.data : (transactionsQuery.data?.results ?? []);
  const rows = all.filter((tx) => EXPORT_STAGES.includes(tx.stage));

  return (
    <div>
      <PageHeader title="Exports" description="Export compliance, export-ready cargo, shipment and delivery." />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Export ready" value={String(rows.filter((r) => r.stage === "export_ready").length)} />
        <StatCard label="Shipped" value={String(rows.filter((r) => r.stage === "shipped" || r.stage === "buyer_destination").length)} />
        <StatCard label="Delivered" value={String(rows.filter((r) => r.stage === "delivered").length)} />
      </div>
      <Panel title="Export pipeline">
        {rows.length === 0 ? (
          <EmptyState label="Nothing has reached export stage yet." />
        ) : (
          <DataTable head={["Transaction", "Buyer", "Mineral", "Destination", "Shipment", "Stage", ""]}>
            {rows.map((tx) => (
              <tr key={tx.id}>
                <Td className="font-medium"><TxLink id={tx.id} reference={tx.reference} /></Td>
                <Td>{tx.buyer_name}</Td>
                <Td>{tx.mineral}</Td>
                <Td>{tx.destination}</Td>
                <Td className="text-xs text-muted-foreground">{tx.export_shipment ?? "—"}</Td>
                <Td><StageChip stage={tx.stage} /></Td>
                <Td>
                  {tx.stage !== "delivered" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={advanceStage.isPending}
                      onClick={() => advanceStage.mutate({ id: tx.id, stage: nextStage(tx.stage) })}
                    >
                      Advance
                    </Button>
                  ) : null}
                </Td>
              </tr>
            ))}
          </DataTable>
        )}
      </Panel>
    </div>
  );
}
