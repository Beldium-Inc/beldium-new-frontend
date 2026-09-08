import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AuthShell, OptionCard, ProgressHeader } from "@/components/onboarding/ui";
import { Button } from "@/components/ui/button";
import { roleCatalogue } from "@/lib/onboarding/data";
import { useOnboarding } from "@/lib/onboarding/store";

export const Route = createFileRoute("/onboarding/role")({ component: RolePage });

function RolePage() {
  const { role, setRole, setOrgPath } = useOnboarding();
  const navigate = useNavigate();
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
      description="Select the account type that matches your role in the mining compliance ecosystem."
    >
      <ProgressHeader step={1} total={5} onBack={() => navigate({ to: "/" })} />

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
