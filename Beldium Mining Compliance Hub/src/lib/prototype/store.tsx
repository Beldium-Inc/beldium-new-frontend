import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  activitySeed,
  applications as appSeed,
  documents as docSeed,
  inspections as inspSeed,
  infoRequestsSeed,
  licences,
  nonConformities as ncSeed,
  organisations,
  pendingReviews as reviewSeed,
  samples,
  sites as siteSeed,
  users,
} from "./data";
import type {
  ActivityEntry,
  Application,
  DocumentRecord,
  InfoRequest,
  Inspection,
  MineSite,
  NonConformity,
  PendingReview,
  ReviewStatus,
  Role,
  SectionKey,
  Severity,
} from "./types";

export type SectionDecision = "Verify" | "Reject" | "Request Information" | "Request Inspection" | "Flag";

export interface Notification {
  id: string;
  at: string;
  title: string;
  body: string;
  tone: "neutral" | "positive" | "warning" | "negative";
  read: boolean;
  audience: Role[];
}

interface State {
  role: Role | null;
  sites: MineSite[];
  nonConformities: NonConformity[];
  infoRequests: InfoRequest[];
  inspections: Inspection[];
  reviews: PendingReview[];
  applications: Application[];
  documents: DocumentRecord[];
  activity: ActivityEntry[];
  notifications: Notification[];
}

const STORAGE_KEY = "beldium-prototype-v1";

