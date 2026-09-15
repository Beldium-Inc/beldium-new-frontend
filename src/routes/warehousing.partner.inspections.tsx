import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/verticals/warehousing/app-shell";
import { Panel, StatCard, StatusPill, toneForStatus } from "@/verticals/warehousing/compliance-ui";
import { useDemo } from "@/verticals/warehousing/store";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CalendarClock, ClipboardCheck, TriangleAlert, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useCreateWarehousingInspector, useWarehousingInspectors } from "@/lib/api/warehousing-queries";

export const Route = createFileRoute("/warehousing/partner/inspections")({
  head: () => ({
    meta: [
      { title: "Inspections | Beldium Compliance Partner" },
      { name: "description", content: "Scheduled and completed warehouse inspections, and the inspector roster available to order them." },
    ],
  }),
  component: InspectionsPage,
});

function InspectionsPage() {
  const { state } = useDemo();
  const inspectors = useWarehousingInspectors();
  const passed = state.inspections.filter((i) => i.outcome === "passed").length;
  const attention = state.inspections.filter((i) => i.outcome === "attention").length;
  const failed = state.inspections.filter((i) => i.outcome === "failed").length;
  const inspectorRows = inspectors.data?.results ?? [];

  return (
    <AppShell role="partner" title="Inspections" subtitle="Site visit programme across supervised facilities">
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Passed" value={passed} tone="success" icon={<ClipboardCheck className="size-5" />} />
          <StatCard label="Attention" value={attention} tone="warning" icon={<CalendarClock className="size-5" />} />
          <StatCard label="Failed" value={failed} tone="danger" icon={<TriangleAlert className="size-5" />} />
        </div>

        <Panel title="Inspector roster" description="Inspectors available to order for a site visit." actions={<NewInspectorDialog />}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Region</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inspectorRows.map((insp) => (
                <TableRow key={insp.id}>
                  <TableCell className="text-sm font-medium text-primary">{insp.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{insp.title || "-"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{insp.region || "-"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{insp.email || "-"}</TableCell>
                  <TableCell>
                    <StatusPill tone={insp.is_active ? "success" : "neutral"}>{insp.is_active ? "Active" : "Inactive"}</StatusPill>
                  </TableCell>
                </TableRow>
              ))}
              {inspectorRows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                    No inspectors registered yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Panel>

        <Panel title="Inspection register">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Facility</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Inspector</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Next due</TableHead>
                <TableHead>Outcome</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {state.inspections.map((i) => {
                const f = state.facilities.find((x) => x.id === i.facility);
                return (
                  <TableRow key={i.id}>
                    <TableCell className="text-sm">{f?.name ?? "-"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{i.inspection_type}</TableCell>
                    <TableCell className="text-sm">{i.inspector_name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{i.inspected_on}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{i.next_due_on ?? "-"}</TableCell>
                    <TableCell>
                      <StatusPill tone={toneForStatus(i.outcome)}>{i.outcome}</StatusPill>
                    </TableCell>
                  </TableRow>
                );
              })}
              {state.inspections.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                    No inspections recorded.
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

function NewInspectorDialog() {
  const [open, setOpen] = useState(false);
  const createInspector = useCreateWarehousingInspector();
  const [form, setForm] = useState({ name: "", title: "", region: "", email: "" });

  const submit = () => {
    if (!form.name.trim()) {
      toast.error("Enter the inspector's name.");
      return;
    }
    void createInspector
      .mutateAsync(form)
      .then(() => {
        toast.success("Inspector added to the roster");
        setOpen(false);
        setForm({ name: "", title: "", region: "", email: "" });
      })
      .catch(() => toast.error("Could not add the inspector"));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 rounded-xl">
          <UserPlus className="size-4" /> Add inspector
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add an inspector</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Title</Label>
            <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Region</Label>
            <Input value={form.region} onChange={(e) => setForm((f) => ({ ...f, region: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit} disabled={createInspector.isPending} className="bg-link text-link-foreground hover:bg-link/90">
            Add inspector
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
