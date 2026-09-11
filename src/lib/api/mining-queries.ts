import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";

import {
  addScoreFactor,
  closeMiningNonConformity,
  createMiningApplication,
  createEnvironmentalRecord,
  createEquipment,
  createInfoRequest,
  createInspection,
  createMineSite,
  createMiningNonConformity,
  createOrganisationProfile,
  createPendingReview,
  createSafetyIncident,
  createSample,
  deleteEquipment,
  fetchMiningCapabilities,
  fetchMiningChecklist,
  fetchMiningDashboard,
  getMineSite,
  listMiningApplications,
  listMiningDocuments,
  listEnvironmentalRecords,
  listEquipment,
  listExpiringLicences,
  listInfoRequests,
  listMiningInspections,
  listLicences,
  listMineSites,
  listMiningAudit,
  listMiningNonConformities,
  listOrganisationProfiles,
  listPendingReviews,
  listSafetyIncidents,
  listMiningSamples,
  listSiteActivity,
  recomputeSiteScore,
  respondToInfoRequest,
  reviewMiningDocument,
  reviewSiteSection,
  saveSiteSection,
  submitMiningNonConformityEvidence,
  updateApplication,
  updateEnvironmentalRecord,
  updateEquipment,
  updateMiningInspection,
  updateLicence,
  updateMineSite,
  updateOrganisationProfile,
  updatePendingReview,
  updateSafetyIncident,
  updateSample,
  uploadMiningDocument,
  uploadLicence,
  uploadSectionEvidence,
  type Application,
  type CorrectiveSubmission,
  type EnvRecord,
  type Equipment,
  type InfoRequest,
  type MiningInspection,
  type LicenceDoc,
  type MiningListQuery,
  type MineSite,
  type MiningNonConformity,
  type OrganisationProfile,
  type PendingReview,
  type ReviewSectionStatus,
  type MiningSample,
  type SafetyIncident,
  type MiningSectionField,
  type SectionKey,
} from "./mining";
import { useHasTokens } from "./queries";
import type { UUID } from "./types";

/**
 * Cache keys for the mining register. Everything hangs off one "mining" root
 * so a write with a wide ripple — a section verdict, a decision — can
 * invalidate the whole vertical at once, same as `processingKeys`.
 */
export const miningKeys = {
  root: ["mining"] as const,
  capabilities: ["mining", "capabilities"] as const,
  dashboard: ["mining", "dashboard"] as const,
  checklist: ["mining", "checklist"] as const,
  sites: (query: MiningListQuery = {}) => ["mining", "sites", query] as const,
  site: (id: UUID) => ["mining", "site", id] as const,
  siteActivity: (id: UUID, page?: number) => ["mining", "site", id, "activity", page ?? 1] as const,
  organisationProfiles: (query: MiningListQuery = {}) =>
    ["mining", "organisation-profiles", query] as const,
  nonConformities: (query: MiningListQuery = {}) => ["mining", "non-conformities", query] as const,
  inspections: (query: MiningListQuery = {}) => ["mining", "inspections", query] as const,
  samples: (query: MiningListQuery = {}) => ["mining", "samples", query] as const,
  environmentalRecords: (query: MiningListQuery = {}) =>
    ["mining", "environmental-records", query] as const,
  safetyIncidents: (query: MiningListQuery = {}) => ["mining", "safety-incidents", query] as const,
  equipment: (query: MiningListQuery = {}) => ["mining", "equipment", query] as const,
  applications: (query: MiningListQuery = {}) => ["mining", "applications", query] as const,
  pendingReviews: (query: MiningListQuery = {}) => ["mining", "pending-reviews", query] as const,
  infoRequests: (query: MiningListQuery = {}) => ["mining", "info-requests", query] as const,
  licences: (query: MiningListQuery = {}) => ["mining", "licences", query] as const,
  expiringLicences: ["mining", "licences", "expiring"] as const,
  documents: (query: MiningListQuery = {}) => ["mining", "documents", query] as const,
  audit: (query: MiningListQuery = {}) => ["mining", "audit", query] as const,
};

/** Lists are large and change slowly; a dashboard remount shouldn't refetch all of them. */
const LIST_STALE_TIME = 30_000;

// Every screen filters and totals client-side over the whole set, so a
// partial page would silently under-report — same rationale as `processing`.
const FULL_PAGE: MiningListQuery = { page_size: 100 };

function invalidateMining(queryClient: QueryClient): void {
  void queryClient.invalidateQueries({ queryKey: miningKeys.root });
}

// --- reads --------------------------------------------------------------------

export function useMiningCapabilities() {
  const hasTokens = useHasTokens();
  return useQuery({
    queryKey: miningKeys.capabilities,
    queryFn: ({ signal }) => fetchMiningCapabilities(signal),
    enabled: hasTokens,
    staleTime: 5 * 60_000,
    retry: false,
  });
}

