import * as React from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle2,
  FlaskConical,
  Landmark,
  Microscope,
  Pencil,
  ScanSearch,
  ShieldCheck,
  UserCheck,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import { AuthLayout, Btn, CodeInput, FieldError, Label, inputClass } from "@/components/beldium/auth";
import { StatusPill } from "@/components/beldium/ui";
import {
  StepFields,
  fieldLabel,
  summarise,
  validateStep,
  type Errors,
  type Values,
} from "@/components/beldium/step-fields";
import { useAccounts, type QcApplication } from "@/lib/beldium/accounts";
import { roleDefs, roleOrder, type QcRoleKey } from "@/lib/beldium/onboarding";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Create account — Beldium Quality & Control" },
      {
        name: "description",
        content:
          "Apply to join Beldium as a Quality & Control organisation, inspector, laboratory analyst, regulator or independent professional.",
      },
      { property: "og:title", content: "Create account — Beldium Quality & Control" },
      {
        property: "og:description",
        content: "Role-based onboarding for laboratories, inspectors, analysts and regulators.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SignupPage,
});

type Phase = "sector" | "qc" | "role" | "account" | "email" | "phone" | "app" | "done";

const roleIcons: Record<QcRoleKey, typeof Building2> = {
  qc_org: Building2,
  qc_officer: ScanSearch,
  lab_analyst: Microscope,
  reg_org: Landmark,
  reg_officer: UserCheck,
  independent: UserRound,
};

