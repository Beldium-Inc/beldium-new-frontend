import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Check } from "lucide-react";
import { toast } from "sonner";

import { BeldiumLogo } from "@/components/beldium-logo";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  useGovernanceMe,
  useRequestGovernanceAccess,
  type GovernanceAccessRequestInput,
} from "@/lib/api";
import { useSignOut } from "@/lib/sign-out";
import { COMPLIANCE_VERTICALS } from "@/lib/verticals";
import { AccountGate } from "@/verticals/governance/account-gate";
import { Field, errorMessage, selectClass } from "@/verticals/governance/ui";

export const Route = createFileRoute("/governance/request-access")({
  ssr: false,
  head: () => ({ meta: [{ title: "Request access | Beldium Governance" }] }),
  component: RequestAccessPage,
});

const SCOPES = [
  "Policy Development",
  "Regulatory Impact Assessment",
  "Risk Management",
  "Institutional Oversight",
  "ESG",
  "Internal Controls",
  "Compliance Intelligence",
  "Executive Reporting",
  ...COMPLIANCE_VERTICALS.map((v) => v.name.replace(/ Compliance$/, "")),
];

const STEPS = [
  {
    title: "Professional identity",
    fields: [
      ["phone", "Phone number"],
      ["country", "Country"],
      ["state", "State"],
      ["job_title", "Job title"],
      ["department", "Department"],
    ],
  },
  {
    title: "Organisation",
    fields: [
      ["organisation", "Organisation name"],
      ["organisation_type", "Organisation type"],
      ["registration_number", "Registration number"],
      ["registered_address", "Registered address"],
      ["website", "Website"],
      ["authorised_representative", "Authorised representative"],
    ],
  },
  {
    title: "Qualifications",
    fields: [
      ["highest_qualification", "Highest qualification"],
      ["specialisation", "Area of specialisation"],
      ["certifications", "Professional certifications"],
      ["years_experience", "Years of experience"],
      ["membership", "Professional membership"],
      ["previous_responsibilities", "Previous governance responsibilities"],
    ],
  },
  { title: "Governance scope", fields: [] },
  { title: "Declarations", fields: [] },
  { title: "Review & submit", fields: [] },
] as const;

const REQUIRED = new Set(["organisation", "job_title", "country"]);

const DECLARATIONS = [
  ["conflict_of_interest", "I have declared any conflict of interest relevant to this role."],
  ["confidentiality", "I will keep governance records confidential and within my clearance."],
  ["code_of_conduct", "I accept the Beldium governance code of conduct."],
] as const;

function RequestAccessPage() {
  return (
    <div className="mx-auto max-w-4xl p-6 md:p-10">
      <div className="mb-6 flex items-center gap-3">
        <BeldiumLogo className="size-11" />
        <div>
          <div className="font-display font-semibold">Beldium</div>
          <div className="text-xs text-muted-foreground">Governance &amp; Risk</div>
        </div>
      </div>
      <h1 className="font-display text-3xl font-semibold">Request governance access</h1>
      <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
        A request asks for an analyst, reviewer or viewer seat. A Super Administrator reviews it;
        executive and administrator roles are by invitation only.
      </p>
      <div className="mt-6">
        <AccountGate>
          <RequestForm />
        </AccountGate>
      </div>
    </div>
  );
}

