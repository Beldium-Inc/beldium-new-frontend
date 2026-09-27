import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";

import { PageHeader } from "@/components/beldium/shell";
import { Panel, StatCard } from "@/components/beldium/stat-card";
import { StatusBadge } from "@/components/beldium/status-badge";
import { RowAction } from "@/components/beldium/data-table";
import { IdLink, QueueView, tabSearch } from "@/components/beldium/ops-ui";
import { fmt, invoiceAction, invoiceStatuses, naira, partyName, txnOf, useOps, type Invoice } from "@/lib/ops-store";

export const Route = createFileRoute("/portal/payments")({
  validateSearch: tabSearch,
  head: () => ({
    meta: [
      { title: "Payments - Beldium Logistics Hub" },
      { name: "description", content: "Logistics invoices from completed deliveries through submission and settlement." },
      { property: "og:title", content: "Payments - Beldium Logistics Hub" },
      { property: "og:description", content: "Invoice and payment state for every completed Beldium movement." },
    ],
  }),
  component: Page,
});

const next: Partial<Record<Invoice["status"], { label: string; a: Parameters<typeof invoiceAction>[1] }[]>> = {
  "Not Invoiced": [{ label: "Generate Invoice", a: "generate" }],
  "Invoice Generated": [{ label: "Submit", a: "submit" }],
  Submitted: [{ label: "Buyer Acknowledges", a: "buyerAck" }],
  Pending: [
    { label: "Record Part Payment", a: "partPay" },
    { label: "Record Payment", a: "pay" },
  ],
  "Partially Paid": [{ label: "Record Balance", a: "pay" }],
};

function Page() {
  const s = useOps();
  const { tab } = Route.useSearch();
  const total = s.invoices.reduce((a, i) => a + i.amount, 0);
  const paid = s.invoices.reduce((a, i) => a + i.paid, 0);
  return (
    <>
      <PageHeader title="Payments" />
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Invoiced value" value={naira(total)} tone="primary" />
        <StatCard label="Received" value={naira(paid)} tone="success" />
        <StatCard label="Outstanding" value={naira(total - paid)} tone="warning" />
        <StatCard label="Ready to invoice" value={String(s.invoices.filter((i) => i.status === "Not Invoiced").length)} tone="accent" />
      </div>
      <Panel title="Invoices">
        <QueueView
          rows={s.invoices}
          getKey={(i) => i.id}
          initialTab={tab ?? "Not Invoiced"}
          tabs={[{ label: "All", test: () => true }, ...invoiceStatuses.map((st) => ({ label: st, test: (i: Invoice) => i.status === st }))]}
          columns={[
            { key: "id", header: "Invoice", render: (i) => <span className="font-semibold text-primary">{i.id}</span>, sort: (i) => i.id },
            { key: "mov", header: "Movement", render: (i) => <IdLink kind="movement" id={i.movementId} /> },
            { key: "txn", header: "Transaction", render: (i) => <IdLink kind="transaction" id={i.txnId} /> },
            { key: "buyer", header: "Payer", render: (i) => partyName(s, txnOf(s, i.txnId)?.buyerId) },
            { key: "amt", header: "Amount", render: (i) => naira(i.amount), sort: (i) => i.amount },
            { key: "paid", header: "Paid", render: (i) => naira(i.paid), sort: (i) => i.paid },
            { key: "upd", header: "Updated", render: (i) => fmt(i.updatedAt), sort: (i) => i.updatedAt },
            { key: "status", header: "Status", render: (i) => <StatusBadge value={i.status} /> },
          ]}
          searchText={(i) => `${i.id} ${i.movementId} ${i.txnId} ${partyName(s, txnOf(s, i.txnId)?.buyerId)}`}
          filters={[{ label: "Payer", get: (i) => partyName(s, txnOf(s, i.txnId)?.buyerId) }]}
          actions={(i) =>
            (next[i.status] ?? []).map((n) => (
              <RowAction
                key={n.a}
                onClick={() => {
                  invoiceAction(i.id, n.a);
                  toast.success(`${i.id}: ${n.label}`);
                }}
              >
                {n.label}
              </RowAction>
            ))
          }
        />
      </Panel>
    </>
  );
}
