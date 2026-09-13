import { createFileRoute } from "@tanstack/react-router";
import * as React from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ApiError } from "@/lib/api/errors";
import { useMiner } from "@/verticals/miner/store";
import { PageHeader, Panel, EmptyState } from "@/verticals/miner/components/primitives";
import { Chip } from "@/verticals/miner/components/chips";

export const Route = createFileRoute("/miner/inventory")({ component: InventoryPage });

function InventoryPage() {
  const { primarySite, inventory, createInventoryItem } = useMiner();
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [category, setCategory] = React.useState("");
  const [quantity, setQuantity] = React.useState("");
  const [unit, setUnit] = React.useState("t");
  const [threshold, setThreshold] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  const submit = async () => {
    if (!primarySite || !name || !category || !quantity) {
      toast.error("Fill in item name, category and quantity.");
      return;
    }
    setSubmitting(true);
    try {
      await createInventoryItem({
        site: primarySite.id,
        category,
        name,
        quantity: Number(quantity),
        unit,
        ...(threshold ? { threshold: Number(threshold) } : {}),
      });
      toast.success("Inventory item added.");
      setOpen(false);
      setName("");
      setCategory("");
      setQuantity("");
      setThreshold("");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not save the item.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Inventory"
        description="Mineral stockpile and consumables on hand at your primary site."
        actions={
          primarySite ? (
            <Button size="sm" onClick={() => setOpen((v) => !v)}>
              {open ? "Cancel" : "Add item"}
            </Button>
          ) : undefined
        }
      />

      {open && (
        <Panel title="New inventory item" className="mb-5">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Input value={category} onChange={(e) => setCategory(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Quantity</Label>
              <Input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Unit</Label>
              <Input value={unit} onChange={(e) => setUnit(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Low-stock threshold</Label>
              <Input type="number" value={threshold} onChange={(e) => setThreshold(e.target.value)} />
            </div>
          </div>
          <Button className="mt-4" size="sm" onClick={() => void submit()} disabled={submitting}>
            {submitting ? "Saving…" : "Save item"}
          </Button>
        </Panel>
      )}

      <Panel bodyClassName="p-0">
        {inventory.length === 0 ? (
          <div className="p-6">
            <EmptyState title="No inventory recorded yet" description="Add your first item above." />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inventory.map((i) => {
                const low = i.threshold != null && i.quantity <= i.threshold;
                return (
                  <TableRow key={i.id}>
                    <TableCell className="font-medium">{i.name}</TableCell>
                    <TableCell>{i.category}</TableCell>
                    <TableCell className="tabular-nums">{i.quantity.toLocaleString()} {i.unit}</TableCell>
                    <TableCell>
                      <Chip tone={low ? "warning" : "success"}>{low ? "Low stock" : "OK"}</Chip>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Panel>
    </>
  );
}
