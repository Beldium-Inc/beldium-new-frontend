import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useHasTokens } from "./queries";
import type { UUID } from "./types";
import {
  acceptRfq,
  advanceTransactionStage,
  allocateToCommitment,
  createMaterialBatch,
  declineRfq,
  fetchDashboard,
  getRfq,
  getTransaction,
  listCommitments,
  listLogisticsMoves,
  listMaterialBatches,
  listRfqs,
  listTransactions,
  patchTransaction,
  type Commitment,
  type LifecycleStage,
  type RfqStatus,
} from "./ecosystem";

export const ecosystemKeys = {
  dashboard: ["ecosystem", "dashboard"] as const,
  rfqs: (status?: RfqStatus) => ["ecosystem", "rfqs", status ?? "all"] as const,
  rfq: (id: UUID) => ["ecosystem", "rfqs", "detail", id] as const,
  transactions: ["ecosystem", "transactions"] as const,
  transaction: (id: UUID) => ["ecosystem", "transactions", "detail", id] as const,
  batches: ["ecosystem", "batches"] as const,
  logisticsMoves: ["ecosystem", "logistics-moves"] as const,
  commitments: ["ecosystem", "commitments"] as const,
};

export function useEcosystemDashboard() {
  const hasTokens = useHasTokens();
  return useQuery({
    queryKey: ecosystemKeys.dashboard,
    queryFn: ({ signal }) => fetchDashboard(signal),
    enabled: hasTokens,
  });
}

export function useRfqs(status?: RfqStatus) {
  const hasTokens = useHasTokens();
  return useQuery({
    queryKey: ecosystemKeys.rfqs(status),
    queryFn: () => listRfqs(status ? { status } : {}),
    enabled: hasTokens,
  });
}

export function useRfq(id: UUID | null) {
  return useQuery({
    queryKey: ecosystemKeys.rfq(id ?? "none"),
    queryFn: () => getRfq(id as UUID),
    enabled: Boolean(id),
  });
}

export function useAcceptRfq() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: UUID; committedQuantity: number }) =>
      acceptRfq(input.id, input.committedQuantity),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["ecosystem", "rfqs"] });
      void queryClient.invalidateQueries({ queryKey: ecosystemKeys.transactions });
    },
  });
}

export function useDeclineRfq() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: UUID) => declineRfq(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["ecosystem", "rfqs"] }),
  });
}

export function useTransactions() {
  const hasTokens = useHasTokens();
  return useQuery({ queryKey: ecosystemKeys.transactions, queryFn: listTransactions, enabled: hasTokens });
}

export function useTransaction(id: UUID | null) {
  return useQuery({
    queryKey: ecosystemKeys.transaction(id ?? "none"),
    queryFn: () => getTransaction(id as UUID),
    enabled: Boolean(id),
  });
}

export function useAdvanceTransactionStage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: UUID; stage: LifecycleStage; note?: string }) =>
      advanceTransactionStage(input.id, input.stage, input.note),
    onSuccess: (transaction) => {
      queryClient.setQueryData(ecosystemKeys.transaction(transaction.id), transaction);
      void queryClient.invalidateQueries({ queryKey: ecosystemKeys.transactions });
      void queryClient.invalidateQueries({ queryKey: ecosystemKeys.dashboard });
    },
  });
}

export function useRecordSettlement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: UUID) => advanceTransactionStage(id, "payment_settlement", "Settlement recorded"),
    onSuccess: (transaction) => {
      queryClient.setQueryData(ecosystemKeys.transaction(transaction.id), transaction);
      void queryClient.invalidateQueries({ queryKey: ecosystemKeys.transactions });
      void queryClient.invalidateQueries({ queryKey: ecosystemKeys.dashboard });
    },
  });
}

export function usePatchTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: UUID; patch: Record<string, unknown> }) =>
      patchTransaction(input.id, input.patch),
    onSuccess: (transaction) => {
      queryClient.setQueryData(ecosystemKeys.transaction(transaction.id), transaction);
      void queryClient.invalidateQueries({ queryKey: ecosystemKeys.transactions });
    },
  });
}

export function useMaterialBatches() {
  const hasTokens = useHasTokens();
  return useQuery({ queryKey: ecosystemKeys.batches, queryFn: listMaterialBatches, enabled: hasTokens });
}

export function useCreateMaterialBatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createMaterialBatch,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ecosystemKeys.batches }),
  });
}

export function useLogisticsMoves() {
  const hasTokens = useHasTokens();
  return useQuery({
    queryKey: ecosystemKeys.logisticsMoves,
    queryFn: listLogisticsMoves,
    enabled: hasTokens,
  });
}

export function useCommitments() {
  const hasTokens = useHasTokens();
  return useQuery({ queryKey: ecosystemKeys.commitments, queryFn: listCommitments, enabled: hasTokens });
}

export function useAllocateToCommitment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { commitment: Commitment; additionalTonnes: number }) =>
      allocateToCommitment(input.commitment, input.additionalTonnes),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ecosystemKeys.commitments });
      void queryClient.invalidateQueries({ queryKey: ecosystemKeys.transactions });
    },
  });
}
