import { createFileRoute } from "@tanstack/react-router";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useMinerHub, usd, tonnes } from "@/verticals/miner-hub/store";

export const Route = createFileRoute("/miner/rfqs")({ component: RfqsPage });

const statusTone: Record<string, string> = {
  open: "bg-brand/10 text-brand",
  accepted: "bg-success/10 text-success",
  partially_accepted: "bg-warning/10 text-warning",
  declined: "bg-danger/10 text-danger",
  expired: "bg-muted text-muted-foreground",
};

function RfqsPage() {
  const { rfqs } = useMinerHub();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">RFQs</h1>
        <p className="text-sm text-muted-foreground">Buyer requests for quotation received against your material.</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>Buyer</TableHead>
                <TableHead>Mineral</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Indicative price</TableHead>
                <TableHead>Received</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rfqs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-sm text-muted-foreground">
                    No RFQs yet.
                  </TableCell>
                </TableRow>
              )}
              {rfqs.map((rfq) => (
                <TableRow key={rfq.id}>
                  <TableCell className="font-medium">{rfq.reference}</TableCell>
                  <TableCell>{rfq.buyer_name}</TableCell>
                  <TableCell>{rfq.mineral}</TableCell>
                  <TableCell>{tonnes(rfq.quantity_requested)}</TableCell>
                  <TableCell>{usd(rfq.indicative_price)}</TableCell>
                  <TableCell>{new Date(rfq.received_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Badge className={statusTone[rfq.status]}>{rfq.status.replace(/_/g, " ")}</Badge>
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
