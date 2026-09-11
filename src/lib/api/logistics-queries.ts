import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";

import {
  addDocumentNote,
  assignReviewer,
  createAccessGrant,
  createApplication,
  createCompany,
  createCondition,
  createDriver,
  createInformationRequest,
  createLocation,
  createRestriction,
  createVehicle,
  decideApplication,
  fetchAudit,
  fetchLogisticsDashboard,
  fetchMe,
  fetchRisk,
  generateLogisticsReport,
  getApplication,
  getCompany,
  listAccessGrants,
  listAlerts,
  listLogisticsApplicationActivity,
  listApplicationConditions,
  listLogisticsApplicationDocuments,
  listApplicationRequests,
  listApplications,
  listCompanies,
  listConditions,
  listDocumentNotes,
  listLogisticsDocuments,
  listDrivers,
  listExpiringLogisticsDocuments,
  listLocations,
  listNotifications,
  listRequests,
  listReports,
  listRestrictions,
  listVehicles,
  markNotificationRead,
  respondToRequest,
  resolveRestriction,
  reviewLogisticsApplicationSection,
  reviewCondition,
  reviewDocument,
  reviewRequestResponse,
  saveLogisticsApplicationSection,
  startReview,
  submitLogisticsApplication,
  submitConditionEvidence,
  updateAccessGrant,
  updateCompany,
  updateDriver,
  updateLocation,
  updateVehicle,
  uploadLogisticsApplicationDocument,
  type AccessGrant,
  type LogisticsListQuery,
  type LogisticsDomainKey,
  type NewLogisticsApplicationInput,
  type NewCompanyInput,
  type NewDriverInput,
  type NewVehicleInput,
  type UploadDocumentInput,
} from "./logistics";
import { useHasTokens } from "./queries";
import type { UUID } from "./types";

/**
 * Cache keys for the logistics register. Everything hangs off one
 * "logistics" root so a write can invalidate the whole vertical at once —
 * a decision, for instance, moves the application, the company's dashboard
 * row and the notification feed all together.
 */
export const logisticsKeys = {
  root: ["logistics"] as const,
  me: ["logistics", "me"] as const,
  dashboard: ["logistics", "dashboard"] as const,
  risk: ["logistics", "risk"] as const,
  audit: ["logistics", "audit"] as const,
  companies: (query: LogisticsListQuery = {}) => ["logistics", "companies", query] as const,
  company: (id: UUID) => ["logistics", "company", id] as const,
  locations: (query: LogisticsListQuery = {}) => ["logistics", "locations", query] as const,
  vehicles: (query: LogisticsListQuery = {}) => ["logistics", "vehicles", query] as const,
  drivers: (query: LogisticsListQuery = {}) => ["logistics", "drivers", query] as const,
  accessGrants: (query: LogisticsListQuery = {}) => ["logistics", "access-grants", query] as const,
  applications: (query: LogisticsListQuery = {}) => ["logistics", "applications", query] as const,
  application: (id: UUID) => ["logistics", "application", id] as const,
  applicationDocuments: (id: UUID) => ["logistics", "application", id, "documents"] as const,
  applicationRequests: (id: UUID) => ["logistics", "application", id, "requests"] as const,
  applicationConditions: (id: UUID) => ["logistics", "application", id, "conditions"] as const,
  applicationActivity: (id: UUID) => ["logistics", "application", id, "activity"] as const,
  documents: (query: LogisticsListQuery = {}) => ["logistics", "documents", query] as const,
  documentNotes: (id: UUID) => ["logistics", "document", id, "notes"] as const,
  expiringDocuments: ["logistics", "documents", "expiring"] as const,
  requests: (query: LogisticsListQuery = {}) => ["logistics", "requests", query] as const,
  conditions: (query: LogisticsListQuery = {}) => ["logistics", "conditions", query] as const,
  restrictions: (query: LogisticsListQuery = {}) => ["logistics", "restrictions", query] as const,
  notifications: (query: LogisticsListQuery = {}) => ["logistics", "notifications", query] as const,
  alerts: (query: LogisticsListQuery = {}) => ["logistics", "alerts", query] as const,
  reports: (query: LogisticsListQuery = {}) => ["logistics", "reports", query] as const,
};

/** Lists are large and change slowly; a dashboard remount shouldn't refetch all of them. */
const LIST_STALE_TIME = 30_000;

// The register is a page-size of 100 rather than the default 20: every screen
// filters and totals client-side over the whole set, so a partial page would
// silently under-report.
const FULL_PAGE: LogisticsListQuery = { page_size: 100 };

function invalidateLogistics(queryClient: QueryClient): void {
  void queryClient.invalidateQueries({ queryKey: logisticsKeys.root });
}

// --- summary / dashboard ------------------------------------------------------

