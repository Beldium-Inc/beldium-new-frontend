import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  seedApplications,
  seedMiners,
  seedNotifications,
  seedOrders,
  seedRfqs,
  type AppStatus,
  type Application,
  type FinancePackage,
  type Miner,
  type Notification,
  type OrderRow,
  type Rfq,
  type Role,
  type TransactionServices,
} from "./demo-data";

export const ROLE_LABEL: Record<Role, string> = {
  operator: "Compliance Operator",
  buyer: "Buyer",
  offtaker: "Offtaker",
  oem: "OEM",
};

export const ROLE_PERSONA: Record<Role, { name: string; org: string }> = {
  operator: { name: "A. Mensah", org: "Beldium Compliance Desk" },
  buyer: { name: "M. Chandra", org: "Coastal Bulk Buyers Pte Ltd" },
  offtaker: { name: "C. Béraud", org: "Meridian Offtake Partners SA" },
  oem: { name: "E. Sandberg", org: "Nordvolt Energy AB" },
};

export type OperatorAction = "verify" | "reject" | "request_info" | "flag" | "escalate";

type State = {
  role: Role | null;
  applications: Application[];
  miners: Miner[];
  rfqs: Rfq[];
  orders: OrderRow[];
  notifications: Notification[];
};

const STORAGE_KEY = "beldium-demo-v1";

const initialState: State = {
  role: null,
  applications: seedApplications,
  miners: seedMiners,
  rfqs: seedRfqs,
  orders: seedOrders,
  notifications: seedNotifications,
};

type Ctx = {
  state: State;
  hydrated: boolean;
  login: (role: Role) => void;
  logout: () => void;
  applyOperatorAction: (id: string, action: OperatorAction, note: string) => void;
  updateLimits: (id: string, single: number, monthly: number) => void;
  addNonConformity: (id: string, title: string, severity: "Minor" | "Major" | "Critical", note: string) => void;
  advanceNonConformity: (appId: string, ncId: string) => void;
  createRfq: (input: {
    commodity: string;
    grade: string;
    volumeTonnes: number;
    incoterm: string;
    destination: string;
    deliveryWindow: string;
    targetPriceUsd: number;
  }) => string;
  autoAggregate: (rfqId: string) => void;
  toggleAllocation: (rfqId: string, minerId: string) => void;
  setAllocationTonnes: (rfqId: string, minerId: string, tonnes: number) => void;
  dispatchNotifications: (rfqId: string) => void;
  acceptAggregation: (rfqId: string) => void;
  saveServices: (rfqId: string, services: TransactionServices) => void;
  submitFinance: (rfqId: string, pkg: FinancePackage) => void;
  markAllRead: () => void;
};

const DemoContext = createContext<Ctx | null>(null);

