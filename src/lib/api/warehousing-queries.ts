import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";

import {
  assignWarehousingReviewer,
  createInventoryLot,
  createStorageZone,
  createWarehouse,
  createWarehousingAccessGrant,
  createWarehousingApplication,
  createWarehousingCondition,
  createWarehousingFacility,
  createWarehousingInspection,
  createWarehousingRequest,
  decideWarehousingApplication,
  fetchWarehousingAudit,
  fetchWarehousingCapabilities,
  fetchWarehousingDashboard,
  fetchWarehousingRisk,
  generateWarehousingReport,
  getWarehousingApplication,
  listInventoryLots,
  listStorageZones,
  listWarehouses,
  listWarehousingAccessGrants,
  listWarehousingApplicationActivity,
  listWarehousingApplicationConditions,
  listWarehousingApplicationDocuments,
  listWarehousingApplicationRequests,
  listWarehousingApplications,
  listWarehousingConditions,
  listWarehousingDocuments,
  listWarehousingFacilities,
  listWarehousingInspections,
  listWarehousingNotifications,
  listWarehousingReports,
  listWarehousingRequests,
  listExpiringWarehousingDocuments,
  listWarehousingIncidents,
  createWarehousingIncident,
  closeWarehousingIncident,
  listWarehousingReleaseRequests,
  createWarehousingReleaseRequest,
  decideWarehousingRelease,
  listWarehousingMonitoringAlerts,
  createWarehousingMonitoringAlert,
  resolveWarehousingMonitoringAlert,
  listWarehousingInspectors,
  createWarehousingInspector,
  listWarehousingCertificates,
  issueWarehousingCertificate,
  updateWarehousingCertificate,
  markWarehousingNotificationRead,
  respondToWarehousingRequest,
  reviewWarehousingCondition,
  reviewWarehousingDocument,
  reviewWarehousingRequestResponse,
  reviewWarehousingSection,
  saveWarehousingSection,
  startWarehousingReview,
  submitWarehousingApplication,
  updateInventoryLot,
  updateStorageZone,
  updateWarehouse,
  updateWarehousingAccessGrant,
  updateWarehousingFacility,
  updateWarehousingInspection,
  uploadWarehousingDocument,
  type WarehousingDomainKey,
  type WarehousingDomainStatus,
  type WarehousingListQuery,
} from "./warehousing";
import { useHasTokens } from "./queries";
import type { UUID } from "./types";

/** Cache keys for the warehousing register. Every write invalidates the ["warehousing"] root. */
export const warehousingKeys = {
  root: ["warehousing"] as const,
  capabilities: ["warehousing", "capabilities"] as const,
  dashboard: ["warehousing", "dashboard"] as const,
  risk: ["warehousing", "risk"] as const,
  audit: ["warehousing", "audit"] as const,
  warehouses: (query: WarehousingListQuery = {}) => ["warehousing", "warehouses", query] as const,
  facilities: (query: WarehousingListQuery = {}) => ["warehousing", "facilities", query] as const,
  zones: (query: WarehousingListQuery = {}) => ["warehousing", "zones", query] as const,
  lots: (query: WarehousingListQuery = {}) => ["warehousing", "lots", query] as const,
  inspections: (query: WarehousingListQuery = {}) => ["warehousing", "inspections", query] as const,
  grants: (query: WarehousingListQuery = {}) => ["warehousing", "grants", query] as const,
  applications: (query: WarehousingListQuery = {}) => ["warehousing", "applications", query] as const,
  application: (id: UUID) => ["warehousing", "application", id] as const,
  applicationDocuments: (id: UUID) => ["warehousing", "application", id, "documents"] as const,
  applicationRequests: (id: UUID) => ["warehousing", "application", id, "requests"] as const,
  applicationConditions: (id: UUID) => ["warehousing", "application", id, "conditions"] as const,
  applicationActivity: (id: UUID) => ["warehousing", "application", id, "activity"] as const,
  documents: (query: WarehousingListQuery = {}) => ["warehousing", "documents", query] as const,
  expiringDocuments: ["warehousing", "documents", "expiring"] as const,
  requests: (query: WarehousingListQuery = {}) => ["warehousing", "requests", query] as const,
  conditions: (query: WarehousingListQuery = {}) => ["warehousing", "conditions", query] as const,
  notifications: (query: WarehousingListQuery = {}) => ["warehousing", "notifications", query] as const,
  reports: (query: WarehousingListQuery = {}) => ["warehousing", "reports", query] as const,
  incidents: (query: WarehousingListQuery = {}) => ["warehousing", "incidents", query] as const,
  releaseRequests: (query: WarehousingListQuery = {}) => ["warehousing", "release-requests", query] as const,
  monitoringAlerts: (query: WarehousingListQuery = {}) => ["warehousing", "monitoring-alerts", query] as const,
  inspectors: (query: WarehousingListQuery = {}) => ["warehousing", "inspectors", query] as const,
  certificates: (query: WarehousingListQuery = {}) => ["warehousing", "certificates", query] as const,
};

