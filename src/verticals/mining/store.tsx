import { createContext, useCallback, useContext, useMemo, type ReactNode } from "react";

import { ApiError } from "@/lib/api/errors";
import {
  useAddScoreFactor as useAddScoreFactorApi,
  useCloseMiningNonConformity,
  useCreateInspection,
  useCreateMiningApplication,
  useCreateMiningNonConformity,
  useCreateInfoRequest,
  useEnvironmentalRecords,
  useExpiringLicences,
  useInfoRequests,
  useLicences,
  useMineSite,
  useMineSites,
  useMiningApplications,
  useMiningAudit,
  useMiningCapabilities,
  useMiningDashboard,
  useMiningDocuments,
  useMiningInspections,
  useMiningNonConformities,
  useMiningSamples,
  useOrganisationProfiles,
  usePendingReviews,
  useRespondToInfoRequest,
  useReviewSiteSection,
  useSafetyIncidents,
  useSubmitMiningNonConformityEvidence,
  useUpdateMineSite,
  useUpdatePendingReview,
} from "@/lib/api/mining-queries";
import type { MiningAudience, SectionKey as ApiSectionKey } from "@/lib/api/mining";
import { useCurrentUser, useOrganisationDirectory } from "@/lib/api/queries";
import {
  priorityToApi,
  ncSeverityToApi,
  toApplication,
  toDocumentRecord,
  toEnvRecord,
  toInfoRequest,
  toInspection,
  toLicenceDoc,
  toMineSite,
  toMineSiteDetail,
  toNonConformity,
  toOrganisation,
  toPendingReview,
  toSafetyIncident,
  toSample,
} from "./mappers";
import type {
  ActivityEntry,
  Application,
  DocumentRecord,
  EnvRecord,
  InfoRequest,
  Inspection,
  LicenceDoc,
  MineSite,
  NonConformity,
  Organisation,
  PendingReview,
  Role,
  SafetyIncident,
  Sample,
  SectionKey,
  Severity,
} from "./types";

export type SectionDecision =
  "Verify" | "Reject" | "Request Information" | "Request Inspection" | "Flag";

export interface Notification {
  id: string;
  at: string;
  title: string;
  body: string;
  tone: "neutral" | "positive" | "warning" | "negative";
  read: boolean;
  audience: Role[];
}

const ROLE_TITLE: Record<Role, string> = {
  partner: "Mining Compliance Partner",
  miner: "Managing Director",
  regulator: "Regulatory Oversight Officer",
};

function audienceToRole(audience: MiningAudience | null | undefined, fallback: Role): Role {
  if (audience === "regulator") return "regulator";
  if (audience === "miner") return "miner";
  if (audience === "operator" || audience === "partner") return "partner";
  return fallback;
}

function initialsOf(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "??";
  return (parts[0]![0]! + (parts[1]?.[0] ?? "")).toUpperCase();
}

interface Ctx {
  role: Role | null;
  user: { name: string; initials: string; title: string; isStaff: boolean } | null;
  actorName: string;
  hydrated: boolean;
  isLoading: boolean;
  error: ApiError | null;

  sites: MineSite[];
  nonConformities: NonConformity[];
  infoRequests: InfoRequest[];
  inspections: Inspection[];
  reviews: PendingReview[];
  applications: Application[];
  documents: DocumentRecord[];
  activity: ActivityEntry[];
  notifications: Notification[];
  licences: LicenceDoc[];
  organisations: Organisation[];
  envRecords: EnvRecord[];
  safetyIncidents: SafetyIncident[];
  samples: Sample[];
  complianceTrend: { month: string; score: number; inspections: number; nonConformities: number }[];

