import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Check, Plus, Trash2, Upload } from "lucide-react";
import { useState } from "react";

import { BeldiumLockup } from "@/components/beldium-logo";
import { StatusChip } from "@/components/status-chip";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { APPLICATION_STEPS, type ApplicationEquipment, type ApplicationSite } from "@/lib/miner-data";
import { useMiner } from "@/lib/miner-store";
import { cn } from "@/lib/utils";

const title = "Mining organisation application — Beldium Miner Hub";
const description =
  "Eight-step mining organisation verification application: details, ownership, licences, sites, equipment, environment, documents and declaration.";

export const Route = createFileRoute("/application")({
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

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input type={type} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function ApplicationPage() {
  const { state, saveApplication, submitApplication } = useMiner();
  const navigate = useNavigate();
  const app = state.application;
  const [error, setError] = useState("");
  const step = app.currentStep;

  const goto = (n: number) =>
    saveApplication((d) => ({
      ...d,
      currentStep: n,
      completedSteps: n > d.currentStep ? Array.from(new Set([...d.completedSteps, d.currentStep])) : d.completedSteps,
    }));

  function validate(): string {
    if (step === 1 && (!app.org.legalName || !app.org.registrationNo)) return "Legal name and registration number are required.";
    if (step === 2 && (!app.contacts.primaryName || !app.contacts.primaryEmail)) return "Primary contact name and email are required.";
    if (step === 3 && (!app.licences.licenceNumber || !app.licences.issuingAuthority)) return "Licence number and issuing authority are required.";
    if (step === 4 && app.sites.length === 0) return "Add at least one mining site.";
    if (step === 5 && app.equipment.length === 0) return "Add at least one item of equipment or plant.";
    if (step === 6 && !app.environment.empNumber) return "An environmental management plan reference is required.";
    if (step === 7 && app.documents.some((d) => d.required && !d.fileName)) return "Upload all required documents.";
    if (step === 8) {
      const dec = app.declaration;
      if (!dec.signatory || !dec.position) return "Enter the signatory name and position.";
      if (!dec.accurate || !dec.authorised || !dec.consent) return "All three declarations must be accepted.";
    }
    return "";
  }

  function next() {
    const msg = validate();
    if (msg) {
      setError(msg);
      return;
    }
    setError("");
    if (step === 8) {
      submitApplication();
      navigate({ to: "/submitted" });
      return;
    }
    goto(step + 1);
  }

  const pct = Math.round(((step - 1) / 8) * 100);

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
              <Link to="/auth">Save &amp; exit</Link>
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-6xl gap-8 px-6 py-10 lg:grid-cols-[260px_1fr]">
        <aside className="space-y-4">
          <div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Step {step} of 8</span>
              <span>{pct}%</span>
            </div>
            <Progress value={pct} className="mt-2" />
          </div>
          <ol className="space-y-1">
            {APPLICATION_STEPS.map((s) => {
              const done = app.completedSteps.includes(s.id);
              const active = s.id === step;
              return (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => goto(s.id)}
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
                      {done ? <Check className="h-3 w-3" /> : s.id}
                    </span>
                    <span>
                      <span className="block font-medium">{s.title}</span>
                      <span className="block text-xs opacity-80">{s.blurb}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </aside>

        <main className="rounded-md border border-border bg-card p-6" style={{ boxShadow: "var(--shadow-panel)" }}>
          <h1 className="text-xl font-semibold tracking-tight text-card-foreground">
            {APPLICATION_STEPS[step - 1]?.title}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{APPLICATION_STEPS[step - 1]?.blurb}</p>

          <div className="mt-6">
            {step === 1 ? <StepOrg /> : null}
            {step === 2 ? <StepContacts /> : null}
            {step === 3 ? <StepLicences /> : null}
            {step === 4 ? <StepSites /> : null}
            {step === 5 ? <StepEquipment /> : null}
            {step === 6 ? <StepEnvironment /> : null}
            {step === 7 ? <StepDocuments /> : null}
            {step === 8 ? <StepDeclaration /> : null}
          </div>

          {error ? <p className="mt-5 text-sm text-destructive">{error}</p> : null}

          <div className="mt-8 flex items-center justify-between border-t border-border pt-5">
            <Button variant="outline" disabled={step === 1} onClick={() => goto(step - 1)}>
              Back
            </Button>
            <Button onClick={next}>{step === 8 ? "Submit application" : "Save & continue"}</Button>
          </div>
        </main>
      </div>
    </div>
  );
}

function StepOrg() {
  const { state, saveApplication } = useMiner();
  const org = state.application.org;
  const set = (k: keyof typeof org) => (v: string) =>
    saveApplication((d) => ({ ...d, org: { ...d.org, [k]: v } }));
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <Field label="Legal name" value={org.legalName} onChange={set("legalName")} placeholder="Zambezi Minerals Ltd" />
      <Field label="Trading name" value={org.tradingName} onChange={set("tradingName")} placeholder="Zambezi Minerals" />
      <Field label="Registration number" value={org.registrationNo} onChange={set("registrationNo")} placeholder="120180023456" />
      <Field label="Tax identification number" value={org.taxId} onChange={set("taxId")} placeholder="1002938475" />
      <div className="space-y-2">
        <Label>Entity type</Label>
        <Select value={org.entityType} onValueChange={set("entityType")}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {["Private company", "Public company", "Cooperative", "Partnership", "Sole proprietor"].map((o) => (
              <SelectItem key={o} value={o}>
                {o}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Field label="Date of incorporation" type="date" value={org.incorporatedOn} onChange={set("incorporatedOn")} />
      <Field label="Country of registration" value={org.country} onChange={set("country")} placeholder="Zambia" />
      <div className="space-y-2 sm:col-span-2">
        <Label>Registered address</Label>
        <Textarea value={org.address} onChange={(e) => set("address")(e.target.value)} placeholder="Plot 42, Industrial Way, Kitwe" />
      </div>
    </div>
  );
}

function StepContacts() {
  const { state, saveApplication } = useMiner();
  const c = state.application.contacts;
  const set = (k: keyof typeof c) => (v: string) =>
    saveApplication((d) => ({ ...d, contacts: { ...d.contacts, [k]: v } }));
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <Field label="Primary contact name" value={c.primaryName} onChange={set("primaryName")} />
      <Field label="Position" value={c.primaryRole} onChange={set("primaryRole")} placeholder="Managing director" />
      <Field label="Contact email" type="email" value={c.primaryEmail} onChange={set("primaryEmail")} />
      <Field label="Contact phone" value={c.primaryPhone} onChange={set("primaryPhone")} />
      <div className="space-y-2 sm:col-span-2">
        <Label>Beneficial owners (name, ID, % holding — one per line)</Label>
        <Textarea rows={4} value={c.beneficialOwners} onChange={(e) => set("beneficialOwners")(e.target.value)} />
      </div>
      <div className="space-y-2 sm:col-span-2">
        <Label>Ownership / control structure</Label>
        <Textarea rows={3} value={c.ownershipStructure} onChange={(e) => set("ownershipStructure")(e.target.value)} />
      </div>
    </div>
  );
}

function StepLicences() {
  const { state, saveApplication } = useMiner();
  const l = state.application.licences;
  const set = (k: keyof typeof l) => (v: string) =>
    saveApplication((d) => ({ ...d, licences: { ...d.licences, [k]: v } }));
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <Field label="Primary licence number" value={l.licenceNumber} onChange={set("licenceNumber")} placeholder="ML-2291-KN" />
      <div className="space-y-2">
        <Label>Licence type</Label>
        <Select value={l.licenceType} onValueChange={set("licenceType")}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {["Mining licence", "Exploration licence", "Artisanal mining permit", "Mineral processing licence"].map((o) => (
              <SelectItem key={o} value={o}>
                {o}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Field label="Issuing authority" value={l.issuingAuthority} onChange={set("issuingAuthority")} placeholder="Mines Department" />
      <Field label="Minerals covered" value={l.minerals} onChange={set("minerals")} placeholder="Copper, cobalt" />
      <Field label="Issued on" type="date" value={l.issuedOn} onChange={set("issuedOn")} />
      <Field label="Expires on" type="date" value={l.expiresOn} onChange={set("expiresOn")} />
    </div>
  );
}

function StepSites() {
  const { state, saveApplication } = useMiner();
  const sites = state.application.sites;
  const [draft, setDraft] = useState<ApplicationSite>({
    id: "",
    name: "",
    licenceNo: "",
    region: "",
    mineral: "",
    method: "Open pit",
    hectares: "",
    workforce: "",
    status: "Operating",
  });

  function add() {
    if (!draft.name || !draft.licenceNo) return;
    saveApplication((d) => ({
      ...d,
      sites: [...d.sites, { ...draft, id: `site-${Date.now()}` }],
    }));
    setDraft({ id: "", name: "", licenceNo: "", region: "", mineral: "", method: "Open pit", hectares: "", workforce: "", status: "Operating" });
  }

  return (
    <div className="space-y-6">
      {sites.length ? (
        <ul className="space-y-2">
          {sites.map((s) => (
            <li key={s.id} className="flex items-start justify-between gap-4 rounded-sm border border-border p-4">
              <div className="text-sm">
                <div className="font-medium text-card-foreground">{s.name}</div>
                <div className="text-muted-foreground">
                  {s.licenceNo} · {s.region || "—"} · {s.mineral || "—"} · {s.method} · {s.hectares || "—"} ha ·{" "}
                  {s.workforce || "—"} workers · {s.status}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => saveApplication((d) => ({ ...d, sites: d.sites.filter((x) => x.id !== s.id) }))}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-sm border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          No mining sites added yet. Add one entry per site covered by your licences.
        </p>
      )}

      <div className="rounded-sm border border-border bg-muted/40 p-4">
        <div className="text-sm font-medium text-foreground">Add a mining site</div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Site name" value={draft.name} onChange={(v) => setDraft({ ...draft, name: v })} />
          <Field label="Site licence number" value={draft.licenceNo} onChange={(v) => setDraft({ ...draft, licenceNo: v })} />
          <Field label="Region / province" value={draft.region} onChange={(v) => setDraft({ ...draft, region: v })} />
          <Field label="Primary mineral" value={draft.mineral} onChange={(v) => setDraft({ ...draft, mineral: v })} />
          <div className="space-y-2">
            <Label>Mining method</Label>
            <Select value={draft.method} onValueChange={(v) => setDraft({ ...draft, method: v as ApplicationSite["method"] })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["Open pit", "Underground", "Alluvial"].map((o) => (
                  <SelectItem key={o} value={o}>
                    {o}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Operating status</Label>
            <Select value={draft.status} onValueChange={(v) => setDraft({ ...draft, status: v as ApplicationSite["status"] })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["Operating", "Care & maintenance", "Development"].map((o) => (
                  <SelectItem key={o} value={o}>
                    {o}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Field label="Area (hectares)" value={draft.hectares} onChange={(v) => setDraft({ ...draft, hectares: v })} />
          <Field label="Workforce on site" value={draft.workforce} onChange={(v) => setDraft({ ...draft, workforce: v })} />
        </div>
        <Button className="mt-4" variant="secondary" onClick={add}>
          <Plus className="mr-1.5 h-4 w-4" /> Add site
        </Button>
      </div>
    </div>
  );
}

function StepEquipment() {
  const { state, saveApplication } = useMiner();
  const { equipment, sites } = state.application;
  const [draft, setDraft] = useState<ApplicationEquipment>({
    id: "",
    name: "",
    type: "",
    serial: "",
    siteId: "",
    year: "",
    condition: "Good",
  });

  function add() {
    if (!draft.name || !draft.serial) return;
    saveApplication((d) => ({ ...d, equipment: [...d.equipment, { ...draft, id: `eq-${Date.now()}` }] }));
    setDraft({ id: "", name: "", type: "", serial: "", siteId: "", year: "", condition: "Good" });
  }

  return (
    <div className="space-y-6">
      {equipment.length ? (
        <ul className="space-y-2">
          {equipment.map((e) => (
            <li key={e.id} className="flex items-start justify-between gap-4 rounded-sm border border-border p-4">
              <div className="text-sm">
                <div className="font-medium text-card-foreground">{e.name}</div>
                <div className="text-muted-foreground">
                  {e.type || "—"} · serial {e.serial} · {sites.find((s) => s.id === e.siteId)?.name ?? "Unassigned"} ·{" "}
                  {e.year || "—"} · {e.condition}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => saveApplication((d) => ({ ...d, equipment: d.equipment.filter((x) => x.id !== e.id) }))}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-sm border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          No equipment registered yet. Declare mobile fleet and fixed plant.
        </p>
      )}

      <div className="rounded-sm border border-border bg-muted/40 p-4">
        <div className="text-sm font-medium text-foreground">Add equipment or plant</div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Description" value={draft.name} onChange={(v) => setDraft({ ...draft, name: v })} />
          <Field label="Type" value={draft.type} onChange={(v) => setDraft({ ...draft, type: v })} placeholder="Excavator" />
          <Field label="Serial / asset number" value={draft.serial} onChange={(v) => setDraft({ ...draft, serial: v })} />
          <Field label="Year of manufacture" value={draft.year} onChange={(v) => setDraft({ ...draft, year: v })} />
          <div className="space-y-2">
            <Label>Assigned site</Label>
            <Select value={draft.siteId} onValueChange={(v) => setDraft({ ...draft, siteId: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Select a site" />
              </SelectTrigger>
              <SelectContent>
                {sites.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Condition</Label>
            <Select value={draft.condition} onValueChange={(v) => setDraft({ ...draft, condition: v as ApplicationEquipment["condition"] })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["Good", "Fair", "Needs service"].map((o) => (
                  <SelectItem key={o} value={o}>
                    {o}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button className="mt-4" variant="secondary" onClick={add}>
          <Plus className="mr-1.5 h-4 w-4" /> Add equipment
        </Button>
      </div>
    </div>
  );
}

function StepEnvironment() {
  const { state, saveApplication } = useMiner();
  const env = state.application.environment;
  const set = (k: keyof typeof env) => (v: string) =>
    saveApplication((d) => ({ ...d, environment: { ...d.environment, [k]: v } }));
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <Field label="Environmental management plan reference" value={env.empNumber} onChange={set("empNumber")} placeholder="EMP-2024-0912" />
      <Field label="Rehabilitation bond value" value={env.rehabBond} onChange={set("rehabBond")} placeholder="1,250,000" />
      <Field label="Water use permit number" value={env.waterUsePermit} onChange={set("waterUsePermit")} />
      <Field label="Reportable incidents (last 12 months)" value={env.incidentsLast12m} onChange={set("incidentsLast12m")} />
      <Field label="Appointed safety officer" value={env.safetyOfficer} onChange={set("safetyOfficer")} />
      <div className="space-y-2 sm:col-span-2">
        <Label>Environmental &amp; safety notes</Label>
        <Textarea rows={4} value={env.notes} onChange={(e) => set("notes")(e.target.value)} />
      </div>
    </div>
  );
}

function StepDocuments() {
  const { state, saveApplication } = useMiner();
  const docs = state.application.documents;
  return (
    <ul className="space-y-2">
      {docs.map((doc) => (
        <li key={doc.id} className="flex flex-wrap items-center justify-between gap-3 rounded-sm border border-border p-4">
          <div className="text-sm">
            <div className="font-medium text-card-foreground">
              {doc.label}{" "}
              {doc.required ? <span className="text-destructive">*</span> : <span className="text-muted-foreground">(optional)</span>}
            </div>
            <div className="text-muted-foreground">
              {doc.fileName ? `${doc.fileName} · uploaded ${doc.uploadedAt}` : "No file uploaded"}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {doc.fileName ? <StatusChip tone="success">Uploaded</StatusChip> : <StatusChip tone="warning">Missing</StatusChip>}
            <label className="inline-flex">
              <input
                type="file"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  saveApplication((d) => ({
                    ...d,
                    documents: d.documents.map((x) =>
                      x.id === doc.id
                        ? { ...x, fileName: file.name, uploadedAt: new Date().toISOString().slice(0, 10) }
                        : x,
                    ),
                  }));
                }}
              />
              <span className="inline-flex cursor-pointer items-center rounded-full border border-input bg-background px-3 py-1.5 text-sm hover:bg-muted">
                <Upload className="mr-1.5 h-3.5 w-3.5" /> {doc.fileName ? "Replace" : "Upload"}
              </span>
            </label>
          </div>
        </li>
      ))}
    </ul>
  );
}

function StepDeclaration() {
  const { state, saveApplication } = useMiner();
  const app = state.application;
  const dec = app.declaration;
  const setDec = (patch: Partial<typeof dec>) =>
    saveApplication((d) => ({ ...d, declaration: { ...d.declaration, ...patch } }));

  const summary: [string, string][] = [
    ["Legal name", app.org.legalName || "—"],
    ["Registration number", app.org.registrationNo || "—"],
    ["Entity type", app.org.entityType],
    ["Primary contact", app.contacts.primaryName || "—"],
    ["Primary licence", `${app.licences.licenceNumber || "—"} (${app.licences.licenceType})`],
    ["Mining sites", String(app.sites.length)],
    ["Equipment items", String(app.equipment.length)],
    ["EMP reference", app.environment.empNumber || "—"],
    ["Documents uploaded", `${app.documents.filter((d) => d.fileName).length} of ${app.documents.length}`],
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-sm border border-border">
        <div className="border-b border-border bg-muted/40 px-4 py-2.5 text-sm font-medium">Application summary</div>
        <dl className="divide-y divide-border">
          {summary.map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4 px-4 py-2.5 text-sm">
              <dt className="text-muted-foreground">{k}</dt>
              <dd className="text-right font-medium text-card-foreground">{v}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Signatory full name" value={dec.signatory} onChange={(v) => setDec({ signatory: v })} />
        <Field label="Position held" value={dec.position} onChange={(v) => setDec({ position: v })} />
      </div>

      <div className="space-y-3">
        {([
          ["accurate", "I declare that the information and documents provided are true, complete and accurate."],
          ["authorised", "I confirm I am authorised to submit this application on behalf of the organisation."],
          ["consent", "I consent to Beldium verifying these details with the relevant authorities."],
        ] as const).map(([key, text]) => (
          <label key={key} className="flex items-start gap-3 rounded-sm border border-border p-4 text-sm">
            <Checkbox
              checked={dec[key]}
              onCheckedChange={(v) => setDec({ [key]: Boolean(v) } as Partial<typeof dec>)}
            />
            <span className="text-card-foreground">{text}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
