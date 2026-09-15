import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/verticals/warehousing/app-shell";
import { Panel, StatCard, StatusPill, toneForStatus } from "@/verticals/warehousing/compliance-ui";
import { useDemo } from "@/verticals/warehousing/store";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BellRing, CheckCircle2, TriangleAlert } from "lucide-react";
import { useCreateWarehousingMonitoringAlert, useResolveWarehousingMonitoringAlert } from "@/lib/api/warehousing-queries";
import type { MonitoringAlertSeverity } from "@/lib/api/warehousing";
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

export const Route = createFileRoute("/warehousing/partner/alerts")({
  head: () => ({
    meta: [
      { title: "Monitoring alerts | Beldium Compliance Partner" },
      { name: "description", content: "Live monitoring alerts raised against supervised warehouses, plus notification acknowledgements." },
    ],
  }),
  component: AlertsPage,
});

function AlertsPage() {
  const { state, markNotificationRead } = useDemo();
  const resolveAlert = useResolveWarehousingMonitoringAlert();
  const unreadNotifications = state.notifications.filter((n) => !n.read_at);
  const openAlerts = state.monitoringAlerts.filter((a) => !a.resolved_at);
  const critical = openAlerts.filter((a) => a.severity === "critical");

  return (
    <AppShell role="partner" title="Continuous monitoring" subtitle="Alerts and notifications across supervised warehouses" actions={<NewAlertDialog />}>
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Open alerts" value={openAlerts.length} tone="warning" icon={<BellRing className="size-5" />} />
          <StatCard label="Critical" value={critical.length} tone="danger" icon={<TriangleAlert className="size-5" />} />
          <StatCard label="Unread notifications" value={unreadNotifications.length} tone="info" icon={<CheckCircle2 className="size-5" />} />
        </div>

        <Panel title="Monitoring alerts" description="Raised manually or by automated register checks.">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Warehouse</TableHead>
                <TableHead>Facility</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {state.monitoringAlerts.map((a) => {
                const w = state.warehouses.find((x) => x.id === a.warehouse);
                const f = state.facilities.find((x) => x.id === a.facility);
                return (
                  <TableRow key={a.id}>
                    <TableCell className="text-sm font-medium text-primary">{w?.name ?? "-"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{f?.name ?? "-"}</TableCell>
                    <TableCell className="max-w-96 text-sm">{a.message}</TableCell>
                    <TableCell><StatusPill tone={toneForStatus(a.severity)}>{a.severity}</StatusPill></TableCell>
                    <TableCell className="text-sm text-muted-foreground">{a.source || "-"}</TableCell>
                    <TableCell>
                      <StatusPill tone={a.resolved_at ? "success" : "warning"}>{a.resolved_at ? "Resolved" : "Open"}</StatusPill>
                    </TableCell>
                    <TableCell className="text-right">
                      {!a.resolved_at && (
                        <Button
                          variant="outline"
                          className="h-8 rounded-lg text-xs"
                          disabled={resolveAlert.isPending}
                          onClick={() => {
                            resolveAlert.mutate(a.id, {
                              onSuccess: () => toast.success("Alert resolved"),
                              onError: () => toast.error("Could not resolve the alert"),
                            });
                          }}
                        >
                          Resolve
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              {state.monitoringAlerts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-sm text-muted-foreground">
                    No monitoring alerts recorded.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Panel>

        <Panel title="Notification feed" description="Acknowledging marks the notification read.">
          <ul className="space-y-3">
            {state.notifications.map((n) => (
              <li key={n.id} className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-border/70 p-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusPill tone={n.read_at ? "success" : "warning"}>{n.read_at ? "Read" : "New"}</StatusPill>
                    <span className="text-xs text-muted-foreground">{n.created_at}</span>
                  </div>
                  <p className="mt-2 text-sm font-medium text-foreground">{n.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{n.body}</p>
                </div>
                {!n.read_at && (
                  <Button
                    variant="outline"
                    className="rounded-xl"
                    onClick={() => {
                      markNotificationRead(n.id);
                      toast.success("Notification acknowledged");
                    }}
                  >
                    Acknowledge
                  </Button>
                )}
              </li>
            ))}
            {state.notifications.length === 0 && (
              <li className="text-sm text-muted-foreground">No notifications.</li>
            )}
          </ul>
        </Panel>
      </div>
    </AppShell>
  );
}

function NewAlertDialog() {
  const { state } = useDemo();
  const [open, setOpen] = useState(false);
  const createAlert = useCreateWarehousingMonitoringAlert();
  const [form, setForm] = useState({
    warehouse: state.warehouses[0]?.id ?? "",
    facility: "",
    message: "",
    severity: "info" as MonitoringAlertSeverity,
    source: "",
  });

  const facilitiesForWarehouse = state.facilities.filter((f) => f.warehouse === form.warehouse);

  const submit = () => {
    if (!form.warehouse || !form.message.trim()) {
      toast.error("Choose a warehouse and enter a message.");
      return;
    }
    void createAlert
      .mutateAsync({
        warehouse: form.warehouse,
        facility: form.facility || null,
        message: form.message,
        severity: form.severity,
        source: form.source,
      })
      .then(() => {
        toast.success("Alert raised");
        setOpen(false);
        setForm((f) => ({ ...f, message: "", source: "" }));
      })
      .catch(() => toast.error("Could not raise the alert"));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-xl bg-link text-link-foreground hover:bg-link/90">Raise alert</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Raise a monitoring alert</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Warehouse</Label>
            <select
              className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
              value={form.warehouse}
              onChange={(e) => setForm((f) => ({ ...f, warehouse: e.target.value, facility: "" }))}
            >
              {state.warehouses.map((w) => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label>Facility (optional)</Label>
            <select
              className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
              value={form.facility}
              onChange={(e) => setForm((f) => ({ ...f, facility: e.target.value }))}
            >
              <option value="">Whole warehouse</option>
              {facilitiesForWarehouse.map((f) => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label>Severity</Label>
            <select
              className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
              value={form.severity}
              onChange={(e) => setForm((f) => ({ ...f, severity: e.target.value as MonitoringAlertSeverity }))}
            >
              <option value="info">Info</option>
              <option value="warning">Warning</option>
              <option value="critical">Critical</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label>Source</Label>
            <Input value={form.source} onChange={(e) => setForm((f) => ({ ...f, source: e.target.value }))} placeholder="e.g. Sensor feed, manual review" />
          </div>
          <div className="space-y-2">
            <Label>Message</Label>
            <Input value={form.message} onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit} disabled={createAlert.isPending} className="bg-link text-link-foreground hover:bg-link/90">
            Raise alert
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
