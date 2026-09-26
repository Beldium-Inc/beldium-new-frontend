import type {
  LogisticsApplicationStatus,
  DomainReviewStatus,
  LogisticsDomainKey,
} from "./api/logistics";
import {
  useApplicationActivity,
  useApplicationRequests,
  useLogisticsApplication,
  useLogisticsDashboard,
  useRespondToRequest,
} from "./api/logistics-queries";
import { isDemoMode } from "./data-mode";
import {
  respondToRequest as respondInDemo,
  useOperator,
  type ApplicationStatus,
} from "./onboarding-store";

// The operator's onboarding application, normalised so the shell and review
// screens read one shape in both data modes. Like Miner Hub, the workspace
// shows a reduced "under review" navigation until the organisation is verified.

export type WorkspaceStage =
  | "none"
  | "draft"
  | "under_review"
  | "information_required"
  | "verified"
  | "rejected"
  | "suspended";

export type RecordRequest = {
  id: string;
  area: string;
  message: string;
  requestedAt: string;
  status: "Open" | "Responded" | "Closed";
  response?: string | undefined;
  evidence?: string | undefined;
};

export type ApplicationRecord = {
  stage: WorkspaceStage;
  statusLabel: string;
  reference: string;
  organisationName: string;
  organisationRef: string;
  submittedAt: string;
  reviews: { label: string; status: string }[];
  requests: RecordRequest[];
  timeline: { at: string; by: string; event: string }[];
  approval?:
    | {
        logisticsId: string;
        services: string[];
        vehicleCategories: string;
        coverage: string;
        capabilities: string[];
      }
    | undefined;
};

export type WorkspaceState = {
  loading: boolean;
  record: ApplicationRecord | null;
  respond: (input: {
    requestId: string;
    message: string;
    file?: File | undefined;
  }) => Promise<void>;
};

export const STAGE_LABELS: Record<WorkspaceStage, string> = {
  none: "Not started",
  draft: "Draft",
  under_review: "Under review",
  information_required: "Information required",
  verified: "Verified",
  rejected: "Rejected",
  suspended: "Suspended",
};

export function isVerified(stage: WorkspaceStage | undefined) {
  return stage === "verified";
}

// --- demo ------------------------------------------------------------------

function demoStage(status: ApplicationStatus | undefined): WorkspaceStage {
  switch (status) {
    case undefined:
      return "none";
    case "Approved":
    case "Conditionally Approved":
      return "verified";
    case "Information Required":
      return "information_required";
    case "Rejected":
      return "rejected";
    case "Suspended":
      return "suspended";
    default:
      return "under_review";
  }
}

function useDemoWorkspace(): WorkspaceState {
  const s = useOperator();
  const a = s.application;
  const record: ApplicationRecord | null = a
    ? {
        stage: demoStage(a.status),
        statusLabel: a.status,
        reference: a.applicationId,
        organisationName: s.organisation?.name ?? "My organisation",
        organisationRef: a.organisationId,
        submittedAt: a.submittedAt,
        reviews: Object.entries(a.reviews).map(([label, status]) => ({ label, status })),
        requests: a.infoRequests,
        timeline: a.timeline,
        approval: a.approval,
      }
    : s.organisation?.name
      ? {
          stage: "draft",
          statusLabel: "Draft",
          reference: "Not submitted",
          organisationName: s.organisation.name,
          organisationRef: "-",
          submittedAt: "-",
          reviews: [],
          requests: [],
          timeline: [],
        }
      : null;

  return {
    loading: false,
    record,
    respond: async ({ requestId, message, file }) =>
      respondInDemo(requestId, message, file?.name ?? ""),
  };
}

// --- api -------------------------------------------------------------------

function apiStage(status: LogisticsApplicationStatus | "not_started" | undefined): WorkspaceStage {
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
  corporate: "Organisation",
  regulatory: "Regulatory",
  fleet: "Fleet",
  driver: "Driver",
  insurance: "Insurance",
  hs: "Health & safety",
  operational: "Operational",
  mineral: "Mineral handling",
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

function useApiWorkspace(): WorkspaceState {
  const dashboard = useLogisticsDashboard();
  const company = dashboard.data?.companies[0] ?? null;
  const applicationId = company?.application_id ?? null;
  const application = useLogisticsApplication(applicationId);
  const requests = useApplicationRequests(applicationId);
  const activity = useApplicationActivity(applicationId);
  const respond = useRespondToRequest(applicationId);

  const stage = apiStage(company?.status);
  const app = application.data;

  const record: ApplicationRecord | null = company
    ? {
        stage,
        statusLabel: STAGE_LABELS[stage],
        reference: applicationId ?? "Not submitted",
        organisationName: company.name,
        organisationRef: company.reference,
        submittedAt: when(app?.submitted_at),
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
          requestedAt: when(r.created_at),
          status: r.status === "open" ? "Open" : r.status === "responded" ? "Responded" : "Closed",
          response: r.responses.at(-1)?.message,
        })),
        timeline: (activity.data?.events ?? []).map((e) => ({
          at: when(e.created_at),
          by: e.actor_id ? "Beldium" : "System",
          event: pretty(e.event_type),
        })),
        approval:
          stage === "verified"
            ? {
                logisticsId: company.reference,
                services: company.permitted_scopes,
                vehicleCategories: `${company.fleet_count} vehicle(s)`,
                coverage: "-",
                capabilities: [],
              }
            : undefined,
      }
    : null;

  return {
    loading: dashboard.isLoading,
    record,
    respond: async (input) => {
      await respond.mutateAsync(input);
    },
  };
}

/** The signed-in operator's application and verification stage. */
export const useWorkspace: () => WorkspaceState = isDemoMode ? useDemoWorkspace : useApiWorkspace;
