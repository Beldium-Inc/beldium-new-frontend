import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { CheckCircle2, XCircle } from "lucide-react";
import { AppShell } from "@/verticals/export/AppShell";
import { useStore } from "@/verticals/export/store";
import { DisclaimerNote, DocStatusPill, Panel, Pill, ScoreBar, ShipmentStatusPill } from "@/verticals/export/ui-kit";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/export/exporters/$id")({
  head: () => ({
    meta: [
      { title: "Exporter Verification | Beldium Export Compliance" },
      {
        name: "description",
        content: "Exporter verification file: licences, KYC checks, compliance score and consignment history.",
      },
      { property: "og:title", content: "Exporter Verification | Beldium Export Compliance" },
      { property: "og:description", content: "Exporter licences, KYC checks and consignment history." },
    ],
  }),
  component: ExporterDetail,
});

function ExporterDetail() {
  const { id } = Route.useParams();
  const { state, user } = useStore();
  const e = state.exporters.find((x) => x.id === id);
  if (!e)
    return (
      <AppShell title="Exporter not found">
        <Panel>
          <Button asChild>
            <Link to="/export/exporters">Back to exporters</Link>
          </Button>
        </Panel>
      </AppShell>
    );

  const shipments = state.shipments.filter((s) => s.exporterId === e.id);

  return (
    <AppShell
      title={e.name}
      subtitle={`${e.rcNumber} · ${e.state} State · onboarded ${e.onboarded}`}
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
      <div className="grid gap-4 lg:grid-cols-[1.5fr_0.5fr]">
        <div className="space-y-4">
          <Panel title="Licences & registrations" bodyClassName="p-0">
            <div className="divide-y divide-border">
              {e.licences.map((l) => (
                <div key={l.name} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5">
                  <div>
                    <p className="text-sm font-medium">{l.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Ref {l.ref} · expires {l.expires}
                    </p>
                  </div>
                  <DocStatusPill status={l.status} />
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="KYC & due diligence">
            <ul className="space-y-3">
              {e.kyc.map((k) => (
                <li key={k.label} className="flex items-start gap-2.5">
                  {k.ok ? (
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
                  ) : (
                    <XCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
                  )}
                  <div>
                    <p className="text-xs font-medium">{k.label}</p>
                    <p className="text-[11px] text-muted-foreground">{k.value}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title="Consignment history" bodyClassName="p-0">
            <div className="divide-y divide-border">
              {shipments.map((s) => (
                <Link
                  key={s.id}
                  to="/export/shipments/$id"
                  params={{ id: s.id }}
                  className="flex items-center justify-between gap-3 px-5 py-3.5 hover:bg-secondary/60"
                >
                  <div>
                    <p className="text-sm font-medium">{s.reference}</p>
                    <p className="text-xs text-muted-foreground">
                      {s.mineral} · {s.quantity} · ETD {s.etd}
                    </p>
                  </div>
                  <ShipmentStatusPill status={s.status} />
                </Link>
              ))}
              {shipments.length === 0 && (
                <p className="px-5 py-8 text-center text-sm text-muted-foreground">
                  No consignments on file.
                </p>
              )}
            </div>
          </Panel>
        </div>

        <div className="space-y-4">
          <Panel title="Compliance score">
            <p className="font-display text-3xl font-semibold">{e.complianceScore}</p>
            <ScoreBar value={e.complianceScore} />
            <p className="mt-3 text-xs text-muted-foreground">
              Weighted from document quality, response times, non-conformity history and quantity
              accuracy over the last 12 months.
            </p>
          </Panel>
          <Panel title="Contact">
            <p className="text-sm font-medium">{e.contact}</p>
            <p className="text-xs text-muted-foreground">{e.email}</p>
            <p className="text-xs text-muted-foreground">{e.phone}</p>
            <p className="mt-3 text-xs text-muted-foreground">Minerals: {e.minerals.join(", ")}</p>
          </Panel>
          {user?.role === "operator" && (
            <Panel title="Verification actions">
              <div className="grid gap-2">
                <Button onClick={() => toast.success("Exporter verification approved")}>
                  Approve verification
                </Button>
                <Button variant="outline" onClick={() => toast.success("Additional evidence requested")}>
                  Request evidence
                </Button>
                <Button variant="outline" onClick={() => toast.success("Site visit scheduled")}>
                  Schedule site visit
                </Button>
                <Button
                  variant="outline"
                  className="text-destructive"
                  onClick={() => toast.error("Exporter suspended from new submissions")}
                >
                  Suspend exporter
                </Button>
              </div>
              <DisclaimerNote className="mt-4" />
            </Panel>
          )}
        </div>
      </div>
    </AppShell>
  );
}
