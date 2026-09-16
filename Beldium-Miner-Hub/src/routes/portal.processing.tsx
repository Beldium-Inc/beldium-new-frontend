import { createFileRoute } from "@tanstack/react-router";

import { PageHeader, StatCard } from "@/components/miner-shell";
import { DataTable, EmptyState, Panel, StageChip, Td, TxLink } from "@/components/ecosystem-ui";
import { Button } from "@/components/ui/button";
import { nextStage, type LifecycleStage } from "@/lib/api/ecosystem";
import { useAdvanceTransactionStage, useTransactions } from "@/lib/api/ecosystem-queries";

function tonnes(v: number): string {
  return `${v.toLocaleString(undefined, { maximumFractionDigits: 1 })} t`;
}

const PROCESSING_STAGES: LifecycleStage[] = [
  "processing_started",
  "processing_completed",
  "output_recorded",
  "post_processing_quality",
];

export const Route = createFileRoute("/portal/processing")({ component: ProcessingPage });

function ProcessingPage() {
  const transactionsQuery = useTransactions();
  const advanceStage = useAdvanceTransactionStage();

  const all = Array.isArray(transactionsQuery.data) ? transactionsQuery.data : (transactionsQuery.data?.results ?? []);
  const rows = all.filter((tx) => PROCESSING_STAGES.includes(tx.stage));
  const inProgress = rows.filter((tx) => tx.stage !== "post_processing_quality");

  return (
    <div>
      <PageHeader title="Processing" description="Transactions currently in the processing stage of the lifecycle." />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Runs in progress" value={String(inProgress.length)} />
        <StatCard label="Tonnage in processing" value={tonnes(rows.reduce((s, tx) => s + tx.aggregated_tonnes, 0))} />
        <StatCard label="Total in this stage" value={String(rows.length)} />
      </div>
      <Panel title="Processing transactions">
        {rows.length === 0 ? (
          <EmptyState label="No transactions currently in processing." />
        ) : (
          <DataTable head={["Transaction", "Buyer", "Mineral", "Aggregated", "Stage", ""]}>
            {rows.map((tx) => (
              <tr key={tx.id}>
                <Td className="font-medium"><TxLink id={tx.id} reference={tx.reference} /></Td>
                <Td>{tx.buyer_name}</Td>
                <Td>{tx.mineral}</Td>
                <Td>{tonnes(tx.aggregated_tonnes)}</Td>
                <Td><StageChip stage={tx.stage} /></Td>
                <Td>
                  {tx.stage !== "post_processing_quality" ? (
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
