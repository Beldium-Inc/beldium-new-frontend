import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";

import {
  addCorrectiveAction,
  addCustodyEvent,
  advanceCorrectiveAction,
  assignApplication,
  closeQualityNonConformity,
  createTestRequest,
  decideQualityApplication,
  decideQualityProfessionalApplication,
  fetchQualityCapabilities,
  fetchQualityDashboard,
  getQualityApplication,
  getCertificate,
  getSample,
  issueCertificate,
  listQualityApplications,
  listQualityProfessionalApplications,
  listBuyerSpecs,
  listCertificates,
  listQualityNonConformities,
  listSamples,
  raiseQualityNonConformity,
  registerSample,
  resolveRiskFlag,
  revokeCertificate,
  setDocumentStatus,
  uploadQualityApplicationDocument,
  updateTestResult,
  createBuyerSpec,
  updateBuyerSpec,
  listQualityNotifications,
  markQualityNotificationRead,
  setSampleStatus,
  submitQualityReview,
  type QualityApplicationStatus,
  type DocStatus,
  type QualityListQuery,
  type NewSampleInput,
  type QualityNonConformity,
  type BuyerSpecInput,
  type ResultVerdict,
  type SampleStatus,
} from "./quality";
import { useHasTokens } from "./queries";
import type { UUID } from "./types";

export const qualityKeys = {
  root: ["quality"] as const,
  capabilities: ["quality", "capabilities"] as const,
  dashboard: ["quality", "dashboard"] as const,
  applications: (query: QualityListQuery = {}) => ["quality", "applications", query] as const,
  application: (id: UUID) => ["quality", "application", id] as const,
  professionalApplications: ["quality", "professional-applications"] as const,
  samples: (query: QualityListQuery = {}) => ["quality", "samples", query] as const,
  sample: (id: UUID) => ["quality", "sample", id] as const,
  certificates: (query: QualityListQuery = {}) => ["quality", "certificates", query] as const,
  certificate: (id: UUID) => ["quality", "certificate", id] as const,
  buyerSpecs: (query: QualityListQuery = {}) => ["quality", "buyer-specs", query] as const,
  notifications: ["quality", "notifications"] as const,
  nonConformities: (query: QualityListQuery = {}) =>
    ["quality", "non-conformities", query] as const,
};

/** Lists are large and change slowly; a dashboard remount shouldn't refetch all of them. */
const LIST_STALE_TIME = 30_000;

// Every screen filters and totals client-side over the whole register, so a
// partial page would silently under-report.
const FULL_PAGE: QualityListQuery = { page_size: 100 };

function invalidateQuality(queryClient: QueryClient): void {
  void queryClient.invalidateQueries({ queryKey: qualityKeys.root });
}

export function useQualityCapabilities() {
  const hasTokens = useHasTokens();
  return useQuery({
    queryKey: qualityKeys.capabilities,
    queryFn: ({ signal }) => fetchQualityCapabilities(signal),
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

export function useQualityApplications(query: QualityListQuery = FULL_PAGE) {
  const hasTokens = useHasTokens();
  return useQuery({
    queryKey: qualityKeys.applications(query),
    queryFn: () => listQualityApplications(query),
    enabled: hasTokens,
    staleTime: LIST_STALE_TIME,
  });
}

export function useQualityApplication(id: UUID | null) {
  return useQuery({
    queryKey: qualityKeys.application(id ?? "none"),
    queryFn: () => getQualityApplication(id as UUID),
    enabled: Boolean(id),
  });
}

export function useQualitySamples(query: QualityListQuery = FULL_PAGE) {
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

export function useQualityCertificates(query: QualityListQuery = FULL_PAGE) {
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

export function useBuyerSpecs(query: QualityListQuery = FULL_PAGE) {
  const hasTokens = useHasTokens();
  return useQuery({
    queryKey: qualityKeys.buyerSpecs(query),
    queryFn: () => listBuyerSpecs(query),
    enabled: hasTokens,
    staleTime: LIST_STALE_TIME,
  });
}

export function useQualityNonConformities(query: QualityListQuery = FULL_PAGE) {
  const hasTokens = useHasTokens();
  return useQuery({
    queryKey: qualityKeys.nonConformities(query),
    queryFn: () => listQualityNonConformities(query),
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

export function useUploadQualityApplicationDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { appId: UUID; docId: string; file: File }) =>
      uploadQualityApplicationDocument(input.appId, input.docId, input.file),
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

export function useDecideQualityApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      id: UUID;
      status: QualityApplicationStatus;
      note?: string | undefined;
    }) => decideQualityApplication(input.id, { status: input.status, note: input.note }),
    onSuccess: () => invalidateQuality(queryClient),
  });
}

export function useQualityProfessionalApplications() {
  const hasTokens = useHasTokens();
  return useQuery({
    queryKey: qualityKeys.professionalApplications,
    queryFn: () => listQualityProfessionalApplications(FULL_PAGE),
    enabled: hasTokens,
    staleTime: LIST_STALE_TIME,
  });
}

export function useDecideQualityProfessionalApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      id: UUID;
      status: QualityApplicationStatus;
      note?: string | undefined;
    }) =>
      decideQualityProfessionalApplication(input.id, { status: input.status, note: input.note }),
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

export function useUpdateTestResult() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      sampleId: UUID;
      resultId: UUID;
      value?: string | undefined;
      unit?: string | undefined;
      spec?: string | undefined;
      uncertainty?: string | undefined;
    }) =>
      updateTestResult(input.sampleId, input.resultId, {
        value: input.value,
        unit: input.unit,
        spec: input.spec,
        uncertainty: input.uncertainty,
      }),
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
    mutationFn: (input: { id: UUID; status: SampleStatus }) =>
      setSampleStatus(input.id, input.status),
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
      severity: QualityNonConformity["severity"];
      detail: string;
    }) => raiseQualityNonConformity(input),
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

export function useCloseQualityNonConformity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: UUID) => closeQualityNonConformity(id),
    onSuccess: () => invalidateQuality(queryClient),
  });
}

export function useCreateBuyerSpec() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: BuyerSpecInput) => createBuyerSpec(input),
    onSuccess: () => invalidateQuality(queryClient),
  });
}

export function useUpdateBuyerSpec() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: UUID } & Partial<BuyerSpecInput>) => {
      const { id, ...rest } = input;
      return updateBuyerSpec(id, rest);
    },
    onSuccess: () => invalidateQuality(queryClient),
  });
}

/** Polled so assignments and verdicts reach the bell without a reload. */
export function useQualityNotifications() {
  const hasTokens = useHasTokens();
  return useQuery({
    queryKey: qualityKeys.notifications,
    queryFn: () => listQualityNotifications({ page_size: 50 }),
    enabled: hasTokens,
    refetchInterval: 60_000,
  });
}

export function useMarkQualityNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: UUID) => markQualityNotificationRead(id),
    onSuccess: () => invalidateQuality(queryClient),
  });
}
