import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type {
  ConflictDeclaration,
  InfoRequest,
  InspectionCapability,
  JoinRequest,
  OnboardingAccount,
  OnboardingDocument,
  OnboardingRole,
  OnboardingState,
  OnboardingTimelineEntry,
  OrgApplication,
  OrgPath,
  Personnel,
  ProfessionalApplication,
  RegulatorApplication,
  ReviewFinding,
  ReviewMessage,
  VerificationState,
} from "./types";


const STORAGE_KEY = "beldium-onboarding-v1";

function stamp() {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

let seq = 0;
const uid = (p: string) => `${p}-${Date.now().toString(36)}-${seq++}`;

const emptyAccount: OnboardingAccount = {
  fullName: "",
  jobTitle: "",
  email: "",
  phone: "",
  password: "",
  emailVerified: false,
  phoneVerified: false,
  acceptedTerms: false,
};

const emptyApplication: OrgApplication = {
  ref: "",
  legalName: "",
  tradingName: "",
  rcNumber: "",
  tin: "",
  entityType: "Private Limited Company",
  incorporated: "",
  hqAddress: "",
  operatingAddress: "",
  officialEmail: "",
  officialPhone: "",
  primaryContact: "",
  yearsInOperation: "",
  state: "Nasarawa",
  lga: "",
  website: "",
  primaryMineral: "Lithium (Spodumene)",
  services: [],
  otherService: "",
  coverage: "Selected States",
  statesCovered: [],
  mineralsExperience: [],
  siteInspectionAvailable: false,
  mobilisationTime: "",
  monthlyInspectionCapacity: "",
  licenceNumber: "",
  licenceType: "Small Scale Mining Lease",
  licenceExpiry: "",
  siteName: "",
  siteState: "Nasarawa",
  siteLga: "",
  siteCoordinates: "8.5401, 8.3172",
  siteAreaHa: "",
  workforce: "",
  annualCapacity: "",
};

const emptyProfessional: ProfessionalApplication = {
  ref: "",
  fullName: "",
  phone: "",
  email: "",
  address: "",
  state: "Nasarawa",
  country: "Nigeria",
  idType: "National Identification Number (NIN)",
  idNumber: "",
  jobTitle: "",
  profession: "Mining Engineer",
  employmentStatus: "Self-employed / Independent",
  yearsMining: "",
  yearsCompliance: "",
  summary: "",
  highestQualification: "",
  institution: "",
  fieldOfStudy: "",
  certifications: "",
  memberships: "",
  registrationNumber: "",
  issueDate: "",
  expiryDate: "",
  reviewCapabilities: [],
  lithiumYears: "",
  lithiumReviewExperience: "",
  lithiumInspectionExperience: "",
  lithiumProjects: "",
  statesCovered: [],
  availableForInspection: false,
  mobilisationTime: "",
  canCaptureGps: false,
  canCapturePhotos: false,
  canCaptureVideo: false,
  canVerifyCoordinates: false,
  canReviewSiteDocuments: false,
  samplingExperience: false,
  canSubmitDigitalReports: false,
  independence: {},
  independenceDisclosure: "",
  declarations: {},
};

const emptyRegulator: RegulatorApplication = {
  ref: "",
  legalName: "",
  institutionType: "Federal Agency / Parastatal",
  established: "",
  headOffice: "",
  country: "Nigeria",
  state: "FCT Abuja",
  officialEmail: "",
  officialPhone: "",
  website: "",
  primaryRepresentative: "",
  mandate: "",
  ministry: "",
  responsibilities: [],
  oversightFunctions: [],
  jurisdiction: [],
  mineralsCovered: [],
  canInspect: false,
  canReviewLicences: false,
  canIssueDecisions: false,
  oversightCapabilities: [],
};

const emptyCapability: InspectionCapability = {
  offersInspection: false,
  accreditation: "",
  accreditationNumber: "",
  disciplines: [],
  regionsCovered: [],
  inspectorCount: "",
  equipment: "",
  professionalCount: "",
  engineerCount: "",
  geologistCount: "",
  environmentalCount: "",
  hseCount: "",
  fieldInspection: false,
  gpsEvidence: false,
  photoVideoEvidence: false,
  digitalReports: false,
  samplingCapability: false,
  maxMonthlyReviews: "",
  maxMonthlySiteInspections: "",
  averageTurnaround: "",
};


const emptyConflict: ConflictDeclaration = {
  hasConflict: null,
  relationship: "",
  affectedParties: "",
  mitigation: "",
  declaredBy: "",
  attested: false,
};

const seedJoinRequests: JoinRequest[] = [
  {
    id: "jr-seed-1",
    organisationName: "Kogi Mineral Resources Plc",
    requesterName: "Halima Yusuf",
    requesterEmail: "h.yusuf@kogimineral.demo",
    role: "Compliance Officer",
    justification: "Newly appointed compliance officer for the Egbe lithium operation.",
    submittedAt: "2026-08-28 10:12",
    status: "Pending",
  },
  {
    id: "jr-seed-2",
    organisationName: "Sunrise Minerals Holding Ltd",
    requesterName: "Tunde Salami",
    requesterEmail: "t.salami@sunriseminerals.demo",
    role: "Site Manager",
    justification: "Requires access to upload environmental monitoring evidence.",
    submittedAt: "2026-08-25 16:40",
    status: "Approved",
    decisionNote: "Verified against staff register.",
  },
];

const seedMessages: ReviewMessage[] = [
  {
    id: "msg-seed-1",
    from: "Beldium verification team",
    body: "Your application has been received and queued for verification. We will contact you if anything further is required.",
    at: "2026-09-01 09:20",
  },
];

const initialState: OnboardingState = {
  role: null,
  orgPath: null,
  account: emptyAccount,
  application: emptyApplication,
  professional: emptyProfessional,
  regulator: emptyRegulator,
  documents: [],
  personnel: [],
  capability: emptyCapability,
  conflict: emptyConflict,
  declarations: {},
  joinRequests: seedJoinRequests,
  verification: "Draft",
  conditions: [],
  findings: [],
  timeline: [],
  submittedAt: null,
  welcomeSeen: false,
  partnerId: null,
  approvedCapabilities: [],
  infoRequests: [],
  messages: seedMessages,
};


interface Ctx extends OnboardingState {
  hydrated: boolean;
  setRole: (role: OnboardingRole) => void;
  setOrgPath: (path: OrgPath) => void;
  updateAccount: (patch: Partial<OnboardingAccount>) => void;
  verifyChannel: (channel: "email" | "phone") => void;
  updateApplication: (patch: Partial<OrgApplication>) => void;
  addDocument: (doc: Omit<OnboardingDocument, "id" | "status">) => void;
  removeDocument: (id: string) => void;
  addPersonnel: (p: Omit<Personnel, "id">) => void;
  removePersonnel: (id: string) => void;
  updateCapability: (patch: Partial<InspectionCapability>) => void;
  updateConflict: (patch: Partial<ConflictDeclaration>) => void;
  updateProfessional: (patch: Partial<ProfessionalApplication>) => void;
  updateRegulator: (patch: Partial<RegulatorApplication>) => void;
  setDeclaration: (key: string, value: boolean) => void;
  submitApplication: () => string;
  approveApplication: (capabilities?: string[]) => void;
  raiseInfoRequests: (items: { subject: string; detail: string }[]) => void;
  respondToInfoRequest: (id: string, response: string) => void;

  addJoinRequest: (input: { organisationName: string; role: string; justification: string }) => void;
  decideJoinRequest: (id: string, decision: "Approved" | "Declined", note: string) => void;
  setVerification: (state: VerificationState, opts?: { conditions?: string[]; findings?: ReviewFinding[]; note?: string }) => void;
  resolveFinding: (id: string) => void;
  markWelcomeSeen: () => void;
  resetOnboarding: () => void;
  log: (entry: Omit<OnboardingTimelineEntry, "id" | "at">) => void;
}

const OnboardingContext = createContext<Ctx | null>(null);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<OnboardingState>(initialState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as Partial<OnboardingState>;
        setState({
          ...initialState,
          ...saved,
          account: { ...emptyAccount, ...(saved.account ?? {}) },
          application: { ...emptyApplication, ...(saved.application ?? {}) },
          professional: {
            ...emptyProfessional,
            ...(saved.professional ?? {}),
            independence: { ...(saved.professional?.independence ?? {}) },
            declarations: { ...(saved.professional?.declarations ?? {}) },
          },
          regulator: { ...emptyRegulator, ...(saved.regulator ?? {}) },
          capability: { ...emptyCapability, ...(saved.capability ?? {}) },
          conflict: { ...emptyConflict, ...(saved.conflict ?? {}) },
          declarations: { ...(saved.declarations ?? {}) },
          documents: saved.documents ?? [],
          personnel: saved.personnel ?? [],
          joinRequests: saved.joinRequests ?? seedJoinRequests,
          conditions: saved.conditions ?? [],
          findings: saved.findings ?? [],
          timeline: saved.timeline ?? [],
          approvedCapabilities: saved.approvedCapabilities ?? [],
          infoRequests: saved.infoRequests ?? [],
          messages: saved.messages ?? seedMessages,
        });
      }
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);


  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }, [state, hydrated]);

  const push = useCallback((s: OnboardingState, entry: Omit<OnboardingTimelineEntry, "id" | "at">): OnboardingState => ({
    ...s,
    timeline: [{ id: uid("tl"), at: stamp(), ...entry }, ...s.timeline].slice(0, 60),
  }), []);

  const log = useCallback((entry: Omit<OnboardingTimelineEntry, "id" | "at">) => {
    setState((s) => push(s, entry));
  }, [push]);

  const value = useMemo<Ctx>(() => ({
    ...state,
    hydrated,
    log,
    setRole: (role) =>
      setState((s) => push({ ...s, role }, { actor: "You", title: "Role selected", detail: `Account type set to ${role}.`, tone: "neutral" })),
    setOrgPath: (orgPath) => setState((s) => ({ ...s, orgPath })),
    updateAccount: (patch) => setState((s) => ({ ...s, account: { ...s.account, ...patch } })),
    verifyChannel: (channel) =>
      setState((s) =>
        push(
          { ...s, account: { ...s.account, [channel === "email" ? "emailVerified" : "phoneVerified"]: true } },
          { actor: "You", title: `${channel === "email" ? "Email" : "Phone"} verified`, detail: `One-time code confirmed for ${channel === "email" ? s.account.email : s.account.phone}.`, tone: "positive" },
        ),
      ),
    updateApplication: (patch) => setState((s) => ({ ...s, application: { ...s.application, ...patch } })),
    addDocument: (doc) =>
      setState((s) =>
        push({ ...s, documents: [{ id: uid("doc"), status: "Uploaded", ...doc }, ...s.documents] }, {
          actor: "You",
          title: "Document attached",
          detail: `${doc.category} — ${doc.name}`,
          tone: "neutral",
        }),
      ),
    removeDocument: (id) => setState((s) => ({ ...s, documents: s.documents.filter((d) => d.id !== id) })),
    addPersonnel: (p) =>
      setState((s) =>
        push({ ...s, personnel: [{ id: uid("per"), ...p }, ...s.personnel] }, {
          actor: "You",
          title: "Personnel added",
          detail: `${p.name} — ${p.position}`,
          tone: "neutral",
        }),
      ),
    removePersonnel: (id) => setState((s) => ({ ...s, personnel: s.personnel.filter((p) => p.id !== id) })),
    updateCapability: (patch) => setState((s) => ({ ...s, capability: { ...s.capability, ...patch } })),
    updateConflict: (patch) => setState((s) => ({ ...s, conflict: { ...s.conflict, ...patch } })),
    updateProfessional: (patch) => setState((s) => ({ ...s, professional: { ...s.professional, ...patch } })),
    updateRegulator: (patch) => setState((s) => ({ ...s, regulator: { ...s.regulator, ...patch } })),
    setDeclaration: (key, val) => setState((s) => ({ ...s, declarations: { ...s.declarations, [key]: val } })),
    submitApplication: () => {
      const ref = `APP-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 900) + 100)}`;
      setState((s) =>
        push(
          {
            ...s,
            application: { ...s.application, ref },
            professional: { ...s.professional, ref },
            regulator: { ...s.regulator, ref },
            verification: "Under Review",
            submittedAt: stamp(),
            findings: [],
            conditions: [],
          },
          { actor: "You", title: "Application submitted", detail: `Reference ${ref} sent to the Beldium verification team.`, tone: "positive" },
        ),
      );
      return ref;
    },
    approveApplication: (capabilities) => {
      setState((s) => {
        const isRegulator = s.role === "regulator-org" || s.role === "regulator-officer";
        const requested =
          capabilities ??
          (s.role === "independent"
            ? s.professional.reviewCapabilities
            : isRegulator
              ? s.regulator.oversightCapabilities
              : s.application.services);
        const idLabel = isRegulator ? "Beldium Regulatory Organisation ID" : "Beldium Compliance ID";
        const partnerId = `BLD-${isRegulator ? "RO" : "CP"}-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`;
        return push(
          {
            ...s,
            verification: "Verified",
            partnerId,
            approvedCapabilities: requested,
            findings: [],
            conditions: [],
            messages: [
              {
                id: uid("msg"),
                from: "Beldium verification team",
                body: `Application approved. ${idLabel} ${partnerId} has been issued and your approved capabilities are now active.`,
                at: stamp(),
              },
              ...s.messages,
            ],
          },
          {
            actor: "Beldium verification team",
            title: "Application approved",
            detail: `Verified — ${idLabel} ${partnerId} issued with ${requested.length} approved capabilities.`,
            tone: "positive",
          },
        );
      });
    },
    raiseInfoRequests: (items) =>
      setState((s) =>
        push(
          {
            ...s,
            verification: "Information Required",
            infoRequests: [
              ...items.map((i) => ({ id: uid("ir"), subject: i.subject, detail: i.detail, raisedAt: stamp(), status: "Open" as const })),
              ...s.infoRequests,
            ],
          },
          {
            actor: "Beldium verification team",
            title: "Information requested",
            detail: `${items.length} item(s) require your response before verification can continue.`,
            tone: "warning",
          },
        ),
      ),
    respondToInfoRequest: (id, response) =>
      setState((s) => {
        const infoRequests = s.infoRequests.map((r) => (r.id === id ? { ...r, status: "Responded" as const, response } : r));
        const allDone = infoRequests.every((r) => r.status === "Responded");
        return push(
          { ...s, infoRequests, verification: allDone ? "Under Review" : s.verification },
          {
            actor: "You",
            title: "Information supplied",
            detail: allDone ? "All information requests answered — application returned to review." : "Response submitted to the review team.",
            tone: "positive",
          },
        );
      }),

    addJoinRequest: (input) =>
      setState((s) =>
        push(
          {
            ...s,
            joinRequests: [
              {
                id: uid("jr"),
                organisationName: input.organisationName,
                requesterName: s.account.fullName || "You",
                requesterEmail: s.account.email || "you@example.demo",
                role: input.role,
                justification: input.justification,
                submittedAt: stamp(),
                status: "Pending",
              },
              ...s.joinRequests,
            ],
            verification: "Under Review",
          },
          { actor: "You", title: "Join request sent", detail: `Access request sent to the administrator of ${input.organisationName}.`, tone: "neutral" },
        ),
      ),
    decideJoinRequest: (id, decision, note) =>
      setState((s) =>
        push(
          {
            ...s,
            joinRequests: s.joinRequests.map((j) => (j.id === id ? { ...j, status: decision, decisionNote: note } : j)),
            verification:
              decision === "Approved" && s.joinRequests.some((j) => j.id === id && j.requesterEmail === s.account.email)
                ? "Verified"
                : s.verification,
          },
          {
            actor: "Organisation administrator",
            title: `Join request ${decision.toLowerCase()}`,
            detail: note || `Request ${decision.toLowerCase()} by the organisation administrator.`,
            tone: decision === "Approved" ? "positive" : "negative",
          },
        ),
      ),
    setVerification: (verification, opts) =>
      setState((s) =>
        push(
          {
            ...s,
            verification,
            conditions: opts?.conditions ?? (verification === "Conditionally Verified" ? s.conditions : []),
            findings: opts?.findings ?? (verification === "Information Required" ? s.findings : []),
          },
          {
            actor: "Beldium verification team",
            title: `Status: ${verification}`,
            detail: opts?.note ?? `Verification status moved to ${verification}.`,
            tone:
              verification === "Verified"
                ? "positive"
                : verification === "Rejected"
                  ? "negative"
                  : verification === "Conditionally Verified"
                    ? "neutral"
                    : "warning",
          },
        ),
      ),
    resolveFinding: (id) =>
      setState((s) => {
        const findings = s.findings.map((f) => (f.id === id ? { ...f, status: "Resolved" as const } : f));
        const allResolved = findings.every((f) => f.status === "Resolved");
        return push(
          { ...s, findings, verification: allResolved ? "Under Review" : s.verification },
          {
            actor: "You",
            title: "Information supplied",
            detail: allResolved
              ? "All outstanding items answered — application returned to review."
              : "Response submitted for an outstanding item.",
            tone: "positive",
          },
        );
      }),
    markWelcomeSeen: () => setState((s) => ({ ...s, welcomeSeen: true })),
    resetOnboarding: () => setState({ ...initialState }),
  }), [state, hydrated, log, push]);

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
}

export function useOnboarding() {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error("useOnboarding must be used inside OnboardingProvider");
  return ctx;
}

export function demoFindings(): ReviewFinding[] {
  return [
    { id: uid("fd"), area: "Corporate", requirement: "Upload a CAC status report dated within the last 90 days.", status: "Outstanding", raisedAt: stamp() },
    { id: uid("fd"), area: "Licence", requirement: "Licence coordinates do not match the declared site polygon — provide a surveyor's report.", status: "Outstanding", raisedAt: stamp() },
  ];
}

export const demoConditions = [
  "Provide an updated Environmental Impact Assessment within 60 days.",
  "Appoint a certified mine safety officer and register them on the platform.",
];
