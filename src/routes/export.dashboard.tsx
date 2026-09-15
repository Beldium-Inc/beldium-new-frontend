import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, CheckCircle2, FileStack, Ship } from "lucide-react";
import { AppShell } from "@/verticals/export/AppShell";
import { useStore } from "@/verticals/export/store";
import { ApplicationStatusPill, DisclaimerNote, Panel, Pill, ScoreBar, Stat } from "@/verticals/export/ui-kit";
import { Button } from "@/components/ui/button";
import { EXPORT_DOMAIN_LABELS } from "@/lib/api/export";

export const Route = createFileRoute("/export/dashboard")({
  head: () => ({
    meta: [
      { title: "Exporter Dashboard | Beldium Export Compliance" },
      {
        name: "description",
        content:
          "Exporter view of compliance status, score, live consignments and expiring documents.",
      },
    ],
  }),
  component: ExporterDashboard,
});

function ExporterDashboard() {
  const { state, user, myExporter, myApplication } = useStore();
  const shipments = state.shipments.filter((s) => s.exporter === myExporter?.id);
  const expiringDocs = state.documents.filter(
    (d) => d.application === myApplication?.id && d.validity !== "current",
  );
  const outstanding = (myApplication?.sections ?? []).filter((s) => s.status !== "passed");

  return (
    <AppShell
      title={`Welcome, ${user?.name.split(" ")[0] ?? "exporter"}`}
      subtitle={myExporter ? `${myExporter.name} · ${myExporter.reference}` : ""}
      actions={
        <Button size="sm" asChild>
          <Link to="/export/shipments/new">New shipment</Link>
        </Button>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Application status"
          value={<ApplicationStatusPill status={myApplication?.status ?? "not_started"} />}
          hint={myApplication ? "" : "Start your admission application"}
          icon={<CheckCircle2 className="size-4" />}
        />
        <Stat label="Live shipments" value={shipments.length} icon={<Ship className="size-4" />} />
        <Stat
          label="Domains outstanding"
          value={outstanding.length}
          tone={outstanding.length ? "warning" : "success"}
          hint="Not yet passed"
          icon={<AlertTriangle className="size-4" />}
        />
        <Stat
          label="Documents expiring"
          value={expiringDocs.length}
          tone={expiringDocs.length ? "warning" : "default"}
          icon={<FileStack className="size-4" />}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.5fr_0.5fr]">
        <Panel title="Your shipments" bodyClassName="p-0">
          <div className="divide-y divide-border">
            {shipments.map((s) => (
              <Link
                key={s.id}
                to="/export/shipments/$id"
                params={{ id: s.id }}
                className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 hover:bg-secondary/60"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-display text-sm font-semibold">{s.reference}</span>
                    <Pill tone="neutral">{s.status}</Pill>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {s.quantity} {s.unit} · {s.destination_country} · ETD {s.expected_ship_date}
                  </p>
                </div>
              </Link>
            ))}
            {shipments.length === 0 && (
              <p className="px-5 py-8 text-center text-sm text-muted-foreground">No shipments yet.</p>
            )}
          </div>
        </Panel>

        <div className="space-y-4">
          <Panel title="Compliance score">
            <p className="font-display text-3xl font-semibold">{myApplication?.risk.compliance_score ?? "-"}</p>
            {myApplication && <ScoreBar value={myApplication.risk.compliance_score} />}
            <p className="mt-3 text-xs text-muted-foreground">
              Improve by closing findings quickly and supplying accredited evidence with each domain.
            </p>
          </Panel>
          <Panel title="Domains outstanding">
            <ul className="space-y-2 text-xs">
              {outstanding.map((s) => (
                <li key={s.key} className="flex items-center justify-between gap-2">
                  <span className="truncate">{EXPORT_DOMAIN_LABELS[s.key]}</span>
                  <Pill tone="warning">{s.status}</Pill>
                </li>
              ))}
              {outstanding.length === 0 && <li className="text-muted-foreground">Nothing outstanding.</li>}
            </ul>
          </Panel>
          <DisclaimerNote />
        </div>
      </div>
    </AppShell>
  );
}
