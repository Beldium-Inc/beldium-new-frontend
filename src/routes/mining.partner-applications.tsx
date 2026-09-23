import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
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
import { PageHeader, Panel, EmptyState } from "@/verticals/mining/components/primitives";
import { StatusChip } from "@/verticals/mining/components/chips";
import {
  useComplianceApplications,
  useDecideComplianceApplication,
  useReviewComplianceDocument,
} from "@/lib/api/queries";
import type { ApplicationStatus, ComplianceApplication, ComplianceDocument } from "@/lib/api/types";
import { ApiError } from "@/lib/api/errors";

export const Route = createFileRoute("/mining/partner-applications")({ component: Page });

const statusLabel: Record<ApplicationStatus, string> = {
  draft: "Draft",
  under_review: "Under Review",
  action_required: "Info Requested",
  conditionally_approved: "Conditionally Approved",
  verified: "Verified",
  rejected: "Rejected",
};

const REVIEWABLE_STATUSES: ApplicationStatus[] = ["under_review", "action_required", "conditionally_approved"];

function DocumentRow({ application, document }: { application: ComplianceApplication; document: ComplianceDocument }) {
  const review = useReviewComplianceDocument(application.id);

  const act = async (status: "verified" | "rejected") => {
    try {
      await review.mutateAsync({ documentId: document.id, status });
      toast.success(`${document.title} marked ${status}`);
    } catch (err) {
      toast.error("Could not review this document", {
        description: err instanceof ApiError ? err.message : "Please try again.",
      });
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-sm border border-border px-3 py-2">
      <div className="text-sm">
        <span className="font-medium">{document.title}</span>{" "}
        <span className="text-xs text-muted-foreground">({document.document_type})</span>
      </div>
      <div className="flex items-center gap-2">
        <StatusChip
          value={document.status === "submitted" ? "Under Review" : statusLabel[document.status as ApplicationStatus] ?? document.status}
        />
        {document.status === "submitted" ? (
          <>
            <Button size="sm" variant="outline" disabled={review.isPending} onClick={() => void act("verified")}>
              Verify
            </Button>
            <Button size="sm" variant="outline" disabled={review.isPending} onClick={() => void act("rejected")}>
              Reject
            </Button>
          </>
        ) : null}
      </div>
    </div>
  );
}

function ApplicationRow({ application }: { application: ComplianceApplication }) {
  const [expanded, setExpanded] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const decide = useDecideComplianceApplication();

  const canReview = REVIEWABLE_STATUSES.includes(application.status);
  const documentsPending = application.documents.filter((d) => d.status !== "verified").length;
  const readyToVerify = application.progress.percent === 100 && documentsPending === 0;

  const run = async (status: "verified" | "rejected", notes?: string) => {
    try {
      await decide.mutateAsync({ id: application.id, status, notes });
      toast.success(
        status === "verified" ? "Compliance partner verified" : "Application rejected",
        {
          description:
            status === "verified"
              ? "The organisation now sees the full mining register."
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
        <TableCell className="font-mono text-xs font-medium">{application.reference ?? "—"}</TableCell>
        <TableCell className="text-sm font-medium">{application.organisation_profile.name ?? "—"}</TableCell>
        <TableCell>
          <StatusChip value={statusLabel[application.status]} />
        </TableCell>
        <TableCell className="text-sm text-muted-foreground">{application.progress.percent}%</TableCell>
        <TableCell className="text-sm text-muted-foreground">
          {application.submitted_at ? new Date(application.submitted_at).toLocaleDateString() : "Not submitted"}
        </TableCell>
        <TableCell className="text-right">
          <div className="flex items-center justify-end gap-2">
            <Button size="sm" variant="outline" onClick={() => setExpanded((v) => !v)}>
              {expanded ? "Hide documents" : "Review documents"}
            </Button>
            {canReview ? (
              <>
                <Button
                  size="sm"
                  disabled={!readyToVerify || decide.isPending}
                  title={!readyToVerify ? "Complete every section and verify every document first" : undefined}
                  onClick={() => void run("verified")}
                >
                  Verify
                </Button>
                <Button size="sm" variant="outline" disabled={decide.isPending} onClick={() => setRejecting(true)}>
                  Reject
                </Button>
              </>
            ) : null}
          </div>
        </TableCell>
      </TableRow>
      {expanded ? (
        <TableRow>
          <TableCell colSpan={6} className="bg-muted/30">
            {application.documents.length === 0 ? (
              <p className="py-2 text-sm text-muted-foreground">No documents submitted yet.</p>
            ) : (
              <div className="space-y-2 py-2">
                {application.documents.map((doc) => (
                  <DocumentRow key={doc.id} application={application} document={doc} />
                ))}
              </div>
            )}
            {application.progress.outstanding_sections.length > 0 ? (
              <p className="pb-2 text-xs text-muted-foreground">
                Outstanding sections: {application.progress.outstanding_sections.join(", ")}
              </p>
            ) : null}
          </TableCell>
        </TableRow>
      ) : null}

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

function Page() {
  const { data, isPending, error } = useComplianceApplications();
  const applications = data?.results ?? [];

  return (
    <>
      <PageHeader
        title="Partner Applications"
        description="Approve or reject organisations applying to become a Beldium compliance partner. Staff only — a verified compliance partner cannot review another partner's application."
      />
      <Panel title="Applications" bodyClassName="p-0">
        {isPending ? (
          <div className="p-6 text-sm text-muted-foreground">Loading applications…</div>
        ) : error ? (
          <div className="p-6 text-sm text-destructive">
            {error instanceof ApiError ? error.message : "Could not load applications."}
          </div>
        ) : applications.length === 0 ? (
          <EmptyState
            title="No partner applications yet"
            description="Organisations applying to become a compliance partner will appear here."
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reference</TableHead>
                  <TableHead>Organisation</TableHead>
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
      </Panel>
    </>
  );
}
