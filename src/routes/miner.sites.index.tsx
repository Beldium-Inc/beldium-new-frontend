import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useMiner } from "@/verticals/miner/store";
import { PageHeader, Panel, EmptyState } from "@/verticals/miner/components/primitives";
import { ScorePill, StatusChip } from "@/verticals/miner/components/chips";

export const Route = createFileRoute("/miner/sites/")({ component: SitesPage });

function SitesPage() {
  const { sites } = useMiner();
  return (
    <>
      <PageHeader title="My Sites" description="Every mine site registered under your organisation." />
      <Panel bodyClassName="p-0">
        {sites.length === 0 ? (
          <div className="p-6">
            <EmptyState title="No sites yet" description="Sites appear here once your application is approved." />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Site</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Score</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sites.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">
                    {s.name}
                    <p className="text-xs text-muted-foreground">{s.code} · {s.mineral}</p>
                  </TableCell>
                  <TableCell>{s.lga}, {s.state}</TableCell>
                  <TableCell><StatusChip value={s.status} /></TableCell>
                  <TableCell><ScorePill score={s.complianceScore} /></TableCell>
                  <TableCell className="text-right">
                    <Button asChild size="sm" variant="outline">
                      <Link to="/miner/sites/$siteId" params={{ siteId: s.id }}>View</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Panel>
    </>
  );
}
