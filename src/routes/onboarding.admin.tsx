import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Copy, Loader2, RefreshCw } from "lucide-react";
import { AuthShell } from "@/components/onboarding/ui";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  APPLICATION_STATUS_LABELS,
  ApiError,
  JOIN_REQUEST_STATUS_LABELS,
  MEMBERSHIP_ROLE_LABELS,
  ORGANISATION_ADMIN_ROLES,
  fullName,
  useDecideJoinRequest,
  useJoinCode,
  useOrganisationJoinRequests,
  useRotateJoinCode,
  type JoinRequestStatus,
  type UUID,
} from "@/lib/api";
import { useApplicationContext } from "@/lib/onboarding/application";

export const Route = createFileRoute("/onboarding/admin")({ component: AdminReviewPage });

const STATUS_TONE: Record<JoinRequestStatus, string> = {
  approved: "border-success/50 bg-success/30",
  rejected: "border-danger/40 bg-danger/20",
  cancelled: "border-border bg-muted",
  pending: "border-warning/50 bg-warning/20",
};

function AdminReviewPage() {
  const { application, organisation, loading } = useApplicationContext();

  // Both the join-request list and the decide endpoint require an owner or
  // administrator membership, so the controls are gated on the role the API
  // reports for this organisation rather than on anything held locally.
  const isAdmin = ORGANISATION_ADMIN_ROLES.includes(organisation?.my_role ?? "other");
  const joinRequests = useOrganisationJoinRequests(isAdmin ? (organisation?.id ?? null) : null);
  const decide = useDecideJoinRequest();

  const [notes, setNotes] = useState<Record<string, string>>({});
  const [deciding, setDeciding] = useState<string | null>(null);

  const submitDecision = async (
    id: string,
    decision: "approved" | "rejected",
    requesterName: string,
  ) => {
    setDeciding(id);
    try {
      const updated = await decide.mutateAsync({
        id,
        decision,
        ...(notes[id]?.trim() ? { notes: notes[id]!.trim() } : {}),
      });
      toast.success(
        updated.status === "approved"
          ? `${requesterName} now has access as ${MEMBERSHIP_ROLE_LABELS[updated.requested_role]}.`
          : `${requesterName}'s request was declined.`,
      );
      setNotes((current) => ({ ...current, [id]: "" }));
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "That decision could not be recorded.",
      );
    } finally {
      setDeciding(null);
    }
  };

  if (loading) {
    return (
      <AuthShell eyebrow="Organisation administrator" title="Loading" width="lg">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Reading your organisation…
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      eyebrow="Organisation administrator"
      title="Access requests & application review"
      description="Administrators of a registered organisation approve or decline requests from colleagues, and can see the status of the organisation's own application."
      width="lg"
    >
      <div className="rounded-[20px] border border-border p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-display text-sm font-semibold">
              {application?.organisation_profile?.name ||
                organisation?.name ||
                "Your organisation application"}
            </p>
            <p className="text-xs text-muted-foreground">
              {application?.reference ? `Reference ${application.reference}` : "Not yet started"} ·{" "}
              {application?.progress.documents.submitted ?? 0} of{" "}
              {application?.progress.documents.required ?? 0} documents ·{" "}
              {application?.personnel.length ?? 0} personnel
            </p>
          </div>
          <span className="rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium">
            {application ? APPLICATION_STATUS_LABELS[application.status] : "Draft"}
          </span>
        </div>
      </div>

      {!organisation && (
        <p className="mt-5 text-sm text-muted-foreground">
          You do not belong to an organisation yet.{" "}
          <Link to="/onboarding/join" className="font-medium text-brand underline">
            Request access to one
          </Link>{" "}
          or start an application.
        </p>
      )}

      {organisation && !isAdmin && (
        <p className="mt-5 rounded-[14px] border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          Only the owner or an administrator of {organisation.name} can review access requests. Your
          role here is {MEMBERSHIP_ROLE_LABELS[organisation.my_role ?? "other"]}.
        </p>
      )}

      {isAdmin && organisation && <JoinCodeCard organisationId={organisation.id} />}

      {isAdmin && (
        <div className="mt-5 space-y-3">
          {joinRequests.isLoading && (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Loading access requests…
            </p>
          )}
          {joinRequests.isError && (
            <p className="text-sm text-danger">
              {joinRequests.error instanceof ApiError
                ? joinRequests.error.message
                : "Access requests could not be loaded."}
            </p>
          )}
          {joinRequests.data?.length === 0 && (
            <p className="text-sm text-muted-foreground">No access requests yet.</p>
          )}

          {(joinRequests.data ?? []).map((request) => {
            const requesterName = fullName(request.requester);
            const busy = deciding === request.id;
            return (
              <div key={request.id} className="rounded-[18px] border border-border p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-display text-sm font-semibold">{requesterName}</p>
                    <p className="text-xs text-muted-foreground">
                      {MEMBERSHIP_ROLE_LABELS[request.requested_role]} · {request.requester.email}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Requesting access to {request.organisation_name} ·{" "}
                      {new Date(request.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    className={`rounded-full border px-2.5 py-1 text-xs font-medium ${STATUS_TONE[request.status]}`}
                  >
                    {JOIN_REQUEST_STATUS_LABELS[request.status]}
                  </span>
                </div>
                <p className="mt-3 rounded-[12px] bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
                  {request.justification}
                </p>

                {request.status === "pending" ? (
                  <div className="mt-3 space-y-2">
                    <Textarea
                      rows={2}
                      placeholder="Decision note (visible to the requester)"
                      value={notes[request.id] ?? ""}
                      onChange={(e) => setNotes({ ...notes, [request.id]: e.target.value })}
                    />
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        disabled={busy}
                        onClick={() => void submitDecision(request.id, "approved", requesterName)}
                      >
                        {busy ? "Saving…" : "Approve access"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busy}
                        onClick={() => void submitDecision(request.id, "rejected", requesterName)}
                      >
                        Decline
                      </Button>
                    </div>
                  </div>
                ) : (
                  request.decision_notes && (
                    <p className="mt-3 text-xs text-muted-foreground">
                      Decision note: {request.decision_notes}
                      {request.decided_at
                        ? ` · ${new Date(request.decided_at).toLocaleDateString()}`
                        : ""}
                    </p>
                  )
                )}
              </div>
            );
          })}
        </div>
      )}
    </AuthShell>
  );
}

function JoinCodeCard({ organisationId }: { organisationId: UUID }) {
  const joinCode = useJoinCode(organisationId);
  const rotate = useRotateJoinCode(organisationId);

  const copy = async (text: string, what: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${what} copied.`);
    } catch {
      toast.error(`Could not copy the ${what.toLowerCase()}. Select it and copy it by hand.`);
    }
  };

  const replace = async () => {
    if (
      !window.confirm(
        "Make a new join code? The current code and link stop working straight away. Requests already sent are not affected.",
      )
    )
      return;
    try {
      await rotate.mutateAsync();
      toast.success("New join code ready. Share it with the people you want to invite.");
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "The join code could not be changed.",
      );
    }
  };

  const code = joinCode.data?.join_code ?? "";
  const shown = code.length > 4 ? `${code.slice(0, 4)}-${code.slice(4)}` : code;

  return (
    <div className="mt-5 rounded-[20px] border border-border p-5">
      <p className="font-display text-sm font-semibold">Invite colleagues with a code or link</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Share either one with people who work for your organisation. They use it to send a request
        to join, and nobody gets access until you accept them here. You will get an email for every
        new request.
      </p>

      {joinCode.isLoading && (
        <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Loading the join code…
        </p>
      )}
      {joinCode.isError && (
        <p className="mt-4 text-sm text-danger">
          {joinCode.error instanceof ApiError
            ? joinCode.error.message
            : "The join code could not be loaded."}
        </p>
      )}

      {joinCode.data && (
        <div className="mt-4 space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-[12px] border border-border bg-muted/40 px-4 py-2 font-mono text-lg tracking-[0.25em]">
              {shown}
            </span>
            <Button size="sm" variant="outline" onClick={() => void copy(code, "Code")}>
              <Copy className="size-3.5" /> Copy code
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="min-w-0 flex-1 truncate rounded-[12px] border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
              {joinCode.data.join_url}
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => void copy(joinCode.data!.join_url, "Link")}
            >
              <Copy className="size-3.5" /> Copy link
            </Button>
          </div>
          <Button
            size="sm"
            variant="ghost"
            disabled={rotate.isPending}
            onClick={() => void replace()}
          >
            <RefreshCw className="size-3.5" />
            {rotate.isPending ? "Making a new code…" : "Make a new code"}
          </Button>
        </div>
      )}
    </div>
  );
}
