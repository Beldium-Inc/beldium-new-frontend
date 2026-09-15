import * as React from "react";

import { ApiError } from "@/lib/api/errors";
import {
  useAssignExportReviewer,
  useCreateExportApplication,
  useCreateExportBuyer,
  useCreateExportCondition,
  useCreateExportProduct,
  useCreateExportRequest,
  useCreateExportShipment,
  useDecideExportApplication,
  useExportApplication,
  useExportApplications,
  useExportAudit,
  useExportBuyers,
  useExportCapabilities,
  useExportDashboard,
  useExportDocuments,
  useExportNotifications,
  useExportProducts,
  useExportReports,
  useExportRisk,
  useExportShipments,
  useExporters,
  useGenerateExportReport,
  useMarkExportNotificationRead,
  useRespondToExportRequest,
  useReviewExportCondition,
  useReviewExportDocument,
  useReviewExportRequestResponse,
  useReviewExportSection,
  useSaveExportSection,
  useStartExportReview,
  useSubmitExportApplication,
  useUpdateExportShipment,
  useUploadExportDocument,
} from "@/lib/api/export-queries";
import type {
  ExportApplication,
  ExportBuyer,
  ExportCondition,
  ExportDocument,
  ExportDomainKey,
  ExportDomainStatus,
  ExportInformationRequest,
  ExportNotification,
  ExportProduct,
  ExportShipment,
  Exporter,
  createExportShipment,
} from "@/lib/api/export";
import { useCurrentUser } from "@/lib/api/queries";
import type { Role } from "./mock-data";

export type SessionUser = {
  id: string;
  name: string;
  role: Role;
  title: string;
  org: string;
  initials: string;
  exporterId?: string | undefined;
};

const ROLE_TITLE: Record<Role, string> = {
  operator: "Compliance Partner / Operator",
  exporter: "Export Manager",
  regulator: "Regulatory Oversight User",
};

const ROLE_ORG: Record<Role, string> = {
  operator: "Beldium Compliance Services",
  exporter: "Registered exporter",
  regulator: "Solid Minerals Oversight Desk",
};

function initialsOf(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "??";
  return (parts[0]![0]! + (parts[1]?.[0] ?? "")).toUpperCase();
}

type State = {
  exporters: Exporter[];
  products: ExportProduct[];
  buyers: ExportBuyer[];
  shipments: ExportShipment[];
  applications: ExportApplication[];
  documents: ExportDocument[];
  notifications: ExportNotification[];
};

