import * as React from "react";
import {
  APPLICATIONS,
  NON_CONFORMITIES,
  INSPECTIONS,
  AUDIT_LOG,
  type Application,
  type AuditEvent,
  type Inspection,
  type NonConformity,
  type ReviewState,
  type SectionKey,
} from "./mock-data";

export type Role = "operator" | "regulator";

export type SessionUser = {
  role: Role;
  name: string;
  title: string;
  org: string;
  initials: string;
};

export const DEMO_USERS: Record<Role, SessionUser> = {
  operator: {
    role: "operator",
    name: "Olumide Adeyemi",
    title: "Compliance Operator",
    org: "Beldium Processing Compliance Partner",
    initials: "OA",
  },
  regulator: {
    role: "regulator",
    name: "Dr. Amina Sule",
    title: "Regulatory Oversight Officer",
    org: "National Minerals Oversight Directorate",
    initials: "AS",
  },
};

type ReviewMap = Record<string, Partial<Record<SectionKey, ReviewState>>>;

type Ctx = {
  user: SessionUser | null;
  signIn: (role: Role) => void;
  signOut: () => void;
  applications: Application[];
  reviews: ReviewMap;
  setReview: (appId: string, section: SectionKey, state: ReviewState) => void;
  nonConformities: NonConformity[];
  addNonConformity: (nc: Omit<NonConformity, "id" | "raised" | "status">) => string;
  closeNonConformity: (id: string, accept: boolean) => void;
  inspections: Inspection[];
  requestInspection: (appId: string) => void;
  decide: (appId: string, decision: NonNullable<Application["decision"]>, note: string) => void;
  audit: AuditEvent[];
  log: (action: string, target: string, detail: string) => void;
};

const AppStateContext = React.createContext<Ctx | null>(null);

let seq = 100;
const nextId = (p: string) => `${p}-${++seq}`;

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<SessionUser | null>(null);
  const [applications, setApplications] = React.useState<Application[]>(APPLICATIONS);
  const [reviews, setReviews] = React.useState<ReviewMap>({});
  const [nonConformities, setNonConformities] = React.useState<NonConformity[]>(NON_CONFORMITIES);
  const [inspections, setInspections] = React.useState<Inspection[]>(INSPECTIONS);
  const [audit, setAudit] = React.useState<AuditEvent[]>(AUDIT_LOG);

  const log = React.useCallback(
    (action: string, target: string, detail: string) => {
      setAudit((prev) => [
        {
          id: nextId("A"),
          at: new Date().toISOString().slice(0, 16).replace("T", " "),
          actor: user?.name ?? "System",
          role: user?.title ?? "Platform",
          action,
          target,
          detail,
        },
        ...prev,
      ]);
    },
    [user],
  );

  const value: Ctx = {
    user,
    signIn: (role) => setUser(DEMO_USERS[role]),
    signOut: () => setUser(null),
    applications,
    reviews,
    setReview: (appId, section, state) => {
      setReviews((prev) => ({ ...prev, [appId]: { ...prev[appId], [section]: state } }));
    },
    nonConformities,
    addNonConformity: (nc) => {
      const id = nextId("NC-2026");
      setNonConformities((prev) => [
        { ...nc, id, raised: new Date().toISOString().slice(0, 10), status: "Open" },
        ...prev,
      ]);
      return id;
    },
    closeNonConformity: (id, accept) => {
      setNonConformities((prev) =>
        prev.map((n) => (n.id === id ? { ...n, status: accept ? "Closed" : "Open" } : n)),
      );
    },
    inspections,
    requestInspection: (appId) => {
      const app = applications.find((a) => a.id === appId);
      if (!app) return;
      setInspections((prev) => [
        {
          id: nextId("INS-2026"),
          applicationId: app.id,
          company: app.company,
          facility: app.facility,
          state: app.state,
          scheduled: "To be confirmed",
          inspector: "Unassigned",
          type: "Pre-approval",
          status: "Requested",
        },
        ...prev,
      ]);
      setApplications((prev) =>
        prev.map((a) => (a.id === appId ? { ...a, stage: "Inspection" } : a)),
      );
    },
    decide: (appId, decision) => {
      setApplications((prev) =>
        prev.map((a) => (a.id === appId ? { ...a, stage: "Decided", decision } : a)),
      );
    },
    audit,
    log,
  };

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const ctx = React.useContext(AppStateContext);
  if (!ctx) throw new Error("useAppState must be used inside AppStateProvider");
  return ctx;
}
