import { createFileRoute, Link } from "@tanstack/react-router";
import * as React from "react";
import { Search } from "lucide-react";
import { AppShell } from "@/verticals/export/AppShell";
import { useStore } from "@/verticals/export/store";
import { Panel, Pill } from "@/verticals/export/ui-kit";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/export/shipments/")({
  head: () => ({
    meta: [
      { title: "Shipments | Beldium Export Compliance" },
      { name: "description", content: "Browse export shipments across the register." },
    ],
  }),
  component: ShipmentsPage,
});

function ShipmentsPage() {
  const { state, user } = useStore();
  const [q, setQ] = React.useState("");

  const mine = user?.role === "exporter" ? state.shipments.filter((s) => s.exporter === user.exporterId) : state.shipments;

  const rows = mine.filter((s) =>
    `${s.reference} ${s.destination_country} ${s.port_of_loading}`.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <AppShell
      title={user?.role === "exporter" ? "My shipments" : "Shipments"}
      subtitle={`${rows.length} record${rows.length === 1 ? "" : "s"}`}
      actions={
        user?.role === "exporter" ? (
          <Button size="sm" asChild>
            <Link to="/export/shipments/new">New shipment</Link>
          </Button>
        ) : null
      }
    >
      <Panel bodyClassName="p-0">
        <div className="flex items-center gap-2 border-b border-border px-5 py-3">
          <Search className="size-4 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by reference or destination"
            className="h-9 border-0 shadow-none focus-visible:ring-0"
          />
        </div>
        <div className="divide-y divide-border">
          {rows.map((s) => {
            const exporter = state.exporters.find((e) => e.id === s.exporter);
            const product = state.products.find((p) => p.id === s.product);
            return (
              <Link
                key={s.id}
                to="/export/shipments/$id"
                params={{ id: s.id }}
                className="flex flex-col gap-3 px-5 py-4 transition-colors hover:bg-secondary/60 lg:flex-row lg:items-center lg:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-display text-sm font-semibold">{s.reference}</span>
                    <Pill tone="neutral">{s.status}</Pill>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {product?.name ?? "Product"} · {s.quantity} {s.unit} · {exporter?.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {s.port_of_loading} → {s.port_of_discharge}, {s.destination_country} · ETD {s.expected_ship_date}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-6">
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Value</p>
                    <p className="text-sm font-semibold">
                      {s.currency} {Number(s.estimated_value).toLocaleString()}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
          {rows.length === 0 && (
            <p className="px-5 py-10 text-center text-sm text-muted-foreground">No shipments found.</p>
          )}
        </div>
      </Panel>
    </AppShell>
  );
}