function RequestForm() {
  const me = useGovernanceMe();
  const submit = useRequestGovernanceAccess();
  const signOut = useSignOut();
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState<Record<string, string>>({});
  const [scope, setScope] = useState<string[]>([]);
  const [role, setRole] = useState<GovernanceAccessRequestInput["requested_role"]>("analyst");
  const [declarations, setDeclarations] = useState({
    conflict_of_interest: false,
    confidentiality: false,
    code_of_conduct: false,
  });

  if (me.isPending) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (me.data && me.data.status !== "none" && me.data.status !== "declined") {
    return (
      <div className="max-w-md rounded-xl border bg-card p-8 text-center shadow-card">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-success/15 text-success">
          <Check />
        </div>
        <h2 className="mt-4 font-display text-2xl font-semibold">
          {me.data.status === "pending"
            ? "Request submitted"
            : me.data.status === "active"
              ? "You already have access"
              : "Access suspended"}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {me.data.status === "pending"
            ? "A Super Administrator will review it. Sign in to Governance & Risk once it is approved."
            : me.data.status === "active"
              ? "Sign in under Governance & Risk to open the workspace."
              : "Ask a Super Administrator to restore your access."}
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <Button asChild>
            <Link to="/signin">Go to sign in</Link>
          </Button>
          <Button variant="outline" onClick={signOut}>
            Sign out
          </Button>
        </div>
      </div>
    );
  }

  const current = STEPS[step]!;
  const missing = [...REQUIRED].filter((k) => !profile[k]?.trim());
  const allDeclared = Object.values(declarations).every(Boolean);

  const send = () => {
    if (missing.length) {
      toast.error("Fill in your organisation, job title and country first.");
      return;
    }
    submit.mutate(
      {
        organisation: profile["organisation"] ?? "",
        job_title: profile["job_title"] ?? "",
        requested_role: role,
        profile,
        scope,
        declarations,
      },
      {
        onSuccess: () => toast.success("Access request submitted"),
        onError: (e) => toast.error(errorMessage(e)),
      },
    );
  };

  return (
    <>
      <ol className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {STEPS.map((s, n) => (
          <li key={s.title} className="text-xs">
            <div className={`h-1.5 rounded-full ${n <= step ? "bg-primary" : "bg-border"}`} />
            <div
              className={`mt-2 ${n === step ? "font-medium text-foreground" : "text-muted-foreground"}`}
            >
              {n + 1}. {s.title}
            </div>
          </li>
        ))}
      </ol>
      <div className="mt-8 rounded-xl border bg-card p-6 shadow-card">
        <h2 className="mb-5 font-display text-xl font-semibold">{current.title}</h2>
        {current.fields.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2">
            {current.fields.map(([key, label]) => (
              <Field
                key={key}
                label={REQUIRED.has(key) ? `${label} (required)` : label}
                htmlFor={`ra-${key}`}
              >
                <Input
                  id={`ra-${key}`}
                  value={profile[key] ?? ""}
                  maxLength={
                    key.includes("address") || key.includes("responsibilities") ? 2000 : 255
                  }
                  onChange={(e) => setProfile((p) => ({ ...p, [key]: e.target.value }))}
                />
              </Field>
            ))}
          </div>
        )}
        {step === 3 && (
          <div className="space-y-5">
            <Field label="Seat requested" htmlFor="ra-role">
              <select
                id="ra-role"
                className={`${selectClass} max-w-sm`}
                value={role}
                onChange={(e) => setRole(e.target.value as typeof role)}
              >
                <option value="analyst">Governance Analyst</option>
                <option value="reviewer">Institutional Reviewer</option>
                <option value="viewer">Oversight Viewer</option>
              </select>
            </Field>
            <div className="grid gap-2 md:grid-cols-3">
              {SCOPES.map((c) => (
                <label key={c} className="flex items-center gap-2 rounded-md border p-2.5 text-sm">
                  <Checkbox
                    checked={scope.includes(c)}
                    onCheckedChange={(v) =>
                      setScope((s) => (v ? [...s, c] : s.filter((x) => x !== c)))
                    }
                  />
                  {c}
                </label>
              ))}
            </div>
          </div>
        )}
        {step === 4 && (
          <div className="space-y-3">
            {DECLARATIONS.map(([key, text]) => (
              <label key={key} className="flex items-start gap-2 text-sm">
                <Checkbox
                  className="mt-0.5"
                  checked={declarations[key]}
                  onCheckedChange={(v) => setDeclarations((d) => ({ ...d, [key]: Boolean(v) }))}
                />
                {text}
              </label>
            ))}
            <p className="text-xs text-muted-foreground">
              Supporting credentials are requested by the reviewing administrator if needed, and
              filed on Documents &amp; Reports once you have access.
            </p>
          </div>
        )}
        {step === 5 && (
          <div className="space-y-3">
            {STEPS.slice(0, 5).map((s, n) => (
              <div
                key={s.title}
                className="flex items-center justify-between rounded-md border p-3 text-sm"
              >
                <span>
                  {n + 1}. {s.title}
                  {n === 1 && missing.includes("organisation") && (
                    <span className="ml-2 text-destructive">Organisation missing</span>
                  )}
                  {n === 0 && (missing.includes("job_title") || missing.includes("country")) && (
                    <span className="ml-2 text-destructive">Job title and country needed</span>
                  )}
                  {n === 4 && !allDeclared && (
                    <span className="ml-2 text-destructive">All declarations needed</span>
                  )}
                </span>
                <button className="text-link hover:underline" onClick={() => setStep(n)}>
                  Edit
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="mt-6 flex justify-between">
        <Button variant="outline" disabled={step === 0} onClick={() => setStep(step - 1)}>
          Back
        </Button>
        {step < STEPS.length - 1 ? (
          <Button onClick={() => setStep(step + 1)}>Continue</Button>
        ) : (
          <Button disabled={submit.isPending || !allDeclared || missing.length > 0} onClick={send}>
            {submit.isPending ? "Submitting…" : "Submit request"}
          </Button>
        )}
      </div>
    </>
  );
}
