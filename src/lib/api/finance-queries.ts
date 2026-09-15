import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";

import {
  createInvoice,
  getInvoice,
  listInvoices,
  listPayments,
  recordPayment,
  updateInvoice,
  type Invoice,
  type FinanceListQuery,
  type NewInvoiceInput,
  type NewPaymentInput,
} from "./finance";
import { useHasTokens } from "./queries";
import type { UUID } from "./types";

export const financeKeys = {
  root: ["finance"] as const,
  invoices: (query: FinanceListQuery = {}) => ["finance", "invoices", query] as const,
  invoice: (id: UUID) => ["finance", "invoice", id] as const,
  payments: (query: FinanceListQuery = {}) => ["finance", "payments", query] as const,
};

const LIST_STALE_TIME = 30_000;
const FULL_PAGE: FinanceListQuery = { page_size: 100 };

function invalidateFinance(queryClient: QueryClient): void {
  void queryClient.invalidateQueries({ queryKey: financeKeys.root });
}

export function useInvoices(query: FinanceListQuery = FULL_PAGE) {
  const hasTokens = useHasTokens();
  return useQuery({
    queryKey: financeKeys.invoices(query),
    queryFn: () => listInvoices(query),
    enabled: hasTokens,
    staleTime: LIST_STALE_TIME,
  });
}

export function useInvoice(id: UUID | null) {
  return useQuery({
    queryKey: financeKeys.invoice(id ?? "none"),
    queryFn: () => getInvoice(id as UUID),
    enabled: Boolean(id),
  });
}

export function usePayments(query: FinanceListQuery = FULL_PAGE) {
  const hasTokens = useHasTokens();
  return useQuery({
    queryKey: financeKeys.payments(query),
    queryFn: () => listPayments(query),
    enabled: hasTokens,
    staleTime: LIST_STALE_TIME,
  });
}

export function useCreateInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: NewInvoiceInput) => createInvoice(input),
    onSuccess: () => invalidateFinance(queryClient),
  });
}

export function useUpdateInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: UUID; patch: Partial<Invoice> }) => updateInvoice(input.id, input.patch),
    onSuccess: () => invalidateFinance(queryClient),
  });
}

export function useRecordPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: NewPaymentInput) => recordPayment(input),
    onSuccess: () => invalidateFinance(queryClient),
  });
}
