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

export const Route = createFileRoute("/miner/production")({ component: ProductionPage });

function ProductionPage() {
  const { primarySite, production, createProductionRecord } = useMiner();
  const [open, setOpen] = React.useState(false);
  const [commodity, setCommodity] = React.useState("");
  const [tonnage, setTonnage] = React.useState("");
  const [grade, setGrade] = React.useState("");
  const [periodStart, setPeriodStart] = React.useState("");
  const [periodEnd, setPeriodEnd] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  const submit = async () => {
    if (!primarySite || !commodity || !tonnage || !periodStart || !periodEnd) {
      toast.error("Fill in commodity, tonnage and the reporting period.");
      return;
    }
    setSubmitting(true);
    try {
      await createProductionRecord({
        site: primarySite.id,
        period_start: periodStart,
        period_end: periodEnd,
        commodity,
        tonnage: Number(tonnage),
        ...(grade ? { grade: Number(grade) } : {}),
      });
      toast.success("Production record added.");
      setOpen(false);
      setCommodity("");
      setTonnage("");
      setGrade("");
      setPeriodStart("");
      setPeriodEnd("");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not save the record.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Production"
        description="Reported tonnage and grade by period for your primary site."
        actions={
          primarySite ? (
            <Button size="sm" onClick={() => setOpen((v) => !v)}>
              {open ? "Cancel" : "Log production"}
            </Button>
          ) : undefined
        }
      />

      {open && (
        <Panel title="New production record" className="mb-5">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1.5">
              <Label>Commodity</Label>
              <Input value={commodity} onChange={(e) => setCommodity(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Tonnage</Label>
              <Input type="number" value={tonnage} onChange={(e) => setTonnage(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Grade (%)</Label>
              <Input type="number" value={grade} onChange={(e) => setGrade(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Period start</Label>
              <Input type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Period end</Label>
              <Input type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} />
            </div>
          </div>
          <Button className="mt-4" size="sm" onClick={() => void submit()} disabled={submitting}>
            {submitting ? "Saving…" : "Save record"}
          </Button>
        </Panel>
      )}

      <Panel bodyClassName="p-0">
        {production.length === 0 ? (
          <div className="p-6">
            <EmptyState title="No production recorded yet" description="Log your first period above." />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Period</TableHead>
                <TableHead>Commodity</TableHead>
                <TableHead>Tonnage</TableHead>
                <TableHead>Grade</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {production.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>{p.periodStart} – {p.periodEnd}</TableCell>
                  <TableCell>{p.commodity}</TableCell>
                  <TableCell className="tabular-nums">{p.tonnage.toLocaleString()} t</TableCell>
                  <TableCell className="tabular-nums">{p.grade != null ? `${p.grade}%` : "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Panel>
    </>
  );
}
