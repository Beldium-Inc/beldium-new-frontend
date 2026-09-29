import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
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
import { EmptyState, Field, PageHeader, Panel } from "@/verticals/mining/components/primitives";
import { StatusChip } from "@/verticals/mining/components/chips";
import { SiteReview } from "@/verticals/mining/components/SiteReview";
import { useStore } from "@/verticals/mining/store";
import {
  useApproveApplication,
  useClaimApplication,
  useMiningApplications,
  useMiningCapabilities,
  useOrganisationVerification,
  useRejectApplication,
  useSiteFiles,
} from "@/lib/api/mining-queries";
import type { MiningApplicationStatus } from "@/lib/api/mining";
import { ApiError } from "@/lib/api/errors";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/mining/applications/$applicationId")({
  component: ApplicationReview,
});

const statusLabel: Record<MiningApplicationStatus, string> = {
  pending: "Pending",
  under_review: "Under Review",
  approved: "Approved",
  rejected: "Rejected",
  info_requested: "Info Requested",
};

const orgStatusLabel = {
  draft: "Under Review",
  under_review: "Under Review",
  verified: "Verified",
  rejected: "Rejected",
  suspended: "Suspended",
} as const;

/**
 * A claimed application: the application itself, the mining organisation that
 * filed it and the full review of its mining site, with the decision that
 * closes it. Verifying is gated on every submitted document being verified,
 * the same rule the backend enforces.
 */
