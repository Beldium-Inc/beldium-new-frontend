import * as React from "react";
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
} from "./mock-data";

export interface Session {
  role: Role;
  person: string;
  title: string;
  org: string;
  email: string;
}

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
  signIn: (role: Role) => Session;
  signOut: () => void;
  setDocumentStatus: (companyId: string, docId: string, status: DocStatus) => void;
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
      signIn: (role) => {
        const account = demoAccounts.find((a) => a.role === role)!;
        const session: Session = {
          role,
          person: account.person,
          title: account.title,
          org: account.org,
          email: account.email,
        };
        setStore((s) => ({ ...s, session }));
        return session;
      },
      signOut: () => setStore((s) => ({ ...s, session: null })),
      setDocumentStatus: (companyId, docId, status) => {
        setStore((s) => ({
          ...s,
          companies: s.companies.map((c) =>
            c.id !== companyId
              ? c
              : { ...c, documents: c.documents.map((d) => (d.id === docId ? { ...d, status } : d)) },
          ),
        }));
        audit({
          actor: store.session?.person ?? "Compliance Operator",
          role: "Compliance Operator",
          action: `Document marked ${status}`,
          target: `${companyId} / ${docId}`,
          outcome: status,
        });
      },
      addDocumentNote: (companyId, docId, text) => {
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
      addReviewNote: (text) =>
        setStore((s) => ({
          ...s,
          reviewNotes: [
            ...s.reviewNotes,
            { id: `RN-${s.reviewNotes.length + 1}`, author: s.session?.person ?? "Operator", at: now(), text },
          ],
        })),
      assignReviewer: (companyId, reviewer) => {
        setStore((s) => ({
          ...s,
          companies: s.companies.map((c) => (c.id === companyId ? { ...c, reviewer, lastActivity: now().slice(0, 10) } : c)),
        }));
        audit({ actor: store.session?.person ?? "Operator", role: "Compliance Operator", action: "Reviewer assigned", target: companyId, outcome: reviewer });
      },
      startReview: (companyId) => {
        setStore((s) => ({
          ...s,
          companies: s.companies.map((c) =>
            c.id === companyId ? { ...c, status: "Under Review", lastActivity: now().slice(0, 10) } : c,
          ),
        }));
        audit({ actor: store.session?.person ?? "Operator", role: "Compliance Operator", action: "Review started", target: companyId, outcome: "Under Review" });
      },
      createRequest: (companyId, reason, message, items) => {
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
        setStore((s) => ({
          ...s,
          requests: s.requests.map((r) =>
            r.id === requestId ? { ...r, status: "Responded", response: { at: now(), message, files } } : r,
          ),
        }));
        audit({ actor: store.session?.person ?? "Partner", role: "Logistics Partner", action: "Information request answered", target: requestId, outcome: "Responded" });
      },
      recordDecision: (companyId, decision, summary) => {
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