export function useLogisticsMe() {
  const hasTokens = useHasTokens();
  return useQuery({
    queryKey: logisticsKeys.me,
    queryFn: ({ signal }) => fetchMe(signal),
    enabled: hasTokens,
    staleTime: 5 * 60_000,
    retry: false,
  });
}

export function useLogisticsDashboard() {
  const hasTokens = useHasTokens();
  return useQuery({
    queryKey: logisticsKeys.dashboard,
    queryFn: ({ signal }) => fetchLogisticsDashboard(signal),
    enabled: hasTokens,
    staleTime: LIST_STALE_TIME,
  });
}

export function useLogisticsRisk() {
  const hasTokens = useHasTokens();
  return useQuery({
    queryKey: logisticsKeys.risk,
    queryFn: ({ signal }) => fetchRisk(signal),
    enabled: hasTokens,
    staleTime: LIST_STALE_TIME,
  });
}

export function useLogisticsAudit() {
  const hasTokens = useHasTokens();
  return useQuery({
    queryKey: logisticsKeys.audit,
    queryFn: ({ signal }) => fetchAudit(signal),
    enabled: hasTokens,
    staleTime: LIST_STALE_TIME,
  });
}

// --- register ---------------------------------------------------------------

export function useLogisticsCompanies(query: LogisticsListQuery = FULL_PAGE) {
  const hasTokens = useHasTokens();
  return useQuery({
    queryKey: logisticsKeys.companies(query),
    queryFn: () => listCompanies(query),
    enabled: hasTokens,
    staleTime: LIST_STALE_TIME,
  });
}

export function useLogisticsCompany(id: UUID | null) {
  return useQuery({
    queryKey: logisticsKeys.company(id ?? "none"),
    queryFn: () => getCompany(id as UUID),
    enabled: Boolean(id),
  });
}

export function useLogisticsLocations(query: LogisticsListQuery = FULL_PAGE) {
  const hasTokens = useHasTokens();
  return useQuery({
    queryKey: logisticsKeys.locations(query),
    queryFn: () => listLocations(query),
    enabled: hasTokens,
    staleTime: LIST_STALE_TIME,
  });
}

export function useLogisticsVehicles(query: LogisticsListQuery = FULL_PAGE) {
  const hasTokens = useHasTokens();
  return useQuery({
    queryKey: logisticsKeys.vehicles(query),
    queryFn: () => listVehicles(query),
    enabled: hasTokens,
    staleTime: LIST_STALE_TIME,
  });
}

export function useLogisticsDrivers(query: LogisticsListQuery = FULL_PAGE) {
  const hasTokens = useHasTokens();
  return useQuery({
    queryKey: logisticsKeys.drivers(query),
    queryFn: () => listDrivers(query),
    enabled: hasTokens,
    staleTime: LIST_STALE_TIME,
  });
}

export function useLogisticsAccessGrants(query: LogisticsListQuery = FULL_PAGE) {
  const hasTokens = useHasTokens();
  return useQuery({
    queryKey: logisticsKeys.accessGrants(query),
    queryFn: () => listAccessGrants(query),
    enabled: hasTokens,
    staleTime: LIST_STALE_TIME,
  });
}

export function useLogisticsApplications(query: LogisticsListQuery = FULL_PAGE) {
  const hasTokens = useHasTokens();
  return useQuery({
    queryKey: logisticsKeys.applications(query),
    queryFn: () => listApplications(query),
    enabled: hasTokens,
    staleTime: LIST_STALE_TIME,
  });
}

export function useLogisticsApplication(id: UUID | null) {
  return useQuery({
    queryKey: logisticsKeys.application(id ?? "none"),
    queryFn: () => getApplication(id as UUID),
    enabled: Boolean(id),
  });
}

export function useLogisticsApplicationDocuments(id: UUID | null) {
  return useQuery({
    queryKey: logisticsKeys.applicationDocuments(id ?? "none"),
    queryFn: () => listLogisticsApplicationDocuments(id as UUID),
    enabled: Boolean(id),
  });
}

export function useApplicationRequests(id: UUID | null) {
  return useQuery({
    queryKey: logisticsKeys.applicationRequests(id ?? "none"),
    queryFn: () => listApplicationRequests(id as UUID),
    enabled: Boolean(id),
  });
}

export function useApplicationConditions(id: UUID | null) {
  return useQuery({
    queryKey: logisticsKeys.applicationConditions(id ?? "none"),
    queryFn: () => listApplicationConditions(id as UUID),
    enabled: Boolean(id),
  });
}

export function useLogisticsApplicationActivity(id: UUID | null) {
  return useQuery({
    queryKey: logisticsKeys.applicationActivity(id ?? "none"),
    queryFn: () => listLogisticsApplicationActivity(id as UUID),
    enabled: Boolean(id),
  });
}

