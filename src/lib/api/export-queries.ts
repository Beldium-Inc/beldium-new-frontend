import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";

import {
  assignExportReviewer,
  createExportAccessGrant,
  createExportApplication,
  createExportBuyer,
  createExportCondition,
  createExportProduct,
  createExportRequest,
  createExportShipment,
  createShipmentChecklistItem,
  setShipmentChecklistState,
  raiseShipmentNonConformity,
  respondToShipmentNonConformity,
  closeShipmentNonConformity,
  decideShipment,
  decideExportApplication,
  fetchExportAudit,
  fetchExportCapabilities,
  fetchExportDashboard,
  fetchExportRisk,
  generateExportReport,
  getExportApplication,
  listExportAccessGrants,
  listExportApplicationActivity,
  listExportApplicationConditions,
  listExportApplicationDocuments,
  listExportApplicationRequests,
  listExportApplications,
  listExportBuyers,
  listExportConditions,
  listExportDocuments,
  listExportNotifications,
  listExportProducts,
  listExportReports,
  listExportRequests,
  listExportShipments,
  listExpiringExportDocuments,
  listExporters,
  markExportNotificationRead,
  respondToExportRequest,
  reviewExportCondition,
  reviewExportDocument,
  reviewExportRequestResponse,
  reviewExportSection,
  saveExportSection,
  startExportReview,
  submitExportApplication,
  updateExportAccessGrant,
  updateExportBuyer,
  updateExportProduct,
  updateExportShipment,
  uploadExportDocument,
  type ExportDomainKey,
  type ExportDomainStatus,
  type ExportListQuery,
} from "./export";
import { useHasTokens } from "./queries";
import type { UUID } from "./types";

/** Cache keys for the export register. Every write invalidates the ["export"] root. */
export const exportKeys = {
  root: ["export"] as const,
  capabilities: ["export", "capabilities"] as const,
  dashboard: ["export", "dashboard"] as const,
  risk: ["export", "risk"] as const,
  audit: ["export", "audit"] as const,
  exporters: (query: ExportListQuery = {}) => ["export", "exporters", query] as const,
  products: (query: ExportListQuery = {}) => ["export", "products", query] as const,
  buyers: (query: ExportListQuery = {}) => ["export", "buyers", query] as const,
  shipments: (query: ExportListQuery = {}) => ["export", "shipments", query] as const,
  shipmentChecklist: (id: UUID) => ["export", "shipment", id, "checklist"] as const,
  shipmentNonConformities: (id: UUID) => ["export", "shipment", id, "non-conformities"] as const,
  grants: (query: ExportListQuery = {}) => ["export", "grants", query] as const,
  applications: (query: ExportListQuery = {}) => ["export", "applications", query] as const,
  application: (id: UUID) => ["export", "application", id] as const,
  applicationDocuments: (id: UUID) => ["export", "application", id, "documents"] as const,
  applicationRequests: (id: UUID) => ["export", "application", id, "requests"] as const,
  applicationConditions: (id: UUID) => ["export", "application", id, "conditions"] as const,
  applicationActivity: (id: UUID) => ["export", "application", id, "activity"] as const,
  documents: (query: ExportListQuery = {}) => ["export", "documents", query] as const,
  expiringDocuments: ["export", "documents", "expiring"] as const,
  requests: (query: ExportListQuery = {}) => ["export", "requests", query] as const,
  conditions: (query: ExportListQuery = {}) => ["export", "conditions", query] as const,
  notifications: (query: ExportListQuery = {}) => ["export", "notifications", query] as const,
  reports: (query: ExportListQuery = {}) => ["export", "reports", query] as const,
};

const LIST_STALE_TIME = 30_000;
const FULL_PAGE: ExportListQuery = { page_size: 100 };

function invalidateExport(queryClient: QueryClient): void {
  void queryClient.invalidateQueries({ queryKey: exportKeys.root });
}

// --- reads -------------------------------------------------------------------

export function useExportCapabilities() {
  const hasTokens = useHasTokens();
  return useQuery({
    queryKey: exportKeys.capabilities,
    queryFn: ({ signal }) => fetchExportCapabilities(signal),
    enabled: hasTokens,
    staleTime: 5 * 60_000,
    retry: false,
  });
}

