import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  useCreateProductionRecord,
  useDeleteProductionRecord,
  useProductionRecords,
} from "@/lib/api/mining-queries";
import { KpiCard, PageHeader, Panel } from "@/verticals/mining/components/primitives";
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

export const Route = createFileRoute("/mining/production")({ component: ProductionPage });

function ProductionPage() {
  const { isMiner } = useMiningPermissions();
  const production = useProductionRecords();
  const remove = useDeleteProductionRecord();
  const [filters, setFilters] = useListFilters();
  const [adding, setAdding] = useState(false);

  const rows = (production.data?.results ?? []).filter((r) =>
    matchesFilters(filters, { siteId: r.site }, [r.commodity, r.site_name, r.notes]),
  );

  const { total, byCommodity, byMonth, avgGrade } = useMemo(() => {
    const byCommodity = new Map<string, number>();
    const months = new Map<string, number>();
    let total = 0;
    let gradeSum = 0;
    let gradeCount = 0;
    for (const r of rows) {
      const t = Number(r.tonnage) || 0;
      total += t;
      byCommodity.set(r.commodity, (byCommodity.get(r.commodity) ?? 0) + t);
      const month = r.period_start.slice(0, 7);
      months.set(month, (months.get(month) ?? 0) + t);
      if (r.grade !== null && r.grade !== "") {
        gradeSum += Number(r.grade);
        gradeCount += 1;
      }
    }
    const byMonth = [...months.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([month, tonnes]) => ({
        month: new Date(`${month}-01T00:00:00`).toLocaleDateString("en-GB", {
          month: "short",
          year: "2-digit",
        }),
        tonnes: Math.round(tonnes * 100) / 100,
      }));
    return { total, byCommodity, byMonth, avgGrade: gradeCount ? gradeSum / gradeCount : null };
  }, [rows]);

  const del = async (id: string) => {
    if (!window.confirm("Delete this production record? This cannot be undone.")) return;
    try {
      await remove.mutateAsync(id);
      toast.success("Production record deleted");
    } catch (err) {
      toast.error("Could not delete the record", { description: errorMessage(err) });
    }
  };

  const top = [...byCommodity.entries()].sort((a, b) => b[1] - a[1])[0];

  return (
    <>
      <PageHeader
        eyebrow="Operations"
        title="Production"
        description="Output reported for each site and period. The compliance desk compares it with licence capacity and samples."
        actions={
          isMiner && (
            <Button onClick={() => setAdding(true)}>
              <Plus className="size-4" /> Report production
            </Button>
          )
        }
      />
      <div className="mb-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Total reported" value={`${fmtNumber(total)} t`} />
        <KpiCard label="Records" value={rows.length} />
        <KpiCard
          label="Main commodity"
          value={top ? top[0] : "—"}
          {...(top ? { hint: `${fmtNumber(top[1])} t` } : {})}
        />
        <KpiCard
          label="Average grade"
          value={avgGrade === null ? "—" : `${fmtNumber(avgGrade, 3)}%`}
        />
      </div>
      {byMonth.length > 1 && (
        <Panel
          title="Tonnes by month"
          description="Last 12 reporting months"
          className="mb-5"
          bodyClassName="p-4"
        >
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={byMonth} margin={{ top: 10, right: 12, left: -12, bottom: 0 }}>
              <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }}
                stroke="var(--color-border)"
              />
              <YAxis
                tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }}
                stroke="var(--color-border)"
              />
              <Tooltip
                contentStyle={{
                  borderRadius: 8,
                  border: "1px solid var(--color-border)",
                  fontSize: 12,
                }}
              />
              <Bar
                dataKey="tonnes"
                name="Tonnes"
                fill="var(--color-chart-1)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </Panel>
      )}
      <ListToolbar
        filters={filters}
        onChange={setFilters}
        placeholder="Search commodity or notes"
      />
      <ListState
        loading={production.isPending}
        error={production.error}
        empty={rows.length === 0}
        emptyTitle="No production reported"
        emptyDescription={isMiner ? "Report each period's output per site." : undefined}
      >
        <Panel bodyClassName="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Period</TableHead>
                  <TableHead>Site</TableHead>
                  <TableHead>Commodity</TableHead>
                  <TableHead className="text-right">Tonnes</TableHead>
                  <TableHead className="text-right">Grade %</TableHead>
                  <TableHead>Notes</TableHead>
                  {isMiner && <TableHead className="text-right">Action</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="text-sm whitespace-nowrap">
                      {fmtDate(r.period_start)} – {fmtDate(r.period_end)}
                    </TableCell>
                    <TableCell className="text-sm font-medium">{r.site_name}</TableCell>
                    <TableCell className="text-sm">{r.commodity}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {fmtNumber(r.tonnage)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {fmtNumber(r.grade, 3)}
                    </TableCell>
                    <TableCell className="max-w-xs text-xs text-muted-foreground">
                      {r.notes || "—"}
                    </TableCell>
                    {isMiner && (
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={remove.isPending}
                          onClick={() => del(r.id)}
                          aria-label="Delete record"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Panel>
      </ListState>
      <AddProductionDialog open={adding} onClose={() => setAdding(false)} />
    </>
  );
}

const BLANK = {
  site: "",
  period_start: "",
  period_end: "",
  commodity: "",
  tonnage: "",
  grade: "",
  notes: "",
};

function AddProductionDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const create = useCreateProductionRecord();
  const [form, setForm] = useState(BLANK);
  const set = (patch: Partial<typeof BLANK>) => setForm((f) => ({ ...f, ...patch }));

  const submit = async () => {
    const tonnage = Number(form.tonnage);
    if (!form.site || !form.period_start || !form.period_end || !form.commodity.trim()) {
      toast.error("Site, period and commodity are required");
      return;
    }
    if (form.period_end < form.period_start) {
      toast.error("The period ends before it starts");
      return;
    }
    if (form.tonnage.trim() === "" || Number.isNaN(tonnage) || tonnage < 0) {
      toast.error("Tonnage must be a number of zero or more");
      return;
    }
    if (form.grade.trim() !== "" && Number.isNaN(Number(form.grade))) {
      toast.error("Grade must be a number");
      return;
    }
    try {
      await create.mutateAsync({
        site: form.site,
        period_start: form.period_start,
        period_end: form.period_end,
        commodity: form.commodity.trim(),
        tonnage: String(tonnage),
        grade: form.grade.trim() === "" ? null : form.grade.trim(),
        notes: form.notes.trim(),
      });
      toast.success("Production reported");
      setForm(BLANK);
      onClose();
    } catch (err) {
      toast.error("Could not save the record", { description: errorMessage(err) });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report production</DialogTitle>
          <DialogDescription>One record per site, commodity and period.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="prod-site">Site</Label>
            <SitePicker id="prod-site" value={form.site} onChange={(site) => set({ site })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="prod-start">Period start</Label>
            <Input
              id="prod-start"
              type="date"
              value={form.period_start}
              onChange={(e) => set({ period_start: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="prod-end">Period end</Label>
            <Input
              id="prod-end"
              type="date"
              value={form.period_end}
              onChange={(e) => set({ period_end: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="prod-commodity">Commodity</Label>
            <Input
              id="prod-commodity"
              value={form.commodity}
              onChange={(e) => set({ commodity: e.target.value })}
              placeholder="Lithium (spodumene)"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="prod-tonnage">Tonnes</Label>
            <Input
              id="prod-tonnage"
              inputMode="decimal"
              value={form.tonnage}
              onChange={(e) => set({ tonnage: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="prod-grade">Grade % (optional)</Label>
            <Input
              id="prod-grade"
              inputMode="decimal"
              value={form.grade}
              onChange={(e) => set({ grade: e.target.value })}
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="prod-notes">Notes</Label>
            <Textarea
              id="prod-notes"
              value={form.notes}
              onChange={(e) => set({ notes: e.target.value })}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={create.isPending} onClick={submit}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