const LIST_STALE_TIME = 30_000;
const FULL_PAGE: WarehousingListQuery = { page_size: 100 };

function invalidateWarehousing(queryClient: QueryClient): void {
  void queryClient.invalidateQueries({ queryKey: warehousingKeys.root });
}

// --- reads -------------------------------------------------------------------

export function useWarehousingCapabilities() {
  const hasTokens = useHasTokens();
  return useQuery({
    queryKey: warehousingKeys.capabilities,
    queryFn: ({ signal }) => fetchWarehousingCapabilities(signal),
    enabled: hasTokens,
    staleTime: 5 * 60_000,
    retry: false,
  });
}

export function useWarehousingDashboard() {
  const hasTokens = useHasTokens();
  return useQuery({
    queryKey: warehousingKeys.dashboard,
    queryFn: ({ signal }) => fetchWarehousingDashboard(signal),
    enabled: hasTokens,
    staleTime: LIST_STALE_TIME,
  });
}

export function useWarehousingRisk() {
  const hasTokens = useHasTokens();
  return useQuery({
    queryKey: warehousingKeys.risk,
    queryFn: ({ signal }) => fetchWarehousingRisk(signal),
    enabled: hasTokens,
    staleTime: LIST_STALE_TIME,
  });
}

export function useWarehousingAudit() {
  const hasTokens = useHasTokens();
  return useQuery({
    queryKey: warehousingKeys.audit,
    queryFn: ({ signal }) => fetchWarehousingAudit(signal),
    enabled: hasTokens,
    staleTime: LIST_STALE_TIME,
  });
}

export function useWarehouses(query: WarehousingListQuery = FULL_PAGE) {
  const hasTokens = useHasTokens();
  return useQuery({
    queryKey: warehousingKeys.warehouses(query),
    queryFn: () => listWarehouses(query),
    enabled: hasTokens,
    staleTime: LIST_STALE_TIME,
  });
}

export function useWarehousingFacilities(query: WarehousingListQuery = FULL_PAGE) {
  const hasTokens = useHasTokens();
  return useQuery({
    queryKey: warehousingKeys.facilities(query),
    queryFn: () => listWarehousingFacilities(query),
    enabled: hasTokens,
    staleTime: LIST_STALE_TIME,
  });
}

export function useStorageZones(query: WarehousingListQuery = FULL_PAGE) {
  const hasTokens = useHasTokens();
  return useQuery({
    queryKey: warehousingKeys.zones(query),
    queryFn: () => listStorageZones(query),
    enabled: hasTokens,
    staleTime: LIST_STALE_TIME,
  });
}

export function useInventoryLots(query: WarehousingListQuery = FULL_PAGE) {
  const hasTokens = useHasTokens();
  return useQuery({
    queryKey: warehousingKeys.lots(query),
    queryFn: () => listInventoryLots(query),
    enabled: hasTokens,
    staleTime: LIST_STALE_TIME,
  });
}

export function useWarehousingInspections(query: WarehousingListQuery = FULL_PAGE) {
  const hasTokens = useHasTokens();
  return useQuery({
    queryKey: warehousingKeys.inspections(query),
    queryFn: () => listWarehousingInspections(query),
    enabled: hasTokens,
    staleTime: LIST_STALE_TIME,
  });
}

export function useWarehousingAccessGrants(query: WarehousingListQuery = FULL_PAGE) {
  const hasTokens = useHasTokens();
  return useQuery({
    queryKey: warehousingKeys.grants(query),
    queryFn: () => listWarehousingAccessGrants(query),
    enabled: hasTokens,
    staleTime: LIST_STALE_TIME,
  });
}

export function useWarehousingApplications(query: WarehousingListQuery = FULL_PAGE) {
  const hasTokens = useHasTokens();
  return useQuery({
    queryKey: warehousingKeys.applications(query),
    queryFn: () => listWarehousingApplications(query),
    enabled: hasTokens,
    staleTime: LIST_STALE_TIME,
  });
}

