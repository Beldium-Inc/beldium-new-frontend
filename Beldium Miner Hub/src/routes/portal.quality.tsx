import { createFileRoute } from "@tanstack/react-router";

import { PageHeader, StatCard } from "@/components/miner-shell";
import { Bar, DataTable, EmptyState, Panel, StatusPill, Td, TxLink } from "@/components/ecosystem-ui";
import { Button } from "@/components/ui/button";

import { sampleRows } from "@/lib/ecosystem-data";
import { useMiner } from "@/lib/miner-store";

export const Route = createFileRoute("/portal/quality")({ component: QualityPage });

function QualityPage() {
  const { state, advanceTransaction, recordSettlement } = useMiner();
  void advanceTransaction; void recordSettlement;
  const rows = sampleRows(state.transactions);
  return (
    <div>
      <PageHeader title="Samples & quality" description="Sampling, laboratory testing, published results and buyer quality acceptance for every transaction." />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Samples in progress" value={String(rows.filter((r) => !["accepted", "rejected"].includes(r.sample.status)).length)} />
        <StatCard label="Awaiting buyer acceptance" value={String(rows.filter((r) => r.sample.status === "published").length)} />
        <StatCard label="Accepted" value={String(rows.filter((r) => r.sample.status === "accepted").length)} />
      </div>
      <Panel title="Sample register">
        {rows.length === 0 ? <EmptyState label="No samples yet." /> : (
        <DataTable head={["Sample", "Transaction", "Laboratory", "Collected", "Lab received", "Result", "Moisture", "Published", "Buyer acceptance", "Status"]}>
          {rows.map(({ tx, sample }) => (
            <tr key={sample.reference}>
              <Td className="font-medium">{sample.reference}</Td>
              <Td><TxLink tx={tx} /></Td>
              <Td>{sample.laboratory}</Td>
              <Td className="text-xs">{sample.collectedAt ?? "—"}</Td>
              <Td className="text-xs">{sample.labReceivedAt ?? "—"}</Td>
              <Td>{sample.resultGrade ?? "—"}</Td>
              <Td>{sample.moisture ?? "—"}</Td>
              <Td className="text-xs">{sample.publishedAt ?? "—"}</Td>
              <Td className="text-xs">{sample.buyerAcceptedAt ?? "Pending"}</Td>
              <Td><StatusPill value={sample.status} /></Td>
            </tr>
          ))}
        </DataTable>)}
      </Panel>
    </div>
  );
}
