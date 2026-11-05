import * as React from "react";
import { can, canReview, makeVerification, type VerificationInput } from "./compliance";
import {
  applications as seedApps,
  assignments as seedAssignments,
  buyerSpecs,
  certificates as seedCerts,
  demoUsers,
  nonConformities as seedNcrs,
  samples as seedSamples,
} from "./data";
import type {
  Application,
  ApplicationStatus,
  AssignmentStatus,
  Certificate,
  CorrectiveAction,
  CustodyHandover,
  DemoUser,
  DocStatus,
  LabAnalysis,
  LabEvidenceStatus,
  NonConformity,
  QualityAssignment,
  ResultVerdict,
  ReviewDecision,
  Role,
  Sample,
  SampleStatus,
  SamplingEvent,
} from "./types";

const KEY = "beldium.state.v1";

interface State {
  userId: string | null;
  sessionUser?: DemoUser | null;
  applications: Application[];
  samples: Sample[];
  certificates: Certificate[];
  nonConformities: NonConformity[];
  assignments: QualityAssignment[];
}

const initial: State = {
  userId: null,
  applications: seedApps,
  samples: seedSamples,
  certificates: seedCerts,
  nonConformities: seedNcrs,
  assignments: seedAssignments,
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
  login: (userId: string, profile?: DemoUser) => void;
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
  createAssignment: (input: {
    sector: string;
    transactionRef: string;
    mineral: string;
    sourceOrg: string;
    location: string;
    service: string;
    quantityKg: number;
    providerOrg: string;
    personnel: string[];
    activity: string;
    targetDate: string;
  }) => string;
  setAssignmentStatus: (assignmentId: string, status: AssignmentStatus, note?: string) => void;
  addSamplingEvent: (
    assignmentId: string,
    input: Omit<SamplingEvent, "id" | "ref">,
  ) => void;
  addCustodyHandover: (
    assignmentId: string,
    input: Omit<CustodyHandover, "id" | "ref">,
  ) => void;
  addLabAnalysis: (assignmentId: string, input: Omit<LabAnalysis, "id">) => void;
  setLabAnalysisStatus: (
    assignmentId: string,
    analysisId: string,
    status: LabEvidenceStatus,
    patch?: Partial<Pick<LabAnalysis, "result" | "reportRef" | "signatory" | "reportDate" | "receivedAt" | "conditionOnReceipt">>,
  ) => void;
  addAssignmentReview: (assignmentId: string, decision: ReviewDecision, note: string) => void;
  recordVerification: (kind: "application" | "assignment", id: string, input: VerificationInput) => void;
  reset: () => void;
}

const BeldiumContext = React.createContext<Ctx | null>(null);

