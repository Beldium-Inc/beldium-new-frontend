import { createFileRoute, useNavigate } from "@tanstack/react-router";
import * as React from "react";
import { toast } from "sonner";
import { AppShell } from "@/verticals/export/AppShell";
import { useStore } from "@/verticals/export/store";
import { DisclaimerNote, Panel } from "@/verticals/export/ui-kit";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { INCOTERM_OPTIONS, PORT_OPTIONS } from "@/verticals/export/options";

export const Route = createFileRoute("/export/shipments/new")({
  head: () => ({
    meta: [
      { title: "New Shipment | Beldium Export Compliance" },
      { name: "description", content: "Submit a new export shipment for compliance verification." },
    ],
  }),
  component: NewShipmentPage,
});

function NewShipmentPage() {
  const { state, user, createShipment } = useStore();
  const navigate = useNavigate();
  const myProducts = state.products.filter((p) => p.exporter === user?.exporterId);
  const myBuyers = state.buyers.filter((b) => b.exporter === user?.exporterId);

  const [form, setForm] = React.useState({
    product: myProducts[0]?.id ?? "",
    buyer: myBuyers[0]?.id ?? "",
    destination_country: "",
    port_of_loading: PORT_OPTIONS[0]!,
    port_of_discharge: "",
    quantity: "",
    unit: "tonnes",
    estimated_value: "",
    currency: "USD",
    expected_ship_date: "",
  });

  const set =
    (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.exporterId || !form.product || !form.buyer) {
      toast.error("Register a product and a buyer before submitting a shipment.");
      return;
    }
    void createShipment({
      exporter: user.exporterId,
      product: form.product,
      buyer: form.buyer,
      destination_country: form.destination_country || "-",
      port_of_loading: form.port_of_loading,
      port_of_discharge: form.port_of_discharge || "-",
      quantity: form.quantity || "0",
      unit: form.unit,
      estimated_value: form.estimated_value || "0",
      currency: form.currency,
      expected_ship_date: form.expected_ship_date || new Date().toISOString().slice(0, 10),
      status: "planned",
    }).then((id) => {
      toast.success("Shipment recorded");
      navigate({ to: "/export/shipments/$id", params: { id } });
    });
  };

  const selectCls =
    "h-9 w-full rounded-md border border-input bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/40";

  return (
    <AppShell title="New shipment" subtitle="Record a shipment against your admitted product and buyer">
      <form onSubmit={submit} className="grid gap-4 lg:grid-cols-[1.4fr_0.6fr]">
        <div className="space-y-4">
          <Panel title="Product & buyer" description="Must already be registered on your exporter profile.">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Product</Label>
                <select className={selectCls} value={form.product} onChange={set("product")}>
                  {myProducts.length === 0 && <option value="">No products registered</option>}
                  {myProducts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.hs_code})
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Buyer</Label>
                <select className={selectCls} value={form.buyer} onChange={set("buyer")}>
                  {myBuyers.length === 0 && <option value="">No buyers registered</option>}
                  {myBuyers.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.country})
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Quantity</Label>
                <Input value={form.quantity} onChange={set("quantity")} placeholder="24000" />
              </div>
              <div className="space-y-1.5">
                <Label>Unit</Label>
                <Input value={form.unit} onChange={set("unit")} placeholder="tonnes" />
              </div>
            </div>
          </Panel>

          <Panel title="Commercial & logistics">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Destination country</Label>
                <Input value={form.destination_country} onChange={set("destination_country")} />
              </div>
              <div className="space-y-1.5">
                <Label>Port of loading</Label>
                <select className={selectCls} value={form.port_of_loading} onChange={set("port_of_loading")}>
                  {PORT_OPTIONS.map((p: string) => (
                    <option key={p}>{p}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Port of discharge</Label>
                <Input value={form.port_of_discharge} onChange={set("port_of_discharge")} />
              </div>
              <div className="space-y-1.5">
                <Label>Incoterm reference</Label>
                <select className={selectCls} defaultValue={INCOTERM_OPTIONS[0]}>
                  {INCOTERM_OPTIONS.map((i: string) => (
                    <option key={i}>{i}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Estimated value</Label>
                <Input value={form.estimated_value} onChange={set("estimated_value")} placeholder="612400" />
              </div>
              <div className="space-y-1.5">
                <Label>Expected ship date</Label>
                <Input type="date" value={form.expected_ship_date} onChange={set("expected_ship_date")} />
              </div>
            </div>
          </Panel>
        </div>

        <div className="space-y-4">
          <Panel title="What happens next">
            <ol className="space-y-3 text-xs leading-relaxed text-muted-foreground">
              <li>1. The shipment is added to your register.</li>
              <li>2. Your exporter admission application still governs compliance status.</li>
              <li>3. Attach supporting evidence against the relevant domain in your application.</li>
            </ol>
            <DisclaimerNote className="mt-4" />
            <Button type="submit" className="mt-4 w-full" size="lg">
              Record shipment
            </Button>
          </Panel>
        </div>
      </form>
    </AppShell>
  );
}