/** The checklist rarely changes; hold it for the length of a session. */
export function useMiningChecklist() {
  const hasTokens = useHasTokens();
  return useQuery({
    queryKey: miningKeys.checklist,
    queryFn: ({ signal }) => fetchMiningChecklist(signal),
    enabled: hasTokens,
    staleTime: 30 * 60_000,
  });
}

export function useMiningDashboard() {
  const hasTokens = useHasTokens();
  return useQuery({
    queryKey: miningKeys.dashboard,
    queryFn: ({ signal }) => fetchMiningDashboard(signal),
    enabled: hasTokens,
    staleTime: LIST_STALE_TIME,
  });
}

export function useMineSites(query: MiningListQuery = FULL_PAGE) {
  const hasTokens = useHasTokens();
  return useQuery({
    queryKey: miningKeys.sites(query),
    queryFn: () => listMineSites(query),
    enabled: hasTokens,
    staleTime: LIST_STALE_TIME,
  });
}

/** The detail read — the only response carrying the ten evidence sections. */
export function useMineSite(id: UUID | null) {
  return useQuery({
    queryKey: miningKeys.site(id ?? "none"),
    queryFn: () => getMineSite(id as UUID),
    enabled: Boolean(id),
  });
}

export function useSiteActivity(id: UUID | null, page?: number) {
  return useQuery({
    queryKey: miningKeys.siteActivity(id ?? "none", page),
    queryFn: () => listSiteActivity(id as UUID, page),
    enabled: Boolean(id),
  });
}

export function useOrganisationProfiles(query: MiningListQuery = FULL_PAGE) {
  const hasTokens = useHasTokens();
  return useQuery({
    queryKey: miningKeys.organisationProfiles(query),
    queryFn: () => listOrganisationProfiles(query),
    enabled: hasTokens,
    staleTime: LIST_STALE_TIME,
  });
}

export function useMiningNonConformities(query: MiningListQuery = FULL_PAGE) {
  const hasTokens = useHasTokens();
  return useQuery({
    queryKey: miningKeys.nonConformities(query),
    queryFn: () => listMiningNonConformities(query),
    enabled: hasTokens,
    staleTime: LIST_STALE_TIME,
  });
}

export function useMiningInspections(query: MiningListQuery = FULL_PAGE) {
  const hasTokens = useHasTokens();
  return useQuery({
    queryKey: miningKeys.inspections(query),
    queryFn: () => listMiningInspections(query),
    enabled: hasTokens,
    staleTime: LIST_STALE_TIME,
  });
}

export function useMiningSamples(query: MiningListQuery = FULL_PAGE) {
  const hasTokens = useHasTokens();
  return useQuery({
    queryKey: miningKeys.samples(query),
    queryFn: () => listMiningSamples(query),
    enabled: hasTokens,
    staleTime: LIST_STALE_TIME,
  });
}

export function useEnvironmentalRecords(query: MiningListQuery = FULL_PAGE) {
  const hasTokens = useHasTokens();
  return useQuery({
    queryKey: miningKeys.environmentalRecords(query),
    queryFn: () => listEnvironmentalRecords(query),
    enabled: hasTokens,
    staleTime: LIST_STALE_TIME,
  });
}

export function useSafetyIncidents(query: MiningListQuery = FULL_PAGE) {
  const hasTokens = useHasTokens();
  return useQuery({
    queryKey: miningKeys.safetyIncidents(query),
    queryFn: () => listSafetyIncidents(query),
    enabled: hasTokens,
    staleTime: LIST_STALE_TIME,
  });
}

export function useMiningEquipment(query: MiningListQuery = FULL_PAGE) {
  const hasTokens = useHasTokens();
  return useQuery({
    queryKey: miningKeys.equipment(query),
    queryFn: () => listEquipment(query),
    enabled: hasTokens,
    staleTime: LIST_STALE_TIME,
  });
}

export function useMiningApplications(query: MiningListQuery = FULL_PAGE) {
  const hasTokens = useHasTokens();
  return useQuery({
    queryKey: miningKeys.applications(query),
    queryFn: () => listMiningApplications(query),
    enabled: hasTokens,
    staleTime: LIST_STALE_TIME,
  });
}

export function usePendingReviews(query: MiningListQuery = FULL_PAGE) {
  const hasTokens = useHasTokens();
  return useQuery({
    queryKey: miningKeys.pendingReviews(query),
    queryFn: () => listPendingReviews(query),
    enabled: hasTokens,
    staleTime: LIST_STALE_TIME,
  });
}

