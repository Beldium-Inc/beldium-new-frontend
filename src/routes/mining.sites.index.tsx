import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useMiningApplications,
  useMiningCapabilities,
  useOrganisationVerification,
} from "@/lib/api/mining-queries";
import { useStore } from "@/verticals/mining/store";
import type { MineSite } from "@/verticals/mining/types";
import { EmptyState, PageHeader, Panel } from "@/verticals/mining/components/primitives";
import { RiskChip, ScorePill, StatusChip } from "@/verticals/mining/components/chips";

export const Route = createFileRoute("/mining/sites/")({ component: SitesPage });

/**
 * Sites of verified organisations only. In progress: sites still awaiting their own verification. History:
 * sites whose review is finished, either verified (operational) or whose
 * admission application was decided.
 */
function SitesPage() {
  const { sites: allSites } = useStore();
  const applications = useMiningApplications();
  const capabilities = useMiningCapabilities();
  const organisations = useOrganisationVerification();
  // The register is for verified organisations only: a site whose organisation
  // is still under review is worked from its claimed application instead.
  const verifiedOrgs = new Set(
    (organisations.data?.results ?? [])
      .filter((o) => o.verification_status === "verified")
      .map((o) => o.id),
  );
  const deskView = capabilities.data?.audience !== "miner";
  const sites = deskView ? allSites.filter((s) => verifiedOrgs.has(s.orgId)) : allSites;
  const decidedSites = new Set(
    (applications.data?.results ?? [])
      .filter((a) => a.site && (a.status === "approved" || a.status === "rejected"))
      .map((a) => a.site as string),
  );
  const isHistory = (s: MineSite) => s.status === "Operational" || decidedSites.has(s.id);
  const history = sites.filter(isHistory);
  const inProgress = sites.filter((s) => !isHistory(s));

  return (
    <>
      <PageHeader
        title="Mining sites"
        description="Sites of verified mining organisations. A site is verified from its claimed application, and completed reviews move to History."
      />
      <Tabs defaultValue="in-progress">
        <TabsList>
          <TabsTrigger value="in-progress">In progress ({inProgress.length})</TabsTrigger>
          <TabsTrigger value="history">History ({history.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="in-progress" className="mt-4">
          <SiteTable
            sites={inProgress}
            empty="No sites of verified organisations are awaiting verification."
          />
        </TabsContent>
        <TabsContent value="history" className="mt-4">
          <SiteTable sites={history} empty="No completed site reviews yet." />
        </TabsContent>
      </Tabs>
    </>
  );
}

function SiteTable({ sites, empty }: { sites: MineSite[]; empty: string }) {
  if (sites.length === 0) {
    return (
      <Panel title="Site register">
        <EmptyState title={empty} />
      </Panel>
    );
  }
  return (
    <>
      <Panel title="Site register" bodyClassName="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Site</TableHead>
                <TableHead>Mineral</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Risk</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sites.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">
                    {s.name}
                    <p className="font-mono text-xs text-muted-foreground">{s.code}</p>
                  </TableCell>
                  <TableCell className="text-sm">{s.mineral}</TableCell>
                  <TableCell className="text-sm">
                    {s.lga}, {s.state} State
                  </TableCell>
                  <TableCell>
                    <StatusChip value={s.status} />
                  </TableCell>
                  <TableCell>
                    <ScorePill score={s.complianceScore} />
                  </TableCell>
                  <TableCell>
                    <RiskChip value={s.risk} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild size="sm" variant="outline">
                      <Link to="/mining/sites/$siteId" params={{ siteId: s.id }}>
                        Open
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Panel>
    </>
  );
}
