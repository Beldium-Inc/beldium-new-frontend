import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Check, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { z } from "zod";

import { BeldiumLockup } from "@/components/beldium-logo";
import { StatusBadge } from "@/components/beldium/status-badge";
import { StatusChip } from "@/components/status-chip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { ApiError } from "@/lib/api/errors";
import {
  missingFiles,
  pendingDocumentFiles,
  submitOperatorApplication,
} from "@/lib/api/onboarding";
import { useAuth } from "@/lib/auth";
import {
  complianceQuestions,
  declarations,
  documentGroups,
  emptyCapability,
  emptyOrganisation,
  getState,
  participantTypes,
  requiredDomains,
  resetState,
  roles,
  services,
  setState,
  uid,
  useDraft,
  type Capability,
  type DocumentRecord,
  type DriverRecord,
  type Organisation,
  type VehicleRecord,
} from "@/lib/onboarding-store";
import { cn } from "@/lib/utils";
import { isEditable, useWorkspace } from "@/lib/workspace";

const title = "Operator application - Beldium Logistics Hub";
const description =
  "Seven-step logistics operator application: organisation, capability, fleet, drivers, documents, compliance and declaration.";

const searchSchema = z.object({
  organisationName: z.string().optional(),
  operatorType: z.string().optional(),
});

export const Route = createFileRoute("/application")({
  ssr: false,
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ApplicationPage,
});

const STEPS = [
  { id: 1, title: "Organisation profile", blurb: "Legal identity, registration and contacts." },
  { id: 2, title: "Logistics capability", blurb: "Services, coverage, capacity and custody." },
  { id: 3, title: "Fleet", blurb: "Every vehicle, with insurance and roadworthiness." },
  { id: 4, title: "Drivers", blurb: "Licences, medicals and assignments." },
  { id: 5, title: "Documents", blurb: "Evidence for organisation, fleet and drivers." },
  { id: 6, title: "Compliance information", blurb: "Tracking, safety and custody practices." },
  { id: 7, title: "Declaration & review", blurb: "Confirm and submit for review." },
] as const;
const LAST = STEPS.length;

const selectCls =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring md:text-sm";

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function Choice({
  value,
  options,
  onChange,
}: {
  value: string;
  options: readonly string[];
  onChange: (v: string) => void;
}) {
  return (
    <select className={selectCls} value={value} onChange={(e) => onChange(e.target.value)}>
      {options.map((o) => (
        <option key={o}>{o}</option>
      ))}
    </select>
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
            "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
            value === o
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border hover:border-primary/40",
          )}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

const today = () => new Date().toISOString().slice(0, 10);

/** The API's incompleteness error carries which domains are missing; name them. */
function submissionError(error: ApiError) {
  const details = error.details as {
    missing_sections?: string[];
    missing_document_domains?: string[];
  } | null;
  const parts = [
    details?.missing_sections?.length ? `sections: ${details.missing_sections.join(", ")}` : "",
    details?.missing_document_domains?.length
      ? `documents: ${details.missing_document_domains.join(", ")}`
      : "",
  ].filter(Boolean);
  return parts.length ? `${error.message} Missing ${parts.join("; ")}.` : error.message;
}

