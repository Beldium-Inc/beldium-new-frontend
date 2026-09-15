import { createFileRoute, Link } from "@tanstack/react-router";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { stageLabel } from "@/lib/api/ecosystem";
import { useMinerHub, usd, tonnes } from "@/verticals/miner-hub/store";

export const Route = createFileRoute("/miner/transactions/")({ component: TransactionsIndexPage });

function TransactionsIndexPage() {
  const { transactions } = useMinerHub();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Transactions</h1>
        <p className="text-sm text-muted-foreground">
          The full lifecycle of each committed trade, from acceptance through settlement.
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>Buyer</TableHead>
                <TableHead>Mineral</TableHead>
                <TableHead>Value</TableHead>
                <TableHead className="w-[220px]">Stage</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-sm text-muted-foreground">
                    No transactions yet.
                  </TableCell>
                </TableRow>
              )}
              {transactions.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell className="font-medium">
                    <Link to="/miner/transactions/$transactionId" params={{ transactionId: tx.id }} className="underline">
                      {tx.reference}
                    </Link>
                  </TableCell>
                  <TableCell>{tx.buyer_name}</TableCell>
                  <TableCell>
                    {tx.mineral} · {tonnes(tx.committed_tonnes)}
                  </TableCell>
                  <TableCell>{usd(tx.value)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={tx.progress_percent} className="h-2" />
                      <span className="text-xs text-muted-foreground">{stageLabel(tx.stage)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={tx.is_closed ? "bg-success/10 text-success" : "bg-brand/10 text-brand"}>
                      {tx.is_closed ? "Closed" : "Active"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
