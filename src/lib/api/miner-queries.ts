import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";

import {
  createInfoRequest,
  createInventoryItem,
  createMiningApplication,
  createMiningNonConformity,
  createProductionRecord,
  fetchMiningCapabilities,
  fetchMiningDashboard,
  getMineSite,
  listEquipment,
  listInfoRequests,
  listInventoryItems,
  listMineSites,
  listMiningApplications,
  listMiningDocuments,
  listMiningNonConformities,
  listOrganisationProfiles,
  listProductionRecords,
  respondToInfoRequest,
  submitMiningNonConformityEvidence,
  updateApplication,
  uploadMiningDocument,
  type Application,
  type InfoRequest,
  type InventoryItem,
  type MiningListQuery,
  type MiningListQueryLite,
  type ProductionRecord,
} from "./miner";
import { listMembers } from "./organisations";
import { useHasTokens } from "./queries";
import type { UUID } from "./types";

/**
 * Cache keys for the Miner Portal. Sites/equipment/applications/etc share the
 * "mining" root with the mining vertical's own hooks (same backend register,
 * same server-side org scoping), so a write there also invalidates here.
 * Production/inventory get their own "miner" root since they are new.
 */
export const minerKeys = {
  capabilities: ["mining", "capabilities"] as const,
  dashboard: ["mining", "dashboard"] as const,
  sites: (query: MiningListQuery = {}) => ["mining", "sites", query] as const,
  site: (id: UUID) => ["mining", "site", id] as const,
  equipment: (query: MiningListQuery = {}) => ["mining", "equipment", query] as const,
  applications: (query: MiningListQuery = {}) => ["mining", "applications", query] as const,
  nonConformities: (query: MiningListQuery = {}) => ["mining", "non-conformities", query] as const,
  infoRequests: (query: MiningListQuery = {}) => ["mining", "info-requests", query] as const,
  documents: (query: MiningListQuery = {}) => ["mining", "documents", query] as const,
  organisationProfiles: (query: MiningListQuery = {}) =>
    ["mining", "organisation-profiles", query] as const,
  orgMembers: (orgId: UUID) => ["miner", "org-members", orgId] as const,
  production: (query: MiningListQueryLite = {}) => ["miner", "production", query] as const,
  inventory: (query: MiningListQueryLite = {}) => ["miner", "inventory", query] as const,
};

const LIST_STALE_TIME = 30_000;
const FULL_PAGE: MiningListQuery = { page_size: 100 };
const FULL_PAGE_LITE: MiningListQueryLite = { page_size: 100 };

function invalidateMining(queryClient: QueryClient): void {
  void queryClient.invalidateQueries({ queryKey: ["mining"] });
}
function invalidateMiner(queryClient: QueryClient): void {
  void queryClient.invalidateQueries({ queryKey: ["miner"] });
}

// --- reads --------------------------------------------------------------------

export function useMinerCapabilities() {
  const hasTokens = useHasTokens();
  return useQuery({
    queryKey: minerKeys.capabilities,
    queryFn: ({ signal }) => fetchMiningCapabilities(signal),
    enabled: hasTokens,
    staleTime: 5 * 60_000,
    retry: false,
  });
}

export function useMinerDashboard() {
  const hasTokens = useHasTokens();
  return useQuery({
    queryKey: minerKeys.dashboard,
    queryFn: ({ signal }) => fetchMiningDashboard(signal),
    enabled: hasTokens,
    staleTime: LIST_STALE_TIME,
  });
}

export function useMineSites(query: MiningListQuery = FULL_PAGE) {
  const hasTokens = useHasTokens();
  return useQuery({
    queryKey: minerKeys.sites(query),
    queryFn: () => listMineSites(query),
    enabled: hasTokens,
    staleTime: LIST_STALE_TIME,
  });
}

export function useMineSite(id: UUID | null) {
  return useQuery({
    queryKey: minerKeys.site(id ?? "none"),
    queryFn: () => getMineSite(id as UUID),
    enabled: Boolean(id),
  });
}

export function useMinerEquipment(query: MiningListQuery = FULL_PAGE) {
  const hasTokens = useHasTokens();
  return useQuery({
    queryKey: minerKeys.equipment(query),
    queryFn: () => listEquipment(query),
    enabled: hasTokens,
    staleTime: LIST_STALE_TIME,
  });
}

export function useMinerApplications(query: MiningListQuery = FULL_PAGE) {
  const hasTokens = useHasTokens();
  return useQuery({
    queryKey: minerKeys.applications(query),
    queryFn: () => listMiningApplications(query),
    enabled: hasTokens,
    staleTime: LIST_STALE_TIME,
  });
}

