import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { PageHeader } from "@/components/miner-shell";
import { StatusChip } from "@/components/status-chip";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useInfoRequests, useRespondToInfoRequest } from "@/lib/api/mining-queries";

const title = "Information requests — Beldium Miner Hub";
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

  const requests = Array.isArray(infoRequestsQuery.data) ? infoRequestsQuery.data : (infoRequestsQuery.data?.results ?? []);

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
                  <StatusChip tone={r.status === "responded" ? "success" : r.status === "closed" ? "neutral" : "warning"}>
                    {r.status}
                  </StatusChip>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  raised by {r.requested_by_name} · {r.site_name} · due {r.due_by || "—"}
                </p>
              </div>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">{r.details}</p>

            {r.response_message ? (
              <div className="mt-4 space-y-2 border-t border-border pt-4">
                <div className="rounded-sm bg-muted/50 p-3 text-sm">
                  <div className="text-card-foreground">{r.response_message}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{r.response_at}</div>
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
                <Button
                  size="sm"
                  disabled={!(notes[r.id] ?? "").trim() || respond.isPending}
                  onClick={() =>
                    respond.mutate(
                      { id: r.id, message: notes[r.id] ?? "" },
                      { onSuccess: () => setNotes((n) => ({ ...n, [r.id]: "" })) },
                    )
                  }
                >
                  Submit response
                </Button>
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
