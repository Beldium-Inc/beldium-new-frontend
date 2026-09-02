import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Building2, ChevronRight, ClipboardCheck, Landmark, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStore } from "@/lib/prototype/store";
import { users } from "@/lib/prototype/data";
import type { Role } from "@/lib/prototype/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sign in · Beldium Mining Compliance" },
      {
        name: "description",
        content:
          "Prototype sign-in for the Beldium mining compliance workspace. Choose a Compliance Partner, Miner or Regulatory Oversight demo role.",
      },
      { property: "og:title", content: "Sign in · Beldium Mining Compliance" },
      {
        property: "og:description",
        content: "Choose a demo role to explore the Beldium mining compliance prototype.",
      },
    ],
  }),
  component: LoginPage,
});

const roleCards: { role: Role; icon: typeof ShieldCheck; blurb: string; scope: string }[] = [
  {
    role: "partner",
    icon: ClipboardCheck,
    blurb: "Full review workspace: applications, mine reviews, scoring, inspections, non-conformities and reporting.",
    scope: "Primary workflow",
  },
  {
    role: "miner",
    icon: Building2,
    blurb: "Operator view of your organisation, sites, licences, production and outstanding compliance actions.",
    scope: "Operator",
  },
  {
    role: "regulator",
    icon: Landmark,
    blurb: "Read-mostly oversight of the register, licence status, inspections, alerts and audit history.",
    scope: "Oversight",
  },
];

const roleTitle: Record<Role, string> = {
  partner: "Mining Compliance Partner",
  miner: "Miner",
  regulator: "Regulatory Oversight User",
};

function LoginPage() {
  const { login } = useStore();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<Role>("partner");

  const signIn = () => {
    login(selected);
    navigate({ to: "/app/dashboard" });
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <aside className="relative hidden flex-col justify-between bg-sidebar p-12 text-sidebar-foreground lg:flex">
        <div className="flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-md bg-sidebar-primary font-display text-base font-bold text-sidebar-primary-foreground">
            B
          </div>
          <div>
            <p className="font-display text-base font-semibold text-sidebar-accent-foreground">Beldium</p>
            <p className="text-xs text-sidebar-foreground/70">Mining Compliance Platform</p>
          </div>
        </div>

        <div className="max-w-md">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sidebar-foreground/60">Prototype environment</p>
          <h1 className="mt-3 font-display text-3xl leading-tight font-semibold text-sidebar-accent-foreground">
            Compliance assurance for Nigeria&apos;s lithium mining sector.
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-sidebar-foreground/80">
            Review mining organisations, licences, site verification, environmental and safety performance, sampling results and
            corrective actions in one auditable workspace.
          </p>
          <dl className="mt-10 grid grid-cols-3 gap-6">
            {[
              { k: "Organisations", v: "4" },
              { k: "Mine sites", v: "8" },
              { k: "Open reviews", v: "7" },
            ].map((s) => (
              <div key={s.k}>
                <dd className="font-display text-2xl font-semibold text-sidebar-accent-foreground">{s.v}</dd>
                <dt className="text-[11px] uppercase tracking-wide text-sidebar-foreground/60">{s.k}</dt>
              </div>
            ))}
          </dl>
        </div>

        <p className="text-[11px] text-sidebar-foreground/50">
          Demonstration prototype. All organisations, sites and results shown are fictional seeded data.
        </p>
      </aside>

      <main className="flex items-center justify-center bg-background px-5 py-10">
        <div className="w-full max-w-lg">
          <div className="mb-8 lg:hidden">
            <div className="mb-3 grid size-10 place-items-center rounded-md bg-brand font-display text-base font-bold text-brand-foreground">
              B
            </div>
            <h1 className="font-display text-xl font-semibold">Beldium Mining Compliance</h1>
            <p className="text-sm text-muted-foreground">Prototype — choose a demo role to continue.</p>
          </div>

          <div className="rounded-lg border border-border bg-surface p-6 shadow-panel sm:p-8">
            <h2 className="font-display text-lg font-semibold">Sign in to the workspace</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Select the role you want to explore. No password is validated in this prototype — you can log out and switch role at
              any time.
            </p>

            <div className="mt-6 space-y-3">
              {roleCards.map(({ role, icon: Icon, blurb, scope }) => {
                const active = selected === role;
                return (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setSelected(role)}
                    aria-pressed={active}
                    className={cn(
                      "flex w-full items-start gap-3.5 rounded-md border p-4 text-left transition-colors",
                      active ? "border-brand bg-brand-soft/60 ring-1 ring-brand" : "border-border bg-surface hover:bg-muted",
                    )}
                  >
                    <span
                      className={cn(
                        "grid size-9 shrink-0 place-items-center rounded-md",
                        active ? "bg-brand text-brand-foreground" : "bg-muted text-muted-foreground",
                      )}
                    >
                      <Icon className="size-4.5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="font-display text-sm font-semibold">{roleTitle[role]}</span>
                        <span className="rounded-full border border-border px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                          {scope}
                        </span>
                      </span>
                      <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">{blurb}</span>
                      <span className="mt-1.5 block text-[11px] text-muted-foreground/80">
                        Signs in as {users[role].name} · {users[role].org}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="email">Work email</Label>
                <Input id="email" type="email" defaultValue={`${selected}@beldium.demo`} readOnly />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" defaultValue="demo-prototype" readOnly />
              </div>
            </div>

            <Button className="mt-6 w-full" size="lg" onClick={signIn}>
              Continue as {roleTitle[selected]} <ChevronRight className="size-4" />
            </Button>

            <p className="mt-4 text-center text-[11px] text-muted-foreground">
              Prototype / demo build — no backend, no external integrations. Data resets from the sidebar.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
