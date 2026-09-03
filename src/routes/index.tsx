import { createFileRoute, useNavigate } from "@tanstack/react-router";
import * as React from "react";
import {
  ArrowLeft,
  ArrowRight,
  Boxes,
  FlaskConical,
  Factory,
  Landmark,
  Mountain,
  ShieldCheck,
  Ship,
  Sparkles,
  Store,
  Truck,
  Warehouse,
} from "lucide-react";

import { useSession } from "@/lib/session";
import {
  VERTICALS,
  homeFor,
  type Vertical,
  type VerticalSlug,
} from "@/lib/verticals";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Beldium Compliance — Sign In" },
      {
        name: "description",
        content:
          "Sign in to Beldium Compliance. Choose the compliance partner you are — mining, processing, quality, warehousing, logistics, export or marketplace — to enter your workspace.",
      },
      { property: "og:title", content: "Beldium Compliance — Sign In" },
      {
        property: "og:description",
        content:
          "One sign-in across the Beldium compliance platform. Choose your compliance partner to continue.",
      },
    ],
  }),
  component: SignInPage,
});

const DISCLAIMER =
  "Beldium issues an independent compliance verification record. It is not a government permit, licence, or customs clearance and does not replace any statutory approval.";

const VERTICAL_ICON: Record<VerticalSlug, React.ElementType> = {
  mining: Mountain,
  processing: Factory,
  export: Ship,
  quality: FlaskConical,
  warehousing: Warehouse,
  logistics: Truck,
  marketplace: Store,
};

const ROLE_ICON: Record<string, React.ElementType> = {
  operator: ShieldCheck,
  partner: ShieldCheck,
  regulator: Landmark,
  admin: Landmark,
  exporter: Ship,
  miner: Mountain,
  buyer: Store,
  offtaker: Boxes,
  oem: Factory,
};

function SignInPage() {
  const { session, hydrated, signIn } = useSession();
  const navigate = useNavigate();
  const [picked, setPicked] = React.useState<Vertical | null>(null);

  // Already signed in — go straight back to that workspace.
  React.useEffect(() => {
    if (hydrated && session) {
      navigate({ to: homeFor(session.vertical, session.role) });
    }
  }, [hydrated, session, navigate]);

  const choose = (vertical: VerticalSlug, role: string) => {
    signIn(vertical, role);
    navigate({ to: homeFor(vertical, role) });
  };

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
              <p className="text-xs text-accent/80">Compliance Platform</p>
            </div>
          </div>

          <div className="space-y-4">
            <span className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
              <Sparkles className="size-3.5" /> Prototype · seeded demo data
            </span>
            <h1 className="font-display text-4xl leading-tight font-semibold sm:text-5xl">
              Compliance assurance across the minerals value chain
            </h1>
            <p className="max-w-lg text-sm leading-relaxed text-primary-foreground/75">
              Beldium verifies operators, interrogates evidence section by section, and issues an
              independent compliance verification record at every stage — from pit to port.
            </p>
          </div>

          <dl className="grid max-w-lg grid-cols-3 gap-4 border-t border-primary-foreground/15 pt-6">
            {[
              ["7", "Compliance domains"],
              ["9", "Partner roles"],
              ["1", "Verification standard"],
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
          {picked === null ? (
            <>
              <h2 className="font-display text-xl font-semibold">
                Which compliance partner are you?
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                No password required. Your selection determines the workspace you enter.
              </p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {VERTICALS.map((vertical) => {
                  const Icon = VERTICAL_ICON[vertical.slug];
                  return (
                    <button
                      key={vertical.slug}
                      onClick={() => setPicked(vertical)}
                      className="group rounded-xl border border-border bg-card p-4 text-left transition-all hover:border-primary hover:shadow-card"
                    >
                      <div className="flex items-start gap-3">
                        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground">
                          <Icon className="size-4.5" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="font-display text-sm font-semibold">{vertical.name}</p>
                          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                            {vertical.tagline}
                          </p>
                          <p className="mt-2 text-[11px] text-muted-foreground/80">
                            {vertical.roles.length} roles
                          </p>
                        </div>
                        <ArrowRight className="mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            <>
              <button
                onClick={() => setPicked(null)}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                <ArrowLeft className="size-3.5" /> All compliance partners
              </button>
              <h2 className="mt-4 font-display text-xl font-semibold">{picked.name}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Choose your role. You can sign out and switch at any time.
              </p>
              <div className="mt-6 space-y-3">
                {picked.roles.map((role, i) => {
                  const Icon = ROLE_ICON[role.id] ?? ShieldCheck;
                  return (
                    <button
                      key={role.id}
                      onClick={() => choose(picked.slug, role.id)}
                      className={cn(
                        "group w-full rounded-xl border border-border bg-card p-4 text-left transition-all hover:border-primary hover:shadow-card",
                        i === 0 && "border-primary/30 bg-accent/30",
                      )}
                    >
                      <div className="flex items-start gap-4">
                        <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground">
                          <Icon className="size-5" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-display text-sm font-semibold">{role.label}</p>
                            {i === 0 && (
                              <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold tracking-wide text-primary-foreground uppercase">
                                Primary
                              </span>
                            )}
                          </div>
                          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                            {role.blurb}
                          </p>
                        </div>
                        <ArrowRight className="mt-1 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                      </div>
                    </button>
                  );
                })}
              </div>
              <Button
                className="mt-6 w-full"
                size="lg"
                onClick={() => choose(picked.slug, picked.roles[0]!.id)}
              >
                Continue as {picked.roles[0]!.label.toLowerCase()}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