function ApplicationPage() {
  const { status, user } = useAuth();
  const workspace = useWorkspace();
  const s = useDraft();
  const { organisationName, operatorType } = Route.useSearch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const step = s.wizard?.current ?? 1;
  const completed = s.wizard?.completed ?? [];
  const org = s.organisation ?? emptyOrganisation;
  const cap = s.capability ?? emptyCapability;

  useEffect(() => {
    if (!user) return;
    // A draft left by another account on this browser is not this user's.
    if (getState().owner !== user.email) resetState(user.email);
    // Pre-fill once from what was captured at signup.
    if (organisationName && !getState().organisation?.name) {
      setState({ organisation: { ...emptyOrganisation, name: organisationName } });
    }
    if (operatorType && !getState().capability) {
      setState({ capability: { ...emptyCapability, participantType: operatorType } });
    }
  }, [user, organisationName, operatorType]);

  if (status === "loading" || workspace.loading) {
    return <div className="p-10 text-sm text-muted-foreground">Loading your application…</div>;
  }

  if (status === "unauthenticated") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6">
        <div className="max-w-sm text-center">
          <h1 className="text-lg font-semibold text-foreground">Sign in to continue</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Verify your account before starting the operator application.
          </p>
          <Button asChild className="mt-5 w-full">
            <Link to="/auth">Go to sign in</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (workspace.pendingJoin || (workspace.record && !isEditable(workspace.record.stage))) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6">
        <div className="max-w-sm text-center">
          <h1 className="text-lg font-semibold text-foreground">
            {workspace.pendingJoin ? "Join request pending" : "Application already submitted"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Track its review from your workspace.
          </p>
          <Button asChild className="mt-5 w-full">
            <Link to="/portal">Go to workspace</Link>
          </Button>
        </div>
      </div>
    );
  }

  const goto = (n: number) =>
    setState((st) => {
      const current = st.wizard?.current ?? 1;
      const done = st.wizard?.completed ?? [];
      return {
        wizard: {
          current: n,
          completed: n > current ? Array.from(new Set([...done, current])) : done,
        },
      };
    });

  function validate(): string {
    switch (step) {
      case 1:
        if (!org.name.trim() || !org.registrationNumber.trim())
          return "Enter the organisation name and registration number.";
        if (!org.registeredAddress.trim() || !org.state.trim())
          return "Enter the registered address and state.";
        return "";
      case 2:
        return cap.services.length === 0 ? "Choose at least one service." : "";
      case 3:
        if (s.vehicles.length === 0) return "Add at least one vehicle.";
        if (
          s.vehicles.some(
            (v) =>
              !v.registration.trim() ||
              !v.vin.trim() ||
              !v.year ||
              !v.insuranceExpiry ||
              !v.roadworthinessExpiry,
          )
        ) {
          return "Every vehicle needs a registration, VIN, year, insurance expiry and roadworthiness expiry.";
        }
        return "";
      case 4:
        if (s.drivers.length === 0) return "Add at least one driver.";
        if (
          s.drivers.some(
            (d) => !d.name.trim() || !d.licenceNumber.trim() || !d.expiryDate || !d.medicalExpiry,
          )
        ) {
          return "Every driver needs a name, licence number, licence expiry and medical expiry.";
        }
        return "";
      case 5: {
        const have = new Set(s.documents.map((d) => d.domain));
        const missing = documentGroups.filter(
          (g) => requiredDomains(cap.services).includes(g.domain) && !have.has(g.domain),
        );
        if (missing.length)
          return `Upload at least one document for: ${missing.map((g) => g.group).join(", ")}.`;
        const lost = missingFiles(s);
        return lost.length ? `Re-attach the file for: ${lost.map((d) => d.type).join(", ")}.` : "";
      }
      case 6:
        return complianceQuestions.some((q) => !s.compliance[q])
          ? "Answer every compliance question."
          : "";
      case 7:
        return s.declarations.length !== declarations.length
          ? "Confirm every declaration to submit."
          : "";
      default:
        return "";
    }
  }

  async function submit() {
    if (!user) return;
    setSubmitting(true);
    try {
      await submitOperatorApplication(user);
      await queryClient.invalidateQueries();
      resetState(user.email);
      navigate({ to: "/submitted" });
    } catch (cause) {
      setError(
        cause instanceof ApiError
          ? submissionError(cause)
          : cause instanceof Error
            ? cause.message
            : "Could not submit the application. Your draft is saved; try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  function next() {
    const problem = validate();
    if (problem) return setError(problem);
    setError("");
    if (step === LAST) return void submit();
    goto(step + 1);
  }

  const pct = Math.round(((step - 1) / LAST) * 100);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6">
          <Link to="/">
            <BeldiumLockup />
          </Link>
          <div className="flex items-center gap-3">
            <StatusChip tone="info">Draft saved locally</StatusChip>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/portal">Save &amp; exit</Link>
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-6xl gap-8 px-6 py-10 lg:grid-cols-[260px_1fr]">
        <aside className="space-y-4">
          <div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                Step {step} of {LAST}
              </span>
              <span>{pct}%</span>
            </div>
            <Progress value={pct} className="mt-2" />
          </div>
          <ol className="space-y-1">
            {STEPS.map((st) => {
              const done = completed.includes(st.id);
              const active = st.id === step;
              return (
                <li key={st.id}>
                  <button
                    type="button"
                    onClick={() => goto(st.id)}
                    className={cn(
                      "flex w-full items-start gap-3 rounded-2xl border px-3 py-2.5 text-left text-sm transition-colors",
                      active
                        ? "border-primary bg-primary/5 text-foreground"
                        : "border-transparent text-muted-foreground hover:bg-muted",
                    )}
                  >
                    <span
                      className={cn(
                        "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[11px]",
                        done
                          ? "border-success bg-success text-success-foreground"
                          : active
                            ? "border-primary text-primary"
                            : "border-border",
                      )}
                    >
                      {done ? <Check className="h-3 w-3" /> : st.id}
                    </span>
                    <span>
                      <span className="block font-medium">{st.title}</span>
                      <span className="block text-xs opacity-80">{st.blurb}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </aside>

        <main
          className="min-w-0 rounded-md border border-border bg-card p-6"
          style={{ boxShadow: "var(--shadow-panel)" }}
        >
          <h1 className="text-xl font-semibold tracking-tight text-card-foreground">
            {STEPS[step - 1]?.title}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{STEPS[step - 1]?.blurb}</p>

          <div className="mt-6">
            {step === 1 ? <StepOrganisation org={org} /> : null}
            {step === 2 ? <StepCapability cap={cap} /> : null}
            {step === 3 ? <StepFleet vehicles={s.vehicles} /> : null}
            {step === 4 ? <StepDrivers drivers={s.drivers} vehicles={s.vehicles} /> : null}
            {step === 5 ? (
              <StepDocuments
                docs={s.documents}
                vehicles={s.vehicles}
                drivers={s.drivers}
                orgName={org.name}
                servicesChosen={cap.services}
              />
            ) : null}
            {step === 6 ? <StepCompliance answers={s.compliance} /> : null}
            {step === 7 ? <StepDeclaration /> : null}
          </div>

          {error ? <p className="mt-5 text-sm text-destructive">{error}</p> : null}

          <div className="mt-8 flex items-center justify-between border-t border-border pt-5">
            <Button
              variant="outline"
              disabled={step === 1 || submitting}
              onClick={() => goto(step - 1)}
            >
              Back
            </Button>
            <Button onClick={next} disabled={submitting}>
              {submitting
                ? "Submitting…"
                : step === LAST
                  ? "Submit application"
                  : "Save & continue"}
            </Button>
          </div>
        </main>
      </div>
    </div>
  );
}

// --- steps -----------------------------------------------------------------

function StepOrganisation({ org }: { org: Organisation }) {
  const set = (k: keyof Organisation) => (v: string) =>
    setState({ organisation: { ...org, [k]: v } });
  const text: [keyof Organisation, string, string?][] = [
    ["name", "Organisation legal name", "As on your CAC certificate"],
    ["registrationNumber", "CAC / registration number", "RC 1482231"],
    ["tin", "Tax identification number"],
    ["yearEstablished", "Year established", "2014"],
    ["registeredAddress", "Registered address"],
    ["operatingAddress", "Operating address"],
    ["state", "State", "Kaduna"],
    ["lga", "LGA"],
    ["email", "Company email"],
    ["phone", "Company phone", "08012345678"],
    ["website", "Website"],
    ["primaryContact", "Primary contact"],
    ["employees", "Number of employees"],
  ];
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      {text.map(([k, label, placeholder]) => (
        <Field key={k} label={label}>
          <Input
            value={String(org[k] ?? "")}
            placeholder={placeholder}
            onChange={(e) => set(k)(e.target.value)}
          />
        </Field>
      ))}
      <Field label="Organisation type">
        <Choice
          value={org.orgType}
          options={[
            "Limited Liability Company",
            "Public Company",
            "Partnership",
            "Sole Proprietor",
            "Cooperative",
          ]}
          onChange={set("orgType")}
        />
      </Field>
      <Field label="Your role in the organisation">
        <Choice value={org.requestedRole} options={roles} onChange={set("requestedRole")} />
      </Field>
    </div>
  );
}

function StepCapability({ cap }: { cap: Capability }) {
  const set = (p: Partial<Capability>) => setState({ capability: { ...cap, ...p } });
  return (
    <div className="space-y-6">
      <Field label="Operator type">
        <Choice
          value={cap.participantType}
          options={participantTypes}
          onChange={(v) => set({ participantType: v })}
        />
      </Field>
      <div className="space-y-2">
        <Label>Services</Label>
        <div className="flex flex-wrap gap-2">
          {services.map((x) => {
            const on = cap.services.includes(x);
            return (
              <button
                key={x}
                type="button"
                onClick={() =>
                  set({ services: on ? cap.services.filter((y) => y !== x) : [...cap.services, x] })
                }
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                  on
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border hover:border-primary/40",
                )}
              >
                {x}
              </button>
            );
          })}
        </div>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        {(
          [
            ["operatingStates", "Operating states"],
            ["routesCovered", "Routes covered"],
            ["minerals", "Minerals handled"],
            ["vehicleCategories", "Vehicle categories"],
            ["fleetSize", "Fleet size"],
            ["maxCapacity", "Annual tonnage capacity (t)"],
          ] as [keyof Capability, string][]
        ).map(([k, label]) => (
          <Field key={k} label={label}>
            <Input value={String(cap[k])} onChange={(e) => set({ [k]: e.target.value })} />
          </Field>
        ))}
      </div>
      <div className="divide-y divide-border rounded-md border border-border">
        {(
          [
            ["tracking", "Tracking capability"],
            ["security", "Security capability"],
            ["sampleCustody", "Sample chain of custody capability"],
          ] as [keyof Capability, string][]
        ).map(([k, label]) => (
          <div key={k} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
            <span className="text-sm">{label}</span>
            <YesNo value={String(cap[k])} onChange={(v) => set({ [k]: v })} />
          </div>
        ))}
      </div>
    </div>
  );
}

const vehicleFields: [keyof VehicleRecord, string, (readonly string[] | "date")?][] = [
  ["registration", "Registration number"],
  ["vin", "VIN / chassis number"],
  [
    "type",
    "Vehicle type",
    ["Tipper", "Flatbed", "Tanker", "Container truck", "Pickup / Van", "Motorcycle courier"],
  ],
  ["make", "Make"],
  ["model", "Model"],
  ["year", "Year"],
  ["capacity", "Capacity (t)"],
  ["ownership", "Ownership", ["Owned", "Leased", "Subcontracted"]],
  ["operatingStatus", "Operating status", ["Operational", "Under maintenance", "Out of service"]],
  ["trackerInstalled", "Tracker installed", ["Yes", "No"]],
  ["trackerId", "Tracker ID"],
  ["insurer", "Insurer"],
  ["insuranceExpiry", "Insurance expiry", "date"],
  ["roadworthinessExpiry", "Roadworthiness expiry", "date"],
];

function StepFleet({ vehicles }: { vehicles: VehicleRecord[] }) {
  const add = () =>
    setState({
      vehicles: [
        ...vehicles,
        Object.fromEntries([
          ...vehicleFields.map(([k, , o]) => [k, Array.isArray(o) ? o[0] : ""]),
          ["id", uid("VEH")],
        ]) as VehicleRecord,
      ],
    });
  const upd = (id: string, p: Partial<VehicleRecord>) =>
    setState({ vehicles: vehicles.map((v) => (v.id === id ? { ...v, ...p } : v)) });
  return (
    <RepeatList
      items={vehicles}
      label="Vehicle"
      onAdd={add}
      onRemove={(id) => setState({ vehicles: vehicles.filter((v) => v.id !== id) })}
      render={(v) =>
        vehicleFields.map(([k, label, o]) => (
          <Field key={k} label={label}>
            {Array.isArray(o) ? (
              <Choice value={v[k]} options={o} onChange={(val) => upd(v.id, { [k]: val })} />
            ) : (
              <Input
                type={o === "date" ? "date" : "text"}
                value={v[k]}
                onChange={(e) => upd(v.id, { [k]: e.target.value })}
              />
            )}
          </Field>
        ))
      }
    />
  );
}

function StepDrivers({
  drivers,
  vehicles,
}: {
  drivers: DriverRecord[];
  vehicles: VehicleRecord[];
}) {
  const fields: [keyof DriverRecord, string, string?][] = [
    ["name", "Full name"],
    ["phone", "Phone"],
    ["nationalId", "National ID (NIN)"],
    ["licenceNumber", "Licence number"],
    ["licenceClass", "Licence class"],
    ["expiryDate", "Licence expiry date", "date"],
    ["medicalExpiry", "Medical fitness expiry", "date"],
    ["yearsExperience", "Years of experience"],
    ["training", "Training (comma separated)"],
  ];
  const add = () =>
    setState({
      drivers: [
        ...drivers,
        {
          id: uid("DRV"),
          name: "",
          phone: "",
          nationalId: "",
          licenceNumber: "",
          licenceClass: "E",
          expiryDate: "",
          medicalExpiry: "",
          yearsExperience: "",
          assignedVehicle: "",
          training: "",
          safetyStatus: "Cleared",
        },
      ],
    });
  const upd = (id: string, p: Partial<DriverRecord>) =>
    setState({ drivers: drivers.map((d) => (d.id === id ? { ...d, ...p } : d)) });
  return (
    <RepeatList
      items={drivers}
      label="Driver"
      onAdd={add}
      onRemove={(id) => setState({ drivers: drivers.filter((d) => d.id !== id) })}
      render={(d) => (
        <>
          {fields.map(([k, label, type]) => (
            <Field key={k} label={label}>
              <Input
                type={type ?? "text"}
                value={d[k]}
                onChange={(e) => upd(d.id, { [k]: e.target.value })}
              />
            </Field>
          ))}
          <Field label="Assigned vehicle">
            <select
              className={selectCls}
              value={d.assignedVehicle}
              onChange={(e) => upd(d.id, { assignedVehicle: e.target.value })}
            >
              <option value="">Unassigned</option>
              {vehicles.map((v) => (
                <option key={v.id}>{v.registration || v.id}</option>
              ))}
            </select>
          </Field>
          <Field label="Safety status">
            <Choice
              value={d.safetyStatus}
              options={["Cleared", "Pending training", "Restricted"]}
              onChange={(v) => upd(d.id, { safetyStatus: v })}
            />
          </Field>
        </>
      )}
    />
  );
}

function RepeatList<T extends { id: string }>({
  items,
  label,
  onAdd,
  onRemove,
  render,
}: {
  items: T[];
  label: string;
  onAdd: () => void;
  onRemove: (id: string) => void;
  render: (t: T) => React.ReactNode;
}) {
  return (
    <div className="space-y-4">
      {items.map((it, i) => (
        <div key={it.id} className="rounded-md border border-border p-4">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm font-medium text-card-foreground">
              {label} {i + 1}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onRemove(it.id)}
              aria-label={`Remove ${label.toLowerCase()} ${i + 1}`}
            >
              <Trash2 className="text-destructive" />
            </Button>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">{render(it)}</div>
        </div>
      ))}
      <Button variant="outline" className="w-full" onClick={onAdd}>
        <Plus /> Add {label.toLowerCase()}
      </Button>
    </div>
  );
}

