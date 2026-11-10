import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import type { EnvRecord, EnvRecordStatus, SafetyIncident } from "@/lib/api/mining";
import {
  useCreateEnvironmentalRecord,
  useCreateSafetyIncident,
  useEnvironmentalRecords,
  useSafetyIncidents,
  useUpdateEnvironmentalRecord,
  useUpdateSafetyIncident,
} from "@/lib/api/mining-queries";
import { KpiCard, PageHeader, Panel } from "@/verticals/mining/components/primitives";
import { StatusChip } from "@/verticals/mining/components/chips";
import {
  ListState,
  ListToolbar,
  SitePicker,
  errorMessage,
  fmtDate,
  matchesFilters,
  useListFilters,
  useMiningPermissions,
} from "@/verticals/mining/components/listkit";

export const Route = createFileRoute("/mining/environmental")({ component: EnvironmentalPage });

const ENV_LABEL: Record<EnvRecordStatus, string> = {
  within_limit: "Within Limit",
  watch: "Watch",
  breach: "Breach",
};
const INCIDENT_LABEL: Record<SafetyIncident["status"], string> = {
  investigating: "Investigating",
  closed: "Closed",
};

function EnvironmentalPage() {
  const { isMiner, isRegulator } = useMiningPermissions();
  const env = useEnvironmentalRecords();
  const incidents = useSafetyIncidents();
  const [filters, setFilters] = useListFilters();
  const [adding, setAdding] = useState<"env" | "incident" | null>(null);

  const envRows = (env.data?.results ?? [])
    .filter((r) =>
      matchesFilters(filters, { siteId: r.site }, [r.metric, r.site_name, r.value, r.limit]),
    )
    .sort((a, b) => b.measured_on.localeCompare(a.measured_on));
  const incidentRows = (incidents.data?.results ?? [])
    .filter((r) => matchesFilters(filters, { siteId: r.site }, [r.type, r.site_name, r.summary]))
    .sort((a, b) => b.date.localeCompare(a.date));
  const alerts = envRows.filter((r) => r.status !== "within_limit");
  const openIncidents = incidentRows.filter((r) => r.status === "investigating");
  const lostDays = incidentRows.reduce((sum, r) => sum + (r.lost_days || 0), 0);

  return (
    <>
      <PageHeader
        eyebrow={isRegulator ? "Monitoring" : isMiner ? "Compliance" : "Field"}
        title={isRegulator ? "Environmental alerts" : "Environmental & safety"}
        description="Environmental measurements against their limits, and safety incidents at each site."
        actions={
          isMiner && (
            <>
              <Button variant="outline" onClick={() => setAdding("incident")}>
                <Plus className="size-4" /> Report incident
              </Button>
              <Button onClick={() => setAdding("env")}>
                <Plus className="size-4" /> Add measurement
              </Button>
            </>
          )
        }
      />
      <div className="mb-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Breaches"
          value={envRows.filter((r) => r.status === "breach").length}
          tone="danger"
        />
        <KpiCard
          label="On watch"
          value={envRows.filter((r) => r.status === "watch").length}
          tone="warning"
        />
        <KpiCard label="Open incidents" value={openIncidents.length} tone="warning" />
        <KpiCard label="Lost days (all incidents)" value={lostDays} />
      </div>
      <ListToolbar
        filters={filters}
        onChange={setFilters}
        placeholder="Search metric, incident or site"
      />
      <Tabs defaultValue={isRegulator ? "alerts" : "env"}>
        <TabsList>
          <TabsTrigger value="alerts">Alerts ({alerts.length})</TabsTrigger>
          <TabsTrigger value="env">All measurements ({envRows.length})</TabsTrigger>
          <TabsTrigger value="incidents">Safety incidents ({incidentRows.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="alerts" className="mt-4">
          <ListState
            loading={env.isPending}
            error={env.error}
            empty={alerts.length === 0}
            emptyTitle="No measurement is over or near its limit"
          >
            <EnvTable rows={alerts} />
          </ListState>
        </TabsContent>
        <TabsContent value="env" className="mt-4">
          <ListState
            loading={env.isPending}
            error={env.error}
            empty={envRows.length === 0}
            emptyTitle="No measurements recorded"
          >
            <EnvTable rows={envRows} />
          </ListState>
        </TabsContent>
        <TabsContent value="incidents" className="mt-4">
          <ListState
            loading={incidents.isPending}
            error={incidents.error}
            empty={incidentRows.length === 0}
            emptyTitle="No safety incidents reported"
          >
            <IncidentTable rows={incidentRows} />
          </ListState>
        </TabsContent>
      </Tabs>
      <EnvDialog open={adding === "env"} onClose={() => setAdding(null)} />
      <IncidentDialog open={adding === "incident"} onClose={() => setAdding(null)} />
    </>
  );
}

function EnvTable({ rows }: { rows: EnvRecord[] }) {
  const { canDecide } = useMiningPermissions();
  const update = useUpdateEnvironmentalRecord();
  const setStatus = async (r: EnvRecord, status: EnvRecordStatus) => {
    try {
      await update.mutateAsync({ id: r.id, patch: { status } });
      toast.success(`${r.metric} marked ${ENV_LABEL[status].toLowerCase()}`);
    } catch (err) {
      toast.error("Could not update the record", { description: errorMessage(err) });
    }
  };
  return (
    <Panel bodyClassName="p-0">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Metric</TableHead>
              <TableHead>Site</TableHead>
              <TableHead>Value</TableHead>
              <TableHead>Limit</TableHead>
              <TableHead>Measured</TableHead>
              <TableHead>Status</TableHead>
              {canDecide && <TableHead className="text-right">Set status</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.metric}</TableCell>
                <TableCell className="text-sm">{r.site_name}</TableCell>
                <TableCell className="text-sm tabular-nums">{r.value || "—"}</TableCell>
                <TableCell className="text-sm tabular-nums">{r.limit || "—"}</TableCell>
                <TableCell className="text-sm">{fmtDate(r.measured_on)}</TableCell>
                <TableCell>
                  <StatusChip value={ENV_LABEL[r.status]} />
                </TableCell>
                {canDecide && (
                  <TableCell className="text-right">
                    <Select
                      value={r.status}
                      onValueChange={(v) => setStatus(r, v as EnvRecordStatus)}
                    >
                      <SelectTrigger
                        className="ml-auto h-8 w-36"
                        aria-label={`Status of ${r.metric}`}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(ENV_LABEL).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Panel>
  );
}

function IncidentTable({ rows }: { rows: SafetyIncident[] }) {
  const { canDecide } = useMiningPermissions();
  const update = useUpdateSafetyIncident();
  const close = async (r: SafetyIncident) => {
    try {
      await update.mutateAsync({ id: r.id, patch: { status: "closed" } });
      toast.success("Incident closed");
    } catch (err) {
      toast.error("Could not close the incident", { description: errorMessage(err) });
    }
  };
  return (
    <Panel bodyClassName="p-0">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Site</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Severity</TableHead>
              <TableHead className="text-right">Lost days</TableHead>
              <TableHead>Summary</TableHead>
              <TableHead>Status</TableHead>
              {canDecide && <TableHead className="text-right">Action</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="text-sm">{fmtDate(r.date)}</TableCell>
                <TableCell className="text-sm font-medium">{r.site_name}</TableCell>
                <TableCell className="text-sm">{r.type}</TableCell>
                <TableCell>
                  <StatusChip value={r.severity} />
                </TableCell>
                <TableCell className="text-right tabular-nums">{r.lost_days}</TableCell>
                <TableCell className="max-w-xs text-sm text-muted-foreground">
                  {r.summary || "—"}
                </TableCell>
                <TableCell>
                  <StatusChip value={INCIDENT_LABEL[r.status]} />
                </TableCell>
                {canDecide && (
                  <TableCell className="text-right">
                    {r.status === "investigating" && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={update.isPending}
                        onClick={() => close(r)}
                      >
                        Close
                      </Button>
                    )}
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Panel>
  );
}

function EnvDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const create = useCreateEnvironmentalRecord();
  const blank = {
    site: "",
    metric: "",
    value: "",
    limit: "",
    measured_on: "",
    status: "within_limit" as EnvRecordStatus,
  };
  const [form, setForm] = useState(blank);
  const set = (patch: Partial<typeof blank>) => setForm((f) => ({ ...f, ...patch }));

  const submit = async () => {
    if (!form.site || !form.metric.trim() || !form.measured_on) {
      toast.error("Site, metric and date are required");
      return;
    }
    try {
      await create.mutateAsync({
        site: form.site,
        metric: form.metric.trim(),
        value: form.value.trim(),
        limit: form.limit.trim(),
        measured_on: form.measured_on,
        status: form.status,
      });
      toast.success("Measurement recorded");
      setForm(blank);
      onClose();
    } catch (err) {
      toast.error("Could not record the measurement", { description: errorMessage(err) });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add an environmental measurement</DialogTitle>
          <DialogDescription>
            Dust, noise, water quality and similar readings, with the permitted limit.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="env-site">Site</Label>
            <SitePicker id="env-site" value={form.site} onChange={(site) => set({ site })} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="env-metric">Metric</Label>
            <Input
              id="env-metric"
              value={form.metric}
              onChange={(e) => set({ metric: e.target.value })}
              placeholder="PM10 dust"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="env-value">Value</Label>
            <Input
              id="env-value"
              value={form.value}
              onChange={(e) => set({ value: e.target.value })}
              placeholder="48 µg/m³"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="env-limit">Limit</Label>
            <Input
              id="env-limit"
              value={form.limit}
              onChange={(e) => set({ limit: e.target.value })}
              placeholder="50 µg/m³"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="env-date">Measured on</Label>
            <Input
              id="env-date"
              type="date"
              value={form.measured_on}
              onChange={(e) => set({ measured_on: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="env-status">Against the limit</Label>
            <Select
              value={form.status}
              onValueChange={(v) => set({ status: v as EnvRecordStatus })}
            >
              <SelectTrigger id="env-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(ENV_LABEL).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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

function IncidentDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const create = useCreateSafetyIncident();
  const blank = { site: "", date: "", type: "", severity: "Minor", lost_days: "0", summary: "" };
  const [form, setForm] = useState(blank);
  const set = (patch: Partial<typeof blank>) => setForm((f) => ({ ...f, ...patch }));

  const submit = async () => {
    const lost = Number(form.lost_days || 0);
    if (!form.site || !form.date || !form.type.trim()) {
      toast.error("Site, date and type are required");
      return;
    }
    if (!Number.isInteger(lost) || lost < 0) {
      toast.error("Lost days must be a whole number");
      return;
    }
    try {
      await create.mutateAsync({
        site: form.site,
        date: form.date,
        type: form.type.trim(),
        severity: form.severity,
        lost_days: lost,
        summary: form.summary.trim(),
      });
      toast.success("Incident reported");
      setForm(blank);
      onClose();
    } catch (err) {
      toast.error("Could not report the incident", { description: errorMessage(err) });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report a safety incident</DialogTitle>
          <DialogDescription>The compliance desk investigates and closes it.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="inc-site">Site</Label>
            <SitePicker id="inc-site" value={form.site} onChange={(site) => set({ site })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="inc-date">Date</Label>
            <Input
              id="inc-date"
              type="date"
              value={form.date}
              onChange={(e) => set({ date: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="inc-type">Type</Label>
            <Input
              id="inc-type"
              value={form.type}
              onChange={(e) => set({ type: e.target.value })}
              placeholder="Slip, fall, equipment"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="inc-severity">Severity</Label>
            <Select value={form.severity} onValueChange={(severity) => set({ severity })}>
              <SelectTrigger id="inc-severity">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["Minor", "Major", "Critical"].map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="inc-lost">Lost days</Label>
            <Input
              id="inc-lost"
              inputMode="numeric"
              value={form.lost_days}
              onChange={(e) => set({ lost_days: e.target.value })}
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="inc-summary">What happened</Label>
            <Textarea
              id="inc-summary"
              value={form.summary}
              onChange={(e) => set({ summary: e.target.value })}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={create.isPending} onClick={submit}>
            Report
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
