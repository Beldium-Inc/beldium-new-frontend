import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileText,
  Loader2,
  Send,
  ShieldCheck,
  Users,
} from "lucide-react";
import { AuthShell, InfoRow } from "@/components/onboarding/ui";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { roleCatalogue } from "@/lib/onboarding/data";
import { useOnboarding } from "@/lib/onboarding/store";
import { useApplicationContext } from "@/lib/onboarding/application";
import {
  APPLICATION_STATUS_LABELS,
  ApiError,
  DOCUMENT_STATUS_LABELS,
  useApplicationActivity,
  useApplicationMessages,
  useCurrentUser,
  useDashboard,
  useDocumentRequirements,
  useMarkMessagesRead,
  usePostMessage,
  type ApplicationStatus,
} from "@/lib/api";

export const Route = createFileRoute("/onboarding/dashboard")({ component: OnboardingDashboard });

const STATUS_COPY: Record<
  ApplicationStatus,
  { title: string; body: string; tone: string; icon: React.ReactNode }
> = {
  draft: {
    title: "Application in draft",
    body: "Finish the outstanding sections below and submit for verification.",
    tone: "border-border bg-muted/50",
    icon: <FileText className="size-5" />,
  },
  under_review: {
    title: "Under review by the Beldium verification team",
    body: "Typical turnaround is 5 working days. You will be notified if anything further is needed.",
    tone: "border-brand/30 bg-brand-soft/60",
    icon: <Clock className="size-5" />,
  },
  action_required: {
    title: "Information required",
    body: "Reviewers need more from you before verification can continue. The requested documents are listed below.",
    tone: "border-warning/50 bg-warning/15",
    icon: <AlertTriangle className="size-5" />,
  },
  conditionally_approved: {
    title: "Conditionally verified",
    body: "You have limited platform access while the conditions below are outstanding.",
    tone: "border-warning/50 bg-warning/10",
    icon: <ShieldCheck className="size-5" />,
  },
  verified: {
    title: "Organisation verified",
    body: "Full access has been granted to your compliance workspace.",
    tone: "border-success/50 bg-success/25",
    icon: <CheckCircle2 className="size-5" />,
  },
  rejected: {
    title: "Application not approved",
    body: "Your application was declined. The reviewer's notes are below; resolve them and resubmit.",
    tone: "border-danger/50 bg-danger/15",
    icon: <AlertTriangle className="size-5" />,
  },
};

/** Backend `progress.sections` keys, in the order the flow presents them. */
const SECTION_LABELS: Record<string, string> = {
  account: "Organisation linked",
  organisation: "Organisation details",
  documents: "Required documents",
  personnel: "Personnel registered",
  inspection_capability: "Inspection capability",
  conflict_declaration: "Conflict declaration",
  declaration: "Declarations signed",
};

