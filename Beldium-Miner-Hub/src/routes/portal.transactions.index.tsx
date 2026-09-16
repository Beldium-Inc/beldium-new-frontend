import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { PageHeader, StatCard } from "@/components/miner-shell";
import { Bar, DataTable, Panel, StageChip, Td, TxLink } from "@/components/ecosystem-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTransactions } from "@/lib/api/ecosystem-queries";

function tonnes(v: number): string {
  return `${v.toLocaleString(undefined, { maximumFractionDigits: 1 })} t`;
}
function usd(v: number): string {
  return `$${v.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

export const Route = createFileRoute("/portal/transactions/")({ component: TransactionsPage });

function TransactionsPage() {
  const transactionsQuery = useTransactions();
  const [q, setQ] = useState("");
  const [scope, setScope] = useState<"active" | "all" | "closed">("active");

  const all = Array.isArray(transactionsQuery.data) ? transactionsQuery.data : (transactionsQuery.data?.results ?? []);
  const rows = all
    .filter((tx) => (scope === "all" ? true : scope === "closed" ? tx.is_closed : !tx.is_closed))
    .filter((tx) => `${tx.reference} ${tx.buyer_name} ${tx.mineral}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <div>
      <PageHeader
        title="My transactions"
        description="Every accepted commitment as a live transaction from RFQ through to settlement."
      />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active transactions" value={String(all.filter((tx) => !tx.is_closed).length)} />
        <StatCard label="Committed tonnage" value={tonnes(all.reduce((s, tx) => s + tx.committed_tonnes, 0))} />
        <StatCard label="Total value" value={usd(all.reduce((s, tx) => s + tx.value, 0))} />
        <StatCard label="Closed" value={String(all.filter((tx) => tx.is_closed).length)} />
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
        <DataTable head={["Transaction", "Buyer", "Mineral", "Committed", "Aggregated", "Value", "Current stage", "Progress"]}>
          {rows.map((tx) => (
            <tr key={tx.id}>
              <Td><TxLink id={tx.id} reference={tx.reference} /></Td>
              <Td>{tx.buyer_name}<div className="text-xs text-muted-foreground">{tx.destination}</div></Td>
              <Td>{tx.mineral}</Td>
              <Td>{tonnes(tx.committed_tonnes)}</Td>
              <Td>{tonnes(tx.aggregated_tonnes)}</Td>
              <Td>{usd(tx.value)}</Td>
              <Td><StageChip stage={tx.stage} /></Td>
              <Td className="w-32"><Bar pct={tx.progress_percent} /><div className="mt-1 text-xs text-muted-foreground">{tx.progress_percent}%</div></Td>
            </tr>
          ))}
        </DataTable>
      </Panel>
    </div>
  );
}
