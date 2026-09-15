import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { PageHeader, StatCard } from "@/components/miner-shell";
import { Bar, DataTable, Panel, StageChip, StatusPill, Td, TxLink } from "@/components/ecosystem-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isClosed, stageProgress, tonnes, usd } from "@/lib/ecosystem-data";
import { useMiner } from "@/lib/miner-store";

export const Route = createFileRoute("/portal/transactions/")({ component: TransactionsPage });

function TransactionsPage() {
  const { state } = useMiner();
  const [q, setQ] = useState("");
  const [scope, setScope] = useState<"active" | "all" | "closed">("active");

  const rows = state.transactions
    .filter((tx) => (scope === "all" ? true : scope === "closed" ? isClosed(tx) : !isClosed(tx)))
    .filter((tx) => `${tx.reference} ${tx.buyer} ${tx.mineral}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <div>
      <PageHeader
        title="My transactions"
        description="Every accepted commitment as a live transaction from RFQ through to settlement."
      />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active transactions" value={String(state.transactions.filter((tx) => !isClosed(tx)).length)} />
        <StatCard label="Committed tonnage" value={tonnes(state.transactions.reduce((s, tx) => s + tx.committedTonnes, 0))} />
        <StatCard label="Total value" value={usd(state.transactions.reduce((s, tx) => s + tx.committedTonnes * tx.unitPriceUsd, 0))} />
        <StatCard
          label="Outstanding payments"
          value={usd(state.transactions.filter((tx) => tx.payment.status !== "paid").reduce((s, tx) => s + tx.payment.amountUsd, 0))}
        />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {(["active", "closed", "all"] as const).map((s) => (
          <Button key={s} size="sm" variant={scope === s ? "default" : "outline"} onClick={() => setScope(s)}>
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </Button>
        ))}
        <Input className="h-9 max-w-xs" placeholder="Search buyer, mineral, reference" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <Panel>
        <DataTable
          head={["Transaction", "Buyer", "Mineral", "Committed", "Aggregated", "Value", "Current stage", "Progress", "Payment"]}
        >
          {rows.map((tx) => (
            <tr key={tx.id}>
              <Td><TxLink tx={tx} /></Td>
              <Td>{tx.buyer}<div className="text-xs text-muted-foreground">{tx.destination}</div></Td>
              <Td>{tx.mineral}</Td>
              <Td>{tonnes(tx.committedTonnes)}</Td>
              <Td>{tonnes(tx.aggregatedTonnes)}</Td>
              <Td>{usd(tx.committedTonnes * tx.unitPriceUsd)}</Td>
              <Td><StageChip tx={tx} /></Td>
              <Td className="w-32"><Bar pct={stageProgress(tx)} /><div className="mt-1 text-xs text-muted-foreground">{stageProgress(tx)}%</div></Td>
              <Td><StatusPill value={tx.payment.status} /></Td>
            </tr>
          ))}
        </DataTable>
      </Panel>
    </div>
  );
}
