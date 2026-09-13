import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useMiner } from "@/verticals/miner/store";
import { PageHeader, Panel, EmptyState } from "@/verticals/miner/components/primitives";
import { StatusChip } from "@/verticals/miner/components/chips";

export const Route = createFileRoute("/miner/compliance")({ component: CompliancePage });

function CompliancePage() {
  const { nonConformities } = useMiner();
  return (
    <>
      <PageHeader
        title="Compliance"
        description="Non-conformities raised against your sites and their resolution status."
      />
      <Panel bodyClassName="p-0">
        {nonConformities.length === 0 ? (
          <div className="p-6">
            <EmptyState title="No non-conformities on record" description="Nothing outstanding right now." />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Deadline</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {nonConformities.map((n) => (
                <TableRow key={n.id}>
                  <TableCell className="font-mono text-xs">{n.ref}</TableCell>
                  <TableCell className="font-medium">{n.title}</TableCell>
                  <TableCell><StatusChip value={n.severity} /></TableCell>
                  <TableCell>{n.deadline}</TableCell>
                  <TableCell><StatusChip value={n.status} /></TableCell>
                  <TableCell className="text-right">
                    <Button asChild size="sm" variant="outline">
                      <Link to="/miner/actions">Respond</Link>
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