export function useMinerNonConformities(query: MiningListQuery = FULL_PAGE) {
  const hasTokens = useHasTokens();
  return useQuery({
    queryKey: minerKeys.nonConformities(query),
    queryFn: () => listMiningNonConformities(query),
    enabled: hasTokens,
    staleTime: LIST_STALE_TIME,
  });
}

export function useMinerInfoRequests(query: MiningListQuery = FULL_PAGE) {
  const hasTokens = useHasTokens();
  return useQuery({
    queryKey: minerKeys.infoRequests(query),
    queryFn: () => listInfoRequests(query),
    enabled: hasTokens,
    staleTime: LIST_STALE_TIME,
  });
}

export function useMinerDocuments(query: MiningListQuery = FULL_PAGE) {
  const hasTokens = useHasTokens();
  return useQuery({
    queryKey: minerKeys.documents(query),
    queryFn: () => listMiningDocuments(query),
    enabled: hasTokens,
    staleTime: LIST_STALE_TIME,
  });
}

export function useMinerOrganisationProfiles(query: MiningListQuery = FULL_PAGE) {
  const hasTokens = useHasTokens();
  return useQuery({
    queryKey: minerKeys.organisationProfiles(query),
    queryFn: () => listOrganisationProfiles(query),
    enabled: hasTokens,
    staleTime: LIST_STALE_TIME,
  });
}

export function useOrgMembers(orgId: UUID | null) {
  const hasTokens = useHasTokens();
  return useQuery({
    queryKey: minerKeys.orgMembers(orgId ?? "none"),
    queryFn: () => listMembers(orgId as UUID),
    enabled: hasTokens && Boolean(orgId),
    staleTime: LIST_STALE_TIME,
  });
}

export function useProductionRecords(siteId?: UUID, query: MiningListQueryLite = FULL_PAGE_LITE) {
  const hasTokens = useHasTokens();
  const merged = siteId ? { ...query, site: siteId } : query;
  return useQuery({
    queryKey: minerKeys.production(merged),
    queryFn: () => listProductionRecords(merged),
    enabled: hasTokens,
    staleTime: LIST_STALE_TIME,
  });
}

export function useInventoryItems(siteId?: UUID, query: MiningListQueryLite = FULL_PAGE_LITE) {
  const hasTokens = useHasTokens();
  const merged = siteId ? { ...query, site: siteId } : query;
  return useQuery({
    queryKey: minerKeys.inventory(merged),
    queryFn: () => listInventoryItems(merged),
    enabled: hasTokens,
    staleTime: LIST_STALE_TIME,
  });
}

// --- mutations ------------------------------------------------------------------

export function useCreateApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<Application> & { organisation: UUID; type: string; mineral: string }) =>
      createMiningApplication(input),
    onSuccess: () => invalidateMining(queryClient),
  });
}

/**
 * `Application.status` is server-controlled (read-only on the API) and starts
 * at "pending" the moment the application is created — there is no separate
 * submit transition. This just refreshes the cached copy after creation.
 */
export function useSubmitApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (_id: UUID) => {},
    onSuccess: () => invalidateMining(queryClient),
  });
}

export function useAnswerInfoRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: UUID; message: string }) =>
      respondToInfoRequest(input.id, { message: input.message }),
    onSuccess: () => invalidateMining(queryClient),
  });
}

export function useCreateInfoRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      site: UUID;
      subject: string;
      details?: string | undefined;
      due_by?: string | null | undefined;
      priority?: InfoRequest["priority"] | undefined;
    }) => createInfoRequest(input),
    onSuccess: () => invalidateMining(queryClient),
  });
}

export function useAddActionEvidence() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: UUID; message: string; file?: File | null | undefined }) =>
      submitMiningNonConformityEvidence(input.id, { message: input.message, file: input.file }),
    onSuccess: () => invalidateMining(queryClient),
  });
}

/** Alias kept for the corrective-action screen's naming. */
export const useUpdateAction = useAddActionEvidence;

export function useRaiseNonConformity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      site: UUID;
      title: string;
      category?: string | undefined;
      severity: "minor" | "major" | "critical";
      required_action?: string | undefined;
      responsible_person?: string | undefined;
      deadline: string;
    }) => createMiningNonConformity(input),
    onSuccess: () => invalidateMining(queryClient),
  });
}

export function useUploadMinerDocument() {
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

export function useCreateProductionRecord() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (
      input: Partial<ProductionRecord> & { site: UUID; period_start: string; period_end: string },
    ) => createProductionRecord(input),
    onSuccess: () => invalidateMiner(queryClient),
  });
}

export function useCreateInventoryItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<InventoryItem> & { site: UUID; name: string; category: string }) =>
      createInventoryItem(input),
    onSuccess: () => invalidateMiner(queryClient),
  });
}
