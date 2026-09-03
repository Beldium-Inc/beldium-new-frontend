import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/verticals/export/AppShell";
import { useStore } from "@/verticals/export/store";
import { Panel, Pill, ScoreBar } from "@/verticals/export/ui-kit";

export const Route = createFileRoute("/export/exporters/")({
  head: () => ({
    meta: [
      { title: "Exporters | Beldium Export Compliance" },
      {
        name: "description",
        content: "Exporter register with verification state, KYC status and compliance scoring.",
      },
      { property: "og:title", content: "Exporters | Beldium Export Compliance" },
      {
        property: "og:description",
        content: "Exporter register with verification state and compliance scoring.",
      },
    ],
  }),
  component: ExportersPage,
});

function ExportersPage() {
  const { state } = useStore();
  return (
    <AppShell title="Exporters" subtitle="Verification register">
      <div className="grid gap-4 md:grid-cols-2">
        {state.exporters.map((e) => (
          <Link key={e.id} to="/export/exporters/$id" params={{ id: e.id }}>
            <Panel
              title={e.name}
              description={`${e.rcNumber} · ${e.state} State · ${e.minerals.join(", ")}`}
              className="h-full transition-shadow hover:shadow-raised"
              actions={
                e.verification === "verified" ? (
                  <Pill tone="success">Verified</Pill>
                ) : e.verification === "in_review" ? (
                  <Pill tone="warning">In review</Pill>
                ) : (
                  <Pill tone="danger">Action required</Pill>
                )
              }
            >
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Compliance score</span>
                <span className="font-semibold text-foreground">{e.complianceScore} / 100</span>
              </div>
              <ScoreBar value={e.complianceScore} />
              <p className="mt-3 text-xs text-muted-foreground">
                {e.contact} · {e.email}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {e.kyc.filter((k) => k.ok).length} of {e.kyc.length} KYC checks cleared ·{" "}
                {e.licences.filter((l) => l.status === "verified").length} of {e.licences.length}{" "}
                licences verified
              </p>
            </Panel>
          </Link>
        ))}
      </div>
    </AppShell>
  );
}
