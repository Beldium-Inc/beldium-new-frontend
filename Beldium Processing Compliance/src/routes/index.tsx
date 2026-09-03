import * as React from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Building2, Eye, ShieldCheck, CheckCircle2 } from "lucide-react";
import { useAppState, type Role } from "@/lib/app-state";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sign in · Beldium Processing Compliance" },
      {
        name: "description",
        content:
          "Demo sign-in for the Beldium Processing Compliance prototype — choose a Compliance Operator or Regulatory Oversight role.",
      },
      { property: "og:title", content: "Sign in · Beldium Processing Compliance" },
      {
        property: "og:description",
        content:
          "Demo sign-in for the Beldium Processing Compliance prototype — Compliance Operator or Regulatory Oversight.",
      },
    ],
  }),
  component: LoginPage,
});

const ROLES: {
  key: Role;
  name: string;
  org: string;
  who: string;
  icon: React.ElementType;
  perms: string[];
}[] = [
  {
    key: "operator",
    name: "Compliance Operator",
    org: "Beldium Processing Compliance Partner",
    who: "Olumide Adeyemi · Osun / South West desk",
    icon: ShieldCheck,
    perms: [
      "Review processor applications section by section",
      "Verify, reject, request information, flag for inspection",
      "Raise non-conformities and assess corrective-action evidence",
      "Issue decisions: Approved, Conditional, More Info, Rejected",
    ],
  },
  {
    key: "regulator",
    name: "Regulatory / Oversight User",
    org: "National Minerals Oversight Directorate",
    who: "Dr. Amina Sule · National oversight",
    icon: Eye,
    perms: [
      "National and regional compliance visibility",
      "Registered processors, facilities and inspection queue",
      "Environmental alerts, incidents and non-conformity register",
      "Read-only: no approvals, no configuration, no user administration",
    ],
  },
];

function LoginPage() {
  const { signIn } = useAppState();
  const navigate = useNavigate();
  const [selected, setSelected] = React.useState<Role>("operator");

  const enter = () => {
    signIn(selected);
    navigate({ to: "/app/dashboard" });
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      <div className="relative hidden flex-col justify-between bg-primary px-12 py-14 text-primary-foreground lg:flex">
        <div className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground">
            <ShieldCheck className="size-6" />
          </span>
          <div>
            <p className="text-base font-semibold">Beldium</p>
            <p className="text-xs text-primary-foreground/70">Processing Compliance</p>
          </div>
        </div>

        <div className="max-w-lg">
          <h1 className="text-4xl leading-tight font-semibold">
            Verified processing.
            <br />
            Traceable from input batch to output batch.
          </h1>
          <p className="mt-5 text-sm leading-relaxed text-primary-foreground/75">
            A single compliance layer for licensed mineral processors in Nigeria — corporate and
            regulatory verification, facility and environmental controls, non-conformity management
            and inspection oversight, anchored to Beldium Batch IDs.
          </p>

          <div className="mt-10 grid grid-cols-3 gap-4">
            {[
              { k: "122", v: "Registered processors" },
              { k: "18", v: "Applications in review" },
              { k: "76%", v: "National compliance score" },
            ].map((s) => (
              <div key={s.v} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <p className="text-2xl font-semibold">{s.k}</p>
                <p className="mt-1 text-[11px] text-primary-foreground/70">{s.v}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-[11px] text-primary-foreground/50">
          Prototype environment · static demonstration data · CAC, TIN, State and LGA references are
          illustrative.
        </p>
      </div>

      <div className="flex items-center justify-center bg-background px-5 py-12 sm:px-10">
        <div className="w-full max-w-md">
          <div className="lg:hidden">
            <div className="mb-8 flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <ShieldCheck className="size-5" />
              </span>
              <div>
                <p className="text-sm font-semibold">Beldium</p>
                <p className="text-[11px] text-muted-foreground">Processing Compliance</p>
              </div>
            </div>
          </div>

          <p className="text-[11px] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
            Demo access
          </p>
          <h2 className="mt-2 text-2xl font-semibold">Select a role to sign in</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            No credentials required. Sign out at any time from the profile menu to switch role.
          </p>

          <div className="mt-6 space-y-3">
            {ROLES.map((r) => {
              const Icon = r.icon;
              const active = selected === r.key;
              return (
                <button
                  key={r.key}
                  onClick={() => setSelected(r.key)}
                  className={cn(
                    "w-full rounded-2xl border p-4 text-left transition-all",
                    active
                      ? "border-primary bg-accent shadow-[0_12px_34px_-20px_rgba(16,30,61,0.6)]"
                      : "border-border bg-card hover:border-ring",
                  )}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={cn(
                        "flex size-10 shrink-0 items-center justify-center rounded-xl",
                        active ? "bg-primary text-primary-foreground" : "bg-muted text-primary",
                      )}
                    >
                      <Icon className="size-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">{r.name}</p>
                      <p className="text-xs text-muted-foreground">{r.org}</p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">{r.who}</p>
                    </div>
                    <span
                      className={cn(
                        "ml-auto mt-1 flex size-5 shrink-0 items-center justify-center rounded-full border",
                        active ? "border-primary bg-primary text-primary-foreground" : "border-border",
                      )}
                    >
                      {active ? <CheckCircle2 className="size-4" /> : null}
                    </span>
                  </div>

                  {active ? (
                    <ul className="mt-3 space-y-1.5 border-t border-border pt-3">
                      {r.perms.map((p) => (
                        <li key={p} className="flex gap-2 text-[11px] text-muted-foreground">
                          <span className="mt-1.5 size-1 shrink-0 rounded-full bg-primary" />
                          {p}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </button>
              );
            })}
          </div>

          <button
            onClick={enter}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Enter workspace <ArrowRight className="size-4" />
          </button>

          <p className="mt-5 flex items-center justify-center gap-2 text-[11px] text-muted-foreground">
            <Building2 className="size-3.5" /> Operating context: Federal Republic of Nigeria ·
            CAC / FIRS / NESREA references
          </p>
        </div>
      </div>
    </div>
  );
}
