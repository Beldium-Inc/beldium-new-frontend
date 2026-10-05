import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import * as React from "react";
import { FileCheck2, MapPin, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { BeldiumLogo } from "@/components/beldium-logo";
import { useSession } from "@/lib/session";
import { COMPLIANCE_VERTICALS, homeFor } from "@/lib/verticals";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Beldium Compliance Platform" },
      {
        name: "description",
        content:
          "Independent compliance verification across the Nigerian minerals value chain: mining, processing, quality, warehousing, logistics, export and marketplace.",
      },
      { property: "og:title", content: "Beldium Compliance Platform" },
      {
        property: "og:description",
        content: "Register or sign in to the Beldium compliance platform.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: EntryPage,
});

const highlights = [
  {
    icon: ShieldCheck,
    title: "Verified partners",
    body: "Organisation verification, conflict of interest and independence checks.",
  },
  {
    icon: FileCheck2,
    title: "Document assurance",
    body: "Corporate, professional, governance and insurance documentation.",
  },
  {
    icon: MapPin,
    title: "Field inspection",
    body: "GPS-backed site inspection capability across Nigerian states.",
  },
];

function EntryPage() {
  const { session, hydrated } = useSession();
  const navigate = useNavigate();

  // An existing session goes straight back to its workspace.
  React.useEffect(() => {
    if (hydrated && session) {
      navigate({ to: homeFor(session.vertical, session.role) });
    }
  }, [hydrated, session, navigate]);

  return (
    <div className="min-h-screen bg-muted/40 px-4 py-10 sm:px-6 sm:py-14">
      <div className="mx-auto w-full max-w-5xl">
        <div className="mb-8 flex items-center gap-3">
          <BeldiumLogo className="size-10" />
          <p className="text-xs font-semibold tracking-[0.18em] text-brand uppercase">
            Beldium · Compliance Platform
          </p>
        </div>

        <div className="rounded-[24px] border border-border bg-surface p-7 shadow-panel sm:p-12">
          <h1 className="max-w-2xl font-display text-4xl leading-tight font-semibold tracking-tight sm:text-5xl">
            Compliance assurance across the minerals value chain
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground">
            Register your organisation to review, verify, monitor or provide compliance services
            across any of the seven Beldium compliance sectors, from pit to port.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-5">
            <Button asChild size="lg">
              <Link to="/onboarding/sector">Get started</Link>
            </Button>
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link to="/signin" className="font-semibold text-brand underline">
                Sign in
              </Link>
            </p>
          </div>

          <p className="mt-4 text-sm text-muted-foreground">
            Registering as a miner or mining organisation?{" "}
            <a
              href={import.meta.env["VITE_MINER_PORTAL_URL"] ?? "http://localhost:5174"}
              className="font-semibold text-brand underline"
            >
              Go to the Miner Portal
            </a>{" "}
            A separate, standalone workspace for your organisation, sites and compliance.
          </p>

          <div className="mt-12 grid gap-4 sm:grid-cols-3">
            {highlights.map(({ icon: Icon, title, body }) => (
              <div key={title} className="rounded-[18px] bg-brand-soft/60 p-5">
                <Icon className="size-5 text-brand" />
                <p className="mt-3 font-display text-base font-semibold text-brand">{title}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{body}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 border-t border-border pt-8">
            <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              Seven compliance sectors
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {COMPLIANCE_VERTICALS.map((v) => (
                <span
                  key={v.slug}
                  className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium"
                >
                  {v.name}
                </span>
              ))}
            </div>
          </div>
        </div>

        <p className="mt-8 text-center text-[11px] text-muted-foreground">
          Accounts and email verification are live. Compliance review steps are still simulated in
          your browser.
        </p>
      </div>
    </div>
  );
}
