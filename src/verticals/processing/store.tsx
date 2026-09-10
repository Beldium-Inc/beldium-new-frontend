import * as React from "react";

import { ApiError } from "@/lib/api/errors";
import {
  useCloseNonConformity,
  useCreateProcessingApplication,
  useComplianceReports,
  useCreateNonConformity,
  useDecideProcessingApplication,
  useEnvironmentalAlerts,
  useGenerateReport,
  useProcessingApplication,
  useProcessingApplications,
  useProcessingAudit,
  useProcessingCapabilities,
  useProcessingDashboard,
  useProcessingIncidents,
  useProcessingInspections,
  useProcessingNonConformities,
  useProcessors,
  useRemoveRiskCause,
  useAddRiskCause,
  useRequestInspection,
  useReviewProcessingDocument,
  useReviewApplicationSection,
  useSetAlertStatus,
  useSubmitNonConformityEvidence,
  useSubmitProcessingApplication,
  useTraceabilityRuns,
  useUpdateInspection,
  useUploadApplicationDocument,
  useSaveApplicationSection,
} from "@/lib/api/processing-queries";
import type * as Api from "@/lib/api/processing";
import type {
  NewApplicationInput,
  ProcessingCapabilities,
  ProcessingSectionKey,
  SectionField,
} from "@/lib/api/processing";
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

export type Role = "operator" | "processor" | "regulator";

export type SessionUser = {
  role: Role;
  name: string;
  title: string;
  org: string;
  initials: string;
};

