import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { InventoryItem } from "@/lib/api/mining";
import {
  useCreateInventoryItem,
  useDeleteInventoryItem,
  useInventoryItems,
  useUpdateInventoryItem,
} from "@/lib/api/mining-queries";
import { KpiCard, PageHeader, Panel } from "@/verticals/mining/components/primitives";
import { Chip } from "@/verticals/mining/components/chips";
import {
  ListState,
  ListToolbar,
  SitePicker,
  errorMessage,
  fmtDate,
  fmtNumber,
  matchesFilters,
  useListFilters,
  useMiningPermissions,
} from "@/verticals/mining/components/listkit";

export const Route = createFileRoute("/mining/inventory")({ component: InventoryPage });

const CATEGORIES = ["stockpile", "consumable", "spare"] as const;
const CATEGORY_LABEL: Record<string, string> = {
  stockpile: "Stockpile",
  consumable: "Consumable",
  spare: "Spare",
};

function isLow(item: InventoryItem): boolean {
  return (
    item.threshold !== null &&
    item.threshold !== "" &&
    Number(item.quantity) <= Number(item.threshold)
  );
}

function InventoryPage() {
  const { isMiner } = useMiningPermissions();
  const inventory = useInventoryItems();
  const update = useUpdateInventoryItem();
  const remove = useDeleteInventoryItem();
  const [filters, setFilters] = useListFilters();
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<{ id: string; quantity: string } | null>(null);

  const all = inventory.data?.results ?? [];
  const rows = all.filter((i) =>
    matchesFilters(filters, { siteId: i.site, status: CATEGORY_LABEL[i.category] ?? i.category }, [
      i.name,
      i.site_name,
      i.category,
    ]),
  );
  const low = all.filter(isLow);
  const stockpileTonnes = all
    .filter((i) => i.category === "stockpile" && /^(t|tonnes?|mt)$/i.test(i.unit))
    .reduce((sum, i) => sum + (Number(i.quantity) || 0), 0);

  const saveQuantity = async () => {
    if (!editing) return;
    const n = Number(editing.quantity);
    if (editing.quantity.trim() === "" || Number.isNaN(n) || n < 0) {
      toast.error("Quantity must be a number of zero or more");
      return;
    }
    try {
      await update.mutateAsync({ id: editing.id, patch: { quantity: String(n) } });
      toast.success("Quantity updated");
      setEditing(null);
    } catch (err) {
      toast.error("Could not update the quantity", { description: errorMessage(err) });
    }
  };

  const del = async (item: InventoryItem) => {
    if (!window.confirm(`Delete ${item.name}? This cannot be undone.`)) return;
    try {
      await remove.mutateAsync(item.id);
      toast.success("Item deleted");
    } catch (err) {
      toast.error("Could not delete the item", { description: errorMessage(err) });
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Operations"
        title="Inventory"
        description="Ore stockpiles, consumables and spares held at each site. Set a threshold to be warned when stock runs low."
        actions={
          isMiner && (
            <Button onClick={() => setAdding(true)}>
              <Plus className="size-4" /> Add item
            </Button>
          )
        }
      />
      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        <KpiCard label="Items" value={all.length} />
        <KpiCard label="Ore on stockpile" value={`${fmtNumber(stockpileTonnes)} t`} />
        <KpiCard
          label="At or below threshold"
          value={low.length}
          tone={low.length ? "warning" : "success"}
        />
      </div>
      <ListToolbar
        filters={filters}
        onChange={setFilters}
        statuses={Object.values(CATEGORY_LABEL)}
        placeholder="Search item"
      />
      <ListState
        loading={inventory.isPending}
        error={inventory.error}
        empty={rows.length === 0}
        emptyTitle="No inventory recorded"
      >
        <Panel bodyClassName="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Site</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Threshold</TableHead>
                  <TableHead>Updated</TableHead>
                  {isMiner && <TableHead className="text-right">Action</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((i) => (
                  <TableRow key={i.id}>
                    <TableCell className="font-medium">
                      {i.name}
                      {isLow(i) && (
                        <Chip tone="warning" className="ml-2">
                          Low
                        </Chip>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">{i.site_name}</TableCell>
                    <TableCell className="text-sm">
                      {CATEGORY_LABEL[i.category] ?? i.category}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {editing?.id === i.id ? (
                        <Input
                          autoFocus
                          className="ml-auto h-8 w-28 text-right"
                          inputMode="decimal"
                          value={editing.quantity}
                          aria-label={`New quantity for ${i.name}`}
                          onChange={(e) => setEditing({ id: i.id, quantity: e.target.value })}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") void saveQuantity();
                            if (e.key === "Escape") setEditing(null);
                          }}
                        />
                      ) : (
                        `${fmtNumber(i.quantity)} ${i.unit}`
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {i.threshold ? `${fmtNumber(i.threshold)} ${i.unit}` : "—"}
                    </TableCell>
                    <TableCell className="text-sm">{fmtDate(i.updated_at)}</TableCell>
                    {isMiner && (
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {editing?.id === i.id ? (
                            <>
                              <Button size="sm" disabled={update.isPending} onClick={saveQuantity}>
                                Save
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>
                                Cancel
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditing({ id: i.id, quantity: i.quantity })}
                              >
                                Update quantity
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => del(i)}
                                aria-label={`Delete ${i.name}`}
                              >
                                <Trash2 className="size-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Panel>
      </ListState>
      <AddItemDialog open={adding} onClose={() => setAdding(false)} />
    </>
  );
}

const BLANK = { site: "", category: "stockpile", name: "", quantity: "", unit: "t", threshold: "" };

function AddItemDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const create = useCreateInventoryItem();
  const [form, setForm] = useState(BLANK);
  const set = (patch: Partial<typeof BLANK>) => setForm((f) => ({ ...f, ...patch }));

  const submit = async () => {
    const qty = Number(form.quantity);
    if (!form.site || !form.name.trim() || !form.unit.trim()) {
      toast.error("Site, name and unit are required");
      return;
    }
    if (form.quantity.trim() === "" || Number.isNaN(qty) || qty < 0) {
      toast.error("Quantity must be a number of zero or more");
      return;
    }
    if (form.threshold.trim() !== "" && Number.isNaN(Number(form.threshold))) {
      toast.error("Threshold must be a number");
      return;
    }
    try {
      await create.mutateAsync({
        site: form.site,
        category: form.category,
        name: form.name.trim(),
        quantity: String(qty),
        unit: form.unit.trim(),
        threshold: form.threshold.trim() === "" ? null : form.threshold.trim(),
      });
      toast.success("Item added");
      setForm(BLANK);
      onClose();
    } catch (err) {
      toast.error("Could not add the item", { description: errorMessage(err) });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add an inventory item</DialogTitle>
          <DialogDescription>
            A stockpile, consumable or spare part held at a site.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="inv-site">Site</Label>
            <SitePicker id="inv-site" value={form.site} onChange={(site) => set({ site })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="inv-category">Category</Label>
            <Select value={form.category} onValueChange={(category) => set({ category })}>
              <SelectTrigger id="inv-category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {CATEGORY_LABEL[c]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="inv-name">Name</Label>
            <Input
              id="inv-name"
              value={form.name}
              onChange={(e) => set({ name: e.target.value })}
              placeholder="ROM ore pad A"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="inv-qty">Quantity</Label>
            <Input
              id="inv-qty"
              inputMode="decimal"
              value={form.quantity}
              onChange={(e) => set({ quantity: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="inv-unit">Unit</Label>
            <Input
              id="inv-unit"
              value={form.unit}
              onChange={(e) => set({ unit: e.target.value })}
              placeholder="t, litres, units"
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="inv-threshold">Low-stock threshold (optional)</Label>
            <Input
              id="inv-threshold"
              inputMode="decimal"
              value={form.threshold}
              onChange={(e) => set({ threshold: e.target.value })}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={create.isPending} onClick={submit}>
            Add item
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
