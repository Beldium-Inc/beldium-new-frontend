import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/verticals/warehousing/app-shell";
import { DemoDataBanner, Panel, StatusPill } from "@/verticals/warehousing/compliance-ui";
import { useDemo } from "@/verticals/warehousing/store";
import { STORAGE_HIERARCHY } from "@/verticals/warehousing/data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertTriangle, ScaleIcon } from "lucide-react";

export const Route = createFileRoute("/warehousing/operator/receive")({
  head: () => ({
    meta: [
      { title: "Receive shipment | Beldium Warehouse Operator" },
      { name: "description", content: "Weighbridge capture for inbound mineral shipments with automatic weight variance flagging against declared tonnage." },
      { property: "og:title", content: "Receive shipment | Beldium Warehouse Operator" },
      { property: "og:description", content: "Book inbound trucks into storage and flag weight variances." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ReceivePage,
});

const BAYS: string[] = STORAGE_HIERARCHY.flatMap((z) => z.rows.filter((r) => r.capacity > 0).map((r) => r.id));

function ReceivePage() {
  const { incoming, receiveShipment, batches } = useDemo();
  const [selected, setSelected] = useState<string>(incoming[0]?.id ?? "");
  const [actual, setActual] = useState("");
  const [bay, setBay] = useState(BAYS[0] ?? "A-BAY-01");

  const shipment = incoming.find((s) => s.id === selected);
  const expected = shipment ? Number(shipment.expected.replace(/[^\d.]/g, "")) : 0;
  const preview = actual && expected ? ((Number(actual) - expected) / expected) * 100 : null;

  return (
    <AppShell role="operator" title="Receive shipment" subtitle="Weighbridge 2 · tolerance ±0.5% against declared waybill tonnage">
      <div className="space-y-6">
        <DemoDataBanner />

        <div className="grid gap-6 xl:grid-cols-3">
          <Panel className="xl:col-span-2" title="Booked inbound trucks" description="Select a shipment to capture the weighbridge reading.">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead />
                  <TableHead>Ref</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Commodity</TableHead>
                  <TableHead>Declared</TableHead>
                  <TableHead>Waybill</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {incoming.map((s) => (
                  <TableRow
                    key={s.id}
                    onClick={() => setSelected(s.id)}
                    className={s.id === selected ? "cursor-pointer bg-accent/60" : "cursor-pointer"}
                  >
                    <TableCell>
                      <span className={`inline-block size-3 rounded-full ${s.id === selected ? "bg-link" : "bg-border"}`} />
                    </TableCell>
                    <TableCell className="font-medium text-primary">{s.id}</TableCell>
                    <TableCell className="text-sm">{s.supplier}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{s.commodity}</TableCell>
                    <TableCell className="text-sm">{s.expected}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{s.waybill}</TableCell>
                  </TableRow>
                ))}
                {incoming.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                      No inbound trucks outstanding, all bookings received.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </Panel>

          <Panel title="Weighbridge capture" description="Net weight after tare deduction.">
            {shipment ? (
              <div className="space-y-4">
                <div className="rounded-xl bg-secondary/60 p-4 text-sm">
                  <p className="font-medium text-primary">{shipment.id} · {shipment.truckPlate}</p>
                  <p className="mt-1 text-muted-foreground">Declared {shipment.expected} · ETA {shipment.eta}</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="net">Actual net tonnes</Label>
                  <Input id="net" type="number" step="0.1" value={actual} onChange={(e) => setActual(e.target.value)} placeholder={String(expected)} className="rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bay">Put-away location</Label>
                  <select
                    id="bay"
                    value={bay}
                    onChange={(e) => setBay(e.target.value)}
                    className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
                  >
                    {BAYS.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>

                {preview !== null ? (
                  <div className={`flex items-start gap-3 rounded-xl p-3 text-sm ${Math.abs(preview) > 0.5 ? "bg-warning/25" : "bg-success/40"}`}>
                    {Math.abs(preview) > 0.5 ? <AlertTriangle className="mt-0.5 size-4" /> : <ScaleIcon className="mt-0.5 size-4" />}
                    <span>
                      Variance {preview.toFixed(2)}%:{" "}
                      {Math.abs(preview) > 0.5
                        ? "exceeds tolerance, a monitoring alert will be raised to Beldium."
                        : "within the ±0.5% tolerance."}
                    </span>
                  </div>
                ) : null}

                <Button
                  className="w-full rounded-xl bg-link text-link-foreground hover:bg-link/90"
                  onClick={() => {
                    const t = Number(actual);
                    if (!t || t <= 0) {
                      toast.error("Enter the weighbridge net tonnage");
                      return;
                    }
                    const { variance, flagged } = receiveShipment(shipment.id, t, bay, "Ibrahim Bello");
                    setActual("");
                    setSelected("");
                    if (flagged) {
                      toast.warning(`Received with ${variance.toFixed(2)}% weight variance`, {
                        description: "Batch quarantined and a variance alert sent to Beldium continuous monitoring.",
                      });
                    } else {
                      toast.success(`${shipment.id} received into ${bay}`, {
                        description: `Variance ${variance.toFixed(2)}%, within tolerance.`,
                      });
                    }
                  }}
                >
                  Confirm receipt
                </Button>
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">Select an inbound shipment to capture weights.</p>
            )}
          </Panel>
        </div>

        <Panel title="Recently received batches" description="Latest put-aways from the weighbridge.">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {batches.slice(0, 6).map((b) => (
              <div key={b.id} className="rounded-xl border border-border/70 p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-primary">{b.id}</p>
                  <StatusPill tone={b.status === "Quarantine" ? "danger" : "success"}>{b.status}</StatusPill>
                </div>
                <p className="mt-1 text-sm">{b.commodity}</p>
                <p className="mt-1 text-xs text-muted-foreground">{b.tonnes.toLocaleString()} t · {b.location} · {b.received}</p>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
