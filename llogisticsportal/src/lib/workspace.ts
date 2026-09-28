import type {
  DomainReviewStatus,
  LogisticsApplicationStatus,
  LogisticsDomainKey,
} from "./api/logistics";
import {
  useApplicationActivity,
  useApplicationRequests,
  useLogisticsApplication,
  useLogisticsDashboard,
  useRespondToRequest,
} from "./api/logistics-queries";
import { useMyJoinRequests } from "./api/queries";

// The operator's company and onboarding application, normalised for the shell
// and review screens. Like Miner Hub, the workspace shows a reduced "under
// review" navigation until the application is approved.

export type WorkspaceStage =
  | "none"
  | "join_pending"
  | "draft"
  | "under_review"
  | "information_required"
  | "verified"
  | "rejected";

export type RecordRequest = {
  id: string;
  area: string;
  message: string;
  items: string[];
  requestedAt: string;
  dueDate: string;
  overdue: boolean;
  status: "Open" | "Responded" | "Closed";
  response?: string | undefined;
};

export type ApplicationRecord = {
  stage: WorkspaceStage;
  statusLabel: string;
  companyId: string;
  applicationId: string | null;
  reference: string;
  organisationName: string;
  submittedAt: string;
  progress: number;
  reviews: { label: string; status: string }[];
  requests: RecordRequest[];
  timeline: { at: string; by: string; event: string }[];
  permittedScopes: string[];
  restrictedScopes: string[];
};

export type WorkspaceState = {
  loading: boolean;
  error: unknown;
  record: ApplicationRecord | null;
  /** Set when the account is waiting on a join request instead of owning a company. */
  pendingJoin: { organisationName: string; requestedAt: string } | null;
  respond: (input: {
    requestId: string;
    message: string;
    file?: File | undefined;
  }) => Promise<void>;
};

export const STAGE_LABELS: Record<WorkspaceStage, string> = {
  none: "Not started",
  join_pending: "Join request pending",
  draft: "Draft",
  under_review: "Under review",
  information_required: "Information required",
  verified: "Verified",
  rejected: "Rejected",
};

export const isVerified = (stage: WorkspaceStage | undefined) => stage === "verified";

/** Stages in which the backend accepts edits and (re)submission. */
export const isEditable = (stage: WorkspaceStage | undefined) =>
  stage === "none" || stage === "draft" || stage === "information_required" || stage === "rejected";

function stageFor(status: LogisticsApplicationStatus | "not_started" | undefined): WorkspaceStage {
  switch (status) {
    case undefined:
    case "not_started":
      return "none";
    case "draft":
      return "draft";
    case "awaiting_information":
      return "information_required";
    case "approved":
    case "conditionally_approved":
      return "verified";
    case "rejected":
      return "rejected";
    default:
      return "under_review";
  }
}

const DOMAIN_LABELS: Record<LogisticsDomainKey, string> = {
  corporate: "Corporate",
  regulatory: "Regulatory",
  fleet: "Fleet",
  driver: "Driver",
  insurance: "Insurance",
  hs: "Health & safety",
  operational: "Operational",
  mineral: "Mineral transport",
  data: "Data & tracking",
};

const DOMAIN_STATUS_LABELS: Record<DomainReviewStatus, string> = {
  pending: "Under Review",
  passed: "Approved",
  attention: "Information Required",
  failed: "Rejected",
};

const pretty = (value: string) => value.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
const when = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" }) : "-";

export function useWorkspace(): WorkspaceState {
  const dashboard = useLogisticsDashboard();
  const company = dashboard.data?.companies[0] ?? null;
  const joins = useMyJoinRequests({ enabled: dashboard.isSuccess && !company });
  const applicationId = company?.application_id ?? null;
  const application = useLogisticsApplication(applicationId);
  const requests = useApplicationRequests(applicationId);
  const activity = useApplicationActivity(applicationId);
  const respond = useRespondToRequest(applicationId);

  const stage = stageFor(company?.status);
  const app = application.data;
  const pending = joins.data?.results.find((j) => j.status === "pending") ?? null;

  const record: ApplicationRecord | null = company
    ? {
        stage,
        statusLabel: STAGE_LABELS[stage],
        companyId: company.company_id,
        applicationId,
        reference: company.reference,
        organisationName: company.name,
        submittedAt: when(app?.submitted_at),
        progress: company.progress?.percent ?? 0,
        reviews: (app?.sections ?? [])
          .filter((section) => section.applicable)
          .map((section) => ({
            label: DOMAIN_LABELS[section.key],
            status: DOMAIN_STATUS_LABELS[section.status],
          })),
        requests: (requests.data ?? []).map((r) => ({
          id: r.id,
          area: pretty(r.reason),
          message: r.message,
          items: r.items,
          requestedAt: when(r.created_at),
          dueDate: r.due_date,
          overdue: r.is_overdue,
          status: r.status === "open" ? "Open" : r.status === "responded" ? "Responded" : "Closed",
          response: r.responses.at(-1)?.message,
        })),
        timeline: (activity.data?.events ?? []).map((e) => ({
          at: when(e.created_at),
          by: e.actor_id ? "Beldium" : "System",
          event: pretty(e.event_type),
        })),
        permittedScopes: company.permitted_scopes,
        restrictedScopes: company.restricted_scopes,
      }
    : null;

  return {
    loading: dashboard.isLoading || (dashboard.isSuccess && !company && joins.isLoading),
    error: dashboard.error,
    record,
    pendingJoin:
      !company && pending
        ? { organisationName: pending.organisation_name, requestedAt: when(pending.created_at) }
        : null,
    respond: async (input) => {
      await respond.mutateAsync(input);
    },
  };
}
