import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, CheckCircle2, FileStack, Ship } from "lucide-react";
import { AppShell } from "@/verticals/export/AppShell";
import { useStore } from "@/verticals/export/store";
import { DisclaimerNote, Panel, Pill, ScoreBar, ShipmentStatusPill, Stat } from "@/verticals/export/ui-kit";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/export/dashboard")({
  head: () => ({
    meta: [
      { title: "Exporter Dashboard | Beldium Export Compliance" },
      {
        name: "description",
        content:
          "Exporter view of compliance status, score, live consignments, expiring documents and blocked shipments.",
      },
      { property: "og:title", content: "Exporter Dashboard | Beldium Export Compliance" },
      { property: "og:description", content: "Compliance status, score and shipment readiness for exporters." },
    ],
  }),
  component: ExporterDashboard,
});

function ExporterDashboard() {
  const { state, user } = useStore();
  const exporter = state.exporters.find((e) => e.id === user?.exporterId) ?? state.exporters[0]!;
  const shipments = state.shipments.filter((s) => s.exporterId === exporter.id);
  const ready = shipments.filter((s) => s.checklist.every((c) => c.state === "pass"));
  const blocked = shipments.filter(
    (s) => s.checklist.some((c) => c.state === "fail") || s.nonConformities.some((n) => n.status === "open"),
  );
  const expiring = shipments.flatMap((s) =>
    s.documents.filter((d) => d.expires && d.expires !== "-" && d.expires < "2026-10-01").map((d) => ({ s, d })),
  );

  return (
    <AppShell
      title={`Welcome, ${user?.name.split(" ")[0] ?? "exporter"}`}
      subtitle={`${exporter.name} · ${exporter.rcNumber}`}
      actions={
        <Button size="sm" asChild>
          <Link to="/export/shipments/new">New shipment</Link>
        </Button>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Verification"
          value={exporter.verification === "verified" ? "Verified" : "In review"}
          tone={exporter.verification === "verified" ? "success" : "warning"}
          hint={`Onboarded ${exporter.onboarded}`}
          icon={<CheckCircle2 className="size-4" />}
        />
        <Stat label="Live consignments" value={shipments.length} hint={`${ready.length} ready to ship`} icon={<Ship className="size-4" />} />
        <Stat
          label="Blocked"
          value={blocked.length}
          tone={blocked.length ? "danger" : "success"}
          hint="Open findings or failed checks"
          icon={<AlertTriangle className="size-4" />}
        />
        <Stat
          label="Documents expiring"
          value={expiring.length}
          tone={expiring.length ? "warning" : "default"}
          hint="Within the next 6 weeks"
          icon={<FileStack className="size-4" />}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.5fr_0.5fr]">
        <Panel title="Your consignments" bodyClassName="p-0">
          <div className="divide-y divide-border">
            {shipments.map((s) => {
              const isBlocked = blocked.includes(s);
              return (
                <Link
                  key={s.id}
                  to="/export/shipments/$id"
                  params={{ id: s.id }}
                  className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 hover:bg-secondary/60"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-display text-sm font-semibold">{s.reference}</span>
                      <ShipmentStatusPill status={s.status} />
                      {isBlocked ? <Pill tone="danger">Blocked</Pill> : <Pill tone="success">Ready</Pill>}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {s.mineral} · {s.quantity} · {s.destination} · ETD {s.etd}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {s.documents.filter((d) => d.status === "verified").length}/{s.documents.length} docs verified
                  </p>
                </Link>
              );
            })}
          </div>
        </Panel>

        <div className="space-y-4">
          <Panel title="Compliance score">
            <p className="font-display text-3xl font-semibold">{exporter.complianceScore}</p>
            <ScoreBar value={exporter.complianceScore} />
            <p className="mt-3 text-xs text-muted-foreground">
              Improve by closing findings quickly and supplying accredited assay evidence with each
              submission.
            </p>
          </Panel>
          <Panel title="Documents expiring soon">
            <ul className="space-y-2 text-xs">
              {expiring.map(({ s, d }) => (
                <li key={`${s.id}-${d.id}`} className="flex items-center justify-between gap-2">
                  <span className="truncate">{d.name}</span>
                  <Pill tone="warning">{d.expires}</Pill>
                </li>
              ))}
              {expiring.length === 0 && <li className="text-muted-foreground">Nothing expiring.</li>}
            </ul>
          </Panel>
          <DisclaimerNote />
        </div>
      </div>
    </AppShell>
  );
}
