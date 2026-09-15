import { createFileRoute } from "@tanstack/react-router";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { stageLabel } from "@/lib/api/ecosystem";
import { useTransactions } from "@/lib/api/ecosystem-queries";
import { tonnes } from "@/verticals/miner-hub/store";

export const Route = createFileRoute("/miner/processing")({ component: ProcessingPage });

function ProcessingPage() {
  const { data, isLoading } = useTransactions();
  const transactions = (data?.results ?? []).filter((t) => t.processing_run);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Processing</h1>
        <p className="text-sm text-muted-foreground">Traceability runs linked to your transactions once material enters processing.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Processing runs</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <p className="p-4 text-sm text-muted-foreground">Loading…</p>
          ) : transactions.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">
              No transactions in processing yet. This view surfaces a transaction once it carries a linked
              processing run.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Transaction</TableHead>
                    <TableHead>Mineral</TableHead>
                    <TableHead>Tonnage</TableHead>
                    <TableHead>Buyer</TableHead>
                    <TableHead>Stage</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-mono text-xs">{t.reference}</TableCell>
                      <TableCell className="text-sm">{t.mineral}</TableCell>
                      <TableCell className="text-sm">{tonnes(t.aggregated_tonnes)}</TableCell>
                      <TableCell className="text-sm">{t.buyer_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{stageLabel(t.stage)}</Badge>
                      </TableCell>
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
