import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";

import {
  addRiskCause,
  closeNonConformity,
  createNonConformity,
  createProcessingApplication,
  decideProcessingApplication,
  fetchCapabilities,
  fetchChecklist,
  fetchProcessingDashboard,
  getProcessingApplication,
  getProcessor,
  listComplianceReports,
  listEnvironmentalAlerts,
  listExpiringDocuments,
  listIncidents,
  listInspections,
  listNonConformities,
  listProcessingApplications,
  listProcessingAudit,
  listProcessors,
  listTraceabilityRuns,
  removeRiskCause,
  reviewProcessingDocument,
  requestApplicationInspection,
  reviewApplicationSection,
  saveApplicationSection,
  setAlertStatus,
  submitNonConformityEvidence,
  submitProcessingApplication,
  updateInspection,
  uploadApplicationDocument,
  type ApplicationDecisionValue,
  type Inspection,
  type ListQuery,
  type NonConformity,
  type ProcessingReviewState,
  type ProcessingSectionKey,
  type ProcessingTypeKey,
  type NewApplicationInput,
  type Inspection as InspectionRow,
  type SectionField,
} from "./processing";
import { useHasTokens } from "./queries";
import type { UUID } from "./types";

/**
 * Cache keys for the processing register. Everything hangs off one "processing"
 * root so a write can invalidate the whole vertical when its ripple is wide —
 * a decision, for instance, moves the application, the processor's status and
 * every dashboard total at once.
 */
export const processingKeys = {
  root: ["processing"] as const,
  capabilities: ["processing", "capabilities"] as const,
  dashboard: ["processing", "dashboard"] as const,
  checklist: (processingType: string) => ["processing", "checklist", processingType] as const,
  processors: (query: ListQuery = {}) => ["processing", "processors", query] as const,
  processor: (id: UUID) => ["processing", "processor", id] as const,
  applications: (query: ListQuery = {}) => ["processing", "applications", query] as const,
  application: (id: UUID) => ["processing", "application", id] as const,
  nonConformities: (query: ListQuery = {}) => ["processing", "non-conformities", query] as const,
  inspections: (query: ListQuery = {}) => ["processing", "inspections", query] as const,
  alerts: (query: ListQuery = {}) => ["processing", "alerts", query] as const,
  incidents: (query: ListQuery = {}) => ["processing", "incidents", query] as const,
  runs: (query: ListQuery = {}) => ["processing", "runs", query] as const,
  expiringDocuments: ["processing", "documents", "expiring"] as const,
  reports: (query: ListQuery = {}) => ["processing", "reports", query] as const,
  audit: (query: ListQuery = {}) => ["processing", "audit", query] as const,
};

/** Lists are large and change slowly; a dashboard remount shouldn't refetch all of them. */
const LIST_STALE_TIME = 30_000;

// The register is a page-size of 100 rather than the default 20: every screen
// filters and totals client-side over the whole set, so a partial page would
// silently under-report.
const FULL_PAGE: ListQuery = { page_size: 100 };

function invalidateProcessing(queryClient: QueryClient): void {
  void queryClient.invalidateQueries({ queryKey: processingKeys.root });
}

export function useProcessingCapabilities() {
  const hasTokens = useHasTokens();
  return useQuery({
    queryKey: processingKeys.capabilities,
    queryFn: ({ signal }) => fetchCapabilities(signal),
    enabled: hasTokens,
    staleTime: 5 * 60_000,
    retry: false,
  });
}

/** The checklist rarely changes; hold it for the length of a session. */
export function useProcessingChecklist(processingType: ProcessingTypeKey | null) {
  return useQuery({
    queryKey: processingKeys.checklist(processingType ?? "none"),
    queryFn: ({ signal }) => fetchChecklist(processingType as ProcessingTypeKey, signal),
    enabled: Boolean(processingType),
    staleTime: 30 * 60_000,
  });
}

export function useProcessingDashboard() {
  const hasTokens = useHasTokens();
  return useQuery({
    queryKey: processingKeys.dashboard,
    queryFn: ({ signal }) => fetchProcessingDashboard(signal),
    enabled: hasTokens,
    staleTime: LIST_STALE_TIME,
  });
}

