import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AuthShell, StateChip } from "@/components/onboarding/ui";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useOnboarding } from "@/lib/onboarding/store";

export const Route = createFileRoute("/onboarding/admin")({ component: AdminReviewPage });

function AdminReviewPage() {
  const { joinRequests, decideJoinRequest, application, verification, documents, personnel } = useOnboarding();
  const [notes, setNotes] = useState<Record<string, string>>({});

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
            <p className="font-display text-sm font-semibold">{application.legalName || "Your organisation application"}</p>
            <p className="text-xs text-muted-foreground">
              {application.ref ? `Reference ${application.ref}` : "Not yet submitted"} · {documents.length} documents · {personnel.length} personnel
            </p>
          </div>
          <StateChip state={verification} />
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {joinRequests.map((j) => (
          <div key={j.id} className="rounded-[18px] border border-border p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-display text-sm font-semibold">{j.requesterName}</p>
                <p className="text-xs text-muted-foreground">
                  {j.role} · {j.requesterEmail}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">Requesting access to {j.organisationName} · {j.submittedAt}</p>
              </div>
              <span
                className={`rounded-full border px-2.5 py-1 text-xs font-medium ${
                  j.status === "Approved"
                    ? "border-success/50 bg-success/30"
                    : j.status === "Declined"
                      ? "border-danger/40 bg-danger/20"
                      : "border-warning/50 bg-warning/20"
                }`}
              >
                {j.status}
              </span>
            </div>
            <p className="mt-3 rounded-[12px] bg-muted/50 px-4 py-3 text-sm text-muted-foreground">{j.justification}</p>

            {j.status === "Pending" ? (
              <div className="mt-3 space-y-2">
                <Textarea
                  rows={2}
                  placeholder="Decision note (visible to the requester)"
                  value={notes[j.id] ?? ""}
                  onChange={(e) => setNotes({ ...notes, [j.id]: e.target.value })}
                />
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      decideJoinRequest(j.id, "Approved", notes[j.id] ?? "Approved by the organisation administrator.");
                      toast.success(`${j.requesterName} now has access.`);
                    }}
                  >
                    Approve access
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      decideJoinRequest(j.id, "Declined", notes[j.id] ?? "Declined: could not verify employment.");
                      toast.info(`${j.requesterName}'s request declined.`);
                    }}
                  >
                    Decline
                  </Button>
                </div>
              </div>
            ) : (
              j.decisionNote && <p className="mt-3 text-xs text-muted-foreground">Decision note: {j.decisionNote}</p>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6">
        <Button variant="ghost" asChild>
          <Link to="/onboarding/dashboard">Back to onboarding dashboard</Link>
        </Button>
      </div>
    </AuthShell>
  );
}
