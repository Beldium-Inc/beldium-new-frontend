import { createFileRoute } from "@tanstack/react-router";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useMineSites } from "@/lib/api/mining-queries";
import { useBatches } from "@/lib/api/ecosystem-queries";
import { tonnes } from "@/verticals/miner-hub/store";

export const Route = createFileRoute("/miner/inventory")({ component: InventoryPage });

const stageTone: Record<string, string> = {
  stockpile: "bg-muted text-muted-foreground",
  allocated: "bg-brand/10 text-brand",
  in_transit: "bg-warning/10 text-warning",
  warehouse: "bg-brand/10 text-brand",
  processing: "bg-warning/10 text-warning",
  export_ready: "bg-success/10 text-success",
  shipped: "bg-success/10 text-success",
  delivered: "bg-success/10 text-success",
};

function InventoryPage() {
  const sitesQuery = useMineSites();
  const batchesQuery = useBatches();
  const site = sitesQuery.data?.results?.[0];
  const batches = batchesQuery.data?.results ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Mineral Inventory</h1>
        <p className="text-sm text-muted-foreground">Stock aggregated at {site?.name ?? "your site"}, by batch.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Material batches</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {batchesQuery.isLoading ? (
            <p className="p-4 text-sm text-muted-foreground">Loading…</p>
          ) : batches.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">No batches recorded.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Batch</TableHead>
                    <TableHead>Mineral</TableHead>
                    <TableHead>Tonnes</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead>Stage</TableHead>
                    <TableHead>Location</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {batches.map((b) => (
                    <TableRow key={b.id}>
                      <TableCell className="font-mono text-xs">{b.reference}</TableCell>
                      <TableCell className="text-sm">{b.mineral}</TableCell>
                      <TableCell className="text-sm">{tonnes(b.tonnes)}</TableCell>
                      <TableCell className="text-sm">{b.grade}</TableCell>
                      <TableCell>
                        <Badge className={stageTone[b.stage] ?? ""}>{b.stage.replace(/_/g, " ")}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">{b.location}</TableCell>
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
