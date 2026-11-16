import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { BookOpen } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAskGovernanceCopilot, type GovernanceCopilotAnswer } from "@/lib/api";
import { PageHeader, Panel, errorMessage, humanise } from "@/verticals/governance/ui";

export const Route = createFileRoute("/governance/copilot")({ component: Copilot });

const PROMPTS = [
  "Which risks are escalated in mining?",
  "What do we hold on export licensing?",
  "Show controls for custody ledger cybersecurity",
  "Which findings involve data protection?",
];

function Copilot() {
  const ask = useAskGovernanceCopilot();
  const [messages, setMessages] = useState<
    ({ q: string } & ({ a: GovernanceCopilotAnswer } | { error: string }))[]
  >([]);
  const [question, setQuestion] = useState("");

  const send = (text: string) => {
    const q = text.trim();
    if (!q || ask.isPending) return;
    setQuestion("");
    ask.mutate(q, {
      onSuccess: (a) => setMessages((m) => [...m, { q, a }]),
      onError: (e) => setMessages((m) => [...m, { q, error: errorMessage(e) }]),
    });
  };

  return (
    <>
      <PageHeader
        title="Governance Copilot"
        desc="Answers are assembled only from records in the governance register you are cleared to read, each one cited. Review before relying on any answer."
      />
      <Panel>
        <div className="min-h-72 space-y-4">
          {messages.length === 0 && (
            <div className="grid gap-2 md:grid-cols-2">
              {PROMPTS.map((p) => (
                <button
                  key={p}
                  onClick={() => send(p)}
                  className="rounded-lg border p-3 text-left text-sm hover:border-primary/40 hover:bg-accent"
                >
                  {p}
                </button>
              ))}
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className="space-y-2">
              <div className="ml-auto w-fit max-w-xl rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground">
                {m.q}
              </div>
              <div className="max-w-2xl rounded-lg border bg-muted/50 p-4 text-sm">
                {"error" in m ? (
                  <p className="text-destructive">{m.error}</p>
                ) : (
                  <>
                    <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-warning">
                      <BookOpen className="h-3.5 w-3.5" /> Drawn from the register · requires human
                      review
                    </div>
                    {m.a.citations.length === 0 ? (
                      <p>{m.a.answer}</p>
                    ) : (
                      <>
                        <p>
                          {m.a.citations.length === 1
                            ? "1 record matches this question:"
                            : `${m.a.citations.length} records match this question:`}
                        </p>
                        <ul className="mt-2 space-y-2">
                          {m.a.citations.map((c) => (
                            <li
                              key={`${c.kind}-${c.id}`}
                              className="rounded-md border bg-card p-2.5"
                            >
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="rounded bg-accent px-1.5 py-0.5 text-[10px] font-medium text-accent-foreground uppercase">
                                  {humanise(c.kind)}
                                </span>
                                <span className="font-mono text-xs text-muted-foreground">
                                  {c.reference}
                                </span>
                                <span className="font-medium">{c.title}</span>
                              </div>
                              <p className="mt-1 text-xs text-muted-foreground">{c.detail}</p>
                            </li>
                          ))}
                        </ul>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
          {ask.isPending && (
            <p className="text-sm text-muted-foreground">Searching the register…</p>
          )}
        </div>
        <form
          className="mt-4 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            send(question);
          }}
        >
          <Textarea
            rows={2}
            value={question}
            maxLength={1000}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(question);
              }
            }}
            placeholder="Ask about policies, risks, regulations, stakeholders or documents…"
            aria-label="Question"
          />
          <Button type="submit" disabled={ask.isPending || !question.trim()}>
            Send
          </Button>
        </form>
      </Panel>
    </>
  );
}
