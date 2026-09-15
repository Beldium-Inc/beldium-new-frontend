import { createFileRoute } from "@tanstack/react-router";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQualitySamples } from "@/lib/api/quality-queries";

export const Route = createFileRoute("/miner/quality")({ component: QualityPage });

const statusTone: Record<string, string> = {
  pass: "bg-success/10 text-success",
  verified: "bg-success/10 text-success",
  fail: "bg-danger/10 text-danger",
  pending: "bg-warning/10 text-warning",
};

function QualityPage() {
  const { data, isLoading } = useQualitySamples();
  const samples = data?.results ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Samples & Quality</h1>
        <p className="text-sm text-muted-foreground">Sample registrations, chain of custody and lab results.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Samples</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <p className="p-4 text-sm text-muted-foreground">Loading…</p>
          ) : samples.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">No samples on record.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reference</TableHead>
                    <TableHead>Material</TableHead>
                    <TableHead>Lot</TableHead>
                    <TableHead>Mass (kg)</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Registered</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {samples.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-mono text-xs">{s.reference}</TableCell>
                      <TableCell className="text-sm">{s.material}</TableCell>
                      <TableCell className="text-sm">{s.lot}</TableCell>
                      <TableCell className="text-sm">{s.mass_kg}</TableCell>
                      <TableCell>
                        <Badge className={statusTone[s.status] ?? ""}>{s.status.replace(/_/g, " ")}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">{new Date(s.registered_at).toLocaleDateString()}</TableCell>
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
