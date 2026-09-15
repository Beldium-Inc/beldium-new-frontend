import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/verticals/warehousing/app-shell";
import { Panel, StatusPill } from "@/verticals/warehousing/compliance-ui";
import { useDemo } from "@/verticals/warehousing/store";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const Route = createFileRoute("/warehousing/regulator/facilities")({
  head: () => ({
    meta: [
      { title: "Facility register | Beldium Regulatory Portal" },
      { name: "description", content: "Read-only register of licensed mineral warehouses." },
    ],
  }),
  component: RegulatorFacilities,
});

function RegulatorFacilities() {
  const { state } = useDemo();
  const [q, setQ] = useState("");
  const rows = state.facilities.filter((f) => `${f.name} ${f.state}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <AppShell role="regulator" title="Facility register" subtitle="Read-only: status changes are made by the compliance partner">
      <Panel
        title={`${rows.length} facilities`}
        actions={<Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search facility or state" className="h-10 w-64 rounded-xl" />}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Facility</TableHead>
              <TableHead>Operator</TableHead>
              <TableHead>State</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Capacity</TableHead>
              <TableHead>Active</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((f) => {
              const w = state.warehouses.find((x) => x.id === f.warehouse);
              return (
                <TableRow key={f.id}>
                  <TableCell className="text-sm font-medium text-primary">{f.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{w?.name}</TableCell>
                  <TableCell className="text-sm">{f.state}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{f.facility_type}</TableCell>
                  <TableCell className="text-sm">{Number(f.capacity).toLocaleString()} {f.capacity_unit}</TableCell>
                  <TableCell><StatusPill tone={f.is_active ? "success" : "danger"}>{f.is_active ? "Active" : "Inactive"}</StatusPill></TableCell>
                </TableRow>
              );
            })}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                  No facilities match.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Panel>
    </AppShell>
  );
}
