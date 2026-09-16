import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { PageHeader, StatCard } from "@/components/miner-shell";
import { StatusChip } from "@/components/status-chip";
import { Input } from "@/components/ui/input";
import { useInventory, useMineSites } from "@/lib/api/mining-queries";

const title = "Inventory & stockpiles — Beldium Miner Hub";
const description = "Consumables, spares and mineral stockpiles with reorder thresholds across mining sites.";

export const Route = createFileRoute("/portal/inventory")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: InventoryPage,
});

function InventoryPage() {
  const inventoryQuery = useInventory();
  const sitesQuery = useMineSites();
  const [q, setQ] = useState("");
  const sites = Array.isArray(sitesQuery.data) ? sitesQuery.data : (sitesQuery.data?.results ?? []);
  const siteName = (id: string) => sites.find((s) => s.id === id)?.name ?? "—";
  const items = Array.isArray(inventoryQuery.data) ? inventoryQuery.data : (inventoryQuery.data?.results ?? []);
  const rows = items.filter(
    (i) =>
      i.name.toLowerCase().includes(q.toLowerCase()) ||
      i.category.toLowerCase().includes(q.toLowerCase()) ||
      siteName(i.site).toLowerCase().includes(q.toLowerCase()),
  );
  const low = items.filter((i) => i.threshold != null && i.quantity < i.threshold).length;

  return (
    <>
      <PageHeader
        title="Inventory"
        description="Stock positions used for compliance reporting and reconciliation."
        actions={
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search items, categories or sites"
            className="w-64"
          />
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Tracked items" value={String(items.length)} />
        <StatCard label="Below reorder level" value={String(low)} />
        <StatCard label="Sites covered" value={String(new Set(items.map((i) => i.site)).size)} />
      </div>

      <div className="mt-6 overflow-x-auto rounded-md border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/40">
            <tr>
              {["Item", "Category", "Site", "Quantity", "Threshold", "Status"].map((h) => (
                <th key={h} className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((i) => {
              const isLow = i.threshold != null && i.quantity < i.threshold;
              return (
                <tr key={i.id}>
                  <td className="px-4 py-2.5 font-medium text-card-foreground">{i.name}</td>
                  <td className="px-4 py-2.5 text-card-foreground">{i.category}</td>
                  <td className="px-4 py-2.5 text-card-foreground">{siteName(i.site)}</td>
                  <td className="px-4 py-2.5 text-card-foreground">
                    {i.quantity.toLocaleString()} {i.unit}
                  </td>
                  <td className="px-4 py-2.5 text-card-foreground">{i.threshold?.toLocaleString() ?? "—"}</td>
                  <td className="px-4 py-2.5">
                    <StatusChip tone={isLow ? "warning" : "success"}>{isLow ? "Reorder" : "In stock"}</StatusChip>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  No inventory matches that search.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </>
  );
}
