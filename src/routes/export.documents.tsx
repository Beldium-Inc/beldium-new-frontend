import { createFileRoute, Link } from "@tanstack/react-router";
import * as React from "react";
import { AppShell } from "@/verticals/export/AppShell";
import { useStore } from "@/verticals/export/store";
import { DocStatusPill, Panel, Pill } from "@/verticals/export/ui-kit";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/export/documents")({
  head: () => ({
    meta: [
      { title: "Document Register | Beldium Export Compliance" },
      {
        name: "description",
        content:
          "Every consignment document with issuer, reference, expiry and verification status across the Beldium compliance register.",
      },
      { property: "og:title", content: "Document Register | Beldium Export Compliance" },
      { property: "og:description", content: "Consignment documents with issuer, expiry and verification status." },
    ],
  }),
  component: DocumentsPage,
});

const FILTERS = ["all", "pending", "verified", "rejected", "expiring"] as const;

function DocumentsPage() {
  const { state, user } = useStore();
  const [q, setQ] = React.useState("");
  const [filter, setFilter] = React.useState<(typeof FILTERS)[number]>("all");

  const scoped =
    user?.role === "exporter"
      ? state.shipments.filter((s) => s.exporterId === user.exporterId)
      : state.shipments;

  const rows = scoped
    .flatMap((s) => s.documents.map((d) => ({ s, d })))
    .filter(({ s, d }) => `${d.name} ${d.issuer} ${d.reference} ${s.reference}`.toLowerCase().includes(q.toLowerCase()))
    .filter(({ d }) => {
      if (filter === "all") return true;
      if (filter === "expiring") return !!d.expires && d.expires !== "-" && d.expires < "2026-10-01";
      if (filter === "verified") return d.status === "verified";
      if (filter === "rejected") return d.status === "rejected" || d.status === "replacement_requested";
      return d.status === "pending" || d.status === "clarification_requested";
    });

  return (
    <AppShell title="Documents" subtitle={`${rows.length} document records`}>
      <Panel bodyClassName="p-0">
        <div className="flex flex-wrap items-center gap-2 border-b border-border px-5 py-3">
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search documents, issuers or references"
            className="h-9 max-w-sm"
          />
          <div className="flex flex-wrap gap-1.5">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium capitalize transition-colors",
                  filter === f ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground",
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
        <div className="divide-y divide-border">
          {rows.map(({ s, d }) => (
            <Link
              key={`${s.id}-${d.id}`}
              to="/export/shipments/$id"
              params={{ id: s.id }}
              className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 hover:bg-secondary/60"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium">{d.name}</p>
                  <DocStatusPill status={d.status} />
                  {d.expires && d.expires !== "-" && d.expires < "2026-10-01" && (
                    <Pill tone="warning">Expires {d.expires}</Pill>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {s.reference} · {d.category} · {d.issuer} · ref {d.reference}
                </p>
              </div>
              <p className="text-xs text-muted-foreground">Issued {d.issued}</p>
            </Link>
          ))}
          {rows.length === 0 && <p className="px-5 py-10 text-center text-sm text-muted-foreground">No documents match.</p>}
        </div>
      </Panel>
    </AppShell>
  );
}