export function useProcessors(query: ListQuery = FULL_PAGE) {
  const hasTokens = useHasTokens();
  return useQuery({
    queryKey: processingKeys.processors(query),
    queryFn: () => listProcessors(query),
    enabled: hasTokens,
    staleTime: LIST_STALE_TIME,
  });
}

export function useProcessor(id: UUID | null) {
  return useQuery({
    queryKey: processingKeys.processor(id ?? "none"),
    queryFn: () => getProcessor(id as UUID),
    enabled: Boolean(id),
  });
}

export function useProcessingApplications(query: ListQuery = FULL_PAGE) {
  const hasTokens = useHasTokens();
  return useQuery({
    queryKey: processingKeys.applications(query),
    queryFn: () => listProcessingApplications(query),
    enabled: hasTokens,
    staleTime: LIST_STALE_TIME,
  });
}

/** The detail read — the only response carrying the ten evidence sections. */
export function useProcessingApplication(id: UUID | null) {
  return useQuery({
    queryKey: processingKeys.application(id ?? "none"),
    queryFn: () => getProcessingApplication(id as UUID),
    enabled: Boolean(id),
  });
}

export function useProcessingNonConformities(query: ListQuery = FULL_PAGE) {
  const hasTokens = useHasTokens();
  return useQuery({
    queryKey: processingKeys.nonConformities(query),
    queryFn: () => listNonConformities(query),
    enabled: hasTokens,
    staleTime: LIST_STALE_TIME,
  });
}

export function useProcessingInspections(query: ListQuery = FULL_PAGE) {
  const hasTokens = useHasTokens();
  return useQuery({
    queryKey: processingKeys.inspections(query),
    queryFn: () => listInspections(query),
    enabled: hasTokens,
    staleTime: LIST_STALE_TIME,
  });
}

export function useEnvironmentalAlerts(query: ListQuery = FULL_PAGE) {
  const hasTokens = useHasTokens();
  return useQuery({
    queryKey: processingKeys.alerts(query),
    queryFn: () => listEnvironmentalAlerts(query),
    enabled: hasTokens,
    staleTime: LIST_STALE_TIME,
  });
}

export function useProcessingIncidents(query: ListQuery = FULL_PAGE) {
  const hasTokens = useHasTokens();
  return useQuery({
    queryKey: processingKeys.incidents(query),
    queryFn: () => listIncidents(query),
    enabled: hasTokens,
    staleTime: LIST_STALE_TIME,
  });
}

export function useTraceabilityRuns(query: ListQuery = FULL_PAGE) {
  const hasTokens = useHasTokens();
  return useQuery({
    queryKey: processingKeys.runs(query),
    queryFn: () => listTraceabilityRuns(query),
    enabled: hasTokens,
    staleTime: LIST_STALE_TIME,
  });
}

export function useExpiringDocuments() {
  const hasTokens = useHasTokens();
  return useQuery({
    queryKey: processingKeys.expiringDocuments,
    queryFn: () => listExpiringDocuments(),
    enabled: hasTokens,
    staleTime: LIST_STALE_TIME,
  });
}

export function useComplianceReports(query: ListQuery = FULL_PAGE) {
  const hasTokens = useHasTokens();
  return useQuery({
    queryKey: processingKeys.reports(query),
    queryFn: () => listComplianceReports(query),
    enabled: hasTokens,
    staleTime: LIST_STALE_TIME,
  });
}

export function useProcessingAudit(query: ListQuery = FULL_PAGE) {
  const hasTokens = useHasTokens();
  return useQuery({
    queryKey: processingKeys.audit(query),
    queryFn: () => listProcessingAudit(query),
    enabled: hasTokens,
    staleTime: LIST_STALE_TIME,
  });
}

// --- mutations --------------------------------------------------------------

export function useSaveApplicationSection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      id: UUID;
      key: ProcessingSectionKey;
      fields?: SectionField[] | undefined;
      notes?: string | undefined;
    }) => saveApplicationSection(input.id, input.key, { fields: input.fields, notes: input.notes }),
    onSuccess: () => invalidateProcessing(queryClient),
  });
}

