import { createFileRoute, Link } from "@tanstack/react-router";
import * as React from "react";
import { toast } from "sonner";
import { CheckCircle2, XCircle } from "lucide-react";
import { AppShell } from "@/verticals/export/AppShell";
import { useStore } from "@/verticals/export/store";
import { ApplicationStatusPill, DisclaimerNote, DocStatusPill, Panel, Pill, ScoreBar } from "@/verticals/export/ui-kit";
import { Button } from "@/components/ui/button";
import { EXPORT_DOMAIN_LABELS, type ExportDomainStatus } from "@/lib/api/export";

export const Route = createFileRoute("/export/exporters/$id")({
  head: () => ({
    meta: [
      { title: "Exporter Verification | Beldium Export Compliance" },
      {
        name: "description",
        content: "Exporter verification file: admission application, domain review and compliance score.",
      },
    ],
  }),
  component: ExporterDetail,
});

function ExporterDetail() {
  const { id } = Route.useParams();
  const { state, user, reviewSection, decide, reviewDocument, createApplication } = useStore();
  const e = state.exporters.find((x) => x.id === id);
  const application = state.applications.find((a) => a.exporter === id);
  const [note, setNote] = React.useState("");

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

  const shipments = state.shipments.filter((s) => s.exporter === e.id);
  const documents = state.documents.filter((d) => d.application === application?.id);

  const setSectionVerdict = (key: string, status: ExportDomainStatus) => {
    if (!application) return;
    const score = status === "passed" ? 100 : status === "attention" ? 60 : 0;
    reviewSection(application.id, key as never, { status, score, notes: note || "Reviewed by operator." });
    toast.success(`${EXPORT_DOMAIN_LABELS[key as keyof typeof EXPORT_DOMAIN_LABELS]}: ${status}`);
  };

  return (
    <AppShell
      title={e.name}
      subtitle={`${e.reference} · ${e.registration_number}`}
      actions={<ApplicationStatusPill status={application?.status ?? "not_started"} />}
    >
      <div className="grid gap-4 lg:grid-cols-[1.5fr_0.5fr]">
        <div className="space-y-4">
          {!application && (
            <Panel title="No admission application yet">
              <p className="text-sm text-muted-foreground">
                This exporter has not started an admission application.
              </p>
              {user?.role === "operator" && (
                <Button className="mt-3" onClick={() => void createApplication(e.id)}>
                  Start application
                </Button>
              )}
            </Panel>
          )}

          {application && (
            <Panel title="Domain review" bodyClassName="p-0">
              <div className="divide-y divide-border">
                {application.sections.map((s) => (
                  <div key={s.key} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5">
                    <div>
                      <p className="text-sm font-medium">{EXPORT_DOMAIN_LABELS[s.key]}</p>
                      <p className="text-xs text-muted-foreground">
                        Score {s.score} · {s.review_notes || "No notes yet"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Pill
                        tone={s.status === "passed" ? "success" : s.status === "failed" ? "danger" : s.status === "attention" ? "warning" : "neutral"}
                      >
                        {s.status}
                      </Pill>
                      {user?.role === "operator" && (
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline" onClick={() => setSectionVerdict(s.key, "passed")}>
                            Pass
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setSectionVerdict(s.key, "attention")}>
                            Attention
                          </Button>
                          <Button size="sm" variant="outline" className="text-destructive" onClick={() => setSectionVerdict(s.key, "failed")}>
                            Fail
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          )}

          {application && (
            <Panel title="Evidence" bodyClassName="p-0">
              <div className="divide-y divide-border">
                {documents.map((d) => (
                  <div key={d.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5">
                    <div>
                      <p className="text-sm font-medium">{d.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {EXPORT_DOMAIN_LABELS[d.domain]} · {d.issuer || "-"} · expires {d.expires_on ?? "-"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <DocStatusPill status={d.status} />
                      {user?.role === "operator" && d.status === "pending" && (
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline" onClick={() => reviewDocument(d.id, "verified", "Verified by operator.")}>
                            Verify
                          </Button>
                          <Button size="sm" variant="outline" className="text-destructive" onClick={() => reviewDocument(d.id, "rejected", "Rejected by operator.")}>
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {documents.length === 0 && (
                  <p className="px-5 py-8 text-center text-sm text-muted-foreground">No evidence uploaded.</p>
                )}
              </div>
            </Panel>
          )}

          <Panel title="Shipment history" bodyClassName="p-0">
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
                      {s.quantity} {s.unit} · ETD {s.expected_ship_date}
                    </p>
                  </div>
                  <Pill tone="neutral">{s.status}</Pill>
                </Link>
              ))}
              {shipments.length === 0 && (
                <p className="px-5 py-8 text-center text-sm text-muted-foreground">No shipments on file.</p>
              )}
            </div>
          </Panel>
        </div>

        <div className="space-y-4">
          {application && (
            <Panel title="Compliance score">
              <p className="font-display text-3xl font-semibold">{application.risk.compliance_score}</p>
              <ScoreBar value={application.risk.compliance_score} />
              <p className="mt-3 text-xs text-muted-foreground">Risk band: {application.risk.risk_band}</p>
            </Panel>
          )}
          <Panel title="Contact">
            <p className="text-sm font-medium">{e.contact_name}</p>
            <p className="text-xs text-muted-foreground">{e.contact_email}</p>
            <p className="text-xs text-muted-foreground">{e.contact_phone}</p>
            <p className="mt-3 text-xs text-muted-foreground">Destinations: {e.destinations.join(", ") || "-"}</p>
            <p className="text-xs text-muted-foreground">Products: {e.product_categories.join(", ") || "-"}</p>
          </Panel>
          {user?.role === "operator" && application && (
            <Panel title="Decision">
              <textarea
                className="w-full rounded-lg border border-border bg-background p-2 text-xs"
                rows={3}
                placeholder="Rationale"
                value={note}
                onChange={(ev) => setNote(ev.target.value)}
              />
              <div className="mt-2 grid gap-2">
                <Button
                  onClick={() => {
                    decide(application.id, { status: "approved", rationale: note || "Approved." });
                    toast.success("Application approved");
                  }}
                >
                  <CheckCircle2 className="size-4" /> Approve
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    decide(application.id, { status: "conditionally_approved", rationale: note || "Conditionally approved." });
                    toast.success("Conditionally approved");
                  }}
                >
                  Conditionally approve
                </Button>
                <Button
                  variant="outline"
                  className="text-destructive"
                  onClick={() => {
                    decide(application.id, { status: "rejected", rationale: note || "Rejected." });
                    toast.error("Application rejected");
                  }}
                >
                  <XCircle className="size-4" /> Reject
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
