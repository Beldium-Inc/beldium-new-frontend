import { useQuery } from "@tanstack/react-query";

import { useHasTokens } from "./queries";
import { listInvoices, listPayments } from "./finance";

export const financeKeys = {
  invoices: ["finance", "invoices"] as const,
  payments: ["finance", "payments"] as const,
};

export function useInvoices() {
  const hasTokens = useHasTokens();
  return useQuery({ queryKey: financeKeys.invoices, queryFn: listInvoices, enabled: hasTokens });
}

export function usePayments() {
  const hasTokens = useHasTokens();
  return useQuery({ queryKey: financeKeys.payments, queryFn: listPayments, enabled: hasTokens });
}
