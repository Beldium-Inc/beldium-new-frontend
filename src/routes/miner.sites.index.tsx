import { createFileRoute, Link } from "@tanstack/react-router";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useMineSites } from "@/lib/api/mining-queries";

export const Route = createFileRoute("/miner/sites/")({ component: SitesPage });

const statusTone: Record<string, string> = {
  operational: "bg-success/10 text-success",
  under_review: "bg-warning/10 text-warning",
  suspended: "bg-danger/10 text-danger",
  care_maintenance: "bg-muted text-muted-foreground",
};

function SitesPage() {
  const { data, isLoading } = useMineSites();
  const sites = data?.results ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Mining Sites</h1>
        <p className="text-sm text-muted-foreground">Sites registered to your organisation.</p>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : sites.length === 0 ? (
        <p className="text-sm text-muted-foreground">No sites on record.</p>
      ) : (
        <div className="overflow-x-auto rounded-md border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Site</TableHead>
                <TableHead>Mineral</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Compliance</TableHead>
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
                    <Badge className={statusTone[s.status] ?? ""}>{s.status.replace(/_/g, " ")}</Badge>
                  </TableCell>
                  <TableCell className="text-sm">{s.compliance_score}%</TableCell>
                  <TableCell className="text-right">
                    <Button asChild size="sm" variant="outline">
                      <Link to="/miner/sites/$siteId" params={{ siteId: s.id }}>
                        Open
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
