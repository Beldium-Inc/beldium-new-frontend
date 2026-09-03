import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/verticals/warehousing/app-shell";
import { Panel, StatusPill } from "@/verticals/warehousing/compliance-ui";
import { STORAGE_HIERARCHY } from "@/verticals/warehousing/data";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const Route = createFileRoute("/warehousing/operator/locations")({
  head: () => ({
    meta: [
      { title: "Storage locations | Beldium Warehouse Operator" },
      { name: "description", content: "Physical storage hierarchy of bulk bays, bagged racking, secure vault and sampling areas with occupancy." },
      { property: "og:title", content: "Storage locations | Beldium Warehouse Operator" },
      { property: "og:description", content: "Zone, bay and rack-level occupancy for the Apapa Mineral Terminal." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LocationsPage,
});

function LocationsPage() {
  return (
    <AppShell role="operator" title="Storage locations" subtitle="Physical hierarchy: facility → zone → bay / rack level">
      <div className="space-y-6">
        {STORAGE_HIERARCHY.map((zone) => (
          <Panel key={zone.zone} title={zone.zone} description={zone.description}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Location code</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Contents</TableHead>
                  <TableHead>Occupancy</TableHead>
                  <TableHead className="w-48">Utilisation</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {zone.rows.map((row) => {
                  const pct = row.capacity ? Math.round((row.occupied / row.capacity) * 100) : 0;
                  return (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium text-primary">{row.id}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{row.type}</TableCell>
                      <TableCell className="text-sm">{row.contents}</TableCell>
                      <TableCell className="text-sm">
                        {row.capacity ? `${row.occupied.toLocaleString()} / ${row.capacity.toLocaleString()}` : "n/a"}
                      </TableCell>
                      <TableCell>
                        {row.capacity ? (
                          <>
                            <Progress value={pct} className="h-1.5" />
                            <p className="mt-1 text-xs text-muted-foreground">{pct}%</p>
                          </>
                        ) : (
                          <StatusPill tone="info">Support area</StatusPill>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Panel>
        ))}
      </div>
    </AppShell>
  );
}
