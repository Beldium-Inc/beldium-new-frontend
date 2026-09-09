import * as React from "react";

import { ApiError } from "@/lib/api/errors";
import {
  useCloseNonConformity,
  useComplianceReports,
  useCreateNonConformity,
  useDecideProcessingApplication,
  useEnvironmentalAlerts,
  useProcessingApplication,
  useProcessingApplications,
  useProcessingAudit,
  useProcessingCapabilities,
  useProcessingDashboard,
  useProcessingIncidents,
  useProcessingInspections,
  useProcessingNonConformities,
  useProcessors,
  useRequestInspection,
  useReviewProcessingDocument,
  useReviewApplicationSection,
  useSetAlertStatus,
  useTraceabilityRuns,
} from "@/lib/api/processing-queries";
import type { ProcessingCapabilities } from "@/lib/api/processing";
import { useCurrentUser } from "@/lib/api/queries";
import {
  DECISION_VALUE,
  SEVERITY_VALUE,
  toApplication,
  toApplicationSummary,
  toAuditEvent,
  toEnvAlert,
  toExpiringDoc,
  toIncident,
  toInspection,
  toNonConformity,
  toNotification,
  toProcessor,
  toRegionalRow,
  toReportItem,
  toTraceRun,
  type Application,
  type ApplicationSummary,
  type AuditEvent,
  type EnvAlert,
  type ExpiringDoc,
  type Incident,
  type Inspection,
  type KpiPoint,
  type NonConformity,
  type Notification,
  type Processor,
  type RegionalRow,
  type ReportItem,
  type ReviewState,
  type SectionKey,
  type Totals,
  type TraceRun,
} from "./domain";

export type Role = "operator" | "regulator";

export type SessionUser = {
  role: Role;
  name: string;
  title: string;
  org: string;
  initials: string;
};

const ROLE_TITLE: Record<Role, string> = {
  operator: "Compliance Operator",
  regulator: "Regulatory Oversight Officer",
};

function initialsOf(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "??";
  return (parts[0]![0]! + (parts[1]?.[0] ?? "")).toUpperCase();
}

type Ctx = {
  user: SessionUser | null;
  signOut: () => void;
  /** What the API says this caller may do, regardless of the chosen dashboard role. */
  capabilities: ProcessingCapabilities | null;

  applications: ApplicationSummary[];
  /** Reference → API id, so a screen holding a reference can address a write. */
  applicationIdFor: (reference: string) => string | null;
  setReview: (
    reference: string,
    section: SectionKey,
    state: ReviewState,
    note?: string,
  ) => Promise<void>;
  decide: (
    reference: string,
    decision: NonNullable<ApplicationSummary["decision"]>,
    note: string,
  ) => Promise<void>;
  requestInspection: (reference: string) => Promise<void>;

  nonConformities: NonConformity[];
  addNonConformity: (
    nc: Omit<NonConformity, "id" | "uuid" | "applicationUuid" | "raised" | "status">,
  ) => Promise<string>;
  closeNonConformity: (reference: string, accept: boolean, note?: string) => Promise<void>;

  reviewDocument: (documentId: string, accept: boolean, note?: string) => Promise<void>;

  inspections: Inspection[];
  processors: Processor[];
  envAlerts: EnvAlert[];
  setAlertStatus: (
    reference: string,
    status: "acknowledged" | "resolved",
    note?: string,
  ) => Promise<void>;
  incidents: Incident[];
  traceRuns: TraceRun[];
  reports: ReportItem[];
  audit: AuditEvent[];

  totals: Totals | null;
  kpiTrend: KpiPoint[];
  regionalCompliance: RegionalRow[];
  expiringDocs: ExpiringDoc[];
  notifications: Notification[];

  /** True until the first read of every list has settled. */
  isLoading: boolean;
  /** The first failure across the loaded queries, or null. */
  error: ApiError | null;
  /**
   * Retained so the screens' call sites still compile. The API writes the audit
   * trail itself from the mutation that caused the entry, so there is nothing
   * for the client to append — a client-written trail would be unverifiable.
   */
  log: (action: string, target: string, detail: string) => void;
};

