import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/verticals/warehousing/app-shell";
import { Panel, StatCard, StatusPill, toneForStatus } from "@/verticals/warehousing/compliance-ui";
import { labelStatus } from "@/verticals/warehousing/data";
import { useDemo } from "@/verticals/warehousing/store";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Boxes, PackagePlus, Truck, Warehouse } from "lucide-react";

export const Route = createFileRoute("/warehousing/operator/")({
  head: () => ({
    meta: [
      { title: "Operations dashboard | Beldium Warehouse Operator" },
      {
        name: "description",
        content: "Warehouse operator dashboard: capacity, inventory, admission status and expiring documents.",
      },
    ],
  }),
  component: OperatorDashboard,
});

function OperatorDashboard() {
  const { state, myWarehouse, myApplication, user, expiringDocuments } = useDemo();
  const myFacilities = state.facilities.filter((f) => f.warehouse === myWarehouse?.id);
  const myLots = state.lots.filter((l) => l.warehouse === myWarehouse?.id);
  const storedTonnes = myLots.reduce((n, l) => n + Number(l.quantity), 0);
  const quarantined = myLots.filter((l) => l.status === "quarantined");
  const myDocs = expiringDocuments.filter((d) => d.application === myApplication?.id);

  return (
    <AppShell
      role="operator"
      title={myWarehouse?.name ?? "Warehouse operations"}
      subtitle={user?.name ?? ""}
      actions={
        <Button asChild>
          <Link to="/warehousing/operator/receive">Receive shipment</Link>
        </Button>
      }
    >
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Stored quantity" value={storedTonnes.toLocaleString()} icon={<Warehouse className="size-5" />} />
          <StatCard label="Facilities" value={myFacilities.length} icon={<PackagePlus className="size-5" />} />
          <StatCard label="Lots" value={myLots.length} hint={`${quarantined.length} quarantined`} icon={<Boxes className="size-5" />} />
          <StatCard label="Documents expiring" value={myDocs.length} tone={myDocs.length ? "warning" : "success"} icon={<Truck className="size-5" />} />
        </div>

        <Panel title="Admission status" description="Beldium supervision state for this warehouse.">
          <div className="space-y-3">
            <div className="rounded-xl bg-secondary/60 p-4">
              <StatusPill tone={toneForStatus(myApplication?.status ?? "not_started")}>
                {labelStatus(myApplication?.status ?? "not_started")}
              </StatusPill>
              {myApplication && (
                <p className="mt-2 text-sm text-foreground">
                  {myWarehouse?.reference} · risk score {myApplication.risk.compliance_score}/100
                </p>
              )}
            </div>
          </div>
        </Panel>

        <Panel title="Lots" description="Current inventory on your register.">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {myLots.slice(0, 8).map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="font-medium text-primary">{l.reference}</TableCell>
                  <TableCell className="text-sm">{l.product_name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{l.owner_name}</TableCell>
                  <TableCell className="text-sm">{Number(l.quantity).toLocaleString()} {l.unit}</TableCell>
                  <TableCell>
                    <StatusPill tone={toneForStatus(l.status)}>{l.status}</StatusPill>
                  </TableCell>
                </TableRow>
              ))}
              {myLots.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                    No lots recorded yet.
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