export function useExportDashboard() {
  const hasTokens = useHasTokens();
  return useQuery({
    queryKey: exportKeys.dashboard,
    queryFn: ({ signal }) => fetchExportDashboard(signal),
    enabled: hasTokens,
    staleTime: LIST_STALE_TIME,
  });
}

export function useExportRisk() {
  const hasTokens = useHasTokens();
  return useQuery({
    queryKey: exportKeys.risk,
    queryFn: ({ signal }) => fetchExportRisk(signal),
    enabled: hasTokens,
    staleTime: LIST_STALE_TIME,
  });
}

export function useExportAudit() {
  const hasTokens = useHasTokens();
  return useQuery({
    queryKey: exportKeys.audit,
    queryFn: ({ signal }) => fetchExportAudit(signal),
    enabled: hasTokens,
    staleTime: LIST_STALE_TIME,
  });
}

export function useExporters(query: ExportListQuery = FULL_PAGE) {
  const hasTokens = useHasTokens();
  return useQuery({
    queryKey: exportKeys.exporters(query),
    queryFn: () => listExporters(query),
    enabled: hasTokens,
    staleTime: LIST_STALE_TIME,
  });
}

export function useExportProducts(query: ExportListQuery = FULL_PAGE) {
  const hasTokens = useHasTokens();
  return useQuery({
    queryKey: exportKeys.products(query),
    queryFn: () => listExportProducts(query),
    enabled: hasTokens,
    staleTime: LIST_STALE_TIME,
  });
}

export function useExportBuyers(query: ExportListQuery = FULL_PAGE) {
  const hasTokens = useHasTokens();
  return useQuery({
    queryKey: exportKeys.buyers(query),
    queryFn: () => listExportBuyers(query),
    enabled: hasTokens,
    staleTime: LIST_STALE_TIME,
  });
}

export function useExportShipments(query: ExportListQuery = FULL_PAGE) {
  const hasTokens = useHasTokens();
  return useQuery({
    queryKey: exportKeys.shipments(query),
    queryFn: () => listExportShipments(query),
    enabled: hasTokens,
    staleTime: LIST_STALE_TIME,
  });
}

export function useExportAccessGrants(query: ExportListQuery = FULL_PAGE) {
  const hasTokens = useHasTokens();
  return useQuery({
    queryKey: exportKeys.grants(query),
    queryFn: () => listExportAccessGrants(query),
    enabled: hasTokens,
    staleTime: LIST_STALE_TIME,
  });
}

export function useExportApplications(query: ExportListQuery = FULL_PAGE) {
  const hasTokens = useHasTokens();
  return useQuery({
    queryKey: exportKeys.applications(query),
    queryFn: () => listExportApplications(query),
    enabled: hasTokens,
    staleTime: LIST_STALE_TIME,
  });
}

export function useExportApplication(id: UUID | null) {
  return useQuery({
    queryKey: exportKeys.application(id ?? "none"),
    queryFn: () => getExportApplication(id as UUID),
    enabled: Boolean(id),
  });
}

export function useExportApplicationDocuments(id: UUID | null) {
  return useQuery({
    queryKey: exportKeys.applicationDocuments(id ?? "none"),
    queryFn: () => listExportApplicationDocuments(id as UUID),
    enabled: Boolean(id),
  });
}

export function useExportApplicationRequests(id: UUID | null) {
  return useQuery({
    queryKey: exportKeys.applicationRequests(id ?? "none"),
    queryFn: () => listExportApplicationRequests(id as UUID),
    enabled: Boolean(id),
  });
}

export function useExportApplicationConditions(id: UUID | null) {
  return useQuery({
    queryKey: exportKeys.applicationConditions(id ?? "none"),
    queryFn: () => listExportApplicationConditions(id as UUID),
    enabled: Boolean(id),
  });
}

export function useExportApplicationActivity(id: UUID | null) {
  return useQuery({
    queryKey: exportKeys.applicationActivity(id ?? "none"),
    queryFn: () => listExportApplicationActivity(id as UUID),
    enabled: Boolean(id),
  });
}

export function useExportDocuments(query: ExportListQuery = FULL_PAGE) {
  const hasTokens = useHasTokens();
  return useQuery({
    queryKey: exportKeys.documents(query),
    queryFn: () => listExportDocuments(query),
    enabled: hasTokens,
    staleTime: LIST_STALE_TIME,
  });
}