const ROLE_TITLE: Record<Role, string> = {
  operator: "Compliance Operator",
  processor: "Processor / Applicant",
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
  /**
   * The application an applicant lands on. Reads are already scoped to the
   * caller, so these are all their own; this picks the one they can actually
   * act on — a draft or one the desk has sent back — before falling back to
   * whatever is still open, then to the most recent.
   */
  myApplication: ApplicationSummary | null;
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

  // --- applicant side -------------------------------------------------------
  /** Start an application. Returns the new reference. */
  startApplication: (input: NewApplicationInput) => Promise<string>;
  /** Save one section's answers. Returns it to the review queue. */
  saveSection: (reference: string, section: SectionKey, fields: SectionField[]) => Promise<void>;
  /** Upload or replace one document; re-uploading the same name replaces it. */
  uploadDocument: (
    reference: string,
    input: {
      section: ProcessingSectionKey;
      name: string;
      file: File;
      reference?: string;
      issuer?: string;
      issued_on?: string | null;
      expires_on?: string | null;
    },
  ) => Promise<void>;
  /** Hand the application to the desk. Rejects with the outstanding gaps. */
  submitApplication: (reference: string) => Promise<void>;
  /** Answer a finding with corrective-action evidence. */
  submitEvidence: (
    reference: string,
    input: { name: string; note?: string; file?: File | null },
  ) => Promise<void>;

  inspections: Inspection[];
  /** Assign an inspector and confirm a date. Desk only. */
  updateInspection: (
    reference: string,
    patch: {
      scheduled_for?: string | null;
      inspector_name?: string;
      status?: Inspection["status"];
      outcome?: string;
    },
  ) => Promise<void>;
  /** Add or withdraw a weighted contributor to an application's risk score. */
  addRiskCause: (
    applicationReference: string,
    input: { cause: string; weight: number; detail?: string },
  ) => Promise<void>;
  removeRiskCause: (applicationReference: string, causeId: string) => Promise<void>;
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
  /** Compile a new report. Returns the stored item, including its download URL. */
  generateReport: (input: {
    kind: Api.ReportKind;
    scope?: string;
    period?: Api.ReportPeriod;
  }) => Promise<ReportItem>;
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
  const updateInspectionFor = useUpdateInspection();
  const addRiskCauseFor = useAddRiskCause();
  const removeRiskCauseFor = useRemoveRiskCause();
  const generateReportFor = useGenerateReport();
  const createApplication = useCreateProcessingApplication();
  const saveSectionFor = useSaveApplicationSection();
  const uploadDocumentFor = useUploadApplicationDocument();
  const submitApplicationFor = useSubmitProcessingApplication();
  const submitEvidenceFor = useSubmitNonConformityEvidence();

  // The browser stores which dashboard the user picked at sign-in, but an
  // account the API only grants oversight to must not be shown the operator's
  // chrome: every control would be disabled and every write refused. Choosing
  // the lighter view stays allowed; claiming the heavier one does not.
  const audience = capabilities.data?.audience;
  const effectiveRole: Role =
    audience === "regulator" ? "regulator" : audience === "processor" ? "processor" : role;

  const user = React.useMemo<SessionUser | null>(() => {
    const account = currentUser.data;
    if (!account) return null;
    const name = [account.first_name, account.last_name].filter(Boolean).join(" ") || account.email;
    return {
      role: effectiveRole,
      name,
      title: ROLE_TITLE[effectiveRole],
      org:
        audience === "regulator"
          ? "Regulatory oversight"
          : audience === "processor"
            ? "Registered processor"
            : "Beldium Processing Compliance",
      initials: initialsOf(name),
    };
  }, [currentUser.data, audience, effectiveRole]);

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

  // An applicant usually has one application, but a company registering a
  // second facility has two — so "mine" is the one still needing work rather
  // than whatever the queue ordering happens to put first.
  const currentApplication = React.useMemo(() => {
    const actionable = applicationRows.find(
      (row) => row.stage === "New" || row.stage === "Awaiting Info",
    );
    const open = applicationRows.find((row) => row.stage !== "Decided");
    return actionable ?? open ?? applicationRows[0] ?? null;
  }, [applicationRows]);

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
    myApplication: currentApplication,
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

    startApplication: async (input) => {
      const created = await createApplication.mutateAsync(input);
      return created.reference;
    },
    saveSection: async (reference, section, fields) => {
      const id = applicationIdFor(reference);
      if (!id) return;
      await saveSectionFor.mutateAsync({ id, key: section, fields });
    },
    uploadDocument: async (reference, input) => {
      const id = applicationIdFor(reference);
      if (!id) return;
      await uploadDocumentFor.mutateAsync({ id, ...input });
    },
    submitApplication: async (reference) => {
      const id = applicationIdFor(reference);
      if (!id) return;
      await submitApplicationFor.mutateAsync(id);
    },
    submitEvidence: async (reference, input) => {
      const id = nonConformityIdFor(reference);
      if (!id) return;
      await submitEvidenceFor.mutateAsync({ id, ...input });
    },

    inspections: inspectionRows,
    updateInspection: async (reference, patch) => {
      const row = (inspections.data ?? EMPTY_LIST).results.find((i) => i.reference === reference);
      if (!row) return;
      await updateInspectionFor.mutateAsync({ id: row.id, patch: toInspectionPatch(patch) });
    },
    addRiskCause: async (applicationReference, input) => {
      const id = applicationIdFor(applicationReference);
      if (!id) return;
      await addRiskCauseFor.mutateAsync({ id, ...input });
    },
    removeRiskCause: async (applicationReference, causeId) => {
      const id = applicationIdFor(applicationReference);
      if (!id) return;
      await removeRiskCauseFor.mutateAsync({ id, causeId });
    },
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
    generateReport: async (input) => toReportItem(await generateReportFor.mutateAsync(input)),
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

const INSPECTION_STATUS_VALUE: Record<Inspection["status"], Api.Inspection["status"]> = {
  Requested: "requested",
  Scheduled: "scheduled",
  "In Progress": "in_progress",
  Completed: "completed",
};

function toInspectionPatch(patch: {
  scheduled_for?: string | null;
  inspector_name?: string;
  status?: Inspection["status"];
  outcome?: string;
}): Partial<Api.Inspection> {
  const out: Partial<Api.Inspection> = {};
  if (patch.scheduled_for !== undefined) out.scheduled_for = patch.scheduled_for;
  if (patch.inspector_name !== undefined) out.inspector_name = patch.inspector_name;
  if (patch.outcome !== undefined) out.outcome = patch.outcome;
  if (patch.status !== undefined) out.status = INSPECTION_STATUS_VALUE[patch.status];
  return out;
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
