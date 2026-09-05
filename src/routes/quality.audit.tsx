import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/verticals/quality/shell";
import { EmptyState, PageHeader, Pill, SectionTitle, Stat, Surface } from "@/verticals/quality/ui";
import { useBeldium } from "@/verticals/quality/store";
import { roleMeta } from "@/verticals/quality/data";

export const Route = createFileRoute("/quality/audit")({
  head: () => ({
    meta: [
      { title: "Audit trail | Beldium Quality & Control" },
      {
        name: "description",
        content:
          "Append-only record of every verification decision, document status change, custody event and certificate action across the platform.",
      },
      { property: "og:title", content: "Audit trail | Beldium Quality & Control" },
      {
        property: "og:description",
        content: "Append-only record of decisions, custody events and certificate actions.",
      },
    ],
  }),
  component: () => (
    <AppShell>
      <AuditPage />
    </AppShell>
  ),
});

function AuditPage() {
  const { state } = useBeldium();
  const [q, setQ] = React.useState("");

  const entries = [
    ...state.applications.flatMap((a) => a.audit.map((e) => ({ ...e, ctx: a.ref, kind: "Application" }))),
    ...state.samples.flatMap((s) => s.audit.map((e) => ({ ...e, ctx: s.ref, kind: "Sample" }))),
  ]
    .filter((e) =>
      q.trim() === ""
        ? true
        : `${e.actor} ${e.action} ${e.detail} ${e.ctx}`.toLowerCase().includes(q.toLowerCase()),
    )
    .sort((a, b) => (a.at < b.at ? 1 : -1));

  return (
    <>
      <PageHeader
        eyebrow="Evidence"
        title="Audit trail"
        description="Nothing in Beldium is edited in place. Every action appends a new, attributable entry, the record a regulator can rely on years later."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Total entries" value={entries.length} />
        <Stat label="Application events" value={entries.filter((e) => e.kind === "Application").length} tone="pale" />
        <Stat label="Sample events" value={entries.filter((e) => e.kind === "Sample").length} />
        <Stat label="Distinct actors" value={new Set(entries.map((e) => e.actor)).size} />
      </div>

      <Surface className="mt-6">
        <SectionTitle
          title="Event log"
          hint="Newest first"
          action={
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Filter by actor, action or reference"
              className="w-72 rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-link"
            />
          }
        />
        <div className="divide-y divide-border">
          {entries.length === 0 ? (
            <EmptyState title="No matching events" />
          ) : (
            entries.map((e, i) => (
              <div key={`${e.id}-${i}`} className="flex flex-wrap items-start justify-between gap-3 px-6 py-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-navy">{e.action}</p>
                    <Pill tone="info">{e.kind}</Pill>
                    <Pill tone="neutral">{roleMeta[e.role].label}</Pill>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {e.ctx} · {e.detail}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-navy">{e.actor}</p>
                  <p className="text-xs text-muted-foreground">{e.at}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </Surface>
    </>
  );
}
