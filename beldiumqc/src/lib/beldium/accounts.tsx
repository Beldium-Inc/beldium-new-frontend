import * as React from "react";
import { canReview, makeVerification, type VerificationInput, type VerificationRecord } from "./compliance";
import { demoUsers } from "./data";
import { useBeldium } from "./store";
import type { DemoUser } from "./types";
import { roleDefs, type AppStatus, type DocState, type QcRoleKey } from "./onboarding";

export interface AppDocument {
  id: string;
  type: string;
  fileName: string;
  size: number;
  status: DocState;
  note?: string;
}

export interface InfoRequest {
  id: string;
  title: string;
  detail: string;
  requestedAt: string;
  status: "open" | "responded";
  response?: string;
  evidence: string[];
}

export interface TimelineEntry {
  id: string;
  at: string;
  title: string;
  detail: string;
  actor: string;
}

export interface Notification {
  id: string;
  at: string;
  text: string;
  read: boolean;
}

export interface QcApplication {
  verifications?: VerificationRecord[];
  ref: string;
  type: string;
  submittedAt: string;
  status: AppStatus;
  values: Record<string, unknown>;
  documents: AppDocument[];
  requests: InfoRequest[];
  timeline: TimelineEntry[];
  notifications: Notification[];
}

export interface Account {
  id: string;
  email: string;
  password: string;
  name: string;
  phone: string;
  roleKey?: QcRoleKey;
  demoUserId?: string;
  origin?: "public" | "provisioned";
  orgName: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  application: QcApplication | null;
}

const KEY = "beldium.accounts.v1";
const SESSION = "beldium.session.v1";

export function stamp() {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}
const uid = (p: string) => `${p}-${Math.random().toString(36).slice(2, 8)}`;

function seedApp(
  roleKey: QcRoleKey,
  ref: string,
  date: string,
  status: AppStatus,
  values: Record<string, unknown>,
  docs: [string, DocState][],
  extra: Partial<QcApplication> = {},
): QcApplication {
  const timeline: TimelineEntry[] = [
    { id: uid("t"), at: `${date} 09:12`, title: "Application submitted", detail: ref, actor: "Applicant" },
    { id: uid("t"), at: `${date} 11:40`, title: "Review opened", detail: "Assigned to Amina Delacroix", actor: "Beldium Compliance" },
  ];
  if (status !== "under_review" && status !== "submitted")
    timeline.push({
      id: uid("t"),
      at: `${date} 16:05`,
      title: `Status changed to ${status.replace(/_/g, " ")}`,
      detail: "Reviewer decision recorded",
      actor: "Demo Beldium reviewer",
    });
  return {
    ref,
    type: roleDefs[roleKey].applicationType,
    submittedAt: date,
    status,
    values,
    documents: docs.map(([type, s]) => ({
      id: uid("d"),
      type,
      fileName: `${type.split(" ")[0]!.toLowerCase().replace(/[^a-z]/g, "")}_scan.pdf`,
      size: 240000 + Math.floor(Math.random() * 900000),
      status: s,
    })),
    requests: [],
    timeline,
    notifications: [
      { id: uid("n"), at: `${date} 09:12`, text: `We received ${ref}. Review usually takes 3–5 working days.`, read: true },
    ],
    ...extra,
  };
}

const orgValues = {
  legalName: "Jos Plateau Minerals Testing Ltd",
  orgType: "Mineral Testing Organisation",
  cac: "RC-1458822",
  tin: "20114588-0001",
  capabilities: ["Sampling", "Mineral Testing", "Assay", "Certificate / Report Issuance"],
  minerals: ["Tin (Cassiterite)", "Tantalum (Coltan)", "Lithium"],
  laboratories: [
    { name: "Jos Central Laboratory", location: "Jos, Plateau", registration: "LAB-NG-0204" },
    { name: "Nasarawa Field Lab", location: "Lafia, Nasarawa", registration: "LAB-NG-0377" },
  ],
  accBody: "NiNAS",
  accNumber: "NiNAS-LAB-0204",
  accExpiry: "2027-03-01",
  accScope: "Sn, Ta, Nb by XRF in concentrates 0.1–75 %; Li by ICP-OES in pegmatite ores.",
  methods: ["XRF", "ICP-OES", "Gravimetric"],
  equipment: [
    { name: "PANalytical Epsilon 4", serial: "EP4-11209", calibrated: "2026-04-02" },
    { name: "Agilent 5110 ICP-OES", serial: "MY21480012", calibrated: "2026-03-14" },
  ],
  personnel: [
    { name: "Dr. Ngozi Eze", role: "Managing Director / Signatory", email: "ngozi@josplateau.ng" },
    { name: "Hauwa Bello", role: "Quality Manager", email: "hauwa@josplateau.ng" },
  ],
  regions: ["North Central Nigeria"],
};

