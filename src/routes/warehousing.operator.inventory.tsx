import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/verticals/warehousing/app-shell";
import { Panel, StatCard, StatusPill, toneForStatus } from "@/verticals/warehousing/compliance-ui";
import { useDemo } from "@/verticals/warehousing/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Boxes, PackageSearch, ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/warehousing/operator/inventory")({
  head: () => ({
    meta: [
      { title: "Inventory & lots | Beldium Warehouse Operator" },
      { name: "description", content: "Lot-level mineral inventory with origin, storage location, ownership and status." },
    ],
  }),
  component: InventoryPage,
});

const NEXT: Record<string, string | null> = {
  received: "stored",
  stored: "released",
  quarantined: "stored",
  released: "dispatched",
  dispatched: null,
};

function InventoryPage() {
  const { state, myWarehouse, updateLotStatus } = useDemo();
  const [query, setQuery] = useState("");
  const lots = state.lots.filter((l) => l.warehouse === myWarehouse?.id);

  const rows = lots.filter((l) =>
    `${l.reference} ${l.product_name} ${l.owner_name}`.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <AppShell role="operator" title="Inventory & lots" subtitle="Every lot traceable to facility, zone and owner">
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Lots on site" value={lots.length} icon={<Boxes className="size-5" />} />
          <StatCard
            label="Total quantity"
            value={lots.reduce((n, l) => n + Number(l.quantity), 0).toLocaleString()}
            tone="info"
            icon={<PackageSearch className="size-5" />}
          />
          <StatCard label="Quarantined" value={lots.filter((l) => l.status === "quarantined").length} tone="danger" icon={<ShieldAlert className="size-5" />} />
        </div>

        <Panel
          title="Lot register"
          description="Advance a lot's status directly from here."
          actions={
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search lot, product, owner"
              className="h-10 w-64 rounded-xl"
            />
          }
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lot</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Batch</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Weighbridge variance</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((l) => {
                const next = NEXT[l.status];
                return (
                  <TableRow key={l.id}>
                    <TableCell className="font-medium text-primary">{l.reference}</TableCell>
                    <TableCell className="text-sm">{l.product_name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{l.batch_number}</TableCell>
                    <TableCell className="text-sm">{Number(l.quantity).toLocaleString()} {l.unit}</TableCell>
                    <TableCell className="text-sm">
                      {l.variance_percent === null ? (
                        <span className="text-muted-foreground">Not weighed</span>
                      ) : (
                        <span className={Math.abs(l.variance_percent) > 2 ? "font-medium text-destructive" : "text-muted-foreground"}>
                          {l.variance_percent > 0 ? "+" : ""}
                          {l.variance_percent}%
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{l.owner_name}</TableCell>
                    <TableCell>
                      <StatusPill tone={toneForStatus(l.status)}>{l.status}</StatusPill>
                    </TableCell>
                    <TableCell className="text-right">
                      {next && (
                        <Button
                          variant="outline"
                          className="h-8 rounded-lg text-xs"
                          onClick={() => {
                            updateLotStatus(l.id, next as typeof l.status);
                            toast.success(`${l.reference} marked ${next}`);
                          }}
                        >
                          Mark {next}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="py-10 text-center text-sm text-muted-foreground">
                    No lots recorded.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Panel>
      </div>
    </AppShell>
  );
}