export function useInfoRequests(query: MiningListQuery = FULL_PAGE) {
  const hasTokens = useHasTokens();
  return useQuery({
    queryKey: miningKeys.infoRequests(query),
    queryFn: () => listInfoRequests(query),
    enabled: hasTokens,
    staleTime: LIST_STALE_TIME,
  });
}

export function useLicences(query: MiningListQuery = FULL_PAGE) {
  const hasTokens = useHasTokens();
  return useQuery({
    queryKey: miningKeys.licences(query),
    queryFn: () => listLicences(query),
    enabled: hasTokens,
    staleTime: LIST_STALE_TIME,
  });
}

export function useExpiringLicences() {
  const hasTokens = useHasTokens();
  return useQuery({
    queryKey: miningKeys.expiringLicences,
    queryFn: () => listExpiringLicences(),
    enabled: hasTokens,
    staleTime: LIST_STALE_TIME,
  });
}

export function useMiningDocuments(query: MiningListQuery = FULL_PAGE) {
  const hasTokens = useHasTokens();
  return useQuery({
    queryKey: miningKeys.documents(query),
    queryFn: () => listMiningDocuments(query),
    enabled: hasTokens,
    staleTime: LIST_STALE_TIME,
  });
}

export function useMiningAudit(query: MiningListQuery = FULL_PAGE) {
  const hasTokens = useHasTokens();
  return useQuery({
    queryKey: miningKeys.audit(query),
    queryFn: () => listMiningAudit(query),
    enabled: hasTokens,
    staleTime: LIST_STALE_TIME,
  });
}

// --- mutations ------------------------------------------------------------------

export function useCreateMineSite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<MineSite>) => createMineSite(input),
    onSuccess: () => invalidateMining(queryClient),
  });
}

export function useUpdateMineSite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: UUID; patch: Partial<MineSite> }) =>
      updateMineSite(input.id, input.patch),
    onSuccess: () => invalidateMining(queryClient),
  });
}

export function useSaveSiteSection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      id: UUID;
      key: SectionKey;
      fields?: MiningSectionField[] | undefined;
      summary?: string | undefined;
    }) => saveSiteSection(input.id, input.key, { fields: input.fields, summary: input.summary }),
    onSuccess: () => invalidateMining(queryClient),
  });
}

export function useReviewSiteSection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      id: UUID;
      key: SectionKey;
      status: ReviewSectionStatus;
      note?: string | undefined;
      score?: number | undefined;
    }) =>
      reviewSiteSection(input.id, input.key, {
        status: input.status,
        note: input.note,
        score: input.score,
      }),
    // A verdict can move the site's compliance score, so the queue is stale too.
    onSuccess: () => invalidateMining(queryClient),
  });
}

export function useUploadSectionEvidence() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      id: UUID;
      key: SectionKey;
      name: string;
      kind?: string | undefined;
      file: File;
    }) => {
      const { id, key, ...rest } = input;
      return uploadSectionEvidence(id, key, rest);
    },
    onSuccess: () => invalidateMining(queryClient),
  });
}

export function useAddScoreFactor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      id: UUID;
      label: string;
      weight: number;
      score: number;
      reason?: string | undefined;
      trend?: string | undefined;
    }) => {
      const { id, ...rest } = input;
      return addScoreFactor(id, rest);
    },
    onSuccess: () => invalidateMining(queryClient),
  });
}

export function useRecomputeSiteScore() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: UUID) => recomputeSiteScore(id),
    onSuccess: () => invalidateMining(queryClient),
  });
}

export function useCreateOrganisationProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      organisation: UUID;
      directors?: Record<string, unknown>[];
      beneficial_owners?: Record<string, unknown>[];
    }) => createOrganisationProfile(input),
    onSuccess: () => invalidateMining(queryClient),
  });
}

export function useUpdateOrganisationProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: UUID; patch: Partial<OrganisationProfile> }) =>
      updateOrganisationProfile(input.id, input.patch),
    onSuccess: () => invalidateMining(queryClient),
  });
}

export function useCreateMiningNonConformity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      site: UUID;
      title: string;
      category?: string | undefined;
      severity: MiningNonConformity["severity"];
      required_action?: string | undefined;
      responsible_person?: string | undefined;
      deadline: string;
    }) => createMiningNonConformity(input),
    onSuccess: () => invalidateMining(queryClient),
  });
}

export function useSubmitMiningNonConformityEvidence() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: UUID; message: string; file?: File | null | undefined }) =>
      submitMiningNonConformityEvidence(input.id, { message: input.message, file: input.file }),
    onSuccess: () => invalidateMining(queryClient),
  });
}

export function useCloseMiningNonConformity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: UUID; accept: boolean; note?: string | undefined }) =>
      closeMiningNonConformity(input.id, { accept: input.accept, note: input.note }),
    onSuccess: () => invalidateMining(queryClient),
  });
}

