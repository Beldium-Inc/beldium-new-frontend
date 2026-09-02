import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Factory, ShieldCheck, ShoppingCart, Warehouse } from "lucide-react";
import { ROLE_LABEL, useDemo } from "@/lib/store";
import type { Role } from "@/lib/demo-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Demo login — Beldium Marketplace Compliance" },
      {
        name: "description",
        content:
          "Choose a demo role to explore the Beldium compliance desk, RFQ aggregation and trade finance workflows.",
      },
      { property: "og:title", content: "Demo login — Beldium Marketplace Compliance" },
      {
        property: "og:description",
        content: "Sign in as Compliance Operator, Buyer, Offtaker or OEM to explore the prototype.",
      },
    ],
  }),
  component: DemoLogin,
});

const ROLES: {
  role: Role;
  icon: typeof ShieldCheck;
  blurb: string;
  points: string[];
}[] = [
  {
    role: "operator",
    icon: ShieldCheck,
    blurb: "Partner onboarding desk — review, verify and restrict counterparties.",
    points: ["Application queue & review workspace", "Risk, ownership & document checks", "Non-conformity workflow & audit trail"],
  },
  {
    role: "offtaker",
    icon: Warehouse,
    blurb: "Long-term offtake programmes with aggregated mine supply.",
    points: ["Create million-tonne offtake RFQs", "Aggregate verified miner capacity", "Structure transaction services & finance"],
  },
  {
    role: "buyer",
    icon: ShoppingCart,
    blurb: "Spot and term purchasing across verified producers.",
    points: ["Find supply & compare offers", "Track orders and shipments", "Monitor own compliance standing"],
  },
  {
    role: "oem",
    icon: Factory,
    blurb: "Industrial demand planning against secured feedstock.",
    points: ["Plant demand vs. contracted cover", "Supplier compliance visibility", "Traceability documents"],
  },
];

function DemoLogin() {
  const { login } = useDemo();
  const navigate = useNavigate();

  const enter = (role: Role) => {
    login(role);
    navigate({ to: "/dashboard" });
  };

  return (
    <div className="min-h-screen lg:flex">
      <div className="navy-panel px-6 py-12 sm:px-10 lg:w-[38%] lg:py-16">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-md bg-secondary font-display text-lg font-bold text-primary">
            B
          </span>
          <span className="font-display text-lg font-semibold">Beldium</span>
        </div>
        <h1 className="font-display mt-10 text-3xl leading-tight font-semibold sm:text-4xl">
          Compliance-first minerals marketplace
        </h1>
        <p className="mt-4 max-w-md text-sm leading-relaxed text-primary-foreground/70">
          Verified counterparties, aggregated mine capacity and structured trade finance in a single
          operating picture. This is an interactive prototype with seeded demo data — no live
          accounts, no funds moved.
        </p>
        <dl className="mt-10 grid gap-6 sm:grid-cols-3 lg:grid-cols-1">
          {[
            ["1.24m t", "verified capacity indexed"],
            ["$600m", "offtake commitment in demo pipeline"],
            ["6", "partner applications in queue"],
          ].map(([v, l]) => (
            <div key={l}>
              <dt className="font-display text-2xl font-semibold">{v}</dt>
              <dd className="text-xs text-primary-foreground/60">{l}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="flex flex-1 items-center px-4 py-12 sm:px-8 lg:px-12">
        <div className="w-full">
          <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
            Demo login
          </p>
          <h2 className="font-display mt-2 text-2xl font-semibold">Choose a role to continue</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Each role opens a different workspace. You can log out at any time to switch.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {ROLES.map(({ role, icon: Icon, blurb, points }) => (
              <button
                key={role}
                onClick={() => enter(role)}
                className="surface group flex flex-col p-5 text-left transition hover:border-primary hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              >
                <span className="flex size-10 items-center justify-center rounded-md bg-secondary text-primary">
                  <Icon className="size-5" />
                </span>
                <span className="font-display mt-4 text-base font-semibold">
                  {ROLE_LABEL[role]}
                </span>
                <span className="mt-1 text-sm text-muted-foreground">{blurb}</span>
                <ul className="mt-4 space-y-1.5 text-xs text-muted-foreground">
                  {points.map((p) => (
                    <li key={p} className="flex gap-2">
                      <span className="mt-1.5 size-1 shrink-0 rounded-full bg-primary" />
                      {p}
                    </li>
                  ))}
                </ul>
                <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-primary">
                  Continue as {ROLE_LABEL[role]}
                  <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
