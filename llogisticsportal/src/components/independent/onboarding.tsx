import { Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Check, Save } from "lucide-react";
import * as React from "react";

import { PageHeader } from "@/components/beldium/shell";
import { Panel } from "@/components/beldium/stat-card";
import { StatusBadge } from "@/components/beldium/status-badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { submitIndependentToBackend } from "@/lib/independent/backend";
import {
  IND_DECLARATIONS,
  IND_STEPS,
  OPERATOR_TYPES,
  applicableReqs,
  claimsRegisteredBusiness,
  indMissing,
  indSubmissionMissing,
  type IndVehicle,
  type IndependentApplication,
  type VehicleOwnership,
} from "@/lib/independent/model";
import { useIndependent } from "@/lib/independent/store";
import { cn } from "@/lib/utils";

import {
  CheckField,
  ErrorText,
  FileField,
  KeyValues,
  SelectField,
  TextField,
  humanize,
} from "./form";

const VEHICLE_TYPES = [
  "Tipper truck",
  "Flatbed truck",
  "Articulated truck",
  "Container truck",
  "Tanker",
  "Other",
];

export function IndependentVehicleForm({ onAdd }: { onAdd: (v: IndVehicle) => void }) {
  const blank = {
    registration: "",
    type: "",
    make: "",
    model: "",
    year: "",
    payload: "",
    ownership: "Owned",
    insuranceExpiry: "",
    roadworthinessExpiry: "",
  };
  const [f, setF] = React.useState(blank);
  const [owner, setOwner] = React.useState(false);
  const [error, setError] = React.useState("");
  const set = (k: keyof typeof blank) => (v: string) => setF((x) => ({ ...x, [k]: v }));

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!f.registration.trim() || !f.type) return setError("Enter the registration and type.");
        if (!f.make.trim() || !f.model.trim())
          return setError("Enter the vehicle make and model.");
        if (!(Number(f.year) >= 1900)) return setError("Enter the vehicle year.");
        if (!(Number(f.payload) > 0)) return setError("Enter a positive payload in tonnes.");
        if (!f.insuranceExpiry || !f.roadworthinessExpiry)
          return setError("Enter the insurance and roadworthiness expiry dates.");
        if (f.ownership !== "Owned" && !owner)
          return setError("Declare owner authorization for a leased or contracted vehicle.");
        onAdd({
          id: `IND-VEH-${crypto.randomUUID().slice(0, 8)}`,
          registration: f.registration.trim().toUpperCase(),
          type: f.type,
          make: f.make.trim(),
          model: f.model.trim(),
          year: Number(f.year),
          payload: Number(f.payload),
          ownership: f.ownership as VehicleOwnership,
          insuranceExpiry: f.insuranceExpiry,
          roadworthinessExpiry: f.roadworthinessExpiry,
          ownerAuthorization: f.ownership === "Owned" || owner,
        });
        setF(blank);
        setOwner(false);
        setError("");
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="Vehicle registration"
          value={f.registration}
          onChange={set("registration")}
        />
        <SelectField
          label="Vehicle type"
          value={f.type}
          onChange={set("type")}
          options={VEHICLE_TYPES}
        />
        <TextField label="Make" value={f.make} onChange={set("make")} />
        <TextField label="Model" value={f.model} onChange={set("model")} />
        <TextField label="Year of manufacture" type="number" value={f.year} onChange={set("year")} />
        <TextField
          label="Payload (tonnes)"
          type="number"
          value={f.payload}
          onChange={set("payload")}
        />
        <SelectField
          label="Vehicle ownership"
          value={f.ownership}
          onChange={set("ownership")}
          options={["Owned", "Leased", "Contracted"]}
        />
        <TextField
          label="Insurance expiry"
          type="date"
          value={f.insuranceExpiry}
          onChange={set("insuranceExpiry")}
        />
        <TextField
          label="Roadworthiness expiry"
          type="date"
          value={f.roadworthinessExpiry}
          onChange={set("roadworthinessExpiry")}
        />
      </div>
      {f.ownership !== "Owned" ? (
        <CheckField
          label="I have the vehicle owner's authorization to operate it"
          checked={owner}
          onChange={setOwner}
        />
      ) : null}
      <ErrorText text={error} />
      <Button type="submit" variant="outline">
        Add vehicle declaration
      </Button>
    </form>
  );
}

type Section = "personal" | "profile" | "licence" | "scope";