export function useWarehousingApplication(id: UUID | null) {
  return useQuery({
    queryKey: warehousingKeys.application(id ?? "none"),
    queryFn: () => getWarehousingApplication(id as UUID),
    enabled: Boolean(id),
  });
}

export function useWarehousingApplicationDocuments(id: UUID | null) {
  return useQuery({
    queryKey: warehousingKeys.applicationDocuments(id ?? "none"),
    queryFn: () => listWarehousingApplicationDocuments(id as UUID),
    enabled: Boolean(id),
  });
}

export function useWarehousingApplicationRequests(id: UUID | null) {
  return useQuery({
    queryKey: warehousingKeys.applicationRequests(id ?? "none"),
    queryFn: () => listWarehousingApplicationRequests(id as UUID),
    enabled: Boolean(id),
  });
}

export function useWarehousingApplicationConditions(id: UUID | null) {
  return useQuery({
    queryKey: warehousingKeys.applicationConditions(id ?? "none"),
    queryFn: () => listWarehousingApplicationConditions(id as UUID),
    enabled: Boolean(id),
  });
}

export function useWarehousingApplicationActivity(id: UUID | null) {
  return useQuery({
    queryKey: warehousingKeys.applicationActivity(id ?? "none"),
    queryFn: () => listWarehousingApplicationActivity(id as UUID),
    enabled: Boolean(id),
  });
}

export function useWarehousingDocuments(query: WarehousingListQuery = FULL_PAGE) {
  const hasTokens = useHasTokens();
  return useQuery({
    queryKey: warehousingKeys.documents(query),
    queryFn: () => listWarehousingDocuments(query),
    enabled: hasTokens,
    staleTime: LIST_STALE_TIME,
  });
}

export function useExpiringWarehousingDocuments() {
  const hasTokens = useHasTokens();
  return useQuery({
    queryKey: warehousingKeys.expiringDocuments,
    queryFn: () => listExpiringWarehousingDocuments(),
    enabled: hasTokens,
    staleTime: LIST_STALE_TIME,
  });
}

export function useWarehousingRequests(query: WarehousingListQuery = FULL_PAGE) {
  const hasTokens = useHasTokens();
  return useQuery({
    queryKey: warehousingKeys.requests(query),
    queryFn: () => listWarehousingRequests(query),
    enabled: hasTokens,
    staleTime: LIST_STALE_TIME,
  });
}

export function useWarehousingConditions(query: WarehousingListQuery = FULL_PAGE) {
  const hasTokens = useHasTokens();
  return useQuery({
    queryKey: warehousingKeys.conditions(query),
    queryFn: () => listWarehousingConditions(query),
    enabled: hasTokens,
    staleTime: LIST_STALE_TIME,
  });
}

export function useWarehousingNotifications(query: WarehousingListQuery = FULL_PAGE) {
  const hasTokens = useHasTokens();
  return useQuery({
    queryKey: warehousingKeys.notifications(query),
    queryFn: () => listWarehousingNotifications(query),
    enabled: hasTokens,
    staleTime: LIST_STALE_TIME,
  });
}

export function useWarehousingReports(query: WarehousingListQuery = FULL_PAGE) {
  const hasTokens = useHasTokens();
  return useQuery({
    queryKey: warehousingKeys.reports(query),
    queryFn: () => listWarehousingReports(query),
    enabled: hasTokens,
    staleTime: LIST_STALE_TIME,
  });
}

export function useWarehousingIncidents(query: WarehousingListQuery = FULL_PAGE) {
  const hasTokens = useHasTokens();
  return useQuery({
    queryKey: warehousingKeys.incidents(query),
    queryFn: () => listWarehousingIncidents(query),
    enabled: hasTokens,
    staleTime: LIST_STALE_TIME,
  });
}

export function useWarehousingReleaseRequests(query: WarehousingListQuery = FULL_PAGE) {
  const hasTokens = useHasTokens();
  return useQuery({
    queryKey: warehousingKeys.releaseRequests(query),
    queryFn: () => listWarehousingReleaseRequests(query),
    enabled: hasTokens,
    staleTime: LIST_STALE_TIME,
  });
}

export function useWarehousingMonitoringAlerts(query: WarehousingListQuery = FULL_PAGE) {
  const hasTokens = useHasTokens();
  return useQuery({
    queryKey: warehousingKeys.monitoringAlerts(query),
    queryFn: () => listWarehousingMonitoringAlerts(query),
    enabled: hasTokens,
    staleTime: LIST_STALE_TIME,
  });
}