function SignupPage() {
  const accounts = useAccounts();
  const navigate = useNavigate();
  const [phase, setPhase] = React.useState<Phase>("sector");
  const [roleKey, setRoleKey] = React.useState<QcRoleKey | null>(null);
  const [stepIdx, setStepIdx] = React.useState(0);
  const [values, setValues] = React.useState<Values>({});
  const [errors, setErrors] = React.useState<Errors>({});
  const [submitted, setSubmitted] = React.useState<QcApplication | null>(null);
  const resumed = React.useRef(false);

  const acc = accounts.current;

  // Resume a signed-in account that has not yet submitted.
  React.useEffect(() => {
    if (!accounts.ready || resumed.current) return;
    resumed.current = true;
    if (acc?.roleKey && !acc.application) {
      setRoleKey(acc.roleKey);
      try {
        const d = JSON.parse(localStorage.getItem(`beldium.draft.${acc.id}`) ?? "null");
        if (d) {
          setValues(d.values ?? {});
          setStepIdx(d.stepIdx ?? 0);
        }
      } catch {
        /* ignore */
      }
      setPhase(!acc.emailVerified ? "email" : !acc.phoneVerified ? "phone" : "app");
    }
  }, [accounts.ready, acc]);

  React.useEffect(() => {
    if (phase === "app" && acc) localStorage.setItem(`beldium.draft.${acc.id}`, JSON.stringify({ values, stepIdx }));
  }, [phase, values, stepIdx, acc]);

  React.useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [phase, stepIdx]);

  const def = roleKey ? roleDefs[roleKey] : null;
  const steps = def?.steps ?? [];
  const step = steps[stepIdx];

  const flow: { key: Phase; label: string }[] = [
    { key: "role", label: "Role" },
    { key: "account", label: "Account" },
    { key: "email", label: "Email" },
    { key: "phone", label: "Phone" },
    { key: "app", label: def?.applicationType ?? "Application" },
  ];
  const flowIdx = flow.findIndex((f) => f.key === phase);

  const aside =
    phase === "app" && def ? (
      <div className="mt-8">
        <p className="text-xs tracking-[0.18em] text-pale/70 uppercase">{def.applicationType}</p>
        <p className="mt-1 font-display text-lg font-semibold">{def.title}</p>
        <ol className="mt-5 space-y-1">
          {steps.map((s, i) => (
            <li key={s.id}>
              <button
                type="button"
                disabled={i > stepIdx}
                onClick={() => setStepIdx(i)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm transition",
                  i === stepIdx ? "bg-pale text-navy" : i < stepIdx ? "text-pale hover:bg-white/10" : "text-pale/50",
                )}
              >
                <span
                  className={cn(
                    "grid size-6 shrink-0 place-items-center rounded-full text-[11px] font-semibold",
                    i < stepIdx ? "bg-success text-success-foreground" : i === stepIdx ? "bg-navy text-navy-foreground" : "bg-white/10",
                  )}
                >
                  {i < stepIdx ? "✓" : i + 1}
                </span>
                {s.title}
              </button>
            </li>
          ))}
        </ol>
      </div>
    ) : undefined;

  return (
    <AuthLayout wide={phase === "app"} aside={aside}>
      {phase !== "done" ? (
        <div className="mb-6 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="font-semibold text-navy">Compliance</span>
          <span>›</span>
          <span className={cn(phase === "sector" ? "" : "font-semibold text-navy")}>Quality &amp; Control</span>
          {flowIdx >= 0 ? (
            <>
              <span>›</span>
              <span>
                Step {flowIdx + 1} of {flow.length}: {flow[flowIdx]!.label}
              </span>
            </>
          ) : null}
        </div>
      ) : null}

      {phase === "sector" ? (
        <ChoiceScreen
          eyebrow="Create account"
          title="Which sector are you joining?"
          desc="Beldium separates sectors so each account is reviewed against the right rules."
          options={[{ id: "compliance", title: "Compliance", desc: "Testing, inspection, certification and regulatory oversight of mineral quality.", Icon: ShieldCheck }]}
          onPick={() => setPhase("qc")}
          onBack={() => navigate({ to: "/" })}
          backLabel="Back to sign in"
        />
      ) : null}

      {phase === "qc" ? (
        <ChoiceScreen
          eyebrow="Compliance"
          title="Choose your compliance area"
          desc="Quality & Control covers everyone who samples, inspects, tests or supervises material quality."
          options={[{ id: "qc", title: "Quality & Control", desc: "Laboratories, inspectors, analysts, regulators and independent quality professionals.", Icon: FlaskConical }]}
          onPick={() => setPhase("role")}
          onBack={() => setPhase("sector")}
        />
      ) : null}

      {phase === "role" ? (
        <div>
          <p className="text-xs font-semibold tracking-[0.18em] text-link uppercase">Quality &amp; Control</p>
          <h2 className="mt-1 font-display text-2xl font-semibold text-navy">Select your role</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Sector organisations and professionals apply here. Beldium reviewer and regulatory oversight access require separate delegated authorisation; sign-up does not grant these privileges.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {roleOrder.map((k) => {
              const r = roleDefs[k];
              const Icon = roleIcons[k];
              const on = roleKey === k;
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => setRoleKey(k)}
                  aria-pressed={on}
                  className={cn(
                    "flex flex-col items-start gap-2 rounded-2xl border p-4 text-left transition",
                    on ? "border-navy bg-pale/50 ring-2 ring-navy/15" : "border-border hover:border-link",
                  )}
                >
                  <span className="flex w-full items-center justify-between">
                    <span className="grid size-10 place-items-center rounded-xl bg-pale text-navy">
                      <Icon className="size-5" />
                    </span>
                    <span className="text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
                      {r.individual ? "Individual" : "Organisation"}
                    </span>
                  </span>
                  <span className="font-display text-sm font-semibold text-navy">{r.title}</span>
                  <span className="text-xs text-muted-foreground">{r.description}</span>
                  <span className="text-[11px] text-link">{r.steps.length} application steps</span>
                </button>
              );
            })}
          </div>
          <NavRow onBack={() => setPhase("qc")} onNext={() => (roleKey ? setPhase("account") : toast.error("Select a role to continue."))} />
        </div>
      ) : null}

      {phase === "account" && def ? (
        <AccountForm
          roleTitle={def.title}
          onBack={() => setPhase("role")}
          onCreate={(input) => {
            const res = accounts.createAccount({ ...input, roleKey: def.key });
            if (!res.ok) return res.error;
            setPhase("email");
            return null;
          }}
        />
      ) : null}

      {phase === "email" && acc ? (
        <VerifyCode
          kind="email"
          target={acc.email}
          onBack={() => setPhase("account")}
          onVerified={() => {
            accounts.patchAccount(acc.id, (a) => ({ ...a, emailVerified: true }));
            setPhase("phone");
          }}
        />
      ) : null}

      {phase === "phone" && acc ? (
        <VerifyCode
          kind="phone"
          target={acc.phone}
          onBack={() => setPhase("email")}
          onVerified={() => {
            accounts.patchAccount(acc.id, (a) => ({ ...a, phoneVerified: true }));
            setStepIdx(0);
            setPhase("app");
          }}
        />
      ) : null}

      {phase === "app" && def && step ? (
        <div>
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-semibold tracking-[0.18em] text-link uppercase">
              {def.applicationType} · {stepIdx + 1}/{steps.length}
            </p>
            <div className="h-1.5 w-32 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-link transition-all" style={{ width: `${((stepIdx + 1) / steps.length) * 100}%` }} />
            </div>
          </div>
          <h2 className="mt-2 font-display text-2xl font-semibold text-navy">{step.title}</h2>
          <p className="mt-1 mb-6 text-sm text-muted-foreground">{step.description}</p>

          {step.review ? (
            <div className="space-y-3">
              {steps
                .filter((s) => !s.review)
                .map((s) => {
                  const i = steps.indexOf(s);
                  return (
                    <div key={s.id} className="rounded-2xl border border-border p-4">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-navy">{s.title}</p>
                        <button type="button" onClick={() => setStepIdx(i)} className="inline-flex items-center gap-1 text-xs font-semibold text-link">
                          <Pencil className="size-3" /> Edit
                        </button>
                      </div>
                      <dl className="mt-2 grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
                        {s.fields.map((f) => (
                          <div key={f.key} className="min-w-0">
                            <dt className="text-[11px] text-muted-foreground uppercase">{fieldLabel(f)}</dt>
                            <dd className="truncate text-sm text-navy">{summarise(f, values[f.key])}</dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  );
                })}
            </div>
          ) : (
            <StepFields
              step={step}
              values={values}
              errors={errors}
              set={(k, v) => {
                setValues((x) => ({ ...x, [k]: v }));
                setErrors((x) => ({ ...x, [k]: "" }));
              }}
            />
          )}

          <NavRow
            onBack={() => (stepIdx === 0 ? setPhase("phone") : setStepIdx(stepIdx - 1))}
            nextLabel={stepIdx === steps.length - 1 ? "Submit application" : "Continue"}
            onNext={() => {
              const e = validateStep(step, values);
              setErrors(e);
              if (Object.values(e).some(Boolean)) {
                toast.error("Please fix the highlighted fields.");
                return;
              }
              if (stepIdx < steps.length - 1) return setStepIdx(stepIdx + 1);
              // final: validate all steps
              for (let i = 0; i < steps.length; i++) {
                const ee = validateStep(steps[i]!, values);
                if (Object.values(ee).some(Boolean)) {
                  setStepIdx(i);
                  setErrors(ee);
                  toast.error(`Complete “${steps[i]!.title}” before submitting.`);
                  return;
                }
              }
              if (!acc) return;
              const app = accounts.submitApplication(acc.id, values);
              localStorage.removeItem(`beldium.draft.${acc.id}`);
              setSubmitted(app);
              setPhase("done");
            }}
          />
        </div>
      ) : null}

      {phase === "done" && submitted ? (
        <div className="py-4 text-center">
          <CheckCircle2 className="mx-auto size-14 text-success-foreground" />
          <h2 className="mt-4 font-display text-2xl font-semibold text-navy">Application submitted successfully</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Our compliance team will review every document. Sign in any time to follow progress and respond to requests.
          </p>
          <dl className="mx-auto mt-6 grid max-w-md gap-3 rounded-2xl border border-border p-5 text-left sm:grid-cols-2">
            <div>
              <dt className="text-[11px] text-muted-foreground uppercase">Reference</dt>
              <dd className="font-display font-semibold text-navy">{submitted.ref}</dd>
            </div>
            <div>
              <dt className="text-[11px] text-muted-foreground uppercase">Application type</dt>
              <dd className="text-sm font-medium text-navy">{submitted.type}</dd>
            </div>
            <div>
              <dt className="text-[11px] text-muted-foreground uppercase">Submitted</dt>
              <dd className="text-sm font-medium text-navy">{submitted.submittedAt}</dd>
            </div>
            <div>
              <dt className="text-[11px] text-muted-foreground uppercase">Status</dt>
              <dd className="mt-0.5">
                <StatusPill value="under_review" className="uppercase" />
              </dd>
            </div>
          </dl>
          <Btn
            className="mt-6"
            onClick={() => {
              accounts.signOut();
              navigate({ to: "/" });
            }}
          >
            Go to Sign In <ArrowRight className="size-4" />
          </Btn>
        </div>
      ) : null}

      {phase !== "sector" && phase !== "done" ? (
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Already have an account?{" "}
          <Link
            to="/"
            onClick={() => {
              if (acc && !acc.application) accounts.signOut();
            }}
            className="font-semibold text-link"
          >
            Sign in
          </Link>
        </p>
      ) : null}
    </AuthLayout>
  );
}

function NavRow({ onBack, onNext, nextLabel = "Continue" }: { onBack: () => void; onNext: () => void; nextLabel?: string }) {
  return (
    <div className="mt-8 flex items-center justify-between gap-3 border-t border-border pt-5">
      <Btn variant="outline" onClick={onBack}>
        <ArrowLeft className="size-4" /> Back
      </Btn>
      <Btn onClick={onNext}>
        {nextLabel} <ArrowRight className="size-4" />
      </Btn>
    </div>
  );
}

function ChoiceScreen({
  eyebrow,
  title,
  desc,
  options,
  onPick,
  onBack,
  backLabel = "Back",
}: {
  eyebrow: string;
  title: string;
  desc: string;
  options: { id: string; title: string; desc: string; Icon: typeof Building2 }[];
  onPick: () => void;
  onBack: () => void;
  backLabel?: string;
}) {
  return (
    <div>
      <p className="text-xs font-semibold tracking-[0.18em] text-link uppercase">{eyebrow}</p>
      <h2 className="mt-1 font-display text-2xl font-semibold text-navy">{title}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
      <div className="mt-6 space-y-3">
        {options.map(({ id, title: t, desc: d, Icon }) => (
          <button
            key={id}
            type="button"
            onClick={onPick}
            className="group flex w-full items-center gap-4 rounded-2xl border border-border p-5 text-left transition hover:border-link hover:shadow-[var(--shadow-lift)]"
          >
            <span className="grid size-12 place-items-center rounded-xl bg-pale text-navy">
              <Icon className="size-6" />
            </span>
            <span className="flex-1">
              <span className="block font-display font-semibold text-navy">{t}</span>
              <span className="block text-sm text-muted-foreground">{d}</span>
            </span>
            <ArrowRight className="size-5 text-link" />
          </button>
        ))}
      </div>
      <button type="button" onClick={onBack} className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-link">
        <ArrowLeft className="size-4" /> {backLabel}
      </button>
    </div>
  );
}

function AccountForm({
  roleTitle,
  onBack,
  onCreate,
}: {
  roleTitle: string;
  onBack: () => void;
  onCreate: (i: { name: string; email: string; phone: string; password: string }) => string | null;
}) {
  const [f, setF] = React.useState({ name: "", email: "", phone: "", password: "", confirm: "", terms: false });
  const [e, setE] = React.useState<Record<string, string>>({});
  const set = (k: keyof typeof f, v: string | boolean) => setF((x) => ({ ...x, [k]: v }));
  const submit = () => {
    const n: Record<string, string> = {};
    if (f.name.trim().length < 2) n["name"] = "Enter your full name.";
    if (!/^\S+@\S+\.\S+$/.test(f.email.trim())) n["email"] = "Enter a valid email address.";
    if (!/^\+?[\d\s-]{8,16}$/.test(f.phone.trim())) n["phone"] = "Enter a valid phone number, e.g. +234 803 555 0142.";
    if (f.password.length < 8 || !/\d/.test(f.password) || !/[A-Za-z]/.test(f.password)) n["password"] = "At least 8 characters with letters and a number.";
    if (f.confirm !== f.password) n["confirm"] = "Passwords do not match.";
    if (!f.terms) n["terms"] = "Accept the terms to continue.";
    setE(n);
    if (Object.keys(n).length) return;
    const err = onCreate(f);
    if (err) setE({ email: err });
  };
  const input = (k: "name" | "email" | "phone" | "password" | "confirm", label: string, type = "text") => (
    <div>
      <Label htmlFor={`a-${k}`}>{label}</Label>
      <input id={`a-${k}`} type={type} value={f[k]} onChange={(ev) => set(k, ev.target.value)} aria-invalid={!!e[k]} maxLength={120} className={inputClass} />
      <FieldError>{e[k]}</FieldError>
    </div>
  );
  return (
    <div>
      <p className="text-xs font-semibold tracking-[0.18em] text-link uppercase">{roleTitle}</p>
      <h2 className="mt-1 font-display text-2xl font-semibold text-navy">Create your account</h2>
      <p className="mt-2 text-sm text-muted-foreground">This is the account you'll keep after approval — use your work email.</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">{input("name", "Full name")}</div>
        {input("email", "Work email", "email")}
        {input("phone", "Mobile phone", "tel")}
        {input("password", "Password", "password")}
        {input("confirm", "Confirm password", "password")}
      </div>
      <label className="mt-4 flex items-start gap-2 text-sm text-navy">
        <input type="checkbox" checked={f.terms} onChange={(ev) => set("terms", ev.target.checked)} className="mt-0.5 size-4" />
        I agree to the Beldium terms of use and privacy notice.
      </label>
      <FieldError>{e["terms"]}</FieldError>
      <NavRow onBack={onBack} onNext={submit} nextLabel="Create account" />
    </div>
  );
}

function VerifyCode({
  kind,
  target,
  onBack,
  onVerified,
}: {
  kind: "email" | "phone";
  target: string;
  onBack: () => void;
  onVerified: () => void;
}) {
  const gen = () => String(Math.floor(100000 + Math.random() * 900000));
  const [sent, setSent] = React.useState(gen);
  const [code, setCode] = React.useState("");
  const [err, setErr] = React.useState("");
  const [cool, setCool] = React.useState(30);
  React.useEffect(() => {
    if (cool <= 0) return;
    const t = setTimeout(() => setCool((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cool]);
  return (
    <div>
      <p className="text-xs font-semibold tracking-[0.18em] text-link uppercase">Verify {kind}</p>
      <h2 className="mt-1 font-display text-2xl font-semibold text-navy">
        {kind === "email" ? "Check your inbox" : "Confirm your phone"}
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        We sent a 6-digit code {kind === "email" ? "to" : "by SMS to"} <span className="font-semibold text-navy">{target}</span>.
      </p>
      <p className="mt-4 rounded-xl bg-pale px-3 py-2 text-xs text-navy">
        Demo mode — your code is <span className="font-mono font-semibold">{sent}</span>
      </p>
      <div className="mt-4 max-w-xs">
        <CodeInput value={code} onChange={(v) => (setCode(v), setErr(""))} />
        <FieldError>{err}</FieldError>
        <button
          type="button"
          disabled={cool > 0}
          onClick={() => {
            setSent(gen());
            setCode("");
            setCool(30);
            toast.success("A new code was sent.");
          }}
          className="mt-3 text-xs font-semibold text-link disabled:text-muted-foreground"
        >
          {cool > 0 ? `Resend code in ${cool}s` : "Resend code"}
        </button>
      </div>
      <NavRow
        onBack={onBack}
        nextLabel={`Verify ${kind}`}
        onNext={() => {
          if (code.length !== 6) return setErr("Enter all 6 digits.");
          if (code !== sent) return setErr("That code is incorrect.");
          toast.success(kind === "email" ? "Email verified" : "Phone verified");
          onVerified();
        }}
      />
    </div>
  );
}
