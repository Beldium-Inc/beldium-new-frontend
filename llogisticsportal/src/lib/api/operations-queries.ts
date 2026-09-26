import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { isDemoMode } from "../data-mode";
import {
  acceptTransportRequest,
  assignMovement,
  declineTransportRequest,
  getMovement,
  listIncidents,
  listInvoices,
  listMovements,
  listTransportRequests,
  runMovementAction,
  type OpsListQuery,
} from "./operations";
import { useHasTokens } from "./queries";
import type { UUID } from "./types";

// Hooks over the proposed operations contract (operations.ts). Disabled in demo
// mode, so a page can adopt them before the backend exists without firing
// requests at endpoints that 404.

export const opsKeys = {
  requests: (q: OpsListQuery = {}) => ["ops", "transport-requests", q] as const,
  movements: (q: OpsListQuery = {}) => ["ops", "movements", q] as const,
  movement: (id: UUID) => ["ops", "movements", "detail", id] as const,
  incidents: (q: OpsListQuery = {}) => ["ops", "incidents", q] as const,
  invoices: (q: OpsListQuery = {}) => ["ops", "invoices", q] as const,
};

function useLive() {
  return useHasTokens() && !isDemoMode;
}

export function useTransportRequests(query: OpsListQuery = {}) {
  const live = useLive();
  return useQuery({
    queryKey: opsKeys.requests(query),
    queryFn: () => listTransportRequests(query),
    enabled: live,
  });
}

export function useMovements(query: OpsListQuery = {}) {
  const live = useLive();
  return useQuery({
    queryKey: opsKeys.movements(query),
    queryFn: () => listMovements(query),
    enabled: live,
  });
}

export function useMovement(id: UUID | null) {
  const live = useLive();
  return useQuery({
    queryKey: opsKeys.movement(id ?? "none"),
    queryFn: () => getMovement(id as UUID),
    enabled: live && Boolean(id),
    refetchInterval: 15_000,
  });
}

export function useIncidents(query: OpsListQuery = {}) {
  const live = useLive();
  return useQuery({
    queryKey: opsKeys.incidents(query),
    queryFn: () => listIncidents(query),
    enabled: live,
  });
}

export function useInvoices(query: OpsListQuery = {}) {
  const live = useLive();
  return useQuery({
    queryKey: opsKeys.invoices(query),
    queryFn: () => listInvoices(query),
    enabled: live,
  });
}

function useOpsMutation<I, O>(fn: (input: I) => Promise<O>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["ops"] }),
  });
}

export const useAcceptTransportRequest = () =>
  useOpsMutation((id: UUID) => acceptTransportRequest(id));

export const useDeclineTransportRequest = () =>
  useOpsMutation((input: { id: UUID; reason: string }) =>
    declineTransportRequest(input.id, input.reason),
  );

export const useAssignMovement = () =>
  useOpsMutation((input: { id: UUID; vehicle: UUID; driver: UUID; pickup_at: string }) =>
    assignMovement(input.id, {
      vehicle: input.vehicle,
      driver: input.driver,
      pickup_at: input.pickup_at,
    }),
  );

export const useRunMovementAction = () =>
  useOpsMutation((input: { id: UUID; action: string; value?: number | undefined }) =>
    runMovementAction(input.id, { action: input.action, value: input.value }),
  );
