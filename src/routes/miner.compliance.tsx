import { createFileRoute } from "@tanstack/react-router";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useMineSites, useMiningInspections, useMiningNonConformities } from "@/lib/api/mining-queries";

export const Route = createFileRoute("/miner/compliance")({ component: CompliancePage });

const severityTone: Record<string, string> = {
  minor: "bg-muted text-muted-foreground",
  major: "bg-warning/10 text-warning",
  critical: "bg-danger/10 text-danger",
};

function CompliancePage() {
  const sitesQuery = useMineSites();
  const ncQuery = useMiningNonConformities();
  const inspectionsQuery = useMiningInspections();

  const site = sitesQuery.data?.results?.[0];
  const nonConformities = ncQuery.data?.results ?? [];
  const inspections = inspectionsQuery.data?.results ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Compliance</h1>
        <p className="text-sm text-muted-foreground">
          {site ? `${site.name}. Compliance score ${site.compliance_score}%.` : "Compliance status for your site."}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Non-conformities</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {nonConformities.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">No open non-conformities.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reference</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Deadline</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {nonConformities.map((nc) => (
                    <TableRow key={nc.id}>
                      <TableCell className="font-mono text-xs">{nc.reference}</TableCell>
                      <TableCell className="text-sm">{nc.title}</TableCell>
                      <TableCell>
                        <Badge className={severityTone[nc.severity] ?? ""}>{nc.severity}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">{nc.status.replace(/_/g, " ")}</TableCell>
                      <TableCell className="text-sm">{nc.deadline}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Inspections</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {inspections.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">No inspections on record.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reference</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Result</TableHead>
                    <TableHead>Scheduled</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inspections.map((i) => (
                    <TableRow key={i.id}>
                      <TableCell className="font-mono text-xs">{i.reference}</TableCell>
                      <TableCell className="text-sm">{i.type.replace(/_/g, " ")}</TableCell>
                      <TableCell className="text-sm">{i.status}</TableCell>
                      <TableCell className="text-sm">{i.result || "N/A"}</TableCell>
                      <TableCell className="text-sm">{i.scheduled_for ?? "N/A"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
