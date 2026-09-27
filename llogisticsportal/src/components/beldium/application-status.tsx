import { Link } from "@tanstack/react-router";
import { AlertTriangle, BadgeCheck, FileText } from "lucide-react";
import { useState } from "react";

import { PageHeader } from "@/components/beldium/shell";
import { StatCard } from "@/components/beldium/stat-card";
import { StatusBadge } from "@/components/beldium/status-badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ApiError } from "@/lib/api/errors";
import { isDemoMode } from "@/lib/data-mode";
import { complianceApprove, complianceRequestInfo } from "@/lib/onboarding-store";
import type { ApplicationRecord, RecordRequest, WorkspaceState } from "@/lib/workspace";

// Screens an operator sees while their organisation is being verified, laid
// out like Miner Hub's under-review workspace.

export function StartApplication() {
  return (
    <PageHeader
      title="Start your organisation application"
      description="Register your logistics organisation, fleet and drivers to unlock your workspace."
      actions={
        <Button asChild>
          <Link to="/application">Start application</Link>
        </Button>
      }
    />
  );
}

export function UnderReviewDashboard({ record }: { record: ApplicationRecord }) {
  const open = record.requests.filter((r) => r.status === "Open");
  const done = record.reviews.filter((r) => /approved|verified/i.test(r.status)).length;

  if (record.stage === "draft") {
    return (
      <PageHeader
        title={record.organisationName}
        description="Your application is saved as a draft. Finish and submit it to start verification."
        actions={
          <Button asChild>
            <Link to="/application">Continue application</Link>
          </Button>
        }
      />
    );
  }

  return (
    <>
      <PageHeader
        title={record.organisationName}
        description={`Application status: ${record.statusLabel.toLowerCase()}. Keep an eye on information requests from Beldium Logistics Compliance.`}
        actions={
          <Button asChild variant="outline">
            <Link to="/portal/application-record">
              <FileText className="mr-1.5 h-4 w-4" /> View submitted application
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Status" value={record.statusLabel} hint="Organisation verification" />
        <StatCard
          label="Reference"
          value={record.reference}
          hint={`Submitted ${record.submittedAt}`}
        />
        <StatCard
          label="Reviews complete"
          value={`${done} of ${record.reviews.length || "-"}`}
          hint="Organisation, fleet, drivers, documents"
        />
        <StatCard label="Info requests" value={String(open.length)} hint="Awaiting your response" />
      </div>

      {open.length ? (
        <div className="mt-6 rounded-md border border-warning/40 bg-warning/10 p-5">
          <div className="flex items-center gap-2 text-sm font-medium text-warning-foreground">
            <AlertTriangle className="h-4 w-4" /> {open.length} information request
            {open.length > 1 ? "s" : ""} need
            {open.length > 1 ? "" : "s"} a response
          </div>
          <Button asChild size="sm" className="mt-4">
            <Link to="/portal/requests">Respond with evidence</Link>
          </Button>
        </div>
      ) : null}

      <div className="mt-6 rounded-md border border-border bg-card p-5">
        <h2 className="text-sm font-semibold text-card-foreground">Review areas</h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {record.reviews.map((r) => (
            <li key={r.label} className="rounded-md border border-border p-3">
              <div className="text-xs text-muted-foreground">{r.label} review</div>
              <StatusBadge value={r.status} className="mt-1.5 whitespace-normal" />
            </li>
          ))}
          {record.reviews.length === 0 ? (
            <li className="text-sm text-muted-foreground">
              Review areas appear once review starts.
            </li>
          ) : null}
        </ul>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[3fr_2fr]">
        <ReviewTimeline record={record} />
        <div className="rounded-md border border-border bg-card p-5">
          <h2 className="text-sm font-semibold text-card-foreground">What happens next</h2>
          <ol className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li>1. Completeness check on your organisation record and documents.</li>
            <li>2. Fleet and driver credential review.</li>
            <li>3. Compliance and safety review, then a decision.</li>
          </ol>
          <p className="mt-3 text-sm text-muted-foreground">
            Once approved, your workspace unlocks transport requests, movements, fleet and payments.
          </p>
        </div>
      </div>

      <DemoComplianceControls />
    </>
  );
}

export function ReviewTimeline({ record }: { record: ApplicationRecord }) {
  return (
    <div className="rounded-md border border-border bg-card p-5">
      <h2 className="text-sm font-semibold text-card-foreground">Review timeline</h2>
      <ol className="mt-4 space-y-5">
        {record.timeline.map((t, i) => (
          <li key={`${t.at}-${i}`} className="flex gap-3">
            <span
              className={`mt-1.5 h-3 w-3 shrink-0 rounded-full ${i === 0 ? "bg-success ring-4 ring-success/20" : "bg-success"}`}
            />
            <div className="text-sm">
              <div className="font-medium text-card-foreground">{t.event}</div>
              <div className="text-xs text-muted-foreground">
                {t.by} · {t.at}
              </div>
            </div>
          </li>
        ))}
        {record.timeline.length === 0 ? (
          <li className="text-sm text-muted-foreground">No activity yet.</li>
        ) : null}
      </ol>
    </div>
  );
}

export function InformationRequests({ workspace }: { workspace: WorkspaceState }) {
  const requests = workspace.record?.requests ?? [];
  return (
    <div className="space-y-4">
      {requests.map((r) => (
        <RequestCard key={r.id} request={r} respond={workspace.respond} />
      ))}
      {requests.length === 0 ? (
        <div className="rounded-md border border-border bg-card p-5 text-sm text-muted-foreground">
          No information requests. Beldium Logistics Compliance will raise one here if it needs more
          evidence.
        </div>
      ) : null}
    </div>
  );
}

function RequestCard({
  request,
  respond,
}: {
  request: RecordRequest;
  respond: WorkspaceState["respond"];
}) {
  const [message, setMessage] = useState("");
  const [file, setFile] = useState<File | undefined>();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!message.trim()) return setError("Write a response before submitting.");
    setBusy(true);
    setError("");
    try {
      await respond({ requestId: request.id, message: message.trim(), file });
      setMessage("");
      setFile(undefined);
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Could not submit the response.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-md border border-border bg-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="font-medium text-card-foreground">{request.area}</div>
          <div className="text-xs text-muted-foreground">Requested {request.requestedAt}</div>
        </div>
        <StatusBadge value={request.status} />
      </div>
      <p className="mt-3 text-sm text-foreground">{request.message}</p>
      {request.status === "Open" ? (
        <div className="mt-4 space-y-4 border-t border-border pt-4">
          <div className="space-y-2">
            <Label htmlFor={`resp-${request.id}`}>Your response</Label>
            <Textarea
              id={`resp-${request.id}`}
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`file-${request.id}`}>Evidence (optional)</Label>
            <input
              id={`file-${request.id}`}
              type="file"
              className="block text-sm text-muted-foreground file:mr-3 file:rounded-full file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-secondary-foreground"
              onChange={(e) => setFile(e.target.files?.[0])}
            />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button size="sm" onClick={submit} disabled={busy}>
            {busy ? "Submitting…" : "Submit response"}
          </Button>
        </div>
      ) : request.response ? (
        <p className="mt-3 text-sm text-muted-foreground">
          Your response: {request.response}
          {request.evidence ? ` · Evidence: ${request.evidence}` : ""}
        </p>
      ) : null}
    </div>
  );
}

