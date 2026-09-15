import { createFileRoute, Link } from "@tanstack/react-router";
import * as React from "react";
import { AppShell } from "@/verticals/export/AppShell";
import { useStore } from "@/verticals/export/store";
import { DocStatusPill, Panel, Pill } from "@/verticals/export/ui-kit";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { EXPORT_DOMAIN_LABELS } from "@/lib/api/export";

export const Route = createFileRoute("/export/documents")({
  head: () => ({
    meta: [
      { title: "Document Register | Beldium Export Compliance" },
      {
        name: "description",
        content: "Every application document with issuer, reference, expiry and verification status.",
      },
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
      ? state.documents.filter((d) => d.application === state.applications.find((a) => a.exporter === user.exporterId)?.id)
      : state.documents;

  const rows = scoped
    .filter((d) => `${d.title} ${d.issuer} ${d.reference}`.toLowerCase().includes(q.toLowerCase()))
    .filter((d) => {
      if (filter === "all") return true;
      if (filter === "expiring") return d.validity === "expiring";
      if (filter === "verified") return d.status === "verified";
      if (filter === "rejected") return d.status === "rejected";
      return d.status === "pending";
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
          {rows.map((d) => {
            const application = state.applications.find((a) => a.id === d.application);
            const exporter = state.exporters.find((e) => e.id === application?.exporter);
            return (
              <Link
                key={d.id}
                to="/export/exporters/$id"
                params={{ id: exporter?.id ?? "" }}
                className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 hover:bg-secondary/60"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium">{d.title}</p>
                    <DocStatusPill status={d.status} />
                    {d.validity === "expiring" && <Pill tone="warning">Expires {d.expires_on}</Pill>}
                    {d.validity === "expired" && <Pill tone="danger">Expired {d.expires_on}</Pill>}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {exporter?.name} · {EXPORT_DOMAIN_LABELS[d.domain]} · {d.issuer || "-"} · ref {d.reference || "-"}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">Issued {d.issued_on ?? "-"}</p>
              </Link>
            );
          })}
          {rows.length === 0 && <p className="px-5 py-10 text-center text-sm text-muted-foreground">No documents match.</p>}
        </div>
      </Panel>
    </AppShell>
  );
}
