import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Building2, CheckCircle2, Clock, XCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { AuthLayout } from "@/components/auth-layout";
import { errorMessage } from "@/components/beldium/ops";
import { StatusBadge } from "@/components/beldium/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cancelJoinRequest } from "@/lib/api/organisations";
import {
  queryKeys,
  useCreateJoinRequest,
  useMyJoinRequests,
  useOrganisationDirectory,
} from "@/lib/api/queries";
import type { JoinRequest, Organisation } from "@/lib/api/types";
import { useAuth } from "@/lib/auth";
import {
  API_ROLE,
  JOIN_STATUS_LABELS,
  MEMBER_ROLE_LABELS,
  decodeDecision,
  decodeJustification,
  encodeJustification,
  type LogisticsMemberRole,
} from "@/lib/membership";
import { cn } from "@/lib/utils";

const title = "Join a logistics organisation - Beldium Logistics Hub";
const description =
  "Ask to join a logistics organisation already on Beldium as a fleet manager or driver. Its representative approves or declines the request.";

export const Route = createFileRoute("/join-organization")({
  ssr: false,
  validateSearch: z.object({ organisation: z.string().optional() }),
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: JoinOrganisationPage,
});

function JoinOrganisationPage() {
  const { status, user } = useAuth();
  const mine = useMyJoinRequests({ enabled: status === "authenticated" });

  if (status === "loading") {
    return <div className="p-10 text-sm text-muted-foreground">Loading…</div>;
  }

  if (status === "unauthenticated" || !user) {
    return (
      <AuthLayout title="Join an organisation" subtitle="Create an account or sign in first.">
        <p className="text-sm text-muted-foreground">
          Your account stays separate from the organisation until its representative approves you.
        </p>
        <div className="mt-5 grid gap-2">
          <Button asChild>
            <Link to="/signup">Create an account</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/auth">Sign in</Link>
          </Button>
        </div>
      </AuthLayout>
    );
  }

  const requests = mine.data?.results ?? [];
  const pending = requests.find((r) => r.status === "pending");
  const approved = requests.find((r) => r.status === "approved");

  return (
    <AuthLayout
      wide
      title="Join a logistics organisation"
      subtitle="Request access to an organisation already registered on Beldium. Its representative decides."
      footer={
        <span>
          Running your own vehicle?{" "}
          <Link to="/independent/onboarding" className="font-medium text-primary hover:underline">
            Onboard as an independent operator
          </Link>
        </span>
      }
    >
      {mine.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading your requests…</p>
      ) : approved ? (
        <Approved request={approved} />
      ) : pending ? (
        <Pending request={pending} />
      ) : (
        <RequestForm />
      )}
      {requests.length > 0 ? <History requests={requests} /> : null}
    </AuthLayout>
  );
}

function RequestForm() {
  const { organisation: initial } = Route.useSearch();
  const [search, setSearch] = useState(initial ?? "");
  const [selected, setSelected] = useState<Organisation | null>(null);
  const [role, setRole] = useState<LogisticsMemberRole>("driver");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const directory = useOrganisationDirectory(
    { search: search.trim(), page_size: 8 },
    { enabled: search.trim().length >= 2 },
  );
  const create = useCreateJoinRequest();

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        if (!selected) return setError("Choose the organisation you work for.");
        if (!message.trim())
          return setError("Tell the representative who you are and what you do.");
        setError("");
        create.mutate(
          {
            organisation: selected.id,
            requested_role: API_ROLE,
            justification: encodeJustification(role, message),
          },
          {
            onSuccess: () => toast.success(`Request sent to ${selected.name}`),
            onError: (cause) => setError(errorMessage(cause, "Could not send the request.")),
          },
        );
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="org-search">Organisation</Label>
        <Input
          id="org-search"
          placeholder="Search by organisation name"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setSelected(null);
          }}
        />
        {search.trim().length >= 2 && !selected ? (
          <ul className="max-h-56 divide-y divide-border overflow-y-auto rounded-md border border-border">
            {directory.isLoading ? (
              <li className="px-3 py-2 text-sm text-muted-foreground">Searching…</li>
            ) : (directory.data?.results ?? []).length ? (
              (directory.data?.results ?? []).map((org) => (
                <li key={org.id}>
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted"
                    onClick={() => {
                      setSelected(org);
                      setSearch(org.name);
                    }}
                  >
                    <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="min-w-0 flex-1 truncate">{org.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {org.state || org.country}
                    </span>
                  </button>
                </li>
              ))
            ) : (
              <li className="px-3 py-2 text-sm text-muted-foreground">
                No verified organisation matches “{search.trim()}”. Check the exact name with your
                organisation.
              </li>
            )}
          </ul>
        ) : null}
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Your role</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {(Object.keys(MEMBER_ROLE_LABELS) as LogisticsMemberRole[]).map((r) => (
            <button
              key={r}
              type="button"
              aria-pressed={role === r}
              onClick={() => setRole(r)}
              className={cn(
                "rounded-md border px-3 py-2.5 text-left text-sm",
                role === r
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/40",
              )}
            >
              {MEMBER_ROLE_LABELS[r]}
            </button>
          ))}
        </div>
        {role === "driver" ? (
          <p className="text-xs text-muted-foreground">
            The organisation links you to a driver already on its register before approving you.
          </p>
        ) : null}
      </fieldset>

      <div className="space-y-2">
        <Label htmlFor="join-message">Message to the representative</Label>
        <Textarea
          id="join-message"
          rows={3}
          value={message}
          placeholder="e.g. I drive PLT-482-JS on the Jos–Kaduna route."
          onChange={(e) => setMessage(e.target.value)}
        />
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button type="submit" className="w-full" disabled={create.isPending}>
        {create.isPending ? "Sending…" : "Send join request"}
      </Button>
      <p className="text-xs text-muted-foreground">
        Membership is an access decision by the organisation, never a compliance decision. You get
        no access to its workspace until the request is approved.
      </p>
    </form>
  );
}

