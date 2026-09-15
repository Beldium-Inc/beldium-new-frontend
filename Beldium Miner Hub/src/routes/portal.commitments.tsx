import { createFileRoute } from "@tanstack/react-router";

import { PageHeader, StatCard } from "@/components/miner-shell";
import { Bar, DataTable, EmptyState, Panel, StageChip, Td, TxLink } from "@/components/ecosystem-ui";
import { Button } from "@/components/ui/button";
import { commitmentsFrom, isClosed, tonnes, usd } from "@/lib/ecosystem-data";
import { useMiner } from "@/lib/miner-store";

export const Route = createFileRoute("/portal/commitments")({ component: CommitmentsPage });

function CommitmentsPage() {
  const { state, allocateBatch } = useMiner();
  const commitments = commitmentsFrom(state.rfqs, state.transactions).filter((c) => !isClosed(c.transaction));
  const freeBatches = state.batches.filter((b) => b.stage === "stockpile" && !b.transactionId);

  return (
    <div>
      <PageHeader
        title="Supply commitments"
        description="What you committed against buyer demand, how much material has been aggregated, and what remains to fulfil."
      />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active commitments" value={String(commitments.length)} />
        <StatCard label="Committed" value={tonnes(commitments.reduce((s, c) => s + c.committed, 0))} />
        <StatCard label="Aggregated" value={tonnes(commitments.reduce((s, c) => s + c.aggregated, 0))} />
        <StatCard label="Remaining" value={tonnes(commitments.reduce((s, c) => s + c.remaining, 0))} />
      </div>

      {commitments.length === 0 ? <EmptyState label="No active commitments, accept an RFQ to create one." /> : null}

      <div className="grid gap-4">
        {commitments.map((c) => (
          <Panel
            key={c.transaction.id}
            title={`${c.transaction.reference} — ${c.transaction.buyer}`}
            description={`${c.rfq?.reference ?? "RFQ"} · ${c.transaction.mineral} · ${c.transaction.incoterm}`}
            actions={<StageChip tx={c.transaction} />}
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
                    <span>{c.fulfilment}%</span>
                  </div>
                  <Bar pct={c.fulfilment} />
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  Value {usd(c.committed * c.transaction.unitPriceUsd)} · destination {c.transaction.destination} · view <TxLink tx={c.transaction} />
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
                        <Button size="sm" variant="outline" onClick={() => allocateBatch(c.transaction.id, b.id)}>
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
                {state.batches
                  .filter((b) => b.transactionId === c.transaction.id)
                  .map((b) => (
                    <tr key={b.id}>
                      <Td className="font-medium">{b.reference}</Td>
                      <Td>{b.mineral}</Td>
                      <Td>{tonnes(b.tonnes)}</Td>
                      <Td>{b.grade}</Td>
                      <Td>{b.stage.replace(/_/g, " ")}</Td>
                      <Td className="text-xs text-muted-foreground">{b.location}</Td>
                    </tr>
                  ))}
              </DataTable>
            </div>
          </Panel>
        ))}
      </div>
    </div>
  );
}