const AppStateContext = React.createContext<Ctx | null>(null);

const EMPTY_LIST = { results: [] };

export function AppStateProvider({
  children,
  role,
  onSignOut,
}: {
  children: React.ReactNode;
  /** Seeded from the shared session, this dashboard no longer signs anyone in. */
  role: Role;
  onSignOut: () => void;
}) {
  const currentUser = useCurrentUser();
  const capabilities = useProcessingCapabilities();
  const dashboard = useProcessingDashboard();
  const applications = useProcessingApplications();
  const processors = useProcessors();
  const nonConformities = useProcessingNonConformities();
  const inspections = useProcessingInspections();
  const alerts = useEnvironmentalAlerts();
  const incidents = useProcessingIncidents();
  const runs = useTraceabilityRuns();
  const reports = useComplianceReports();
  const audit = useProcessingAudit();

  const reviewSection = useReviewApplicationSection();
  const decideApplication = useDecideProcessingApplication();
  const requestInspectionFor = useRequestInspection();
  const createNonConformity = useCreateNonConformity();
  const closeNonConformityFor = useCloseNonConformity();
  const setAlertStatusFor = useSetAlertStatus();
  const reviewDocumentFor = useReviewProcessingDocument();

  // The browser stores which dashboard the user picked at sign-in, but an
  // account the API only grants oversight to must not be shown the operator's
  // chrome: every control would be disabled and every write refused. Choosing
  // the lighter view stays allowed; claiming the heavier one does not.
  const effectiveRole: Role = capabilities.data?.audience === "regulator" ? "regulator" : role;

  const user = React.useMemo<SessionUser | null>(() => {
    const account = currentUser.data;
    if (!account) return null;
    const name = [account.first_name, account.last_name].filter(Boolean).join(" ") || account.email;
    return {
      role: effectiveRole,
      name,
      title: ROLE_TITLE[effectiveRole],
      org:
        capabilities.data?.audience === "regulator"
          ? "Regulatory oversight"
          : "Beldium Processing Compliance",
      initials: initialsOf(name),
    };
  }, [currentUser.data, capabilities.data?.audience, effectiveRole]);

  const applicationRows = React.useMemo(
    () => (applications.data ?? EMPTY_LIST).results.map(toApplicationSummary),
    [applications.data],
  );

  // Findings, inspections and their screens address applications by reference,
  // while the API returns the id; this is the one place that bridge is built.
  const referenceById = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const row of applicationRows) map.set(row.uuid, row.id);
    return map;
  }, [applicationRows]);

  const idByReference = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const row of applicationRows) map.set(row.id, row.uuid);
    return map;
  }, [applicationRows]);

  const nonConformityRows = React.useMemo(
    () =>
      (nonConformities.data ?? EMPTY_LIST).results.map((row) =>
        toNonConformity(row, (row.application && referenceById.get(row.application)) ?? ""),
      ),
    [nonConformities.data, referenceById],
  );

  const inspectionRows = React.useMemo(
    () =>
      (inspections.data ?? EMPTY_LIST).results.map((row) =>
        toInspection(row, (row.application && referenceById.get(row.application)) ?? ""),
      ),
    [inspections.data, referenceById],
  );

  const nonConformityIdFor = React.useCallback(
    (reference: string) => nonConformityRows.find((row) => row.id === reference)?.uuid ?? null,
    [nonConformityRows],
  );

  const applicationIdFor = React.useCallback(
    (reference: string) => idByReference.get(reference) ?? null,
    [idByReference],
  );

  const queries = [
    currentUser,
    capabilities,
    dashboard,
    applications,
    processors,
    nonConformities,
    inspections,
    alerts,
    incidents,
    runs,
    reports,
    audit,
  ];
  const isLoading = queries.some((query) => query.isPending);
  const firstError = queries.map((query) => query.error).find(Boolean) ?? null;

  const value: Ctx = {
    user,
    signOut: onSignOut,
    capabilities: capabilities.data ?? null,

    applications: applicationRows,
    applicationIdFor,
    setReview: async (reference, section, state, note) => {
      const id = applicationIdFor(reference);
      if (!id) return;
      await reviewSection.mutateAsync({
        id,
        key: section,
        review_state: state,
        ...(note ? { note } : {}),
      });
    },
    decide: async (reference, decision, note) => {
      const id = applicationIdFor(reference);
      if (!id) return;
      await decideApplication.mutateAsync({ id, decision: DECISION_VALUE[decision], note });
    },
    requestInspection: async (reference) => {
      const id = applicationIdFor(reference);
      if (!id) return;
      await requestInspectionFor.mutateAsync({ id });
    },

    nonConformities: nonConformityRows,
    addNonConformity: async (nc) => {
      const created = await createNonConformity.mutateAsync({
        application: applicationIdFor(nc.applicationId),
        section: nc.section,
        severity: SEVERITY_VALUE[nc.severity],
        title: nc.title,
        detail: nc.detail,
        due_on: nc.due,
      });
      return created.reference;
    },
    closeNonConformity: async (reference, accept, note) => {
      const id = nonConformityIdFor(reference);
      if (!id) return;
      await closeNonConformityFor.mutateAsync({ id, accept, ...(note ? { note } : {}) });
    },

    reviewDocument: async (documentId, accept, note) => {
      await reviewDocumentFor.mutateAsync({
        id: documentId,
        review_state: accept ? "verified" : "rejected",
        ...(note ? { note } : {}),
      });
    },

    inspections: inspectionRows,
    processors: (processors.data ?? EMPTY_LIST).results.map(toProcessor),
    envAlerts: (alerts.data ?? EMPTY_LIST).results.map(toEnvAlert),
    setAlertStatus: async (reference, status, note) => {
      const alert = (alerts.data ?? EMPTY_LIST).results.find((row) => row.reference === reference);
      if (!alert) return;
      await setAlertStatusFor.mutateAsync({ id: alert.id, status, ...(note ? { note } : {}) });
    },
    incidents: (incidents.data ?? EMPTY_LIST).results.map(toIncident),
    traceRuns: (runs.data ?? EMPTY_LIST).results.map(toTraceRun),
    reports: (reports.data ?? EMPTY_LIST).results.map(toReportItem),
    audit: (audit.data ?? EMPTY_LIST).results.map(toAuditEvent),

    totals: dashboard.data?.totals ?? null,
    kpiTrend: dashboard.data?.kpi_trend ?? [],
    regionalCompliance: (dashboard.data?.regional_compliance ?? []).map(toRegionalRow),
    expiringDocs: (dashboard.data?.expiring_documents ?? []).map(toExpiringDoc),
    notifications: (dashboard.data?.notifications ?? []).map(toNotification),

    isLoading,
    error: firstError instanceof ApiError ? firstError : null,
    log: () => {},
  };

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const ctx = React.useContext(AppStateContext);
  if (!ctx) throw new Error("useAppState must be used inside AppStateProvider");
  return ctx;
}

/**
 * One application in full, addressed by the reference the URL carries.
 *
 * Only the detail endpoint returns the ten evidence sections, so the review
 * screen reads through this rather than picking its row out of the queue.
 */
export function useApplicationDetail(reference: string): {
  application: Application | null;
  isLoading: boolean;
  error: ApiError | null;
} {
  const { applicationIdFor, isLoading: listLoading } = useAppState();
  const id = applicationIdFor(reference);
  const query = useProcessingApplication(id);
  return {
    application: query.data ? toApplication(query.data) : null,
    // The reference cannot be resolved until the queue itself has loaded.
    isLoading: listLoading || (Boolean(id) && query.isPending),
    error: query.error instanceof ApiError ? query.error : null,
  };
}
