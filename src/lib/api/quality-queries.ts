import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";

import {
  addCorrectiveAction,
  addCustodyEvent,
  advanceCorrectiveAction,
  assignApplication,
  closeNonConformity,
  createTestRequest,
  decideApplication,
  fetchCapabilities,
  fetchQualityDashboard,
  getApplication,
  getCertificate,
  getSample,
  issueCertificate,
  listApplications,
  listBuyerSpecs,
  listCertificates,
  listNonConformities,
  listSamples,
  raiseNonConformity,
  registerSample,
  resolveRiskFlag,
  revokeCertificate,
  setDocumentStatus,
  setResultVerdict,
  setSampleStatus,
  submitQualityReview,
  type ApplicationStatus,
  type DocStatus,
  type ListQuery,
  type NewSampleInput,
  type NonConformity,
  type ResultVerdict,
  type SampleStatus,
} from "./quality";
import { useHasTokens } from "./queries";
import type { UUID } from "./types";

export const qualityKeys = {
  root: ["quality"] as const,
  capabilities: ["quality", "capabilities"] as const,
  dashboard: ["quality", "dashboard"] as const,
  applications: (query: ListQuery = {}) => ["quality", "applications", query] as const,
  application: (id: UUID) => ["quality", "application", id] as const,
  samples: (query: ListQuery = {}) => ["quality", "samples", query] as const,
  sample: (id: UUID) => ["quality", "sample", id] as const,
  certificates: (query: ListQuery = {}) => ["quality", "certificates", query] as const,
  certificate: (id: UUID) => ["quality", "certificate", id] as const,
  buyerSpecs: (query: ListQuery = {}) => ["quality", "buyer-specs", query] as const,
  nonConformities: (query: ListQuery = {}) => ["quality", "non-conformities", query] as const,
};

/** Lists are large and change slowly; a dashboard remount shouldn't refetch all of them. */
const LIST_STALE_TIME = 30_000;

// Every screen filters and totals client-side over the whole register, so a
// partial page would silently under-report.
const FULL_PAGE: ListQuery = { page_size: 100 };

function invalidateQuality(queryClient: QueryClient): void {
  void queryClient.invalidateQueries({ queryKey: qualityKeys.root });
}

export function useQualityCapabilities() {
  const hasTokens = useHasTokens();
  return useQuery({
    queryKey: qualityKeys.capabilities,
    queryFn: ({ signal }) => fetchCapabilities(signal),
    enabled: hasTokens,
    staleTime: 5 * 60_000,
    retry: false,
  });
}

export function useQualityDashboard() {
  const hasTokens = useHasTokens();
  return useQuery({
    queryKey: qualityKeys.dashboard,
    queryFn: ({ signal }) => fetchQualityDashboard(signal),
    enabled: hasTokens,
    staleTime: LIST_STALE_TIME,
  });
}

export function useQualityApplications(query: ListQuery = FULL_PAGE) {
  const hasTokens = useHasTokens();
  return useQuery({
    queryKey: qualityKeys.applications(query),
    queryFn: () => listApplications(query),
    enabled: hasTokens,
    staleTime: LIST_STALE_TIME,
  });
}

export function useQualityApplication(id: UUID | null) {
  return useQuery({
    queryKey: qualityKeys.application(id ?? "none"),
    queryFn: () => getApplication(id as UUID),
    enabled: Boolean(id),
  });
}

export function useQualitySamples(query: ListQuery = FULL_PAGE) {
  const hasTokens = useHasTokens();
  return useQuery({
    queryKey: qualityKeys.samples(query),
    queryFn: () => listSamples(query),
    enabled: hasTokens,
    staleTime: LIST_STALE_TIME,
  });
}

export function useQualitySample(id: UUID | null) {
  return useQuery({
    queryKey: qualityKeys.sample(id ?? "none"),
    queryFn: () => getSample(id as UUID),
    enabled: Boolean(id),
  });
}

export function useQualityCertificates(query: ListQuery = FULL_PAGE) {
  const hasTokens = useHasTokens();
  return useQuery({
    queryKey: qualityKeys.certificates(query),
    queryFn: () => listCertificates(query),
    enabled: hasTokens,
    staleTime: LIST_STALE_TIME,
  });
}

export function useQualityCertificate(id: UUID | null) {
  return useQuery({
    queryKey: qualityKeys.certificate(id ?? "none"),
    queryFn: () => getCertificate(id as UUID),
    enabled: Boolean(id),
  });
}

