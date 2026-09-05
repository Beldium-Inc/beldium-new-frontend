import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, Bell, Info } from "lucide-react";
import { AppShell } from "@/verticals/export/AppShell";
import { useStore } from "@/verticals/export/store";
import { DisclaimerNote, Panel, Pill, Stat } from "@/verticals/export/ui-kit";

export const Route = createFileRoute("/export/monitoring")({
  head: () => ({
    meta: [
      { title: "Monitoring | Beldium Export Compliance" },
      {
        name: "description",
        content:
          "Continuous monitoring of expiring permits, quantity variances, stalled verifications and new submissions.",
      },
      { property: "og:title", content: "Monitoring | Beldium Export Compliance" },
      { property: "og:description", content: "Alerts on expiring permits, variances and stalled verifications." },
    ],
  }),
  component: MonitoringPage,
});

function MonitoringPage() {
  const { state } = useStore();
  const events = state.events;
  const critical = events.filter((e) => e.severity === "critical");
  const warning = events.filter((e) => e.severity === "warning");

  return (
    <AppShell title="Monitoring" subtitle="Continuous compliance signals">
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Critical" value={critical.length} tone="danger" icon={<AlertTriangle className="size-4" />} />
        <Stat label="Warnings" value={warning.length} tone="warning" icon={<Bell className="size-4" />} />
        <Stat label="Informational" value={events.length - critical.length - warning.length} icon={<Info className="size-4" />} />
      </div>

      <Panel title="Event stream" bodyClassName="p-0">
        <div className="divide-y divide-border">
          {events.map((e) => (
            <div key={e.id} className="flex flex-wrap items-start justify-between gap-3 px-5 py-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium">{e.title}</p>
                  <Pill tone={e.severity === "critical" ? "danger" : e.severity === "warning" ? "warning" : "info"}>
                    {e.severity}
                  </Pill>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{e.detail}</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">{e.at}</p>
              </div>
              {e.shipmentId && (
                <Link
                  to="/export/shipments/$id"
                  params={{ id: e.shipmentId }}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  Open consignment
                </Link>
              )}
            </div>
          ))}
        </div>
      </Panel>
      <DisclaimerNote />
    </AppShell>
  );
}
