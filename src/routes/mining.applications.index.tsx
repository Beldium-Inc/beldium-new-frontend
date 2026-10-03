import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
  useClaimApplication,
  useMiningApplications,
  useMiningCapabilities,
  useReleaseApplication,
} from "@/lib/api/mining-queries";
import type { Application, MiningApplicationStatus } from "@/lib/api/mining";
import { useAuth } from "@/lib/auth";
import { ApiError } from "@/lib/api/errors";

export const Route = createFileRoute("/mining/applications/")({ component: Page });

const statusLabel: Record<MiningApplicationStatus, string> = {
  pending: "Pending",
  under_review: "Under Review",
  approved: "Approved",
  rejected: "Rejected",
  info_requested: "Info Requested",
};

function ClaimCell({ application }: { application: Application }) {
  const { user } = useAuth();
  const capabilities = useMiningCapabilities();
  const canDecide = Boolean(capabilities.data?.can_decide);
  const claim = useClaimApplication();
  const release = useReleaseApplication();

  const claimedByMe = Boolean(user && application.assigned_to === user.id);
  const claimedByOther = Boolean(application.assigned_to && !claimedByMe);

  const onClaim = async () => {
    try {
      await claim.mutateAsync(application.id);
      // The row flips to "Open review" once the claim lands; opening is the
      // reviewer's next click.
      toast.success(`Claimed ${application.reference}`, {
        description: "Only you can review it now. Open the review to begin verification.",
      });
    } catch (err) {
      // Another reviewer can win the race between this list loading and the
      // click — the backend is the one actually enforcing exclusivity, this
      // is just surfacing its answer.
      toast.error(
        err instanceof ApiError && err.code === "already_claimed"
          ? "Someone else just claimed this application."
          : "Could not claim this application.",
        { description: err instanceof ApiError ? err.message : "Please try again." },
      );
    }
  };

  const onRelease = async () => {
    try {
      await release.mutateAsync(application.id);
      toast.success(`Released ${application.reference}`);
    } catch (err) {
      toast.error("Could not release this application.", {
        description: err instanceof ApiError ? err.message : "Please try again.",
      });
    }
  };

  if (claimedByOther) {
    return (
      <span className="text-sm text-muted-foreground">
        Claimed by {application.assigned_to_name ?? "another reviewer"}
      </span>
    );
  }

  if (claimedByMe) {
    return (
      <div className="flex items-center justify-end gap-2">
        <Button asChild size="sm">
          <Link to="/mining/applications/$applicationId" params={{ applicationId: application.id }}>
            Open review
          </Link>
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={release.isPending}
          onClick={() => void onRelease()}
        >
          Release
        </Button>
      </div>
    );
  }

  if (application.status === "approved" || application.status === "rejected") {
    return (
      <Button asChild size="sm" variant="ghost">
        <Link to="/mining/applications/$applicationId" params={{ applicationId: application.id }}>
          View history
        </Link>
      </Button>
    );
  }

  if (!canDecide) {
    return <span className="text-sm text-muted-foreground">Unclaimed</span>;
  }

  return (
    <Button size="sm" disabled={claim.isPending} onClick={() => void onClaim()}>
      Claim
    </Button>
  );
}

function Page() {
  const { data, isPending, error } = useMiningApplications();
  const applications = data?.results ?? [];

  return (
    <>
      <PageHeader
        title="Applications"
        description="Mine site admission and amendment applications. Claim one to open its application, mining site and mining organisation for review. The first reviewer to claim it locks out every other compliance partner."
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
            title="No applications yet"
            description="Applications submitted by miners will appear here automatically."
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reference</TableHead>
                  <TableHead>Site</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Mineral</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead className="text-right">Reviewer</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {applications.map((app) => (
                  <TableRow key={app.id}>
                    <TableCell className="font-mono text-xs font-medium">
                      <Link
                        to="/mining/applications/$applicationId"
                        params={{ applicationId: app.id }}
                        className="underline-offset-2 hover:underline"
                      >
                        {app.reference}
                      </Link>
                    </TableCell>
                    <TableCell className="text-sm">{app.site_name || "—"}</TableCell>
                    <TableCell className="text-sm capitalize">{app.type || "—"}</TableCell>
                    <TableCell className="text-sm">{app.mineral || "—"}</TableCell>
                    <TableCell>
                      <StatusChip value={statusLabel[app.status] ?? app.status} />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {app.submitted_on ?? "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <ClaimCell application={app} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Panel>
    </>
  );
}
