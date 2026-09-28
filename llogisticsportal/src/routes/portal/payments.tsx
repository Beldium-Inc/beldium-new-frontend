import { createFileRoute, Link } from "@tanstack/react-router";

import {
  ResourceTable,
  SearchBox,
  fmtDate,
  naira,
  useListQuery,
  type Column,
} from "@/components/beldium/ops";
import { PageHeader } from "@/components/beldium/shell";
import { Panel, StatCard } from "@/components/beldium/stat-card";
import { StatusBadge } from "@/components/beldium/status-badge";
import { listPayments, type LogisticsPayment } from "@/lib/api/operations";
import { useOperationsDashboard, useOpsList } from "@/lib/api/operations-queries";

export const Route = createFileRoute("/portal/payments")({
  head: () => ({ meta: [{ title: "Payments - Beldium Logistics Hub" }] }),
  component: PaymentsPage,
});

const columns: Column<LogisticsPayment>[] = [
  { header: "Payment", cell: (p) => <span className="font-medium">{p.reference}</span> },
  { header: "Invoice", cell: (p) => p.invoice_reference || "-" },
  {
    header: "Transaction",
    cell: (p) =>
      p.transaction ? (
        <Link
          to="/portal/transactions/$txnId"
          params={{ txnId: p.transaction }}
          className="text-primary hover:underline"
        >
          {p.transaction_id}
        </Link>
      ) : (
        "-"
      ),
  },
  { header: "Movement", cell: (p) => p.movement_reference ?? "-" },
  { header: "Job value", cell: (p) => naira(p.job_value) },
  { header: "Due", cell: (p) => naira(p.due_amount) },
  { header: "Paid", cell: (p) => naira(p.paid_amount) },
  {
    header: "Outstanding",
    cell: (p) => (
      <span className={Number(p.outstanding_amount) > 0 ? "font-medium text-destructive" : ""}>
        {naira(p.outstanding_amount)}
      </span>
    ),
  },
  { header: "Status", cell: (p) => <StatusBadge value={p.status} /> },
  { header: "Paid on", cell: (p) => fmtDate(p.payment_date) },
];

function PaymentsPage() {
  const list = useListQuery();
  const payments = useOpsList("payments", listPayments, list.query);
  const stats = useOperationsDashboard().data?.stats;

  return (
    <>
      <PageHeader
        title="Payments"
        description="Transport fees owed to your company and what has been paid."
      />
      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <StatCard
          label="Outstanding"
          value={naira(stats?.outstanding_payments)}
          tone="danger"
          hint="Due minus paid, all jobs"
        />
        <StatCard
          label="Tonnes moved"
          value={Number(stats?.tonnes_moved ?? 0).toLocaleString()}
          hint="Across all movements"
        />
      </div>
      <Panel title="Payment register">
        <div className="space-y-4">
          <SearchBox
            value={list.search}
            onChange={list.setSearch}
            placeholder="Payment, invoice, transaction, movement"
          />
          <ResourceTable
            columns={columns}
            data={payments.data}
            isLoading={payments.isLoading}
            error={payments.error}
            page={list.page}
            onPage={list.setPage}
            empty="No payments yet."
          />
        </div>
      </Panel>
    </>
  );
}
