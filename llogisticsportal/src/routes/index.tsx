import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ClipboardList,
  FileCheck2,
  FlaskConical,
  MapPinned,
  ShieldCheck,
  Truck,
} from "lucide-react";

import { BeldiumLockup, BeldiumMark } from "@/components/beldium-logo";
import { Button } from "@/components/ui/button";

const title = "Beldium Logistics Hub - Logistics operator onboarding & operations";
const description =
  "Register a logistics organisation, get your fleet and drivers verified, and run sample and bulk mineral movements from the Beldium Logistics Hub.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const features = [
  {
    icon: ClipboardList,
    title: "Operator application",
    body: "Organisation, capability, fleet, drivers, documents, compliance and declaration.",
  },
  {
    icon: FileCheck2,
    title: "Review workspace",
    body: "Track the verification timeline and answer information requests with evidence.",
  },
  {
    icon: Truck,
    title: "Transport requests",
    body: "Accept, schedule and assign vehicles and drivers to mineral movements.",
  },
  {
    icon: MapPinned,
    title: "Live movements",
    body: "Follow every sample and bulk movement from pickup to delivery.",
  },
  {
    icon: FlaskConical,
    title: "Chain of custody",
    body: "Sample handovers, weighbridge tonnage and delivery evidence on one record.",
  },
  {
    icon: ShieldCheck,
    title: "Compliance",
    body: "Vehicle, driver and document validity gating every assignment.",
  },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6">
          <BeldiumLockup />
          <div className="flex items-center gap-2">
            <Button variant="ghost" asChild>
              <Link to="/auth">Sign in</Link>
            </Button>
            <Button asChild>
              <Link to="/signup">Get started</Link>
            </Button>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden border-b border-border bg-sidebar">
        <div className="absolute inset-0" aria-hidden>
          <img src="/leftside-animation.gif" alt="" className="h-full w-full object-cover" />
        </div>
        <div className="absolute inset-0 bg-sidebar/85" aria-hidden />
        <div className="relative mx-auto grid w-full max-w-6xl gap-12 px-6 py-20 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div>
            <p className="text-xs font-semibold tracking-[0.22em] text-accent uppercase">
              Logistics operator portal
            </p>
            <h1 className="mt-4 text-4xl leading-[1.1] font-semibold tracking-tight text-sidebar-foreground sm:text-5xl">
              Get your fleet verified, then move minerals.
            </h1>
            <p className="mt-5 max-w-xl text-base text-sidebar-foreground/80">
              Beldium Logistics Hub takes a logistics organisation from signup and verification
              through to a full operations workspace: transport requests, live movements, fleet,
              drivers, deliveries and payments.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" asChild>
                <Link to="/signup">Create an operator account</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/auth" className="bg-background/90">
                  I already have an account
                </Link>
              </Button>
            </div>
          </div>

          <div
            className="rounded-md border border-sidebar-border bg-sidebar/80 p-8 text-sidebar-foreground backdrop-blur-sm"
            style={{ boxShadow: "var(--shadow-panel)" }}
          >
            <BeldiumMark className="h-12 w-12" />
            <div className="mt-6 space-y-4 text-sm">
              {[
                [
                  "01",
                  "Choose how you join",
                  "New organisation, join an existing one, or independent operator.",
                ],
                [
                  "02",
                  "Verify your email",
                  "Confirm your identity before the application unlocks.",
                ],
                [
                  "03",
                  "Complete the application",
                  "Fleet, drivers, documents and compliance answers.",
                ],
                [
                  "04",
                  "Track review, then operate",
                  "Answer requests, get verified, run movements.",
                ],
              ].map(([n, h, b]) => (
                <div
                  key={n}
                  className="flex gap-4 border-b border-sidebar-border pb-4 last:border-0 last:pb-0"
                >
                  <span className="text-xs font-semibold text-accent">{n}</span>
                  <div>
                    <div className="font-medium">{h}</div>
                    <div className="text-sidebar-foreground/70">{b}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 py-16">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">Inside the hub</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="rounded-md border border-border bg-card p-5">
              <f.icon className="h-5 w-5 text-accent" />
              <h3 className="mt-3 font-medium text-card-foreground">{f.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-8 text-xs text-muted-foreground">
          <BeldiumLockup />
          <span>Beldium Logistics Hub</span>
        </div>
      </footer>
    </div>
  );
}
