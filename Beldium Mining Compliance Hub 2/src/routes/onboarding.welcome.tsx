import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";
import { AuthShell } from "@/components/onboarding/ui";
import { Button } from "@/components/ui/button";
import { roleCatalogue } from "@/lib/onboarding/data";
import { useOnboarding } from "@/lib/onboarding/store";
import { useStore } from "@/lib/prototype/store";

export const Route = createFileRoute("/onboarding/welcome")({ component: WelcomePage });

function WelcomePage() {
  const { role, application, account, markWelcomeSeen, capability } = useOnboarding();
  const { login } = useStore();
  const navigate = useNavigate();
  const entry = roleCatalogue.find((r) => r.role === role);

  const enter = () => {
    markWelcomeSeen();
    login(role === "regulator-org" || role === "regulator-officer" ? "regulator" : "partner");
    navigate({ to: "/app/dashboard" });
  };

  return (
    <AuthShell
      eyebrow="Verification complete"
      title="You're verified — welcome to Beldium"
      description={`${application.legalName || account.fullName || "Your account"} has passed verification. Your workspace is provisioned with the permissions for your role.`}
    >
      <div className="flex items-start gap-3 rounded-[20px] border border-success/50 bg-success/20 p-5">
        <CheckCircle2 className="mt-0.5 size-6" />
        <div>
          <p className="font-display text-sm font-semibold">{entry?.title ?? "Verified user"}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {application.ref ? `Application ${application.ref} approved.` : "Account approved."} Verified checks: identity, email,
            phone, statutory documents{capability.offersInspection ? ", inspection accreditation" : ""}.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {(entry?.permissions ?? []).map((p) => (
          <div key={p} className="rounded-[14px] border border-border px-4 py-3 text-sm">
            {p}
            <span className="mt-0.5 block text-[11px] text-success-foreground/70 text-muted-foreground">Active</span>
          </div>
        ))}
      </div>

      <div className="mt-7 flex flex-wrap gap-3">
        <Button size="lg" onClick={enter}>
          Enter my workspace
        </Button>
        <Button size="lg" variant="ghost" asChild>
          <Link to="/onboarding/dashboard">Back to onboarding status</Link>
        </Button>
      </div>
    </AuthShell>
  );
}