export function useWarehousingInspectors(query: WarehousingListQuery = FULL_PAGE) {
  const hasTokens = useHasTokens();
  return useQuery({
    queryKey: warehousingKeys.inspectors(query),
    queryFn: () => listWarehousingInspectors(query),
    enabled: hasTokens,
    staleTime: LIST_STALE_TIME,
  });
}

export function useWarehousingCertificates(query: WarehousingListQuery = FULL_PAGE) {
  const hasTokens = useHasTokens();
  return useQuery({
    queryKey: warehousingKeys.certificates(query),
    queryFn: () => listWarehousingCertificates(query),
    enabled: hasTokens,
    staleTime: LIST_STALE_TIME,
  });
}

// --- mutations -----------------------------------------------------------------

export function useCreateWarehousingIncident() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof createWarehousingIncident>[0]) => createWarehousingIncident(input),
    onSuccess: () => invalidateWarehousing(queryClient),
  });
}

export function useCloseWarehousingIncident() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: UUID; notes: string }) => closeWarehousingIncident(input.id, input.notes),
    onSuccess: () => invalidateWarehousing(queryClient),
  });
}

export function useCreateWarehousingReleaseRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof createWarehousingReleaseRequest>[0]) =>
      createWarehousingReleaseRequest(input),
    onSuccess: () => invalidateWarehousing(queryClient),
  });
}

export function useDecideWarehousingRelease() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: UUID } & Parameters<typeof decideWarehousingRelease>[1]) => {
      const { id, ...rest } = input;
      return decideWarehousingRelease(id, rest);
    },
    onSuccess: () => invalidateWarehousing(queryClient),
  });
}

export function useCreateWarehousingMonitoringAlert() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof createWarehousingMonitoringAlert>[0]) =>
      createWarehousingMonitoringAlert(input),
    onSuccess: () => invalidateWarehousing(queryClient),
  });
}

export function useResolveWarehousingMonitoringAlert() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: UUID) => resolveWarehousingMonitoringAlert(id),
    onSuccess: () => invalidateWarehousing(queryClient),
  });
}

export function useCreateWarehousingInspector() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof createWarehousingInspector>[0]) => createWarehousingInspector(input),
    onSuccess: () => invalidateWarehousing(queryClient),
  });
}

export function useIssueWarehousingCertificate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof issueWarehousingCertificate>[0]) => issueWarehousingCertificate(input),
    onSuccess: () => invalidateWarehousing(queryClient),
  });
}

export function useUpdateWarehousingCertificate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: UUID; patch: Parameters<typeof updateWarehousingCertificate>[1] }) =>
      updateWarehousingCertificate(input.id, input.patch),
    onSuccess: () => invalidateWarehousing(queryClient),
  });
}

export function useCreateWarehousingApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (warehouse: UUID) => createWarehousingApplication(warehouse),
    onSuccess: () => invalidateWarehousing(queryClient),
  });
}

export function useCreateWarehouse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof createWarehouse>[0]) => createWarehouse(input),
    onSuccess: () => invalidateWarehousing(queryClient),
  });
}

export function useUpdateWarehouse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: UUID; patch: Parameters<typeof updateWarehouse>[1] }) =>
      updateWarehouse(input.id, input.patch),
    onSuccess: () => invalidateWarehousing(queryClient),
  });
}

export function useCreateWarehousingFacility() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof createWarehousingFacility>[0]) =>
      createWarehousingFacility(input),
    onSuccess: () => invalidateWarehousing(queryClient),
  });
}

export function useUpdateWarehousingFacility() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: UUID; patch: Parameters<typeof updateWarehousingFacility>[1] }) =>
      updateWarehousingFacility(input.id, input.patch),
    onSuccess: () => invalidateWarehousing(queryClient),
  });
}

export function useCreateStorageZone() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof createStorageZone>[0]) => createStorageZone(input),
    onSuccess: () => invalidateWarehousing(queryClient),
  });
}

export function useUpdateStorageZone() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: UUID; patch: Parameters<typeof updateStorageZone>[1] }) =>
      updateStorageZone(input.id, input.patch),
    onSuccess: () => invalidateWarehousing(queryClient),
  });
}

export function useCreateInventoryLot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof createInventoryLot>[0]) => createInventoryLot(input),
    onSuccess: () => invalidateWarehousing(queryClient),
  });
}

export function useUpdateInventoryLot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: UUID; patch: Parameters<typeof updateInventoryLot>[1] }) =>
      updateInventoryLot(input.id, input.patch),
    onSuccess: () => invalidateWarehousing(queryClient),
  });
}

