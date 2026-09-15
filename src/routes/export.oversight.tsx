import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/verticals/export/AppShell";
import { useStore } from "@/verticals/export/store";
import { ApplicationStatusPill, DisclaimerNote, Panel, Pill, Stat } from "@/verticals/export/ui-kit";

export const Route = createFileRoute("/export/oversight")({
  head: () => ({
    meta: [
      { title: "Regulatory Oversight | Beldium Export Compliance" },
      {
        name: "description",
        content: "Read-only oversight of exporter admission applications and compliance activity.",
      },
    ],
  }),
  component: OversightPage,
});

const DECIDED = new Set(["approved", "conditionally_approved", "rejected"]);

function OversightPage() {
  const { state } = useStore();
  const approved = state.applications.filter((a) => a.status === "approved" || a.status === "conditionally_approved");
  const highRisk = state.applications.filter((a) => a.risk.risk_band === "high");
  const open = state.applications.filter((a) => !DECIDED.has(a.status));

  return (
    <AppShell title="Regulatory oversight" subtitle="Read-only visibility across Beldium compliance activity">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Exporters monitored" value={state.exporters.length} />
        <Stat label="Approved" value={approved.length} tone="success" hint="Approved or conditional" />
        <Stat label="High risk" value={highRisk.length} tone="danger" />
        <Stat label="Open applications" value={open.length} tone="warning" />
      </div>

      <Panel
        title="Exporter register"
        description="Oversight users can view records but cannot edit them."
        bodyClassName="p-0"
      >
        <div className="divide-y divide-border">
          {state.exporters.map((e) => {
            const application = state.applications.find((a) => a.exporter === e.id);
            return (
              <div key={e.id} className="flex flex-col gap-3 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link to="/export/exporters/$id" params={{ id: e.id }} className="font-display text-sm font-semibold hover:underline">
                      {e.name}
                    </Link>
                    <ApplicationStatusPill status={application?.status ?? "not_started"} />
                    {application && (
                      <Pill tone={application.risk.risk_band === "high" ? "danger" : application.risk.risk_band === "medium" ? "warning" : "success"}>
                        Risk {application.risk.compliance_score} · {application.risk.risk_band}
                      </Pill>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {e.reference} · {e.destinations.join(", ") || "No destinations listed"}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </Panel>

      <Panel title="Scope of this view">
        <ul className="space-y-2 text-xs leading-relaxed text-muted-foreground">
          <li>View compliance records, domain reviews and audit trails.</li>
          <li>No editing of exporter records, documents or decisions.</li>
        </ul>
        <DisclaimerNote className="mt-4" />
      </Panel>
    </AppShell>
  );
}
