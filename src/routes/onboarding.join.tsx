import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { toast } from "sonner";
import { AuthShell, OptionCard, StateChip } from "@/components/onboarding/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  ApiError,
  MEMBERSHIP_ROLE_LABELS,
  ORGANISATION_TYPE_LABELS,
  useCreateJoinRequest,
  useMyJoinRequests,
  useOrganisationDirectory,
  type MembershipRole,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useOnboarding } from "@/lib/onboarding/store";

export const Route = createFileRoute("/onboarding/join")({ component: JoinPage });

// Ownership is never requested: the owner is whoever created the organisation.
const REQUESTABLE_ROLES: MembershipRole[] = ["admin", "reviewer", "inspector", "member"];

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Declined",
  cancelled: "Cancelled",
};

function JoinPage() {
  const { verification } = useOnboarding();
  const { status: authStatus } = useAuth();
  const navigate = useNavigate();

  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [picked, setPicked] = useState<string | null>(null);
  const [role, setRole] = useState<MembershipRole>("member");
  const [justification, setJustification] = useState("");

  // The register is searched server-side; wait for a pause in typing.
  useEffect(() => {
    const timer = setTimeout(() => setSearch(query.trim()), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const signedIn = authStatus === "authenticated";
  const directory = useOrganisationDirectory({ search, page_size: 25 }, { enabled: signedIn });
  const myRequests = useMyJoinRequests({ enabled: signedIn });
  const createRequest = useCreateJoinRequest();

  const organisations = directory.data?.results ?? [];

  const send = async () => {
    if (!picked) {
      toast.error("Select the organisation you belong to.");
      return;
    }
    if (justification.trim().length < 10) {
      toast.error("Add a short justification for the administrator.");
      return;
    }

    try {
      await createRequest.mutateAsync({
        organisation: picked,
        requested_role: role,
        justification: justification.trim(),
      });
      toast.success("Access request sent to the organisation administrator.");
      navigate({ to: "/onboarding/dashboard" });
    } catch (error) {
      // Already a member, or a request for this organisation is still pending.
      toast.error(error instanceof ApiError ? error.message : "Could not send the request.");
    }
  };

  if (!signedIn) {
    return (
      <AuthShell
        title="Find your organisation"
        description="Verify your email address first: searching the Beldium register and requesting access both need a signed-in account."
      >
        <div className="flex flex-wrap gap-3">
          <Button size="lg" onClick={() => navigate({ to: "/onboarding/verify" })}>
            {authStatus === "loading" ? "Checking your session…" : "Verify your email"}
          </Button>
          <Button size="lg" variant="ghost" onClick={() => navigate({ to: "/signin" })}>
            Sign in
          </Button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      eyebrow="Step 5 of 5"
      title="Find your organisation"
      description="Search the Beldium register. Your request is reviewed by the organisation's administrator before access is granted."
      width="lg"
    >
      <div className="space-y-2">
        <Label htmlFor="orgsearch">Search by organisation name or registration number</Label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="orgsearch"
            className="pl-9"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. Nasarawa Lithium or RC-1428871"
          />
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {directory.isPending && (
          <div className="rounded-[18px] border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            Loading the register…
          </div>
        )}

        {directory.isError && (
          <div className="rounded-[18px] border border-dashed border-danger/50 p-6 text-center text-sm text-danger">
            {directory.error instanceof ApiError
              ? directory.error.message
              : "The register could not be loaded."}
          </div>
        )}

        {organisations.map((organisation) => (
          <OptionCard
            key={organisation.id}
            active={picked === organisation.id}
            title={organisation.name}
            description={[
              ORGANISATION_TYPE_LABELS[organisation.organisation_type],
              organisation.registration_number || null,
              organisation.state ? `${organisation.state} State` : null,
              `${organisation.member_count} ${organisation.member_count === 1 ? "member" : "members"}`,
            ]
              .filter(Boolean)
              .join(" · ")}
            onClick={() => setPicked(organisation.id)}
          />
        ))}

        {directory.isSuccess && organisations.length === 0 && (
          <div className="rounded-[18px] border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            {search
              ? "No verified organisation matches that search."
              : "No verified organisations yet."}{" "}
            <button
              className="font-medium text-brand underline"
              onClick={() => navigate({ to: "/onboarding/application" })}
            >
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
            value={role}
            onChange={(e) => setRole(e.target.value as MembershipRole)}
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            {REQUESTABLE_ROLES.map((option) => (
              <option key={option} value={option}>
                {MEMBERSHIP_ROLE_LABELS[option]}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="just">Justification for the administrator</Label>
          <Textarea
            id="just"
            rows={3}
            value={justification}
            onChange={(e) => setJustification(e.target.value)}
            placeholder="Explain your position and why you need access."
          />
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Button size="lg" onClick={() => void send()} disabled={createRequest.isPending}>
          {createRequest.isPending ? "Sending…" : "Send access request"}
        </Button>
        <Button size="lg" variant="ghost" onClick={() => navigate({ to: "/onboarding/dashboard" })}>
          Skip for now
        </Button>
      </div>

      {(myRequests.data?.results.length ?? 0) > 0 && (
        <div className="mt-8 rounded-[18px] border border-border bg-muted/40 p-5">
          <p className="font-display text-sm font-semibold">Your requests</p>
          <div className="mt-3 space-y-2">
            {myRequests.data?.results.map((request) => (
              <div
                key={request.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-[12px] bg-surface px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium">{request.organisation_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {MEMBERSHIP_ROLE_LABELS[request.requested_role]} · sent{" "}
                    {new Date(request.created_at).toLocaleDateString()}
                  </p>
                </div>
                <span className="text-xs font-medium">
                  {STATUS_LABELS[request.status] ?? request.status}
                </span>
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
