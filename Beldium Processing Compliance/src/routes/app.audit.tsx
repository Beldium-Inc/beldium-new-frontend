import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { History, Search } from "lucide-react";
import { Panel, PageHeader, Pill } from "@/components/bpc";
import { useAppState } from "@/lib/app-state";

export const Route = createFileRoute("/app/audit")({
  head: () => ({
    meta: [
      { title: "Audit trail · Beldium Processing Compliance" },
      {
        name: "description",
        content:
          "Chronological record of review actions, decisions, inspections and platform events across the compliance system.",
      },
      { property: "og:title", content: "Audit trail · Beldium Processing Compliance" },
      {
        property: "og:description",
        content: "Chronological compliance audit history with actor, action and target.",
      },
    ],
  }),
  component: AuditPage,
});

function AuditPage() {
  const { audit, user } = useAppState();
  const [q, setQ] = React.useState("");
  const rows = audit.filter((e) =>
    `${e.action} ${e.target} ${e.actor} ${e.detail}`.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <>
      <PageHeader
        eyebrow={user?.role === "operator" ? "Compliance operations" : "Regulatory oversight"}
        title={user?.role === "operator" ? "Audit trail" : "Audit history"}
        description="Every verification, information request, non-conformity, inspection and decision is written to an append-only record with actor and timestamp."
      />

      <Panel>
        <div className="border-b border-border px-5 py-4">
          <div className="relative max-w-md">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Filter by action, actor, application or reference"
              className="w-full rounded-xl border border-border bg-muted/50 py-2 pr-3 pl-9 text-sm outline-none focus:border-ring"
            />
          </div>
        </div>

        <div className="px-5 py-5">
          {rows.map((e, i) => (
            <div key={e.id} className="flex gap-4 pb-6">
              <div className="flex flex-col items-center">
                <span className="mt-1.5 flex size-7 items-center justify-center rounded-full bg-accent text-primary">
                  <History className="size-3.5" />
                </span>
                {i < rows.length - 1 ? <span className="mt-1 w-px flex-1 bg-border" /> : null}
              </div>
              <div className="min-w-0 flex-1 rounded-2xl border border-border px-4 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium">{e.action}</p>
                  <Pill tone="info">{e.target}</Pill>
                  <span className="ml-auto text-[11px] text-muted-foreground">{e.at}</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{e.detail}</p>
                <p className="mt-1.5 text-[11px] text-muted-foreground">
                  {e.actor} · {e.role} · event {e.id}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </>
  );
}
