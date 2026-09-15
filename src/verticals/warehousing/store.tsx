import * as React from "react";

import { ApiError } from "@/lib/api/errors";
import {
  useAssignWarehousingReviewer,
  useCloseWarehousingIncident,
  useCreateInventoryLot,
  useCreateStorageZone,
  useCreateWarehousingApplication,
  useCreateWarehousingCondition,
  useCreateWarehousingFacility,
  useCreateWarehousingIncident,
  useCreateWarehousingInspection,
  useCreateWarehousingReleaseRequest,
  useCreateWarehousingRequest,
  useDecideWarehousingApplication,
  useDecideWarehousingRelease,
  useExpiringWarehousingDocuments,
  useGenerateWarehousingReport,
  useInventoryLots,
  useMarkWarehousingNotificationRead,
  useRespondToWarehousingRequest,
  useReviewWarehousingCondition,
  useReviewWarehousingDocument,
  useReviewWarehousingRequestResponse,
  useReviewWarehousingSection,
  useSaveWarehousingSection,
  useStartWarehousingReview,
  useStorageZones,
  useSubmitWarehousingApplication,
  useUpdateInventoryLot,
  useUpdateWarehousingInspection,
  useUploadWarehousingDocument,
  useWarehouses,
  useWarehousingApplications,
  useWarehousingAudit,
  useWarehousingCapabilities,
  useWarehousingCertificates,
  useWarehousingDashboard,
  useWarehousingDocuments,
  useWarehousingFacilities,
  useWarehousingIncidents,
  useWarehousingInspections,
  useWarehousingMonitoringAlerts,
  useWarehousingNotifications,
  useWarehousingReleaseRequests,
  useWarehousingRisk,
} from "@/lib/api/warehousing-queries";
import type {
  InventoryLot,
  StorageZone,
  WarehouseOperator,
  WarehousingApplication,
  WarehousingCertificate,
  WarehousingCondition,
  WarehousingDocument,
  WarehousingDomainKey,
  WarehousingDomainStatus,
  WarehousingFacility,
  WarehousingIncident,
  WarehousingInformationRequest,
  WarehousingInspection,
  WarehousingMonitoringAlert,
  WarehousingNotification,
  WarehousingReleaseRequest,
} from "@/lib/api/warehousing";
import { useCurrentUser } from "@/lib/api/queries";
import type { RoleId } from "./data";

export type SessionUser = {
  id: string;
  name: string;
  initials: string;
  role: RoleId;
  warehouseId?: string | undefined;
};

function initialsOf(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "??";
  return (parts[0]![0]! + (parts[1]?.[0] ?? "")).toUpperCase();
}

type State = {
  warehouses: WarehouseOperator[];
  facilities: WarehousingFacility[];
  zones: StorageZone[];
  lots: InventoryLot[];
  inspections: WarehousingInspection[];
  applications: WarehousingApplication[];
  documents: WarehousingDocument[];
  notifications: WarehousingNotification[];
  incidents: WarehousingIncident[];
  releaseRequests: WarehousingReleaseRequest[];
  monitoringAlerts: WarehousingMonitoringAlert[];
  certificates: WarehousingCertificate[];
};

interface DemoState {
  roleId: RoleId | null;
  signOut: () => void;
  user: SessionUser | null;
  state: State;
  myWarehouse: WarehouseOperator | null;
  myApplication: WarehousingApplication | null;
  dashboard: ReturnType<typeof useWarehousingDashboard>["data"];
  risk: ReturnType<typeof useWarehousingRisk>["data"];
  audit: ReturnType<typeof useWarehousingAudit>["data"];
  expiringDocuments: WarehousingDocument[];

