import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, XCircle } from "lucide-react";
import { AppShell } from "@/verticals/warehousing/app-shell";
import { Field, Panel, StatusPill, toneForStatus } from "@/verticals/warehousing/compliance-ui";
import { labelStatus } from "@/verticals/warehousing/data";
import { useDemo } from "@/verticals/warehousing/store";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { WAREHOUSING_DOMAIN_LABELS, type WarehousingDomainStatus } from "@/lib/api/warehousing";

export const Route = createFileRoute("/warehousing/partner/applications/$id")({
  head: () => ({
    meta: [
      { title: "Application Review | Beldium Compliance Partner" },
      { name: "description", content: "Warehouse admission application: domain review, evidence and decision." },
    ],
  }),
  component: ApplicationDetail,
});

function ApplicationDetail() {
  const { id } = Route.useParams();
  const { state, reviewSection, decide, reviewDocument, createApplication, roleId } = useDemo();
  const w = state.warehouses.find((x) => x.id === id);
  const application = state.applications.find((a) => a.warehouse === id);
  const [note, setNote] = useState("");

  if (!w)
    return (
      <AppShell role="partner" title="Warehouse not found">
        <Panel title="Not found">
          <Button asChild>
            <Link to="/warehousing/partner/applications">Back to applications</Link>
          </Button>
        </Panel>
      </AppShell>
    );

  const documents = state.documents.filter((d) => d.application === application?.id);

  const setSectionVerdict = (key: string, status: WarehousingDomainStatus) => {
    if (!application) return;
    const score = status === "passed" ? 100 : status === "attention" ? 60 : 0;
    reviewSection(application.id, key as never, { status, score, notes: note || "Reviewed by partner." });
    toast.success(`${WAREHOUSING_DOMAIN_LABELS[key as keyof typeof WAREHOUSING_DOMAIN_LABELS]}: ${status}`);
  };

  return (
    <AppShell
      role="partner"
      title={w.name}
      subtitle={`${w.reference} · ${w.registration_number}`}
      actions={<StatusPill tone={toneForStatus(application?.status ?? "not_started")}>{labelStatus(application?.status ?? "not_started")}</StatusPill>}
    >
      <div className="grid gap-6 xl:grid-cols-[1.6fr_0.7fr]">
        <div className="space-y-6">
          {!application && (
            <Panel title="No admission application yet">
              <p className="text-sm text-muted-foreground">This warehouse has not started an admission application.</p>
              <Button className="mt-3" onClick={() => void createApplication(w.id)}>
                Start application
              </Button>
            </Panel>
          )}

          {application && (
            <Panel title="Domain review" description="Score each domain from the evidence submitted.">
              <div className="mb-4">
                <Progress value={application.progress.percent} />
                <p className="mt-1 text-xs text-muted-foreground">
                  {application.progress.complete}/{application.progress.total} domains complete
                </p>
              </div>
              <div className="space-y-3">
                {application.sections.map((s) => (
                  <div key={s.key} className="rounded-xl border border-border/70 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-foreground">{WAREHOUSING_DOMAIN_LABELS[s.key]}</p>
                        <p className="text-xs text-muted-foreground">Score {s.score} · {s.review_notes || "No notes yet"}</p>
                      </div>
                      <StatusPill tone={toneForStatus(s.status)}>{s.status}</StatusPill>
                    </div>
                    {roleId === "partner" && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button size="sm" variant="outline" onClick={() => setSectionVerdict(s.key, "passed")}>
                          <CheckCircle2 className="size-3.5" /> Pass
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setSectionVerdict(s.key, "attention")}>
                          Attention
                        </Button>
                        <Button size="sm" variant="outline" className="text-destructive" onClick={() => setSectionVerdict(s.key, "failed")}>
                          <XCircle className="size-3.5" /> Fail
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Panel>
          )}

          {application && (
            <Panel title="Evidence" description="Documents uploaded against this application.">
              <div className="space-y-2">
                {documents.map((d) => (
                  <div key={d.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/70 p-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">{d.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {WAREHOUSING_DOMAIN_LABELS[d.domain]} · {d.issuer || "-"} · expires {d.expires_on ?? "-"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusPill tone={toneForStatus(d.status)}>{d.status}</StatusPill>
                      {roleId === "partner" && d.status === "pending" && (
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline" onClick={() => reviewDocument(d.id, "verified", "Verified by partner.")}>
                            Verify
                          </Button>
                          <Button size="sm" variant="outline" className="text-destructive" onClick={() => reviewDocument(d.id, "rejected", "Rejected by partner.")}>
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {documents.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">No evidence uploaded.</p>}
              </div>
            </Panel>
          )}
        </div>

        <div className="space-y-6">
          <Panel title="Warehouse profile">
            <div className="grid gap-3">
              <Field label="Contact" value={w.contact_name} />
              <Field label="Email" value={w.contact_email} />
              <Field label="Phone" value={w.contact_phone} />
              <Field label="Services" value={w.services.join(", ") || "-"} />
              <Field label="Storage categories" value={w.storage_categories.join(", ") || "-"} />
            </div>
          </Panel>

          {application && (
            <Panel title="Compliance score">
              <p className="font-heading text-3xl font-semibold text-primary">{application.risk.compliance_score}</p>
              <p className="mt-1 text-xs text-muted-foreground">Risk band: {application.risk.risk_band}</p>
            </Panel>
          )}

          {application && roleId === "partner" && (
            <Panel title="Decision">
              <Textarea placeholder="Rationale" value={note} onChange={(e) => setNote(e.target.value)} rows={3} />
              <div className="mt-3 grid gap-2">
                <Button
                  onClick={() => {
                    decide(application.id, { status: "approved", rationale: note || "Approved." });
                    toast.success("Application approved");
                  }}
                >
                  Approve
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
                  Reject
                </Button>
              </div>
            </Panel>
          )}
        </div>
      </div>
    </AppShell>
  );
}
