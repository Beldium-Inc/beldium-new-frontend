import { createFileRoute } from "@tanstack/react-router";

import { PageHeader, StatCard } from "@/components/miner-shell";
import { Bar, DataTable, EmptyState, Panel, StatusPill, Td, TxLink } from "@/components/ecosystem-ui";
import { Button } from "@/components/ui/button";

import { financeRows, usd } from "@/lib/ecosystem-data";
import { useMiner } from "@/lib/miner-store";

export const Route = createFileRoute("/portal/finance")({ component: FinancePage });

function FinancePage() {
  const { state, advanceTransaction, recordSettlement } = useMiner();
  void advanceTransaction;
  const rows = financeRows(state.transactions);
  return (
    <div>
      <PageHeader title="Finance & payments" description="Invoices, advances, settlement timing and outstanding balances for every transaction." />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Outstanding" value={usd(rows.filter((r) => r.pay.status !== "paid").reduce((s, r) => s + r.pay.amountUsd, 0))} />
        <StatCard label="Settled" value={usd(rows.filter((r) => r.pay.status === "paid").reduce((s, r) => s + r.pay.amountUsd, 0))} />
        <StatCard label="Invoices" value={String(rows.length)} />
      </div>
      <Panel title="Invoices & settlement">
        {rows.length === 0 ? <EmptyState label="No invoices yet." /> : (
        <DataTable head={["Invoice", "Transaction", "Buyer", "Amount", "Advance", "Due", "Paid", "Status", ""]}>
          {rows.map(({ tx, pay }) => (
            <tr key={pay.invoiceRef}>
              <Td className="font-medium">{pay.invoiceRef}</Td>
              <Td><TxLink tx={tx} /></Td>
              <Td>{tx.buyer}</Td>
              <Td>{usd(pay.amountUsd)}</Td>
              <Td>{pay.advancePct}%</Td>
              <Td className="text-xs">{pay.dueAt}</Td>
              <Td className="text-xs">{pay.paidAt ?? "—"}</Td>
              <Td><StatusPill value={pay.status} /></Td>
              <Td>{pay.status !== "paid" ? <Button size="sm" variant="outline" onClick={() => recordSettlement(tx.id)}>Record settlement</Button> : null}</Td>
            </tr>
          ))}
        </DataTable>)}
      </Panel>
    </div>
  );
}
