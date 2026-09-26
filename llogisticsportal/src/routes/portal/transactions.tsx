import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { PageHeader } from "@/components/beldium/shell";
import { Panel } from "@/components/beldium/stat-card";
import { StatusBadge } from "@/components/beldium/status-badge";
import { IdLink, QueueView, tabSearch } from "@/components/beldium/ops-ui";
import { naira, partyName, siteName, useOps, type Transaction } from "@/lib/ops-store";

export const Route = createFileRoute("/portal/transactions")({
  validateSearch: tabSearch,
  head: () => ({
    meta: [
      { title: "Transactions - Beldium Logistics Hub" },
      { name: "description", content: "Every RFQ and transaction with buyer, miner, mine, batch, quantity, origin and destination." },
      { property: "og:title", content: "Transactions - Beldium Logistics Hub" },
      { property: "og:description", content: "The shared Beldium transaction chain behind every movement." },
    ],
  }),
  component: Page,
});

const done = (t: Transaction) => t.stage === "Logistics Completed";

function Page() {
  const s = useOps();
  const { tab } = Route.useSearch();
  const navigate = useNavigate();
  return (
    <>
      <PageHeader title="Transactions" />
      <Panel title="Transaction Register">
        <QueueView
          rows={s.transactions}
          getKey={(t) => t.id}
          initialTab={tab ?? "Open"}
          tabs={[
            { label: "Open", test: (t) => !done(t) },
            { label: "Quality Pending", test: (t) => t.quality !== "Buyer accepted" },
            { label: "In Movement", test: (t) => s.movements.some((m) => m.txnId === t.id && m.stage !== "Completed") },
            { label: "Completed", test: done },
            { label: "All", test: () => true },
          ]}
          columns={[
            { key: "id", header: "Transaction", render: (t) => <IdLink kind="transaction" id={t.id} />, sort: (t) => t.id },
            { key: "rfq", header: "RFQ", render: (t) => <span className="beldium-mono">{t.rfqId}</span> },
            { key: "buyer", header: "Buyer", render: (t) => partyName(s, t.buyerId), sort: (t) => partyName(s, t.buyerId) },
            { key: "miner", header: "Miner", render: (t) => partyName(s, t.minerId) },
            { key: "mine", header: "Mine", render: (t) => siteName(s, t.mineId) },
            { key: "batch", header: "Batch", render: (t) => <span className="beldium-mono">{t.batchId}</span> },
            { key: "mineral", header: "Mineral", render: (t) => t.mineral },
            { key: "qty", header: "Quantity", render: (t) => `${t.quantity} t`, sort: (t) => t.quantity },
            { key: "dest", header: "Destination", render: (t) => siteName(s, t.destinationId) },
            { key: "moves", header: "Movements", render: (t) => s.movements.filter((m) => m.txnId === t.id).length },
            { key: "value", header: "Value", render: (t) => naira(t.quantity * t.unitPrice), sort: (t) => t.quantity * t.unitPrice },
            { key: "quality", header: "Quality", render: (t) => <StatusBadge value={t.quality} /> },
            { key: "stage", header: "Stage", render: (t) => <StatusBadge value={t.stage} />, sort: (t) => t.stage },
          ]}
          searchText={(t) => `${t.id} ${t.rfqId} ${t.batchId} ${t.mineral} ${partyName(s, t.buyerId)} ${partyName(s, t.minerId)}`}
          filters={[
            { label: "Buyer", get: (t) => partyName(s, t.buyerId) },
            { label: "Miner", get: (t) => partyName(s, t.minerId) },
            { label: "Mineral", get: (t) => t.mineral },
          ]}
          onOpen={(t) => navigate({ to: "/portal/transactions/$txnId", params: { txnId: t.id } })}
        />
      </Panel>
    </>
  );
}
