import * as React from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Gauge,
  Landmark,
  Lock,
  Mail,
  Settings,
  ShieldCheck,
} from "lucide-react";
import { demoAccounts, type Role } from "@/lib/mock-data";
import { useApp } from "@/lib/app-state";
import { BeldiumMark, Pill } from "@/components/beldium/bits";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sign in — Beldium Logistics Compliance" },
      {
        name: "description",
        content:
          "Role-aware sign in for Beldium: compliance operators, logistics partners and regulatory oversight officers.",
      },
      { property: "og:title", content: "Sign in — Beldium Logistics Compliance" },
      {
        property: "og:description",
        content: "Choose a demo role to explore the Beldium logistics compliance workspace.",
      },
    ],
  }),
  component: SignIn,
});

const HOME: Record<Role, string> = {
  operator: "/operator",
  partner: "/partner",
  regulator: "/regulator",
  admin: "/admin",
};

const ROLE_ICON: Record<Role, React.ComponentType<{ className?: string }>> = {
  operator: ShieldCheck,
  partner: Building2,
  regulator: Landmark,
  admin: Settings,
};

function SignIn() {
  const { signIn, session, hydrated } = useApp();
  const navigate = useNavigate();
  const [role, setRole] = React.useState<Role>("operator");
  const account = demoAccounts.find((a) => a.role === role)!;
  const [email, setEmail] = React.useState(account.email);
  const [password, setPassword] = React.useState(account.password);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    setEmail(account.email);
    setPassword(account.password);
    setError("");
  }, [account]);

  React.useEffect(() => {
    if (hydrated && session) navigate({ to: HOME[session.role] });
  }, [hydrated, session, navigate]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim().toLowerCase() !== account.email || password !== account.password) {
      setError("Credentials do not match the selected demo role. Use the pre-filled values.");
      return;
    }
    signIn(role);
    navigate({ to: HOME[role] });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto grid min-h-screen max-w-7xl grid-cols-1 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="relative hidden flex-col justify-between bg-[var(--brand)] p-10 text-white lg:flex">
          <BeldiumMark dark />
          <div className="max-w-lg">
            <p className="text-xs font-semibold tracking-[0.2em] text-[var(--brand-soft)] uppercase">
              Logistics compliance, continuously assured
            </p>
            <h1 className="mt-4 font-display text-4xl leading-tight font-semibold">
              One verified register for operators, partners and regulators.
            </h1>
            <p className="mt-4 text-sm text-white/70">
              Beldium standardises corporate, fleet, driver, insurance, safety and mineral-transport checks into a single
              auditable review — with continuous monitoring that flags expiries and restricts scope before risk becomes
              exposure.
            </p>
            <ul className="mt-8 space-y-3 text-sm text-white/80">
              {[
                "Nine-domain verification workflow with inline document review",
                "Continuous expiry monitoring and automatic scope restrictions",
                "Read-only regulatory oversight with full audit lineage",
              ].map((t) => (
                <li key={t} className="flex items-start gap-2.5">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--success)]" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="grid grid-cols-3 gap-4 border-t border-white/10 pt-6">
            {[
              { label: "Registered operators", value: "59" },
              { label: "Documents verified", value: "1,284" },
              { label: "Avg. review time", value: "6.2 days" },
            ].map((s) => (
              <div key={s.label}>
                <p className="font-display text-2xl font-semibold">{s.value}</p>
                <p className="text-[11px] text-white/50">{s.label}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="flex flex-col justify-center px-5 py-10 sm:px-10">
          <div className="lg:hidden">
            <BeldiumMark />
          </div>
          <div className="mt-6 lg:mt-0">
            <Pill tone="info">Prototype · mock data only</Pill>
            <h2 className="mt-3 font-display text-2xl font-semibold text-[var(--brand)]">Sign in to your portal</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Select a demo role — credentials are filled in automatically so you can move between complete flows.
            </p>
          </div>

          <div className="mt-6 grid gap-2.5">
            {demoAccounts.map((a) => {
              const Icon = ROLE_ICON[a.role];
              const active = a.role === role;
              return (
                <button
                  key={a.role}
                  type="button"
                  onClick={() => setRole(a.role)}
                  className={cn(
                    "flex items-start gap-3 rounded-xl border bg-card p-3.5 text-left transition",
                    active
                      ? "border-[var(--link)] ring-1 ring-[var(--link)]/25 shadow-[0_6px_20px_rgba(37,99,235,0.10)]"
                      : "border-border hover:border-[var(--link)]/40",
                  )}
                >
                  <span
                    className={cn(
                      "grid h-9 w-9 shrink-0 place-items-center rounded-lg",
                      active ? "bg-[var(--brand)] text-white" : "bg-[var(--brand-soft)] text-[var(--brand)]",
                    )}
                  >
                    <Icon className="h-4.5 w-4.5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="font-display text-sm font-semibold text-[var(--brand)]">{a.label}</span>
                      {a.role === "operator" ? <Pill tone="success">Primary flow</Pill> : null}
                    </span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">{a.blurb}</span>
                    <span className="mt-1 block text-[11px] text-muted-foreground">
                      {a.person} · {a.title}
                    </span>
                  </span>
                  {active ? <ArrowRight className="mt-2 h-4 w-4 text-[var(--link)]" /> : null}
                </button>
              );
            })}
          </div>

          <form onSubmit={submit} className="mt-6 space-y-3.5">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-xs font-medium text-[var(--brand)]">
                Work email
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-input bg-white py-2.5 pr-3 pl-9 text-sm outline-none focus:border-[var(--link)] focus:ring-2 focus:ring-[var(--link)]/20"
                />
              </div>
            </div>
            <div>
              <label htmlFor="password" className="mb-1.5 block text-xs font-medium text-[var(--brand)]">
                Password
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-input bg-white py-2.5 pr-3 pl-9 text-sm outline-none focus:border-[var(--link)] focus:ring-2 focus:ring-[var(--link)]/20"
                />
              </div>
            </div>
            {error ? (
              <p className="rounded-lg border border-[var(--danger)]/50 bg-[var(--danger)]/15 px-3 py-2 text-xs text-[var(--danger-foreground)]">
                {error}
              </p>
            ) : null}
            <button
              type="submit"
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--brand)] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[var(--brand)]/90"
            >
              Sign in as {account.label}
              <ArrowRight className="h-4 w-4" />
            </button>
            <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <Gauge className="h-3.5 w-3.5" />
              Demo credentials: {account.email} / {account.password}
            </p>
          </form>
        </section>
      </div>
    </div>
  );
}