export function useExpiringExportDocuments() {
  const hasTokens = useHasTokens();
  return useQuery({
    queryKey: exportKeys.expiringDocuments,
    queryFn: () => listExpiringExportDocuments(),
    enabled: hasTokens,
    staleTime: LIST_STALE_TIME,
  });
}

export function useExportRequests(query: ExportListQuery = FULL_PAGE) {
  const hasTokens = useHasTokens();
  return useQuery({
    queryKey: exportKeys.requests(query),
    queryFn: () => listExportRequests(query),
    enabled: hasTokens,
    staleTime: LIST_STALE_TIME,
  });
}

export function useExportConditions(query: ExportListQuery = FULL_PAGE) {
  const hasTokens = useHasTokens();
  return useQuery({
    queryKey: exportKeys.conditions(query),
    queryFn: () => listExportConditions(query),
    enabled: hasTokens,
    staleTime: LIST_STALE_TIME,
  });
}

export function useExportNotifications(query: ExportListQuery = FULL_PAGE) {
  const hasTokens = useHasTokens();
  return useQuery({
    queryKey: exportKeys.notifications(query),
    queryFn: () => listExportNotifications(query),
    enabled: hasTokens,
    staleTime: LIST_STALE_TIME,
  });
}

export function useExportReports(query: ExportListQuery = FULL_PAGE) {
  const hasTokens = useHasTokens();
  return useQuery({
    queryKey: exportKeys.reports(query),
    queryFn: () => listExportReports(query),
    enabled: hasTokens,
    staleTime: LIST_STALE_TIME,
  });
}

// --- mutations -----------------------------------------------------------------

export function useCreateExportApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (exporter: UUID) => createExportApplication(exporter),
    onSuccess: () => invalidateExport(queryClient),
  });
}

export function useCreateExportProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof createExportProduct>[0]) => createExportProduct(input),
    onSuccess: () => invalidateExport(queryClient),
  });
}

export function useUpdateExportProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: UUID; patch: Parameters<typeof updateExportProduct>[1] }) =>
      updateExportProduct(input.id, input.patch),
    onSuccess: () => invalidateExport(queryClient),
  });
}

export function useCreateExportBuyer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof createExportBuyer>[0]) => createExportBuyer(input),
    onSuccess: () => invalidateExport(queryClient),
  });
}

export function useUpdateExportBuyer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: UUID; patch: Parameters<typeof updateExportBuyer>[1] }) =>
      updateExportBuyer(input.id, input.patch),
    onSuccess: () => invalidateExport(queryClient),
  });
}

export function useCreateShipmentChecklistItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { shipmentId: UUID } & Parameters<typeof createShipmentChecklistItem>[1]) => {
      const { shipmentId, ...rest } = input;
      return createShipmentChecklistItem(shipmentId, rest);
    },
    onSuccess: () => invalidateExport(queryClient),
  });
}

export function useSetShipmentChecklistState() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { shipmentId: UUID; itemId: UUID; state: Parameters<typeof setShipmentChecklistState>[2] }) =>
      setShipmentChecklistState(input.shipmentId, input.itemId, input.state),
    onSuccess: () => invalidateExport(queryClient),
  });
}

export function useRaiseShipmentNonConformity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { shipmentId: UUID } & Parameters<typeof raiseShipmentNonConformity>[1]) => {
      const { shipmentId, ...rest } = input;
      return raiseShipmentNonConformity(shipmentId, rest);
    },
    onSuccess: () => invalidateExport(queryClient),
  });
}

export function useRespondToShipmentNonConformity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { shipmentId: UUID; ncId: UUID; response: string }) =>
      respondToShipmentNonConformity(input.shipmentId, input.ncId, input.response),
    onSuccess: () => invalidateExport(queryClient),
  });
}

export function useCloseShipmentNonConformity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { shipmentId: UUID; ncId: UUID }) =>
      closeShipmentNonConformity(input.shipmentId, input.ncId),
    onSuccess: () => invalidateExport(queryClient),
  });
}

