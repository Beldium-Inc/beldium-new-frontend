import { createFileRoute } from "@tanstack/react-router";

import { PageHeader, StatCard } from "@/components/miner-shell";
import { DataTable, EmptyState, Panel, StageChip, Td, TxLink } from "@/components/ecosystem-ui";
import { type LifecycleStage } from "@/lib/api/ecosystem";
import { useTransactions } from "@/lib/api/ecosystem-queries";

const QUALITY_STAGES: LifecycleStage[] = [
  "sample_requested",
  "sample_logistics",
  "sample_collected",
  "lab_received",
  "testing",
  "results_published",
  "buyer_quality_acceptance",
];

export const Route = createFileRoute("/portal/quality")({ component: QualityPage });

function QualityPage() {
  const transactionsQuery = useTransactions();
  const all = Array.isArray(transactionsQuery.data) ? transactionsQuery.data : (transactionsQuery.data?.results ?? []);
  const rows = all.filter((tx) => QUALITY_STAGES.includes(tx.stage) && tx.quality_sample);

  return (
    <div>
      <PageHeader title="Samples & quality" description="Sampling, laboratory testing and buyer quality acceptance for every transaction." />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Samples in progress" value={String(rows.filter((r) => r.stage !== "buyer_quality_acceptance").length)} />
        <StatCard label="Awaiting buyer acceptance" value={String(rows.filter((r) => r.stage === "results_published").length)} />
        <StatCard label="Accepted" value={String(rows.filter((r) => r.stage === "buyer_quality_acceptance").length)} />
      </div>
      <Panel title="Sample register">
        {rows.length === 0 ? (
          <EmptyState label="No samples yet." />
        ) : (
          <DataTable head={["Transaction", "Buyer", "Mineral", "Sample", "Stage"]}>
            {rows.map((tx) => (
              <tr key={tx.id}>
                <Td className="font-medium"><TxLink id={tx.id} reference={tx.reference} /></Td>
                <Td>{tx.buyer_name}</Td>
                <Td>{tx.mineral}</Td>
                <Td className="text-xs text-muted-foreground">{tx.quality_sample}</Td>
                <Td><StageChip stage={tx.stage} /></Td>
              </tr>
            ))}
          </DataTable>
        )}
      </Panel>
    </div>
  );
}
