import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AuthShell, OptionCard, ProgressHeader } from "@/components/onboarding/ui";
import { Button } from "@/components/ui/button";
import { useOnboarding } from "@/lib/onboarding/store";
import { VERTICALS } from "@/lib/verticals";

export const Route = createFileRoute("/onboarding/sector")({ component: SectorPage });

function SectorPage() {
  const { sector, setSector } = useOnboarding();
  const navigate = useNavigate();
  const selected = sector ?? "mining";

  return (
    <AuthShell
      title="Which sector are you joining?"
      description="Beldium runs seven compliance sectors. Choose the one your organisation or practice operates in; this scopes the application you complete next."
    >
      <ProgressHeader step={1} total={6} onBack={() => navigate({ to: "/" })} />

      <div className="space-y-4">
        {VERTICALS.map((v) => (
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
    </AuthShell>
  );
}