function seedAccounts(): Account[] {
  const demo: Account[] = demoUsers.map((u) => ({
    id: `acc-${u.id}`,
    email: `${u.name.split(" ")[0]!.toLowerCase()}@beldium.demo`,
    password: "demo1234",
    name: u.name,
    phone: "+234 800 000 0000",
    demoUserId: u.id,
    orgName: u.org,
    emailVerified: true,
    phoneVerified: true,
    application: null,
  }));
  const qc: Account[] = [
    {
      id: "acc-ngozi",
      email: "ngozi@josplateau.ng",
      password: "demo1234",
      name: "Dr. Ngozi Eze",
      phone: "+234 803 555 0142",
      roleKey: "qc_org",
      orgName: "Jos Plateau Minerals Testing Ltd",
      emailVerified: true,
      phoneVerified: true,
      application: seedApp("qc_org", "QCO-2026-0311", "2026-09-02", "approved", orgValues, [
        ["CAC / Organisation Registration", "verified"],
        ["TIN", "verified"],
        ["Laboratory Registration", "verified"],
        ["Accreditation Certificate", "verified"],
        ["Accreditation Scope", "verified"],
        ["Equipment Calibration Certificates", "expiring"],
      ]),
    },
    {
      id: "acc-tunde",
      email: "tunde@sahelinspect.ng",
      password: "demo1234",
      name: "Tunde Bakare",
      phone: "+234 806 210 4471",
      roleKey: "qc_officer",
      orgName: "Sahel Inspection Services",
      emailVerified: true,
      phoneVerified: true,
      application: seedApp(
        "qc_officer",
        "QCP-2026-0457",
        "2026-09-28",
        "information_required",
        {
          organisation: { id: "org-sgx", name: "Sahel Inspection Services" },
          fullName: "Tunde Bakare",
          jobTitle: "Senior Field Inspector",
          capabilities: ["Sampling", "Pre Shipment Inspection"],
          minerals: ["Gold", "Lead / Zinc"],
          years: "9",
        },
        [
          ["Professional Qualifications", "verified"],
          ["Inspection Credentials", "information_required"],
          ["Sampling Credentials", "under_review"],
        ],
        {
          requests: [
            {
              id: "req-1",
              title: "Inspection credential is illegible",
              detail:
                "The uploaded inspection credential scan is cropped and the expiry date is not visible. Please upload a full-page colour scan and confirm the issuing body.",
              requestedAt: "2026-10-01",
              status: "open",
              evidence: [],
            },
          ],
        },
      ),
    },
    {
      id: "acc-hauwa",
      email: "hauwa@josplateau.ng",
      password: "demo1234",
      name: "Hauwa Bello",
      phone: "+234 809 771 2290",
      roleKey: "lab_analyst",
      orgName: "Jos Plateau Minerals Testing Ltd",
      emailVerified: true,
      phoneVerified: true,
      application: seedApp(
        "lab_analyst",
        "QCP-2026-0462",
        "2026-10-03",
        "under_review",
        { laboratory: { id: "lab-jos", name: "Jos Central Laboratory" }, methods: ["XRF", "ICP-OES"], minerals: ["Tin (Cassiterite)"] },
        [
          ["Professional Qualifications", "under_review"],
          ["Professional Certifications", "uploaded"],
        ],
      ),
    },
    {
      id: "acc-emeka",
      email: "emeka@independentqc.ng",
      password: "demo1234",
      name: "Emeka Obi",
      phone: "+234 802 330 9901",
      roleKey: "independent",
      orgName: "Obi Quality Consulting",
      emailVerified: true,
      phoneVerified: true,
      application: seedApp(
        "independent",
        "QCI-2026-0120",
        "2026-09-20",
        "inspection_required",
        { fullName: "Emeka Obi", capabilities: ["Sampling", "Sample Inspection"], regions: ["South South Nigeria"], minerals: ["Barite"] },
        [
          ["Professional Qualifications", "verified"],
          ["Professional Certifications", "verified"],
          ["Equipment Calibration Certificates", "under_review"],
        ],
      ),
    },
    {
      id: "acc-son",
      email: "aisha@son.gov.ng",
      password: "demo1234",
      name: "Aisha Lawal",
      phone: "+234 809 100 2020",
      roleKey: "reg_org",
      orgName: "Standards Organisation of Nigeria",
      emailVerified: true,
      phoneVerified: true,
      application: seedApp(
        "reg_org",
        "ROA-2026-0014",
        "2026-08-30",
        "conditionally_approved",
        { legalName: "Standards Organisation of Nigeria", jurisdiction: "Federal Republic of Nigeria", oversight: ["Laboratory accreditation oversight", "Export certification"] },
        [
          ["Relevant Regulatory Approvals", "verified"],
          ["Other Supporting Documents", "expiring"],
        ],
      ),
    },
    {
      id: "acc-kivu",
      email: "jp@kivusampling.cd",
      password: "demo1234",
      name: "Jean-Paul Mbala",
      phone: "+243 81 555 0190",
      roleKey: "qc_org",
      orgName: "Kivu Sampling Laboratories",
      emailVerified: true,
      phoneVerified: true,
      application: seedApp(
        "qc_org",
        "QCO-2026-0298",
        "2026-08-11",
        "rejected",
        { legalName: "Kivu Sampling Laboratories", orgType: "Sampling Organisation" },
        [
          ["CAC / Organisation Registration", "verified"],
          ["Accreditation Certificate", "rejected"],
          ["Accreditation Scope", "expired"],
        ],
      ),
    },
    {
      id: "acc-musa",
      email: "musa@northlab.ng",
      password: "demo1234",
      name: "Musa Danjuma",
      phone: "+234 805 441 7781",
      roleKey: "qc_officer",
      orgName: "Jos Plateau Minerals Testing Ltd",
      emailVerified: true,
      phoneVerified: true,
      application: seedApp(
        "qc_officer",
        "QCP-2026-0201",
        "2026-06-14",
        "suspended",
        { organisation: { id: "org-jos", name: "Jos Plateau Minerals Testing Ltd" } },
        [
          ["Professional Qualifications", "verified"],
          ["Inspection Credentials", "expired"],
        ],
      ),
    },
  ];
  return [...qc, ...demo];
}