/** Shown on the command centre once the organisation is approved. */
export function VerifiedBanner({ record }: { record: ApplicationRecord }) {
  if (!record.approval) return null;
  const a = record.approval;
  return (
    <div className="mb-6 rounded-md border border-success/30 bg-success/10 p-5">
      <div className="flex items-center gap-2 text-sm font-medium text-success">
        <BadgeCheck className="h-4 w-4" /> Verified Logistics Operator · Beldium Logistics ID{" "}
        {a.logisticsId}
      </div>
      <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-xs text-muted-foreground">Approved services</dt>
          <dd className="text-foreground">{a.services.join(", ") || "-"}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Vehicle categories</dt>
          <dd className="text-foreground">{a.vehicleCategories}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Coverage</dt>
          <dd className="text-foreground">{a.coverage}</dd>
        </div>
      </dl>
    </div>
  );
}

/** Demo mode only: act as Beldium Logistics Compliance on the same records. */
export function DemoComplianceControls() {
  if (!isDemoMode) return null;
  return (
    <div className="mt-6 flex flex-wrap items-center gap-2 rounded-md border border-dashed border-border p-4 text-xs text-muted-foreground">
      <span>Demo only: simulate Beldium Logistics Compliance acting on this application.</span>
      <Button size="sm" variant="outline" onClick={complianceRequestInfo}>
        Request information
      </Button>
      <Button size="sm" variant="outline" onClick={complianceApprove}>
        Approve organisation
      </Button>
    </div>
  );
}