  createApplication: (warehouseId: string) => Promise<string>;
  saveSection: (appId: string, key: WarehousingDomainKey, data: Record<string, unknown>) => void;
  reviewSection: (
    appId: string,
    key: WarehousingDomainKey,
    input: { status: WarehousingDomainStatus; score: number; notes: string; applicable?: boolean },
  ) => void;
  assignReviewer: (appId: string, reviewer: string) => void;
  startReview: (appId: string) => void;
  submitApplication: (appId: string) => void;
  decide: (
    appId: string,
    input: {
      status: "approved" | "conditionally_approved" | "rejected";
      rationale: string;
      conditions?: { title: string; description: string; due_date: string; domain?: WarehousingDomainKey | "" }[];
    },
  ) => void;
  uploadDocument: (
    appId: string,
    input: {
      domain: WarehousingDomainKey;
      document_type: string;
      title: string;
      issuer?: string;
      reference?: string;
      issued_on?: string | null;
      expires_on?: string | null;
      lot?: string | null;
      condition?: string | null;
      file: File;
    },
  ) => void;
  reviewDocument: (id: string, status: "verified" | "rejected", notes: string) => void;
  createRequest: (
    appId: string,
    input: { reason: string; message: string; items: string[]; due_date: string },
  ) => void;
  respondToRequest: (requestId: string, message: string, documents: string[]) => void;
  reviewRequestResponse: (requestId: string, accepted: boolean, notes: string) => void;
  createCondition: (
    appId: string,
    input: { title: string; description: string; due_date: string; domain?: WarehousingDomainKey | "" },
  ) => void;
  reviewCondition: (conditionId: string, notes: string) => void;
  markNotificationRead: (id: string) => void;
  generateReport: () => void;
  createFacility: (input: Omit<WarehousingFacility, "id" | "created_at" | "updated_at">) => void;
  createZone: (input: Omit<StorageZone, "id" | "created_at" | "updated_at">) => void;
  createLot: (
    input: Omit<InventoryLot, "id" | "reference" | "variance_percent" | "created_at" | "updated_at">,
  ) => Promise<string>;
  updateLotStatus: (id: string, status: InventoryLot["status"]) => void;
  createInspection: (input: Omit<WarehousingInspection, "id" | "created_at" | "updated_at">) => void;
  updateInspection: (id: string, patch: Partial<WarehousingInspection>) => void;
  reportIncident: (
    input: Omit<WarehousingIncident, "id" | "status" | "reported_by" | "created_at" | "updated_at">,
  ) => void;
  closeIncident: (id: string, notes: string) => void;
  requestRelease: (
    input: Pick<
      WarehousingReleaseRequest,
      "warehouse" | "lot" | "requested_by_name" | "destination" | "declared_quantity" | "unit"
    >,
  ) => void;
  decideRelease: (
    id: string,
    input: {
      status: "authorised" | "declined";
      actual_weighbridge_quantity?: number | undefined;
      reason?: string | undefined;
    },
  ) => void;
  /** True until the first read of every list has settled. */
  isLoading: boolean;
  /** The first failure across the loaded queries, or null. */
  error: ApiError | null;
}

const DemoContext = React.createContext<DemoState | null>(null);
const EMPTY_LIST = { results: [] };

