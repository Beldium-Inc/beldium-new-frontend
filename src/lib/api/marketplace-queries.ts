import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";

import {
  acceptRfqAggregation,
  addNonConformity,
  advanceNonConformity,
  autoAggregateRfq,
  createRfq,
  decideMarketplaceApplication,
  dispatchRfqNotifications,
  fetchMarketplaceCapabilities,
  getMarketplaceApplication,
  getRfq,
  listMarketplaceApplications,
  listMiners,
  listMarketplaceNotifications,
  listOrders,
  listRfqs,
  markMarketplaceNotificationRead,
  saveRfqServices,
  setRfqAllocation,
  submitRfqFinance,
  updateApplicationLimits,
  type AllocationState,
  type FinancePackage,
  type MarketplaceListQuery,
  type NewRfqInput,
  type OperatorActionKind,
  type TransactionServices,
} from "./marketplace";
import { useHasTokens } from "./queries";
import type { UUID } from "./types";

/**
 * Cache keys for the marketplace register. Everything hangs off one
 * "marketplace" root so a write can invalidate the whole vertical when its
 * ripple is wide — an application decision, for instance, moves the
 * application, the dashboard totals and the notification feed at once.
 */
export const marketplaceKeys = {
  root: ["marketplace"] as const,
  capabilities: ["marketplace", "capabilities"] as const,
  applications: (query: MarketplaceListQuery = {}) =>
    ["marketplace", "applications", query] as const,
  application: (id: UUID) => ["marketplace", "application", id] as const,
  miners: (query: MarketplaceListQuery = {}) => ["marketplace", "miners", query] as const,
  rfqs: (query: MarketplaceListQuery = {}) => ["marketplace", "rfqs", query] as const,
  rfq: (id: UUID) => ["marketplace", "rfq", id] as const,
  orders: (query: MarketplaceListQuery = {}) => ["marketplace", "orders", query] as const,
  notifications: (query: MarketplaceListQuery = {}) =>
    ["marketplace", "notifications", query] as const,
};

/** Lists are large and change slowly; a dashboard remount shouldn't refetch all of them. */
const LIST_STALE_TIME = 30_000;

// Every screen filters and totals client-side over the whole register, so a
// partial page would silently under-report.
const FULL_PAGE: MarketplaceListQuery = { page_size: 100 };

function invalidateMarketplace(queryClient: QueryClient): void {
  void queryClient.invalidateQueries({ queryKey: marketplaceKeys.root });
}

export function useMarketplaceCapabilities() {
  const hasTokens = useHasTokens();
  return useQuery({
    queryKey: marketplaceKeys.capabilities,
    queryFn: ({ signal }) => fetchMarketplaceCapabilities(signal),
    enabled: hasTokens,
    staleTime: 5 * 60_000,
    retry: false,
  });
}

export function useMarketplaceApplications(query: MarketplaceListQuery = FULL_PAGE) {
  const hasTokens = useHasTokens();
  return useQuery({
    queryKey: marketplaceKeys.applications(query),
    queryFn: () => listMarketplaceApplications(query),
    enabled: hasTokens,
    staleTime: LIST_STALE_TIME,
  });
}

export function useMarketplaceApplication(id: UUID | null) {
  return useQuery({
    queryKey: marketplaceKeys.application(id ?? "none"),
    queryFn: () => getMarketplaceApplication(id as UUID),
    enabled: Boolean(id),
  });
}

export function useMiners(query: MarketplaceListQuery = FULL_PAGE) {
  const hasTokens = useHasTokens();
  return useQuery({
    queryKey: marketplaceKeys.miners(query),
    queryFn: () => listMiners(query),
    enabled: hasTokens,
    staleTime: LIST_STALE_TIME,
  });
}

export function useRfqs(query: MarketplaceListQuery = FULL_PAGE) {
  const hasTokens = useHasTokens();
  return useQuery({
    queryKey: marketplaceKeys.rfqs(query),
    queryFn: () => listRfqs(query),
    enabled: hasTokens,
    staleTime: LIST_STALE_TIME,
  });
}

export function useRfq(id: UUID | null) {
  return useQuery({
    queryKey: marketplaceKeys.rfq(id ?? "none"),
    queryFn: () => getRfq(id as UUID),
    enabled: Boolean(id),
  });
}

export function useMarketplaceOrders(query: MarketplaceListQuery = FULL_PAGE) {
  const hasTokens = useHasTokens();
  return useQuery({
    queryKey: marketplaceKeys.orders(query),
    queryFn: () => listOrders(query),
    enabled: hasTokens,
    staleTime: LIST_STALE_TIME,
  });
}

export function useMarketplaceNotifications(query: MarketplaceListQuery = FULL_PAGE) {
  const hasTokens = useHasTokens();
  return useQuery({
    queryKey: marketplaceKeys.notifications(query),
    queryFn: () => listMarketplaceNotifications(query),
    enabled: hasTokens,
    staleTime: LIST_STALE_TIME,
  });
}

// --- mutations --------------------------------------------------------------

export function useDecideMarketplaceApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: UUID; action: OperatorActionKind; note?: string | undefined }) =>
      decideMarketplaceApplication(input.id, { action: input.action, note: input.note }),
    onSuccess: () => invalidateMarketplace(queryClient),
  });
}

export function useUpdateApplicationLimits() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: UUID; single: number; monthly: number }) =>
      updateApplicationLimits(input.id, {
        approved_single_txn_usd: input.single,
        approved_monthly_usd: input.monthly,
      }),
    onSuccess: () => invalidateMarketplace(queryClient),
  });
}

export function useAddNonConformity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      id: UUID;
      title: string;
      severity: "minor" | "major" | "critical";
      note?: string | undefined;
    }) =>
      addNonConformity(input.id, {
        title: input.title,
        severity: input.severity,
        note: input.note,
      }),
    onSuccess: () => invalidateMarketplace(queryClient),
  });
}

export function useAdvanceNonConformity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: UUID; ncId: UUID }) => advanceNonConformity(input.id, input.ncId),
    onSuccess: () => invalidateMarketplace(queryClient),
  });
}

export function useCreateRfq() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: NewRfqInput) => createRfq(input),
    onSuccess: () => invalidateMarketplace(queryClient),
  });
}

export function useAutoAggregateRfq() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: UUID) => autoAggregateRfq(id),
    onSuccess: () => invalidateMarketplace(queryClient),
  });
}

export function useSetRfqAllocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      id: UUID;
      miner: UUID;
      tonnes?: number | undefined;
      state?: AllocationState | undefined;
    }) =>
      setRfqAllocation(input.id, { miner: input.miner, tonnes: input.tonnes, state: input.state }),
    onSuccess: () => invalidateMarketplace(queryClient),
  });
}

export function useDispatchRfqNotifications() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: UUID) => dispatchRfqNotifications(id),
    onSuccess: () => invalidateMarketplace(queryClient),
  });
}

export function useAcceptRfqAggregation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: UUID) => acceptRfqAggregation(id),
    onSuccess: () => invalidateMarketplace(queryClient),
  });
}

export function useSaveRfqServices() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: UUID; services: TransactionServices }) =>
      saveRfqServices(input.id, input.services),
    onSuccess: () => invalidateMarketplace(queryClient),
  });
}

export function useSubmitRfqFinance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: UUID; pkg: FinancePackage }) => submitRfqFinance(input.id, input.pkg),
    onSuccess: () => invalidateMarketplace(queryClient),
  });
}

export function useMarkMarketplaceNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: UUID) => markMarketplaceNotificationRead(id),
    onSuccess: () => invalidateMarketplace(queryClient),
  });
}
