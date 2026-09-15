import { createFileRoute } from "@tanstack/react-router";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useMineSites } from "@/lib/api/mining-queries";

export const Route = createFileRoute("/miner/production")({ component: ProductionPage });

type ProductionRecord = { month: string; tonnes: number; grade: number };

function isProductionRecord(v: unknown): v is ProductionRecord {
  return (
    typeof v === "object" &&
    v !== null &&
    "month" in v &&
    "tonnes" in v &&
    "grade" in v
  );
}

function ProductionPage() {
  const { data, isLoading } = useMineSites();
  const site = data?.results?.[0];
  const records = Array.isArray(site?.production) ? site.production.filter(isProductionRecord) : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Production</h1>
        <p className="text-sm text-muted-foreground">
          Output figures for {site?.name ?? "your site"}. Capacity {site?.capacity_tpa?.toLocaleString() ?? "–"} tpa,
          current run rate {site?.current_tpa?.toLocaleString() ?? "–"} tpa.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Monthly production</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <p className="p-4 text-sm text-muted-foreground">Loading.</p>
          ) : records.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">No production entries recorded for this site yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Month</TableHead>
                    <TableHead>Tonnes</TableHead>
                    <TableHead>Grade</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.map((r) => (
                    <TableRow key={r.month}>
                      <TableCell className="text-sm font-medium">{r.month}</TableCell>
                      <TableCell className="text-sm">{r.tonnes.toLocaleString()} t</TableCell>
                      <TableCell className="text-sm">{r.grade}%</TableCell>
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
