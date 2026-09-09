import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  Check,
  ChevronRight,
  FileStack,
  Info,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { Panel, PanelHeader, PageHeader, Pill } from "@/verticals/processing/bpc";
import { useAppState } from "@/verticals/processing/store";
import { PROCESSING_TYPES, SECTIONS, type ProcessingType } from "@/verticals/processing/domain";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/processing/onboarding")({
  head: () => ({
    meta: [
      { title: "New application · Beldium Processing Compliance" },
      {
        name: "description",
        content:
          "Processor onboarding: select a processing type and see the conditional evidence requirements it triggers.",
      },
      { property: "og:title", content: "New application · Beldium Processing Compliance" },
      {
        property: "og:description",
        content: "Processor onboarding with conditional requirement surfacing by processing type.",
      },
    ],
  }),
  component: OnboardingPage,
});

const BASE_REQUIREMENTS = [
  "CAC Certificate of Incorporation and current Status Report",
  "FIRS Tax Identification Number (TIN) and Tax Clearance Certificate",
  "Mineral Processing Licence or equivalent authorisation",
  "Certificate of Occupancy or registered lease for the site",
  "Site layout and process flow drawing",
  "Environmental Management Plan",
  "HSE policy, PPE register and emergency response plan",
  "Equipment asset register and calibration certificates",
  "Standard operating procedures and batch traceability method",
  "Waste stream register and licensed handler contract",
];

