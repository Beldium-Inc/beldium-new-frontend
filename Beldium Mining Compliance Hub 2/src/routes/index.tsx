import { createFileRoute, Link } from "@tanstack/react-router";
import { FileCheck2, MapPin, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BeldiumMark } from "@/components/brand";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Join Beldium Mining Compliance" },
      {
        name: "description",
        content:
          "Register your organisation to review, verify, monitor or provide compliance services for mining operations within the Beldium ecosystem.",
      },
      { property: "og:title", content: "Join Beldium Mining Compliance" },
      {
        property: "og:description",
        content: "Register or sign in to the Beldium mining compliance platform.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
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
    body: "GPS-backed mine site inspection capability across Nigerian states.",
  },
];

function EntryPage() {
  return (
    <div className="min-h-screen bg-muted/40 px-4 py-10 sm:px-6 sm:py-14">
      <div className="mx-auto w-full max-w-5xl">
        <div className="mb-8 flex items-center gap-3">
          <BeldiumMark />
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">Beldium · Compliance · Mining</p>
        </div>

        <div className="rounded-[24px] border border-border bg-surface p-7 shadow-panel sm:p-12">
          <h1 className="max-w-2xl font-display text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
            Join Beldium Mining Compliance
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground">
            Register your organisation to review, verify, monitor or provide compliance services for mining operations within the
            Beldium ecosystem.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-5">
            <Button asChild size="lg">
              <Link to="/onboarding/role">Get Started</Link>
            </Button>
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link to="/signin" className="font-semibold text-brand underline">
                Sign In
              </Link>
            </p>
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-3">
            {highlights.map(({ icon: Icon, title, body }) => (
              <div key={title} className="rounded-[18px] bg-brand-soft/60 p-5">
                <Icon className="size-5 text-brand" />
                <p className="mt-3 font-display text-base font-semibold text-brand">{title}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{body}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="mt-8 text-center text-[11px] text-muted-foreground">
          Prototype / demo build — verification steps are simulated locally in your browser.
        </p>
      </div>
    </div>
  );
}
