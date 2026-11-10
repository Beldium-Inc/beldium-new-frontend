import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { AuthShell, InfoRow, ProgressHeader, StepBar } from "@/components/onboarding/ui";
import {
  AreaField,
  ChipToggleGroup,
  SectionCard,
  SelectField,
  TextField,
  YesNoField,
} from "@/components/onboarding/fields";
import { FieldNote } from "@/components/onboarding/quality-parts";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { allNigerianStates } from "@/lib/onboarding/data";
import { PARTICIPANTS, type ParticipantField } from "@/lib/onboarding/participants";
import { useOnboarding } from "@/lib/onboarding/store";
import { VERTICAL_BY_SLUG } from "@/lib/verticals";
import {
  ApiError,
  listParticipantApplications,
  registerParticipant,
  saveParticipantSection,
  submitParticipantApplication,
  uploadParticipantDocument,
  useHasTokens,
  type Answer,
  type ParticipantApplication,
  type ParticipantSector,
  type ParticipantSubtype,
} from "@/lib/api";

const STORAGE_KEY = "beldium.onboarding.participant.v1";

type Answers = Record<string, string | string[] | boolean | null>;
type Draft = {
  /** The server's application id once the company is registered (BE-O3). */
  applicationId?: string;
  company: Record<string, string>;
  operations: Answers;
  sites: Record<string, string>[];
  representative: Record<string, string>;
  documents: Record<string, string>;
  declarations: Record<string, boolean>;
};

const COMPANY_FIELDS: {
  key: string;
  label: string;
  required?: boolean;
  type?: string;
  placeholder?: string;
}[] = [
  { key: "legalName", label: "Registered legal name", required: true },
  { key: "tradingName", label: "Trading name" },
  { key: "rcNumber", label: "CAC / RC number", required: true, placeholder: "RC-1234567" },
  { key: "tin", label: "Tax identification number (TIN)", required: true },
  { key: "incorporated", label: "Date of incorporation", type: "date" },
  { key: "address", label: "Registered address", required: true },
  { key: "email", label: "Company email", required: true, type: "email" },
  { key: "phone", label: "Company phone", required: true },
  { key: "website", label: "Website", placeholder: "https://" },
];

function load(): Draft | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Draft) : null;
  } catch {
    return null;
  }
}

/**
 * Register one of the sector's own companies: a processor, warehouse
 * operator, exporter, or a buyer / offtaker / OEM. The person who registers
 * becomes the company's administrator (backend plan BE-O3).
 *
 * The questions come from src/lib/onboarding/participants.ts. Leaving the
 * company step registers the company (POST /onboarding/participants/), each
 * later step saves its section, documents upload as they are chosen, and
 * Submit asks the server, which is the judge of completeness. The draft is
 * also kept in this browser so a reload does not lose typing.
 */
