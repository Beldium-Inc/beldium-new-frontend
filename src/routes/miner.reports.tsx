import { createFileRoute } from "@tanstack/react-router";
import { useMiner } from "@/verticals/miner/store";
import { PageHeader, Panel, KpiCard } from "@/verticals/miner/components/primitives";

export const Route = createFileRoute("/miner/reports")({ component: ReportsPage });

function ReportsPage() {
  const { sites, production, inventory, nonConformities } = useMiner();
  const totalTonnage = production.reduce((sum, p) => sum + p.tonnage, 0);
  const openNc = nonConformities.filter((n) => n.status !== "Closed").length;
  const avgScore = sites.length
    ? Math.round(sites.reduce((sum, s) => sum + s.complianceScore, 0) / sites.length)
    : 0;

  return (
    <>
      <PageHeader title="Reports" description="A summary view across your sites, production and compliance." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Sites" value={sites.length} />
        <KpiCard label="Average compliance score" value={`${avgScore}/100`} />
        <KpiCard label="Total tonnage logged" value={totalTonnage.toLocaleString()} />
        <KpiCard label="Open non-conformities" value={openNc} tone={openNc > 0 ? "warning" : "success"} />
      </div>
      <div className="mt-5">
        <Panel title="Inventory summary">
          <p className="text-sm text-muted-foreground">
            {inventory.length} item{inventory.length === 1 ? "" : "s"} tracked across your sites.
          </p>
        </Panel>
      </div>
    </>
  );
}
