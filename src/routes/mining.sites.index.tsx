import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useStore } from "@/verticals/mining/store";
import { PageHeader, Panel } from "@/verticals/mining/components/primitives";
import { RiskChip, ScorePill, StatusChip } from "@/verticals/mining/components/chips";

export const Route = createFileRoute("/mining/sites/")({ component: SitesPage });

function SitesPage() {
  const { sites } = useStore();
  return (
    <>
      <PageHeader title="Mining sites" description="All sites in the prototype portfolio." />
      <Panel title="Site register" bodyClassName="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader><TableRow><TableHead>Site</TableHead><TableHead>Mineral</TableHead><TableHead>Location</TableHead><TableHead>Status</TableHead><TableHead>Score</TableHead><TableHead>Risk</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader>
            <TableBody>
              {sites.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.name}<p className="font-mono text-xs text-muted-foreground">{s.code}</p></TableCell>
                  <TableCell className="text-sm">{s.mineral}</TableCell>
                  <TableCell className="text-sm">{s.lga}, {s.state} State</TableCell>
                  <TableCell><StatusChip value={s.status} /></TableCell>
                  <TableCell><ScorePill score={s.complianceScore} /></TableCell>
                  <TableCell><RiskChip value={s.risk} /></TableCell>
                  <TableCell className="text-right"><Button asChild size="sm" variant="outline"><Link to="/mining/sites/$siteId" params={{ siteId: s.id }}>Open</Link></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Panel>
    </>
  );
}
