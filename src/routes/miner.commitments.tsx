import { createFileRoute, Link } from "@tanstack/react-router";

import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useMinerHub, tonnes } from "@/verticals/miner-hub/store";

export const Route = createFileRoute("/miner/commitments")({ component: CommitmentsPage });

function CommitmentsPage() {
  const { commitments, transactions } = useMinerHub();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Supply commitments</h1>
        <p className="text-sm text-muted-foreground">
          Aggregation progress against each accepted transaction's committed tonnage.
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Transaction</TableHead>
                <TableHead>Requested</TableHead>
                <TableHead>Committed</TableHead>
                <TableHead>Aggregated</TableHead>
                <TableHead>Remaining</TableHead>
                <TableHead className="w-[180px]">Fulfilment</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {commitments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-sm text-muted-foreground">
                    No supply commitments yet.
                  </TableCell>
                </TableRow>
              )}
              {commitments.map((c) => {
                const tx = transactions.find((t) => t.id === c.transaction);
                return (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">
                      {tx ? (
                        <Link to="/miner/transactions/$transactionId" params={{ transactionId: tx.id }} className="underline">
                          {tx.reference}
                        </Link>
                      ) : (
                        c.transaction
                      )}
                    </TableCell>
                    <TableCell>{tonnes(c.requested)}</TableCell>
                    <TableCell>{tonnes(c.committed)}</TableCell>
                    <TableCell>{tonnes(c.aggregated)}</TableCell>
                    <TableCell>{tonnes(c.remaining)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={c.fulfilment_percent} className="h-2" />
                        <span className="text-xs text-muted-foreground">{c.fulfilment_percent}%</span>
                      </div>
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
