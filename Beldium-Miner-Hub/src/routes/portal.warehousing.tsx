import { createFileRoute } from "@tanstack/react-router";

import { PageHeader, StatCard } from "@/components/miner-shell";
import { DataTable, EmptyState, Panel, StageChip, Td, TxLink } from "@/components/ecosystem-ui";
import { Button } from "@/components/ui/button";
import { nextStage, type LifecycleStage } from "@/lib/api/ecosystem";
import { useAdvanceTransactionStage, useTransactions } from "@/lib/api/ecosystem-queries";

function tonnes(v: number): string {
  return `${v.toLocaleString(undefined, { maximumFractionDigits: 1 })} t`;
}

const WAREHOUSE_STAGES: LifecycleStage[] = ["warehouse_received"];

export const Route = createFileRoute("/portal/warehousing")({ component: WarehousingPage });

function WarehousingPage() {
  const transactionsQuery = useTransactions();
  const advanceStage = useAdvanceTransactionStage();
  const all = Array.isArray(transactionsQuery.data) ? transactionsQuery.data : (transactionsQuery.data?.results ?? []);
  const rows = all.filter((tx) => WAREHOUSE_STAGES.includes(tx.stage));

  return (
    <div>
      <PageHeader title="Warehousing" description="Transactions with material currently held in warehouse." />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="At warehouse" value={String(rows.length)} />
        <StatCard label="Tonnes held" value={tonnes(rows.reduce((s, tx) => s + tx.aggregated_tonnes, 0))} />
        <StatCard label="Lots linked" value={String(rows.filter((tx) => tx.warehousing_lot).length)} />
      </div>
      <Panel title="Warehouse holdings">
        {rows.length === 0 ? (
          <EmptyState label="No material currently at warehouse." />
        ) : (
          <DataTable head={["Transaction", "Buyer", "Mineral", "Tonnes", "Stage", ""]}>
            {rows.map((tx) => (
              <tr key={tx.id}>
                <Td className="font-medium"><TxLink id={tx.id} reference={tx.reference} /></Td>
                <Td>{tx.buyer_name}</Td>
                <Td>{tx.mineral}</Td>
                <Td>{tonnes(tx.aggregated_tonnes)}</Td>
                <Td><StageChip stage={tx.stage} /></Td>
                <Td>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={advanceStage.isPending}
                    onClick={() => advanceStage.mutate({ id: tx.id, stage: nextStage(tx.stage) })}
                  >
                    Advance to processing
                  </Button>
                </Td>
              </tr>
            ))}
          </DataTable>
        )}
      </Panel>
    </div>
  );
}
