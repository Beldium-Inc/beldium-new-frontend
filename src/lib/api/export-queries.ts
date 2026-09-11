import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";

import {
  addShipmentAuditNote,
  claimShipment,
  createShipment,
  decideExportShipment,
  fetchExportCapabilities,
  fetchExportDashboard,
  getExporter,
  getShipment,
  listExporters,
  listMonitoringEvents,
  listShipments,
  raiseExportNonConformity,
  reviewExportDocument,
  setChecklistItemState,
  updateExportNonConformity,
  type ExportChecklistItem,
  type ExportDecision,
  type ExportDocStatus,
  type ExportListQuery,
  type ExportNonConformity,
  type ExportSectionKey,
  type NewShipmentInput,
} from "./export";
import { useHasTokens } from "./queries";
import type { UUID } from "./types";

/**
 * Cache keys for the export register. Everything hangs off one "export" root
 * so a write can invalidate the whole vertical when its ripple is wide — a
 * decision, for instance, moves the shipment and every monitoring total at once.
 */
export const exportKeys = {
  root: ["export"] as const,
  capabilities: ["export", "capabilities"] as const,
  dashboard: ["export", "dashboard"] as const,
  exporters: (query: ExportListQuery = {}) => ["export", "exporters", query] as const,
  exporter: (id: UUID) => ["export", "exporter", id] as const,
  shipments: (query: ExportListQuery = {}) => ["export", "shipments", query] as const,
  shipment: (id: UUID) => ["export", "shipment", id] as const,
  monitoringEvents: (query: ExportListQuery = {}) =>
    ["export", "monitoring-events", query] as const,
};

/** Lists are large and change slowly; a dashboard remount shouldn't refetch all of them. */
const LIST_STALE_TIME = 30_000;

// The register is a page-size of 100 rather than the default 20: every screen
// filters and totals client-side over the whole set, so a partial page would
// silently under-report.
const FULL_PAGE: ExportListQuery = { page_size: 100 };

function invalidateExport(queryClient: QueryClient): void {
  void queryClient.invalidateQueries({ queryKey: exportKeys.root });
}

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

export function useExporters(query: ExportListQuery = FULL_PAGE) {
  const hasTokens = useHasTokens();
  return useQuery({
    queryKey: exportKeys.exporters(query),
    queryFn: () => listExporters(query),
    enabled: hasTokens,
    staleTime: LIST_STALE_TIME,
  });
}

export function useExporter(id: UUID | null) {
  return useQuery({
    queryKey: exportKeys.exporter(id ?? "none"),
    queryFn: () => getExporter(id as UUID),
    enabled: Boolean(id),
  });
}

export function useShipments(query: ExportListQuery = FULL_PAGE) {
  const hasTokens = useHasTokens();
  return useQuery({
    queryKey: exportKeys.shipments(query),
    queryFn: () => listShipments(query),
    enabled: hasTokens,
    staleTime: LIST_STALE_TIME,
  });
}

export function useShipment(id: UUID | null) {
  return useQuery({
    queryKey: exportKeys.shipment(id ?? "none"),
    queryFn: () => getShipment(id as UUID),
    enabled: Boolean(id),
  });
}

export function useMonitoringEvents(query: ExportListQuery = FULL_PAGE) {
  const hasTokens = useHasTokens();
  return useQuery({
    queryKey: exportKeys.monitoringEvents(query),
    queryFn: () => listMonitoringEvents(query),
    enabled: hasTokens,
    staleTime: LIST_STALE_TIME,
  });
}

// --- mutations --------------------------------------------------------------

export function useCreateShipment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: NewShipmentInput) => createShipment(input),
    onSuccess: () => invalidateExport(queryClient),
  });
}

export function useClaimShipment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: UUID) => claimShipment(id),
    onSuccess: () => invalidateExport(queryClient),
  });
}

export function useDecideExportShipment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      id: UUID;
      outcome: ExportDecision["outcome"];
      rationale: string;
      conditions?: string | undefined;
    }) =>
      decideExportShipment(input.id, {
        outcome: input.outcome,
        rationale: input.rationale,
        conditions: input.conditions,
      }),
    // A decision also changes the exporter's live-consignment and blocked counts.
    onSuccess: () => invalidateExport(queryClient),
  });
}

export function useReviewExportDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      id: UUID;
      status: ExportDocStatus;
      action: string;
      comment?: string | undefined;
    }) =>
      reviewExportDocument(input.id, {
        status: input.status,
        action: input.action,
        comment: input.comment,
      }),
    onSuccess: () => invalidateExport(queryClient),
  });
}

export function useSetChecklistItemState() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { shipmentId: UUID; itemId: UUID; state: ExportChecklistItem["state"] }) =>
      setChecklistItemState(input.shipmentId, input.itemId, input.state),
    onSuccess: () => invalidateExport(queryClient),
  });
}

export function useRaiseExportNonConformity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      shipment: UUID;
      title: string;
      severity: ExportNonConformity["severity"];
      section: ExportSectionKey;
      detail?: string | undefined;
    }) => raiseExportNonConformity(input),
    onSuccess: () => invalidateExport(queryClient),
  });
}

export function useUpdateExportNonConformity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      id: UUID;
      status?: ExportNonConformity["status"] | undefined;
      response?: string | undefined;
    }) => updateExportNonConformity(input.id, { status: input.status, response: input.response }),
    onSuccess: () => invalidateExport(queryClient),
  });
}

export function useAddShipmentAuditNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { shipmentId: UUID; action: string; detail: string }) =>
      addShipmentAuditNote(input.shipmentId, { action: input.action, detail: input.detail }),
    onSuccess: () => invalidateExport(queryClient),
  });
}
