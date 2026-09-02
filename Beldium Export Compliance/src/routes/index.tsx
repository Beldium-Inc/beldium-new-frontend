import { createFileRoute, useNavigate } from "@tanstack/react-router";
import * as React from "react";
import { ArrowRight, Building2, Gauge, ShieldCheck, Sparkles } from "lucide-react";
import { useStore } from "@/lib/store";
import { DEMO_USERS, DISCLAIMER, type Role } from "@/lib/mock-data";
import { ROLE_HOME } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Beldium Export Compliance — Demo Sign In" },
      {
        name: "description",
        content:
          "Demo sign-in for Beldium Export Compliance: review Nigerian mineral export consignments as a compliance operator, exporter, or regulatory oversight user.",
      },
      { property: "og:title", content: "Beldium Export Compliance — Demo Sign In" },
      {
        property: "og:description",
        content:
          "Explore the Beldium compliance workflow for Nigerian mineral exports across three demo roles.",
      },
    ],
  }),
  component: LoginPage,
});

const ROLE_CARDS: {
  role: Role;
  icon: React.ElementType;
  blurb: string;
  capabilities: string[];
  primary?: boolean;
}[] = [
  {
    role: "operator",
    icon: ShieldCheck,
    primary: true,
    blurb: "Full review workflow: work queue, exporter verification, document actions, non-conformities and compliance decisions.",
    capabilities: ["Verify documents", "Raise non-conformities", "Issue compliance records"],
  },
  {
    role: "exporter",
    icon: Building2,
    blurb: "Submit consignments, track readiness and respond to Beldium requests for information.",
    capabilities: ["Create shipments", "Upload documents", "Respond to findings"],
  },
  {
    role: "regulator",
    icon: Gauge,
    blurb: "Read-only oversight of compliance activity with limited intervention rights.",
    capabilities: ["View records", "Request info", "Flag & acknowledge"],
  },
];

function LoginPage() {
  const { login, user } = useStore();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (user) navigate({ to: ROLE_HOME[user.role] });
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-primary text-primary-foreground">
      <div className="mx-auto grid min-h-screen w-full max-w-[1400px] gap-10 px-6 py-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-center lg:py-16">
        <div className="space-y-8">
          <div className="flex items-center gap-2.5">
            <span className="grid size-10 place-items-center rounded-xl bg-accent text-accent-foreground">
              <ShieldCheck className="size-5" />
            </span>
            <div className="leading-tight">
              <p className="font-display text-base font-semibold">Beldium</p>
              <p className="text-xs text-accent/80">Export Compliance</p>
            </div>
          </div>

          <div className="space-y-4">
            <span className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
              <Sparkles className="size-3.5" /> Prototype · seeded demo data
            </span>
            <h1 className="font-display text-4xl leading-tight font-semibold sm:text-5xl">
              Compliance assurance for Nigerian mineral exports
            </h1>
            <p className="max-w-lg text-sm leading-relaxed text-primary-foreground/75">
              Beldium verifies exporters, interrogates consignment evidence section by section, and
              issues an independent compliance verification record before cargo leaves the country.
            </p>
          </div>

          <dl className="grid max-w-lg grid-cols-3 gap-4 border-t border-primary-foreground/15 pt-6">
            {[
              ["6", "Live consignments"],
              ["4", "Exporters on file"],
              ["13", "Review sections"],
            ].map(([v, l]) => (
              <div key={l}>
                <dt className="font-display text-2xl font-semibold text-accent">{v}</dt>
                <dd className="text-xs text-primary-foreground/65">{l}</dd>
              </div>
            ))}
          </dl>

          <p className="max-w-lg rounded-lg border border-primary-foreground/15 bg-primary-foreground/5 px-4 py-3 text-xs leading-relaxed text-primary-foreground/70">
            {DISCLAIMER}
          </p>
        </div>

        <div className="rounded-2xl bg-card p-6 text-card-foreground shadow-raised sm:p-8">
          <h2 className="font-display text-xl font-semibold">Choose a demo role</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            No password required. You can log out and switch roles at any time.
          </p>
          <div className="mt-6 space-y-3">
            {ROLE_CARDS.map((card) => {
              const demo = DEMO_USERS.find((u) => u.role === card.role)!;
              return (
                <button
                  key={card.role}
                  onClick={() => login(card.role)}
                  className={cn(
                    "group w-full rounded-xl border border-border bg-card p-4 text-left transition-all hover:border-primary hover:shadow-card",
                    card.primary && "border-primary/30 bg-accent/30",
                  )}
                >
                  <div className="flex items-start gap-4">
                    <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground">
                      <card.icon className="size-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-display text-sm font-semibold">{demo.title}</p>
                        {card.primary && (
                          <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold tracking-wide text-primary-foreground uppercase">
                            Primary
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {demo.name} · {demo.org}
                      </p>
                      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                        {card.blurb}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {card.capabilities.map((c) => (
                          <span
                            key={c}
                            className="rounded-full bg-secondary px-2 py-0.5 text-[11px] text-secondary-foreground"
                          >
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>
                    <ArrowRight className="mt-1 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                  </div>
                </button>
              );
            })}
          </div>
          <Button className="mt-6 w-full" size="lg" onClick={() => login("operator")}>
            Continue as compliance operator
          </Button>
        </div>
      </div>
    </div>
  );
}
