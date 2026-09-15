import { createFileRoute } from "@tanstack/react-router";

import { PageHeader, StatCard } from "@/components/miner-shell";
import { StatusChip } from "@/components/status-chip";
import { useMiner } from "@/lib/miner-store";

const title = "Equipment register — Beldium Miner Hub";
const description = "Declared plant and machinery with condition, serials and service history.";

export const Route = createFileRoute("/portal/equipment")({
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
  component: EquipmentPage,
});

function EquipmentPage() {
  const { state } = useMiner();
  const equipment = state.application.equipment;
  const siteName = (id: string) => state.application.sites.find((s) => s.id === id)?.name ?? "Unassigned";
  const needsAttention = equipment.filter((e) => e.condition !== "Good").length;

  return (
    <>
      <PageHeader title="Equipment" description="Register declared in your application and maintained by your team." />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Registered items" value={String(equipment.length)} />
        <StatCard label="Needs attention" value={String(needsAttention)} />
        <StatCard label="Sites covered" value={String(new Set(equipment.map((e) => e.siteId)).size)} />
      </div>

      <div className="mt-6 overflow-x-auto rounded-md border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/40">
            <tr>
              {["Equipment", "Type", "Serial", "Site", "Year", "Condition"].map((h) => (
                <th key={h} className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {equipment.map((e) => (
              <tr key={e.id}>
                <td className="px-4 py-2.5 font-medium text-card-foreground">{e.name}</td>
                <td className="px-4 py-2.5 text-card-foreground">{e.type}</td>
                <td className="px-4 py-2.5 text-card-foreground">{e.serial}</td>
                <td className="px-4 py-2.5 text-card-foreground">{siteName(e.siteId)}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{e.year || "—"}</td>
                <td className="px-4 py-2.5">
                  <StatusChip tone={e.condition === "Good" ? "success" : "warning"}>{e.condition}</StatusChip>
                </td>
              </tr>
            ))}
            {equipment.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  No equipment declared.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </>
  );
}
