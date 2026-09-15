import * as React from "react";

import {
  type EcosystemDashboard,
  type EcosystemRfq,
  type Transaction,
  type MaterialBatch,
  type LogisticsMove,
  type Commitment,
} from "@/lib/api/ecosystem";
import { type Invoice } from "@/lib/api/finance";
import {
  useEcosystemDashboard as useEcosystemDashboardQuery,
  useEcosystemRfqs as useEcosystemRfqsQuery,
  useTransactions as useTransactionsQuery,
  useBatches as useBatchesQuery,
  useLogisticsMoves as useLogisticsMovesQuery,
  useCommitments as useCommitmentsQuery,
} from "@/lib/api/ecosystem-queries";
import { useInvoices as useInvoicesQuery } from "@/lib/api/finance-queries";

// The Miner Hub's real-data equivalent of the prototype's `MinerProvider`.
// Every read here comes from the ecosystem/finance query hooks (backed by
// `/api/v1/ecosystem/` and `/api/v1/finance/`), not the prototype's static
// `ecosystem-data.ts` arrays. Site/production/inventory/equipment/compliance
// screens are intentionally NOT modeled here — they're served by the
// existing, already-real `mining` vertical (see routes under `/mining/*`),
// which the Hub shell links out to rather than re-implementing.

export type MinerHubData = {
  dashboard: EcosystemDashboard | undefined;
  rfqs: EcosystemRfq[];
  transactions: Transaction[];
  batches: MaterialBatch[];
  logisticsMoves: LogisticsMove[];
  commitments: Commitment[];
  invoices: Invoice[];
  isLoading: boolean;
};

const MinerHubContext = React.createContext<MinerHubData | null>(null);

export function MinerHubProvider({ children }: { children: React.ReactNode }) {
  const dashboardQuery = useEcosystemDashboardQuery();
  const rfqsQuery = useEcosystemRfqsQuery();
  const transactionsQuery = useTransactionsQuery();
  const batchesQuery = useBatchesQuery();
  const movesQuery = useLogisticsMovesQuery();
  const commitmentsQuery = useCommitmentsQuery();
  const invoicesQuery = useInvoicesQuery();

  const value = React.useMemo<MinerHubData>(
    () => ({
      dashboard: dashboardQuery.data,
      rfqs: rfqsQuery.data?.results ?? [],
      transactions: transactionsQuery.data?.results ?? [],
      batches: batchesQuery.data?.results ?? [],
      logisticsMoves: movesQuery.data?.results ?? [],
      commitments: commitmentsQuery.data?.results ?? [],
      invoices: invoicesQuery.data?.results ?? [],
      isLoading:
        dashboardQuery.isLoading ||
        rfqsQuery.isLoading ||
        transactionsQuery.isLoading,
    }),
    [
      dashboardQuery.data,
      dashboardQuery.isLoading,
      rfqsQuery.data,
      rfqsQuery.isLoading,
      transactionsQuery.data,
      transactionsQuery.isLoading,
      batchesQuery.data,
      movesQuery.data,
      commitmentsQuery.data,
      invoicesQuery.data,
    ],
  );

  return <MinerHubContext.Provider value={value}>{children}</MinerHubContext.Provider>;
}

export function useMinerHub(): MinerHubData {
  const ctx = React.useContext(MinerHubContext);
  if (!ctx) throw new Error("useMinerHub must be used inside MinerHubProvider");
  return ctx;
}

// --- shared formatting helpers, ported from the prototype's ecosystem-data ---

export function usd(value: number | string) {
  const n = typeof value === "string" ? Number(value) : value;
  return `USD ${Math.round(n).toLocaleString("en-US")}`;
}

export function tonnes(value: number | string) {
  const n = typeof value === "string" ? Number(value) : value;
  return `${n.toLocaleString("en-US")} t`;
}
