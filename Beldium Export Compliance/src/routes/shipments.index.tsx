import { createFileRoute, Link } from "@tanstack/react-router";
import * as React from "react";
import { Search } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useStore } from "@/lib/store";
import { Panel, Pill, RiskPill, ShipmentStatusPill } from "@/components/ui-kit";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/shipments/")({
  head: () => ({
    meta: [
      { title: "Consignments — Beldium Export Compliance" },
      {
        name: "description",
        content:
          "Browse Nigerian mineral export consignments with risk banding, document progress and compliance status.",
      },
      { property: "og:title", content: "Consignments — Beldium Export Compliance" },
      {
        property: "og:description",
        content: "Mineral export consignments with risk banding and compliance status.",
      },
    ],
  }),
  component: ShipmentsPage,
});

function ShipmentsPage() {
  const { state, user } = useStore();
  const [q, setQ] = React.useState("");

  const mine =
    user?.role === "exporter"
      ? state.shipments.filter((s) => s.exporterId === user.exporterId)
      : state.shipments;

  const rows = mine.filter((s) =>
    `${s.reference} ${s.mineral} ${s.destination} ${s.buyer}`.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <AppShell
      title={user?.role === "exporter" ? "My shipments" : "Consignments"}
      subtitle={`${rows.length} record${rows.length === 1 ? "" : "s"}`}
      actions={
        user?.role === "exporter" ? (
          <Button size="sm" asChild>
            <Link to="/shipments/new">New shipment</Link>
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
            placeholder="Search by reference, mineral, buyer or destination"
            className="h-9 border-0 shadow-none focus-visible:ring-0"
          />
        </div>
        <div className="divide-y divide-border">
          {rows.map((s) => {
            const exporter = state.exporters.find((e) => e.id === s.exporterId);
            const verified = s.documents.filter((d) => d.status === "verified").length;
            return (
              <Link
                key={s.id}
                to="/shipments/$id"
                params={{ id: s.id }}
                className="flex flex-col gap-3 px-5 py-4 transition-colors hover:bg-secondary/60 lg:flex-row lg:items-center lg:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-display text-sm font-semibold">{s.reference}</span>
                    <ShipmentStatusPill status={s.status} />
                    <RiskPill score={s.riskScore} band={s.riskBand} />
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {s.mineral} · {s.quantity} · {exporter?.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {s.port} → {s.destination} · {s.incoterm} · ETD {s.etd}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-6">
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Value</p>
                    <p className="text-sm font-semibold">USD {s.valueUsd.toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Documents</p>
                    <p className="text-sm font-semibold">
                      {verified}/{s.documents.length}
                    </p>
                  </div>
                  <Pill tone="neutral">{s.hsCode}</Pill>
                </div>
              </Link>
            );
          })}
          {rows.length === 0 && (
            <p className="px-5 py-10 text-center text-sm text-muted-foreground">
              No consignments found.
            </p>
          )}
        </div>
      </Panel>
    </AppShell>
  );
}
