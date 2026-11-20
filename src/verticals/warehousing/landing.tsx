import { Link, useNavigate } from "@tanstack/react-router";
import * as React from "react";
import {
  BadgeCheck,
  Boxes,
  ClipboardCheck,
  MapPin,
  PackagePlus,
  ShieldCheck,
  Siren,
  Truck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { BeldiumLogo } from "@/components/beldium-logo";
import { complianceUrl } from "@/lib/hosts";
import { useSession } from "@/lib/session";
import { homeFor } from "@/lib/verticals";

const DAILY_WORK = [
  {
    icon: PackagePlus,
    title: "Receive",
    body: "Log every inbound consignment against its waybill, weighbridge ticket and seal numbers.",
  },
  {
    icon: MapPin,
    title: "Store",
    body: "Put each lot in a named zone or bay so custody is clear at any moment.",
  },
  {
    icon: Boxes,
    title: "Track inventory",
    body: "Quantities, owners, quarantine and holds on one register for every facility.",
  },
  {
    icon: Truck,
    title: "Release",
    body: "Request releases against the owner's instruction and keep the authorisation trail.",
  },
  {
    icon: Siren,
    title: "Report incidents",
    body: "Record losses, damage, security breaches and spills, and close them with evidence.",
  },
  {
    icon: ClipboardCheck,
    title: "Stay accredited",
    body: "Keep licences, insurance and facility documents current and answer reviewer requests.",
  },
];

const STEPS = [
  "Create your account and verify your email.",
  "Register your company and its warehouses.",
  "Upload your operating licence, insurance and facility documents.",
  "A Beldium compliance partner reviews and inspects the facility.",
  "Once accredited, run receiving, inventory and releases here.",
];

/**
 * The front door of warehouse.beldium.com: for operators of mineral
 * warehouses, depots and bonded stores. The compliance partners and
 * regulators who review them use the compliance site.
 */
export function WarehouseLanding() {
  const { session, hydrated } = useSession();
  const navigate = useNavigate();

  // An operator already signed in goes straight back to the workspace.
  React.useEffect(() => {
    if (hydrated && session?.vertical === "warehousing" && session.role === "operator") {
      navigate({ to: homeFor(session.vertical, session.role), replace: true });
    }
  }, [hydrated, session, navigate]);

  return (
    <div data-vertical="warehousing" className="min-h-screen bg-muted/40">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <BeldiumLogo className="size-9" />
            <span className="leading-tight">
              <span className="block font-display text-sm font-semibold">Beldium</span>
              <span className="block text-xs text-muted-foreground">Warehouse Operators</span>
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link to="/signin">Sign in</Link>
            </Button>
            <Button asChild size="sm">
              <Link to="/onboarding/sector">Register</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <section className="rounded-[24px] border border-border bg-surface p-7 shadow-panel sm:p-12">
          <p className="text-xs font-semibold tracking-[0.18em] text-brand uppercase">
            For mineral warehouses, depots and bonded stores
          </p>
          <h1 className="mt-4 max-w-3xl font-display text-4xl leading-tight font-semibold tracking-tight sm:text-5xl">
            Run your warehouse with a custody record buyers and regulators trust
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground">
            Record every lot you receive, where it sits and when it leaves. Keep your facility
            accredited with Beldium&apos;s independent compliance partners, all in one workspace.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Button asChild size="lg">
              <Link to="/onboarding/sector">Register your warehouse</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/signin">Sign in</Link>
            </Button>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Joining your company&apos;s team? Choose{" "}
            <span className="font-medium text-foreground">Register</span>, then{" "}
            <span className="font-medium text-foreground">
              Join your company&apos;s warehouse team
            </span>{" "}
            and enter the code your administrator gave you.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="font-display text-xl font-semibold">What you do here</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {DAILY_WORK.map(({ icon: Icon, title, body }) => (
              <div key={title} className="rounded-[18px] border border-border bg-card p-5">
                <Icon className="size-5 text-brand" />
                <p className="mt-3 font-display text-base font-semibold">{title}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-10 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <div className="rounded-[18px] border border-border bg-card p-6">
            <h2 className="font-display text-xl font-semibold">How accreditation works</h2>
            <ol className="mt-4 space-y-3">
              {STEPS.map((step, i) => (
                <li key={step} className="flex gap-3 text-sm">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-brand-soft font-semibold text-brand">
                    {i + 1}
                  </span>
                  <span className="pt-0.5 text-muted-foreground">{step}</span>
                </li>
              ))}
            </ol>
          </div>
          <div className="space-y-4">
            <div className="rounded-[18px] bg-brand-soft/60 p-6">
              <ShieldCheck className="size-5 text-brand" />
              <p className="mt-3 font-display text-base font-semibold text-brand">
                Independent review
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                Your application is reviewed by an accredited compliance partner, not by Beldium
                sales or by you. Regulators see the outcome read-only.
              </p>
            </div>
            <div className="rounded-[18px] bg-brand-soft/60 p-6">
              <BadgeCheck className="size-5 text-brand" />
              <p className="mt-3 font-display text-base font-semibold text-brand">
                Not a government permit
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                Beldium accreditation is an independent verification record. It does not replace
                your operating licence or any statutory approval.
              </p>
            </div>
          </div>
        </section>

        <p className="mt-10 text-center text-sm text-muted-foreground">
          A compliance firm or regulator reviewing warehouses?{" "}
          <a href={complianceUrl("/signin")} className="font-semibold text-brand underline">
            Go to the compliance site
          </a>
        </p>
      </main>
    </div>
  );
}
