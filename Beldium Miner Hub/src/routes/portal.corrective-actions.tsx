import { createFileRoute } from "@tanstack/react-router";
import { Paperclip } from "lucide-react";
import { useState } from "react";

import { PageHeader, StatCard } from "@/components/miner-shell";
import { StatusChip, complianceTone, prettify } from "@/components/status-chip";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useMiner } from "@/lib/miner-store";

const title = "Corrective actions — Beldium Miner Hub";
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
  const { state, addActionEvidence, setActionStatus } = useMiner();
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [files, setFiles] = useState<Record<string, string | null>>({});
  const siteName = (id?: string) =>
    id ? (state.application.sites.find((s) => s.id === id)?.name ?? "—") : "Organisation-wide";
  const count = (s: string) => state.correctiveActions.filter((a) => a.status === s).length;

  return (
    <>
      <PageHeader
        title="Corrective actions"
        description="Actions raised from inspections and compliance findings. Attach evidence to request closure."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Open" value={String(count("open"))} />
        <StatCard label="In progress" value={String(count("in_progress"))} />
        <StatCard label="Evidence submitted" value={String(count("submitted"))} />
        <StatCard label="Closed" value={String(count("closed"))} />
      </div>

      <div className="mt-6 space-y-4">
        {state.correctiveActions.map((a) => (
          <article key={a.id} className="rounded-md border border-border bg-card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-medium text-card-foreground">{a.finding}</h2>
                  <StatusChip tone={complianceTone(a.status)}>{prettify(a.status)}</StatusChip>
                  <StatusChip tone={a.severity === "high" ? "danger" : a.severity === "medium" ? "warning" : "info"}>
                    {prettify(a.severity)} severity
                  </StatusChip>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {a.reference} · {siteName(a.siteId)} · owner {a.owner} · due {a.dueAt}
                </p>
              </div>
              {a.status !== "closed" && a.status !== "submitted" ? (
                <Button size="sm" variant="outline" onClick={() => setActionStatus(a.id, "in_progress")}>
                  Mark in progress
                </Button>
              ) : null}
            </div>

            <p className="mt-3 text-sm text-muted-foreground">
              <span className="font-medium text-card-foreground">Required action: </span>
              {a.requiredAction}
            </p>

            {a.evidence.length ? (
              <ul className="mt-4 space-y-2 border-t border-border pt-4">
                {a.evidence.map((e) => (
                  <li key={e.id} className="rounded-sm bg-muted/50 p-3 text-sm">
                    <div className="text-card-foreground">{e.note}</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {e.at}
                      {e.fileName ? ` · ${e.fileName}` : ""}
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
                      onChange={(e) => setFiles((f) => ({ ...f, [a.id]: e.target.files?.[0]?.name ?? null }))}
                    />
                    <span className="inline-flex cursor-pointer items-center rounded-full border border-input bg-background px-3 py-1.5 text-sm hover:bg-muted">
                      <Paperclip className="mr-1.5 h-3.5 w-3.5" />
                      {files[a.id] ?? "Attach evidence"}
                    </span>
                  </label>
                  <Button
                    size="sm"
                    disabled={!(notes[a.id] ?? "").trim()}
                    onClick={() => addActionEvidence(a.id, notes[a.id] ?? "", files[a.id] ?? null)}
                  >
                    Submit evidence
                  </Button>
                </div>
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </>
  );
}