export function ParticipantApplicationFlow() {
  const { sector, account, submitApplication } = useOnboarding();
  const navigate = useNavigate();
  const config = sector ? PARTICIPANTS[sector] : undefined;
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [draft, setDraft] = useState<Draft>(
    () =>
      load() ?? {
        company: { state: "Select…" },
        operations: {},
        sites: [],
        representative: {},
        documents: {},
        declarations: {},
      },
  );

  const signedIn = useHasTokens();
  const [busy, setBusy] = useState(false);

  // Pick up an application this person already registered for the sector,
  // so a reload or a second browser continues it instead of registering twice.
  useEffect(() => {
    if (!signedIn || !sector || draft.applicationId) return;
    let cancelled = false;
    listParticipantApplications()
      .then((page) => {
        const found = page.results.find((a) => a.sector === sector);
        if (!found || cancelled) return;
        setDraft((d) => ({ ...fromServer(found, d), applicationId: found.id }));
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signedIn, sector]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    } catch {
      /* private mode: the draft lives only in this tab */
    }
  }, [draft]);

  if (!sector || !config) {
    return (
      <AuthShell title="This sector registers its companies elsewhere" width="sm">
        <p className="text-sm text-muted-foreground">
          Go back and choose how you take part in this sector.
        </p>
        <Button className="mt-5" onClick={() => navigate({ to: "/onboarding/role" })}>
          Back to the options
        </Button>
      </AuthShell>
    );
  }

  const steps = [
    "Company",
    config.operationsTitle,
    config.sites.title,
    "Authorised representative",
    "Documents",
    "Declaration",
    "Review",
  ];
  const rep = {
    fullName: draft.representative["fullName"] ?? account.fullName,
    jobTitle: draft.representative["jobTitle"] ?? account.jobTitle,
    email: draft.representative["email"] ?? account.email,
    phone: draft.representative["phone"] ?? account.phone,
  };

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));
  const answer = (f: ParticipantField) => draft.operations[f.key];
  const setAnswer = (key: string, value: Answers[string]) =>
    set("operations", { ...draft.operations, [key]: value });

  const validate = (i: number): Record<string, string> => {
    const e: Record<string, string> = {};
    if (i === 0) {
      for (const f of COMPANY_FIELDS)
        if (f.required && !(draft.company[f.key] ?? "").trim()) e[f.key] = "Required.";
      if (!draft.company["state"] || draft.company["state"] === "Select…")
        e["state"] = "Choose a state.";
    }
    if (i === 1) {
      for (const f of config.operations) {
        if (!f.required) continue;
        const v = answer(f);
        if (
          f.kind === "chips"
            ? !(Array.isArray(v) && v.length)
            : f.kind === "yesno"
              ? typeof v !== "boolean"
              : !String(v ?? "").trim()
        )
          e[f.key] = f.kind === "chips" ? "Choose at least one." : "Required.";
        if (f.kind === "number" && v && Number.isNaN(Number(v))) e[f.key] = "Enter a number.";
      }
    }
    if (i === 2 && draft.sites.filter((s) => (s["name"] ?? "").trim()).length < config.sites.min)
      e["sites"] = `Add at least ${config.sites.min} ${config.sites.itemLabel}.`;
    if (i === 3) {
      if (!rep.fullName.trim()) e["fullName"] = "Required.";
      if (!rep.email.trim()) e["email"] = "Required.";
      if (!draft.representative["authorised"])
        e["authorised"] = "Confirm you may act for the company.";
    }
    if (i === 4) {
      const missing = config.documents.filter((d) => d.required && !draft.documents[d.title]);
      if (missing.length) e["documents"] = `Attach: ${missing.map((d) => d.title).join(", ")}.`;
    }
    if (i === 5) {
      if (config.declarations.some((d) => !draft.declarations[d.key]))
        e["declarations"] = "Tick every declaration.";
      if (
        (draft.representative["signature"] ?? "").trim().toLowerCase() !==
        rep.fullName.trim().toLowerCase()
      )
        e["signature"] = "Type your full name exactly as above to sign.";
    }
    return e;
  };

  const representative = (): Record<string, Answer> => ({
    ...draft.representative,
    fullName: rep.fullName,
    jobTitle: rep.jobTitle,
    email: rep.email,
    phone: rep.phone,
  });

  /** Make sure the company exists on the server; returns its application id. */
  const ensureApplication = async (): Promise<string> => {
    if (draft.applicationId) return draft.applicationId;
    const typed = String(draft.operations["participantType"] ?? "").toLowerCase();
    const subtype: ParticipantSubtype = typed === "offtaker" || typed === "oem" ? typed : "buyer";
    const created = await registerParticipant({
      sector: sector as ParticipantSector,
      name: (draft.company["legalName"] ?? "").trim(),
      registration_number: (draft.company["rcNumber"] ?? "").trim(),
      ...(sector === "marketplace" ? { participant_subtype: subtype } : {}),
    });
    setDraft((d) => ({ ...d, applicationId: created.id }));
    return created.id;
  };

  /** Save what the step just finished collected. */
  const persist = async (i: number) => {
    const id = await ensureApplication();
    if (i === 0) await saveParticipantSection(id, "company", draft.company);
    if (i === 1) await saveParticipantSection(id, "operations", draft.operations);
    if (i === 2) await saveParticipantSection(id, "sites", draft.sites);
    if (i === 3) await saveParticipantSection(id, "representative", representative());
    if (i === 5) {
      await saveParticipantSection(id, "representative", representative());
      await saveParticipantSection(id, "declarations", draft.declarations);
    }
  };

  const goNext = async () => {
    const e = validate(step);
    setErrors(e);
    if (Object.keys(e).length) return;
    setBusy(true);
    try {
      await persist(step);
    } catch (error) {
      toast.error(serverMessage(error, "Your answers could not be saved."));
      return;
    } finally {
      setBusy(false);
    }
    setStep((s) => s + 1);
    window.scrollTo({ top: 0 });
  };

  const upload = async (title: string, file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    try {
      const id = await ensureApplication();
      await uploadParticipantDocument(id, title, file);
      set("documents", { ...draft.documents, [title]: file.name });
    } catch (error) {
      toast.error(serverMessage(error, `${title} could not be uploaded.`));
    } finally {
      setBusy(false);
    }
  };

  const submit = async () => {
    for (let i = 0; i < 6; i++) {
      const e = validate(i);
      if (Object.keys(e).length) {
        setErrors(e);
        setStep(i);
        return;
      }
    }
    setBusy(true);
    try {
      await persist(5);
      await submitParticipantApplication(await ensureApplication());
    } catch (error) {
      toast.error(serverMessage(error, "The application could not be submitted."));
      return;
    } finally {
      setBusy(false);
    }
    submitApplication();
    navigate({ to: "/onboarding/submitted" });
  };

  return (
    <AuthShell
      eyebrow={`${config.noun} application · Step ${step + 1} of ${steps.length}`}
      title={steps[step] ?? ""}
      description={`Register your company in ${VERTICAL_BY_SLUG[sector].name}. You become its administrator: you can invite colleagues and submit the application.`}
      width="lg"
    >
      <ProgressHeader
        step={step + 1}
        total={steps.length}
        onBack={() => (step === 0 ? navigate({ to: "/onboarding/verify" }) : setStep(step - 1))}
      />
      <StepBar steps={steps} current={step} />

      <div className="mt-7 space-y-5">
        {step === 0 && (
          <div className="grid gap-4 sm:grid-cols-2">
            {COMPANY_FIELDS.map((f) => (
              <div key={f.key}>
                <TextField
                  label={f.required ? `${f.label} *` : f.label}
                  type={f.type ?? "text"}
                  value={draft.company[f.key] ?? ""}
                  onChange={(v) => set("company", { ...draft.company, [f.key]: v })}
                  {...(f.placeholder ? { placeholder: f.placeholder } : {})}
                />
                <FieldNote error={errors[f.key]} />
              </div>
            ))}
            <div>
              <SelectField
                label="State *"
                value={draft.company["state"] ?? "Select…"}
                onChange={(v) => set("company", { ...draft.company, state: v })}
                options={["Select…", ...allNigerianStates]}
              />
              <FieldNote error={errors["state"]} />
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="grid gap-4 sm:grid-cols-2">
            {config.operations.map((f) => {
              const label = f.required ? `${f.label} *` : f.label;
              const v = answer(f);
              const wide = f.kind === "chips" || f.kind === "area" || f.kind === "yesno";
              return (
                <div key={f.key} className={wide ? "sm:col-span-2" : ""}>
                  {f.kind === "chips" ? (
                    <ChipToggleGroup
                      label={label}
                      options={f.options}
                      selected={Array.isArray(v) ? v : []}
                      onToggle={(o) => {
                        const list = Array.isArray(v) ? v : [];
                        setAnswer(
                          f.key,
                          list.includes(o) ? list.filter((x) => x !== o) : [...list, o],
                        );
                      }}
                    />
                  ) : f.kind === "select" ? (
                    <SelectField
                      label={label}
                      value={typeof v === "string" && v ? v : "Select…"}
                      onChange={(x) => setAnswer(f.key, x === "Select…" ? "" : x)}
                      options={["Select…", ...f.options]}
                    />
                  ) : f.kind === "yesno" ? (
                    <YesNoField
                      label={label}
                      value={typeof v === "boolean" ? v : null}
                      onChange={(x) => setAnswer(f.key, x)}
                    />
                  ) : f.kind === "area" ? (
                    <AreaField
                      label={label}
                      value={typeof v === "string" ? v : ""}
                      onChange={(x) => setAnswer(f.key, x)}
                    />
                  ) : (
                    <TextField
                      label={label}
                      type={f.kind === "number" ? "number" : f.kind === "date" ? "date" : "text"}
                      value={typeof v === "string" ? v : ""}
                      onChange={(x) => setAnswer(f.key, x)}
                      {...("placeholder" in f && f.placeholder
                        ? { placeholder: f.placeholder }
                        : {})}
                    />
                  )}
                  <FieldNote error={errors[f.key]} />
                </div>
              );
            })}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            {draft.sites.map((row, i) => (
              <div
                key={i}
                className="grid gap-3 rounded-[14px] border border-border p-4 sm:grid-cols-2 lg:grid-cols-3"
              >
                {config.sites.columns.map((c) => (
                  <TextField
                    key={c.key}
                    label={c.label}
                    value={row[c.key] ?? ""}
                    onChange={(v) =>
                      set(
                        "sites",
                        draft.sites.map((r, j) => (j === i ? { ...r, [c.key]: v } : r)),
                      )
                    }
                    {...(c.placeholder ? { placeholder: c.placeholder } : {})}
                  />
                ))}
                <div className="flex items-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      set(
                        "sites",
                        draft.sites.filter((_, j) => j !== i),
                      )
                    }
                    aria-label={`Remove ${config.sites.itemLabel} ${i + 1}`}
                  >
                    <Trash2 className="size-4" /> Remove
                  </Button>
                </div>
              </div>
            ))}
            <Button variant="outline" onClick={() => set("sites", [...draft.sites, {}])}>
              <Plus className="size-4" /> Add {config.sites.itemLabel}
            </Button>
            <FieldNote error={errors["sites"]} />
          </div>
        )}

        {step === 3 && (
          <div className="grid gap-4 sm:grid-cols-2">
            {(
              [
                ["fullName", "Full name *"],
                ["jobTitle", "Job title"],
                ["email", "Email *"],
                ["phone", "Phone"],
              ] as const
            ).map(([key, label]) => (
              <div key={key}>
                <TextField
                  label={label}
                  value={rep[key]}
                  onChange={(v) => set("representative", { ...draft.representative, [key]: v })}
                />
                <FieldNote error={errors[key]} />
              </div>
            ))}
            <div className="sm:col-span-2">
              <label className="flex items-start gap-3 text-sm">
                <Checkbox
                  checked={draft.representative["authorised"] === "yes"}
                  onCheckedChange={(v) =>
                    set("representative", {
                      ...draft.representative,
                      authorised: v === true ? "yes" : "",
                    })
                  }
                  className="mt-0.5"
                />
                <span>
                  I am authorised to register this company and to act for it on Beldium. I will be
                  its administrator.
                </span>
              </label>
              <FieldNote error={errors["authorised"]} />
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-3">
            {config.documents.map((d) => (
              <div
                key={d.title}
                className="flex flex-col gap-2 rounded-[14px] border border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-sm font-medium">
                    {d.title}
                    {d.required && <span className="text-destructive"> *</span>}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {draft.documents[d.title]
                      ? `Selected: ${draft.documents[d.title]}`
                      : d.required
                        ? "Required"
                        : "Optional"}
                  </p>
                </div>
                <Input
                  type="file"
                  accept=".pdf,image/*,.doc,.docx"
                  className="sm:w-64"
                  aria-label={`Upload ${d.title}`}
                  disabled={busy}
                  onChange={(e) => void upload(d.title, e.target.files?.[0])}
                />
              </div>
            ))}
            <FieldNote error={errors["documents"]} />
          </div>
        )}

        {step === 5 && (
          <div className="space-y-3">
            {config.declarations.map((d) => (
              <label
                key={d.key}
                className="flex items-start gap-3 rounded-[14px] border border-border px-4 py-3 text-sm"
              >
                <Checkbox
                  checked={Boolean(draft.declarations[d.key])}
                  onCheckedChange={(v) =>
                    set("declarations", { ...draft.declarations, [d.key]: v === true })
                  }
                  className="mt-0.5"
                />
                <span>{d.label}</span>
              </label>
            ))}
            <FieldNote error={errors["declarations"]} />
            <TextField
              label={`Sign by typing your full name (${rep.fullName || "as above"})`}
              value={draft.representative["signature"] ?? ""}
              onChange={(v) => set("representative", { ...draft.representative, signature: v })}
            />
            <FieldNote error={errors["signature"]} />
          </div>
        )}

        {step === 6 && (
          <div className="space-y-4">
            <SectionCard
              title="Company"
              action={
                <Button size="sm" variant="ghost" onClick={() => setStep(0)}>
                  Edit
                </Button>
              }
            >
              <div className="space-y-1">
                {COMPANY_FIELDS.map((f) => (
                  <InfoRow key={f.key} label={f.label} value={draft.company[f.key] ?? ""} />
                ))}
                <InfoRow
                  label="State"
                  value={draft.company["state"] === "Select…" ? "" : (draft.company["state"] ?? "")}
                />
              </div>
            </SectionCard>
            <SectionCard
              title={config.operationsTitle}
              action={
                <Button size="sm" variant="ghost" onClick={() => setStep(1)}>
                  Edit
                </Button>
              }
            >
              <div className="space-y-1">
                {config.operations.map((f) => {
                  const v = answer(f);
                  return (
                    <InfoRow
                      key={f.key}
                      label={f.label}
                      value={
                        Array.isArray(v)
                          ? v.join(", ")
                          : typeof v === "boolean"
                            ? v
                              ? "Yes"
                              : "No"
                            : (v ?? "")
                      }
                    />
                  );
                })}
              </div>
            </SectionCard>
            <SectionCard
              title={config.sites.title}
              action={
                <Button size="sm" variant="ghost" onClick={() => setStep(2)}>
                  Edit
                </Button>
              }
            >
              <p className="text-sm">
                {draft.sites
                  .filter((s) => (s["name"] ?? "").trim())
                  .map((s) => s["name"])
                  .join(", ") || "None added"}
              </p>
            </SectionCard>
            <SectionCard
              title="Authorised representative"
              action={
                <Button size="sm" variant="ghost" onClick={() => setStep(3)}>
                  Edit
                </Button>
              }
            >
              <div className="space-y-1">
                <InfoRow label="Name" value={rep.fullName} />
                <InfoRow label="Job title" value={rep.jobTitle} />
                <InfoRow label="Email" value={rep.email} />
              </div>
            </SectionCard>
            <SectionCard
              title="Documents"
              action={
                <Button size="sm" variant="ghost" onClick={() => setStep(4)}>
                  Edit
                </Button>
              }
            >
              <p className="text-sm">
                {Object.values(draft.documents).filter(Boolean).length} of {config.documents.length}{" "}
                attached
              </p>
            </SectionCard>
          </div>
        )}

        <div className="flex flex-wrap gap-3 pt-2">
          {step < steps.length - 1 ? (
            <Button size="lg" onClick={() => void goNext()} disabled={busy}>
              Save and continue
            </Button>
          ) : (
            <Button size="lg" onClick={() => void submit()} disabled={busy}>
              Submit application
            </Button>
          )}
          {step > 0 && (
            <Button size="lg" variant="ghost" onClick={() => setStep(step - 1)}>
              Back
            </Button>
          )}
        </div>
      </div>
    </AuthShell>
  );
}

