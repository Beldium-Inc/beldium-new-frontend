import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { PageHeader, StatCard } from "@/components/miner-shell";
import { StatusChip } from "@/components/status-chip";
import { Input } from "@/components/ui/input";
import { BatchChainPanel } from "@/components/ecosystem-ui";
import { useMiner } from "@/lib/miner-store";

const title = "Inventory & stockpiles — Beldium Miner Hub";
const description = "Consumables, spares and mineral stockpiles with reorder levels across mining sites.";

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
  const { state } = useMiner();
  const [q, setQ] = useState("");
  const siteName = (id: string) => state.application.sites.find((s) => s.id === id)?.name ?? "—";
  const rows = state.inventory.filter(
    (i) =>
      i.name.toLowerCase().includes(q.toLowerCase()) ||
      i.category.toLowerCase().includes(q.toLowerCase()) ||
      siteName(i.siteId).toLowerCase().includes(q.toLowerCase()),
  );
  const low = state.inventory.filter((i) => i.quantity < i.reorderLevel).length;

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
        <StatCard label="Tracked items" value={String(state.inventory.length)} />
        <StatCard label="Below reorder level" value={String(low)} />
        <StatCard label="Sites covered" value={String(new Set(state.inventory.map((i) => i.siteId)).size)} />
      </div>

      <div className="mt-6 overflow-x-auto rounded-md border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/40">
            <tr>
              {["Item", "Category", "Site", "Quantity", "Reorder level", "Updated", "Status"].map((h) => (
                <th key={h} className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((i) => {
              const isLow = i.quantity < i.reorderLevel;
              return (
                <tr key={i.id}>
                  <td className="px-4 py-2.5 font-medium text-card-foreground">{i.name}</td>
                  <td className="px-4 py-2.5 text-card-foreground">{i.category}</td>
                  <td className="px-4 py-2.5 text-card-foreground">{siteName(i.siteId)}</td>
                  <td className="px-4 py-2.5 text-card-foreground">
                    {i.quantity.toLocaleString()} {i.unit}
                  </td>
                  <td className="px-4 py-2.5 text-card-foreground">{i.reorderLevel.toLocaleString()}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{i.updatedAt}</td>
                  <td className="px-4 py-2.5">
                    <StatusChip tone={isLow ? "warning" : "success"}>{isLow ? "Reorder" : "In stock"}</StatusChip>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                  No inventory matches that search.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="mt-6">
        <BatchChainPanel
          batches={state.batches}
          transactions={state.transactions}
          siteName={siteName}
          title="Mineral stockpiles & allocations"
          description="Mineral batches produced on site, where they sit now, and the buyer commitment they serve."
        />
      </div>
    </>
  );
}
