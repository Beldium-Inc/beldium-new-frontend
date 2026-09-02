import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Fingerprint, ShieldCheck, Waypoints } from "lucide-react";
import { demoUsers, roleMeta } from "@/lib/beldium/data";
import { useBeldium } from "@/lib/beldium/store";
import { Surface } from "@/components/beldium/ui";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Beldium — Traceable Material Trust Platform" },
      {
        name: "description",
        content:
          "Beldium verifies Quality & Control Partners, tracks sample custody and issues verifiable material certificates. Choose a demo role to explore the flows.",
      },
      { property: "og:title", content: "Beldium — Traceable Material Trust Platform" },
      {
        property: "og:description",
        content:
          "Compliance operator verification, chain of custody, testing, certification and corrective actions in one workspace.",
      },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { login } = useBeldium();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-navy text-navy-foreground">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-10 lg:grid-cols-[1.05fr_1.25fr] lg:px-10 lg:py-16">
        <div className="flex flex-col justify-center">
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-2xl bg-pale font-display text-xl font-bold text-navy">
              B
            </span>
            <div>
              <p className="font-display text-lg font-semibold">Beldium</p>
              <p className="text-xs tracking-[0.2em] text-pale/70 uppercase">
                Quality &amp; Control
              </p>
            </div>
          </div>

          <h1 className="mt-10 font-display text-4xl leading-tight font-semibold sm:text-5xl">
            Every gram carries its own proof.
          </h1>
          <p className="mt-4 max-w-lg text-sm leading-relaxed text-pale/80">
            Beldium binds the accreditation of a testing partner, the custody of a physical sample
            and the analytical result into one continuous, auditable record — so a buyer can trust
            material, not paperwork.
          </p>

          <ul className="mt-8 space-y-4 text-sm">
            <li className="flex gap-3">
              <ShieldCheck className="mt-0.5 size-5 shrink-0 text-pale" />
              <span>
                <span className="font-semibold">Partner verification.</span>{" "}
                <span className="text-pale/75">
                  Organisation, professional capability, laboratory accreditation and scope checked
                  document by document.
                </span>
              </span>
            </li>
            <li className="flex gap-3">
              <Waypoints className="mt-0.5 size-5 shrink-0 text-pale" />
              <span>
                <span className="font-semibold">Unbroken custody.</span>{" "}
                <span className="text-pale/75">
                  Sealed sample events hashed from pit face to accredited bench.
                </span>
              </span>
            </li>
            <li className="flex gap-3">
              <Fingerprint className="mt-0.5 size-5 shrink-0 text-pale" />
              <span>
                <span className="font-semibold">Verifiable certificates.</span>{" "}
                <span className="text-pale/75">
                  Buyer-spec matched results, revocable and publicly checkable.
                </span>
              </span>
            </li>
          </ul>
        </div>

        <Surface className="bg-card p-6 sm:p-8">
          <p className="text-xs font-semibold tracking-[0.18em] text-link uppercase">
            Demo access
          </p>
          <h2 className="mt-1 font-display text-2xl font-semibold text-navy">
            Choose a role to sign in
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            No account needed. Sign out at any time from the sidebar to explore another
            perspective — all data stays local to this browser.
          </p>

          <div className="mt-6 space-y-3">
            {demoUsers.map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => {
                  login(u.id);
                  navigate({ to: "/dashboard" });
                }}
                className="group flex w-full items-start gap-4 rounded-2xl border border-border bg-card p-4 text-left transition hover:border-link hover:shadow-[var(--shadow-lift)]"
              >
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-pale font-display text-sm font-semibold text-navy">
                  {u.initials}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="font-display text-sm font-semibold text-navy">
                      {roleMeta[u.role].label}
                    </span>
                    {u.role === "operator" ? (
                      <span className="rounded-full bg-success px-2 py-0.5 text-[10px] font-semibold tracking-wide text-success-foreground uppercase">
                        Primary flow
                      </span>
                    ) : null}
                  </span>
                  <span className="mt-0.5 block text-sm text-navy/80">
                    {u.name} · {u.org}
                  </span>
                  <span className="mt-1 block text-xs text-muted-foreground">{u.blurb}</span>
                </span>
                <ArrowRight className="mt-3 size-4 shrink-0 text-link opacity-0 transition group-hover:opacity-100" />
              </button>
            ))}
          </div>
        </Surface>
      </div>
    </div>
  );
}