export function useBuyerSpecs(query: ListQuery = FULL_PAGE) {
  const hasTokens = useHasTokens();
  return useQuery({
    queryKey: qualityKeys.buyerSpecs(query),
    queryFn: () => listBuyerSpecs(query),
    enabled: hasTokens,
    staleTime: LIST_STALE_TIME,
  });
}

export function useQualityNonConformities(query: ListQuery = FULL_PAGE) {
  const hasTokens = useHasTokens();
  return useQuery({
    queryKey: qualityKeys.nonConformities(query),
    queryFn: () => listNonConformities(query),
    enabled: hasTokens,
    staleTime: LIST_STALE_TIME,
  });
}

// --- mutations ----------------------------------------------------------------

export function useSetDocumentStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { appId: UUID; docId: UUID; status: DocStatus }) =>
      setDocumentStatus(input.appId, input.docId, input.status),
    onSuccess: () => invalidateQuality(queryClient),
  });
}

export function useResolveRiskFlag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { appId: UUID; flagId: UUID }) =>
      resolveRiskFlag(input.appId, input.flagId),
    onSuccess: () => invalidateQuality(queryClient),
  });
}

export function useDecideApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: UUID; status: ApplicationStatus; note?: string | undefined }) =>
      decideApplication(input.id, { status: input.status, note: input.note }),
    onSuccess: () => invalidateQuality(queryClient),
  });
}

export function useAssignApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: UUID) => assignApplication(id),
    onSuccess: () => invalidateQuality(queryClient),
  });
}

export function useRegisterSample() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: NewSampleInput) => registerSample(input),
    onSuccess: () => invalidateQuality(queryClient),
  });
}

export function useAddCustodyEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: UUID; action: string; location: string; seal_intact: boolean }) =>
      addCustodyEvent(input.id, {
        action: input.action,
        location: input.location,
        seal_intact: input.seal_intact,
      }),
    onSuccess: () => invalidateQuality(queryClient),
  });
}

export function useCreateTestRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      id: UUID;
      methods: string[];
      priority: "standard" | "expedited";
      turnaround: string;
    }) =>
      createTestRequest(input.id, {
        methods: input.methods,
        priority: input.priority,
        turnaround: input.turnaround,
      }),
    onSuccess: () => invalidateQuality(queryClient),
  });
}

export function useSetResultVerdict() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      sampleId: UUID;
      resultId: UUID;
      verdict: ResultVerdict;
      value?: string | undefined;
    }) => setResultVerdict(input.sampleId, input.resultId, { verdict: input.verdict, value: input.value }),
    onSuccess: () => invalidateQuality(queryClient),
  });
}

export function useSubmitQualityReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: UUID; verdict: ResultVerdict; note: string }) =>
      submitQualityReview(input.id, { verdict: input.verdict, note: input.note }),
    onSuccess: () => invalidateQuality(queryClient),
  });
}

export function useSetSampleStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: UUID; status: SampleStatus }) => setSampleStatus(input.id, input.status),
    onSuccess: () => invalidateQuality(queryClient),
  });
}

export function useIssueCertificate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sampleId: UUID) => issueCertificate(sampleId),
    onSuccess: () => invalidateQuality(queryClient),
  });
}

export function useRevokeCertificate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: UUID) => revokeCertificate(id),
    onSuccess: () => invalidateQuality(queryClient),
  });
}

export function useRaiseNonConformity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      title: string;
      against: string;
      severity: NonConformity["severity"];
      detail: string;
    }) => raiseNonConformity(input),
    onSuccess: () => invalidateQuality(queryClient),
  });
}

export function useAddCorrectiveAction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: UUID; action: string; owner: string; due: string }) =>
      addCorrectiveAction(input.id, { action: input.action, owner: input.owner, due: input.due }),
    onSuccess: () => invalidateQuality(queryClient),
  });
}

export function useAdvanceCorrectiveAction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { ncId: UUID; actionId: UUID }) =>
      advanceCorrectiveAction(input.ncId, input.actionId),
    onSuccess: () => invalidateQuality(queryClient),
  });
}

export function useCloseNonConformity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: UUID) => closeNonConformity(id),
    onSuccess: () => invalidateQuality(queryClient),
  });
}
