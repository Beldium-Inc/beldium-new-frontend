import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";

import {
  advanceTransactionStage,
  fetchEcosystemDashboard,
  getEcosystemRfq,
  getTransaction,
  listBatches,
  listCommitments,
  listEcosystemRfqs,
  listLogisticsMoves,
  listTransactions,
  updateBatch,
  updateEcosystemRfq,
  updateLogisticsMove,
  type EcosystemListQuery,
  type EcosystemRfq,
  type LifecycleStage,
  type LogisticsMove,
  type MaterialBatch,
} from "./ecosystem";
import { useHasTokens } from "./queries";
import type { UUID } from "./types";

export const ecosystemKeys = {
  root: ["ecosystem"] as const,
  dashboard: ["ecosystem", "dashboard"] as const,
  rfqs: (query: EcosystemListQuery = {}) => ["ecosystem", "rfqs", query] as const,
  rfq: (id: UUID) => ["ecosystem", "rfq", id] as const,
  transactions: (query: EcosystemListQuery = {}) => ["ecosystem", "transactions", query] as const,
  transaction: (id: UUID) => ["ecosystem", "transaction", id] as const,
  batches: (query: EcosystemListQuery = {}) => ["ecosystem", "batches", query] as const,
  moves: (query: EcosystemListQuery = {}) => ["ecosystem", "moves", query] as const,
  commitments: (query: EcosystemListQuery = {}) => ["ecosystem", "commitments", query] as const,
};

const LIST_STALE_TIME = 30_000;
const FULL_PAGE: EcosystemListQuery = { page_size: 100 };

function invalidateEcosystem(queryClient: QueryClient): void {
  void queryClient.invalidateQueries({ queryKey: ecosystemKeys.root });
}

export function useEcosystemDashboard() {
  const hasTokens = useHasTokens();
  return useQuery({
    queryKey: ecosystemKeys.dashboard,
    queryFn: ({ signal }) => fetchEcosystemDashboard(signal),
    enabled: hasTokens,
    staleTime: LIST_STALE_TIME,
  });
}

export function useEcosystemRfqs(query: EcosystemListQuery = FULL_PAGE) {
  const hasTokens = useHasTokens();
  return useQuery({
    queryKey: ecosystemKeys.rfqs(query),
    queryFn: () => listEcosystemRfqs(query),
    enabled: hasTokens,
    staleTime: LIST_STALE_TIME,
  });
}

export function useEcosystemRfq(id: UUID | null) {
  return useQuery({
    queryKey: ecosystemKeys.rfq(id ?? "none"),
    queryFn: () => getEcosystemRfq(id as UUID),
    enabled: Boolean(id),
  });
}

export function useTransactions(query: EcosystemListQuery = FULL_PAGE) {
  const hasTokens = useHasTokens();
  return useQuery({
    queryKey: ecosystemKeys.transactions(query),
    queryFn: () => listTransactions(query),
    enabled: hasTokens,
    staleTime: LIST_STALE_TIME,
  });
}

export function useTransaction(id: UUID | null) {
  return useQuery({
    queryKey: ecosystemKeys.transaction(id ?? "none"),
    queryFn: () => getTransaction(id as UUID),
    enabled: Boolean(id),
  });
}

export function useBatches(query: EcosystemListQuery = FULL_PAGE) {
  const hasTokens = useHasTokens();
  return useQuery({
    queryKey: ecosystemKeys.batches(query),
    queryFn: () => listBatches(query),
    enabled: hasTokens,
    staleTime: LIST_STALE_TIME,
  });
}

export function useLogisticsMoves(query: EcosystemListQuery = FULL_PAGE) {
  const hasTokens = useHasTokens();
  return useQuery({
    queryKey: ecosystemKeys.moves(query),
    queryFn: () => listLogisticsMoves(query),
    enabled: hasTokens,
    staleTime: LIST_STALE_TIME,
  });
}

export function useCommitments(query: EcosystemListQuery = FULL_PAGE) {
  const hasTokens = useHasTokens();
  return useQuery({
    queryKey: ecosystemKeys.commitments(query),
    queryFn: () => listCommitments(query),
    enabled: hasTokens,
    staleTime: LIST_STALE_TIME,
  });
}

// --- mutations --------------------------------------------------------------

export function useUpdateRfq() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: UUID; patch: Partial<EcosystemRfq> }) => updateEcosystemRfq(input.id, input.patch),
    onSuccess: () => invalidateEcosystem(queryClient),
  });
}

export function useAdvanceTransactionStage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: UUID; stage: LifecycleStage; note?: string | undefined }) =>
      advanceTransactionStage(input.id, { stage: input.stage, note: input.note }),
    onSuccess: () => invalidateEcosystem(queryClient),
  });
}

export function useUpdateBatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: UUID; patch: Partial<MaterialBatch> }) => updateBatch(input.id, input.patch),
    onSuccess: () => invalidateEcosystem(queryClient),
  });
}

export function useUpdateLogisticsMove() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: UUID; patch: Partial<LogisticsMove> }) =>
      updateLogisticsMove(input.id, input.patch),
    onSuccess: () => invalidateEcosystem(queryClient),
  });
}
