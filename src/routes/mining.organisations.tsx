import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader, Panel, EmptyState } from "@/verticals/mining/components/primitives";
import { StatusChip } from "@/verticals/mining/components/chips";
import {
  useMiningApplications,
  useMiningCapabilities,
  useOrganisationVerification,
} from "@/lib/api/mining-queries";
import type { OrganisationVerificationRow } from "@/lib/api/mining";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/mining/organisations")({ component: Page });

const statusLabel: Record<OrganisationVerificationRow["verification_status"], string> = {
  draft: "Under Review",
  under_review: "Under Review",
  verified: "Verified",
  rejected: "Rejected",
  suspended: "Suspended",
};

/**
 * Your own register of mining organisations. Nothing is decided here: the
 * verification happens on the claimed application's review screen. In progress
 * takes you back to verifications you have started; History lists the
 * organisations you have decided.
 */
function Page() {
  const { user } = useAuth();
  const { data, isPending, error } = useOrganisationVerification();
  const applications = useMiningApplications();
  const capabilities = useMiningCapabilities();
  const seesAll = Boolean(capabilities.data?.is_staff);
  const apps = applications.data?.results ?? [];

  const decided = (o: OrganisationVerificationRow) =>
    o.verification_status === "verified" || o.verification_status === "rejected";
  const claimedByMe = (o: OrganisationVerificationRow) =>
    apps.find((a) => a.organisation === o.id && user && a.assigned_to === user.id) ?? null;
  const decidedByMe = (o: OrganisationVerificationRow) =>
    Boolean(user && o.verified_by === user.id);

  const all = data?.results ?? [];
  const history = all.filter((o) => decided(o) && (seesAll || decidedByMe(o)));
  const inProgress = all.filter((o) => !decided(o) && (seesAll || claimedByMe(o)));

  return (
    <>
      <PageHeader
        title="Mining Organisations"
        description="The organisations you are verifying and have verified. Open an in-progress organisation to pick its verification up where you left it; the decision itself is made on the application's review screen."
      />
      <Tabs defaultValue="in-progress">
        <TabsList>
          <TabsTrigger value="in-progress">In progress ({inProgress.length})</TabsTrigger>
          <TabsTrigger value="history">History ({history.length})</TabsTrigger>
        </TabsList>
        {(["in-progress", "history"] as const).map((tab) => {
          const rows = tab === "history" ? history : inProgress;
          return (
            <TabsContent key={tab} value={tab} className="mt-4">
              <Panel title="Organisations" bodyClassName="p-0">
                {isPending ? (
                  <p className="p-5 text-sm text-muted-foreground">Loading organisations…</p>
                ) : null}
                {error ? (
                  <p className="p-5 text-sm text-destructive">Could not load the register.</p>
                ) : null}
                {data && rows.length === 0 ? (
                  <EmptyState
                    title={
                      tab === "history"
                        ? "You have not decided any organisations yet"
                        : "No verifications in progress"
                    }
                    {...(tab === "history"
                      ? {}
                      : {
                          description: "Claim an application to begin verifying its organisation.",
                        })}
                  />
                ) : null}
                <ul className="divide-y divide-border">
                  {rows.map((org) => {
                    const application =
                      claimedByMe(org) ?? apps.find((a) => a.organisation === org.id) ?? null;
                    return (
                      <li
                        key={org.id}
                        className="flex flex-wrap items-start justify-between gap-4 px-5 py-4"
                      >
                        <div className="min-w-0 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{org.name}</span>
                            <StatusChip value={statusLabel[org.verification_status]} />
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {org.beldium_id ?? "-"} · Organisation documents{" "}
                            {org.documents_verified}/{org.documents_total} verified · Sites{" "}
                            {org.sites_verified}/{org.sites_total} verified
                            {application ? ` · ${application.reference}` : ""}
                          </p>
                          {!decided(org) && org.blockers.length ? (
                            <ul className="list-disc pl-4 text-xs text-muted-foreground">
                              {org.blockers.map((b) => (
                                <li key={b}>{b}</li>
                              ))}
                            </ul>
                          ) : null}
                          {org.verification_status === "rejected" && org.rejection_reason ? (
                            <p className="text-xs text-danger-foreground">
                              Rejected: {org.rejection_reason}
                            </p>
                          ) : null}
                        </div>
                        {application ? (
                          <Button
                            asChild
                            size="sm"
                            variant={tab === "history" ? "outline" : "default"}
                          >
                            <Link
                              to="/mining/applications/$applicationId"
                              params={{ applicationId: application.id }}
                            >
                              {tab === "history" ? "View review" : "Continue verification"}
                            </Link>
                          </Button>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              </Panel>
            </TabsContent>
          );
        })}
      </Tabs>
    </>
  );
}