export function useDecideShipment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { shipmentId: UUID } & Parameters<typeof decideShipment>[1]) => {
      const { shipmentId, ...rest } = input;
      return decideShipment(shipmentId, rest);
    },
    onSuccess: () => invalidateExport(queryClient),
  });
}

export function useCreateExportShipment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof createExportShipment>[0]) => createExportShipment(input),
    onSuccess: () => invalidateExport(queryClient),
  });
}

export function useUpdateExportShipment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: UUID; patch: Parameters<typeof updateExportShipment>[1] }) =>
      updateExportShipment(input.id, input.patch),
    onSuccess: () => invalidateExport(queryClient),
  });
}

export function useCreateExportAccessGrant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof createExportAccessGrant>[0]) => createExportAccessGrant(input),
    onSuccess: () => invalidateExport(queryClient),
  });
}

export function useUpdateExportAccessGrant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: UUID; patch: Parameters<typeof updateExportAccessGrant>[1] }) =>
      updateExportAccessGrant(input.id, input.patch),
    onSuccess: () => invalidateExport(queryClient),
  });
}

export function useSaveExportSection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: UUID; key: ExportDomainKey; data: Record<string, unknown> }) =>
      saveExportSection(input.id, input.key, input.data),
    onSuccess: () => invalidateExport(queryClient),
  });
}

export function useReviewExportSection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      id: UUID;
      key: ExportDomainKey;
      status: ExportDomainStatus;
      score: number;
      notes: string;
      applicable?: boolean | undefined;
    }) =>
      reviewExportSection(input.id, input.key, {
        status: input.status,
        score: input.score,
        notes: input.notes,
        applicable: input.applicable,
      }),
    onSuccess: () => invalidateExport(queryClient),
  });
}

export function useAssignExportReviewer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: UUID; reviewer: UUID }) => assignExportReviewer(input.id, input.reviewer),
    onSuccess: () => invalidateExport(queryClient),
  });
}

export function useStartExportReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: UUID) => startExportReview(id),
    onSuccess: () => invalidateExport(queryClient),
  });
}

export function useSubmitExportApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: UUID) => submitExportApplication(id),
    onSuccess: () => invalidateExport(queryClient),
  });
}

export function useDecideExportApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: UUID } & Parameters<typeof decideExportApplication>[1]) =>
      decideExportApplication(input.id, input),
    onSuccess: () => invalidateExport(queryClient),
  });
}

export function useUploadExportDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: UUID } & Parameters<typeof uploadExportDocument>[1]) => {
      const { id, ...rest } = input;
      return uploadExportDocument(id, rest);
    },
    onSuccess: () => invalidateExport(queryClient),
  });
}

export function useCreateExportRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: UUID } & Parameters<typeof createExportRequest>[1]) => {
      const { id, ...rest } = input;
      return createExportRequest(id, rest);
    },
    onSuccess: () => invalidateExport(queryClient),
  });
}

export function useRespondToExportRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { requestId: UUID } & Parameters<typeof respondToExportRequest>[1]) =>
      respondToExportRequest(input.requestId, input),
    onSuccess: () => invalidateExport(queryClient),
  });
}

export function useReviewExportRequestResponse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { requestId: UUID; accepted: boolean; notes: string }) =>
      reviewExportRequestResponse(input.requestId, { accepted: input.accepted, notes: input.notes }),
    onSuccess: () => invalidateExport(queryClient),
  });
}

export function useCreateExportCondition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: UUID } & Parameters<typeof createExportCondition>[1]) => {
      const { id, ...rest } = input;
      return createExportCondition(id, rest);
    },
    onSuccess: () => invalidateExport(queryClient),
  });
}

export function useReviewExportCondition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { conditionId: UUID; notes: string }) =>
      reviewExportCondition(input.conditionId, input.notes),
    onSuccess: () => invalidateExport(queryClient),
  });
}

export function useReviewExportDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: UUID; status: "verified" | "rejected"; notes: string }) =>
      reviewExportDocument(input.id, { status: input.status, notes: input.notes }),
    onSuccess: () => invalidateExport(queryClient),
  });
}

export function useMarkExportNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: UUID) => markExportNotificationRead(id),
    onSuccess: () => invalidateExport(queryClient),
  });
}

export function useGenerateExportReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => generateExportReport(),
    onSuccess: () => invalidateExport(queryClient),
  });
}