  logout: () => void;
  resetDemo: () => void;
  markNotificationsRead: () => void;
  decideSection: (
    siteId: string,
    section: SectionKey,
    decision: SectionDecision,
    note: string,
  ) => Promise<void>;
  requestInformation: (input: {
    siteId: string;
    section: SectionKey | "general";
    subject: string;
    details: string;
    dueBy: string;
    priority: "Low" | "Normal" | "High";
    requestedFrom: string;
  }) => Promise<void>;
  respondToInfoRequest: (id: string, message: string, attachments: string[]) => Promise<void>;
  raiseNonConformity: (input: {
    siteId: string;
    title: string;
    category: string;
    severity: Severity;
    requiredAction: string;
    responsiblePerson: string;
    deadline: string;
  }) => Promise<void>;
  submitCorrectiveAction: (ncId: string, message: string, attachments: string[]) => Promise<void>;
  decideCorrectiveAction: (
    ncId: string,
    submissionId: string,
    decision: "Accepted" | "Rejected" | "More Info Requested",
    note: string,
  ) => Promise<void>;
  requestInspection: (siteId: string, type: string, note: string) => Promise<void>;
  completeReview: (reviewId: string) => Promise<void>;
  startReview: (reviewId: string) => Promise<void>;
  regulatorAction: (
    kind: "Send Reminder" | "Request Information" | "Flag Site" | "Acknowledge Submission",
    siteId: string,
    note?: string,
  ) => Promise<void>;
  logActivity: (entry: Omit<ActivityEntry, "id" | "at" | "role" | "actor">) => void;
}

const StoreContext = createContext<Ctx | null>(null);

const EMPTY_LIST = { results: [] };