function Pending({ request }: { request: JoinRequest }) {
  const queryClient = useQueryClient();
  const withdraw = useMutation({
    mutationFn: () => cancelJoinRequest(request.id),
    onSuccess: () => {
      toast.success("Request withdrawn");
      void queryClient.invalidateQueries({ queryKey: queryKeys.myJoinRequests });
    },
    onError: (cause) => toast.error(errorMessage(cause, "Could not withdraw the request.")),
  });
  const { role } = decodeJustification(request.justification);
  return (
    <div className="rounded-md border border-warning/40 bg-warning/10 p-5">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Clock className="h-4 w-4" /> Waiting for {request.organisation_name}
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        You asked to join as {role ? MEMBER_ROLE_LABELS[role].toLowerCase() : "a member"} on{" "}
        {new Date(request.created_at).toLocaleDateString("en-GB")}. Its representative approves or
        declines the request from their Team page. You will not have access until then.
      </p>
      <Button
        variant="outline"
        size="sm"
        className="mt-4"
        disabled={withdraw.isPending}
        onClick={() => withdraw.mutate()}
      >
        Withdraw request
      </Button>
    </div>
  );
}

function Approved({ request }: { request: JoinRequest }) {
  const navigate = useNavigate();
  const { driver } = decodeDecision(request.decision_notes);
  return (
    <div className="rounded-md border border-success/30 bg-success/10 p-5">
      <div className="flex items-center gap-2 text-sm font-medium text-success">
        <CheckCircle2 className="h-4 w-4" /> You are a member of {request.organisation_name}
      </div>
      {driver ? (
        <p className="mt-2 text-sm text-muted-foreground">
          Linked to registered driver {driver.name}.
        </p>
      ) : null}
      <Button className="mt-4" onClick={() => navigate({ to: "/portal" })}>
        Open the workspace
      </Button>
    </div>
  );
}

function History({ requests }: { requests: JoinRequest[] }) {
  return (
    <div className="mt-8">
      <h2 className="mb-2 text-sm font-semibold">Your requests</h2>
      <ul className="divide-y divide-border rounded-md border border-border">
        {requests.map((r) => {
          const { role } = decodeJustification(r.justification);
          const { notes } = decodeDecision(r.decision_notes);
          return (
            <li
              key={r.id}
              className="flex flex-wrap items-start justify-between gap-2 px-3 py-2.5 text-sm"
            >
              <div className="min-w-0">
                <p className="font-medium">{r.organisation_name}</p>
                <p className="text-xs text-muted-foreground">
                  {role ? MEMBER_ROLE_LABELS[role] : "Member"} ·{" "}
                  {new Date(r.created_at).toLocaleDateString("en-GB")}
                  {r.status === "rejected" && notes ? ` · ${notes}` : ""}
                </p>
              </div>
              <span className="flex items-center gap-1">
                {r.status === "rejected" ? (
                  <XCircle className="h-3.5 w-3.5 text-destructive" />
                ) : null}
                <StatusBadge value={JOIN_STATUS_LABELS[r.status]} />
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
