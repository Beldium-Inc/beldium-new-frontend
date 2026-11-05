import * as React from "react";
import { toast } from "sonner";
import {
  companies as seedCompanies,
  seedNotifications,
  seedRequests,
  reviewNotesSeed,
  auditHistory as seedAudit,
  demoAccounts,
  type AuditEntry,
  type Company,
  type DocStatus,
  type InfoRequest,
  type Notification,
  type Role,
  type VerificationRecord,
} from "./mock-data";

export interface Session {
  role: Role;
  person: string;
  title: string;
  org: string;
  email: string;
  organizationId?: string;
  workspaceRole?: "applicant" | "manager" | "driver";
  driverId?: string | undefined;
  /** Compliance operators only: true once Beldium staff have vetted the account. Missing or false means unvetted. */
  vetted?: boolean;
}

export const NOT_VETTED_MESSAGE = "Reviewer access is pending staff vetting. You can view the register, but reviews, verification, requests and decisions are locked until your account is vetted.";

export type Decision = "Approved" | "Conditionally Approved" | "Rejected" | "More Info Requested";

interface Store {
  session: Session | null;
  companies: Company[];
  requests: InfoRequest[];
  notifications: Notification[];
  audit: AuditEntry[];
  reviewNotes: { id: string; author: string; at: string; text: string }[];
  decisions: Record<string, { decision: Decision; at: string; summary: string; by: string }>;
}

const STORAGE_KEY = "beldium-prototype-v1";

const initialStore: Store = {
  session: null,
  companies: seedCompanies,
  requests: seedRequests,
  notifications: seedNotifications,
  audit: seedAudit,
  reviewNotes: reviewNotesSeed,
  decisions: {},
};

interface Ctx extends Store {
  hydrated: boolean;
  /** True only for a compliance operator whose account has been vetted by Beldium staff. */
  canReview: boolean;
  signIn: (role: Role) => Session;
  signOut: () => void;
  signInUser: (session: Session) => void;
  upsertCompany: (company: Company) => void;
  reviewEntity: (companyId: string, kind: "vehicles" | "drivers", id: string, status: "Compliant" | "Attention" | "Non-compliant") => void;
  setDocumentStatus: (companyId: string, docId: string, status: DocStatus, record?: Omit<VerificationRecord, "officer" | "at">) => void;
  addDocumentNote: (companyId: string, docId: string, text: string) => void;
  addReviewNote: (text: string) => void;
  assignReviewer: (companyId: string, reviewer: string) => void;
  startReview: (companyId: string) => void;
  createRequest: (companyId: string, reason: string, message: string, items: string[]) => void;
  respondToRequest: (requestId: string, message: string, files: string[]) => void;
  recordDecision: (companyId: string, decision: Decision, summary: string) => void;
  markNotificationRead: (id: string) => void;
  markAllRead: () => void;
}

const AppContext = React.createContext<Ctx | null>(null);