export function useLogisticsDocuments(query: LogisticsListQuery = FULL_PAGE) {
  const hasTokens = useHasTokens();
  return useQuery({
    queryKey: logisticsKeys.documents(query),
    queryFn: () => listLogisticsDocuments(query),
    enabled: hasTokens,
    staleTime: LIST_STALE_TIME,
  });
}

export function useDocumentNotes(id: UUID | null) {
  return useQuery({
    queryKey: logisticsKeys.documentNotes(id ?? "none"),
    queryFn: () => listDocumentNotes(id as UUID),
    enabled: Boolean(id),
  });
}

export function useExpiringLogisticsDocuments() {
  const hasTokens = useHasTokens();
  return useQuery({
    queryKey: logisticsKeys.expiringDocuments,
    queryFn: () => listExpiringLogisticsDocuments(),
    enabled: hasTokens,
    staleTime: LIST_STALE_TIME,
  });
}

export function useLogisticsRequests(query: LogisticsListQuery = FULL_PAGE) {
  const hasTokens = useHasTokens();
  return useQuery({
    queryKey: logisticsKeys.requests(query),
    queryFn: () => listRequests(query),
    enabled: hasTokens,
    staleTime: LIST_STALE_TIME,
  });
}

export function useLogisticsConditions(query: LogisticsListQuery = FULL_PAGE) {
  const hasTokens = useHasTokens();
  return useQuery({
    queryKey: logisticsKeys.conditions(query),
    queryFn: () => listConditions(query),
    enabled: hasTokens,
    staleTime: LIST_STALE_TIME,
  });
}

export function useLogisticsRestrictions(query: LogisticsListQuery = FULL_PAGE) {
  const hasTokens = useHasTokens();
  return useQuery({
    queryKey: logisticsKeys.restrictions(query),
    queryFn: () => listRestrictions(query),
    enabled: hasTokens,
    staleTime: LIST_STALE_TIME,
  });
}

export function useLogisticsNotifications(query: LogisticsListQuery = FULL_PAGE) {
  const hasTokens = useHasTokens();
  return useQuery({
    queryKey: logisticsKeys.notifications(query),
    queryFn: () => listNotifications(query),
    enabled: hasTokens,
    staleTime: LIST_STALE_TIME,
  });
}

export function useLogisticsAlerts(query: LogisticsListQuery = FULL_PAGE) {
  const hasTokens = useHasTokens();
  return useQuery({
    queryKey: logisticsKeys.alerts(query),
    queryFn: () => listAlerts(query),
    enabled: hasTokens,
    staleTime: LIST_STALE_TIME,
  });
}

export function useLogisticsReports(query: LogisticsListQuery = FULL_PAGE) {
  const hasTokens = useHasTokens();
  return useQuery({
    queryKey: logisticsKeys.reports(query),
    queryFn: () => listReports(query),
    enabled: hasTokens,
    staleTime: LIST_STALE_TIME,
  });
}

// --- mutations ----------------------------------------------------------------

export function useCreateCompany() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: NewCompanyInput) => createCompany(input),
    onSuccess: () => invalidateLogistics(queryClient),
  });
}

export function useUpdateCompany() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: UUID; patch: Partial<NewCompanyInput> }) =>
      updateCompany(input.id, input.patch),
    onSuccess: () => invalidateLogistics(queryClient),
  });
}

export function useCreateLocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createLocation,
    onSuccess: () => invalidateLogistics(queryClient),
  });
}

export function useUpdateLocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: UUID; patch: Record<string, unknown> }) =>
      updateLocation(input.id, input.patch),
    onSuccess: () => invalidateLogistics(queryClient),
  });
}

export function useCreateVehicle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: NewVehicleInput) => createVehicle(input),
    onSuccess: () => invalidateLogistics(queryClient),
  });
}

export function useUpdateVehicle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: UUID; patch: Partial<NewVehicleInput> }) =>
      updateVehicle(input.id, input.patch),
    onSuccess: () => invalidateLogistics(queryClient),
  });
}

export function useCreateDriver() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: NewDriverInput) => createDriver(input),
    onSuccess: () => invalidateLogistics(queryClient),
  });
}

export function useUpdateDriver() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: UUID; patch: Partial<NewDriverInput> }) =>
      updateDriver(input.id, input.patch),
    onSuccess: () => invalidateLogistics(queryClient),
  });
}

export function useCreateAccessGrant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { company: UUID; user: UUID; role: AccessGrant["role"] }) =>
      createAccessGrant(input),
    onSuccess: () => invalidateLogistics(queryClient),
  });
}

export function useUpdateAccessGrant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: UUID; is_active?: boolean; role?: AccessGrant["role"] }) =>
      updateAccessGrant(input.id, { is_active: input.is_active, role: input.role }),
    onSuccess: () => invalidateLogistics(queryClient),
  });
}

