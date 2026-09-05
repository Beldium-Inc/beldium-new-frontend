import * as React from "react";
import {
  applications as seedApps,
  buyerSpecs,
  certificates as seedCerts,
  demoUsers,
  nonConformities as seedNcrs,
  samples as seedSamples,
} from "./data";
import type {
  Application,
  ApplicationStatus,
  Certificate,
  CorrectiveAction,
  DemoUser,
  DocStatus,
  NonConformity,
  ResultVerdict,
  Role,
  Sample,
  SampleStatus,
} from "./types";

const KEY = "beldium.quality.v1";

interface State {
  userId: string | null;
  applications: Application[];
  samples: Sample[];
  certificates: Certificate[];
  nonConformities: NonConformity[];
}

const initial: State = {
  userId: null,
  applications: seedApps,
  samples: seedSamples,
  certificates: seedCerts,
  nonConformities: seedNcrs,
};

function stamp() {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

interface Ctx {
  ready: boolean;
  user: DemoUser | null;
  role: Role | null;
  state: State;
  logout: () => void;
  setDocStatus: (appId: string, docId: string, status: DocStatus) => void;
  resolveFlag: (appId: string, flagId: string) => void;
  decideApplication: (appId: string, status: ApplicationStatus, note: string) => void;
  assignApplication: (appId: string) => void;
  registerSample: (input: {
    material: string;
    lot: string;
    mineSite: string;
    origin: string;
    massKg: number;
    buyerSpecId: string;
  }) => string;
  addCustody: (sampleId: string, action: string, location: string, sealIntact: boolean) => void;
  createTestRequest: (
    sampleId: string,
    input: { methods: string[]; priority: "standard" | "expedited"; turnaround: string },
  ) => void;
  setResultVerdict: (sampleId: string, resultId: string, verdict: ResultVerdict, value?: string) => void;
  submitQualityReview: (sampleId: string, verdict: ResultVerdict, note: string) => void;
  setSampleStatus: (sampleId: string, status: SampleStatus) => void;
  issueCertificate: (sampleId: string) => string;
  revokeCertificate: (certId: string) => void;
  raiseNonConformity: (input: {
    title: string;
    against: string;
    severity: NonConformity["severity"];
    detail: string;
  }) => string;
  addCorrectiveAction: (ncrId: string, action: Omit<CorrectiveAction, "id">) => void;
  advanceCorrectiveAction: (ncrId: string, actionId: string) => void;
  closeNonConformity: (ncrId: string) => void;
  reset: () => void;
}

const BeldiumContext = React.createContext<Ctx | null>(null);

export function BeldiumProvider({
  children,
  role,
  onSignOut,
}: {
  children: React.ReactNode;
  /** Seeded from the shared session, this dashboard no longer signs anyone in. */
  role: Role;
  onSignOut: () => void;
}) {
  const seatId = demoUsers.find((u) => u.role === role)?.id ?? null;
  const [state, setState] = React.useState<State>({ ...initial, userId: seatId });
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) setState((s) => ({ ...initial, ...JSON.parse(raw), userId: s.userId }));
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  React.useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }, [state, ready]);

  const user = React.useMemo(
    () => demoUsers.find((u) => u.id === state.userId) ?? null,
    [state.userId],
  );

  const actorName = user?.name ?? "System";
  const actorRole: Role = user?.role ?? "operator";

  const patchApp = React.useCallback(
    (appId: string, fn: (a: Application) => Application) =>
      setState((s) => ({
        ...s,
        applications: s.applications.map((a) => (a.id === appId ? fn(a) : a)),
      })),
    [],
  );

  const patchSample = React.useCallback(
    (sampleId: string, fn: (s: Sample) => Sample) =>
      setState((s) => ({
        ...s,
        samples: s.samples.map((x) => (x.id === sampleId ? fn(x) : x)),
      })),
    [],
  );

  const appAudit = (a: Application, action: string, detail: string): Application => ({
    ...a,
    audit: [
      ...a.audit,
      { id: uid("au"), at: stamp(), actor: actorName, role: actorRole, action, detail },
    ],
  });

  const sampleAudit = (s: Sample, action: string, detail: string): Sample => ({
    ...s,
    audit: [
      ...s.audit,
      { id: uid("au"), at: stamp(), actor: actorName, role: actorRole, action, detail },
    ],
  });

  const value: Ctx = {
    ready,
    user,
    role: user?.role ?? null,
    state,
    logout: onSignOut,
    setDocStatus: (appId, docId, status) =>
      patchApp(appId, (a) => {
        const doc = a.documents.find((d) => d.id === docId);
        return appAudit(
          {
            ...a,
            documents: a.documents.map((d) => (d.id === docId ? { ...d, status } : d)),
          },
          `Document marked ${status}`,
          doc?.name ?? docId,
        );
      }),
    resolveFlag: (appId, flagId) =>
      patchApp(appId, (a) => {
        const flag = a.riskFlags.find((f) => f.id === flagId);
        return appAudit(
          {
            ...a,
            riskFlags: a.riskFlags.map((f) => (f.id === flagId ? { ...f, resolved: true } : f)),
            riskScore: Math.max(0, a.riskScore - 15),
          },
          "Risk flag cleared",
          flag?.title ?? flagId,
        );
      }),
    decideApplication: (appId, status, note) =>
      patchApp(appId, (a) =>
        appAudit(
          { ...a, status, decisionNote: note, assignedTo: actorName },
          status === "approved"
            ? "Application approved"
            : status === "rejected"
              ? "Application rejected"
              : status === "info_requested"
                ? "Information requested"
                : "Status updated",
          note || "No note supplied",
        ),
      ),
    assignApplication: (appId) =>
      patchApp(appId, (a) =>
        appAudit(
          { ...a, assignedTo: actorName, status: a.status === "submitted" ? "in_review" : a.status },
          "Review opened",
          `Assigned to ${actorName}`,
        ),
      ),
    registerSample: (input) => {
      const id = uid("s");
      const ref = `SMP-2026-${Math.floor(3500 + Math.random() * 400)}`;
      const sample: Sample = {
        id,
        ref,
        material: input.material,
        lot: input.lot,
        mineSite: input.mineSite,
        origin: input.origin,
        massKg: input.massKg,
        registeredAt: stamp().slice(0, 10),
        minerOrg: user?.org ?? "Kivu Ridge Minerals",
        partnerOrg: "Antwerp Assay Laboratories NV",
        buyerOrg: "Vos Refining Group",
        buyerSpecId: input.buyerSpecId,
        status: "registered",
        custody: [
          {
            id: uid("c"),
            at: stamp(),
            actor: actorName,
            location: input.mineSite,
            action: "Sample drawn and sealed",
            sealIntact: true,
            hash: `0x${Math.random().toString(16).slice(2, 6)}…${Math.random().toString(16).slice(2, 4)}`,
          },
        ],
        testRequest: null,
        results: [],
        qualityReview: null,
        audit: [
          {
            id: uid("au"),
            at: stamp(),
            actor: actorName,
            role: actorRole,
            action: "Sample registered",
            detail: `${ref} created for lot ${input.lot}`,
          },
        ],
      };
      setState((s) => ({ ...s, samples: [sample, ...s.samples] }));
      return id;
    },
    addCustody: (sampleId, action, location, sealIntact) =>
      patchSample(sampleId, (s) =>
        sampleAudit(
          {
            ...s,
            status:
              action === "Received at laboratory"
                ? "received"
                : action === "Handover to transporter"
                  ? "in_transit"
                  : s.status,
            custody: [
              ...s.custody,
              {
                id: uid("c"),
                at: stamp(),
                actor: actorName,
                location,
                action,
                sealIntact,
                hash: `0x${Math.random().toString(16).slice(2, 6)}…${Math.random().toString(16).slice(2, 4)}`,
              },
            ],
          },
          "Custody event recorded",
          `${action} @ ${location}`,
        ),
      ),
    createTestRequest: (sampleId, input) =>
      patchSample(sampleId, (s) =>
        sampleAudit(
          {
            ...s,
            status: "testing",
            testRequest: {
              id: uid("tr"),
              requestedAt: stamp().slice(0, 10),
              priority: input.priority,
              methods: input.methods,
              turnaround: input.turnaround,
              status: "submitted",
            },
            results:
              s.results.length > 0
                ? s.results
                : input.methods.map((m) => ({
                    id: uid("t"),
                    analyte: m,
                    method: m,
                    value: "-",
                    unit: "",
                    spec: "per buyer specification",
                    verdict: "pending" as ResultVerdict,
                    uncertainty: "-",
                  })),
          },
          "Test request submitted",
          input.methods.join(", "),
        ),
      ),
    setResultVerdict: (sampleId, resultId, verdict, value) =>
      patchSample(sampleId, (s) => {
        const r = s.results.find((x) => x.id === resultId);
        return sampleAudit(
          {
            ...s,
            results: s.results.map((x) =>
              x.id === resultId ? { ...x, verdict, value: value ?? x.value } : x,
            ),
          },
          "Result updated",
          `${r?.analyte ?? resultId} → ${verdict}`,
        );
      }),
    submitQualityReview: (sampleId, verdict, note) =>
      patchSample(sampleId, (s) =>
        sampleAudit(
          {
            ...s,
            status: verdict === "fail" ? "rejected" : "reviewed",
            qualityReview: { reviewer: actorName, at: stamp().slice(0, 10), verdict, note },
          },
          "Quality review completed",
          `${verdict.toUpperCase()}, ${note || "no note"}`,
        ),
      ),
    setSampleStatus: (sampleId, status) =>
      patchSample(sampleId, (s) => sampleAudit({ ...s, status }, "Status changed", status)),
    issueCertificate: (sampleId) => {
      const sample = state.samples.find((s) => s.id === sampleId);
      const id = uid("cert");
      const ref = `CERT-2026-${Math.floor(800 + Math.random() * 190)}`;
      const cert: Certificate = {
        id,
        ref,
        sampleRef: sample?.ref ?? "-",
        material: sample?.material ?? "-",
        issuedAt: stamp().slice(0, 10),
        issuedBy: user?.org ?? "Antwerp Assay Laboratories NV",
        validUntil: `2027-${stamp().slice(5, 10)}`,
        status: "active",
        verificationHash: `0x${Math.random().toString(16).slice(2, 14)}${Math.random().toString(16).slice(2, 14)}`,
        scans: 0,
      };
      setState((s) => ({
        ...s,
        certificates: [cert, ...s.certificates],
        samples: s.samples.map((x) =>
          x.id === sampleId
            ? sampleAudit({ ...x, status: "certified" }, "Certificate issued", ref)
            : x,
        ),
      }));
      return id;
    },
    revokeCertificate: (certId) =>
      setState((s) => ({
        ...s,
        certificates: s.certificates.map((c) =>
          c.id === certId ? { ...c, status: "revoked" } : c,
        ),
      })),
    raiseNonConformity: (input) => {
      const id = uid("ncr");
      const ncr: NonConformity = {
        id,
        ref: `NCR-2026-${Math.floor(20 + Math.random() * 70)}`,
        title: input.title,
        raisedAt: stamp().slice(0, 10),
        raisedBy: actorName,
        against: input.against,
        severity: input.severity,
        status: "open",
        detail: input.detail,
        capa: [],
      };
      setState((s) => ({ ...s, nonConformities: [ncr, ...s.nonConformities] }));
      return id;
    },
    addCorrectiveAction: (ncrId, action) =>
      setState((s) => ({
        ...s,
        nonConformities: s.nonConformities.map((n) =>
          n.id === ncrId
            ? { ...n, status: "capa_submitted", capa: [...n.capa, { ...action, id: uid("ca") }] }
            : n,
        ),
      })),
    advanceCorrectiveAction: (ncrId, actionId) =>
      setState((s) => ({
        ...s,
        nonConformities: s.nonConformities.map((n) =>
          n.id === ncrId
            ? {
                ...n,
                capa: n.capa.map((c) =>
                  c.id === actionId
                    ? { ...c, status: c.status === "open" ? "in_progress" : "complete" }
                    : c,
                ),
              }
            : n,
        ),
      })),
    closeNonConformity: (ncrId) =>
      setState((s) => ({
        ...s,
        nonConformities: s.nonConformities.map((n) =>
          n.id === ncrId ? { ...n, status: "closed" } : n,
        ),
      })),
    reset: () => setState({ ...initial, userId: state.userId }),
  };

  return <BeldiumContext.Provider value={value}>{children}</BeldiumContext.Provider>;
}

export function useBeldium() {
  const ctx = React.useContext(BeldiumContext);
  if (!ctx) throw new Error("useBeldium must be used inside BeldiumProvider");
  return ctx;
}

export { buyerSpecs, demoUsers };
