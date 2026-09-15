import { createFileRoute } from "@tanstack/react-router";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useMinerHub, usd } from "@/verticals/miner-hub/store";

export const Route = createFileRoute("/miner/finance")({ component: FinancePage });

const statusTone: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  issued: "bg-brand/10 text-brand",
  partially_paid: "bg-warning/10 text-warning",
  paid: "bg-success/10 text-success",
  overdue: "bg-danger/10 text-danger",
  disputed: "bg-danger/10 text-danger",
  cancelled: "bg-muted text-muted-foreground",
};

function FinancePage() {
  const { invoices } = useMinerHub();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Finance</h1>
        <p className="text-sm text-muted-foreground">Invoices raised against your transactions and their settlement.</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>Transaction</TableHead>
                <TableHead>Buyer</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Outstanding</TableHead>
                <TableHead>Due</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-sm text-muted-foreground">
                    No invoices yet.
                  </TableCell>
                </TableRow>
              )}
              {invoices.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell className="font-medium">{inv.reference}</TableCell>
                  <TableCell>{inv.transaction_reference || "N/A"}</TableCell>
                  <TableCell>{inv.buyer_organisation_name}</TableCell>
                  <TableCell>{usd(inv.amount)}</TableCell>
                  <TableCell>{usd(inv.amount_outstanding)}</TableCell>
                  <TableCell>{inv.due_at ? new Date(inv.due_at).toLocaleDateString() : "N/A"}</TableCell>
                  <TableCell>
                    <Badge className={statusTone[inv.status]}>{inv.status.replace(/_/g, " ")}</Badge>
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
