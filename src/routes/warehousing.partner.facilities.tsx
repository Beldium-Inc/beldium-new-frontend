import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/verticals/warehousing/app-shell";
import { Panel, StatCard, StatusPill } from "@/verticals/warehousing/compliance-ui";
import { useDemo } from "@/verticals/warehousing/store";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ShieldCheck, ShieldX, Warehouse } from "lucide-react";

export const Route = createFileRoute("/warehousing/partner/facilities")({
  head: () => ({
    meta: [
      { title: "Warehouse register | Beldium Compliance Partner" },
      { name: "description", content: "Register of supervised warehouses and their facilities." },
    ],
  }),
  component: FacilitiesPage,
});

function FacilitiesPage() {
  const { state } = useDemo();
  const active = state.facilities.filter((f) => f.is_active).length;
  const inactive = state.facilities.length - active;

  return (
    <AppShell role="partner" title="Warehouse register" subtitle="All facilities supervised by Beldium Compliance Partners">
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Total facilities" value={state.facilities.length} icon={<Warehouse className="size-5" />} />
          <StatCard label="Active" value={active} tone="success" icon={<ShieldCheck className="size-5" />} />
          <StatCard label="Inactive" value={inactive} tone="danger" icon={<ShieldX className="size-5" />} />
        </div>

        <Panel title="Facility register" description="Type, location and certificate expiry.">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Facility</TableHead>
                <TableHead>Operator</TableHead>
                <TableHead>State</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Capacity</TableHead>
                <TableHead>Fire cert expiry</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {state.facilities.map((f) => {
                const w = state.warehouses.find((x) => x.id === f.warehouse);
                return (
                  <TableRow key={f.id}>
                    <TableCell>
                      <p className="font-medium text-foreground">{f.name}</p>
                      <p className="text-xs text-muted-foreground">{f.state}, {f.country}</p>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{w?.name ?? "-"}</TableCell>
                    <TableCell className="text-sm">{f.state}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{f.facility_type}</TableCell>
                    <TableCell className="text-sm">{Number(f.capacity).toLocaleString()} {f.capacity_unit}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{f.fire_certificate_expires_on ?? "-"}</TableCell>
                    <TableCell>
                      <StatusPill tone={f.is_active ? "success" : "danger"}>{f.is_active ? "Active" : "Inactive"}</StatusPill>
                    </TableCell>
                  </TableRow>
                );
              })}
              {state.facilities.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-sm text-muted-foreground">
                    No facilities registered.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Panel>
      </div>
    </AppShell>
  );
}