export function useCreateInspection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      site: UUID;
      type: MiningInspection["type"];
      scheduled_for?: string | null | undefined;
      inspector?: UUID | null | undefined;
      inspector_name?: string | undefined;
    }) => createInspection(input),
    onSuccess: () => invalidateMining(queryClient),
  });
}

export function useUpdateMiningInspection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: UUID; patch: Partial<MiningInspection> }) =>
      updateMiningInspection(input.id, input.patch),
    // Completing one stamps the site's last-inspection date, so the register is stale too.
    onSuccess: () => invalidateMining(queryClient),
  });
}

export function useCreateSample() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<MiningSample> & { site: UUID; collected_on: string }) =>
      createSample(input),
    onSuccess: () => invalidateMining(queryClient),
  });
}

export function useUpdateSample() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: UUID; patch: Partial<MiningSample> }) =>
      updateSample(input.id, input.patch),
    onSuccess: () => invalidateMining(queryClient),
  });
}

export function useCreateEnvironmentalRecord() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<EnvRecord> & { site: UUID; metric: string; measured_on: string }) =>
      createEnvironmentalRecord(input),
    onSuccess: () => invalidateMining(queryClient),
  });
}

export function useUpdateEnvironmentalRecord() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: UUID; patch: Partial<EnvRecord> }) =>
      updateEnvironmentalRecord(input.id, input.patch),
    onSuccess: () => invalidateMining(queryClient),
  });
}

export function useCreateSafetyIncident() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<SafetyIncident> & { site: UUID; date: string; type: string }) =>
      createSafetyIncident(input),
    onSuccess: () => invalidateMining(queryClient),
  });
}

export function useUpdateSafetyIncident() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: UUID; patch: Partial<SafetyIncident> }) =>
      updateSafetyIncident(input.id, input.patch),
    onSuccess: () => invalidateMining(queryClient),
  });
}

export function useCreateEquipment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<Equipment> & { site: UUID; name: string }) =>
      createEquipment(input),
    onSuccess: () => invalidateMining(queryClient),
  });
}

export function useUpdateEquipment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: UUID; patch: Partial<Equipment> }) =>
      updateEquipment(input.id, input.patch),
    onSuccess: () => invalidateMining(queryClient),
  });
}

export function useDeleteEquipment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: UUID) => deleteEquipment(id),
    onSuccess: () => invalidateMining(queryClient),
  });
}

export function useCreateMiningApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (
      input: Partial<Application> & { organisation: UUID; type: string; mineral: string },
    ) => createMiningApplication(input),
    onSuccess: () => invalidateMining(queryClient),
  });
}

export function useUpdateApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: UUID; patch: Partial<Application> }) =>
      updateApplication(input.id, input.patch),
    onSuccess: () => invalidateMining(queryClient),
  });
}

export function useCreatePendingReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<PendingReview> & { site: UUID; subject: string; type: string }) =>
      createPendingReview(input),
    onSuccess: () => invalidateMining(queryClient),
  });
}

export function useUpdatePendingReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: UUID; patch: Partial<PendingReview> }) =>
      updatePendingReview(input.id, input.patch),
    onSuccess: () => invalidateMining(queryClient),
  });
}

export function useCreateInfoRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      site: UUID;
      section?: SectionKey | undefined;
      subject: string;
      details?: string | undefined;
      due_by?: string | null | undefined;
      priority?: InfoRequest["priority"] | undefined;
    }) => createInfoRequest(input),
    onSuccess: () => invalidateMining(queryClient),
  });
}

export function useRespondToInfoRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: UUID; message: string }) =>
      respondToInfoRequest(input.id, { message: input.message }),
    onSuccess: () => invalidateMining(queryClient),
  });
}

export function useUploadLicence() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      site: UUID;
      number: string;
      type: string;
      authority?: string | undefined;
      issued_on?: string | null | undefined;
      expires_on?: string | null | undefined;
      file?: File | null | undefined;
    }) => uploadLicence(input),
    onSuccess: () => invalidateMining(queryClient),
  });
}

export function useUpdateLicence() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: UUID; patch: Partial<LicenceDoc> }) =>
      updateLicence(input.id, input.patch),
    onSuccess: () => invalidateMining(queryClient),
  });
}

export function useUploadMiningDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      site: UUID;
      name: string;
      category?: string | undefined;
      expires_on?: string | null | undefined;
      file: File;
    }) => uploadMiningDocument(input),
    onSuccess: () => invalidateMining(queryClient),
  });
}

export function useReviewMiningDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: UUID; status: "verified" | "rejected" }) =>
      reviewMiningDocument(input.id, { status: input.status }),
    onSuccess: () => invalidateMining(queryClient),
  });
}

export type { CorrectiveSubmission };
