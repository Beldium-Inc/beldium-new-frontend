import { createFileRoute } from "@tanstack/react-router";
import * as React from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/lib/api/errors";
import { useMiner } from "@/verticals/miner/store";
import { PageHeader, Panel, EmptyState } from "@/verticals/miner/components/primitives";
import { Chip, StatusChip } from "@/verticals/miner/components/chips";

export const Route = createFileRoute("/miner/actions")({ component: ActionsPage });

function ActionsPage() {
  const { nonConformities, infoRequests, addActionEvidence, answerInfoRequest } = useMiner();
  const openNc = nonConformities.filter((n) => n.status !== "Closed");
  const openIr = infoRequests.filter((r) => r.status === "Open");

  const [messages, setMessages] = React.useState<Record<string, string>>({});
  const [files, setFiles] = React.useState<Record<string, File | null>>({});
  const [busy, setBusy] = React.useState<string | null>(null);

  const submitNc = async (id: string) => {
    const message = messages[id]?.trim();
    if (!message) {
      toast.error("Describe the corrective action taken.");
      return;
    }
    setBusy(id);
    try {
      await addActionEvidence(id, message, files[id] ?? undefined);
      toast.success("Corrective action submitted for review.");
      setMessages((m) => ({ ...m, [id]: "" }));
      setFiles((f) => ({ ...f, [id]: null }));
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not submit.");
    } finally {
      setBusy(null);
    }
  };

  const submitIr = async (id: string) => {
    const message = messages[id]?.trim();
    if (!message) {
      toast.error("Enter your response.");
      return;
    }
    setBusy(id);
    try {
      await answerInfoRequest(id, message);
      toast.success("Response sent.");
      setMessages((m) => ({ ...m, [id]: "" }));
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not send response.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      <PageHeader
        title="Corrective Actions"
        description="Respond to non-conformities and information requests raised against your organisation."
      />

      <div className="space-y-5">
        <Panel title="Non-conformities" description="Submit evidence of the corrective action taken.">
          {openNc.length === 0 ? (
            <EmptyState title="Nothing open" />
          ) : (
            <ul className="space-y-4">
              {openNc.map((n) => (
                <li key={n.id} className="rounded-md border border-border p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-mono text-xs text-muted-foreground">{n.ref}</span>
                    <div className="flex items-center gap-2">
                      <StatusChip value={n.severity} />
                      <StatusChip value={n.status} />
                    </div>
                  </div>
                  <p className="mt-1 text-sm font-medium">{n.title}</p>
                  <p className="text-xs text-muted-foreground">Required action: {n.requiredAction || "—"}</p>
                  <p className="text-xs text-muted-foreground">Due {n.deadline}</p>

                  {n.submissions.length > 0 && (
                    <ul className="mt-3 space-y-2 border-t border-border pt-3">
                      {n.submissions.map((s) => (
                        <li key={s.id} className="text-xs">
                          <span className="font-medium">{s.by}</span> — {s.message}
                          {s.decision && (
                            <Chip tone={s.decision === "Accepted" ? "success" : "danger"} className="ml-2">
                              {s.decision}
                            </Chip>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}

                  <div className="mt-3 space-y-2">
                    <Textarea
                      placeholder="Describe the corrective action taken…"
                      value={messages[n.id] ?? ""}
                      onChange={(e) => setMessages((m) => ({ ...m, [n.id]: e.target.value }))}
                    />
                    <Input
                      type="file"
                      onChange={(e) => setFiles((f) => ({ ...f, [n.id]: e.target.files?.[0] ?? null }))}
                    />
                    <Button size="sm" onClick={() => void submitNc(n.id)} disabled={busy === n.id}>
                      {busy === n.id ? "Submitting…" : "Submit evidence"}
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Information requests" description="Reply to outstanding information requests.">
          {openIr.length === 0 ? (
            <EmptyState title="Nothing open" />
          ) : (
            <ul className="space-y-4">
              {openIr.map((r) => (
                <li key={r.id} className="rounded-md border border-border p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Chip tone="info">Information request</Chip>
                    <StatusChip value={r.priority} />
                  </div>
                  <p className="mt-1 text-sm font-medium">{r.subject}</p>
                  <p className="text-xs text-muted-foreground">{r.details}</p>
                  <p className="text-xs text-muted-foreground">Due {r.dueBy}</p>
                  <div className="mt-3 space-y-2">
                    <Textarea
                      placeholder="Your response…"
                      value={messages[r.id] ?? ""}
                      onChange={(e) => setMessages((m) => ({ ...m, [r.id]: e.target.value }))}
                    />
                    <Button size="sm" onClick={() => void submitIr(r.id)} disabled={busy === r.id}>
                      {busy === r.id ? "Sending…" : "Send response"}
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}
