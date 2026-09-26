import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { FileSearch, LogOut } from "lucide-react";
import { toast } from "sonner";
import { BeldiumLogo } from "@/components/beldium-logo";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ApplicationDetails } from "@/components/staff/application-details";
import { DocumentStatusBadge, DocumentViewer } from "@/components/staff/document-viewer";
import { useAuth } from "@/lib/auth";
import {
  useApplicationsByOrganisationType,
  useDecideComplianceApplication,
} from "@/lib/api/queries";
import { dedupeOrganisations, type DedupeReport } from "@/lib/api/organisations";
import type { ApplicationStatus, ComplianceApplication, ComplianceDocument } from "@/lib/api/types";
import { ApiError } from "@/lib/api/errors";
import { cn } from "@/lib/utils";

// Client-only, like the /mining layout: the JWT pair lives in localStorage, so
// a server-rendered pass hydrates with useHasTokens() === false, the auth guard
// below sees "unauthenticated" and bounces to /signin, which then forwards the
// (perfectly valid) session on to its dashboard instead of this page.
export const Route = createFileRoute("/staff/compliance-vetting")({ ssr: false, component: Page });

// Organisation types that gate into the shared compliance-partner audience
// bucket (see organisations/access.py audience()) once verified: the ones
// this desk exists to vet, as opposed to the miners themselves, who are
// verified separately on the Mining Organisations register.
const PARTNER_TYPES = ["compliance_partner", "inspection_body"];

const statusLabel: Record<ApplicationStatus, string> = {
  draft: "Draft",
  under_review: "Under Review",
  action_required: "Info Requested",
  conditionally_approved: "Conditionally Approved",
  verified: "Verified",
  rejected: "Rejected",
};

const statusTone: Record<ApplicationStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  under_review: "bg-amber-100 text-amber-800",
  action_required: "bg-orange-100 text-orange-800",
  conditionally_approved: "bg-blue-100 text-blue-800",
  verified: "bg-emerald-100 text-emerald-800",
  rejected: "bg-red-100 text-red-800",
};

const REVIEWABLE_STATUSES: ApplicationStatus[] = [
  "under_review",
  "action_required",
  "conditionally_approved",
];

function Badge({ label, tone }: { label: string; tone: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        tone,
      )}
    >
      {label}
    </span>
  );
}

function DocumentRow({ document, onOpen }: { document: ComplianceDocument; onOpen: () => void }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border px-3 py-2">
      <button type="button" className="text-left text-sm hover:underline" onClick={onOpen}>
        <span className="font-medium">{document.title}</span>{" "}
        <span className="text-xs text-muted-foreground">
          ({document.original_name || document.document_type})
        </span>
      </button>
      <div className="flex items-center gap-2">
        <DocumentStatusBadge status={document.status} />
        <Button
          size="sm"
          variant={document.status === "submitted" ? "default" : "outline"}
          onClick={onOpen}
        >
          <FileSearch className="size-3.5" />
          {document.status === "submitted" ? "Open & review" : "Open"}
        </Button>
      </div>
    </div>
  );
}

