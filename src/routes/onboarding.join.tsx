import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { toast } from "sonner";
import { AuthShell, OptionCard, StateChip } from "@/components/onboarding/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { partnerJoinRoleOptions, regulatoryRoleOptions, registeredOrganisations } from "@/lib/onboarding/data";
import { useOnboarding } from "@/lib/onboarding/store";

export const Route = createFileRoute("/onboarding/join")({ component: JoinPage });

function JoinPage() {
  const { addJoinRequest, joinRequests, account, verification, role: onboardingRole } = useOnboarding();
  const isRegulatory = onboardingRole === "regulator-officer" || onboardingRole === "regulator-org";
  const roleOptions = isRegulatory ? regulatoryRoleOptions : partnerJoinRoleOptions;
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<string | null>(null);
  const [role, setRole] = useState("");
  const [justification, setJustification] = useState("");

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return registeredOrganisations;
    return registeredOrganisations.filter((o) => o.name.toLowerCase().includes(q) || o.rcNumber.toLowerCase().includes(q));
  }, [query]);

  const mine = joinRequests.filter((j) => j.requesterEmail === account.email);

  const send = () => {
    if (!picked) {
      toast.error("Select the organisation you belong to.");
      return;
    }
    if (justification.trim().length < 10) {
      toast.error("Add a short justification for the administrator.");
      return;
    }
    addJoinRequest({ organisationName: picked, role: role || roleOptions[0]!, justification });
    toast.success("Access request sent to the organisation administrator.");
    navigate({ to: "/onboarding/dashboard" });
  };

  return (
    <AuthShell
      eyebrow="Step 5 of 5"
      title="Find your organisation"
      description="Search the Beldium register. Your request is reviewed by the organisation's administrator before access is granted."
      width="lg"
    >
      <div className="space-y-2">
        <Label htmlFor="orgsearch">Search by company name or RC number</Label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input id="orgsearch" className="pl-9" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="e.g. Nasarawa Lithium or RC-1428871" />
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {results.map((o) => (
          <OptionCard
            key={o.id}
            active={picked === o.name}
            title={o.name}
            description={`${o.sites} sites · ${o.rcNumber} · ${o.state} State · Administrator ${o.admin}`}
            onClick={() => setPicked(o.name)}
          />
        ))}
        {results.length === 0 && (
          <div className="rounded-[18px] border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            No match found.{" "}
            <button className="font-medium text-brand underline" onClick={() => navigate({ to: "/onboarding/application" })}>
              Register a new organisation instead
            </button>
          </div>
        )}
      </div>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="jrole">Requested role in the organisation</Label>
          <select
            id="jrole"
            value={role || roleOptions[0]}
            onChange={(e) => setRole(e.target.value)}
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            {roleOptions.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="just">Justification for the administrator</Label>
          <Textarea id="just" rows={3} value={justification} onChange={(e) => setJustification(e.target.value)} placeholder="Explain your position and why you need access." />
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Button size="lg" onClick={send}>
          Send access request
        </Button>
        <Button size="lg" variant="ghost" onClick={() => navigate({ to: "/onboarding/dashboard" })}>
          Skip for now
        </Button>
      </div>

      {mine.length > 0 && (
        <div className="mt-8 rounded-[18px] border border-border bg-muted/40 p-5">
          <p className="font-display text-sm font-semibold">Your requests</p>
          <div className="mt-3 space-y-2">
            {mine.map((j) => (
              <div key={j.id} className="flex flex-wrap items-center justify-between gap-2 rounded-[12px] bg-surface px-4 py-3">
                <div>
                  <p className="text-sm font-medium">{j.organisationName}</p>
                  <p className="text-xs text-muted-foreground">
                    {j.role} · sent {j.submittedAt}
                  </p>
                </div>
                <span className="text-xs font-medium">{j.status}</span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Current account status: <StateChip state={verification} />
          </p>
        </div>
      )}
    </AuthShell>
  );
}