interface Ctx {
  ready: boolean;
  accounts: Account[];
  current: Account | null;
  signIn: (email: string, password: string, remember: boolean) => { ok: true; account: Account } | { ok: false; error: string };
  signOut: () => void;
  createAccount: (input: { name: string; email: string; phone: string; password: string; roleKey: QcRoleKey }) => { ok: true; id: string } | { ok: false; error: string };
  patchAccount: (id: string, fn: (a: Account) => Account) => void;
  submitApplication: (id: string, values: Record<string, unknown>) => QcApplication;
  respondToRequest: (id: string, reqId: string, response: string, evidence: string[]) => void;
  reuploadDocument: (id: string, docId: string, fileName: string, size: number) => void;
  recordVerification: (id: string, input: VerificationInput) => void;
  setStatus: (id: string, status: AppStatus, note: string) => void;
  markNotificationsRead: (id: string) => void;
  resetPassword: (email: string, password: string) => boolean;
  findByEmail: (email: string) => Account | undefined;
  enterWorkspace: (account: Account) => "/dashboard" | "/application-status";
}

const AccountsContext = React.createContext<Ctx | null>(null);

function initials(name: string) {
  return name
    .replace(/^Dr\.?\s*/i, "")
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function workspaceProfile(a: Account): DemoUser | null {
  if (!a.roleKey) return null;
  const def = roleDefs[a.roleKey];
  return {
    id: a.id,
    role: def.workspaceRole === "regulator" ? "partner" : def.workspaceRole,
    memberships: [{ id: `membership-${a.id}`, organization: a.orgName, sector: "Quality & Control", role: "partner", environment: "operations", permissions: def.workspaceRole === "regulator" ? [] : ["view", "operate", "request", "respond"] }],
    name: a.name,
    title: def.title,
    org: a.orgName,
    initials: initials(a.name),
    blurb: def.description,
  };
}

export function AccountsProvider({ children }: { children: React.ReactNode }) {
  const beldium = useBeldium();
  const [accounts, setAccounts] = React.useState<Account[]>(() => seedAccounts());
  const [sessionId, setSessionId] = React.useState<string | null>(null);
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setAccounts(JSON.parse(raw));
      const s = localStorage.getItem(SESSION) ?? sessionStorage.getItem(SESSION);
      if (s) setSessionId(s);
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  React.useEffect(() => {
    if (ready) localStorage.setItem(KEY, JSON.stringify(accounts));
  }, [accounts, ready]);

  // Keep session in sync with workspace logout.
  React.useEffect(() => {
    if (beldium.ready && ready && !beldium.user && sessionId) {
      const s = localStorage.getItem(SESSION) ?? sessionStorage.getItem(SESSION);
      if (!s) setSessionId(null);
    }
  }, [beldium.ready, beldium.user, ready, sessionId]);

  const current = accounts.find((a) => a.id === sessionId) ?? null;

  const patchAccount = React.useCallback((id: string, fn: (a: Account) => Account) => {
    setAccounts((list) => list.map((a) => (a.id === id ? fn(a) : a)));
  }, []);

  const patchApp = (id: string, fn: (app: QcApplication) => QcApplication) =>
    patchAccount(id, (a) => (a.application ? { ...a, application: fn(a.application) } : a));

  const setSession = (id: string, remember: boolean) => {
    localStorage.removeItem(SESSION);
    sessionStorage.removeItem(SESSION);
    (remember ? localStorage : sessionStorage).setItem(SESSION, id);
    setSessionId(id);
  };

  const value: Ctx = {
    ready,
    accounts,
    current,
    findByEmail: (email) => accounts.find((a) => a.email.toLowerCase() === email.trim().toLowerCase()),
    signIn: (email, password, remember) => {
      const a = accounts.find((x) => x.email.toLowerCase() === email.trim().toLowerCase());
      if (!a) return { ok: false, error: "No Beldium account uses this email address." };
      if (a.password !== password) return { ok: false, error: "Incorrect password. Try again or reset it." };
      setSession(a.id, remember);
      return { ok: true, account: a };
    },
    signOut: () => {
      beldium.logout();
      setSessionId(null);
    },
    createAccount: (input) => {
      if (accounts.some((a) => a.email.toLowerCase() === input.email.toLowerCase()))
        return { ok: false, error: "An account with this email already exists. Sign in instead." };
      const id = uid("acc");
      setAccounts((l) => [
        ...l,
        {
          id,
          email: input.email.trim(),
          password: input.password,
          name: input.name.trim(),
          phone: input.phone.trim(),
          roleKey: input.roleKey,
          origin: "public",
          orgName: "",
          emailVerified: false,
          phoneVerified: false,
          application: null,
        },
      ]);
      setSession(id, false);
      return { ok: true, id };
    },
    patchAccount,
    submitApplication: (id, values) => {
      const acc = accounts.find((a) => a.id === id);
      if (!acc?.roleKey) throw new Error("Application account not found.");
      const def = roleDefs[acc.roleKey];
      const prefix = def.key.startsWith("reg")
        ? "ROA"
        : def.key === "independent"
          ? "QCI"
          : def.individual
            ? "QCP"
            : "BQC-APP";
      const ref = `${prefix}-2026-${String(Math.floor(500 + Math.random() * 400)).padStart(4, "0")}`;
      const docs = (values["documents"] ?? {}) as Record<string, { fileName: string; size: number }>;
      const join = (values["organisation"] ?? values["laboratory"] ?? values["authority"]) as { name: string } | undefined;
      const orgName =
        (values["legalName"] as string) || join?.name || (values["businessName"] as string) || acc.name;
      const at = stamp();
      const app: QcApplication = {
        ref,
        type: def.applicationType,
        submittedAt: at.slice(0, 10),
        status: "under_review",
        values,
        documents: Object.entries(docs).map(([type, f]) => ({
          id: uid("d"),
          type,
          fileName: f.fileName,
          size: f.size,
          status: "under_review",
        })),
        requests: [],
        timeline: [
          { id: uid("t"), at, title: "Application submitted", detail: `${ref} · ${def.applicationType}`, actor: acc.name },
          { id: uid("t"), at, title: "Placed in review queue", detail: "Documents moved to Under Review", actor: "Beldium Compliance" },
        ],
        notifications: [
          { id: uid("n"), at, text: `Application ${ref} received. You can sign in any time to follow its progress.`, read: false },
        ],
      };
      patchAccount(id, (a) => ({ ...a, orgName, application: app }));
      return app;
    },
    respondToRequest: (id, reqId, response, evidence) =>
      patchApp(id, (app) => ({
        ...app,
        status: app.requests.filter((r) => r.status === "open" && r.id !== reqId).length ? app.status : "under_review",
        requests: app.requests.map((r) => (r.id === reqId ? { ...r, status: "responded", response, evidence } : r)),
        documents: [
          ...app.documents,
          ...evidence.map((e) => ({ id: uid("d"), type: "Other Supporting Documents", fileName: e, size: 180000, status: "under_review" as DocState })),
        ],
        timeline: [
          ...app.timeline,
          { id: uid("t"), at: stamp(), title: "Response submitted", detail: `${evidence.length} evidence file(s) attached`, actor: "Applicant" },
        ],
      })),
    reuploadDocument: (id, docId, fileName, size) =>
      patchApp(id, (app) => ({
        ...app,
        documents: app.documents.map((d) => (d.id === docId ? { ...d, fileName, size, status: "under_review" } : d)),
        timeline: [...app.timeline, { id: uid("t"), at: stamp(), title: "Document replaced", detail: fileName, actor: "Applicant" }],
      })),
    recordVerification: (id, input) => {
      const target = accounts.find((a) => a.id === id);
      if (!target || target.id === current?.id || !canReview(beldium.user, target.orgName)) throw new Error("Independent reviewer access required.");
      const record = makeVerification({ ...input, subject: target.orgName }, beldium.user?.name ?? "Reviewer");
      patchApp(id, (app) => ({ ...app, verifications: [...(app.verifications ?? []), record], timeline: [...app.timeline, { id: uid("t"), at: record.at, title: "Simulated source verification recorded", detail: record.findings, actor: record.officer }] }));
    },
    setStatus: (id, status, note) => {
      const target = accounts.find((a) => a.id === id);
      if (!target || id === current?.id || !canReview(beldium.user, target.orgName)) throw new Error("Independent reviewer access required.");
      if (!note.trim()) throw new Error("Record a decision rationale.");
      if (status === "approved" && !target.application?.verifications?.some((r) => r.decision === "accepted")) throw new Error("Record source verification before approval.");
      patchApp(id, (app) => {
        const at = stamp();
        const label = status.replace(/_/g, " ");
        return {
          ...app,
          status,
          documents: app.documents.map((d) => app.verifications?.some((r) => r.evidence === d.fileName && r.decision === "accepted") ? { ...d, status: "verified" } : d),
          requests:
            status === "information_required"
              ? [
                  ...app.requests,
                  {
                    id: uid("req"),
                    title: note || "Additional evidence required",
                    detail: note
                      ? `Reviewer note: ${note}`
                      : "Please provide additional evidence supporting your declared capability and upload it below.",
                    requestedAt: at.slice(0, 10),
                    status: "open",
                    evidence: [],
                  },
                ]
              : app.requests,
          timeline: [...app.timeline, { id: uid("t"), at, title: `Simulated status changed to ${label}`, detail: note || "Reviewer decision recorded", actor: beldium.user?.name ?? "Reviewer" }],
          notifications: [{ id: uid("n"), at, text: `Your application is now ${label}.`, read: false }, ...app.notifications],
        };
      });
    },
    markNotificationsRead: (id) =>
      patchApp(id, (app) => ({ ...app, notifications: app.notifications.map((n) => ({ ...n, read: true })) })),
    resetPassword: (email, password) => {
      const a = accounts.find((x) => x.email.toLowerCase() === email.trim().toLowerCase());
      if (!a) return false;
      patchAccount(a.id, (x) => ({ ...x, password }));
      return true;
    },
    enterWorkspace: (account) => {
      if (account.demoUserId) {
        beldium.login(account.demoUserId);
        return "/dashboard";
      }
      const profile = workspaceProfile(account);
      if (!profile) return "/application-status";
      beldium.login(profile.id, profile);
      const s = account.application?.status;
      return s === "approved" ? "/dashboard" : "/application-status";
    },
  };

  return <AccountsContext.Provider value={value}>{children}</AccountsContext.Provider>;
}

export function useAccounts() {
  const c = React.useContext(AccountsContext);
  if (!c) throw new Error("useAccounts must be used inside AccountsProvider");
  return c;
}