export function useReviewApplicationSection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      id: UUID;
      key: ProcessingSectionKey;
      review_state: ProcessingReviewState;
      note?: string | undefined;
    }) =>
      reviewApplicationSection(input.id, input.key, {
        review_state: input.review_state,
        note: input.note,
      }),
    // A verdict can move the application's stage, so the queue is stale too.
    onSuccess: () => invalidateProcessing(queryClient),
  });
}

export function useCreateProcessingApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: NewApplicationInput) => createProcessingApplication(input),
    onSuccess: () => invalidateProcessing(queryClient),
  });
}

export function useUploadApplicationDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      id: UUID;
      section: ProcessingSectionKey;
      name: string;
      file: File;
      reference?: string | undefined;
      issuer?: string | undefined;
      issued_on?: string | null | undefined;
      expires_on?: string | null | undefined;
    }) => {
      const { id, ...rest } = input;
      return uploadApplicationDocument(id, rest);
    },
    // An upload moves completeness, which the queue and dashboard both show.
    onSuccess: () => invalidateProcessing(queryClient),
  });
}

export function useSubmitProcessingApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: UUID) => submitProcessingApplication(id),
    onSuccess: () => invalidateProcessing(queryClient),
  });
}

export function useDecideProcessingApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      id: UUID;
      decision: ApplicationDecisionValue;
      note?: string | undefined;
    }) => decideProcessingApplication(input.id, { decision: input.decision, note: input.note }),
    // A decision also changes the processor's register status and score.
    onSuccess: () => invalidateProcessing(queryClient),
  });
}

export function useRequestInspection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      id: UUID;
      scheduled_for?: string | null | undefined;
      inspection_type?: Inspection["inspection_type"] | undefined;
      inspector_name?: string | undefined;
      note?: string | undefined;
    }) => {
      const { id, ...rest } = input;
      return requestApplicationInspection(id, rest);
    },
    onSuccess: () => invalidateProcessing(queryClient),
  });
}

export function useAddRiskCause() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: UUID; cause: string; weight: number; detail?: string | undefined }) =>
      addRiskCause(input.id, { cause: input.cause, weight: input.weight, detail: input.detail }),
    onSuccess: () => invalidateProcessing(queryClient),
  });
}

export function useRemoveRiskCause() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: UUID; causeId: UUID }) => removeRiskCause(input.id, input.causeId),
    onSuccess: () => invalidateProcessing(queryClient),
  });
}

export function useCreateNonConformity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      application?: UUID | null | undefined;
      processor?: UUID | null | undefined;
      section: ProcessingSectionKey;
      severity: NonConformity["severity"];
      title: string;
      detail?: string | undefined;
      due_on: string;
    }) => createNonConformity(input),
    onSuccess: () => invalidateProcessing(queryClient),
  });
}

export function useSubmitNonConformityEvidence() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      id: UUID;
      name: string;
      note?: string | undefined;
      file?: File | null | undefined;
    }) =>
      submitNonConformityEvidence(input.id, {
        name: input.name,
        note: input.note,
        file: input.file,
      }),
    onSuccess: () => invalidateProcessing(queryClient),
  });
}

export function useCloseNonConformity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: UUID; accept: boolean; note?: string | undefined }) =>
      closeNonConformity(input.id, { accept: input.accept, note: input.note }),
    onSuccess: () => invalidateProcessing(queryClient),
  });
}

export function useReviewProcessingDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      id: UUID;
      review_state: "verified" | "rejected" | "pending";
      note?: string | undefined;
    }) =>
      reviewProcessingDocument(input.id, { review_state: input.review_state, note: input.note }),
    onSuccess: () => invalidateProcessing(queryClient),
  });
}

export function useUpdateInspection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: UUID; patch: Partial<InspectionRow> }) =>
      updateInspection(input.id, input.patch),
    // Completing one stamps the processor's last-inspection date, so the
    // register is stale too.
    onSuccess: () => invalidateProcessing(queryClient),
  });
}

export function useSetAlertStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      id: UUID;
      status: "acknowledged" | "resolved";
      note?: string | undefined;
    }) => setAlertStatus(input.id, { status: input.status, note: input.note }),
    onSuccess: () => invalidateProcessing(queryClient),
  });
}