function ApplicationRow({ application }: { application: ComplianceApplication }) {
  const [expanded, setExpanded] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const decide = useDecideComplianceApplication();
  const [openDocumentId, setOpenDocumentId] = useState<string | null>(null);

  const canReview = REVIEWABLE_STATUSES.includes(application.status);
  const documentsPending = application.documents.filter((d) => d.status !== "verified").length;
  const readyToVerify = application.progress.percent === 100 && documentsPending === 0;
  const orgType =
    application.organisation_type ?? application.organisation_profile.organisation_type;

  const run = async (status: "verified" | "rejected", notes?: string) => {
    try {
      await decide.mutateAsync({ id: application.id, status, notes });
      toast.success(
        status === "verified" ? "Compliance partner verified" : "Application rejected",
        {
          description:
            status === "verified"
              ? "This organisation can now see and claim mining applications."
              : "The applicant can see the reason and resubmit.",
        },
      );
      setRejecting(false);
      setReason("");
    } catch (err) {
      toast.error("Could not record the decision", {
        description: err instanceof ApiError ? err.message : "Please try again.",
      });
    }
  };

  return (
    <>
      <TableRow>
        <TableCell className="font-mono text-xs font-medium">
          {application.reference ?? "-"}
        </TableCell>
        <TableCell className="text-sm font-medium">
          {application.organisation_profile.name ?? "-"}
        </TableCell>
        <TableCell className="text-sm text-muted-foreground capitalize">
          {orgType?.replace("_", " ") ?? "-"}
        </TableCell>
        <TableCell>
          <Badge label={statusLabel[application.status]} tone={statusTone[application.status]} />
        </TableCell>
        <TableCell className="text-sm text-muted-foreground">
          {application.progress.percent}%
        </TableCell>
        <TableCell className="text-sm text-muted-foreground">
          {application.submitted_at
            ? new Date(application.submitted_at).toLocaleDateString()
            : "Not submitted"}
        </TableCell>
        <TableCell className="text-right">
          <div className="flex items-center justify-end gap-2">
            <Button size="sm" variant="outline" onClick={() => setExpanded((v) => !v)}>
              {expanded ? "Hide details" : "Review details"}
            </Button>
            {canReview ? (
              <>
                <Button
                  size="sm"
                  disabled={!readyToVerify || decide.isPending}
                  title={
                    !readyToVerify
                      ? "Complete every section and verify every document first"
                      : undefined
                  }
                  onClick={() => void run("verified")}
                >
                  Verify
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={decide.isPending}
                  onClick={() => setRejecting(true)}
                >
                  Reject
                </Button>
              </>
            ) : null}
          </div>
        </TableCell>
      </TableRow>
      {expanded ? (
        <TableRow>
          <TableCell colSpan={7} className="bg-muted/30">
            <div className="space-y-3 py-3 text-sm">
              <ApplicationDetails application={application} />

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Documents ({application.documents.length})
                </p>
                <p className="mb-2 text-xs text-muted-foreground">
                  Open each document to read it and check its contents against what the applicant
                  declared.
                </p>
                {application.documents.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No documents submitted yet.</p>
                ) : (
                  <div className="space-y-2">
                    {application.documents.map((doc) => (
                      <DocumentRow
                        key={doc.id}
                        document={doc}
                        onOpen={() => setOpenDocumentId(doc.id)}
                      />
                    ))}
                  </div>
                )}
              </div>

              {application.progress.outstanding_sections.length > 0 ? (
                <p className="text-xs text-muted-foreground">
                  Outstanding sections: {application.progress.outstanding_sections.join(", ")}
                </p>
              ) : null}
            </div>
          </TableCell>
        </TableRow>
      ) : null}

      <DocumentViewer
        application={application}
        documentId={openDocumentId}
        onNavigate={setOpenDocumentId}
        onClose={() => setOpenDocumentId(null)}
      />

      <Dialog open={rejecting} onOpenChange={setRejecting}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject this application?</DialogTitle>
            <DialogDescription>
              The applicant will see this reason and can revise and resubmit.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Why is this being rejected?"
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejecting(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={!reason.trim() || decide.isPending}
              onClick={() => void run("rejected", reason)}
            >
              Reject application
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function DedupePanel() {
  const [report, setReport] = useState<DedupeReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);

  const preview = async () => {
    setLoading(true);
    try {
      setReport(await dedupeOrganisations(false));
    } catch (err) {
      toast.error("Could not check for duplicates", {
        description: err instanceof ApiError ? err.message : "Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const apply = async () => {
    setApplying(true);
    try {
      const result = await dedupeOrganisations(true);
      setReport(result);
      toast.success(`Removed ${result.organisations_removed} duplicate organisation(s).`);
    } catch (err) {
      toast.error("Could not remove duplicates", {
        description: err instanceof ApiError ? err.message : "Please try again.",
      });
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="mb-8 overflow-hidden rounded-2xl border border-border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-5">
        <div>
          <h2 className="font-display text-lg font-semibold">Duplicate organisations</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Onboarding used to let the same company end up as several separate organisation records.
            New duplicates are blocked now; this cleans up ones already in the database. For each
            group sharing a name and type, one organisation is kept (a verified one if there's
            exactly one, otherwise the oldest) and the rest are removed along with any mine sites or
            mining applications only they held.
          </p>
        </div>
        <Button variant="outline" onClick={() => void preview()} disabled={loading}>
          {loading ? "Checking…" : "Check for duplicates"}
        </Button>
      </div>

      {report ? (
        <div className="p-5">
          {report.groups.length === 0 && report.skipped_ambiguous.length === 0 ? (
            <p className="text-sm text-muted-foreground">No duplicates found.</p>
          ) : (
            <>
              {report.groups.map((group) => (
                <div
                  key={`${group.name}-${group.organisation_type}`}
                  className="mb-4 rounded-lg border border-border p-4"
                >
                  <p className="text-sm font-medium">
                    {group.name}{" "}
                    <span className="text-muted-foreground">
                      ({group.organisation_type.replace("_", " ")})
                    </span>
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Keeping {group.keeper_beldium_id ?? group.keeper_id}
                  </p>
                  <ul className="mt-2 space-y-1">
                    {group.removed.map((org) => (
                      <li key={org.id} className="text-xs text-muted-foreground">
                        {report.applied ? "Removed" : "Would remove"} {org.beldium_id ?? org.id}:{" "}
                        {org.verification_status}, {org.site_count} site(s),{" "}
                        {org.mining_application_count} mining application(s), members:{" "}
                        {org.member_emails.join(", ") || "none"}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}

              {report.skipped_ambiguous.map((skipped) => (
                <div
                  key={`${skipped.name}-${skipped.organisation_type}`}
                  className="mb-4 rounded-lg border border-amber-300 bg-amber-50 p-4"
                >
                  <p className="text-sm font-medium text-amber-900">
                    {skipped.name} ({skipped.organisation_type.replace("_", " ")}), skipped
                  </p>
                  <p className="mt-1 text-xs text-amber-800">
                    {skipped.reason}. Resolve this one manually.
                  </p>
                </div>
              ))}

              {!report.applied && report.organisations_removed > 0 ? (
                <Button variant="destructive" onClick={() => void apply()} disabled={applying}>
                  {applying ? "Removing…" : `Remove ${report.organisations_removed} duplicate(s)`}
                </Button>
              ) : null}
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}

function Page() {
  const { user, status, signOut } = useAuth();
  const navigate = useNavigate();
  const { data, isPending, error } = useApplicationsByOrganisationType(PARTNER_TYPES);

  useEffect(() => {
    if (status === "unauthenticated") {
      navigate({ to: "/signin" });
    }
  }, [status, navigate]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  if (!user?.is_staff) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
        <div className="max-w-sm rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
          <h1 className="font-display text-lg font-semibold">Staff access only</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This page is for Beldium's own compliance desk. Your account doesn't have staff access.
          </p>
        </div>
      </div>
    );
  }

  // Filtered server-side on the organisation record's type; the profile's
  // copy is empty until the applicant saves that section.
  const applications = data?.results ?? [];

  return (
    <div className="min-h-screen bg-muted/40">
      <header className="flex items-center justify-between border-b border-border bg-surface px-6 py-4">
        <div className="flex items-center gap-3">
          <BeldiumLogo className="size-9 rounded-2xl" />
          <div>
            <p className="font-display text-sm font-semibold">Beldium Staff</p>
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
              Compliance Partner Vetting
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <p className="hidden text-sm text-muted-foreground sm:block">{user.email}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void signOut().then(() => navigate({ to: "/signin" }))}
          >
            <LogOut className="size-4" /> Log out
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <DedupePanel />

        <div className="mb-6">
          <h1 className="font-display text-2xl font-semibold">Compliance partner applications</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Vet organisations applying to become a compliance partner or inspection body before they
            join the partner pool and gain visibility into mining applications. This is separate
            from the compliance dashboard so only Beldium's own desk can act here. Keep access
            limited to one or two staff accounts.
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          {isPending ? (
            <div className="p-6 text-sm text-muted-foreground">Loading applications…</div>
          ) : error ? (
            <div className="p-6 text-sm text-destructive">
              {error instanceof ApiError ? error.message : "Could not load applications."}
            </div>
          ) : applications.length === 0 ? (
            <div className="p-10 text-center text-sm text-muted-foreground">
              No compliance-partner applications waiting on review.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reference</TableHead>
                    <TableHead>Organisation</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {applications.map((app) => (
                    <ApplicationRow key={app.id} application={app} />
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
