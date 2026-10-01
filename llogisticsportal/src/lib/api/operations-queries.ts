import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  acceptTransportRequest,
  declineTransportRequest,
  assignMovement,
  completeActionItem,
  completeDelivery,
  fetchOperationsDashboard,
  getMovement,
  getTransaction,
  getTransportRequest,
  markEventRead,
  reportIncident,
  resolveIncident,
  setMovementStatus,
  updateFinding,
  uploadOperationsDocument,
  type ComplianceFindingStatus,
  type MovementStatusInput,
  type NewIncidentInput,
  type NewOperationsDocumentInput,
  type OpsListQuery,
} from "./operations";
import { useHasTokens } from "./queries";
import type { Paginated, UUID } from "./types";

// Every operations record lives under the "ops" key, so any mutation can
// refresh the whole workspace with one invalidation: records are linked
// (a movement status change moves the dashboard, deliveries and payments).

export const opsKeys = {
  all: ["ops"] as const,
  list: (resource: string, query: OpsListQuery) => ["ops", resource, "list", query] as const,
  detail: (resource: string, id: UUID) => ["ops", resource, "detail", id] as const,
  dashboard: ["ops", "dashboard"] as const,
};

/** A paginated list from any operations endpoint, keyed by resource name. */
export function useOpsList<T>(
  resource: string,
  fetcher: (query: OpsListQuery) => Promise<Paginated<T>>,
  query: OpsListQuery = {},
  options: { enabled?: boolean; refetchInterval?: number } = {},
) {
  const hasTokens = useHasTokens();
  return useQuery({
    queryKey: opsKeys.list(resource, query),
    queryFn: () => fetcher(query),
    enabled: hasTokens && (options.enabled ?? true),
    placeholderData: keepPreviousData,
    ...(options.refetchInterval ? { refetchInterval: options.refetchInterval } : {}),
  });
}

export function useOperationsDashboard(options: { enabled?: boolean } = {}) {
  const hasTokens = useHasTokens();
  return useQuery({
    queryKey: opsKeys.dashboard,
    queryFn: ({ signal }) => fetchOperationsDashboard(signal),
    enabled: hasTokens && (options.enabled ?? true),
    refetchInterval: 30_000,
  });
}

export function useTransportRequest(id: UUID) {
  return useQuery({
    queryKey: opsKeys.detail("transport-requests", id),
    queryFn: () => getTransportRequest(id),
  });
}

export function useMovement(id: UUID) {
  return useQuery({
    queryKey: opsKeys.detail("movements", id),
    queryFn: () => getMovement(id),
    // Live position and status while the movement is on the road.
    refetchInterval: 20_000,
  });
}

export function useTransaction(id: UUID) {
  return useQuery({
    queryKey: opsKeys.detail("transactions", id),
    queryFn: () => getTransaction(id),
  });
}

export function useOpsMutation<I, O>(fn: (input: I) => Promise<O>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: opsKeys.all }),
  });
}

export const useAcceptTransportRequest = () =>
  useOpsMutation((id: UUID) => acceptTransportRequest(id));

export const useAssignMovement = () =>
  useOpsMutation((input: { id: UUID; vehicle?: UUID | undefined; driver?: UUID | undefined }) =>
    assignMovement(input.id, { vehicle: input.vehicle, driver: input.driver }),
  );

export const useSetMovementStatus = () =>
  useOpsMutation((input: { id: UUID } & MovementStatusInput) => {
    const { id, ...body } = input;
    return setMovementStatus(id, body);
  });

export const useCompleteDelivery = () =>
  useOpsMutation(
    (input: { id: UUID; received_quantity: string; receipt_reference?: string | undefined }) =>
      completeDelivery(input.id, {
        received_quantity: input.received_quantity,
        receipt_reference: input.receipt_reference,
      }),
  );

export const useReportIncident = () =>
  useOpsMutation((input: NewIncidentInput) => reportIncident(input));

export const useResolveIncident = () =>
  useOpsMutation((input: { id: UUID; resolution: string }) =>
    resolveIncident(input.id, { resolution: input.resolution }),
  );

export const useUpdateFinding = () =>
  useOpsMutation((input: { id: UUID; action: string; status: ComplianceFindingStatus }) =>
    updateFinding(input.id, { action: input.action, status: input.status }),
  );

export const useMarkEventRead = () => useOpsMutation((id: UUID) => markEventRead(id));

export const useCompleteActionItem = () => useOpsMutation((id: UUID) => completeActionItem(id));

export const useDeclineTransportRequest = () =>
  useOpsMutation((input: { id: UUID; reason: string }) =>
    declineTransportRequest(input.id, input.reason),
  );

export const useUploadOperationsDocument = () =>
  useOpsMutation((input: NewOperationsDocumentInput) => uploadOperationsDocument(input));
