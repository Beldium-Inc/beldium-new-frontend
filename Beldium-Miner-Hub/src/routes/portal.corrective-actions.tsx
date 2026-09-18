import { createFileRoute } from "@tanstack/react-router";
import { Paperclip } from "lucide-react";
import { useState } from "react";

import { PageHeader, StatCard } from "@/components/miner-shell";
import { StatusChip } from "@/components/status-chip";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useMineSites, useNonConformities, useSubmitCorrectiveEvidence } from "@/lib/api/mining-queries";
import type { CorrectiveSubmission } from "@/lib/api/mining";

const title = "Corrective actions - Beldium Miner Hub";
const description = "Track findings, owners, due dates and submit evidence that closes corrective actions.";

export const Route = createFileRoute("/portal/corrective-actions")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ActionsPage,
});

function ActionsPage() {
  const nonConformitiesQuery = useNonConformities();
  const sitesQuery = useMineSites();
  const submitEvidence = useSubmitCorrectiveEvidence();
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [files, setFiles] = useState<Record<string, File | null>>({});

  const items = Array.isArray(nonConformitiesQuery.data)
    ? nonConformitiesQuery.data
    : (nonConformitiesQuery.data?.results ?? []);
  const sites = Array.isArray(sitesQuery.data) ? sitesQuery.data : (sitesQuery.data?.results ?? []);
  const siteName = (id: string) => sites.find((s) => s.id === id)?.name ?? "-";
  const count = (s: string) => items.filter((a) => a.status === s).length;

  return (
    <>
      <PageHeader
        title="Corrective actions"
        description="Non-conformities raised from inspections. Attach evidence to request closure."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Open" value={String(count("open"))} />
        <StatCard label="In progress" value={String(count("in_progress"))} />
        <StatCard label="Awaiting review" value={String(count("awaiting_review"))} />
        <StatCard label="Closed" value={String(count("closed"))} />
      </div>

      <div className="mt-6 space-y-4">
        {items.map((a) => (
          <article key={a.id} className="rounded-md border border-border bg-card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-medium text-card-foreground">{a.title}</h2>
                  <StatusChip tone={a.status === "closed" ? "success" : a.is_overdue ? "danger" : "warning"}>
                    {a.status.replace("_", " ")}
                  </StatusChip>
                  <StatusChip tone={a.severity === "critical" ? "danger" : a.severity === "major" ? "warning" : "info"}>
                    {a.severity} severity
                  </StatusChip>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {a.reference} · {siteName(a.site)} · owner {a.responsible_person || "-"} · due {a.deadline}
                </p>
              </div>
            </div>

            <p className="mt-3 text-sm text-muted-foreground">
              <span className="font-medium text-card-foreground">Required action: </span>
              {a.required_action}
            </p>

            {a.submissions.length ? (
              <ul className="mt-4 space-y-2 border-t border-border pt-4">
                {a.submissions.map((s: CorrectiveSubmission) => (
                  <li key={s.id} className="rounded-sm bg-muted/50 p-3 text-sm">
                    <div className="text-card-foreground">{s.message}</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {s.submitted_by_name} · {s.created_at}
                      {s.decision ? ` · ${s.decision.replace("_", " ")}` : ""}
                    </div>
                  </li>
                ))}
              </ul>
            ) : null}

            {a.status !== "closed" ? (
              <div className="mt-4 space-y-3 border-t border-border pt-4">
                <Textarea
                  rows={3}
                  placeholder="Describe the action taken and the evidence attached…"
                  value={notes[a.id] ?? ""}
                  onChange={(e) => setNotes((n) => ({ ...n, [a.id]: e.target.value }))}
                />
                <div className="flex flex-wrap items-center gap-3">
                  <label className="inline-flex">
                    <input
                      type="file"
                      className="hidden"
                      onChange={(e) => setFiles((f) => ({ ...f, [a.id]: e.target.files?.[0] ?? null }))}
                    />
                    <span className="inline-flex cursor-pointer items-center rounded-full border border-input bg-background px-3 py-1.5 text-sm hover:bg-muted">
                      <Paperclip className="mr-1.5 h-3.5 w-3.5" />
                      {files[a.id]?.name ?? "Attach evidence"}
                    </span>
                  </label>
                  <Button
                    size="sm"
                    disabled={!(notes[a.id] ?? "").trim() || submitEvidence.isPending}
                    onClick={() => {
                      const file = files[a.id];
                      submitEvidence.mutate(
                        { nonConformityId: a.id, message: notes[a.id] ?? "", ...(file ? { file } : {}) },
                        {
                          onSuccess: () => {
                            setNotes((n) => ({ ...n, [a.id]: "" }));
                            setFiles((f) => ({ ...f, [a.id]: null }));
                          },
                        },
                      );
                    }}
                  >
                    Submit evidence
                  </Button>
                </div>
              </div>
            ) : null}
          </article>
        ))}
        {items.length === 0 ? <p className="text-sm text-muted-foreground">No corrective actions.</p> : null}
      </div>
    </>
  );
}
