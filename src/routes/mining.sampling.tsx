import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { FlaskConical } from "lucide-react";
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
import type { MiningSample } from "@/lib/api/mining";
import { useCreateSample, useMiningSamples, useUpdateSample } from "@/lib/api/mining-queries";
import { PageHeader, Panel } from "@/verticals/mining/components/primitives";
import { StatusChip } from "@/verticals/mining/components/chips";
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

export const Route = createFileRoute("/mining/sampling")({ component: SamplingPage });

const STATUS_LABEL: Record<MiningSample["status"], string> = {
  pending: "Pending",
  verified: "Verified",
  disputed: "Disputed",
};

function SamplingPage() {
  const { canDecide, isMiner } = useMiningPermissions();
  const samples = useMiningSamples();
  const update = useUpdateSample();
  const [filters, setFilters] = useListFilters();
  const [recording, setRecording] = useState(false);

  const rows = (samples.data?.results ?? [])
    .filter((s) =>
      matchesFilters(filters, { siteId: s.site, status: STATUS_LABEL[s.status] }, [
        s.reference,
        s.site_name,
        s.lab,
        s.certificate,
      ]),
    )
    .sort((a, b) => b.collected_on.localeCompare(a.collected_on));

  const setStatus = async (s: MiningSample, status: MiningSample["status"]) => {
    try {
      await update.mutateAsync({ id: s.id, patch: { status } });
      toast.success(`Sample ${s.reference} marked ${STATUS_LABEL[status].toLowerCase()}`);
    } catch (err) {
      toast.error("Could not update the sample", { description: errorMessage(err) });
    }
  };

  return (
    <>
      <PageHeader
        eyebrow={isMiner ? "Operations" : "Field"}
        title="Sampling & quality"
        description="Samples taken at each site, the laboratory that tested them and the assay results. Certified testing runs in Quality & Control."
        actions={
          isMiner && (
            <Button onClick={() => setRecording(true)}>
              <FlaskConical className="size-4" /> Record sample
            </Button>
          )
        }
      />
      <ListToolbar
        filters={filters}
        onChange={setFilters}
        statuses={Object.values(STATUS_LABEL)}
        placeholder="Search reference, lab or certificate"
      />
      <ListState
        loading={samples.isPending}
        error={samples.error}
        empty={rows.length === 0}
        emptyTitle="No samples recorded"
        emptyDescription={isMiner ? "Record a sample after it is taken at the site." : undefined}
      >
        <Panel bodyClassName="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reference</TableHead>
                  <TableHead>Site</TableHead>
                  <TableHead>Collected</TableHead>
                  <TableHead>Laboratory</TableHead>
                  <TableHead className="text-right">Li₂O %</TableHead>
                  <TableHead className="text-right">Fe₂O₃ %</TableHead>
                  <TableHead className="text-right">Moisture %</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-mono text-xs">
                      {s.reference}
                      {s.certificate && (
                        <p className="text-muted-foreground">Cert {s.certificate}</p>
                      )}
                    </TableCell>
                    <TableCell className="text-sm font-medium">{s.site_name}</TableCell>
                    <TableCell className="text-sm">{fmtDate(s.collected_on)}</TableCell>
                    <TableCell className="text-sm">
                      {s.lab || "—"}
                      {s.method && <p className="text-xs text-muted-foreground">{s.method}</p>}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {fmtNumber(s.li2o_percent)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {fmtNumber(s.fe2o3_percent)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {fmtNumber(s.moisture_percent)}
                    </TableCell>
                    <TableCell>
                      <StatusChip value={STATUS_LABEL[s.status]} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {canDecide && s.status !== "verified" && (
                          <Button
                            size="sm"
                            disabled={update.isPending}
                            onClick={() => setStatus(s, "verified")}
                          >
                            Verify
                          </Button>
                        )}
                        {canDecide && s.status === "pending" && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={update.isPending}
                            onClick={() => setStatus(s, "disputed")}
                          >
                            Dispute
                          </Button>
                        )}
                        {isMiner && (
                          <Button asChild size="sm" variant="ghost">
                            <Link to="/mining/sites/$siteId" params={{ siteId: s.site }}>
                              Site
                            </Link>
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Panel>
      </ListState>
      <RecordSampleDialog open={recording} onClose={() => setRecording(false)} />
    </>
  );
}

const BLANK = {
  site: "",
  collected_on: "",
  lab: "",
  method: "",
  li2o: "",
  fe2o3: "",
  moisture: "",
  custody: "",
};

function RecordSampleDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const create = useCreateSample();
  const [form, setForm] = useState(BLANK);
  const set = (patch: Partial<typeof BLANK>) => setForm((f) => ({ ...f, ...patch }));
  const pct = (v: string) => (v.trim() === "" ? null : Number(v));

  const submit = async () => {
    if (!form.site || !form.collected_on) {
      toast.error("Choose the site and the date the sample was taken");
      return;
    }
    const values = [pct(form.li2o), pct(form.fe2o3), pct(form.moisture)];
    if (values.some((v) => v !== null && (Number.isNaN(v) || v < 0 || v > 100))) {
      toast.error("Percentages must be numbers between 0 and 100");
      return;
    }
    try {
      await create.mutateAsync({
        site: form.site,
        collected_on: form.collected_on,
        lab: form.lab.trim(),
        method: form.method.trim(),
        li2o_percent: values[0] ?? null,
        fe2o3_percent: values[1] ?? null,
        moisture_percent: values[2] ?? null,
        chain_of_custody: form.custody.trim(),
      });
      toast.success("Sample recorded");
      setForm(BLANK);
      onClose();
    } catch (err) {
      toast.error("Could not record the sample", { description: errorMessage(err) });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record a sample</DialogTitle>
          <DialogDescription>
            Leave assay values blank until the laboratory reports them.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="smp-site">Site</Label>
            <SitePicker id="smp-site" value={form.site} onChange={(site) => set({ site })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="smp-date">Collected on</Label>
            <Input
              id="smp-date"
              type="date"
              value={form.collected_on}
              onChange={(e) => set({ collected_on: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="smp-lab">Laboratory</Label>
            <Input id="smp-lab" value={form.lab} onChange={(e) => set({ lab: e.target.value })} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="smp-method">Method</Label>
            <Input
              id="smp-method"
              value={form.method}
              onChange={(e) => set({ method: e.target.value })}
              placeholder="Channel sampling, ICP-OES"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="smp-li2o">Li₂O %</Label>
            <Input
              id="smp-li2o"
              inputMode="decimal"
              value={form.li2o}
              onChange={(e) => set({ li2o: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="smp-fe2o3">Fe₂O₃ %</Label>
            <Input
              id="smp-fe2o3"
              inputMode="decimal"
              value={form.fe2o3}
              onChange={(e) => set({ fe2o3: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="smp-moisture">Moisture %</Label>
            <Input
              id="smp-moisture"
              inputMode="decimal"
              value={form.moisture}
              onChange={(e) => set({ moisture: e.target.value })}
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="smp-custody">Chain of custody</Label>
            <Input
              id="smp-custody"
              value={form.custody}
              onChange={(e) => set({ custody: e.target.value })}
              placeholder="Who took it and who holds it now"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={create.isPending} onClick={submit}>
            Record sample
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
