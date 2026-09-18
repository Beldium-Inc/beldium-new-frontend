import { createFileRoute } from "@tanstack/react-router";

import { PageHeader, StatCard } from "@/components/miner-shell";
import { DataTable, EmptyState, Panel, StatusPill, Td } from "@/components/ecosystem-ui";
import { useInvoices } from "@/lib/api/finance-queries";

function usd(v: number): string {
  return `$${v.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

export const Route = createFileRoute("/portal/finance")({ component: FinancePage });

function FinancePage() {
  const invoicesQuery = useInvoices();
  const rows = Array.isArray(invoicesQuery.data) ? invoicesQuery.data : (invoicesQuery.data?.results ?? []);

  return (
    <div>
      <PageHeader title="Finance & payments" description="Invoices, advances, settlement timing and outstanding balances." />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Outstanding" value={usd(rows.reduce((s, r) => s + r.amount_outstanding, 0))} />
        <StatCard label="Paid to date" value={usd(rows.reduce((s, r) => s + r.amount_paid, 0))} />
        <StatCard label="Invoices" value={String(rows.length)} />
      </div>
      <Panel title="Invoices & settlement">
        {rows.length === 0 ? (
          <EmptyState label="No invoices yet." />
        ) : (
          <DataTable head={["Transaction ref", "Amount", "Advance", "Due", "Paid", "Outstanding", "Status"]}>
            {rows.map((inv) => (
              <tr key={inv.id}>
                <Td className="font-medium">{inv.transaction_reference}</Td>
                <Td>{usd(inv.amount)}</Td>
                <Td>{inv.advance_percent}%</Td>
                <Td className="text-xs">{inv.due_at ?? "-"}</Td>
                <Td className="text-xs">{inv.paid_at ?? "-"}</Td>
                <Td>{usd(inv.amount_outstanding)}</Td>
                <Td><StatusPill value={inv.status} /></Td>
              </tr>
            ))}
          </DataTable>
        )}
      </Panel>
    </div>
  );
}
