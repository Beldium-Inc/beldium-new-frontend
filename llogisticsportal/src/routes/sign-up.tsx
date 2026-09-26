import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Plus, Trash2, Truck } from "lucide-react";

import { AuthLayout, Field, inputCls, ProgressSteps } from "@/components/beldium/auth-layout";
import { StatusBadge } from "@/components/beldium/status-badge";
import { cn } from "@/lib/utils";
import {
  complianceQuestions,
  declarations,
  documentGroups,
  existingOrganisations,
  participantTypes,
  roles,
  services,
  setState,
  submitApplication,
  uid,
  useOperator,
  type Capability,
  type DocumentRecord,
  type DriverRecord,
  type Organisation,
  type VehicleRecord,
} from "@/lib/onboarding-store";

export const Route = createFileRoute("/sign-up")({
  head: () => ({
    meta: [
      { title: "Join Beldium as a Logistics Operator" },
      {
        name: "description",
        content: "Register your logistics organisation, fleet, drivers and compliance documents on Beldium.",
      },
      { property: "og:title", content: "Join Beldium as a Logistics Operator" },
      { property: "og:description", content: "Onboard your fleet and drivers to move minerals across the Beldium ecosystem." },
    ],
  }),
  component: SignUp,
});

const ALL = [
  "Logistics",
  "Participant type",
  "Create account",
  "Verify email",
  "Verify phone",
  "Organisation",
  "Organisation profile",
  "Logistics capability",
  "Fleet",
  "Drivers",
  "Documents",
  "Compliance information",
  "Declaration",
  "Review",
] as const;
type Step = (typeof ALL)[number] | "Submitted";
const JOIN_SKIP: Step[] = ["Organisation profile", "Logistics capability", "Fleet", "Drivers", "Documents", "Compliance information"];

const btn = "rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50";
const ghost = "rounded-lg border border-border px-5 py-2.5 text-sm font-semibold text-primary";

function Choice({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full rounded-lg border px-4 py-3 text-left text-sm transition-colors",
        active ? "border-primary bg-light-secondary font-semibold text-primary" : "border-border hover:border-primary",
      )}
    >
      {children}
    </button>
  );
}

