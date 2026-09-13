import { createFileRoute } from "@tanstack/react-router";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useMiner } from "@/verticals/miner/store";
import { PageHeader, Panel, EmptyState } from "@/verticals/miner/components/primitives";
import { StatusChip } from "@/verticals/miner/components/chips";

export const Route = createFileRoute("/miner/equipment")({ component: EquipmentPage });

function EquipmentPage() {
  const { equipment } = useMiner();
  return (
    <>
      <PageHeader title="Equipment" description="Certified equipment registered against your sites." />
      <Panel bodyClassName="p-0">
        {equipment.length === 0 ? (
          <div className="p-6">
            <EmptyState title="No equipment registered yet" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Serial</TableHead>
                <TableHead>Certificate expiry</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {equipment.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="font-medium">{e.name}</TableCell>
                  <TableCell className="font-mono text-xs">{e.serial}</TableCell>
                  <TableCell>{e.certExpiry || "—"}</TableCell>
                  <TableCell><StatusChip value={e.status} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Panel>
    </>
  );
}
