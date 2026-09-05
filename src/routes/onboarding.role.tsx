import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AuthShell, OptionCard, ProgressHeader } from "@/components/onboarding/ui";
import { Button } from "@/components/ui/button";
import { roleCatalogue } from "@/lib/onboarding/data";
import { useOnboarding } from "@/lib/onboarding/store";
import { VERTICAL_BY_SLUG } from "@/lib/verticals";
import { useEffect } from "react";

export const Route = createFileRoute("/onboarding/role")({ component: RolePage });

function RolePage() {
  const { sector, role, setRole, setOrgPath } = useOnboarding();
  const navigate = useNavigate();

  // The sector scopes everything that follows, so it has to be chosen first.
  useEffect(() => {
    if (!sector) navigate({ to: "/onboarding/sector", replace: true });
  }, [sector, navigate]);
  const selected = role ?? "compliance-org";
  const entry = roleCatalogue.find((r) => r.role === selected)!;

  const next = () => {
    setRole(selected);
    if (entry.joinOnly) {
      setOrgPath("existing");
      navigate({ to: "/onboarding/account" });
      return;
    }
    navigate({ to: entry.needsOrganisation ? "/onboarding/path" : "/onboarding/account" });
  };

  return (
    <AuthShell
      title="How will you use Beldium?"
      description={`Select the account type that matches your role in ${
        sector ? VERTICAL_BY_SLUG[sector].name : "this sector"
      }.`}
    >
      <ProgressHeader step={2} total={6} onBack={() => navigate({ to: "/onboarding/sector" })} />

      <div className="space-y-4">
        {roleCatalogue.map((r) => (
          <OptionCard
            key={r.role}
            active={selected === r.role}
            title={r.title}
            description={r.blurb}
            onClick={() => setRole(r.role)}
          />
        ))}
      </div>

      <p className="mt-6 text-xs text-muted-foreground">
        Beldium Admin accounts are provisioned internally and are not available for public sign-up.
      </p>

      <div className="mt-7 flex flex-wrap gap-3">
        <Button size="lg" onClick={next}>
          Continue
        </Button>
        <Button size="lg" variant="ghost" onClick={() => navigate({ to: "/signin" })}>
          I already have an account
        </Button>
      </div>
    </AuthShell>
  );
}
