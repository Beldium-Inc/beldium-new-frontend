import { createFileRoute } from "@tanstack/react-router";
import { Bell, BellRing, CheckCircle2 } from "lucide-react";
import { AppShell } from "@/verticals/export/AppShell";
import { useStore } from "@/verticals/export/store";
import { DisclaimerNote, Panel, Pill, Stat } from "@/verticals/export/ui-kit";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/export/monitoring")({
  head: () => ({
    meta: [
      { title: "Monitoring | Beldium Export Compliance" },
      {
        name: "description",
        content: "Notifications on submissions, decisions, information requests and expiring evidence.",
      },
    ],
  }),
  component: MonitoringPage,
});

function MonitoringPage() {
  const { state, markNotificationRead } = useStore();
  const notifications = state.notifications;
  const unread = notifications.filter((n) => !n.read_at);

  return (
    <AppShell title="Monitoring" subtitle="Compliance notifications">
      <div className="grid gap-4 sm:grid-cols-2">
        <Stat label="Unread" value={unread.length} tone={unread.length ? "warning" : "success"} icon={<BellRing className="size-4" />} />
        <Stat label="Total" value={notifications.length} icon={<Bell className="size-4" />} />
      </div>

      <Panel title="Notifications" bodyClassName="p-0">
        <div className="divide-y divide-border">
          {notifications.map((n) => (
            <div key={n.id} className="flex flex-wrap items-start justify-between gap-3 px-5 py-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium">{n.title}</p>
                  {!n.read_at && <Pill tone="info">New</Pill>}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{n.body}</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">{n.created_at}</p>
              </div>
              {!n.read_at && (
                <Button variant="outline" size="sm" onClick={() => markNotificationRead(n.id)}>
                  <CheckCircle2 className="size-4" />
                  Mark read
                </Button>
              )}
            </div>
          ))}
          {notifications.length === 0 && (
            <p className="px-5 py-8 text-center text-sm text-muted-foreground">No notifications.</p>
          )}
        </div>
      </Panel>
      <DisclaimerNote />
    </AppShell>
  );
}