function OnboardingPage() {
  const { startApplication } = useAppState();
  const [step, setStep] = React.useState(0);
  const [creating, setCreating] = React.useState(false);
  const [created, setCreated] = React.useState<string | null>(null);
  const [failure, setFailure] = React.useState<string | null>(null);
  const [type, setType] = React.useState<ProcessingType | null>(null);
  const [form, setForm] = React.useState({
    company: "",
    rc: "",
    tin: "",
    state: "",
    lga: "",
    facility: "",
    capacity: "",
  });
  const meta = PROCESSING_TYPES.find((p) => p.key === type);

  const steps = ["Processing type", "Company & site", "Requirements", "Submit"];

  return (
    <>
      <PageHeader
        eyebrow="Applicant onboarding"
        title="Start a processing compliance application"
        description="The evidence pack is assembled conditionally: the processing type selected determines which additional regulatory, environmental and safety requirements are surfaced."
      />

      <div className="flex flex-wrap gap-2">
        {steps.map((s, i) => (
          <button
            key={s}
            onClick={() => setStep(i)}
            className={cn(
              "flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-xs font-medium",
              i === step
                ? "border-primary bg-primary text-primary-foreground"
                : i < step
                  ? "border-success bg-success/40 text-success-foreground"
                  : "border-border bg-card text-muted-foreground",
            )}
          >
            <span className="flex size-5 items-center justify-center rounded-full border border-current text-[10px]">
              {i < step ? <Check className="size-3" /> : i + 1}
            </span>
            {s}
          </button>
        ))}
      </div>

      {step === 0 ? (
        <Panel>
          <PanelHeader
            title="What type of processing does the facility perform?"
            subtitle="This drives the conditional requirement set"
            icon={<FileStack className="size-4" />}
          />
          <div className="grid gap-3 p-5 md:grid-cols-2">
            {PROCESSING_TYPES.map((p) => (
              <button
                key={p.key}
                onClick={() => setType(p.key)}
                className={cn(
                  "rounded-2xl border p-4 text-left transition-all",
                  type === p.key ? "border-primary bg-accent" : "border-border hover:border-ring",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold">{p.label}</p>
                  {type === p.key ? <Check className="size-4 text-primary" /> : null}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{p.blurb}</p>
                <p className="mt-2 text-[11px] text-muted-foreground">
                  Adds {p.extra.length} conditional requirement{p.extra.length > 1 ? "s" : ""}
                </p>
              </button>
            ))}
          </div>
          <div className="flex justify-end border-t border-border px-5 py-4">
            <button
              disabled={!type}
              onClick={() => setStep(1)}
              className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-medium text-primary-foreground disabled:opacity-40"
            >
              Continue <ChevronRight className="size-3.5" />
            </button>
          </div>
        </Panel>
      ) : null}

      {step === 1 ? (
        <Panel>
          <PanelHeader
            title="Corporate identity and site"
            subtitle="CAC, FIRS and location details"
          />
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            <Input
              label="Registered company name"
              v={form.company}
              set={(v) => setForm({ ...form, company: v })}
              ph="e.g. Ilesa Mineral Processing Ltd"
            />
            <Input
              label="CAC RC number"
              v={form.rc}
              set={(v) => setForm({ ...form, rc: v })}
              ph="RC 1428907"
            />
            <Input
              label="Tax Identification Number (TIN)"
              v={form.tin}
              set={(v) => setForm({ ...form, tin: v })}
              ph="20418833-0001"
            />
            <Input
              label="Facility name"
              v={form.facility}
              set={(v) => setForm({ ...form, facility: v })}
              ph="Ilesa Refining Plant A"
            />
            <Input
              label="State"
              v={form.state}
              set={(v) => setForm({ ...form, state: v })}
              ph="Osun"
            />
            <Input
              label="Local Government Area (LGA)"
              v={form.lga}
              set={(v) => setForm({ ...form, lga: v })}
              ph="Ilesa East"
            />
            <Input
              label="Installed capacity"
              v={form.capacity}
              set={(v) => setForm({ ...form, capacity: v })}
              ph="180 t/month"
            />
          </div>
          <div className="flex justify-between border-t border-border px-5 py-4">
            <button
              onClick={() => setStep(0)}
              className="rounded-xl border border-border px-4 py-2 text-xs"
            >
              Back
            </button>
            <button
              onClick={() => setStep(2)}
              className="rounded-xl bg-primary px-4 py-2 text-xs font-medium text-primary-foreground"
            >
              Continue
            </button>
          </div>
        </Panel>
      ) : null}

      {step === 2 ? (
        <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <Panel>
            <PanelHeader
              title="Standard evidence pack"
              subtitle="Required of every processing applicant"
            />
            <ul className="divide-y divide-border">
              {BASE_REQUIREMENTS.map((r) => (
                <li key={r} className="flex items-start gap-3 px-5 py-3 text-xs">
                  <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded border border-border" />
                  {r}
                </li>
              ))}
            </ul>
          </Panel>

          <div className="space-y-6">
            <Panel className="border-warning/50">
              <PanelHeader
                title="Conditional requirements"
                subtitle={meta ? `Triggered by: ${meta.label}` : "Select a processing type"}
                icon={<Info className="size-4" />}
              />
              <ul className="divide-y divide-border">
                {(meta?.extra ?? []).map((r) => (
                  <li key={r} className="flex items-start gap-3 px-5 py-3 text-xs">
                    <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded border border-warning" />
                    {r}
                  </li>
                ))}
              </ul>
              {type === "chemical_refining" ? (
                <p className="mx-5 mb-4 rounded-xl bg-warning/20 px-3 py-2 text-[11px] text-warning-foreground">
                  Chemical processing and refining attracts an elevated inherent risk weighting and
                  a mandatory pre-approval physical inspection.
                </p>
              ) : null}
            </Panel>

            <Panel>
              <PanelHeader title="Sections in the application" subtitle="Reviewed independently" />
              <div className="flex flex-wrap gap-1.5 p-5">
                {SECTIONS.map((s) => (
                  <Pill key={s.key} tone="info">
                    {s.short}
                  </Pill>
                ))}
              </div>
            </Panel>

            <div className="flex justify-between">
              <button
                onClick={() => setStep(1)}
                className="rounded-xl border border-border px-4 py-2 text-xs"
              >
                Back
              </button>
              <button
                onClick={() => {
                  if (!type) return;
                  setCreating(true);
                  setFailure(null);
                  void startApplication({
                    company: form.company.trim(),
                    processing_type: type,
                    rc_number: form.rc.trim(),
                    tin: form.tin.trim(),
                    state: form.state.trim(),
                    lga: form.lga.trim(),
                    facility_name: form.facility.trim(),
                    capacity: form.capacity.trim(),
                  })
                    .then((reference) => {
                      setCreated(reference);
                      setStep(3);
                    })
                    .catch((cause: Error) => setFailure(cause.message))
                    .finally(() => setCreating(false));
                }}
                disabled={creating || !type || form.company.trim() === ""}
                className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-medium text-primary-foreground disabled:opacity-40"
              >
                {creating ? <Loader2 className="size-3.5 animate-spin" /> : null}
                Create application
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {failure ? (
        <Panel className="mt-4 border-destructive/50">
          <p className="flex items-center gap-2 px-5 py-4 text-xs text-destructive-foreground">
            <AlertTriangle className="size-4" /> {failure}
          </p>
        </Panel>
      ) : null}

      {step === 3 && created ? (
        <Panel className="p-8 text-center">
          <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-success/50 text-success-foreground">
            <ShieldCheck className="size-7" />
          </span>
          <h2 className="mt-4 text-lg font-semibold">Application created</h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
            {form.company} · {meta?.label ?? "processing"} · {form.lga || "LGA"},{" "}
            {form.state || "State"}. The ten evidence sections are laid down and waiting for your
            answers; nothing reaches the compliance desk until you submit.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <Pill tone="info">{created}</Pill>
            <Pill tone="warning">
              {(meta?.extra.length ?? 0) + BASE_REQUIREMENTS.length} evidence items to supply
            </Pill>
          </div>
          <Link
            to="/processing/application"
            className="mt-6 inline-block rounded-xl bg-primary px-4 py-2 text-xs font-medium text-primary-foreground"
          >
            Start filling it in
          </Link>
        </Panel>
      ) : null}
    </>
  );
}

function Input({
  label,
  v,
  set,
  ph,
}: {
  label: string;
  v: string;
  set: (v: string) => void;
  ph: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-medium text-muted-foreground">{label}</span>
      <input
        value={v}
        onChange={(e) => set(e.target.value)}
        placeholder={ph}
        className="w-full rounded-xl border border-border bg-muted/40 px-3 py-2 text-xs outline-none focus:border-ring"
      />
    </label>
  );
}