export function PrototypeStoreProvider({
  children,
  role,
  onSignOut,
}: {
  children: ReactNode;
  /** Seeded from the shared session; the API's own `audience` can widen or narrow this. */
  role: Role;
  onSignOut: () => void;
}) {
  const currentUser = useCurrentUser();
  const capabilities = useMiningCapabilities();
  const dashboard = useMiningDashboard();
  const sitesQuery = useMineSites();
  const nonConformitiesQuery = useMiningNonConformities();
  const inspectionsQuery = useMiningInspections();
  const samplesQuery = useMiningSamples();
  const applicationsQuery = useMiningApplications();
  const reviewsQuery = usePendingReviews();
  const infoRequestsQuery = useInfoRequests();
  const licencesQuery = useLicences();
  useExpiringLicences();
  const documentsQuery = useMiningDocuments();
  const envRecordsQuery = useEnvironmentalRecords();
  const safetyIncidentsQuery = useSafetyIncidents();
  const orgProfilesQuery = useOrganisationProfiles();
  const orgDirectory = useOrganisationDirectory();
  const auditQuery = useMiningAudit();

  const reviewSection = useReviewSiteSection();
  const updateSite = useUpdateMineSite();
  const createInspectionFor = useCreateInspection();
  const createInfoRequestFor = useCreateInfoRequest();
  const respondToInfoRequestFor = useRespondToInfoRequest();
  const createNonConformityFor = useCreateMiningNonConformity();
  const submitEvidenceFor = useSubmitMiningNonConformityEvidence();
  const closeNonConformityFor = useCloseMiningNonConformity();
  const updateReviewFor = useUpdatePendingReview();
  // Not yet used by any screen; kept wired so the applicant/scoring flows can
  // adopt them without another pass through the store.
  void useCreateMiningApplication;
  void useAddScoreFactorApi;

  const audience = capabilities.data?.audience;
  const effectiveRole = audienceToRole(audience, role);

  const user = useMemo(() => {
    const account = currentUser.data;
    if (!account) return null;
    const name = [account.first_name, account.last_name].filter(Boolean).join(" ") || account.email;
    return { name, initials: initialsOf(name), title: ROLE_TITLE[effectiveRole], isStaff: Boolean(account.is_staff) };
  }, [currentUser.data, effectiveRole]);

  const sites = useMemo(
    () => (sitesQuery.data ?? EMPTY_LIST).results.map(toMineSite),
    [sitesQuery.data],
  );
  const nonConformities = useMemo(
    () => (nonConformitiesQuery.data ?? EMPTY_LIST).results.map(toNonConformity),
    [nonConformitiesQuery.data],
  );
  const inspections = useMemo(
    () => (inspectionsQuery.data ?? EMPTY_LIST).results.map(toInspection),
    [inspectionsQuery.data],
  );
  const samples = useMemo(
    () => (samplesQuery.data ?? EMPTY_LIST).results.map(toSample),
    [samplesQuery.data],
  );
  const applications = useMemo(
    () => (applicationsQuery.data ?? EMPTY_LIST).results.map(toApplication),
    [applicationsQuery.data],
  );
  const reviews = useMemo(
    () => (reviewsQuery.data ?? EMPTY_LIST).results.map(toPendingReview),
    [reviewsQuery.data],
  );
  const infoRequests = useMemo(
    () => (infoRequestsQuery.data ?? EMPTY_LIST).results.map(toInfoRequest),
    [infoRequestsQuery.data],
  );
  const licences = useMemo(
    () => (licencesQuery.data ?? EMPTY_LIST).results.map(toLicenceDoc),
    [licencesQuery.data],
  );
  const documents = useMemo(
    () => (documentsQuery.data ?? EMPTY_LIST).results.map(toDocumentRecord),
    [documentsQuery.data],
  );
  const envRecords = useMemo(
    () => (envRecordsQuery.data ?? EMPTY_LIST).results.map(toEnvRecord),
    [envRecordsQuery.data],
  );
  const safetyIncidents = useMemo(
    () => (safetyIncidentsQuery.data ?? EMPTY_LIST).results.map(toSafetyIncident),
    [safetyIncidentsQuery.data],
  );

  const organisations = useMemo(() => {
    const profiles = (orgProfilesQuery.data ?? EMPTY_LIST).results;
    const dirRows = (orgDirectory.data ?? EMPTY_LIST).results;
    return dirRows.map((row) => {
      const profile = profiles.find((p) => p.organisation === row.id);
      const sitesForOrg = sites.filter((s) => s.orgId === row.id);
      return toOrganisation(row, profile, sitesForOrg);
    });
  }, [orgProfilesQuery.data, orgDirectory.data, sites]);

  const activity: ActivityEntry[] = useMemo(
    () =>
      (auditQuery.data ?? EMPTY_LIST).results.map((row) => ({
        id: row.id,
        at: row.created_at.slice(0, 16).replace("T", " "),
        actor: row.actor,
        role: (row.role as Role) || "partner",
        action: row.action,
        detail: row.detail,
        ...(row.target ? { target: row.target } : {}),
        tone: "neutral" as const,
      })),
    [auditQuery.data],
  );

  const notifications: Notification[] = useMemo(
    () =>
      (dashboard.data?.notifications ?? []).map((raw, i) => {
        const n = raw as Record<string, unknown>;
        return {
          id: String(n["id"] ?? i),
          at: String(n["at"] ?? ""),
          title: String(n["title"] ?? ""),
          body: String(n["body"] ?? ""),
          tone: (["neutral", "positive", "warning", "negative"] as const).includes(
            n["tone"] as never,
          )
            ? (n["tone"] as Notification["tone"])
            : "neutral",
          read: Boolean(n["read"]),
          audience: (Array.isArray(n["audience"])
            ? n["audience"]
            : ["partner", "miner", "regulator"]) as Role[],
        };
      }),
    [dashboard.data],
  );

  const complianceTrend = useMemo(
    () =>
      (dashboard.data?.kpi_trend ?? []).map((raw) => {
        const p = raw as Record<string, unknown>;
        return {
          month: String(p["month"] ?? ""),
          score: Number(p["score"] ?? 0),
          inspections: Number(p["inspections"] ?? 0),
          nonConformities: Number(p["non_conformities"] ?? p["nonConformities"] ?? 0),
        };
      }),
    [dashboard.data],
  );

  const queries = [
    currentUser,
    capabilities,
    dashboard,
    sitesQuery,
    nonConformitiesQuery,
    inspectionsQuery,
    samplesQuery,
    applicationsQuery,
    reviewsQuery,
    infoRequestsQuery,
    licencesQuery,
    documentsQuery,
    envRecordsQuery,
    safetyIncidentsQuery,
    orgProfilesQuery,
    orgDirectory,
    auditQuery,
  ];
  const isLoading = queries.some((q) => q.isPending);
  const firstError = queries.map((q) => q.error).find(Boolean) ?? null;

  const logout = onSignOut;
  const resetDemo = useCallback(() => {
    // No local mutable state left to reset; kept so the sidebar action still compiles.
  }, []);
  const markNotificationsRead = useCallback(() => {}, []);
  const logActivity = useCallback(() => {}, []);

  const decideSection = useCallback<Ctx["decideSection"]>(
    async (siteId, section, decision, note) => {
      const status =
        decision === "Verify"
          ? "verified"
          : decision === "Reject"
            ? "rejected"
            : decision === "Request Inspection"
              ? "inspection_requested"
              : decision === "Flag"
                ? "flagged"
                : "info_requested";
      await reviewSection.mutateAsync({
        id: siteId,
        key: section as ApiSectionKey,
        status,
        note: note || undefined,
      });
      if (decision === "Request Inspection") {
        await createInspectionFor.mutateAsync({
          site: siteId,
          type: "follow_up",
          inspector_name: "Unassigned",
        });
      }
      if (decision === "Flag") {
        await updateSite.mutateAsync({ id: siteId, patch: { status: "suspended", risk: "high" } });
      }
    },
    [reviewSection, createInspectionFor, updateSite],
  );

  const requestInformation = useCallback<Ctx["requestInformation"]>(
    async (input) => {
      await createInfoRequestFor.mutateAsync({
        site: input.siteId,
        section: input.section === "general" ? undefined : (input.section as ApiSectionKey),
        subject: input.subject,
        details: input.details,
        due_by: input.dueBy,
        priority: priorityToApi[input.priority],
      });
    },
    [createInfoRequestFor],
  );

  const respondToInfoRequest = useCallback<Ctx["respondToInfoRequest"]>(
    async (id, message) => {
      await respondToInfoRequestFor.mutateAsync({ id, message });
    },
    [respondToInfoRequestFor],
  );

  const raiseNonConformity = useCallback<Ctx["raiseNonConformity"]>(
    async (input) => {
      await createNonConformityFor.mutateAsync({
        site: input.siteId,
        title: input.title,
        category: input.category,
        severity: ncSeverityToApi[input.severity],
        required_action: input.requiredAction,
        responsible_person: input.responsiblePerson,
        deadline: input.deadline,
      });
    },
    [createNonConformityFor],
  );

  const submitCorrectiveAction = useCallback<Ctx["submitCorrectiveAction"]>(
    async (ncId, message) => {
      await submitEvidenceFor.mutateAsync({ id: ncId, message });
    },
    [submitEvidenceFor],
  );

  const decideCorrectiveAction = useCallback<Ctx["decideCorrectiveAction"]>(
    async (ncId, _submissionId, decision, note) => {
      await closeNonConformityFor.mutateAsync({
        id: ncId,
        accept: decision === "Accepted",
        note: note || undefined,
      });
    },
    [closeNonConformityFor],
  );

  const requestInspection = useCallback<Ctx["requestInspection"]>(
    async (siteId, _type, note) => {
      void note;
      await createInspectionFor.mutateAsync({
        site: siteId,
        type: "follow_up",
        inspector_name: "Unassigned",
        scheduled_for: null,
      });
    },
    [createInspectionFor],
  );

  const startReview = useCallback<Ctx["startReview"]>(
    async (reviewId) => {
      await updateReviewFor.mutateAsync({ id: reviewId, patch: { status: "in_progress" } });
    },
    [updateReviewFor],
  );

  const completeReview = useCallback<Ctx["completeReview"]>(
    async (reviewId) => {
      await updateReviewFor.mutateAsync({ id: reviewId, patch: { status: "completed" } });
    },
    [updateReviewFor],
  );

  const regulatorAction = useCallback<Ctx["regulatorAction"]>(
    async (kind, siteId) => {
      if (kind === "Flag Site") {
        await updateSite.mutateAsync({
          id: siteId,
          patch: { status: "under_review", risk: "high" },
        });
      }
      // Send Reminder / Request Information / Acknowledge Submission have no
      // dedicated write endpoint yet; real oversight actions are recorded
      // through the flows above instead.
    },
    [updateSite],
  );

  const value: Ctx = {
    role: effectiveRole,
    user,
    actorName: user?.name ?? "System",
    hydrated: !isLoading,
    isLoading,
    error: firstError instanceof ApiError ? firstError : null,

    sites,
    nonConformities,
    infoRequests,
    inspections,
    reviews,
    applications,
    documents,
    activity,
    notifications,
    licences,
    organisations,
    envRecords,
    safetyIncidents,
    samples,
    complianceTrend,

    logout,
    resetDemo,
    markNotificationsRead,
    decideSection,
    requestInformation,
    respondToInfoRequest,
    raiseNonConformity,
    submitCorrectiveAction,
    decideCorrectiveAction,
    requestInspection,
    completeReview,
    startReview,
    regulatorAction,
    logActivity,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside PrototypeStoreProvider");
  return ctx;
}

/**
 * One site in full, including its ten review sections. The list read used by
 * `useStore().sites` intentionally omits them, mirroring the API's list/detail split.
 */
export function useSiteDetail(siteId: string | null): {
  site: MineSite | null;
  isLoading: boolean;
  error: ApiError | null;
} {
  const query = useMineSite(siteId);
  return {
    site: query.data ? toMineSiteDetail(query.data) : null,
    isLoading: query.isPending,
    error: query.error instanceof ApiError ? query.error : null,
  };
}
