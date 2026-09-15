import { createFileRoute } from "@tanstack/react-router";
import { Paperclip } from "lucide-react";
import { useState } from "react";

import { PageHeader } from "@/components/miner-shell";
import { StatusChip, complianceTone, prettify } from "@/components/status-chip";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useMiner } from "@/lib/miner-store";

const title = "Information requests — Beldium Miner Hub";
const description = "Respond to reviewer information requests with notes and supporting evidence.";

export const Route = createFileRoute("/portal/requests")({
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
  component: RequestsPage,
});

function RequestsPage() {
  const { state, answerRequest } = useMiner();
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [files, setFiles] = useState<Record<string, string | null>>({});

  return (
    <>
      <PageHeader
        title="Information requests"
        description="Each request must be answered before verification can progress. Attach evidence where asked."
      />

      <div className="space-y-4">
        {state.informationRequests.map((r) => (
          <article key={r.id} className="rounded-md border border-border bg-card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-medium text-card-foreground">{r.subject}</h2>
                  <StatusChip tone={complianceTone(r.status)}>{prettify(r.status)}</StatusChip>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {r.reference} · raised by {r.raisedBy} on {r.raisedAt} · due {r.dueAt}
                </p>
              </div>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">{r.detail}</p>

            {r.responses.length ? (
              <ul className="mt-4 space-y-2 border-t border-border pt-4">
                {r.responses.map((res) => (
                  <li key={res.id} className="rounded-sm bg-muted/50 p-3 text-sm">
                    <div className="text-card-foreground">{res.note}</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {res.at}
                      {res.fileName ? ` · ${res.fileName}` : ""}
                    </div>
                  </li>
                ))}
              </ul>
            ) : null}

            {r.status === "open" ? (
              <div className="mt-4 space-y-3 border-t border-border pt-4">
                <Textarea
                  rows={3}
                  placeholder="Describe the evidence you are providing…"
                  value={notes[r.id] ?? ""}
                  onChange={(e) => setNotes((n) => ({ ...n, [r.id]: e.target.value }))}
                />
                <div className="flex flex-wrap items-center gap-3">
                  <label className="inline-flex">
                    <input
                      type="file"
                      className="hidden"
                      onChange={(e) => setFiles((f) => ({ ...f, [r.id]: e.target.files?.[0]?.name ?? null }))}
                    />
                    <span className="inline-flex cursor-pointer items-center rounded-full border border-input bg-background px-3 py-1.5 text-sm hover:bg-muted">
                      <Paperclip className="mr-1.5 h-3.5 w-3.5" />
                      {files[r.id] ?? "Attach evidence"}
                    </span>
                  </label>
                  <Button
                    size="sm"
                    disabled={!(notes[r.id] ?? "").trim()}
                    onClick={() => answerRequest(r.id, notes[r.id] ?? "", files[r.id] ?? null)}
                  >
                    Submit response
                  </Button>
                </div>
              </div>
            ) : null}
          </article>
        ))}
        {state.informationRequests.length === 0 ? (
          <p className="rounded-md border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            No information requests. Nothing is waiting on you.
          </p>
        ) : null}
      </div>
    </>
  );
}
