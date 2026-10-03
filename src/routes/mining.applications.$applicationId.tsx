import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Building2, CheckCircle2, Lock, Mountain, ShieldCheck, XCircle } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState, Field, PageHeader, Panel } from "@/verticals/mining/components/primitives";
import { StatusChip } from "@/verticals/mining/components/chips";
import { SiteReview } from "@/verticals/mining/components/SiteReview";
import { OrganisationReview } from "@/verticals/mining/components/OrganisationReview";
import { isOrganisationDocumentName } from "@/verticals/mining/site-files";
import { useStore } from "@/verticals/mining/store";
import {
  useApproveApplication,
  useClaimApplication,
  useMiningApplications,
  useMiningCapabilities,
  useOrganisationVerification,
  useRejectApplication,
  useRejectApplicationOrganisation,
  useSiteFiles,
  useVerifyApplicationOrganisation,
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

/** The three stages the miner moves through, shown to the reviewer as a progress rail. */
function Stage({
  icon: Icon,
  title,
  note,
  state,
}: {
  icon: typeof Building2;
  title: string;
  note: string;
  state: "done" | "current" | "locked";
}) {
  return (
    <li
      className={`flex flex-1 items-start gap-3 rounded-md border p-3 ${
        state === "done"
          ? "border-success/40 bg-success/10"
          : state === "current"
            ? "border-primary/40 bg-primary/5"
            : "border-border bg-muted/40 opacity-70"
      }`}
    >
      <span
        className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full ${
          state === "done"
            ? "bg-success text-success-foreground"
            : state === "current"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground"
        }`}
      >
        {state === "done" ? (
          <CheckCircle2 className="size-4" />
        ) : state === "locked" ? (
          <Lock className="size-4" />
        ) : (
          <Icon className="size-4" />
        )}
      </span>
      <div className="min-w-0">
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-xs text-muted-foreground">{note}</p>
      </div>
    </li>
  );
}

/**
 * The whole verification happens here, in two stages, by the one reviewer who
 * claimed the application: first the mining organisation, then, once it is
 * verified, the mining site. The miner's workspace opens in step: partly once
 * the organisation is verified, fully once the site is.
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
  const verifyOrg = useVerifyApplicationOrganisation();
  const rejectOrg = useRejectApplicationOrganisation();
  const approve = useApproveApplication();
  const reject = useRejectApplication();
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [tab, setTab] = useState<"organisation" | "site">("organisation");

  const application = applications.data?.results.find((a) => a.id === applicationId) ?? null;
  const siteOrgId = sites.find((s) => s.id === application?.site)?.orgId ?? null;
  const orgId = application?.organisation ?? siteOrgId;
  const org = organisations.data?.results.find((o) => o.id === orgId) ?? null;
  const orgVerified = org?.verification_status === "verified";

  // Organisation-level papers are filed against one site only, so read the
  // files of every site the organisation operates.
  const siteIds = useMemo(() => {
    const ids = new Set(sites.filter((s) => orgId && s.orgId === orgId).map((s) => s.id));
    if (application?.site) ids.add(application.site);
    return [...ids].sort();
  }, [sites, orgId, application?.site]);
  // Applications filed before a site record existed review the organisation's own site.
  const reviewSiteId = application?.site ?? siteIds[0] ?? null;
  const { documents, isLoading: documentsLoading } = useSiteFiles(siteIds);
  const filed = documents.filter((d) => d.file_url);
  const orgDocs = filed.filter((d) => isOrganisationDocumentName(d.name));
  const siteDocs = filed.filter((d) => !isOrganisationDocumentName(d.name));

  // Land on the stage that needs work, and move on when the organisation clears.
  useEffect(() => {
    setTab(orgVerified ? "site" : "organisation");
  }, [orgVerified]);

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
  const working = claimedByMe && !decided;

  const unverifiedOrg = orgDocs.filter((d) => d.status !== "verified");
  const unverifiedSite = siteDocs.filter((d) => d.status !== "verified");
  const orgBlockers: string[] = [];
  if (!documentsLoading && orgDocs.length === 0)
    orgBlockers.push("No organisation documents have been submitted.");
  else if (unverifiedOrg.length)
    orgBlockers.push(
      `${unverifiedOrg.length} of ${orgDocs.length} organisation document${orgDocs.length > 1 ? "s" : ""} still to verify.`,
    );
  const siteBlockers: string[] = [];
  if (!reviewSiteId) siteBlockers.push("This application is not linked to a mine site.");
  else if (!documentsLoading && siteDocs.length === 0)
    siteBlockers.push("No mining site documents have been submitted.");
  else if (unverifiedSite.length)
    siteBlockers.push(
      `${unverifiedSite.length} of ${siteDocs.length} site document${siteDocs.length > 1 ? "s" : ""} still to verify.`,
    );
  const orgReady = !documentsLoading && orgBlockers.length === 0;
  const siteReady = orgVerified && !documentsLoading && siteBlockers.length === 0;
  const siteVerified = application.status === "approved";
  const blockers = orgVerified ? siteBlockers : orgBlockers;

  const fail = (title: string) => (err: unknown) =>
    toast.error(title, {
      description: err instanceof ApiError ? err.message : "Please try again.",
    });

  const onClaim = async () => {
    try {
      await claim.mutateAsync(application.id);
      toast.success(`Claimed ${application.reference}`);
    } catch (err) {
      fail("Could not claim this application.")(err);
    }
  };

  const onVerifyOrg = async () => {
    try {
      await verifyOrg.mutateAsync(application.id);
      toast.success(`${org?.name ?? "Organisation"} verified`, {
        description:
          "The miner now has access to their organisation workspace. Verify the mining site to unlock the rest.",
      });
    } catch (err) {
      fail("Could not verify this organisation")(err);
    }
  };

  const onApproveSite = async () => {
    try {
      await approve.mutateAsync(application.id);
      toast.success(`${application.site_name || "Mining site"} verified`, {
        description:
          "The site is operational and the miner now has full access to their dashboard.",
      });
    } catch (err) {
      fail("Could not verify this mining site")(err);
    }
  };

  const onReject = async () => {
    try {
      // Before the organisation is verified the rejection is the organisation's;
      // after, it closes the application for the site.
      if (orgVerified) await reject.mutateAsync({ id: application.id, reason: reason.trim() });
      else await rejectOrg.mutateAsync({ id: application.id, reason: reason.trim() });
      toast.success(`${application.reference} rejected`, {
        description: "The miner can see the reason.",
      });
      setRejecting(false);
      setReason("");
    } catch (err) {
      fail("Could not reject this application")(err);
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
            : "Verify the mining organisation first. Its mining site unlocks once the organisation is verified."
        }
        actions={
          working ? (
            <>
              {orgVerified ? (
                <Button
                  disabled={!siteReady || approve.isPending}
                  onClick={() => void onApproveSite()}
                >
                  <Mountain className="size-4" />
                  {approve.isPending ? "Verifying…" : "Verify mining site"}
                </Button>
              ) : (
                <Button
                  disabled={!orgReady || verifyOrg.isPending}
                  onClick={() => void onVerifyOrg()}
                >
                  <Building2 className="size-4" />
                  {verifyOrg.isPending ? "Verifying…" : "Verify organisation"}
                </Button>
              )}
              <Button variant="outline" onClick={() => setRejecting(true)}>
                <XCircle className="size-4" /> Reject
              </Button>
            </>
          ) : null
        }
      />

      <ol className="mb-5 flex flex-col gap-3 md:flex-row">
        <Stage
          icon={Building2}
          title="1 · Mining organisation"
          note={
            orgVerified
              ? "Verified. The miner can open their organisation workspace."
              : "Verify the organisation's incorporation and tax papers."
          }
          state={orgVerified ? "done" : "current"}
        />
        <Stage
          icon={Mountain}
          title="2 · Mining site"
          note={
            siteVerified
              ? "Verified. The site is operational."
              : orgVerified
                ? "Verify the site's licence, environmental and survey documents."
                : "Locked until the organisation is verified."
          }
          state={siteVerified ? "done" : orgVerified ? "current" : "locked"}
        />
        <Stage
          icon={ShieldCheck}
          title="3 · Full dashboard access"
          note={
            siteVerified
              ? "The miner has full access to their dashboard."
              : "Unlocks for the miner once the site is verified."
          }
          state={siteVerified ? "done" : "locked"}
        />
      </ol>

      {working ? (
        <div
          className={`mb-5 rounded-md border p-4 text-sm ${
            blockers.length === 0 && !documentsLoading
              ? "border-success/40 bg-success/10"
              : "border-warning/40 bg-warning/10"
          }`}
        >
          {documentsLoading
            ? "Checking submitted documents…"
            : blockers.length === 0
              ? orgVerified
                ? "Every site document is verified. You can verify the mining site."
                : "Every organisation document is verified. You can verify the organisation."
              : `${orgVerified ? "Verify mining site" : "Verify organisation"} unlocks once every document is verified: ${blockers.join(" ")}`}
        </div>
      ) : null}

      {!canSeeDetails ? (
        <Panel title="Review">
          {claimedByOther ? (
            <EmptyState
              title={`Claimed by ${application.assigned_to_name ?? "another reviewer"}`}
              description="Only the claiming reviewer works this application."
            />
          ) : (
            <div className="flex flex-col items-start gap-3">
              <p className="text-sm text-muted-foreground">
                Claim this application to open its organisation and mining site for review. Claiming
                locks it to you.
              </p>
              <Button disabled={claim.isPending} onClick={() => void onClaim()}>
                Claim application
              </Button>
            </div>
          )}
        </Panel>
      ) : (
        <Tabs value={tab} onValueChange={(v) => setTab(v as "organisation" | "site")}>
          <TabsList>
            <TabsTrigger value="organisation">
              <Building2 className="mr-1.5 size-4" /> Mining organisation
            </TabsTrigger>
            <TabsTrigger value="site" disabled={!orgVerified && !decided}>
              {!orgVerified && !decided ? (
                <Lock className="mr-1.5 size-4" />
              ) : (
                <Mountain className="mr-1.5 size-4" />
              )}
              Mining site documents
            </TabsTrigger>
          </TabsList>
          <TabsContent value="organisation" className="mt-4 space-y-5">
            <Panel title="Application">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
            <OrganisationReview siteId={application.site} siteIds={siteIds} org={org} />
          </TabsContent>
          <TabsContent value="site" className="mt-4">
            {reviewSiteId ? (
              <SiteReview siteId={reviewSiteId} embedded siteDocumentsOnly />
            ) : (
              <Panel title="Mining site">
                <EmptyState
                  title="No site linked"
                  description="This application does not reference a mine site."
                />
              </Panel>
            )}
          </TabsContent>
        </Tabs>
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
            <Button
              disabled={!reason.trim() || reject.isPending || rejectOrg.isPending}
              onClick={() => void onReject()}
            >
              Record rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
