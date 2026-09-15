import { createFileRoute } from "@tanstack/react-router";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useMinerHub, tonnes } from "@/verticals/miner-hub/store";

export const Route = createFileRoute("/miner/logistics")({ component: LogisticsPage });

const statusTone: Record<string, string> = {
  assigned: "bg-muted text-muted-foreground",
  in_transit: "bg-brand/10 text-brand",
  delivered: "bg-success/10 text-success",
};

function LogisticsPage() {
  const { logisticsMoves, transactions } = useMinerHub();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Logistics</h1>
        <p className="text-sm text-muted-foreground">Sample and bulk moves across every active transaction.</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>Transaction</TableHead>
                <TableHead>Kind</TableHead>
                <TableHead>Carrier</TableHead>
                <TableHead>Route</TableHead>
                <TableHead>Tonnes</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logisticsMoves.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-sm text-muted-foreground">
                    No logistics moves yet.
                  </TableCell>
                </TableRow>
              )}
              {logisticsMoves.map((move) => {
                const tx = transactions.find((t) => t.id === move.transaction);
                return (
                  <TableRow key={move.id}>
                    <TableCell className="font-medium">{move.reference}</TableCell>
                    <TableCell>{tx?.reference ?? move.transaction}</TableCell>
                    <TableCell className="capitalize">{move.kind}</TableCell>
                    <TableCell>{move.carrier}</TableCell>
                    <TableCell>
                      {move.from_location} → {move.to_location}
                    </TableCell>
                    <TableCell>{tonnes(move.tonnes)}</TableCell>
                    <TableCell>
                      <Badge className={statusTone[move.status]}>{move.status.replace(/_/g, " ")}</Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
