import { createFileRoute, useNavigate } from "@tanstack/react-router";
import * as React from "react";
import { toast } from "sonner";
import { AppShell } from "@/verticals/export/AppShell";
import { useStore } from "@/verticals/export/store";
import { DisclaimerNote, Panel } from "@/verticals/export/ui-kit";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { INCOTERM_OPTIONS, MINERAL_OPTIONS, PORT_OPTIONS } from "@/verticals/export/mock-data";

export const Route = createFileRoute("/export/shipments/new")({
  head: () => ({
    meta: [
      { title: "New Shipment | Beldium Export Compliance" },
      {
        name: "description",
        content:
          "Submit a new Nigerian mineral export consignment to Beldium for independent compliance verification.",
      },
      { property: "og:title", content: "New Shipment | Beldium Export Compliance" },
      {
        property: "og:description",
        content: "Submit a mineral export consignment for compliance verification.",
      },
    ],
  }),
  component: NewShipmentPage,
});

function NewShipmentPage() {
  const { addShipment } = useStore();
  const navigate = useNavigate();
  const [form, setForm] = React.useState({
    mineral: MINERAL_OPTIONS[0]!,
    hsCode: "2609.00.00",
    grade: "",
    quantity: "",
    buyer: "",
    destination: "",
    port: PORT_OPTIONS[0]!,
    incoterm: INCOTERM_OPTIONS[0]!,
    valueUsd: "",
    etd: "",
  });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const id = addShipment({
      mineral: form.mineral,
      hsCode: form.hsCode,
      grade: form.grade || "-",
      quantity: form.quantity || "-",
      buyer: form.buyer || "-",
      destination: form.destination || "-",
      port: form.port,
      incoterm: form.incoterm,
      valueUsd: Number(form.valueUsd) || 0,
      etd: form.etd || "-",
    });
    toast.success("Consignment submitted to Beldium for review");
    navigate({ to: "/export/shipments/$id", params: { id } });
  };

  const selectCls =
    "h-9 w-full rounded-md border border-input bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/40";

  return (
    <AppShell title="New shipment" subtitle="Submit a consignment for compliance verification">
      <form onSubmit={submit} className="grid gap-4 lg:grid-cols-[1.4fr_0.6fr]">
        <div className="space-y-4">
          <Panel title="Product" description="What is being exported.">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Mineral</Label>
                <select className={selectCls} value={form.mineral} onChange={set("mineral")}>
                  {MINERAL_OPTIONS.map((m) => (
                    <option key={m}>{m}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>HS code</Label>
                <Input value={form.hsCode} onChange={set("hsCode")} />
              </div>
              <div className="space-y-1.5">
                <Label>Grade / specification</Label>
                <Input value={form.grade} onChange={set("grade")} placeholder="e.g. 70.2% Sn" />
              </div>
              <div className="space-y-1.5">
                <Label>Declared quantity</Label>
                <Input value={form.quantity} onChange={set("quantity")} placeholder="e.g. 24.000 MT" />
              </div>
            </div>
          </Panel>

          <Panel title="Commercial & logistics">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Buyer</Label>
                <Input value={form.buyer} onChange={set("buyer")} placeholder="Consignee name" />
              </div>
              <div className="space-y-1.5">
                <Label>Destination</Label>
                <Input value={form.destination} onChange={set("destination")} placeholder="City, country" />
              </div>
              <div className="space-y-1.5">
                <Label>Port of loading</Label>
                <select className={selectCls} value={form.port} onChange={set("port")}>
                  {PORT_OPTIONS.map((p) => (
                    <option key={p}>{p}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Incoterm</Label>
                <select className={selectCls} value={form.incoterm} onChange={set("incoterm")}>
                  {INCOTERM_OPTIONS.map((i) => (
                    <option key={i}>{i}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Invoice value (USD)</Label>
                <Input value={form.valueUsd} onChange={set("valueUsd")} placeholder="612400" />
              </div>
              <div className="space-y-1.5">
                <Label>Estimated departure</Label>
                <Input value={form.etd} onChange={set("etd")} placeholder="2026-09-30" />
              </div>
            </div>
          </Panel>
        </div>

        <div className="space-y-4">
          <Panel title="What happens next">
            <ol className="space-y-3 text-xs leading-relaxed text-muted-foreground">
              <li>1. Beldium generates a provisional risk score for the consignment.</li>
              <li>2. A compliance operator picks up the review and verifies each document.</li>
              <li>3. Any gaps come back to you as clarifications or non-conformities.</li>
              <li>4. A compliance verification record is issued once the checklist clears.</li>
            </ol>
            <DisclaimerNote className="mt-4" />
            <Button type="submit" className="mt-4 w-full" size="lg">
              Submit for review
            </Button>
          </Panel>
          <Panel title="Mandatory document set">
            <ul className="space-y-2 text-xs text-muted-foreground">
              {["Commercial invoice", "Packing list", "Independent assay certificate", "Mineral export permit", "Royalty payment receipt", "Chain of custody declaration"].map((d) => (
                <li key={d} className="flex items-center justify-between gap-2">
                  <span>{d}</span>
                  <span className="text-[11px] text-muted-foreground/80">upload after submission</span>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </form>
    </AppShell>
  );
}