function StepDocuments({
  docs,
  vehicles,
  drivers,
  orgName,
  servicesChosen,
}: {
  docs: DocumentRecord[];
  vehicles: VehicleRecord[];
  drivers: DriverRecord[];
  orgName: string;
  servicesChosen: string[];
}) {
  const required = requiredDomains(servicesChosen);
  const [, force] = useState(0);
  const blank = {
    number: "",
    issuingAuthority: "",
    issueDate: "",
    expiryDate: "",
    related: "",
    fileName: "",
  };
  const [open, setOpen] = useState<string | null>(null);
  const [draft, setDraft] = useState(blank);
  const [file, setFile] = useState<File | null>(null);

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Each section needs at least one current document. Uploading does not verify a document:
        Beldium Logistics Compliance reviews every upload. Files are sent when you submit, so keep
        this tab open until then.
      </p>
      {documentGroups
        .filter((g) => required.includes(g.domain))
        .map((g) => {
          const covered = docs.some((d) => d.domain === g.domain);
          const relatedOpts =
            g.related === "Vehicle"
              ? vehicles.map((v) => v.registration || v.id)
              : g.related === "Driver"
                ? drivers.map((d) => d.name || d.id)
                : [orgName || "Organisation"];
          return (
            <div key={g.group} className="overflow-hidden rounded-md border border-border">
              <div className="flex items-center justify-between border-b border-border bg-muted px-4 py-2 text-sm font-medium text-foreground">
                {g.group}
                <StatusBadge
                  value={covered ? "Provided" : "Required"}
                  tone={covered ? "success" : "warning"}
                />
              </div>
              <ul className="divide-y divide-border">
                {g.items.map((item) => {
                  const key = `${g.group}:${item}`;
                  const uploaded = docs.filter((d) => d.group === g.group && d.type === item);
                  return (
                    <li key={item} className="px-4 py-2.5 text-sm">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span>{item}</span>
                        <div className="flex flex-wrap items-center gap-2">
                          {uploaded.map((u) => {
                            const sent = Boolean(getState().server.documents[u.id]);
                            const ready = sent || pendingDocumentFiles.has(u.id);
                            return (
                              <span key={u.id} className="inline-flex items-center gap-1">
                                <StatusBadge
                                  value={
                                    sent
                                      ? `Uploaded · ${u.related}`
                                      : ready
                                        ? `${u.fileName} · ${u.related}`
                                        : "File missing"
                                  }
                                  tone={sent ? "success" : ready ? "primary" : "danger"}
                                />
                                {!ready ? (
                                  <label className="cursor-pointer text-xs font-medium text-primary hover:underline">
                                    Re-attach
                                    <input
                                      type="file"
                                      className="hidden"
                                      onChange={(e) => {
                                        const f = e.target.files?.[0];
                                        if (!f) return;
                                        pendingDocumentFiles.set(u.id, f);
                                        setState({
                                          documents: docs.map((d) =>
                                            d.id === u.id ? { ...d, fileName: f.name } : d,
                                          ),
                                        });
                                        force((n) => n + 1);
                                      }}
                                    />
                                  </label>
                                ) : null}
                                {sent ? null : (
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    aria-label={`Remove ${u.type}`}
                                    onClick={() => {
                                      pendingDocumentFiles.delete(u.id);
                                      setState({ documents: docs.filter((d) => d.id !== u.id) });
                                    }}
                                  >
                                    <Trash2 className="text-destructive" />
                                  </Button>
                                )}
                              </span>
                            );
                          })}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setOpen(open === key ? null : key);
                              setDraft({ ...blank, related: relatedOpts[0] ?? "" });
                              setFile(null);
                            }}
                          >
                            Upload
                          </Button>
                        </div>
                      </div>
                      {open === key ? (
                        <div className="mt-3 grid gap-4 rounded-md bg-muted p-4 sm:grid-cols-2">
                          <Field label="Document number">
                            <Input
                              value={draft.number}
                              onChange={(e) => setDraft({ ...draft, number: e.target.value })}
                            />
                          </Field>
                          <Field label="Issuing authority">
                            <Input
                              value={draft.issuingAuthority}
                              onChange={(e) =>
                                setDraft({ ...draft, issuingAuthority: e.target.value })
                              }
                            />
                          </Field>
                          <Field label="Issue date">
                            <Input
                              type="date"
                              max={today()}
                              value={draft.issueDate}
                              onChange={(e) => setDraft({ ...draft, issueDate: e.target.value })}
                            />
                          </Field>
                          <Field label="Expiry date">
                            <Input
                              type="date"
                              value={draft.expiryDate}
                              onChange={(e) => setDraft({ ...draft, expiryDate: e.target.value })}
                            />
                          </Field>
                          <Field label={`Related ${g.related.toLowerCase()}`}>
                            <Choice
                              value={draft.related}
                              options={relatedOpts}
                              onChange={(v) => setDraft({ ...draft, related: v })}
                            />
                          </Field>
                          <Field label="File">
                            <input
                              type="file"
                              className="block text-sm text-muted-foreground file:mr-3 file:rounded-full file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-secondary-foreground"
                              onChange={(e) => {
                                const f = e.target.files?.[0] ?? null;
                                setFile(f);
                                setDraft({ ...draft, fileName: f?.name ?? "" });
                              }}
                            />
                          </Field>
                          <Button
                            className="sm:col-span-2"
                            disabled={!file || !draft.number}
                            onClick={() => {
                              const id = uid("DOC");
                              if (file) pendingDocumentFiles.set(id, file);
                              setState({
                                documents: [
                                  ...docs,
                                  { id, group: g.group, domain: g.domain, type: item, ...draft },
                                ],
                              });
                              setOpen(null);
                            }}
                          >
                            Save document
                          </Button>
                        </div>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
    </div>
  );
}

function StepCompliance({ answers }: { answers: Record<string, string> }) {
  return (
    <div className="divide-y divide-border rounded-md border border-border">
      {complianceQuestions.map((q) => (
        <div key={q} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
          <span className="text-sm">{q}</span>
          <YesNo
            value={answers[q]}
            onChange={(v) => setState({ compliance: { ...answers, [q]: v } })}
          />
        </div>
      ))}
    </div>
  );
}

function StepDeclaration() {
  const s = useDraft();
  const { user } = useAuth();
  const org = s.organisation ?? emptyOrganisation;
  const cap = s.capability ?? emptyCapability;
  const yes = Object.values(s.compliance).filter((v) => v === "Yes").length;
  const summary: [string, string[]][] = [
    [
      "Account",
      [
        user ? `${user.first_name} ${user.last_name}`.trim() : "",
        user?.email ?? "",
        cap.participantType,
      ],
    ],
    ["Organisation", [org.name, org.registrationNumber, `Role: ${org.requestedRole}`]],
    ["Capability", [cap.services.join(", "), cap.operatingStates]],
    ["Fleet & drivers", [`${s.vehicles.length} vehicle(s)`, `${s.drivers.length} driver(s)`]],
    ["Documents", [`${s.documents.length} uploaded, not yet verified`]],
    ["Compliance answers", [`${yes} of ${complianceQuestions.length} answered Yes`]],
  ];
  return (
    <div className="space-y-6">
      <div className="grid gap-3 text-sm sm:grid-cols-2">
        {summary.map(([heading, lines]) => (
          <div key={heading} className="rounded-md border border-border p-4">
            <div className="text-xs tracking-wide text-muted-foreground uppercase">{heading}</div>
            {lines.filter(Boolean).map((l) => (
              <p key={l} className="mt-1 text-foreground">
                {l}
              </p>
            ))}
          </div>
        ))}
      </div>
      <div className="space-y-2">
        {declarations.map((d) => (
          <label
            key={d}
            className="flex items-start gap-3 rounded-md border border-border p-3 text-sm"
          >
            <input
              type="checkbox"
              className="mt-0.5"
              checked={s.declarations.includes(d)}
              onChange={(e) =>
                setState({
                  declarations: e.target.checked
                    ? [...s.declarations, d]
                    : s.declarations.filter((x) => x !== d),
                })
              }
            />
            {d}
          </label>
        ))}
      </div>
    </div>
  );
}