export function IndependentOnboarding() {
  const { workspace, save, submit, isDemo } = useIndependent();
  const a = workspace.application;
  const [error, setError] = React.useState("");
  const [saved, setSaved] = React.useState(false);
  const [submittedRef, setSubmittedRef] = React.useState("");
  const [sending, setSending] = React.useState(false);
  // Picked files stay in memory for submission; only their names are saved.
  const [files, setFiles] = React.useState<Record<string, File>>({});
  const pickFile = (id: string, file: File | null) =>
    setFiles((current) => {
      const next = { ...current };
      if (file) next[id] = file;
      else delete next[id];
      return next;
    });

  const update = (patch: Partial<IndependentApplication>) => {
    save({ ...a, ...patch });
    setSaved(false);
  };
  const go = (step: number) => {
    update({ step });
    setError("");
    window.scrollTo(0, 0);
  };
  const field = (
    section: Section,
    key: string,
    label: string,
    opts: { type?: string; options?: readonly string[]; required?: boolean } = {},
  ) =>
    opts.options ? (
      <SelectField
        key={key}
        label={label}
        value={a[section][key] ?? ""}
        options={opts.options}
        required={opts.required ?? true}
        onChange={(v) => update({ [section]: { ...a[section], [key]: v } })}
      />
    ) : (
      <TextField
        key={key}
        label={label}
        type={opts.type}
        required={opts.required ?? true}
        value={a[section][key] ?? ""}
        onChange={(v) => update({ [section]: { ...a[section], [key]: v } })}
      />
    );

  if (submittedRef) {
    return (
      <div className="mx-auto max-w-2xl">
        <Panel title="Independent application submitted">
          <p className="font-mono text-sm">{submittedRef}</p>
          <p className="mt-3 text-sm text-muted-foreground">
            A Beldium compliance officer reviews it separately. Submission does not make you
            eligible for assignments, and your account stays active either way.
          </p>
          <Button asChild className="mt-5">
            <Link to="/independent/dashboard">
              Go to my dashboard <ArrowRight className="ml-1.5 h-4 w-4" />
            </Link>
          </Button>
        </Panel>
      </div>
    );
  }

  const stepMissing = indMissing(a, a.step);

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Independent operator onboarding"
        description="Your personal transport record. These are your declarations; Beldium verifies them separately."
        actions={<StatusBadge value={a.status} />}
      />
      {isDemo ? (
        <p className="mb-4 text-sm text-muted-foreground">
          This is the seeded demo operator. Changing its declarations sends it back for review.
        </p>
      ) : null}
      <Progress
        aria-label="Onboarding progress"
        className="mb-5"
        value={(100 * new Set(a.completed).size) / IND_STEPS.length}
      />
      <nav aria-label="Onboarding steps" className="mb-6 grid grid-cols-2 gap-2 md:grid-cols-4">
        {IND_STEPS.map((name, i) => (
          <button
            key={name}
            type="button"
            onClick={() => go(i)}
            className={cn(
              "flex items-center gap-2 rounded-md border px-3 py-2.5 text-left text-xs transition-colors",
              a.step === i
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card hover:border-primary/40",
            )}
          >
            <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full border border-current text-[10px]">
              {a.completed.includes(i) ? <Check className="h-3 w-3" /> : i + 1}
            </span>
            {name}
          </button>
        ))}
      </nav>

      <Panel
        title={`Step ${a.step + 1} of 8 · ${IND_STEPS[a.step] ?? ""}`}
        action={
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              save(a);
              setSaved(true);
            }}
          >
            <Save className="mr-1.5 h-4 w-4" />
            {saved ? "Draft saved" : "Save draft"}
          </Button>
        }
      >
        <div className="space-y-5">
          {a.step === 0 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {field("personal", "firstName", "First name")}
              {field("personal", "lastName", "Last name")}
              {field("personal", "email", "Email", { type: "email" })}
              {field("personal", "phone", "Phone", { type: "tel" })}
              {field("personal", "state", "State")}
              {field("personal", "lga", "LGA")}
              {field("personal", "address", "Residential address")}
              {field("personal", "idType", "ID type", {
                options: ["NIN slip", "Voter card", "Passport", "Driver's licence", "Other"],
              })}
              <FileField
                label={`Upload proof of your ${a.personal["idType"] || "ID"}`}
                value={a.personal["idFilename"] ?? ""}
                onChange={(file) => {
                  const filename = file?.name ?? "";
                  pickFile("identity", file);
                  update({
                    personal: { ...a.personal, ["idFilename"]: filename },
                    evidence: {
                      ...a.evidence,
                      identity: { filename, declared: Boolean(filename) },
                    },
                  });
                }}
              />
            </div>
          ) : null}

          {a.step === 1 ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                {field("profile", "operatorType", "Operator type", { options: OPERATOR_TYPES })}
                {field("profile", "experience", "Years of experience", { type: "number" })}
                {field("profile", "services", "Services offered (comma-separated)")}
                {field("profile", "registeredBusiness", "Registered sole-proprietor business?", {
                  options: ["No", "Yes"],
                  required: false,
                })}
              </div>
              <p className="text-xs text-muted-foreground">
                A natural person does not need CAC or TIN evidence. Business-name details are asked
                for only if you say you have a registered business.
              </p>
              {claimsRegisteredBusiness(a) ? (
                <div className="grid gap-4 rounded-md border border-border p-4 sm:grid-cols-2">
                  {field("profile", "businessName", "Registered business name")}
                  {field("profile", "bnNumber", "Business name (BN) number")}
                </div>
              ) : null}
            </>
          ) : null}

          {a.step === 2 ? (
            <>
              <CheckField
                label="I am driver-only and have no vehicle to declare"
                checked={a.driverOnly}
                onChange={(v) => update({ driverOnly: v })}
              />
              {a.driverOnly ? (
                <p className="text-sm text-muted-foreground">
                  You can submit and use your workspace. Assignments that need a vehicle stay
                  restricted until a compliant vehicle is assigned.
                </p>
              ) : (
                <>
                  {a.vehicles.length ? (
                    <ul className="divide-y divide-border rounded-md border border-border">
                      {a.vehicles.map((v) => (
                        <li
                          key={v.id}
                          className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                        >
                          <span className="text-sm">
                            <span className="font-medium">{v.registration}</span> · {v.type} ·{" "}
                            {v.payload} t · {v.ownership}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              update({ vehicles: a.vehicles.filter((x) => x.id !== v.id) })
                            }
                          >
                            Remove
                          </Button>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  <IndependentVehicleForm
                    onAdd={(v) => {
                      if (a.vehicles.some((x) => x.registration === v.registration))
                        return setError("That registration is already declared.");
                      update({ vehicles: [...a.vehicles, v] });
                    }}
                  />
                </>
              )}
            </>
          ) : null}

          {a.step === 3 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {field("licence", "number", "Licence number")}
              {field("licence", "class", "Licence class", {
                options: ["Class E", "Class G", "Other"],
              })}
              {field("licence", "expiry", "Licence expiry", { type: "date" })}
              {field("licence", "competence", "Competence summary", { type: "textarea" })}
              {field("licence", "certifications", "Certifications, comma-separated", {
                required: false,
              })}
            </div>
          ) : null}

          {a.step === 4 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {field("scope", "states", "Operating states (comma-separated)")}
              {field("scope", "corridors", "Corridors / routes")}
              {field("scope", "cargo", "Cargo types")}
              {field("scope", "minerals", "Minerals, if any", { required: false })}
              {field("scope", "monthlyCapacity", "Monthly capacity")}
              {field("scope", "safety", "Safety and incident arrangements", { type: "textarea" })}
            </div>
          ) : null}

          {a.step === 5 ? (
            <>
              <p className="text-sm text-muted-foreground">
                Only the requirements your declared scope triggers are listed. FRSC / RTSSS
                applicability is checked in review; it is not a universal permit.
              </p>
              <ul className="space-y-3">
                {applicableReqs(a).map((r) => (
                  <li key={r.id} className="rounded-md border border-border p-4">
                    <p className="text-sm font-medium">{r.name}</p>
                    <p className="mt-0.5 mb-3 text-xs text-muted-foreground">{r.reason}</p>
                    <CheckField
                      label="I declare this ready for review"
                      checked={Boolean(a.authorizations[r.id])}
                      onChange={(v) =>
                        update({ authorizations: { ...a.authorizations, [r.id]: v } })
                      }
                    />
                  </li>
                ))}
              </ul>
            </>
          ) : null}

          {a.step === 6 ? (
            <>
              <p className="text-sm text-muted-foreground">
                Upload a document for each requirement below. The wizard records the filename
                only, and your statements do not verify the evidence.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                {applicableReqs(a).map((r) =>
                  r.id === "identity" ? (
                    <div key={r.id} className="text-sm">
                      <p className="font-medium">{r.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {a.personal["idFilename"]
                          ? `Uses your ${a.personal["idType"] || "ID"} uploaded on step 1: ${a.personal["idFilename"]}`
                          : "Upload your ID on step 1 first."}
                      </p>
                    </div>
                  ) : (
                    <FileField
                      key={r.id}
                      label={r.name}
                      value={a.evidence[r.id]?.filename ?? ""}
                      onChange={(file) => {
                        const filename = file?.name ?? "";
                        pickFile(r.id, file);
                        update({
                          evidence: {
                            ...a.evidence,
                            [r.id]: { filename, declared: Boolean(filename) },
                          },
                        });
                      }}
                    />
                  ),
                )}
              </div>
              <div className="space-y-3 border-t border-border pt-5">
                {IND_DECLARATIONS.map(([k, label]) => (
                  <CheckField
                    key={k}
                    label={label}
                    checked={Boolean(a.declarations[k])}
                    onChange={(v) => update({ declarations: { ...a.declarations, [k]: v } })}
                  />
                ))}
              </div>
            </>
          ) : null}

          {a.step === 7 ? (
            <>
              {IND_STEPS.slice(0, 7).map((name, i) => {
                const missing = indMissing(a, i);
                const data =
                  i === 0
                    ? a.personal
                    : i === 1
                      ? a.profile
                      : i === 3
                        ? a.licence
                        : i === 4
                          ? a.scope
                          : null;
                return (
                  <section key={name} className="rounded-md border border-border p-4">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <h3 className="text-sm font-semibold">{name}</h3>
                      <Button size="sm" variant="link" className="h-auto p-0" onClick={() => go(i)}>
                        Edit
                      </Button>
                    </div>
                    {data ? (
                      <KeyValues items={Object.entries(data).map(([k, v]) => [humanize(k), v])} />
                    ) : i === 2 ? (
                      <p className="text-sm">
                        {a.driverOnly
                          ? "Driver-only: no vehicle declared"
                          : a.vehicles
                              .map((v) => `${v.registration} · ${v.payload} t · ${v.ownership}`)
                              .join(", ") || "No vehicle declared"}
                      </p>
                    ) : i === 5 ? (
                      <KeyValues
                        items={applicableReqs(a).map((r) => [
                          r.name,
                          a.authorizations[r.id] ? "Declared" : "Not declared",
                        ])}
                      />
                    ) : (
                      <KeyValues
                        items={applicableReqs(a).map((r) => [r.name, a.evidence[r.id]?.filename])}
                      />
                    )}
                    {missing.length ? (
                      <p className="mt-3 text-xs text-destructive">Missing: {missing.join(", ")}</p>
                    ) : null}
                  </section>
                );
              })}
              <CheckField
                label="I confirm this submission for separate verification by Beldium compliance officers"
                checked={Boolean(a.declarations["submit"])}
                onChange={(v) => update({ declarations: { ...a.declarations, submit: v } })}
              />
            </>
          ) : null}

          <ErrorText text={error} />
        </div>

        <footer className="mt-6 flex flex-wrap justify-between gap-3 border-t border-border pt-5">
          <Button variant="outline" disabled={a.step === 0} onClick={() => go(a.step - 1)}>
            <ArrowLeft className="mr-1.5 h-4 w-4" /> Back
          </Button>
          {a.step < 7 ? (
            <Button
              onClick={() => {
                if (stepMissing.length) return setError(`Missing: ${stepMissing.join(", ")}`);
                update({
                  step: a.step + 1,
                  completed: [...new Set([...a.completed, a.step])],
                });
                setError("");
                window.scrollTo(0, 0);
              }}
            >
              Continue <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          ) : (
            <Button
              disabled={sending}
              onClick={async () => {
                try {
                  const missing = indSubmissionMissing(a);
                  if (missing.length) throw Error(missing.join("; "));
                  let latest = a;
                  if (!isDemo) {
                    const absent = applicableReqs(a)
                      .filter((r) => !files[r.id])
                      .map((r) => r.name);
                    if (absent.length)
                      throw Error(`Re-select the file for: ${absent.join(", ")}`);
                    setSending(true);
                    // Each backend step saves its id, so a retry resumes safely.
                    await submitIndependentToBackend({
                      application: a,
                      files,
                      persist: (backend) => {
                        latest = { ...latest, backend };
                        save(latest);
                      },
                    });
                  }
                  setSubmittedRef(submit(latest));
                  setSending(false);
                  setError("");
                } catch (err) {
                  setSending(false);
                  setError((err as Error).message);
                }
              }}
            >
              {sending
                ? "Sending to Beldium…"
                : a.status === "Submitted"
                  ? "Resubmit for review"
                  : "Submit independent application"}
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          )}
        </footer>
      </Panel>
    </div>
  );
}
