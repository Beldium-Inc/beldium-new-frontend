import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/verticals/warehousing/app-shell";
import { Panel, StatusPill } from "@/verticals/warehousing/compliance-ui";
import { useDemo } from "@/verticals/warehousing/store";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const Route = createFileRoute("/warehousing/operator/locations")({
  head: () => ({
    meta: [
      { title: "Storage locations | Beldium Warehouse Operator" },
      { name: "description", content: "Storage zones by facility with capacity and restrictions." },
    ],
  }),
  component: LocationsPage,
});

function LocationsPage() {
  const { myWarehouse, state } = useDemo();
  const facilities = state.facilities.filter((f) => f.warehouse === myWarehouse?.id);

  return (
    <AppShell role="operator" title="Storage locations" subtitle="Facility → zone hierarchy">
      <div className="space-y-6">
        {facilities.map((f) => {
          const zones = state.zones.filter((z) => z.facility === f.id);
          return (
            <Panel key={f.id} title={f.name} description={f.address}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Zone</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Temperature range</TableHead>
                    <TableHead>Capacity</TableHead>
                    <TableHead>Restricted</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {zones.map((z) => (
                    <TableRow key={z.id}>
                      <TableCell className="font-medium text-primary">{z.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{z.storage_type}</TableCell>
                      <TableCell className="text-sm">
                        {z.temperature_min ?? "-"}°C – {z.temperature_max ?? "-"}°C
                      </TableCell>
                      <TableCell className="text-sm">{Number(z.capacity).toLocaleString()} {z.capacity_unit}</TableCell>
                      <TableCell>
                        <StatusPill tone={z.restricted ? "warning" : "success"}>{z.restricted ? "Restricted" : "Open"}</StatusPill>
                      </TableCell>
                    </TableRow>
                  ))}
                  {zones.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="py-6 text-center text-sm text-muted-foreground">
                        No zones configured for this facility.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Panel>
          );
        })}
        {facilities.length === 0 && (
          <Panel title="No facilities">
            <p className="text-sm text-muted-foreground">Register a facility first.</p>
          </Panel>
        )}
      </div>
    </AppShell>
  );
}