export function DemoProvider({
  children,
  role,
  onSignOut,
}: {
  children: React.ReactNode;
  /** Seeded from the shared session, this dashboard no longer signs anyone in. */
  role: RoleId;
  onSignOut: () => void;
}) {
  const currentUser = useCurrentUser();
  const capabilities = useWarehousingCapabilities();
  const warehouses = useWarehouses();
  const facilities = useWarehousingFacilities();
  const zones = useStorageZones();
  const lots = useInventoryLots();
  const inspections = useWarehousingInspections();
  const applications = useWarehousingApplications();
  const documents = useWarehousingDocuments();
  const notifications = useWarehousingNotifications();
  const expiringDocuments = useExpiringWarehousingDocuments();
  const incidents = useWarehousingIncidents();
  const releaseRequests = useWarehousingReleaseRequests();
  const monitoringAlerts = useWarehousingMonitoringAlerts();
  const certificates = useWarehousingCertificates();
  const dashboard = useWarehousingDashboard();
  const risk = useWarehousingRisk();
  const audit = useWarehousingAudit();

  const createApplicationFor = useCreateWarehousingApplication();
  const saveSectionFor = useSaveWarehousingSection();
  const reviewSectionFor = useReviewWarehousingSection();
  const assignReviewerFor = useAssignWarehousingReviewer();
  const startReviewFor = useStartWarehousingReview();
  const submitApplicationFor = useSubmitWarehousingApplication();
  const decideFor = useDecideWarehousingApplication();
  const uploadDocumentFor = useUploadWarehousingDocument();
  const reviewDocumentFor = useReviewWarehousingDocument();
  const createRequestFor = useCreateWarehousingRequest();
  const respondToRequestFor = useRespondToWarehousingRequest();
  const reviewRequestResponseFor = useReviewWarehousingRequestResponse();
  const createConditionFor = useCreateWarehousingCondition();
  const reviewConditionFor = useReviewWarehousingCondition();
  const markNotificationReadFor = useMarkWarehousingNotificationRead();
  const generateReportFor = useGenerateWarehousingReport();
  const createFacilityFor = useCreateWarehousingFacility();
  const createZoneFor = useCreateStorageZone();
  const createLotFor = useCreateInventoryLot();
  const updateLotFor = useUpdateInventoryLot();
  const createInspectionFor = useCreateWarehousingInspection();
  const updateInspectionFor = useUpdateWarehousingInspection();
  const reportIncidentFor = useCreateWarehousingIncident();
  const closeIncidentFor = useCloseWarehousingIncident();
  const requestReleaseFor = useCreateWarehousingReleaseRequest();
  const decideReleaseFor = useDecideWarehousingRelease();

  const myWarehouseId = React.useMemo(() => {
    const own = capabilities.data?.warehouses.find((w) => w.can_edit);
    return own?.id ?? capabilities.data?.warehouses[0]?.id ?? null;
  }, [capabilities.data]);

  const user = React.useMemo<SessionUser | null>(() => {
    const account = currentUser.data;
    if (!account) return null;
    const name = [account.first_name, account.last_name].filter(Boolean).join(" ") || account.email;
    return {
      id: account.id,
      name,
      initials: initialsOf(name),
      role,
      warehouseId: myWarehouseId ?? undefined,
    };
  }, [currentUser.data, role, myWarehouseId]);

  const warehouseRows = (warehouses.data ?? EMPTY_LIST).results;
  const facilityRows = (facilities.data ?? EMPTY_LIST).results;
  const zoneRows = (zones.data ?? EMPTY_LIST).results;
  const lotRows = (lots.data ?? EMPTY_LIST).results;
  const inspectionRows = (inspections.data ?? EMPTY_LIST).results;
  const applicationRows = (applications.data ?? EMPTY_LIST).results;
  const documentRows = (documents.data ?? EMPTY_LIST).results;
  const notificationRows = (notifications.data ?? EMPTY_LIST).results;
  const incidentRows = (incidents.data ?? EMPTY_LIST).results;
  const releaseRequestRows = (releaseRequests.data ?? EMPTY_LIST).results;
  const monitoringAlertRows = (monitoringAlerts.data ?? EMPTY_LIST).results;
  const certificateRows = (certificates.data ?? EMPTY_LIST).results;

  const myWarehouse = React.useMemo(
    () => warehouseRows.find((w) => w.id === myWarehouseId) ?? null,
    [warehouseRows, myWarehouseId],
  );
  const myApplication = React.useMemo(
    () => applicationRows.find((a) => a.warehouse === myWarehouseId) ?? null,
    [applicationRows, myWarehouseId],
  );

  const state: State = {
    warehouses: warehouseRows,
    facilities: facilityRows,
    zones: zoneRows,
    lots: lotRows,
    inspections: inspectionRows,
    applications: applicationRows,
    documents: documentRows,
    notifications: notificationRows,
    incidents: incidentRows,
    releaseRequests: releaseRequestRows,
    monitoringAlerts: monitoringAlertRows,
    certificates: certificateRows,
  };

  const queries = [currentUser, capabilities, warehouses, applications, dashboard];
  const isLoading = queries.some((query) => query.isPending);
  const firstError = queries.map((query) => query.error).find(Boolean) ?? null;

  const value: DemoState = {
    roleId: role,
    signOut: onSignOut,
    user,
    state,
    myWarehouse,
    myApplication,
    dashboard: dashboard.data,
    risk: risk.data,
    audit: audit.data,
    expiringDocuments: expiringDocuments.data ?? [],
    createApplication: async (warehouseId) => {
      const created = await createApplicationFor.mutateAsync(warehouseId);
      return created.id;
    },
    saveSection: (appId, key, data) => {
      void saveSectionFor.mutateAsync({ id: appId, key, data });
    },
    reviewSection: (appId, key, input) => {
      void reviewSectionFor.mutateAsync({ id: appId, key, ...input });
    },
    assignReviewer: (appId, reviewer) => {
      void assignReviewerFor.mutateAsync({ id: appId, reviewer });
    },
    startReview: (appId) => {
      void startReviewFor.mutateAsync(appId);
    },
    submitApplication: (appId) => {
      void submitApplicationFor.mutateAsync(appId);
    },
    decide: (appId, input) => {
      void decideFor.mutateAsync({ id: appId, ...input });
    },
    uploadDocument: (appId, input) => {
      void uploadDocumentFor.mutateAsync({ id: appId, ...input });
    },
    reviewDocument: (id, status, notes) => {
      void reviewDocumentFor.mutateAsync({ id, status, notes });
    },
    createRequest: (appId, input) => {
      void createRequestFor.mutateAsync({ id: appId, ...input });
    },
    respondToRequest: (requestId, message, documents) => {
      void respondToRequestFor.mutateAsync({ requestId, message, documents });
    },
    reviewRequestResponse: (requestId, accepted, notes) => {
      void reviewRequestResponseFor.mutateAsync({ requestId, accepted, notes });
    },
    createCondition: (appId, input) => {
      void createConditionFor.mutateAsync({ id: appId, ...input });
    },
    reviewCondition: (conditionId, notes) => {
      void reviewConditionFor.mutateAsync({ conditionId, notes });
    },
    markNotificationRead: (id) => {
      void markNotificationReadFor.mutateAsync(id);
    },
    generateReport: () => {
      void generateReportFor.mutateAsync();
    },
    createFacility: (input) => {
      void createFacilityFor.mutateAsync(input);
    },
    createZone: (input) => {
      void createZoneFor.mutateAsync(input);
    },
    createLot: async (input) => {
      const created = await createLotFor.mutateAsync(input);
      return created.id;
    },
    updateLotStatus: (id, status) => {
      void updateLotFor.mutateAsync({ id, patch: { status } });
    },
    createInspection: (input) => {
      void createInspectionFor.mutateAsync(input);
    },
    updateInspection: (id, patch) => {
      void updateInspectionFor.mutateAsync({ id, patch });
    },
    reportIncident: (input) => {
      void reportIncidentFor.mutateAsync(input);
    },
    closeIncident: (id, notes) => {
      void closeIncidentFor.mutateAsync({ id, notes });
    },
    requestRelease: (input) => {
      void requestReleaseFor.mutateAsync(input);
    },
    decideRelease: (id, input) => {
      void decideReleaseFor.mutateAsync({ id, ...input });
    },
    isLoading,
    error: firstError instanceof ApiError ? firstError : null,
  };

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function useDemo() {
  const ctx = React.useContext(DemoContext);
  if (!ctx) throw new Error("useDemo must be used inside DemoProvider");
  return ctx;
}

export type {
  InventoryLot,
  StorageZone,
  WarehouseOperator,
  WarehousingApplication,
  WarehousingCondition,
  WarehousingDocument,
  WarehousingFacility,
  WarehousingInformationRequest,
  WarehousingInspection,
  WarehousingNotification,
};
