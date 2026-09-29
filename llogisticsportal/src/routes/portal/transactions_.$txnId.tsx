import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

import {
  FieldGrid,
  ResourceTable,
  errorMessage,
  fmtDate,
  fmtDateTime,
  naira,
  type Column,
  withResults,
} from "@/components/beldium/ops";
import { PageHeader } from "@/components/beldium/shell";
import { Panel } from "@/components/beldium/stat-card";
import { StatusBadge } from "@/components/beldium/status-badge";
import {
  listPayments,
  listQualityRecords,
  type LogisticsPayment,
  type QualityRecord,
} from "@/lib/api/operations";
import { useOpsList, useTransaction } from "@/lib/api/operations-queries";

export const Route = createFileRoute("/portal/transactions_/$txnId")({
  head: () => ({ meta: [{ title: "Transaction - Beldium Logistics Hub" }] }),
  component: TransactionPage,
});

const paymentColumns: Column<LogisticsPayment>[] = [
  { header: "Payment", cell: (p) => p.reference },
  { header: "Invoice", cell: (p) => p.invoice_reference || "-" },
  { header: "Due", cell: (p) => naira(p.due_amount) },
  { header: "Paid", cell: (p) => naira(p.paid_amount) },
  { header: "Outstanding", cell: (p) => naira(p.outstanding_amount) },
  { header: "Status", cell: (p) => <StatusBadge value={p.status} /> },
  { header: "Paid on", cell: (p) => fmtDate(p.payment_date) },
];

const qualityColumns: Column<QualityRecord>[] = [
  { header: "Sample", cell: (q) => q.sample_status },
  { header: "Result", cell: (q) => q.result || "-" },
  { header: "Approval", cell: (q) => <StatusBadge value={q.approval} /> },
  { header: "Handling", cell: (q) => q.handling || "-" },
  { header: "Certificate", cell: (q) => q.certificate || "-" },
  { header: "Buyer acceptance", cell: (q) => q.buyer_acceptance || "-" },
];

function TransactionPage() {
  const { txnId } = Route.useParams();
  const txn = useTransaction(txnId);
  const t = txn.data;
  // Payments can only be searched by transaction id, not filtered by it.
  const payments = useOpsList(
    "payments",
    listPayments,
    { search: t?.transaction_id },
    { enabled: Boolean(t) },
  );
  const quality = useOpsList(
    "quality-records",
    listQualityRecords,
    { transaction_id: t?.transaction_id },
    { enabled: Boolean(t) },
  );

  if (txn.isLoading) return <p className="text-sm text-muted-foreground">Loading transaction…</p>;
  if (txn.error || !t)
    return (
      <p className="text-sm text-destructive">
        {errorMessage(txn.error, "Could not load this transaction.")}
      </p>
    );

  const linkedPayments = payments.data
    ? withResults(
        payments.data,
        payments.data.results.filter((p) => p.transaction === t.id),
      )
    : undefined;

  return (
    <>
      <Link
        to="/portal/transactions"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Transactions
      </Link>
      <PageHeader
        title={t.transaction_id}
        description={`${t.material} · ${t.origin} → ${t.destination}`}
        actions={<StatusBadge value={t.stage} />}
      />
      <div className="space-y-4">
        <Panel title="Transaction">
          <FieldGrid
            items={[
              ["RFQ", t.rfq_id],
              ["Miner", t.miner],
              ["Buyer", t.buyer],
              ["Quantity", `${t.quantity} ${t.quantity_unit}`],
              ["Transport fee", naira(t.transport_fee)],
              ["Delivery status", t.delivery_status],
              ["Payment status", t.payment_status],
              [
                "Movement",
                t.movement ? (
                  <Link
                    to="/portal/movements/$movementId"
                    params={{ movementId: t.movement }}
                    className="text-primary hover:underline"
                  >
                    {t.movement_reference}
                  </Link>
                ) : (
                  "-"
                ),
              ],
              ["Opened", fmtDateTime(t.created_at)],
            ]}
          />
        </Panel>
        <Panel title="Quality">
          <ResourceTable
            columns={qualityColumns}
            data={quality.data}
            isLoading={quality.isLoading}
            error={quality.error}
            empty="No quality records for this transaction."
          />
        </Panel>
        <Panel title="Payments">
          <ResourceTable
            columns={paymentColumns}
            data={linkedPayments}
            isLoading={payments.isLoading}
            error={payments.error}
            empty="No payments recorded."
          />
        </Panel>
      </div>
    </>
  );
}
