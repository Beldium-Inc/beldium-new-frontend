import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { Panel, StatCard, StatusPill } from "@/components/compliance-ui";
import { useDemo } from "@/lib/demo/store";
import { Button } from "@/components/ui/button";
import { BellRing, CheckCircle2, ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/partner/alerts")({
  head: () => ({
    meta: [
      { title: "Monitoring alerts | Beldium Compliance Partner" },
      { name: "description", content: "Continuous monitoring alerts from weighbridge reconciliation, insurance exposure, inspection scheduling and document expiry engines." },
      { property: "og:title", content: "Monitoring alerts | Beldium Compliance Partner" },
      { property: "og:description", content: "Post-approval surveillance signals across supervised warehouses." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AlertsPage,
});

function AlertsPage() {
  const { alerts, acknowledged, acknowledgeAlert } = useDemo();
  const live = alerts.filter((a) => !acknowledged.includes(a.id));

  return (
    <AppShell role="partner" title="Continuous monitoring" subtitle="Automated surveillance across approved and applicant facilities">
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Active alerts" value={live.length} tone="warning" icon={<BellRing className="size-5" />} />
          <StatCard label="Critical" value={live.filter((a) => a.severity === "critical").length} tone="danger" icon={<ShieldAlert className="size-5" />} />
          <StatCard label="Acknowledged" value={acknowledged.length} tone="success" icon={<CheckCircle2 className="size-5" />} />
        </div>

        <Panel title="Alert feed" description="Acknowledging an alert records the action against your reviewer account.">
          <ul className="space-y-3">
            {alerts.map((a) => {
              const ack = acknowledged.includes(a.id);
              return (
                <li key={a.id} className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-border/70 p-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusPill tone={a.severity === "critical" ? "danger" : a.severity === "warning" ? "warning" : "info"}>
                        {a.severity}
                      </StatusPill>
                      <span className="text-xs text-muted-foreground">{a.id} · {a.source}</span>
                    </div>
                    <p className="mt-2 text-sm text-foreground">{a.message}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{a.facility} · {a.raised}</p>
                  </div>
                  {ack ? (
                    <StatusPill tone="success"><CheckCircle2 className="size-3" /> Acknowledged</StatusPill>
                  ) : (
                    <Button
                      variant="outline"
                      className="rounded-xl"
                      onClick={() => {
                        acknowledgeAlert(a.id, "Adaeze Nwachukwu");
                        toast.success("Alert acknowledged", { description: `${a.id} · ${a.facility}` });
                      }}
                    >
                      Acknowledge
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        </Panel>
      </div>
    </AppShell>
  );
}
