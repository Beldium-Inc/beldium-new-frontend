import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/verticals/warehousing/app-shell";
import { Panel } from "@/verticals/warehousing/compliance-ui";
import { useDemo } from "@/verticals/warehousing/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/warehousing/operator/receive")({
  head: () => ({
    meta: [
      { title: "Receive shipment | Beldium Warehouse Operator" },
      { name: "description", content: "Book an inbound mineral shipment into a storage zone as a new lot." },
    ],
  }),
  component: ReceivePage,
});

function ReceivePage() {
  const { myWarehouse, state, createLot } = useDemo();
  const navigate = useNavigate();
  const facilities = state.facilities.filter((f) => f.warehouse === myWarehouse?.id);
  const [facility, setFacility] = useState(facilities[0]?.id ?? "");
  const zonesForFacility = state.zones.filter((z) => z.facility === facility);
  const [zone, setZone] = useState(zonesForFacility[0]?.id ?? "");
  const [form, setForm] = useState({
    product_name: "",
    batch_number: "",
    owner_name: "",
    quantity: "",
    actual_weighbridge_quantity: "",
    unit: "tonnes",
    received_on: new Date().toISOString().slice(0, 10),
  });

  const declared = Number(form.quantity) || 0;
  const measured = Number(form.actual_weighbridge_quantity) || 0;
  const variance = declared > 0 && form.actual_weighbridge_quantity ? ((measured - declared) / declared) * 100 : null;

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!myWarehouse || !facility || !zone) {
      toast.error("Select a facility and zone before receiving stock.");
      return;
    }
    void createLot({
      warehouse: myWarehouse.id,
      facility,
      zone,
      product_name: form.product_name || "Mineral consignment",
      batch_number: form.batch_number || "-",
      owner_name: form.owner_name || "-",
      quantity: form.quantity || "0",
      actual_weighbridge_quantity: form.actual_weighbridge_quantity || null,
      unit: form.unit,
      received_on: form.received_on,
      expires_on: null,
      status: "received",
    }).then(() => {
      toast.success("Shipment received into inventory");
      navigate({ to: "/warehousing/operator/inventory" });
    });
  };

  const selectCls = "h-10 w-full rounded-xl border border-input bg-background px-3 text-sm";

  return (
    <AppShell role="operator" title="Receive shipment" subtitle="Book an inbound shipment into storage as a new lot">
      <form onSubmit={submit} className="grid gap-6 xl:grid-cols-[1.4fr_0.6fr]">
        <Panel title="Shipment details">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Facility</Label>
              <select className={selectCls} value={facility} onChange={(e) => { setFacility(e.target.value); setZone(""); }}>
                {facilities.length === 0 && <option value="">No facilities registered</option>}
                {facilities.map((f) => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Zone</Label>
              <select className={selectCls} value={zone} onChange={(e) => setZone(e.target.value)}>
                {zonesForFacility.length === 0 && <option value="">No zones in this facility</option>}
                {zonesForFacility.map((z) => (
                  <option key={z.id} value={z.id}>{z.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="product">Product</Label>
              <Input id="product" value={form.product_name} onChange={set("product_name")} className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="batch">Batch number</Label>
              <Input id="batch" value={form.batch_number} onChange={set("batch_number")} className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="owner">Owner</Label>
              <Input id="owner" value={form.owner_name} onChange={set("owner_name")} className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="qty">Declared quantity</Label>
              <Input id="qty" type="number" step="0.01" value={form.quantity} onChange={set("quantity")} className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit">Unit</Label>
              <Input id="unit" value={form.unit} onChange={set("unit")} className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="received">Received on</Label>
              <Input id="received" type="date" value={form.received_on} onChange={set("received_on")} className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="actualQty">Weighbridge quantity (optional)</Label>
              <Input
                id="actualQty"
                type="number"
                step="0.01"
                value={form.actual_weighbridge_quantity}
                onChange={set("actual_weighbridge_quantity")}
                className="rounded-xl"
                placeholder="Measured weight, if weighed on intake"
              />
            </div>
          </div>
          {variance !== null && (
            <p className={`mt-4 text-xs font-medium ${Math.abs(variance) > 2 ? "text-destructive" : "text-muted-foreground"}`}>
              Variance vs declared: {variance > 0 ? "+" : ""}
              {variance.toFixed(2)}%
              {Math.abs(variance) > 2 ? ". Exceeds 2% tolerance, will be flagged for review." : ""}
            </p>
          )}
        </Panel>
        <Panel title="What happens next">
          <p className="text-sm text-muted-foreground">
            The lot is added to your inventory register as "received". Advance it through stored, released and
            dispatched from the inventory page. If a weighbridge reading is captured, the variance against the
            declared quantity is recorded against the lot for audit.
          </p>
          <Button type="submit" className="mt-4 w-full rounded-xl bg-link text-link-foreground hover:bg-link/90">
            Confirm receipt
          </Button>
        </Panel>
      </form>
    </AppShell>
  );
}