/** Fill the local draft from the server's copy where the browser has nothing. */
function fromServer(app: ParticipantApplication, local: Draft): Draft {
  const text = (o: Record<string, Answer>) =>
    Object.fromEntries(Object.entries(o).map(([k, v]) => [k, v == null ? "" : String(v)]));
  const documents = Object.fromEntries(app.documents.map((d) => [d.title, d.file_name]));
  return {
    ...local,
    company: Object.keys(local.company).length > 1 ? local.company : text(app.company),
    operations: Object.keys(local.operations).length
      ? local.operations
      : (app.operations as Answers),
    sites: local.sites.length ? local.sites : app.sites,
    representative: Object.keys(local.representative).length
      ? local.representative
      : text(app.representative),
    documents: { ...documents, ...local.documents },
    declarations: Object.keys(local.declarations).length ? local.declarations : app.declarations,
  };
}

/** The server's reason, with the "missing" list when submit is refused. */
function serverMessage(error: unknown, fallback: string): string {
  if (!(error instanceof ApiError)) return fallback;
  const details = error.details as Record<string, unknown> | undefined;
  const missing = details?.["missing"];
  if (Array.isArray(missing) && missing.length)
    return `Still needed: ${missing.map((m) => String(m).replace(/^[a-z]+\./, "")).join(", ")}.`;
  return error.message || fallback;
}
