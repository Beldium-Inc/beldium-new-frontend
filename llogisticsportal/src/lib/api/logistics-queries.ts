import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  fetchLogisticsDashboard,
  getApplication,
  listApplicationRequests,
  listLogisticsApplicationActivity,
  respondToRequest,
  uploadLogisticsApplicationDocument,
} from "./logistics";
import { useHasTokens } from "./queries";
import type { UUID } from "./types";

// Operator-side hooks over the `logistics` Django app's onboarding endpoints,
// which already exist (the compliance app reviews the same records). Only the
// calls this portal makes are wrapped here.

export const logisticsKeys = {
  dashboard: ["logistics", "dashboard"] as const,
  application: (id: UUID) => ["logistics", "applications", id] as const,
  requests: (id: UUID) => ["logistics", "applications", id, "requests"] as const,
  activity: (id: UUID) => ["logistics", "applications", id, "activity"] as const,
};

/** The operator's companies with their application status, counts and scopes. */
export function useLogisticsDashboard(options: { enabled?: boolean } = {}) {
  const hasTokens = useHasTokens();
  return useQuery({
    queryKey: logisticsKeys.dashboard,
    queryFn: ({ signal }) => fetchLogisticsDashboard(signal),
    enabled: (options.enabled ?? true) && hasTokens,
    staleTime: 30_000,
  });
}

export function useLogisticsApplication(id: UUID | null) {
  return useQuery({
    queryKey: logisticsKeys.application(id ?? "none"),
    queryFn: () => getApplication(id as UUID),
    enabled: Boolean(id),
    refetchInterval: 30_000,
  });
}

export function useApplicationRequests(id: UUID | null) {
  return useQuery({
    queryKey: logisticsKeys.requests(id ?? "none"),
    queryFn: () => listApplicationRequests(id as UUID),
    enabled: Boolean(id),
  });
}

export function useApplicationActivity(id: UUID | null) {
  return useQuery({
    queryKey: logisticsKeys.activity(id ?? "none"),
    queryFn: () => listLogisticsApplicationActivity(id as UUID),
    enabled: Boolean(id),
  });
}

/**
 * Answer an information request. Evidence is uploaded against the application
 * first, then referenced from the response, because responses carry document
 * ids rather than files.
 */
export function useRespondToRequest(applicationId: UUID | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { requestId: UUID; message: string; file?: File | undefined }) => {
      const documents: UUID[] = [];
      if (input.file && applicationId) {
        const doc = await uploadLogisticsApplicationDocument(applicationId, {
          domain: "operational",
          document_type: "information_request_evidence",
          title: input.file.name,
          file: input.file,
        });
        documents.push(doc.id);
      }
      return respondToRequest(input.requestId, { message: input.message, documents });
    },
    onSuccess: () => {
      if (!applicationId) return;
      void queryClient.invalidateQueries({ queryKey: logisticsKeys.application(applicationId) });
      void queryClient.invalidateQueries({ queryKey: logisticsKeys.dashboard });
    },
  });
}