function YesNo({ value, onChange }: { value?: string | undefined; onChange: (v: string) => void }) {
  return (
    <div className="flex gap-2">
      {["Yes", "No", "Partially"].map((o) => (
        <button
          key={o}
          type="button"
          onClick={() => onChange(o)}
          className={cn(
            "rounded-full border px-3 py-1 text-xs",
            value === o ? "border-primary bg-primary text-primary-foreground" : "border-border",
          )}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

const emptyOrg: Organisation = {
  mode: "register",
  requestedRole: "Organisation Administrator",
  name: "",
  registrationNumber: "",
  tin: "",
  orgType: "Limited Liability Company",
  registeredAddress: "",
  operatingAddress: "",
  state: "",
  lga: "",
  email: "",
  phone: "",
  website: "",
  primaryContact: "",
  yearEstablished: "",
};
const emptyCap: Capability = {
  services: [],
  operatingStates: "",
  routesCovered: "",
  minerals: "",
  vehicleCategories: "",
  fleetSize: "",
  maxCapacity: "",
  tracking: "",
  security: "",
  sampleCustody: "",
};

function SignUp() {
  const s = useOperator();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("Logistics");
  const [acc, setAcc] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    country: "Nigeria",
    password: "",
    confirm: "",
    terms: false,
  });
  const [code, setCode] = useState("");
  const [search, setSearch] = useState("");

  const org = s.organisation ?? emptyOrg;
  const cap = s.capability ?? emptyCap;
  const joining = org.mode === "join";
  const steps = ALL.filter((x) => !(joining && JOIN_SKIP.includes(x)));
  const idx = steps.indexOf(step as (typeof ALL)[number]);

  const next = () => setStep(steps[idx + 1] ?? "Submitted");
  const back = () => (idx > 0 ? setStep(steps[idx - 1]!) : undefined);
  const setOrg = (p: Partial<Organisation>) => setState({ organisation: { ...org, ...p } });
  const setCap = (p: Partial<Capability>) => setState({ capability: { ...cap, ...p } });

  const orgFields: [keyof Organisation, string][] = [
    ["name", "Organisation name"],
    ["registrationNumber", "CAC / Registration number"],
    ["tin", "TIN"],
    ["orgType", "Organisation type"],
    ["registeredAddress", "Registered address"],
    ["operatingAddress", "Operating address"],
    ["state", "State"],
    ["lga", "LGA"],
    ["email", "Company email"],
    ["phone", "Phone"],
    ["website", "Website"],
    ["primaryContact", "Primary contact"],
    ["yearEstablished", "Year established"],
  ];

  function nav(nextDisabled = false, label = "Continue", onNext = next) {
    return (
      <div className="mt-6 flex justify-between gap-3">
        {idx > 0 ? (
          <button type="button" className={ghost} onClick={back}>
            Back
          </button>
        ) : (
          <span />
        )}
        <button type="button" className={btn} disabled={nextDisabled} onClick={onNext}>
          {label}
        </button>
      </div>
    );
  }

  if (step === "Submitted") {
    const a = s.application;
    return (
      <AuthLayout>
        <div className="text-center">
          <CheckCircle2 className="mx-auto size-12 text-success" />
          <h1 className="mt-3 text-xl font-semibold text-primary">Logistics application submitted successfully</h1>
          <p className="beldium-small mt-1">Beldium Logistics Compliance will review your organisation, fleet, drivers and documents.</p>
        </div>
        <dl className="mt-5 space-y-2 rounded-lg bg-light-secondary p-4 text-sm">
          <Row k="Logistics Application ID" v={a?.applicationId} />
          <Row k="Organisation ID" v={a?.organisationId} />
          <Row k="Submission date" v={a?.submittedAt} />
          <div className="flex items-center justify-between">
            <dt className="text-muted-foreground">Status</dt>
            <StatusBadge value="Under Review" />
          </div>
        </dl>
        <button type="button" className={cn(btn, "mt-6 w-full")} onClick={() => navigate({ to: "/sign-in" })}>
          Go to Sign In
        </button>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout wide={idx >= 5}>
      <ProgressSteps steps={[...steps]} current={idx} />

      {step === "Logistics" && (
        <>
          <h1 className="text-xl font-semibold text-primary">Create your Beldium account</h1>
          <p className="beldium-small mb-4">This onboarding is for Logistics Operators joining the Beldium ecosystem.</p>
          <div className="rounded-lg border border-primary bg-light-secondary px-4 py-3">
            <span className="flex items-center gap-2 text-sm font-semibold text-primary">
              <Truck className="size-4" /> Logistics
            </span>
            <p className="beldium-small mt-1">
              Move samples, minerals and cargo between mines, laboratories, warehouses, processors, ports and buyers.
            </p>
          </div>
          {nav(false)}
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Already registered?{" "}
            <Link to="/sign-in" className="font-semibold text-colorLink">
              Sign in
            </Link>
          </p>
        </>
      )}

      {step === "Participant type" && (
        <>
          <h2 className="beldium-title mb-3">Logistics participant type</h2>
          <div className="space-y-2">
            {participantTypes.map((p) => (
              <Choice
                key={p}
                active={s.account?.participantType === p}
                onClick={() => {
                  setState({ account: { ...(s.account ?? ({} as never)), participantType: p } });
                  setOrg({ mode: p.startsWith("Authorised Employee") ? "join" : "register" });
                }}
              >
                {p}
              </Choice>
            ))}
          </div>
          {nav(!s.account?.participantType)}
        </>
      )}

      {step === "Create account" && (
        <>
          <h2 className="beldium-title mb-3">Create account</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="First name"><input className={inputCls} value={acc.firstName} onChange={(e) => setAcc({ ...acc, firstName: e.target.value })} /></Field>
            <Field label="Last name"><input className={inputCls} value={acc.lastName} onChange={(e) => setAcc({ ...acc, lastName: e.target.value })} /></Field>
            <Field label="Work email"><input type="email" className={inputCls} value={acc.email} onChange={(e) => setAcc({ ...acc, email: e.target.value })} /></Field>
            <Field label="Phone"><input className={inputCls} value={acc.phone} onChange={(e) => setAcc({ ...acc, phone: e.target.value })} placeholder="+234…" /></Field>
            <Field label="Country" className="sm:col-span-2">
              <select className={inputCls} value={acc.country} onChange={(e) => setAcc({ ...acc, country: e.target.value })}>
                {["Nigeria", "Ghana", "Niger", "Cameroon", "Other"].map((c) => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Password"><input type="password" className={inputCls} value={acc.password} onChange={(e) => setAcc({ ...acc, password: e.target.value })} /></Field>
            <Field label="Confirm password"><input type="password" className={inputCls} value={acc.confirm} onChange={(e) => setAcc({ ...acc, confirm: e.target.value })} /></Field>
          </div>
          <label className="mt-3 flex items-start gap-2 text-sm">
            <input type="checkbox" className="mt-1" checked={acc.terms} onChange={(e) => setAcc({ ...acc, terms: e.target.checked })} />
            I agree to the Beldium Terms of Service and Privacy Policy.
          </label>
          {nav(false, "Create account", () => {
            if (!acc.firstName.trim() || !acc.lastName.trim()) return void toast.error("Enter your first and last name.");
            if (!/^\S+@\S+\.\S+$/.test(acc.email)) return void toast.error("Enter a valid work email.");
            if (acc.phone.replace(/\D/g, "").length < 8) return void toast.error("Enter a valid phone number.");
            if (acc.password.length < 8) return void toast.error("Password must be at least 8 characters.");
            if (acc.password !== acc.confirm) return void toast.error("Passwords do not match.");
            if (!acc.terms) return void toast.error("Accept the terms and privacy policy.");
            const { confirm: _c, terms: _t, ...rest } = acc;
            setState({ account: { ...rest, participantType: s.account?.participantType ?? "", emailVerified: false, phoneVerified: false } });
            toast.success(`Demo verification code sent to ${acc.email}: 123456`);
            setCode("");
            next();
          })}
        </>
      )}

      {(step === "Verify email" || step === "Verify phone") && (
        <>
          <h2 className="beldium-title">{step}</h2>
          <p className="beldium-small mb-4">
            Enter the 6-digit code sent to {step === "Verify email" ? s.account?.email : s.account?.phone}. Demo code: 123456
          </p>
          <input className={cn(inputCls, "text-center tracking-[0.5em]")} maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} />
          {nav(code.length !== 6, "Verify", () => {
            if (code !== "123456") return void toast.error("Incorrect code.");
            setState({ account: { ...s.account!, ...(step === "Verify email" ? { emailVerified: true } : { phoneVerified: true }) } });
            if (step === "Verify email") toast.success(`Demo code sent to ${s.account?.phone}: 123456`);
            setCode("");
            next();
          })}
        </>
      )}

      {step === "Organisation" && (
        <>
          <h2 className="beldium-title mb-3">Register or join an organisation</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            <Choice active={!joining} onClick={() => setOrg({ mode: "register" })}>Register new logistics organisation</Choice>
            <Choice active={joining} onClick={() => setOrg({ mode: "join" })}>Join existing logistics organisation</Choice>
          </div>
          {joining ? (
            <div className="mt-4 space-y-3">
              <Field label="Search by name, Beldium ID or registration number">
                <input className={inputCls} value={search} onChange={(e) => setSearch(e.target.value)} />
              </Field>
              <div className="space-y-2">
                {existingOrganisations
                  .filter((o) => `${o.name} ${o.id} ${o.reg}`.toLowerCase().includes(search.toLowerCase()))
                  .map((o) => (
                    <Choice key={o.id} active={org.joinOrgId === o.id} onClick={() => setOrg({ joinOrgId: o.id, name: o.name, registrationNumber: o.reg })}>
                      <span className="block">{o.name}</span>
                      <span className="beldium-small">{o.id} · {o.reg}</span>
                    </Choice>
                  ))}
              </div>
              <Field label="Requested role">
                <select className={inputCls} value={org.requestedRole} onChange={(e) => setOrg({ requestedRole: e.target.value })}>
                  {roles.map((r) => <option key={r}>{r}</option>)}
                </select>
              </Field>
            </div>
          ) : (
            <Field label="Your role in the organisation" className="mt-4">
              <select className={inputCls} value={org.requestedRole} onChange={(e) => setOrg({ requestedRole: e.target.value })}>
                {roles.map((r) => <option key={r}>{r}</option>)}
              </select>
            </Field>
          )}
          {nav(joining && !org.joinOrgId, joining ? "Submit join request" : "Continue")}
        </>
      )}

      {step === "Organisation profile" && (
        <>
          <h2 className="beldium-title mb-3">Organisation profile</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {orgFields.map(([k, l]) => (
              <Field key={k} label={l}>
                <input className={inputCls} value={String(org[k] ?? "")} onChange={(e) => setOrg({ [k]: e.target.value })} />
              </Field>
            ))}
          </div>
          {nav(!org.name.trim() || !org.registrationNumber.trim())}
        </>
      )}

      {step === "Logistics capability" && (
        <>
          <h2 className="beldium-title mb-3">Logistics capability</h2>
          <p className="mb-2 text-xs font-medium">Services</p>
          <div className="mb-4 flex flex-wrap gap-2">
            {services.map((x) => {
              const on = cap.services.includes(x);
              return (
                <button key={x} type="button" onClick={() => setCap({ services: on ? cap.services.filter((y) => y !== x) : [...cap.services, x] })}
                  className={cn("rounded-full border px-3 py-1 text-xs", on ? "border-primary bg-primary text-primary-foreground" : "border-border")}>
                  {x}
                </button>
              );
            })}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {([
              ["operatingStates", "Operating states"],
              ["routesCovered", "Routes covered"],
              ["minerals", "Minerals handled"],
              ["vehicleCategories", "Vehicle categories"],
              ["fleetSize", "Fleet size"],
              ["maxCapacity", "Maximum transport capacity (t)"],
            ] as [keyof Capability, string][]).map(([k, l]) => (
              <Field key={k} label={l}><input className={inputCls} value={String(cap[k])} onChange={(e) => setCap({ [k]: e.target.value })} /></Field>
            ))}
          </div>
          <div className="mt-4 space-y-3">
            {([["tracking", "Tracking capability"], ["security", "Security capability"], ["sampleCustody", "Sample chain of custody capability"]] as [keyof Capability, string][]).map(([k, l]) => (
              <div key={k} className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm">{l}</span>
                <YesNo value={String(cap[k])} onChange={(v) => setCap({ [k]: v })} />
              </div>
            ))}
          </div>
          {nav(cap.services.length === 0)}
        </>
      )}

      {step === "Fleet" && <FleetStep vehicles={s.vehicles} />}
      {step === "Fleet" && nav(s.vehicles.length === 0 || s.vehicles.some((v) => !v.registration.trim()))}

      {step === "Drivers" && <DriversStep drivers={s.drivers} vehicles={s.vehicles} />}
      {step === "Drivers" && nav(s.drivers.length === 0 || s.drivers.some((d) => !d.name.trim() || !d.licenceNumber.trim()))}

      {step === "Documents" && <DocumentsStep docs={s.documents} vehicles={s.vehicles} drivers={s.drivers} orgName={org.name} />}
      {step === "Documents" && nav(s.documents.length === 0)}

      {step === "Compliance information" && (
        <>
          <h2 className="beldium-title mb-3">Compliance information</h2>
          <div className="divide-y divide-border">
            {complianceQuestions.map((q) => (
              <div key={q} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                <span className="text-sm">{q}</span>
                <YesNo value={s.compliance[q]} onChange={(v) => setState({ compliance: { ...s.compliance, [q]: v } })} />
              </div>
            ))}
          </div>
          {nav(complianceQuestions.some((q) => !s.compliance[q]))}
        </>
      )}

      {step === "Declaration" && (
        <>
          <h2 className="beldium-title mb-3">Declaration</h2>
          <div className="space-y-2">
            {declarations.map((d) => (
              <label key={d} className="flex items-start gap-2 rounded-lg border border-border p-3 text-sm">
                <input type="checkbox" className="mt-1" checked={s.declarations.includes(d)}
                  onChange={(e) => setState({ declarations: e.target.checked ? [...s.declarations, d] : s.declarations.filter((x) => x !== d) })} />
                {d}
              </label>
            ))}
          </div>
          {nav(s.declarations.length !== declarations.length)}
        </>
      )}

      {step === "Review" && (
        <>
          <h2 className="beldium-title mb-3">Review</h2>
          <div className="grid gap-3 text-sm sm:grid-cols-2">
            <Summary title="Account" lines={[`${s.account?.firstName} ${s.account?.lastName}`, s.account?.email ?? "", s.account?.participantType ?? ""]} />
            <Summary title="Organisation" lines={[joining ? `Joining ${org.name}` : org.name, org.registrationNumber, `Role: ${org.requestedRole}`]} />
            {!joining && (
              <>
                <Summary title="Capability" lines={[cap.services.join(", "), cap.operatingStates]} />
                <Summary title="Fleet & drivers" lines={[`${s.vehicles.length} vehicle(s)`, `${s.drivers.length} driver(s)`]} />
                <Summary title="Documents" lines={[`${s.documents.length} uploaded — not yet verified`]} />
                <Summary title="Compliance answers" lines={[`${Object.values(s.compliance).filter((v) => v === "Yes").length} of ${complianceQuestions.length} answered Yes`]} />
              </>
            )}
          </div>
          {nav(false, "Submit application", () => {
            submitApplication();
            setStep("Submitted");
          })}
        </>
      )}
    </AuthLayout>
  );
}

function Row({ k, v }: { k: string; v?: string | undefined }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-muted-foreground">{k}</dt>
      <dd className="beldium-mono font-semibold text-primary">{v}</dd>
    </div>
  );
}

function Summary({ title, lines }: { title: string; lines: string[] }) {
  return (
    <div className="rounded-lg border border-border p-3">
      <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">{title}</p>
      {lines.filter(Boolean).map((l) => <p key={l}>{l}</p>)}
    </div>
  );
}

const vehicleFields: [keyof VehicleRecord, string, string[]?][] = [
  ["registration", "Registration number"],
  ["type", "Vehicle type", ["Tipper", "Flatbed", "Tanker", "Container truck", "Pickup / Van", "Motorcycle courier"]],
  ["make", "Make"],
  ["model", "Model"],
  ["year", "Year"],
  ["capacity", "Capacity (t)"],
  ["ownership", "Ownership", ["Owned", "Leased", "Subcontracted"]],
  ["operatingStatus", "Operating status", ["Operational", "Under maintenance", "Out of service"]],
  ["trackerInstalled", "Tracker installed", ["Yes", "No"]],
  ["trackerId", "Tracker ID"],
  ["inspection", "Inspection status", ["Valid", "Due", "Expired"]],
  ["insurance", "Insurance status", ["Valid", "Expiring", "Expired"]],
  ["roadworthiness", "Roadworthiness status", ["Valid", "Due", "Expired"]],
  ["maintenance", "Maintenance status", ["Current", "Due", "Overdue"]],
];

function FleetStep({ vehicles }: { vehicles: VehicleRecord[] }) {
  const add = () =>
    setState({
      vehicles: [
        ...vehicles,
        Object.fromEntries([...vehicleFields.map(([k, , o]) => [k, o ? o[0] : ""]), ["id", uid("VEH")], ["reviewStatus", "Draft"]]) as VehicleRecord,
      ],
    });
  const upd = (id: string, p: Partial<VehicleRecord>) => setState({ vehicles: vehicles.map((v) => (v.id === id ? { ...v, ...p } : v)) });
  return (
    <>
      <h2 className="beldium-title">Fleet registration</h2>
      <p className="beldium-small mb-3">Each vehicle becomes the record reviewed in Vehicle Compliance Review.</p>
      <RepeatList items={vehicles} label="Vehicle" onAdd={add} onRemove={(id) => setState({ vehicles: vehicles.filter((v) => v.id !== id) })}
        render={(v) => vehicleFields.map(([k, l, o]) => (
          <Field key={k} label={l}>
            {o ? (
              <select className={inputCls} value={v[k]} onChange={(e) => upd(v.id, { [k]: e.target.value })}>{o.map((x) => <option key={x}>{x}</option>)}</select>
            ) : (
              <input className={inputCls} value={v[k]} onChange={(e) => upd(v.id, { [k]: e.target.value })} />
            )}
          </Field>
        ))} />
    </>
  );
}

function DriversStep({ drivers, vehicles }: { drivers: DriverRecord[]; vehicles: VehicleRecord[] }) {
  const f: [keyof DriverRecord, string, string?][] = [
    ["name", "Name"], ["phone", "Phone"], ["driverId", "Driver ID"], ["licenceNumber", "Licence number"],
    ["licenceClass", "Licence class"], ["issueDate", "Issue date", "date"], ["expiryDate", "Expiry date", "date"],
    ["training", "Training"],
  ];
  const add = () => setState({ drivers: [...drivers, {
    id: uid("DRV"), name: "", phone: "", driverId: "", licenceNumber: "", licenceClass: "E", issueDate: "", expiryDate: "",
    assignedVehicle: "", training: "", safetyStatus: "Cleared", reviewStatus: "Draft" }] });
  const upd = (id: string, p: Partial<DriverRecord>) => setState({ drivers: drivers.map((d) => (d.id === id ? { ...d, ...p } : d)) });
  return (
    <>
      <h2 className="beldium-title">Driver registration</h2>
      <p className="beldium-small mb-3">Each driver becomes the record reviewed in Driver Compliance Review.</p>
      <RepeatList items={drivers} label="Driver" onAdd={add} onRemove={(id) => setState({ drivers: drivers.filter((d) => d.id !== id) })}
        render={(d) => (
          <>
            {f.map(([k, l, t]) => (
              <Field key={k} label={l}><input type={t ?? "text"} className={inputCls} value={d[k]} onChange={(e) => upd(d.id, { [k]: e.target.value })} /></Field>
            ))}
            <Field label="Assigned vehicle">
              <select className={inputCls} value={d.assignedVehicle} onChange={(e) => upd(d.id, { assignedVehicle: e.target.value })}>
                <option value="">Unassigned</option>
                {vehicles.map((v) => <option key={v.id}>{v.registration || v.id}</option>)}
              </select>
            </Field>
            <Field label="Safety status">
              <select className={inputCls} value={d.safetyStatus} onChange={(e) => upd(d.id, { safetyStatus: e.target.value })}>
                {["Cleared", "Pending training", "Restricted"].map((x) => <option key={x}>{x}</option>)}
              </select>
            </Field>
          </>
        )} />
    </>
  );
}

function RepeatList<T extends { id: string }>({ items, label, onAdd, onRemove, render }: {
  items: T[]; label: string; onAdd: () => void; onRemove: (id: string) => void; render: (t: T) => React.ReactNode;
}) {
  return (
    <div className="space-y-4">
      {items.map((it, i) => (
        <div key={it.id} className="rounded-lg border border-border p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-semibold text-primary">{label} {i + 1}</span>
            <button type="button" onClick={() => onRemove(it.id)} className="text-destructive" aria-label={`Remove ${label}`}><Trash2 className="size-4" /></button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">{render(it)}</div>
        </div>
      ))}
      <button type="button" onClick={onAdd} className={cn(ghost, "flex w-full items-center justify-center gap-2")}>
        <Plus className="size-4" /> Add {label.toLowerCase()}
      </button>
    </div>
  );
}

function DocumentsStep({ docs, vehicles, drivers, orgName }: { docs: DocumentRecord[]; vehicles: VehicleRecord[]; drivers: DriverRecord[]; orgName: string }) {
  const [open, setOpen] = useState<string | null>(null);
  const [draft, setDraft] = useState({ number: "", issuingAuthority: "", issueDate: "", expiryDate: "", related: "", fileName: "" });
  return (
    <>
      <h2 className="beldium-title">Documents</h2>
      <p className="beldium-small mb-3">
        Matches the evidence required by Beldium Logistics Compliance. Uploading a document does not verify it — every upload is reviewed.
      </p>
      <div className="space-y-4">
        {documentGroups.map((g) => {
          const relatedOpts = g.related === "Vehicle" ? vehicles.map((v) => v.registration || v.id)
            : g.related === "Driver" ? drivers.map((d) => d.name || d.id) : [orgName || "Organisation"];
          return (
            <div key={g.group} className="rounded-lg border border-border">
              <p className="border-b border-border bg-light-secondary px-4 py-2 text-sm font-semibold text-primary">{g.group}</p>
              <ul className="divide-y divide-border">
                {g.items.map((item) => {
                  const key = `${g.group}:${item}`;
                  const uploaded = docs.filter((d) => d.group === g.group && d.type === item);
                  return (
                    <li key={item} className="px-4 py-2.5 text-sm">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span>{item}</span>
                        <div className="flex items-center gap-2">
                          {uploaded.map((u) => <StatusBadge key={u.id} value={`${u.status} · ${u.related}`} />)}
                          <button type="button" className="text-xs font-semibold text-colorLink"
                            onClick={() => { setOpen(open === key ? null : key); setDraft({ number: "", issuingAuthority: "", issueDate: "", expiryDate: "", related: relatedOpts[0] ?? "", fileName: "" }); }}>
                            Upload
                          </button>
                        </div>
                      </div>
                      {open === key && (
                        <div className="mt-3 grid gap-3 rounded-lg bg-muted p-3 sm:grid-cols-2">
                          <Field label="Document number"><input className={inputCls} value={draft.number} onChange={(e) => setDraft({ ...draft, number: e.target.value })} /></Field>
                          <Field label="Issuing authority"><input className={inputCls} value={draft.issuingAuthority} onChange={(e) => setDraft({ ...draft, issuingAuthority: e.target.value })} /></Field>
                          <Field label="Issue date"><input type="date" className={inputCls} value={draft.issueDate} onChange={(e) => setDraft({ ...draft, issueDate: e.target.value })} /></Field>
                          <Field label="Expiry date"><input type="date" className={inputCls} value={draft.expiryDate} onChange={(e) => setDraft({ ...draft, expiryDate: e.target.value })} /></Field>
                          <Field label={`Related ${g.related.toLowerCase()}`}>
                            <select className={inputCls} value={draft.related} onChange={(e) => setDraft({ ...draft, related: e.target.value })}>
                              {relatedOpts.map((o) => <option key={o}>{o}</option>)}
                            </select>
                          </Field>
                          <Field label="File"><input type="file" className="text-xs" onChange={(e) => setDraft({ ...draft, fileName: e.target.files?.[0]?.name ?? "" })} /></Field>
                          <button type="button" className={cn(btn, "sm:col-span-2")} disabled={!draft.fileName || !draft.number}
                            onClick={() => {
                              setState({ documents: [...docs, { id: uid("DOC"), group: g.group, type: item, status: "Uploaded", ...draft }] });
                              setOpen(null);
                            }}>
                            Save document
                          </button>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
    </>
  );
}