function nowStamp() {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

function todayStamp() {
  return nowStamp().slice(0, 10);
}

let seq = 0;
const uid = (p: string) => `${p}-${Date.now().toString(36)}-${seq++}`;

const seedNotifications: Notification[] = [
  { id: "n-1", at: "2026-08-22 14:20", title: "Corrective action awaiting review", body: "NCR-2026-018 (NL-024) has a corrective-action submission awaiting your decision.", tone: "warning", read: false, audience: ["partner"] },
  { id: "n-2", at: "2026-08-21 08:05", title: "Licence expiring in 99 days", body: "ML-24187-NAS for Nasarawa Lithium Site NL-024 expires 30 Nov 2026.", tone: "warning", read: false, audience: ["partner", "miner", "regulator"] },
  { id: "n-3", at: "2026-08-19 09:41", title: "Evidence uploaded", body: "Nasarawa Lithium Minerals Ltd uploaded silt trap commissioning evidence.", tone: "positive", read: false, audience: ["partner", "regulator"] },
  { id: "n-4", at: "2026-08-18 17:02", title: "Environmental breach open", body: "Doka Stream turbidity at 68 NTU against a 50 NTU limit.", tone: "negative", read: true, audience: ["partner", "regulator", "miner"] },
  { id: "n-5", at: "2026-08-06 11:18", title: "Information request open", body: "PEP screening for Sunrise Minerals Holding Ltd is due 27 Aug 2026.", tone: "warning", read: false, audience: ["miner", "partner"] },
];

const initialState: State = {
  role: null,
  sites: siteSeed,
  nonConformities: ncSeed,
  infoRequests: infoRequestsSeed as InfoRequest[],
  inspections: inspSeed,
  reviews: reviewSeed,
  applications: appSeed,
  documents: docSeed,
  activity: activitySeed,
  notifications: seedNotifications,
};

interface Ctx extends State {
  actorName: string;
  hydrated: boolean;
  login: (role: Role) => void;
  logout: () => void;
  resetDemo: () => void;
  markNotificationsRead: () => void;
  decideSection: (siteId: string, section: SectionKey, decision: SectionDecision, note: string) => void;
  requestInformation: (input: { siteId: string; section: SectionKey | "general"; subject: string; details: string; dueBy: string; priority: "Low" | "Normal" | "High"; requestedFrom: string }) => void;
  respondToInfoRequest: (id: string, message: string, attachments: string[]) => void;
  raiseNonConformity: (input: { siteId: string; title: string; category: string; severity: Severity; requiredAction: string; responsiblePerson: string; deadline: string }) => void;
  submitCorrectiveAction: (ncId: string, message: string, attachments: string[]) => void;
  decideCorrectiveAction: (ncId: string, submissionId: string, decision: "Accepted" | "Rejected" | "More Info Requested", note: string) => void;
  requestInspection: (siteId: string, type: string, note: string) => void;
  completeReview: (reviewId: string) => void;
  startReview: (reviewId: string) => void;
  regulatorAction: (kind: "Send Reminder" | "Request Information" | "Flag Site" | "Acknowledge Submission", siteId: string, note?: string) => void;
  logActivity: (entry: Omit<ActivityEntry, "id" | "at" | "role" | "actor">) => void;
}

const StoreContext = createContext<Ctx | null>(null);

export function PrototypeStoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(initialState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setState((s) => ({ ...s, ...(JSON.parse(raw) as State) }));
    } catch {
      /* ignore corrupt demo state */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* storage unavailable in demo */
    }
  }, [state, hydrated]);

  const actorName = state.role ? users[state.role].shortName : "System";

  const pushActivity = useCallback(
    (s: State, entry: Omit<ActivityEntry, "id" | "at" | "role" | "actor">): ActivityEntry[] => [
      { id: uid("act"), at: nowStamp(), actor: s.role ? users[s.role].shortName : "System", role: s.role ?? "partner", ...entry },
      ...s.activity,
    ],
    [],
  );

  const pushNotification = (s: State, n: Omit<Notification, "id" | "at" | "read">): Notification[] => [
    { id: uid("n"), at: nowStamp(), read: false, ...n },
    ...s.notifications,
  ];

  const login = useCallback((role: Role) => setState((s) => ({ ...s, role })), []);
  const logout = useCallback(() => setState((s) => ({ ...s, role: null })), []);
  const resetDemo = useCallback(() => {
    setState({ ...initialState, role: null });
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* noop */
    }
  }, []);

  const markNotificationsRead = useCallback(
    () => setState((s) => ({ ...s, notifications: s.notifications.map((n) => ({ ...n, read: true })) })),
    [],
  );

  const logActivity = useCallback<Ctx["logActivity"]>((entry) => setState((s) => ({ ...s, activity: pushActivity(s, entry) })), [pushActivity]);

  const decideSection = useCallback<Ctx["decideSection"]>(
    (siteId, section, decision, note) => {
      setState((s) => {
        const statusMap: Record<SectionDecision, ReviewStatus> = {
          Verify: "Verified",
          Reject: "Rejected",
          "Request Information": "Info Requested",
          "Request Inspection": "Inspection Requested",
          Flag: "Flagged",
        };
        const nextStatus = statusMap[decision];
        const sites = s.sites.map((site) => {
          if (site.id !== siteId) return site;
          const sections = site.sections.map((sec) =>
            sec.key === section
              ? { ...sec, status: nextStatus, decisionNote: note, decidedBy: users[s.role ?? "partner"].shortName, decidedAt: nowStamp() }
              : sec,
          );
          const verified = sections.filter((x) => x.status === "Verified").length;
          const rejected = sections.filter((x) => x.status === "Rejected" || x.status === "Flagged").length;
          const score = Math.max(20, Math.min(99, site.complianceScore + (decision === "Verify" ? 2 : decision === "Reject" || decision === "Flag" ? -4 : 0)));
          const risk = score >= 80 ? "Low" : score >= 60 ? "Medium" : "High";
          const status =
            decision === "Flag" ? "Suspended" : verified === sections.length ? "Operational" : rejected > 0 ? "Under Review" : site.status;
          return { ...site, sections, complianceScore: score, risk: risk as MineSite["risk"], status: status as MineSite["status"] };
        });
        const site = sites.find((x) => x.id === siteId);
        let inspections = s.inspections;
        if (decision === "Request Inspection") {
          inspections = [
            {
              id: uid("ins"),
              ref: `INS-${new Date().getFullYear()}-${String(900 + s.inspections.length).padStart(4, "0")}`,
              siteId,
              type: `Targeted inspection — ${section}`,
              scheduled: todayStamp(),
              inspector: "Unassigned",
              status: "Requested",
              findings: [],
              notes: note,
            },
            ...s.inspections,
          ];
        }
        return {
          ...s,
          sites,
          inspections,
          activity: pushActivity(s, {
            action: `${decision} — ${section} section`,
            detail: note || `${decision} recorded against the ${section} section.`,
            target: siteId,
            tone: decision === "Verify" ? "positive" : decision === "Reject" || decision === "Flag" ? "negative" : "warning",
          }),
          notifications: pushNotification(s, {
            title: `${decision}: ${site?.code ?? siteId} ${section}`,
            body: note || `Reviewer recorded "${decision}" on the ${section} section.`,
            tone: decision === "Verify" ? "positive" : decision === "Reject" || decision === "Flag" ? "negative" : "warning",
            audience: ["miner", "regulator", "partner"],
          }),
        };
      });
    },
    [pushActivity],
  );

  const requestInformation = useCallback<Ctx["requestInformation"]>(
    (input) => {
      setState((s) => ({
        ...s,
        infoRequests: [
          {
            id: uid("ir"),
            ...input,
            requestedBy: users[s.role ?? "partner"].shortName,
            requestedAt: todayStamp(),
            status: "Open",
          },
          ...s.infoRequests,
        ],
        activity: pushActivity(s, {
          action: "Information requested",
          detail: `${input.subject} — due ${input.dueBy}.`,
          target: input.siteId,
          tone: "warning",
        }),
        notifications: pushNotification(s, {
          title: "Information requested",
          body: `${input.subject} (${input.siteId}) — due ${input.dueBy}.`,
          tone: "warning",
          audience: ["miner", "partner"],
        }),
      }));
    },
    [pushActivity],
  );

  const respondToInfoRequest = useCallback<Ctx["respondToInfoRequest"]>(
    (id, message, attachments) => {
      setState((s) => ({
        ...s,
        infoRequests: s.infoRequests.map((r) =>
          r.id === id
            ? { ...r, status: "Responded", response: { at: nowStamp(), by: users[s.role ?? "miner"].shortName, message, attachments } }
            : r,
        ),
        activity: pushActivity(s, { action: "Information response submitted", detail: message.slice(0, 140), tone: "positive" }),
        notifications: pushNotification(s, {
          title: "Information response received",
          body: message.slice(0, 120),
          tone: "positive",
          audience: ["partner", "regulator"],
        }),
      }));
    },
    [pushActivity],
  );

  const raiseNonConformity = useCallback<Ctx["raiseNonConformity"]>(
    (input) => {
      setState((s) => {
        const ref = `NCR-${new Date().getFullYear()}-${String(100 + s.nonConformities.length).padStart(3, "0")}`;
        return {
          ...s,
          nonConformities: [
            {
              id: uid("nc"),
              ref,
              ...input,
              raisedBy: `${users[s.role ?? "partner"].shortName} (${users[s.role ?? "partner"].title})`,
              raisedAt: todayStamp(),
              status: "Open",
              submissions: [],
            },
            ...s.nonConformities,
          ],
          activity: pushActivity(s, {
            action: "Non-conformity raised",
            detail: `${ref} — ${input.title} (${input.severity}). Due ${input.deadline}.`,
            target: input.siteId,
            tone: "negative",
          }),
          notifications: pushNotification(s, {
            title: `Non-conformity ${ref} raised`,
            body: `${input.title} — ${input.severity}, due ${input.deadline}.`,
            tone: "negative",
            audience: ["miner", "regulator", "partner"],
          }),
        };
      });
    },
    [pushActivity],
  );

  const submitCorrectiveAction = useCallback<Ctx["submitCorrectiveAction"]>(
    (ncId, message, attachments) => {
      setState((s) => ({
        ...s,
        nonConformities: s.nonConformities.map((nc) =>
          nc.id === ncId
            ? {
                ...nc,
                status: "Awaiting Review",
                submissions: [...nc.submissions, { id: uid("cs"), at: nowStamp(), by: users[s.role ?? "miner"].name, message, attachments }],
              }
            : nc,
        ),
        activity: pushActivity(s, {
          action: "Corrective action submitted",
          detail: message.slice(0, 140),
          target: s.nonConformities.find((n) => n.id === ncId)?.ref ?? ncId,
          tone: "positive",
        }),
        notifications: pushNotification(s, {
          title: "Corrective action submitted",
          body: `${s.nonConformities.find((n) => n.id === ncId)?.ref} awaits reviewer decision.`,
          tone: "warning",
          audience: ["partner", "regulator"],
        }),
      }));
    },
    [pushActivity],
  );

  const decideCorrectiveAction = useCallback<Ctx["decideCorrectiveAction"]>(
    (ncId, submissionId, decision, note) => {
      setState((s) => ({
        ...s,
        nonConformities: s.nonConformities.map((nc) =>
          nc.id === ncId
            ? {
                ...nc,
                status: decision === "Accepted" ? "Closed" : decision === "Rejected" ? "Escalated" : "In Progress",
                submissions: nc.submissions.map((sub) =>
                  sub.id === submissionId
                    ? { ...sub, decision, decisionNote: note, decidedAt: nowStamp(), decidedBy: users[s.role ?? "partner"].shortName }
                    : sub,
                ),
              }
            : nc,
        ),
        activity: pushActivity(s, {
          action: `Corrective action ${decision.toLowerCase()}`,
          detail: note || `Decision recorded on ${s.nonConformities.find((n) => n.id === ncId)?.ref}.`,
          target: s.nonConformities.find((n) => n.id === ncId)?.ref ?? ncId,
          tone: decision === "Accepted" ? "positive" : decision === "Rejected" ? "negative" : "warning",
        }),
        notifications: pushNotification(s, {
          title: `Corrective action ${decision.toLowerCase()}`,
          body: `${s.nonConformities.find((n) => n.id === ncId)?.ref}: ${note || decision}`,
          tone: decision === "Accepted" ? "positive" : "warning",
          audience: ["miner", "partner", "regulator"],
        }),
      }));
    },
    [pushActivity],
  );

  const requestInspection = useCallback<Ctx["requestInspection"]>(
    (siteId, type, note) => {
      setState((s) => ({
        ...s,
        inspections: [
          {
            id: uid("ins"),
            ref: `INS-${new Date().getFullYear()}-${String(900 + s.inspections.length).padStart(4, "0")}`,
            siteId,
            type,
            scheduled: todayStamp(),
            inspector: "Unassigned",
            status: "Requested",
            findings: [],
            notes: note,
          },
          ...s.inspections,
        ],
        activity: pushActivity(s, { action: "Inspection requested", detail: `${type} — ${note}`, target: siteId, tone: "warning" }),
        notifications: pushNotification(s, { title: "Inspection requested", body: `${type} requested for ${siteId}.`, tone: "warning", audience: ["miner", "partner", "regulator"] }),
      }));
    },
    [pushActivity],
  );

  const startReview = useCallback<Ctx["startReview"]>(
    (reviewId) => setState((s) => ({ ...s, reviews: s.reviews.map((r) => (r.id === reviewId ? { ...r, status: "In Progress", assignedTo: users[s.role ?? "partner"].shortName } : r)) })),
    [],
  );

  const completeReview = useCallback<Ctx["completeReview"]>(
    (reviewId) =>
      setState((s) => ({
        ...s,
        reviews: s.reviews.map((r) => (r.id === reviewId ? { ...r, status: "Completed" } : r)),
        activity: pushActivity(s, {
          action: "Review completed",
          detail: s.reviews.find((r) => r.id === reviewId)?.subject ?? "Review closed.",
          target: s.reviews.find((r) => r.id === reviewId)?.siteId ?? reviewId,
          tone: "positive",
        }),
      })),
    [pushActivity],
  );

  const regulatorAction = useCallback<Ctx["regulatorAction"]>(
    (kind, siteId, note) => {
      setState((s) => ({
        ...s,
        sites: kind === "Flag Site" ? s.sites.map((x) => (x.id === siteId ? { ...x, status: "Under Review", risk: "High" } : x)) : s.sites,
        activity: pushActivity(s, {
          action: kind,
          detail: note || `${kind} issued for ${siteId} by regulatory oversight.`,
          target: siteId,
          tone: kind === "Acknowledge Submission" ? "positive" : "warning",
        }),
        notifications: pushNotification(s, {
          title: kind,
          body: note || `${kind} recorded for ${siteId}.`,
          tone: kind === "Acknowledge Submission" ? "positive" : "warning",
          audience: ["partner", "miner", "regulator"],
        }),
      }));
    },
    [pushActivity],
  );

  const value = useMemo<Ctx>(
    () => ({
      ...state,
      actorName,
      hydrated,
      login,
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
    }),
    [
      state,
      actorName,
      hydrated,
      login,
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
    ],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside PrototypeStoreProvider");
  return ctx;
}

export function useSite(siteId: string) {
  const { sites } = useStore();
  return sites.find((s) => s.id === siteId);
}

export function orgById(id: string) {
  return organisations.find((o) => o.id === id);
}

export function licenceById(id: string) {
  return licences.find((l) => l.id === id);
}

export function samplesForSite(siteId: string) {
  return samples.filter((s) => s.siteId === siteId);
}

export { organisations, licences, samples, users };
