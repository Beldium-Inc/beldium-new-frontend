import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/verticals/export/AppShell";
import { useStore } from "@/verticals/export/store";
import { ApplicationStatusPill, Panel, ScoreBar } from "@/verticals/export/ui-kit";

export const Route = createFileRoute("/export/exporters/")({
  head: () => ({
    meta: [
      { title: "Exporters | Beldium Export Compliance" },
      { name: "description", content: "Exporter register with application state and compliance scoring." },
    ],
  }),
  component: ExportersPage,
});

function ExportersPage() {
  const { state } = useStore();
  return (
    <AppShell title="Exporters" subtitle="Verification register">
      <div className="grid gap-4 md:grid-cols-2">
        {state.exporters.map((e) => {
          const application = state.applications.find((a) => a.exporter === e.id);
          return (
            <Link key={e.id} to="/export/exporters/$id" params={{ id: e.id }}>
              <Panel
                title={e.name}
                description={`${e.reference} · ${e.registration_number}`}
                className="h-full transition-shadow hover:shadow-raised"
                actions={<ApplicationStatusPill status={application?.status ?? "not_started"} />}
              >
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Compliance score</span>
                  <span className="font-semibold text-foreground">
                    {application?.risk.compliance_score ?? "-"} / 100
                  </span>
                </div>
                {application && <ScoreBar value={application.risk.compliance_score} />}
                <p className="mt-3 text-xs text-muted-foreground">
                  {e.contact_name} · {e.contact_email}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {e.destinations.join(", ") || "No destinations listed"}
                </p>
              </Panel>
            </Link>
          );
        })}
        {state.exporters.length === 0 && (
          <p className="text-sm text-muted-foreground">No exporters registered yet.</p>
        )}
      </div>
    </AppShell>
  );
}