export function useCreateApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: NewLogisticsApplicationInput) => createApplication(input),
    onSuccess: () => invalidateLogistics(queryClient),
  });
}

export function useSaveLogisticsApplicationSection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: UUID; key: LogisticsDomainKey; data: Record<string, unknown> }) =>
      saveLogisticsApplicationSection(input.id, input.key, input.data),
    onSuccess: () => invalidateLogistics(queryClient),
  });
}

export function useReviewLogisticsApplicationSection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      id: UUID;
      key: LogisticsDomainKey;
      status: "passed" | "attention" | "failed";
      score: number;
      notes: string;
      applicable?: boolean | undefined;
    }) =>
      reviewLogisticsApplicationSection(input.id, input.key, {
        status: input.status,
        score: input.score,
        notes: input.notes,
        applicable: input.applicable,
      }),
    onSuccess: () => invalidateLogistics(queryClient),
  });
}

export function useAssignReviewer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: UUID; reviewer: UUID }) => assignReviewer(input.id, input.reviewer),
    onSuccess: () => invalidateLogistics(queryClient),
  });
}

export function useStartReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: UUID) => startReview(id),
    onSuccess: () => invalidateLogistics(queryClient),
  });
}

export function useSubmitLogisticsApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: UUID) => submitLogisticsApplication(id),
    onSuccess: () => invalidateLogistics(queryClient),
  });
}

export function useDecideApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      id: UUID;
      status: "approved" | "conditionally_approved" | "rejected";
      rationale: string;
      conditions?: {
        title: string;
        description: string;
        due_date: string;
        service_scope?: string;
      }[];
    }) =>
      decideApplication(input.id, {
        status: input.status,
        rationale: input.rationale,
        conditions: input.conditions,
      }),
    onSuccess: () => invalidateLogistics(queryClient),
  });
}

export function useUploadLogisticsApplicationDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: UUID } & UploadDocumentInput) => {
      const { id, ...rest } = input;
      return uploadLogisticsApplicationDocument(id, rest);
    },
    onSuccess: () => invalidateLogistics(queryClient),
  });
}

export function useReviewDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: UUID; status: "verified" | "rejected"; notes: string }) =>
      reviewDocument(input.id, { status: input.status, notes: input.notes }),
    onSuccess: () => invalidateLogistics(queryClient),
  });
}

export function useAddDocumentNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: UUID; body: string; internal?: boolean | undefined }) =>
      addDocumentNote(input.id, { body: input.body, internal: input.internal }),
    onSuccess: () => invalidateLogistics(queryClient),
  });
}

export function useCreateInformationRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      id: UUID;
      reason: string;
      message: string;
      items: string[];
      due_date: string;
    }) => {
      const { id, ...rest } = input;
      return createInformationRequest(id, rest);
    },
    onSuccess: () => invalidateLogistics(queryClient),
  });
}

export function useRespondToRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: UUID; message: string; documents: UUID[] }) =>
      respondToRequest(input.id, { message: input.message, documents: input.documents }),
    onSuccess: () => invalidateLogistics(queryClient),
  });
}

export function useReviewRequestResponse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: UUID; accepted: boolean; notes: string }) =>
      reviewRequestResponse(input.id, { accepted: input.accepted, notes: input.notes }),
    onSuccess: () => invalidateLogistics(queryClient),
  });
}

export function useCreateCondition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      id: UUID;
      title: string;
      description: string;
      due_date: string;
      service_scope?: string | undefined;
    }) => {
      const { id, ...rest } = input;
      return createCondition(id, rest);
    },
    onSuccess: () => invalidateLogistics(queryClient),
  });
}

export function useSubmitConditionEvidence() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (
      input: { id: UUID } & Parameters<typeof submitConditionEvidence>[1],
    ) => {
      const { id, ...rest } = input;
      return submitConditionEvidence(id, rest);
    },
    onSuccess: () => invalidateLogistics(queryClient),
  });
}

export function useReviewCondition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: UUID; notes: string }) => reviewCondition(input.id, { notes: input.notes }),
    onSuccess: () => invalidateLogistics(queryClient),
  });
}

export function useCreateRestriction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { company: UUID; service_scope: string; reason: string }) =>
      createRestriction(input),
    onSuccess: () => invalidateLogistics(queryClient),
  });
}

export function useResolveRestriction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: UUID; notes: string }) => resolveRestriction(input.id, { notes: input.notes }),
    onSuccess: () => invalidateLogistics(queryClient),
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: UUID) => markNotificationRead(id),
    onSuccess: () => invalidateLogistics(queryClient),
  });
}

export function useGenerateLogisticsReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => generateLogisticsReport(),
    onSuccess: () => invalidateLogistics(queryClient),
  });
}