type Ctx = {
  state: State;
  user: SessionUser | null;
  logout: () => void;
  /** The single application belonging to the signed-in exporter, if any. */
  myApplication: ExportApplication | null;
  myExporter: Exporter | null;
  dashboard: ReturnType<typeof useExportDashboard>["data"];
  risk: ReturnType<typeof useExportRisk>["data"];
  audit: ReturnType<typeof useExportAudit>["data"];

  createApplication: (exporterId: string) => Promise<string>;
  saveSection: (appId: string, key: ExportDomainKey, data: Record<string, unknown>) => void;
  reviewSection: (
    appId: string,
    key: ExportDomainKey,
    input: { status: ExportDomainStatus; score: number; notes: string; applicable?: boolean },
  ) => void;
  assignReviewer: (appId: string, reviewer: string) => void;
  startReview: (appId: string) => void;
  submitApplication: (appId: string) => void;
  decide: (
    appId: string,
    input: {
      status: "approved" | "conditionally_approved" | "rejected";
      rationale: string;
      conditions?: { title: string; description: string; due_date: string; domain?: ExportDomainKey | "" }[];
    },
  ) => void;
  uploadDocument: (
    appId: string,
    input: {
      domain: ExportDomainKey;
      document_type: string;
      title: string;
      issuer?: string;
      reference?: string;
      issued_on?: string | null;
      expires_on?: string | null;
      shipment?: string | null;
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
    input: { title: string; description: string; due_date: string; domain?: ExportDomainKey | "" },
  ) => void;
  reviewCondition: (conditionId: string, notes: string) => void;
  markNotificationRead: (id: string) => void;
  generateReport: () => void;
  createShipment: (input: Parameters<typeof createExportShipment>[0]) => Promise<string>;
  updateShipmentStatus: (id: string, status: ExportShipment["status"]) => void;
  createProduct: (input: Omit<ExportProduct, "id" | "created_at" | "updated_at">) => void;
  createBuyer: (input: Omit<ExportBuyer, "id" | "created_at" | "updated_at">) => void;
  /** True until the first read of every list has settled. */
  isLoading: boolean;
  /** The first failure across the loaded queries, or null. */
  error: ApiError | null;
};

const StoreContext = React.createContext<Ctx | null>(null);

const EMPTY_LIST = { results: [] };

export function StoreProvider({
  children,
  role,
  onSignOut,
}: {
  children: React.ReactNode;
  /** Seeded from the shared session - this dashboard no longer signs anyone in. */
  role: Role;
  onSignOut: () => void;
}) {
  const currentUser = useCurrentUser();
  const capabilities = useExportCapabilities();
  const exporters = useExporters();
  const products = useExportProducts();
  const buyers = useExportBuyers();
  const shipments = useExportShipments();
  const applications = useExportApplications();
  const documents = useExportDocuments();
  const notifications = useExportNotifications();
  const dashboard = useExportDashboard();
  const risk = useExportRisk();
  const audit = useExportAudit();

  const createApplicationFor = useCreateExportApplication();
  const saveSectionFor = useSaveExportSection();
  const reviewSectionFor = useReviewExportSection();
  const assignReviewerFor = useAssignExportReviewer();
  const startReviewFor = useStartExportReview();
  const submitApplicationFor = useSubmitExportApplication();
  const decideFor = useDecideExportApplication();
  const uploadDocumentFor = useUploadExportDocument();
  const reviewDocumentFor = useReviewExportDocument();
  const createRequestFor = useCreateExportRequest();
  const respondToRequestFor = useRespondToExportRequest();
  const reviewRequestResponseFor = useReviewExportRequestResponse();
  const createConditionFor = useCreateExportCondition();
  const reviewConditionFor = useReviewExportCondition();
  const markNotificationReadFor = useMarkExportNotificationRead();
  const generateReportFor = useGenerateExportReport();
  const createShipmentFor = useCreateExportShipment();
  const updateShipmentFor = useUpdateExportShipment();
  const createProductFor = useCreateExportProduct();
  const createBuyerFor = useCreateExportBuyer();

  // Capabilities lists every exporter this account can see. An exporter-role
  // account has exactly one it can edit; that is "their" exporter.
  const myExporterId = React.useMemo(() => {
    const own = capabilities.data?.exporters.find((e) => e.can_edit);
    return own?.id ?? capabilities.data?.exporters[0]?.id ?? null;
  }, [capabilities.data]);

  const effectiveRole: Role = role;

  const user = React.useMemo<SessionUser | null>(() => {
    const account = currentUser.data;
    if (!account) return null;
    const name = [account.first_name, account.last_name].filter(Boolean).join(" ") || account.email;
    return {
      id: account.id,
      name,
      role: effectiveRole,
      title: ROLE_TITLE[effectiveRole],
      org: ROLE_ORG[effectiveRole],
      initials: initialsOf(name),
      exporterId: myExporterId ?? undefined,
    };
  }, [currentUser.data, effectiveRole, myExporterId]);

  const exporterRows = (exporters.data ?? EMPTY_LIST).results;
  const productRows = (products.data ?? EMPTY_LIST).results;
  const buyerRows = (buyers.data ?? EMPTY_LIST).results;
  const shipmentRows = (shipments.data ?? EMPTY_LIST).results;
  const applicationRows = (applications.data ?? EMPTY_LIST).results;
  const documentRows = (documents.data ?? EMPTY_LIST).results;
  const notificationRows = (notifications.data ?? EMPTY_LIST).results;

  const myExporter = React.useMemo(
    () => exporterRows.find((e) => e.id === myExporterId) ?? null,
    [exporterRows, myExporterId],
  );
  const myApplication = React.useMemo(
    () => applicationRows.find((a) => a.exporter === myExporterId) ?? null,
    [applicationRows, myExporterId],
  );

  const state: State = {
    exporters: exporterRows,
    products: productRows,
    buyers: buyerRows,
    shipments: shipmentRows,
    applications: applicationRows,
    documents: documentRows,
    notifications: notificationRows,
  };

  const queries = [currentUser, capabilities, exporters, applications, dashboard];
  const isLoading = queries.some((query) => query.isPending);
  const firstError = queries.map((query) => query.error).find(Boolean) ?? null;

  const value: Ctx = {
    state,
    user,
    logout: onSignOut,
    myApplication,
    myExporter,
    dashboard: dashboard.data,
    risk: risk.data,
    audit: audit.data,
    createApplication: async (exporterId) => {
      const created = await createApplicationFor.mutateAsync(exporterId);
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
    createShipment: async (input) => {
      const created = await createShipmentFor.mutateAsync(input);
      return created.id;
    },
    updateShipmentStatus: (id, status) => {
      void updateShipmentFor.mutateAsync({ id, patch: { status } });
    },
    createProduct: (input) => {
      void createProductFor.mutateAsync(input);
    },
    createBuyer: (input) => {
      void createBuyerFor.mutateAsync(input);
    },
    isLoading,
    error: firstError instanceof ApiError ? firstError : null,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = React.useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}

export type { ExportApplication, ExportBuyer, ExportCondition, ExportDocument, ExportInformationRequest, ExportProduct, ExportShipment, Exporter };
