import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";
import { AuthShell, OptionCard, ProgressHeader } from "@/components/onboarding/ui";
import { Button } from "@/components/ui/button";
import { joinsWithCode } from "@/lib/onboarding/data";
import {
  useOnboardingOptions,
  type DashboardKey,
  type OnboardingOption,
  type OptionKind,
} from "@/lib/onboarding/options";
import { useOnboarding } from "@/lib/onboarding/store";
import { VERTICAL_BY_SLUG } from "@/lib/verticals";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/onboarding/role")({
  validateSearch: (search: Record<string, unknown>): { side?: DashboardKey } =>
    search["side"] === "applicant" || search["side"] === "partner"
      ? { side: search["side"] as DashboardKey }
      : {},
  component: RolePage,
});

const KIND_LABEL: Record<OptionKind, string> = {
  register: "Register",
  join: "Join",
  regulatory: "Regulatory",
  specific: "Other",
};

/**
 * "How will you use Beldium?" Pick a side of the sector (its own companies,
 * or the compliance partners that review them), then one of its options:
 * register a new company, join an existing one, regulatory access, or a
 * sector-specific item. Section 1 of the backend plan.
 */
function RolePage() {
  const { sector, setRole, setOrgPath } = useOnboarding();
  const navigate = useNavigate();
  const search = Route.useSearch();
  const { dashboards } = useOnboardingOptions(sector);

  // The sector scopes everything that follows, so it has to be chosen first.
  useEffect(() => {
    if (!sector) navigate({ to: "/onboarding/sector", replace: true });
  }, [sector, navigate]);

  const [sideKey, setSideKey] = useState<DashboardKey | null>(search.side ?? null);
  const side = dashboards.find((d) => d.key === sideKey) ?? dashboards[0];
  const [optionKey, setOptionKey] = useState<string | null>(null);
  const option = side?.options.find((o) => o.key === optionKey) ?? null;

  if (!sector || !side) return null;

  const pickSide = (key: DashboardKey) => {
    setSideKey(key);
    setOptionKey(null);
  };

  const next = (o: OnboardingOption) => {
    if (o.external_url) {
      window.location.href = o.external_url;
      return;
    }
    setRole(o.role);
    if (o.org_path) setOrgPath(o.org_path);
    const joining = o.org_path === "existing";
    navigate({
      to: joining && joinsWithCode(sector, o.role) ? "/onboarding/join" : "/onboarding/account",
    });
  };

  return (
    <AuthShell
      title="How will you use Beldium?"
      description={`Choose how you take part in ${VERTICAL_BY_SLUG[sector].name}.`}
    >
      <ProgressHeader step={2} total={6} onBack={() => navigate({ to: "/onboarding/sector" })} />

      {dashboards.length > 1 && (
        <div className="mb-6">
          <p className="mb-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            I am
          </p>
          <div
            className="grid gap-2 sm:grid-cols-2"
            role="radiogroup"
            aria-label="Which side of the sector"
          >
            {dashboards.map((d) => (
              <button
                key={d.key}
                type="button"
                role="radio"
                aria-checked={side.key === d.key}
                onClick={() => pickSide(d.key)}
                className={cn(
                  "rounded-[14px] border-2 px-4 py-3 text-left transition-colors",
                  side.key === d.key
                    ? "border-brand bg-brand-soft/40"
                    : "border-border hover:border-brand/40",
                )}
              >
                <span className="block text-sm font-semibold text-brand">{d.label}</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">{d.description}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3">
        {side.options.map((o) => (
          <OptionCard
            key={o.key}
            active={option?.key === o.key}
            title={o.label}
            description={o.description}
            onClick={() => setOptionKey(o.key)}
            meta={
              <span className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                <span className="rounded-full border border-border px-2 py-0.5 font-medium">
                  {KIND_LABEL[o.kind]}
                </span>
                {o.note}
                {o.external_url && <ExternalLink className="size-3" />}
              </span>
            }
          />
        ))}
      </div>

      <p className="mt-6 text-xs text-muted-foreground">
        Beldium staff accounts are provisioned internally and are not available for public sign-up.
        Choosing an option identifies what you are applying for; it does not grant any access until
        Beldium or your company administrator approves it.
      </p>

      <div className="mt-7 flex flex-wrap gap-3">
        <Button size="lg" disabled={!option} onClick={() => option && next(option)}>
          {option?.external_label ?? "Continue"}
        </Button>
        <Button size="lg" variant="ghost" onClick={() => navigate({ to: "/signin" })}>
          I already have an account
        </Button>
      </div>
    </AuthShell>
  );
}