function OnboardingDashboard() {
  const { role } = useOnboarding();
  const navigate = useNavigate();

  const dashboard = useDashboard();
  const { application, organisation, applicationId } = useApplicationContext();
  const currentUser = useCurrentUser();
  const requirements = useDocumentRequirements(applicationId);
  const messages = useApplicationMessages(applicationId);
  const postMessage = usePostMessage(applicationId);
  const markRead = useMarkMessagesRead(applicationId);
  const activity = useApplicationActivity(applicationId);

  const [reply, setReply] = useState("");
  const roleEntry = roleCatalogue.find((r) => r.role === role);

  // The row from GET /dashboard/ is the authoritative summary; the detail
  // fetch backs the sections that need more than counts.
  const row =
    dashboard.data?.applications.find((a) => a.application_id === applicationId) ??
    dashboard.data?.applications[0];

  const status = row?.status ?? application?.status ?? "draft";
  const copy = STATUS_COPY[status];
  const progress = row?.progress ?? application?.progress;
  const pct = progress?.percent ?? 0;

  // Clear the unread badge once the thread has actually been looked at.
  useEffect(() => {
    if (applicationId && (row?.unread_messages ?? 0) > 0) markRead.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applicationId, row?.unread_messages]);

  const requestedDocuments = (requirements.data ?? []).filter((r) => r.status === "requested");
  const conditions = (row?.conditional_requirements ?? application?.conditional_requirements ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const reviewNotes = row?.review_notes ?? application?.review_notes ?? "";

  if (dashboard.isLoading) {
    return (
      <AuthShell eyebrow="Onboarding workspace" title="Loading your workspace" width="lg">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Reading your application status…
        </div>
      </AuthShell>
    );
  }

  if (!row && !application) {
    return (
      <AuthShell
        eyebrow="Onboarding workspace"
        title="No application yet"
        description="Start your organisation application to open the verification workspace."
        width="lg"
      >
        <Button asChild>
          <Link to="/onboarding/application">Start application</Link>
        </Button>
      </AuthShell>
    );
  }

  const firstName = currentUser.data?.first_name ?? "";

  return (
    <AuthShell
      eyebrow="Onboarding workspace"
      title={`Welcome${firstName ? `, ${firstName}` : ""}`}
      description={
        roleEntry
          ? `${roleEntry.title} · permissions are provisioned once verification completes.`
          : "Complete your registration to gain access."
      }
      width="lg"
    >
      <div className={`rounded-[20px] border p-5 ${copy.tone}`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-[14px] bg-surface">
              {copy.icon}
            </span>
            <div>
              <p className="font-display text-base font-semibold">{copy.title}</p>
              <p className="mt-1 max-w-xl text-sm text-muted-foreground">{copy.body}</p>
              {application?.submitted_at && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Submitted {new Date(application.submitted_at).toLocaleString()}
                </p>
              )}
            </div>
          </div>
          <span className="rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium">
            {APPLICATION_STATUS_LABELS[status]}
          </span>
        </div>
        {(row?.reference ?? application?.reference) && (
          <p className="mt-4 text-xs text-muted-foreground">
            Reference {row?.reference ?? application?.reference}
          </p>
        )}
        {status === "verified" && (
          <Button className="mt-4" onClick={() => navigate({ to: "/onboarding/welcome" })}>
            Open my workspace
          </Button>
        )}
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-5">
          <div className="rounded-[20px] border border-border p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="font-display text-sm font-semibold">Registration progress</p>
              <span className="text-sm font-medium tabular-nums">{pct}%</span>
            </div>
            <Progress value={pct} className="mt-3" />
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {Object.entries(progress?.sections ?? {}).map(([key, done]) => (
                <li key={key} className="flex items-center gap-2 text-sm">
                  <span
                    className={`grid size-5 place-items-center rounded-full text-[10px] ${done ? "bg-success/60" : "bg-muted text-muted-foreground"}`}
                  >
                    {done ? "✓" : "–"}
                  </span>
                  <span className={done ? "" : "text-muted-foreground"}>
                    {SECTION_LABELS[key] ?? key}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link to="/onboarding/application">Continue application</Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link to="/onboarding/join">Organisation access</Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link to="/onboarding/admin">Administrator review</Link>
              </Button>
            </div>
          </div>

          {requestedDocuments.length > 0 && (
            <div className="rounded-[20px] border border-warning/50 p-5">
              <p className="font-display text-sm font-semibold">
                Documents requested by the reviewer
              </p>
              <div className="mt-3 space-y-3">
                {requestedDocuments.map((r) => {
                  const document = application?.documents.find(
                    (d) => d.document_type === r.document_type,
                  );
                  return (
                    <div key={r.document_type} className="rounded-[14px] border border-border p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-medium">{r.title}</p>
                        <span className="text-xs text-muted-foreground">
                          {DOCUMENT_STATUS_LABELS[r.status]}
                        </span>
                      </div>
                      {document?.request_message && (
                        <p className="mt-1 text-sm text-muted-foreground">
                          {document.request_message}
                        </p>
                      )}
                      <Button className="mt-3" size="sm" variant="outline" asChild>
                        <Link to="/onboarding/application">Upload in the application</Link>
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {conditions.length > 0 && (
            <div className="rounded-[20px] border border-warning/50 p-5">
              <p className="font-display text-sm font-semibold">
                Conditions of your provisional access
              </p>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                {conditions.map((c) => (
                  <li key={c} className="flex gap-2">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-warning" />
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {reviewNotes && (
            <div className="rounded-[20px] border border-border p-5">
              <p className="font-display text-sm font-semibold">Reviewer notes</p>
              <p className="mt-2 text-sm text-muted-foreground">{reviewNotes}</p>
            </div>
          )}

          <div className="rounded-[20px] border border-border p-5">
            <p className="font-display text-sm font-semibold">Submitted details</p>
            <div className="mt-2">
              <InfoRow
                label="Contact"
                value={`${currentUser.data?.first_name ?? ""} ${currentUser.data?.last_name ?? ""} · ${currentUser.data?.email ?? ""}`.trim()}
              />
              <InfoRow
                label="Organisation"
                value={row?.organisation_name ?? organisation?.name ?? "-"}
              />
              <InfoRow
                label="Documents"
                value={`${row?.documents_submitted ?? 0} of ${row?.documents_required ?? 0} required`}
              />
              <InfoRow label="Personnel" value={`${row?.personnel_count ?? 0} registered`} />
              <InfoRow
                label="Inspection capability"
                value={
                  application?.inspection_capability?.conducts_physical_inspections
                    ? "Declared"
                    : "Not declared"
                }
              />
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-[20px] border border-border p-5">
            <p className="font-display text-sm font-semibold">Permissions granted</p>
            <ul className="mt-3 space-y-2 text-xs text-muted-foreground">
              {(roleEntry?.permissions ?? []).map((p) => (
                <li key={p} className="flex items-center gap-2">
                  <Users className="size-3.5" /> {p}
                  <span className="ml-auto">
                    {status === "verified"
                      ? "Active"
                      : status === "conditionally_approved"
                        ? "Limited"
                        : "Pending"}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[11px] text-muted-foreground">
              Role permissions are a local catalogue; the API does not publish a per-role permission
              list.
            </p>
          </div>

          <div className="rounded-[20px] border border-border p-5">
            <p className="font-display text-sm font-semibold">Activity</p>
            {activity.isLoading && (
              <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="size-3.5 animate-spin" /> Loading…
              </p>
            )}
            <ol className="mt-3 space-y-3">
              {(activity.data?.results ?? []).slice(0, 8).map((entry) => (
                <li key={entry.id} className="border-l-2 border-border pl-3">
                  <p className="text-sm">{entry.description}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {entry.actor} · {new Date(entry.created_at).toLocaleString()}
                  </p>
                </li>
              ))}
              {(activity.data?.results ?? []).length === 0 && !activity.isLoading && (
                <li className="text-xs text-muted-foreground">No activity recorded yet.</li>
              )}
            </ol>
            {(activity.data?.count ?? 0) > 8 && (
              <p className="mt-3 text-[11px] text-muted-foreground">
                Showing the 8 most recent of {activity.data?.count}.
              </p>
            )}
          </div>

          <div className="rounded-[20px] border border-border p-5">
            <p className="font-display text-sm font-semibold">Messages</p>
            {messages.isLoading && (
              <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="size-3.5 animate-spin" /> Loading…
              </p>
            )}
            <ol className="mt-3 space-y-3">
              {(messages.data ?? []).map((m) => (
                <li key={m.id} className="border-l-2 border-border pl-3">
                  <p className="text-sm">{m.body}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {m.author_email} · {new Date(m.created_at).toLocaleString()}
                  </p>
                </li>
              ))}
              {(messages.data ?? []).length === 0 && !messages.isLoading && (
                <li className="text-xs text-muted-foreground">No messages yet.</li>
              )}
            </ol>
            <div className="mt-3 space-y-2">
              <Textarea
                rows={2}
                placeholder="Message the review team."
                value={reply}
                onChange={(e) => setReply(e.target.value)}
              />
              <Button
                size="sm"
                disabled={postMessage.isPending || !applicationId}
                onClick={async () => {
                  if (reply.trim().length < 2) {
                    toast.error("Write a message before sending.");
                    return;
                  }
                  try {
                    await postMessage.mutateAsync(reply.trim());
                    setReply("");
                    toast.success("Message sent to the review team.");
                  } catch (error) {
                    toast.error(
                      error instanceof ApiError ? error.message : "That message could not be sent.",
                    );
                  }
                }}
              >
                <Send className="mr-1 size-3.5" /> {postMessage.isPending ? "Sending…" : "Send"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </AuthShell>
  );
}
