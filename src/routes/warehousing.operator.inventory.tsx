import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/verticals/warehousing/app-shell";
import { Panel, StatCard, StatusPill, toneForStatus } from "@/verticals/warehousing/compliance-ui";
import { useDemo } from "@/verticals/warehousing/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Boxes, PackageSearch, ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/warehousing/operator/inventory")({
  head: () => ({
    meta: [
      { title: "Inventory & batches | Beldium Warehouse Operator" },
      { name: "description", content: "Batch-level mineral inventory with origin pit, assay grade, storage location, ownership and status." },
      { property: "og:title", content: "Inventory & batches | Beldium Warehouse Operator" },
      { property: "og:description", content: "Traceable batch register for stored mineral concentrates." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: InventoryPage,
});

function InventoryPage() {
  const { batches, createRelease } = useDemo();
  const [query, setQuery] = useState("");
  const [target, setTarget] = useState<string | null>(null);
  const [tonnes, setTonnes] = useState("50");
  const [destination, setDestination] = useState("Onne Supply Base, Rivers");

  const rows = batches.filter((b) =>
    `${b.id} ${b.commodity} ${b.origin} ${b.location} ${b.owner}`.toLowerCase().includes(query.toLowerCase()),
  );
  const batch = batches.find((b) => b.id === target);

  return (
    <AppShell role="operator" title="Inventory & batches" subtitle="Every lot traceable to origin pit, assay and storage location">
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Batches on site" value={batches.length} icon={<Boxes className="size-5" />} />
          <StatCard label="Total tonnage" value={`${batches.reduce((n, b) => n + b.tonnes, 0).toLocaleString()} t`} tone="info" icon={<PackageSearch className="size-5" />} />
          <StatCard label="Quarantined" value={batches.filter((b) => b.status === "Quarantine").length} tone="danger" icon={<ShieldAlert className="size-5" />} />
        </div>

        <Panel
          title="Batch register"
          description="Raise a release request directly from a batch."
          actions={
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search batch, commodity, owner"
              className="h-10 w-64 rounded-xl"
            />
          }
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Batch</TableHead>
                <TableHead>Commodity</TableHead>
                <TableHead>Origin</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Tonnes</TableHead>
                <TableHead>Assay</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((b) => (
                <TableRow key={b.id}>
                  <TableCell className="font-medium text-primary">{b.id}</TableCell>
                  <TableCell className="text-sm">{b.commodity}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{b.origin}</TableCell>
                  <TableCell className="text-sm">{b.location}</TableCell>
                  <TableCell className="text-sm">{b.tonnes.toLocaleString()}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{b.grade}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{b.owner}</TableCell>
                  <TableCell>
                    <StatusPill tone={toneForStatus(b.status)}>{b.status}</StatusPill>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      className="h-8 rounded-lg text-xs"
                      disabled={b.status === "Quarantine"}
                      onClick={() => {
                        setTarget(b.id);
                        setTonnes(String(Math.min(50, b.tonnes)));
                      }}
                    >
                      Request release
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Panel>
      </div>

      <Dialog open={target !== null} onOpenChange={(o) => !o && setTarget(null)}>
        <DialogContent className="rounded-3xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-primary">Request release: {batch?.id}</DialogTitle>
            <DialogDescription>
              Creates a release request for authorisation by the facility manager.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rel-t">Tonnes to release</Label>
              <Input id="rel-t" type="number" value={tonnes} onChange={(e) => setTonnes(e.target.value)} className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rel-d">Destination</Label>
              <Input id="rel-d" value={destination} onChange={(e) => setDestination(e.target.value)} className="rounded-xl" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setTarget(null)}>Cancel</Button>
            <Button
              className="rounded-xl bg-link text-link-foreground hover:bg-link/90"
              onClick={() => {
                const t = Number(tonnes);
                if (!batch || !t || t <= 0 || t > batch.tonnes) {
                  toast.error("Enter a valid tonnage", { description: `Available: ${batch?.tonnes ?? 0} t` });
                  return;
                }
                const id = createRelease(
                  {
                    batch: batch.id,
                    commodity: batch.commodity,
                    tonnes: t,
                    requestedBy: batch.owner,
                    destination,
                  },
                  "Ibrahim Bello",
                );
                setTarget(null);
                toast.success(`Release request ${id} created`, { description: `${t} t of ${batch.commodity} → ${destination}` });
              }}
            >
              Create request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
