import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AuthShell, OptionCard, ProgressHeader } from "@/components/onboarding/ui";
import { Button } from "@/components/ui/button";
import { useOnboarding } from "@/lib/onboarding/store";

export const Route = createFileRoute("/onboarding/path")({ component: PathPage });

function PathPage() {
  const { orgPath, setOrgPath } = useOnboarding();
  const navigate = useNavigate();
  const selected = orgPath ?? "new";

  return (
    <AuthShell title="Register or Join an Organisation" description="How would you like to continue?">
      <ProgressHeader step={2} total={5} onBack={() => navigate({ to: "/onboarding/role" })} />

      <div className="space-y-4">
        <OptionCard
          active={selected === "new"}
          title="Register a New Organisation"
          description="Choose this if your organisation is not yet registered on Beldium."
          onClick={() => setOrgPath("new")}
        />
        <OptionCard
          active={selected === "existing"}
          title="Join an Existing Organisation"
          description="Choose this if your company or institution is already registered."
          onClick={() => setOrgPath("existing")}
        />
      </div>

      <div className="mt-7">
        <Button
          size="lg"
          onClick={() => {
            setOrgPath(selected);
            navigate({ to: "/onboarding/account" });
          }}
        >
          Continue
        </Button>
      </div>
    </AuthShell>
  );
}