const nowIso = () => new Date().toISOString();
const rid = (p: string) => `${p}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;

const ACTION_RESULT: Record<OperatorAction, { status: AppStatus; label: string }> = {
  verify: { status: "verified", label: "Verified" },
  reject: { status: "rejected", label: "Rejected" },
  request_info: { status: "info_requested", label: "Information requested" },
  flag: { status: "flagged", label: "Flagged" },
  escalate: { status: "escalated", label: "Escalated to committee" },
};

export function DemoProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(initialState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setState({ ...initialState, ...(JSON.parse(raw) as State) });
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }, [state, hydrated]);

  const patchApp = useCallback((id: string, fn: (a: Application) => Application) => {
    setState((s) => ({
      ...s,
      applications: s.applications.map((a) => (a.id === id ? fn(a) : a)),
    }));
  }, []);

  const patchRfq = useCallback((id: string, fn: (r: Rfq) => Rfq) => {
    setState((s) => ({ ...s, rfqs: s.rfqs.map((r) => (r.id === id ? fn(r) : r)) }));
  }, []);

  const pushNotification = useCallback((n: Omit<Notification, "id" | "at" | "read">) => {
    setState((s) => ({
      ...s,
      notifications: [{ ...n, id: rid("N"), at: nowIso(), read: false }, ...s.notifications],
    }));
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      state,
      hydrated,
      login: (role) => setState((s) => ({ ...s, role })),
      logout: () => setState((s) => ({ ...s, role: null })),

      applyOperatorAction: (id, action, note) => {
        const result = ACTION_RESULT[action];
        patchApp(id, (a) => ({
          ...a,
          status: result.status,
          limits:
            action === "verify"
              ? {
                  ...a.limits,
                  approvedSingleTxnUsd: a.limits.approvedSingleTxnUsd || a.limits.proposedSingleTxnUsd,
                  approvedMonthlyUsd: a.limits.approvedMonthlyUsd || a.limits.proposedMonthlyUsd,
                }
              : action === "reject" || action === "flag"
                ? { ...a.limits, approvedSingleTxnUsd: 0, approvedMonthlyUsd: 0 }
                : a.limits,
          audit: [
            {
              id: rid("AU"),
              at: nowIso(),
              actor: `${ROLE_PERSONA.operator.name} (Compliance)`,
              action: result.label,
              detail: note || `${result.label} via review workspace.`,
            },
            ...a.audit,
          ],
        }));
        pushNotification({
          audience: "operator",
          title: `${result.label}: ${id}`,
          body: note || `${result.label} recorded on application ${id}.`,
          channel: "in_app",
        });
      },

      updateLimits: (id, single, monthly) =>
        patchApp(id, (a) => ({
          ...a,
          limits: { ...a.limits, approvedSingleTxnUsd: single, approvedMonthlyUsd: monthly },
          audit: [
            {
              id: rid("AU"),
              at: nowIso(),
              actor: `${ROLE_PERSONA.operator.name} (Compliance)`,
              action: "Transaction limits updated",
              detail: `Single txn $${(single / 1e6).toFixed(0)}m / monthly $${(monthly / 1e6).toFixed(0)}m.`,
            },
            ...a.audit,
          ],
        })),

      addNonConformity: (id, title, severity, note) =>
        patchApp(id, (a) => ({
          ...a,
          status: a.status === "verified" ? "under_review" : a.status,
          nonConformities: [
            { id: rid("NC"), title, severity, raisedAt: nowIso(), status: "open", note },
            ...a.nonConformities,
          ],
          audit: [
            {
              id: rid("AU"),
              at: nowIso(),
              actor: `${ROLE_PERSONA.operator.name} (Compliance)`,
              action: `Non-conformity raised (${severity})`,
              detail: title,
            },
            ...a.audit,
          ],
        })),

      advanceNonConformity: (appId, ncId) =>
        patchApp(appId, (a) => ({
          ...a,
          nonConformities: a.nonConformities.map((nc) =>
            nc.id === ncId
              ? { ...nc, status: nc.status === "open" ? "remediation" : "closed" }
              : nc,
          ),
          audit: [
            {
              id: rid("AU"),
              at: nowIso(),
              actor: `${ROLE_PERSONA.operator.name} (Compliance)`,
              action: "Non-conformity progressed",
              detail: `${ncId} moved forward in remediation workflow.`,
            },
            ...a.audit,
          ],
        })),

      createRfq: (input) => {
        const id = rid("RFQ");
        const rfq: Rfq = {
          id,
          reference: id,
          ...input,
          createdBy: state.role ?? "offtaker",
          createdByName: ROLE_PERSONA[state.role ?? "offtaker"].org,
          createdAt: nowIso(),
          status: "matching",
          allocations: [],
          notifications: [],
        };
        setState((s) => ({ ...s, rfqs: [rfq, ...s.rfqs] }));
        return id;
      },

      autoAggregate: (rfqId) =>
        patchRfq(rfqId, (r) => {
          const eligible = state.miners
            .filter((m) => m.compliance === "verified")
            .sort((a, b) => b.availableTonnes - a.availableTonnes);
          let remaining = r.volumeTonnes;
          const allocations = eligible
            .map((m) => {
              const take = Math.min(m.availableTonnes, remaining);
              remaining -= take;
              return take > 0
                ? {
                    minerId: m.id,
                    tonnes: take,
                    state: "offered" as const,
                    priceUsdPerTonne: r.targetPriceUsd + (m.esgScore > 75 ? 6 : -4),
                  }
                : null;
            })
            .filter(Boolean) as Rfq["allocations"];
          return { ...r, allocations, status: "aggregating" };
        }),

      toggleAllocation: (rfqId, minerId) =>
        patchRfq(rfqId, (r) => ({
          ...r,
          allocations: r.allocations.map((a) =>
            a.minerId === minerId
              ? { ...a, state: a.state === "accepted" ? "offered" : "accepted" }
              : a,
          ),
        })),

      setAllocationTonnes: (rfqId, minerId, tonnes) =>
        patchRfq(rfqId, (r) => ({
          ...r,
          allocations: r.allocations.map((a) => (a.minerId === minerId ? { ...a, tonnes } : a)),
        })),

      dispatchNotifications: (rfqId) =>
        patchRfq(rfqId, (r) => {
          const targets = r.allocations.length
            ? r.allocations.map((a) => a.minerId)
            : state.miners.filter((m) => m.compliance === "verified").map((m) => m.id);
          const notifications = targets.flatMap((minerId) => {
            const miner = state.miners.find((m) => m.id === minerId)!;
            const tonnes = r.allocations.find((a) => a.minerId === minerId)?.tonnes ?? 0;
            return miner.channels.map((channel, i) => ({
              id: rid("MSG"),
              minerId,
              minerName: miner.name,
              channel,
              status: (i === 0 ? "delivered" : "sent") as "delivered" | "sent",
              at: nowIso(),
              preview:
                channel === "sms"
                  ? `Beldium: new verified RFQ ${r.reference} — ${tonnes.toLocaleString()}t ${r.commodity}, ${r.incoterm} ${r.destination}. Reply Y to indicate.`
                  : channel === "email"
                    ? `RFQ ${r.reference}: indicative allocation of ${tonnes.toLocaleString()}t ${r.commodity} (${r.grade}), target $${r.targetPriceUsd}/t.`
                    : `In-app: allocation request ${tonnes.toLocaleString()}t against ${r.reference}.`,
            }));
          });
          return { ...r, notifications, status: "notified" };
        }),

      acceptAggregation: (rfqId) => {
        const rfq = state.rfqs.find((r) => r.id === rfqId);
        patchRfq(rfqId, (r) => ({
          ...r,
          status: "accepted",
          allocations: r.allocations.map((a) => ({ ...a, state: "accepted" })),
        }));
        if (rfq) {
          pushNotification({
            audience: rfq.createdBy,
            title: `Aggregated supply confirmed — ${rfq.reference}`,
            body: `${rfq.allocations.length} verified miners confirmed ${rfq.allocations
              .reduce((s, a) => s + a.tonnes, 0)
              .toLocaleString()}t against your ${rfq.volumeTonnes.toLocaleString()}t request. Proceed to transaction services setup.`,
            channel: "in_app",
          });
        }
      },

      saveServices: (rfqId, services) => patchRfq(rfqId, (r) => ({ ...r, services })),

      submitFinance: (rfqId, pkg) => {
        patchRfq(rfqId, (r) => ({ ...r, finance: pkg, status: "contracted" }));
        pushNotification({
          audience: state.role ?? "offtaker",
          title: "Financing request submitted",
          body: `Trade & supply-chain finance request for $${(pkg.requiredUsd / 1e6).toFixed(0)}m routed to the Beldium funding panel.`,
          channel: "email",
        });
      },

      markAllRead: () =>
        setState((s) => ({ ...s, notifications: s.notifications.map((n) => ({ ...n, read: true })) })),
    }),
    [state, hydrated, patchApp, patchRfq, pushNotification],
  );

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function useDemo() {
  const ctx = useContext(DemoContext);
  if (!ctx) throw new Error("useDemo must be used inside DemoProvider");
  return ctx;
}

export const fmtUsd = (n: number) =>
  n >= 1e9
    ? `$${(n / 1e9).toFixed(n % 1e9 === 0 ? 0 : 1)}bn`
    : n >= 1e6
      ? `$${(n / 1e6).toFixed(n % 1e6 === 0 ? 0 : 1)}m`
      : n >= 1e3
        ? `$${(n / 1e3).toFixed(0)}k`
        : `$${n}`;

export const fmtTonnes = (n: number) => `${n.toLocaleString("en-US")} t`;

export const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

export const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
