import { createFileRoute } from "@tanstack/react-router";

import { PageHeader, StatCard } from "@/components/miner-shell";
import { StatusChip } from "@/components/status-chip";
import { useEquipment, useMineSites } from "@/lib/api/mining-queries";

const title = "Equipment register — Beldium Miner Hub";
const description = "Declared plant and machinery with condition, serials and certificate expiry.";

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
  const equipmentQuery = useEquipment();
  const sitesQuery = useMineSites();
  const equipment = Array.isArray(equipmentQuery.data) ? equipmentQuery.data : (equipmentQuery.data?.results ?? []);
  const sites = Array.isArray(sitesQuery.data) ? sitesQuery.data : (sitesQuery.data?.results ?? []);
  const siteName = (id: string) => sites.find((s) => s.id === id)?.name ?? "Unassigned";
  const needsAttention = equipment.filter((e) => e.status !== "certified").length;

  return (
    <>
      <PageHeader title="Equipment" description="Register maintained by your team, with certificate status." />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Registered items" value={String(equipment.length)} />
        <StatCard label="Needs attention" value={String(needsAttention)} />
        <StatCard label="Sites covered" value={String(new Set(equipment.map((e) => e.site)).size)} />
      </div>

      <div className="mt-6 overflow-x-auto rounded-md border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/40">
            <tr>
              {["Equipment", "Serial", "Site", "Certificate expiry", "Status"].map((h) => (
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
                <td className="px-4 py-2.5 text-card-foreground">{e.serial}</td>
                <td className="px-4 py-2.5 text-card-foreground">{siteName(e.site)}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{e.cert_expires_on || "—"}</td>
                <td className="px-4 py-2.5">
                  <StatusChip tone={e.status === "certified" ? "success" : "warning"}>{e.status.replace("_", " ")}</StatusChip>
                </td>
              </tr>
            ))}
            {equipment.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
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
