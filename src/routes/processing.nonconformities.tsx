import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, Eye, FileText, X } from "lucide-react";
import { Panel, PageHeader, Pill, statusTone, RegisterState } from "@/verticals/processing/bpc";
import { useAppState } from "@/verticals/processing/store";
import { sectionLabel } from "@/verticals/processing/domain";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/processing/nonconformities")({
  head: () => ({
    meta: [
      { title: "Non-conformities · Beldium Processing Compliance" },
      {
        name: "description",
        content:
          "Non-conformity register with severity, corrective-action due dates and submitted evidence.",
      },
      { property: "og:title", content: "Non-conformities · Beldium Processing Compliance" },
      {
        property: "og:description",
        content: "Non-conformity register and corrective-action tracking.",
      },
    ],
  }),
  component: NCPage,
});

function NCPage() {
  const { nonConformities, closeNonConformity, capabilities, isLoading, error } = useAppState();
  // The API is the authority on who may close a finding; the dashboard role
  // stored in the browser is only a view preference.
  const readOnly = !capabilities?.can_decide;
  const [filter, setFilter] = React.useState<"All" | "Open" | "Evidence Submitted" | "Closed">(
    "All",
  );
  const [open, setOpen] = React.useState<string | null>(null);

  const rows = nonConformities.filter((n) => filter === "All" || n.status === filter);
  const active = nonConformities.find((n) => n.id === open);

  return (
    <>
      <PageHeader
        eyebrow={readOnly ? "Regulatory oversight" : "Compliance operations"}
        title="Non-conformity register"
        description={
          readOnly
            ? "Read-only view of findings raised by the Beldium compliance partner across registered processors."
            : "Findings raised during review and inspection, with corrective-action deadlines and evidence assessment."
        }
      />

      <Panel>
        <div className="flex flex-wrap gap-1.5 border-b border-border px-5 py-4">
          {(["All", "Open", "Evidence Submitted", "Closed"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-medium",
                filter === f
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border hover:bg-accent",
              )}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="divide-y divide-border">
          {rows.map((n) => (
            <div key={n.id} className="px-5 py-4">
              <div className="flex flex-wrap items-center gap-2">
                <AlertTriangle className="size-4 text-warning-foreground" />
                <p className="text-sm font-semibold">{n.id}</p>
                <Pill tone={statusTone(n.severity)}>{n.severity}</Pill>
                <Pill tone={statusTone(n.status)}>{n.status}</Pill>
                <span className="ml-auto text-[11px] text-muted-foreground">
                  raised {n.raised} · due {n.due}
                </span>
              </div>
              <p className="mt-1.5 text-sm font-medium">{n.title}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{n.detail}</p>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                <span>{n.company}</span>
                <span>·</span>
                <span>{sectionLabel(n.section)}</span>
                <span>·</span>
                {n.applicationId ? (
                  <Link
                    to="/processing/applications/$id"
                    params={{ id: n.applicationId }}
                    className="text-primary hover:underline"
                  >
                    {n.applicationId}
                  </Link>
                ) : (
                  <span>Raised against the register</span>
                )}
                {n.evidence ? (
                  <button
                    onClick={() => setOpen(n.id)}
                    className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 font-medium text-foreground hover:bg-accent"
                  >
                    <Eye className="size-3" /> View evidence
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </Panel>

      {active ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-primary/45 backdrop-blur-sm"
            onClick={() => setOpen(null)}
          />
          <div className="relative w-full max-w-xl rounded-3xl border border-border bg-card p-6 shadow-[0_30px_80px_-30px_rgba(16,30,61,0.7)]">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold">Corrective-action evidence</h3>
                <p className="text-xs text-muted-foreground">
                  {active.id} · {active.company}
                </p>
              </div>
              <button onClick={() => setOpen(null)} className="rounded-lg p-1 hover:bg-accent">
                <X className="size-4" />
              </button>
            </div>
            <div className="rounded-2xl border border-border p-4">
              <div className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-xl bg-muted">
                  <FileText className="size-4 text-primary" />
                </span>
                <div>
                  <p className="text-xs font-medium">{active.evidence?.name}</p>
                  <p className="text-[11px] text-muted-foreground">
                    Submitted {active.evidence?.submitted}
                  </p>
                </div>
              </div>
              <p className="mt-3 text-[11px] text-muted-foreground">{active.evidence?.note}</p>
            </div>
            {readOnly ? (
              <p className="mt-4 rounded-xl bg-secondary/50 px-3 py-2 text-[11px] text-secondary-foreground">
                Oversight role: evidence is visible for monitoring purposes. Acceptance decisions
                rest with the Beldium compliance partner.
              </p>
            ) : (
              <div className="mt-4 flex justify-end gap-2">
                <button
                  onClick={() => {
                    void closeNonConformity(active.id, false, "Evidence deemed insufficient.");
                    setOpen(null);
                  }}
                  className="rounded-xl border border-destructive/50 bg-destructive/15 px-4 py-2 text-xs font-medium text-destructive-foreground"
                >
                  Insufficient
                </button>
                <button
                  onClick={() => {
                    void closeNonConformity(active.id, true, "Corrective action accepted.");
                    setOpen(null);
                  }}
                  className="rounded-xl bg-primary px-4 py-2 text-xs font-medium text-primary-foreground"
                >
                  Accept and close
                </button>
              </div>
            )}
            {rows.length === 0 ? (
              <RegisterState
                isLoading={isLoading}
                error={error}
                empty={{
                  title: "No findings on the register",
                  body: "Non-conformities raised during review or inspection appear here.",
                }}
              />
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