function now() {
  return new Date().toISOString().slice(0, 16).replace("T", " ");
}

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [store, setStore] = React.useState<Store>(initialStore);
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setStore({ ...initialStore, ...(JSON.parse(raw) as Store) });
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  React.useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    } catch {
      /* ignore */
    }
  }, [store, hydrated]);

  // Shared action-layer guard: only a vetted compliance operator may review, verify, request or decide.
  // Unvetted operators are told why instead of the action silently doing nothing.
  const reviewGuard = () => {
    if (store.session?.role !== "operator") return false;
    if (store.session.vetted !== true) {
      toast.error(NOT_VETTED_MESSAGE);
      return false;
    }
    return true;
  };

  const audit = React.useCallback((entry: Omit<AuditEntry, "id" | "at">) => {
    setStore((s) => ({
      ...s,
      audit: [{ id: `AU-${9022 + s.audit.length}`, at: now(), ...entry }, ...s.audit],
    }));
  }, []);

  const value: Ctx = React.useMemo(
    () => ({
      ...store,
      hydrated,
      canReview: store.session?.role === "operator" && store.session.vetted === true,
      signIn: (role) => {
        const account = demoAccounts.find((a) => a.role === role);
        if (!account) throw new Error("Unknown demo role");
        const session: Session = {
          role,
          person: account.person,
          title: account.title,
          org: account.org,
          email: account.email,
          // Accounts are unvetted unless the seed explicitly marks them as vetted by staff.
          vetted: account.vetted === true,
        };
        setStore((s) => ({ ...s, session }));
        return session;
      },
      signOut: () => setStore((s) => ({ ...s, session: null })),
      signInUser: (session) => setStore((s) => ({ ...s, session })),
      upsertCompany: (company) => {
        if (store.session?.role !== "operator" && (store.session?.role !== "partner" || store.session.workspaceRole === "driver" || (store.session.organizationId && store.session.organizationId !== company.id))) return;
        setStore((s) => ({ ...s, companies: s.companies.some((c) => c.id === company.id) ? s.companies.map((c) => c.id === company.id ? company : c) : [company, ...s.companies] }));
      },
      reviewEntity: (companyId, kind, id, status) => {
        if (!reviewGuard()) return;
        setStore((s) => ({ ...s, companies: s.companies.map((c) => c.id !== companyId ? c : kind === "vehicles" ? { ...c, vehicles: c.vehicles.map((v) => v.id === id ? { ...v, status } : v) } : { ...c, drivers: c.drivers.map((d) => d.id === id ? { ...d, status } : d) }) }));
        audit({ actor: store.session?.person ?? "Operator", role: "Compliance Operator", action: `${kind === "vehicles" ? "Vehicle" : "Driver"} readiness reviewed`, target: `${companyId} / ${id}`, outcome: status });
        if (status === "Attention") {
          value.createRequest(companyId, `${kind === "vehicles" ? "Vehicle" : "Driver"} information requested`, `Provide missing readiness declarations for ${id}.`, [`${id} readiness evidence placeholder`]);
        }
      },
      setDocumentStatus: (companyId, docId, status, record) => {
        if (!reviewGuard()) return;
        if (status === "verified" && (!record || !record.source.trim() || !record.method.trim() || !record.findings.trim())) return;
        const verification = record ? { ...record, officer: store.session?.person ?? "Operator", at: now() } : undefined;
        setStore((s) => ({
          ...s,
          companies: s.companies.map((c) =>
            c.id !== companyId
              ? c
              : { ...c, documents: c.documents.map((d) => (d.id === docId ? { ...d, status, verification: verification ?? d.verification } : d)) },
          ),
        }));
        audit({
          actor: store.session?.person ?? "Compliance Operator",
          role: "Compliance Operator",
          action: `Document marked ${status} (simulated)`,
          target: `${companyId} / ${docId}`,
          outcome: status,
        });
      },
      addDocumentNote: (companyId, docId, text) => {
        if (!reviewGuard()) return;
        setStore((s) => ({
          ...s,
          companies: s.companies.map((c) =>
            c.id !== companyId
              ? c
              : {
                  ...c,
                  documents: c.documents.map((d) =>
                    d.id === docId
                      ? {
                          ...d,
                          notes: [
                            ...d.notes,
                            { id: `DN-${d.notes.length + 1}-${docId}`, author: s.session?.person ?? "Operator", at: now(), text },
                          ],
                        }
                      : d,
                  ),
                },
          ),
        }));
      },
      addReviewNote: (text) => {
        if (!reviewGuard()) return;
        setStore((s) => ({
          ...s,
          reviewNotes: [
            ...s.reviewNotes,
            { id: `RN-${s.reviewNotes.length + 1}`, author: s.session?.person ?? "Operator", at: now(), text },
          ],
        }));
      },
      assignReviewer: (companyId, reviewer) => {
        if (!reviewGuard()) return;
        setStore((s) => ({
          ...s,
          companies: s.companies.map((c) => (c.id === companyId ? { ...c, reviewer, lastActivity: now().slice(0, 10) } : c)),
        }));
        audit({ actor: store.session?.person ?? "Operator", role: "Compliance Operator", action: "Reviewer assigned", target: companyId, outcome: reviewer });
      },
      startReview: (companyId) => {
        if (!reviewGuard()) return;
        setStore((s) => ({
          ...s,
          companies: s.companies.map((c) =>
            c.id === companyId ? { ...c, status: "Under Review", lastActivity: now().slice(0, 10) } : c,
          ),
        }));
        audit({ actor: store.session?.person ?? "Operator", role: "Compliance Operator", action: "Review started", target: companyId, outcome: "Under Review" });
      },
      createRequest: (companyId, reason, message, items) => {
        if (!reviewGuard()) return;
        setStore((s) => {
          const company = s.companies.find((c) => c.id === companyId);
          const req: InfoRequest = {
            id: `REQ-${3392 + s.requests.length}`,
            companyId,
            company: company?.name ?? companyId,
            reason,
            message,
            items,
            raisedBy: s.session?.person ?? "Operator",
            raisedAt: now().slice(0, 10),
            due: new Date(Date.now() + 10 * 864e5).toISOString().slice(0, 10),
            status: "Open",
          };
          return {
            ...s,
            requests: [req, ...s.requests],
            companies: s.companies.map((c) => (c.id === companyId ? { ...c, status: "Awaiting Information" } : c)),
            notifications: [
              {
                id: `N-${s.notifications.length + 1}`,
                audience: ["partner"],
                title: "New information request",
                body: `${reason} — respond by ${req.due}.`,
                at: now(),
                tone: "warning",
                read: false,
              },
              ...s.notifications,
            ],
          };
        });
        audit({ actor: store.session?.person ?? "Operator", role: "Compliance Operator", action: "Information requested", target: companyId, outcome: reason });
      },
      respondToRequest: (requestId, message, files) => {
        const request = store.requests.find((r) => r.id === requestId);
        if (store.session?.role !== "partner" || store.session.workspaceRole === "driver" || (store.session.organizationId && request?.companyId !== store.session.organizationId)) return;
        setStore((s) => ({
          ...s,
          requests: s.requests.map((r) =>
            r.id === requestId ? { ...r, status: "Responded", response: { at: now(), message, files } } : r,
          ),
        }));
        audit({ actor: store.session?.person ?? "Partner", role: "Logistics Partner", action: "Information request answered", target: requestId, outcome: "Responded" });
      },
      recordDecision: (companyId, decision, summary) => {
        if (!reviewGuard()) return;
        setStore((s) => ({
          ...s,
          decisions: { ...s.decisions, [companyId]: { decision, at: now(), summary, by: s.session?.person ?? "Operator" } },
          companies: s.companies.map((c) =>
            c.id !== companyId
              ? c
              : {
                  ...c,
                  status:
                    decision === "Approved"
                      ? "Approved"
                      : decision === "Conditionally Approved"
                        ? "Conditionally Approved"
                        : decision === "Rejected"
                          ? "Rejected"
                          : "Awaiting Information",
                  lastActivity: now().slice(0, 10),
                },
          ),
        }));
        audit({ actor: store.session?.person ?? "Operator", role: "Compliance Operator", action: "Decision recorded", target: companyId, outcome: decision });
      },
      markNotificationRead: (id) =>
        setStore((s) => ({ ...s, notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)) })),
      markAllRead: () => setStore((s) => ({ ...s, notifications: s.notifications.map((n) => ({ ...n, read: true })) })),
    }),
    [store, audit, hydrated],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = React.useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppStateProvider");
  return ctx;
}

export function useCompany(id: string) {
  const { companies } = useApp();
  return companies.find((c) => c.id === id);
}
