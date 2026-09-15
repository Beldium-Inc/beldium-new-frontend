import { createFileRoute } from "@tanstack/react-router";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { stageLabel } from "@/lib/api/ecosystem";
import { useTransaction } from "@/lib/api/ecosystem-queries";
import { usd, tonnes } from "@/verticals/miner-hub/store";

export const Route = createFileRoute("/miner/transactions/$transactionId")({
  component: TransactionDetailPage,
});

function TransactionDetailPage() {
  const { transactionId } = Route.useParams();
  const { data: tx, isLoading } = useTransaction(transactionId);

  if (isLoading && !tx) return <p className="text-sm text-muted-foreground">Loading transaction…</p>;
  if (!tx) return <p className="text-sm text-muted-foreground">Transaction not found.</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{tx.reference}</h1>
          <p className="text-sm text-muted-foreground">
            {tx.buyer_name} · {tx.mineral} · {tonnes(tx.committed_tonnes)} · {usd(tx.value)}
          </p>
        </div>
        <Badge className={tx.is_closed ? "bg-success/10 text-success" : "bg-brand/10 text-brand"}>
          {tx.is_closed ? "Closed" : "Active"}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Progress: {stageLabel(tx.stage)}</CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={tx.progress_percent} className="h-2" />
          <p className="mt-1 text-xs text-muted-foreground">{tx.progress_percent}% through the lifecycle</p>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Stage history</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {tx.stage_events.length === 0 && (
              <p className="text-sm text-muted-foreground">No stage events recorded yet.</p>
            )}
            {tx.stage_events.map((event) => (
              <div key={event.id} className="border-b border-border pb-2 text-sm last:border-0 last:pb-0">
                <p className="font-medium">{stageLabel(event.stage)}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(event.occurred_at).toLocaleString()}
                  {event.note ? `: ${event.note}` : ""}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Material batches</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reference</TableHead>
                  <TableHead>Tonnes</TableHead>
                  <TableHead>Stage</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tx.batches.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-sm text-muted-foreground">
                      No batches allocated yet.
                    </TableCell>
                  </TableRow>
                )}
                {tx.batches.map((batch) => (
                  <TableRow key={batch.id}>
                    <TableCell className="font-medium">{batch.reference}</TableCell>
                    <TableCell>{tonnes(batch.tonnes)}</TableCell>
                    <TableCell className="capitalize">{batch.stage.replace(/_/g, " ")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Logistics moves</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>Kind</TableHead>
                <TableHead>Carrier</TableHead>
                <TableHead>Route</TableHead>
                <TableHead>Tonnes</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tx.logistics_moves.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-sm text-muted-foreground">
                    No logistics moves yet.
                  </TableCell>
                </TableRow>
              )}
              {tx.logistics_moves.map((move) => (
                <TableRow key={move.id}>
                  <TableCell className="font-medium">{move.reference}</TableCell>
                  <TableCell className="capitalize">{move.kind}</TableCell>
                  <TableCell>{move.carrier}</TableCell>
                  <TableCell>
                    {move.from_location} → {move.to_location}
                  </TableCell>
                  <TableCell>{tonnes(move.tonnes)}</TableCell>
                  <TableCell className="capitalize">{move.status.replace(/_/g, " ")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