export function useCreateWarehousingInspection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof createWarehousingInspection>[0]) =>
      createWarehousingInspection(input),
    onSuccess: () => invalidateWarehousing(queryClient),
  });
}

export function useUpdateWarehousingInspection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: UUID; patch: Parameters<typeof updateWarehousingInspection>[1] }) =>
      updateWarehousingInspection(input.id, input.patch),
    onSuccess: () => invalidateWarehousing(queryClient),
  });
}

export function useCreateWarehousingAccessGrant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof createWarehousingAccessGrant>[0]) =>
      createWarehousingAccessGrant(input),
    onSuccess: () => invalidateWarehousing(queryClient),
  });
}

export function useUpdateWarehousingAccessGrant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: UUID; patch: Parameters<typeof updateWarehousingAccessGrant>[1] }) =>
      updateWarehousingAccessGrant(input.id, input.patch),
    onSuccess: () => invalidateWarehousing(queryClient),
  });
}

export function useSaveWarehousingSection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: UUID; key: WarehousingDomainKey; data: Record<string, unknown> }) =>
      saveWarehousingSection(input.id, input.key, input.data),
    onSuccess: () => invalidateWarehousing(queryClient),
  });
}

export function useReviewWarehousingSection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      id: UUID;
      key: WarehousingDomainKey;
      status: WarehousingDomainStatus;
      score: number;
      notes: string;
      applicable?: boolean | undefined;
    }) =>
      reviewWarehousingSection(input.id, input.key, {
        status: input.status,
        score: input.score,
        notes: input.notes,
        applicable: input.applicable,
      }),
    onSuccess: () => invalidateWarehousing(queryClient),
  });
}

export function useAssignWarehousingReviewer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: UUID; reviewer: UUID }) =>
      assignWarehousingReviewer(input.id, input.reviewer),
    onSuccess: () => invalidateWarehousing(queryClient),
  });
}

export function useStartWarehousingReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: UUID) => startWarehousingReview(id),
    onSuccess: () => invalidateWarehousing(queryClient),
  });
}

export function useSubmitWarehousingApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: UUID) => submitWarehousingApplication(id),
    onSuccess: () => invalidateWarehousing(queryClient),
  });
}

export function useDecideWarehousingApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: UUID } & Parameters<typeof decideWarehousingApplication>[1]) =>
      decideWarehousingApplication(input.id, input),
    onSuccess: () => invalidateWarehousing(queryClient),
  });
}

export function useUploadWarehousingDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: UUID } & Parameters<typeof uploadWarehousingDocument>[1]) => {
      const { id, ...rest } = input;
      return uploadWarehousingDocument(id, rest);
    },
    onSuccess: () => invalidateWarehousing(queryClient),
  });
}

export function useCreateWarehousingRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: UUID } & Parameters<typeof createWarehousingRequest>[1]) => {
      const { id, ...rest } = input;
      return createWarehousingRequest(id, rest);
    },
    onSuccess: () => invalidateWarehousing(queryClient),
  });
}

export function useRespondToWarehousingRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { requestId: UUID } & Parameters<typeof respondToWarehousingRequest>[1]) =>
      respondToWarehousingRequest(input.requestId, input),
    onSuccess: () => invalidateWarehousing(queryClient),
  });
}

export function useReviewWarehousingRequestResponse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { requestId: UUID; accepted: boolean; notes: string }) =>
      reviewWarehousingRequestResponse(input.requestId, { accepted: input.accepted, notes: input.notes }),
    onSuccess: () => invalidateWarehousing(queryClient),
  });
}

export function useCreateWarehousingCondition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: UUID } & Parameters<typeof createWarehousingCondition>[1]) => {
      const { id, ...rest } = input;
      return createWarehousingCondition(id, rest);
    },
    onSuccess: () => invalidateWarehousing(queryClient),
  });
}

export function useReviewWarehousingCondition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { conditionId: UUID; notes: string }) =>
      reviewWarehousingCondition(input.conditionId, input.notes),
    onSuccess: () => invalidateWarehousing(queryClient),
  });
}

export function useReviewWarehousingDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: UUID; status: "verified" | "rejected"; notes: string }) =>
      reviewWarehousingDocument(input.id, { status: input.status, notes: input.notes }),
    onSuccess: () => invalidateWarehousing(queryClient),
  });
}

export function useMarkWarehousingNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: UUID) => markWarehousingNotificationRead(id),
    onSuccess: () => invalidateWarehousing(queryClient),
  });
}

export function useGenerateWarehousingReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => generateWarehousingReport(),
    onSuccess: () => invalidateWarehousing(queryClient),
  });
}
