import { createFileRoute } from "@tanstack/react-router";

import { PageHeader, StatCard } from "@/components/miner-shell";
import { Bar, DataTable, EmptyState, Panel, StatusPill, Td, TxLink } from "@/components/ecosystem-ui";
import { Button } from "@/components/ui/button";

import { processingRows, tonnes } from "@/lib/ecosystem-data";
import { useMiner } from "@/lib/miner-store";

export const Route = createFileRoute("/portal/processing")({ component: ProcessingPage });

function ProcessingPage() {
  const { state, advanceTransaction, recordSettlement } = useMiner();
  void recordSettlement;
  const rows = processingRows(state.transactions);
  return (
    <div>
      <PageHeader title="Processing" description="Plant runs, input and output tonnage, recovery and post-processing grade per transaction." />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Runs in progress" value={String(rows.filter((r) => r.pr.startedAt && !r.pr.completedAt).length)} />
        <StatCard label="Input tonnes" value={tonnes(rows.reduce((s, r) => s + r.pr.inputTonnes, 0))} />
        <StatCard label="Output tonnes" value={tonnes(rows.reduce((s, r) => s + (r.pr.outputTonnes ?? 0), 0))} />
      </div>
      <Panel title="Processing runs">
        {rows.length === 0 ? <EmptyState label="No processing runs yet." /> : (
        <DataTable head={["Facility", "Transaction", "Method", "Started", "Completed", "Input", "Output", "Recovery", "Post grade", ""]}>
          {rows.map(({ tx, pr }) => (
            <tr key={tx.id}>
              <Td className="font-medium">{pr.facility}</Td>
              <Td><TxLink tx={tx} /></Td>
              <Td>{pr.method}</Td>
              <Td className="text-xs">{pr.startedAt ?? "—"}</Td>
              <Td className="text-xs">{pr.completedAt ?? "—"}</Td>
              <Td>{tonnes(pr.inputTonnes)}</Td>
              <Td>{pr.outputTonnes ? tonnes(pr.outputTonnes) : "—"}</Td>
              <Td>{pr.recovery ? `${pr.recovery}%` : "—"}</Td>
              <Td>{pr.postGrade ?? "—"}</Td>
              <Td>{!pr.completedAt ? <Button size="sm" variant="outline" onClick={() => advanceTransaction(tx.id)}>Advance</Button> : null}</Td>
            </tr>
          ))}
        </DataTable>)}
      </Panel>
    </div>
  );
}
