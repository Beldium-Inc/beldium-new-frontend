import { createFileRoute, useNavigate } from "@tanstack/react-router";

import {
  ResourceTable,
  SearchBox,
  naira,
  useListQuery,
  type Column,
} from "@/components/beldium/ops";
import { PageHeader } from "@/components/beldium/shell";
import { Panel } from "@/components/beldium/stat-card";
import { StatusBadge } from "@/components/beldium/status-badge";
import { listTransactions, type LogisticsTransaction } from "@/lib/api/operations";
import { useOpsList } from "@/lib/api/operations-queries";

export const Route = createFileRoute("/portal/transactions")({
  head: () => ({ meta: [{ title: "Transactions - Beldium Logistics Hub" }] }),
  component: TransactionsPage,
});

const columns: Column<LogisticsTransaction>[] = [
  {
    header: "Transaction",
    cell: (t) => <span className="font-medium text-primary">{t.transaction_id}</span>,
  },
  { header: "RFQ", cell: (t) => t.rfq_id || "-" },
  { header: "Material", cell: (t) => `${t.material} · ${t.quantity} ${t.quantity_unit}` },
  { header: "Miner → buyer", cell: (t) => `${t.miner} → ${t.buyer}` },
  { header: "Stage", cell: (t) => t.stage },
  { header: "Delivery", cell: (t) => <StatusBadge value={t.delivery_status} /> },
  { header: "Payment", cell: (t) => <StatusBadge value={t.payment_status} /> },
  { header: "Transport fee", cell: (t) => naira(t.transport_fee) },
];

function TransactionsPage() {
  const navigate = useNavigate();
  const list = useListQuery();
  const transactions = useOpsList("transactions", listTransactions, list.query);

  return (
    <>
      <PageHeader
        title="Transactions"
        description="Marketplace transactions your company is moving, with delivery and payment progress."
      />
      <Panel title="Transaction register">
        <div className="space-y-4">
          <SearchBox
            value={list.search}
            onChange={list.setSearch}
            placeholder="Transaction, RFQ, origin, destination"
          />
          <ResourceTable
            columns={columns}
            data={transactions.data}
            isLoading={transactions.isLoading}
            error={transactions.error}
            page={list.page}
            onPage={list.setPage}
            onRowClick={(t) =>
              navigate({ to: "/portal/transactions/$txnId", params: { txnId: t.id } })
            }
            empty="No transactions yet."
          />
        </div>
      </Panel>
    </>
  );
}
