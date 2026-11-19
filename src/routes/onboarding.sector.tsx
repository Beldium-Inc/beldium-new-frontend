import { createFileRoute, useNavigate } from "@tanstack/react-router";
import * as React from "react";
import { AuthShell, OptionCard, ProgressHeader } from "@/components/onboarding/ui";
import { Button } from "@/components/ui/button";
import { goToQcHost, isQcHost, qcUrl } from "@/lib/hosts";
import { useOnboarding } from "@/lib/onboarding/store";
import { COMPLIANCE_SITE_VERTICALS } from "@/lib/verticals";

export const Route = createFileRoute("/onboarding/sector")({ component: SectorPage });

function SectorPage() {
  const { sector, setSector } = useOnboarding();
  const navigate = useNavigate();
  const selected = sector ?? "mining";

  // qualitycontrol.beldium.com only onboards Quality & Control accounts: skip the chooser.
  React.useEffect(() => {
    if (isQcHost()) {
      setSector("quality");
      navigate({ to: "/onboarding/role", replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AuthShell
      title="Which sector are you joining?"
      description="Choose the one your organisation or practice operates in; this scopes the application you complete next."
    >
      <ProgressHeader step={1} total={6} onBack={() => navigate({ to: "/" })} />

      <div className="space-y-4">
        {COMPLIANCE_SITE_VERTICALS.map((v) => (
          <OptionCard
            key={v.slug}
            active={selected === v.slug}
            title={v.name}
            description={v.tagline}
            onClick={() => setSector(v.slug)}
            meta={
              <span className="text-[11px] text-muted-foreground">
                {v.roles.length} roles · {v.roles.map((r) => r.label).join(", ")}
              </span>
            }
          />
        ))}
      </div>

      <div className="mt-7 flex flex-wrap gap-3">
        <Button
          size="lg"
          onClick={() => {
            // Labs and Q&C operators apply on the Quality & Control site. A
            // sector remembered from before the split can still say "quality".
            if (selected === "quality") {
              goToQcHost("/onboarding/sector");
              return;
            }
            setSector(selected);
            navigate({ to: "/onboarding/role" });
          }}
        >
          Continue
        </Button>
        <Button size="lg" variant="ghost" onClick={() => navigate({ to: "/signin" })}>
          I already have an account
        </Button>
      </div>

      <p className="mt-5 text-sm text-muted-foreground">
        Registering a laboratory or joining as a Q&amp;C professional?{" "}
        <a href={qcUrl("/onboarding/sector")} className="font-semibold text-brand underline">
          Apply on the Quality &amp; Control site
        </a>
      </p>
    </AuthShell>
  );
}