export function BeldiumProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<State>(initial);
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) setState({ ...initial, ...JSON.parse(raw) });
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
    () =>
      (state.sessionUser && state.sessionUser.id === state.userId ? state.sessionUser : null) ??
      demoUsers.find((u) => u.id === state.userId) ??
      null,
    [state.userId, state.sessionUser],
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

  const patchAssignment = React.useCallback(
    (assignmentId: string, fn: (a: QualityAssignment) => QualityAssignment) =>
      setState((s) => ({
        ...s,
        assignments: s.assignments.map((a) => (a.id === assignmentId ? fn(a) : a)),
      })),
    [],
  );

  const assignmentAudit = (a: QualityAssignment, action: string, detail: string): QualityAssignment => ({
    ...a,
    audit: [
      ...a.audit,
      { id: uid("au"), at: stamp(), actor: actorName, role: actorRole, action, detail },
    ],
  });

  const value: Ctx = {
    ready,
    user,
    role: user?.role ?? null,
    state,
    login: (userId, profile) => setState((s) => ({ ...s, userId, sessionUser: profile ?? null })),
    logout: () => {
      try {
        window.localStorage.removeItem("beldium.session.v1");
        window.sessionStorage.removeItem("beldium.session.v1");
      } catch {
        /* ignore */
      }
      setState((s) => ({ ...s, userId: null, sessionUser: null }));
    },
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
                    value: "—",
                    unit: "",
                    spec: "per buyer specification",
                    verdict: "pending" as ResultVerdict,
                    uncertainty: "—",
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
          `${verdict.toUpperCase()} — ${note || "no note"}`,
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
        sampleRef: sample?.ref ?? "—",
        material: sample?.material ?? "—",
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
    createAssignment: (input) => {
      const id = uid("asg");
      const ref = `BQC-ASG-2026-${Math.floor(130 + Math.random() * 800)}`;
      const assignment: QualityAssignment = {
        id,
        ref,
        ...input,
        status: "requested",
        sampling: [],
        custody: [],
        lab: [],
        reviews: [],
        audit: [
          {
            id: uid("au"),
            at: stamp(),
            actor: actorName,
            role: actorRole,
            action: "Assignment requested",
            detail: `${ref} · ${input.service} for ${input.sourceOrg}`,
          },
        ],
      };
      setState((s) => ({ ...s, assignments: [assignment, ...s.assignments] }));
      return id;
    },
    setAssignmentStatus: (assignmentId, status, note) =>
      patchAssignment(assignmentId, (a) =>
        assignmentAudit(
          { ...a, status },
          "Assignment status changed",
          `${a.status} → ${status}${note ? ` — ${note}` : ""}`,
        ),
      ),
    addSamplingEvent: (assignmentId, input) =>
      patchAssignment(assignmentId, (a) =>
        assignmentAudit(
          {
            ...a,
            status: a.status === "accepted" || a.status === "scheduled" || a.status === "fieldwork" ? "samples_collected" : a.status,
            sampling: [
              ...a.sampling,
              {
                ...input,
                id: uid("se"),
                ref: `SPE-2026-${Math.floor(460 + Math.random() * 400)}`,
              },
            ],
          },
          "Sampling event recorded",
          `${input.sampleId} · ${input.methodology} @ ${input.location}`,
        ),
      ),
    addCustodyHandover: (assignmentId, input) =>
      patchAssignment(assignmentId, (a) =>
        assignmentAudit(
          {
            ...a,
            custody: [
              ...a.custody,
              {
                ...input,
                id: uid("ch"),
                ref: `CUS-2026-${Math.floor(540 + Math.random() * 400)}`,
              },
            ],
          },
          input.status === "correction" ? "Custody correction recorded" : "Custody handover recorded",
          `${input.sampleRef}: ${input.releasingParty} → ${input.receivingParty}`,
        ),
      ),
    addLabAnalysis: (assignmentId, input) =>
      patchAssignment(assignmentId, (a) =>
        assignmentAudit(
          {
            ...a,
            status: a.status === "samples_collected" ? "lab_processing" : a.status,
            lab: [...a.lab, { ...input, id: uid("la") }],
          },
          "Laboratory evidence referenced",
          `${input.analysisRef} · ${input.method} ${input.analyte}`,
        ),
      ),
    setLabAnalysisStatus: (assignmentId, analysisId, status, patch) =>
      patchAssignment(assignmentId, (a) =>
        assignmentAudit(
          {
            ...a,
            lab: a.lab.map((l) => (l.id === analysisId ? { ...l, ...patch, status } : l)),
          },
          "Laboratory evidence updated",
          `${a.lab.find((l) => l.id === analysisId)?.analysisRef ?? analysisId} → ${status.replace(/_/g, " ")}`,
        ),
      ),
    addAssignmentReview: (assignmentId, decision, note) =>
      patchAssignment(assignmentId, (a) => {
        const status: AssignmentStatus =
          decision === "demo_verified"
            ? "completed"
            : decision === "demo_blocked"
              ? "exception"
              : decision === "returned_for_correction"
                ? "fieldwork"
                : a.status === "quality_review"
                  ? a.status
                  : "quality_review";
        return assignmentAudit(
          {
            ...a,
            status,
            reviews: [
              ...a.reviews,
              { id: uid("rev"), reviewer: actorName, at: stamp(), decision, note },
            ],
          },
          "Quality review action",
          `${decision.replace(/_/g, " ")} — ${note || "no note"}`,
        );
      }),
    recordVerification: (kind, id, input) => {
      const subject = kind === "application" ? state.applications.find((a) => a.id === id)?.organisation.legalName : state.assignments.find((a) => a.id === id)?.providerOrg;
      if (!subject || !canReview(user, subject)) throw new Error("Independent reviewer access required.");
      const record = makeVerification({ ...input, subject }, actorName);
      if (kind === "application") patchApp(id, (a) => appAudit({ ...a, verifications: [...(a.verifications ?? []), record] }, "Simulated source verification", record.findings));
      else patchAssignment(id, (a) => assignmentAudit({ ...a, verifications: [...(a.verifications ?? []), record] }, "Simulated source verification", record.findings));
    },
    reset: () => setState({ ...initial, userId: state.userId }),
  };

  function restrict<A extends unknown[], R>(fn: (...args: A) => R, allowed: (...args: A) => boolean): (...args: A) => R {
    return (...args) => { if (!allowed(...args)) throw new Error("Action outside delegated demo permissions."); return fn(...args); };
  }
  value.setDocStatus = restrict(value.setDocStatus, (id) => canReview(user, state.applications.find((a) => a.id === id)?.organisation.legalName ?? ""));
  value.setDocStatus = restrict(value.setDocStatus, (id, docId, status) => {
    const app = state.applications.find((a) => a.id === id);
    const doc = app?.documents.find((d) => d.id === docId);
    return status !== "verified" || !!app?.verifications?.some((r) => r.evidence === doc?.reference && r.decision === "accepted");
  });
  value.resolveFlag = restrict(value.resolveFlag, (id) => canReview(user, state.applications.find((a) => a.id === id)?.organisation.legalName ?? ""));
  value.decideApplication = restrict(value.decideApplication, (id) => canReview(user, state.applications.find((a) => a.id === id)?.organisation.legalName ?? ""));
  value.assignApplication = restrict(value.assignApplication, (id) => canReview(user, state.applications.find((a) => a.id === id)?.organisation.legalName ?? ""));
  value.decideApplication = restrict(value.decideApplication, (id, status, note) => !!note.trim() && (status !== "approved" || !!state.applications.find((a) => a.id === id)?.verifications?.some((r) => r.decision === "accepted")));
  value.setResultVerdict = restrict(value.setResultVerdict, (id) => user?.role === "partner" && can(user, "operate", state.samples.find((a) => a.id === id)?.partnerOrg));
  value.submitQualityReview = restrict(value.submitQualityReview, (id) => user?.role === "partner" && can(user, "operate", state.samples.find((a) => a.id === id)?.partnerOrg));
  value.issueCertificate = restrict(value.issueCertificate, (id) => user?.role === "partner" && can(user, "operate", state.samples.find((a) => a.id === id)?.partnerOrg));
  value.setSampleStatus = restrict(value.setSampleStatus, (id) => user?.role === "partner" && can(user, "operate", state.samples.find((a) => a.id === id)?.partnerOrg));
  value.registerSample = restrict(value.registerSample, () => (user?.role === "miner" || user?.role === "partner") && can(user, "operate"));
  value.createTestRequest = restrict(value.createTestRequest, (id) => { const s = state.samples.find((a) => a.id === id); return !!s && (can(user, "operate", s.partnerOrg) || can(user, "operate", s.minerOrg)); });
  value.addCustody = restrict(value.addCustody, (id) => { const s = state.samples.find((a) => a.id === id); return !!s && (can(user, "operate", s.partnerOrg) || can(user, "operate", s.minerOrg)); });
  value.revokeCertificate = restrict(value.revokeCertificate, (id) => user?.role === "partner" && can(user, "operate", state.certificates.find((c) => c.id === id)?.issuedBy));
  value.createAssignment = restrict(value.createAssignment, (input) => can(user, "request", input.sourceOrg));
  value.setAssignmentStatus = restrict(value.setAssignmentStatus, (id) => can(user, "operate", state.assignments.find((a) => a.id === id)?.providerOrg) && user?.role === "partner");
  value.addSamplingEvent = restrict(value.addSamplingEvent, (id) => can(user, "operate", state.assignments.find((a) => a.id === id)?.providerOrg) && user?.role === "partner");
  value.addCustodyHandover = restrict(value.addCustodyHandover, (id) => can(user, "operate", state.assignments.find((a) => a.id === id)?.providerOrg) && user?.role === "partner");
  value.addLabAnalysis = restrict(value.addLabAnalysis, (id) => can(user, "operate", state.assignments.find((a) => a.id === id)?.providerOrg) && user?.role === "partner");
  value.setLabAnalysisStatus = restrict(value.setLabAnalysisStatus, (id) => can(user, "operate", state.assignments.find((a) => a.id === id)?.providerOrg) && user?.role === "partner");
  value.addAssignmentReview = restrict(value.addAssignmentReview, (id) => canReview(user, state.assignments.find((a) => a.id === id)?.providerOrg ?? ""));
  value.addAssignmentReview = restrict(value.addAssignmentReview, (id, decision, note) => !!note.trim() && (decision !== "demo_verified" || !!state.assignments.find((a) => a.id === id)?.verifications?.some((r) => r.decision === "accepted")));
  value.raiseNonConformity = restrict(value.raiseNonConformity, (input) => canReview(user, input.against));
  value.closeNonConformity = restrict(value.closeNonConformity, () => can(user, "review"));
  value.addCorrectiveAction = restrict(value.addCorrectiveAction, (id) => can(user, "respond", state.nonConformities.find((n) => n.id === id)?.against));
  value.advanceCorrectiveAction = restrict(value.advanceCorrectiveAction, (id) => can(user, "respond", state.nonConformities.find((n) => n.id === id)?.against));
  return <BeldiumContext.Provider value={value}>{children}</BeldiumContext.Provider>;
}

export function useBeldium() {
  const ctx = React.useContext(BeldiumContext);
  if (!ctx) throw new Error("useBeldium must be used inside BeldiumProvider");
  return ctx;
}

export { buyerSpecs, demoUsers };
