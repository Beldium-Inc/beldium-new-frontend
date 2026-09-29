import { createFileRoute } from "@tanstack/react-router";
import { Paperclip, Upload, X } from "lucide-react";
import { useState } from "react";

import { PageHeader } from "@/components/miner-shell";
import { StatusChip } from "@/components/status-chip";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ApiError } from "@/lib/api/errors";
import type { InfoRequest } from "@/lib/api/mining";
import { useInfoRequests, useRespondToInfoRequest } from "@/lib/api/mining-queries";

const title = "Information requests - Beldium Miner Hub";
const description = "Respond to reviewer information requests.";

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
  const infoRequestsQuery = useInfoRequests();
  const respond = useRespondToInfoRequest();
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [files, setFiles] = useState<Record<string, File[]>>({});

  const [failed, setFailed] = useState<Record<string, string>>({});

  const submit = (id: string) => {
    setFailed((f) => ({ ...f, [id]: "" }));
    respond.mutate(
      { id, message: (notes[id] ?? "").trim(), files: files[id] ?? [] },
      {
        onSuccess: () => {
          setNotes((n) => ({ ...n, [id]: "" }));
          setFiles((f) => ({ ...f, [id]: [] }));
        },
        onError: (err) =>
          setFailed((f) => ({
            ...f,
            [id]:
              err instanceof ApiError
                ? err.message
                : "Could not send your response. Please try again.",
          })),
      },
    );
  };

  const requests: InfoRequest[] = Array.isArray(infoRequestsQuery.data)
    ? infoRequestsQuery.data
    : (infoRequestsQuery.data?.results ?? []);

  return (
    <>
      <PageHeader
        title="Information requests"
        description="Each request must be answered before verification can progress."
      />

      <div className="space-y-4">
        {requests.map((r) => (
          <article key={r.id} className="rounded-md border border-border bg-card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-medium text-card-foreground">{r.subject}</h2>
                  <StatusChip
                    tone={
                      r.status === "responded"
                        ? "success"
                        : r.status === "closed"
                          ? "neutral"
                          : "warning"
                    }
                  >
                    {r.status}
                  </StatusChip>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  raised by {r.requested_by_name} · {r.site_name} · due {r.due_by || "-"}
                </p>
              </div>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">{r.details}</p>

            {r.status !== "open" ? (
              <div className="mt-4 space-y-2 border-t border-border pt-4">
                <div className="space-y-2 rounded-sm bg-muted/50 p-3 text-sm">
                  {r.response_message ? (
                    <div className="text-card-foreground">{r.response_message}</div>
                  ) : null}
                  {r.response_documents?.length ? (
                    <ul className="space-y-1.5">
                      {r.response_documents.map((d) => (
                        <li
                          key={d.id}
                          className="flex flex-wrap items-center justify-between gap-2"
                        >
                          <span className="inline-flex min-w-0 items-center gap-1.5 text-card-foreground">
                            <Paperclip className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">{d.original_name || d.name}</span>
                          </span>
                          <StatusChip
                            tone={
                              d.status === "verified"
                                ? "success"
                                : d.status === "rejected"
                                  ? "danger"
                                  : "warning"
                            }
                          >
                            {d.status === "pending" ? "awaiting review" : d.status}
                          </StatusChip>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  <div className="text-xs text-muted-foreground">
                    {r.status === "closed"
                      ? "Accepted by the compliance desk"
                      : "Sent to the compliance desk for review"}
                    {r.response_at ? ` · ${new Date(r.response_at).toLocaleString()}` : ""}
                  </div>
                </div>
              </div>
            ) : null}

            {r.status === "open" ? (
              <div className="mt-4 space-y-3 border-t border-border pt-4">
                <Textarea
                  rows={3}
                  placeholder="Describe the evidence you are providing…"
                  value={notes[r.id] ?? ""}
                  onChange={(e) => setNotes((n) => ({ ...n, [r.id]: e.target.value }))}
                />
                <div className="space-y-2">
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-border px-3 py-2 text-sm text-muted-foreground hover:bg-muted/40">
                    <Upload className="h-4 w-4" />
                    Attach the requested document(s)
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx,.csv"
                      className="sr-only"
                      onChange={(e) => {
                        const picked = Array.from(e.target.files ?? []);
                        setFiles((f) => ({ ...f, [r.id]: [...(f[r.id] ?? []), ...picked] }));
                        e.target.value = "";
                      }}
                    />
                  </label>
                  {(files[r.id] ?? []).length ? (
                    <ul className="space-y-1">
                      {(files[r.id] ?? []).map((file, i) => (
                        <li
                          key={`${file.name}-${i}`}
                          className="flex items-center justify-between gap-2 text-sm"
                        >
                          <span className="inline-flex min-w-0 items-center gap-1.5">
                            <Paperclip className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">{file.name}</span>
                          </span>
                          <button
                            type="button"
                            aria-label={`Remove ${file.name}`}
                            className="text-muted-foreground hover:text-foreground"
                            onClick={() =>
                              setFiles((f) => ({
                                ...f,
                                [r.id]: (f[r.id] ?? []).filter((_, j) => j !== i),
                              }))
                            }
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
                <Button
                  size="sm"
                  disabled={
                    (!(notes[r.id] ?? "").trim() && !(files[r.id] ?? []).length) ||
                    respond.isPending
                  }
                  onClick={() => submit(r.id)}
                >
                  {respond.isPending ? "Sending…" : "Submit response"}
                </Button>
                {failed[r.id] ? <p className="text-sm text-destructive">{failed[r.id]}</p> : null}
              </div>
            ) : null}
          </article>
        ))}
        {requests.length === 0 ? (
          <p className="rounded-md border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            No information requests. Nothing is waiting on you.
          </p>
        ) : null}
      </div>
    </>
  );
}
