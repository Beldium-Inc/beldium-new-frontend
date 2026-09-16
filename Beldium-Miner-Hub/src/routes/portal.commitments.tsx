import { createFileRoute } from "@tanstack/react-router";

import { PageHeader, StatCard } from "@/components/miner-shell";
import { Bar, DataTable, EmptyState, Panel, StageChip, Td, TxLink } from "@/components/ecosystem-ui";
import { Button } from "@/components/ui/button";
import { useAllocateToCommitment, useCommitments, useMaterialBatches, useTransactions } from "@/lib/api/ecosystem-queries";

function tonnes(v: number): string {
  return `${v.toLocaleString(undefined, { maximumFractionDigits: 1 })} t`;
}
function usd(v: number): string {
  return `$${v.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

export const Route = createFileRoute("/portal/commitments")({ component: CommitmentsPage });

function CommitmentsPage() {
  const commitmentsQuery = useCommitments();
  const transactionsQuery = useTransactions();
  const batchesQuery = useMaterialBatches();
  const allocate = useAllocateToCommitment();

  const commitments = Array.isArray(commitmentsQuery.data) ? commitmentsQuery.data : (commitmentsQuery.data?.results ?? []);
  const transactions = Array.isArray(transactionsQuery.data) ? transactionsQuery.data : (transactionsQuery.data?.results ?? []);
  const batches = Array.isArray(batchesQuery.data) ? batchesQuery.data : (batchesQuery.data?.results ?? []);
  const txById = new Map(transactions.map((tx) => [tx.id, tx]));
  const active = commitments.filter((c) => !txById.get(c.transaction)?.is_closed);
  const freeBatches = batches.filter((b) => b.stage === "stockpile" && !b.transaction);

  return (
    <div>
      <PageHeader
        title="Supply commitments"
        description="What you committed against buyer demand, how much material has been aggregated, and what remains to fulfil."
      />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active commitments" value={String(active.length)} />
        <StatCard label="Committed" value={tonnes(active.reduce((s, c) => s + c.committed, 0))} />
        <StatCard label="Aggregated" value={tonnes(active.reduce((s, c) => s + c.aggregated, 0))} />
        <StatCard label="Remaining" value={tonnes(active.reduce((s, c) => s + c.remaining, 0))} />
      </div>

      {active.length === 0 ? <EmptyState label="No active commitments — accept an RFQ to create one." /> : null}

      <div className="grid gap-4">
        {active.map((c) => {
          const tx = txById.get(c.transaction);
          if (!tx) return null;
          const txBatches = batches.filter((b) => b.transaction === c.transaction);
          return (
            <Panel
              key={c.id}
              title={`${tx.reference} — ${tx.buyer_name}`}
              description={`${tx.mineral} · ${tx.incoterm}`}
              actions={<StageChip stage={tx.stage} />}
            >
              <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
                <div>
                  <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                    <div><div className="text-xs text-muted-foreground">Requested</div>{tonnes(c.requested)}</div>
                    <div><div className="text-xs text-muted-foreground">Committed</div>{tonnes(c.committed)}</div>
                    <div><div className="text-xs text-muted-foreground">Aggregated</div>{tonnes(c.aggregated)}</div>
                    <div><div className="text-xs text-muted-foreground">Remaining</div>{tonnes(c.remaining)}</div>
                  </div>
                  <div className="mt-3">
                    <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                      <span>Fulfilment</span>
                      <span>{c.fulfilment_percent}%</span>
                    </div>
                    <Bar pct={c.fulfilment_percent} />
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">
                    Value {usd(tx.value)} · destination {tx.destination} · <TxLink id={tx.id} reference="view transaction" />
                  </p>
                </div>
                <div className="rounded-md border border-border p-3">
                  <div className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Aggregate stockpile</div>
                  {freeBatches.length === 0 ? (
                    <p className="mt-2 text-xs text-muted-foreground">No unallocated stockpile batches.</p>
                  ) : (
                    <ul className="mt-2 space-y-2">
                      {freeBatches.map((b) => (
                        <li key={b.id} className="flex items-center justify-between gap-2 text-xs">
                          <span>{b.reference} · {tonnes(b.tonnes)}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={allocate.isPending}
                            onClick={() => allocate.mutate({ commitment: c, additionalTonnes: b.tonnes })}
                          >
                            Allocate
                          </Button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
              <div className="mt-4">
                <DataTable head={["Batch", "Mineral", "Tonnes", "Grade", "Stage", "Location"]}>
                  {txBatches.map((b) => (
                    <tr key={b.id}>
                      <Td className="font-medium">{b.reference}</Td>
                      <Td>{b.mineral}</Td>
                      <Td>{tonnes(b.tonnes)}</Td>
                      <Td>{b.grade ?? "—"}</Td>
                      <Td>{b.stage.replace(/_/g, " ")}</Td>
                      <Td className="text-xs text-muted-foreground">{b.location}</Td>
                    </tr>
                  ))}
                </DataTable>
              </div>
            </Panel>
          );
        })}
      </div>
    </div>
  );
}