function ApplicationReview() {
  const { applicationId } = Route.useParams();
  const { user } = useAuth();
  const capabilities = useMiningCapabilities();
  const canDecide = Boolean(capabilities.data?.can_decide);
  const applications = useMiningApplications();
  const organisations = useOrganisationVerification();
  const { sites } = useStore();
  const claim = useClaimApplication();
  const approve = useApproveApplication();
  const reject = useRejectApplication();
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");

  const application = applications.data?.results.find((a) => a.id === applicationId) ?? null;
  const siteOrgId = sites.find((s) => s.id === application?.site)?.orgId ?? null;
  const orgId = application?.organisation ?? siteOrgId;
  const org = organisations.data?.results.find((o) => o.id === orgId) ?? null;

  // The same document set the site review lists: every file the organisation
  // filed, across all of its sites.
  const siteIds = useMemo(() => {
    const ids = new Set(sites.filter((s) => orgId && s.orgId === orgId).map((s) => s.id));
    if (application?.site) ids.add(application.site);
    return [...ids].sort();
  }, [sites, orgId, application?.site]);
  const { documents, isLoading: documentsLoading } = useSiteFiles(siteIds);
  const filed = documents.filter((d) => d.file_url);
  const unverified = filed.filter((d) => d.status !== "verified");

  if (!application) {
    return (
      <Panel title={applications.isPending ? "Loading application…" : "Application not found"}>
        {!applications.isPending ? (
          <Button asChild variant="outline">
            <Link to="/mining/applications">Back to applications</Link>
          </Button>
        ) : null}
      </Panel>
    );
  }

  const claimedByMe = Boolean(user && application.assigned_to === user.id);
  const claimedByOther = Boolean(application.assigned_to && !claimedByMe);
  const decided = application.status === "approved" || application.status === "rejected";
  const canSeeDetails = claimedByMe || decided || !canDecide;

  const blockers: string[] = [];
  if (!application.site) blockers.push("This application is not linked to a mine site.");
  else if (!documentsLoading && filed.length === 0)
    blockers.push("No documents have been submitted.");
  else if (unverified.length)
    blockers.push(
      `${unverified.length} of ${filed.length} document${filed.length > 1 ? "s" : ""} still to verify.`,
    );
  const ready = !documentsLoading && blockers.length === 0;

  const onClaim = async () => {
    try {
      await claim.mutateAsync(application.id);
      toast.success(`Claimed ${application.reference}`);
    } catch (err) {
      toast.error("Could not claim this application.", {
        description: err instanceof ApiError ? err.message : "Please try again.",
      });
    }
  };

  const onApprove = async () => {
    try {
      await approve.mutateAsync(application.id);
      toast.success(`${application.reference} verified`, {
        description: "The site is now operational and the miner has been notified.",
      });
    } catch (err) {
      toast.error("Could not verify this application", {
        description: err instanceof ApiError ? err.message : "Please try again.",
      });
    }
  };

  const onReject = async () => {
    try {
      await reject.mutateAsync({ id: application.id, reason: reason.trim() });
      toast.success(`${application.reference} rejected`, {
        description: "The miner can see the reason.",
      });
      setRejecting(false);
      setReason("");
    } catch (err) {
      toast.error("Could not reject this application", {
        description: err instanceof ApiError ? err.message : "Please try again.",
      });
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Application review"
        title={`${application.reference}: ${application.site_name || "Mine site"}`}
        description={
          decided
            ? "This application has been decided. Its record stays here as history."
            : "Verify every submitted document below. Once they are all verified, the application can be verified."
        }
        actions={
          claimedByMe && !decided ? (
            <>
              <Button disabled={!ready || approve.isPending} onClick={() => void onApprove()}>
                <CheckCircle2 className="size-4" />
                {approve.isPending ? "Verifying…" : "Verify application"}
              </Button>
              <Button variant="outline" onClick={() => setRejecting(true)}>
                <XCircle className="size-4" /> Reject
              </Button>
            </>
          ) : null
        }
      />

      {claimedByMe && !decided ? (
        <div
          className={`mb-5 rounded-md border p-4 text-sm ${
            ready ? "border-success/40 bg-success/10" : "border-warning/40 bg-warning/10"
          }`}
        >
          {documentsLoading
            ? "Checking submitted documents…"
            : ready
              ? `All ${filed.length} submitted documents are verified. You can verify this application.`
              : `Verify application unlocks once every submitted document is verified: ${blockers.join(" ")}`}
        </div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="Application">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Reference" value={application.reference} />
            <Field label="Status">
              <StatusChip value={statusLabel[application.status] ?? application.status} />
            </Field>
            <Field label="Type" value={application.type || "-"} />
            <Field label="Mineral" value={application.mineral || "-"} />
            <Field label="Submitted" value={application.submitted_on ?? "-"} />
            <Field label="Stage" value={application.stage || "-"} />
            <Field
              label="SLA"
              value={application.sla_days ? `${application.sla_days} days` : "-"}
            />
            <Field
              label="Reviewer"
              value={claimedByMe ? "You" : (application.assigned_to_name ?? "Unclaimed")}
            />
          </div>
        </Panel>

        <Panel title="Mining organisation">
          {org ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name" value={org.name} />
              <Field label="Beldium ID" value={org.beldium_id ?? "-"} />
              <Field label="Verification">
                <StatusChip value={orgStatusLabel[org.verification_status]} />
              </Field>
              <Field label="Sites verified" value={`${org.sites_verified}/${org.sites_total}`} />
              <Field
                label="Documents verified"
                value={`${org.documents_verified}/${org.documents_total}`}
              />
              {org.rejection_reason ? (
                <Field label="Rejection reason" value={org.rejection_reason} />
              ) : null}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {organisations.isPending
                ? "Loading organisation…"
                : "Organisation details unavailable."}
            </p>
          )}
        </Panel>
      </div>

      {!canSeeDetails ? (
        <Panel title="Mining site" className="mt-5">
          {claimedByOther ? (
            <EmptyState
              title={`Claimed by ${application.assigned_to_name ?? "another reviewer"}`}
              description="Only the claiming reviewer works this application."
            />
          ) : (
            <div className="flex flex-col items-start gap-3">
              <p className="text-sm text-muted-foreground">
                Claim this application to open its mining site review and documents. Claiming locks
                it to you.
              </p>
              <Button disabled={claim.isPending} onClick={() => void onClaim()}>
                Claim application
              </Button>
            </div>
          )}
        </Panel>
      ) : application.site ? (
        <SiteReview siteId={application.site} embedded />
      ) : (
        <Panel title="Mining site" className="mt-5">
          <EmptyState
            title="No site linked"
            description="This application does not reference a mine site."
          />
        </Panel>
      )}

      <Dialog open={rejecting} onOpenChange={setRejecting}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject {application.reference}</DialogTitle>
            <DialogDescription>The miner will see this reason.</DialogDescription>
          </DialogHeader>
          <Textarea rows={4} value={reason} onChange={(e) => setReason(e.target.value)} />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRejecting(false)}>
              Cancel
            </Button>
            <Button disabled={!reason.trim() || reject.isPending} onClick={() => void onReject()}>
              Record rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
