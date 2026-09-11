import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { FileText, MessageSquareWarning } from "lucide-react";
import { AppShell } from "@/verticals/logistics/AppShell";
import { PageHeader, Panel, Pill } from "@/verticals/logistics/bits";
import { useApp } from "@/verticals/logistics/store";
import { RequestInfoModal } from "./logistics.operator.applications.$companyId";

export const Route = createFileRoute("/logistics/operator/requests")({
  head: () => ({
    meta: [
      { title: "Information requests | Beldium Compliance Operations" },
      { name: "description", content: "Track outstanding information requests raised against logistics partners." },
      { property: "og:title", content: "Information requests | Beldium Compliance Operations" },
      { property: "og:description", content: "Open, responded and closed compliance information requests." },
    ],
  }),
  component: RequestsPage,
});

function RequestsPage() {
  const { requests, companies } = useApp();
  const [query, setQuery] = React.useState("");
  const [status, setStatus] = React.useState("All");
  const [open, setOpen] = React.useState(false);

  const rows = requests.filter(
    (r) =>
      (status === "All" || r.status === status) &&
      (r.company.toLowerCase().includes(query.toLowerCase()) || r.reason.toLowerCase().includes(query.toLowerCase())),
  );

  return (
    <AppShell
      role="operator"
      breadcrumbs={[{ label: "Compliance Operations", to: "/logistics/operator" }, { label: "Information requests" }]}
      search={{ value: query, onChange: setQuery, placeholder: "Search requests…" }}
    >
      <PageHeader
        title="Information requests"
        description="Every additional-information request raised with logistics partners, with SLA due dates."
        actions={
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--brand)] px-3 py-2 text-xs font-medium text-white hover:bg-[var(--brand)]/90"
          >
            <MessageSquareWarning className="h-3.5 w-3.5" /> New request
          </button>
        }
      />

      <div className="mb-4 flex flex-wrap gap-1.5">
        {["All", "Open", "Responded", "Closed"].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatus(s)}
            className={
              "rounded-full border px-3 py-1 text-xs font-medium transition " +
              (status === s ? "border-[var(--brand)] bg-[var(--brand)] text-white" : "border-border bg-card text-muted-foreground hover:border-[var(--link)]/50")
            }
          >
            {s}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {rows.map((r) => (
          <Panel key={r.id} bodyClassName="p-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-display text-sm font-semibold text-[var(--brand)]">{r.reason}</span>
              <Pill tone={r.status === "Open" ? "warning" : r.status === "Responded" ? "info" : "success"}>{r.status}</Pill>
              <Link
                to="/logistics/operator/applications/$companyId"
                params={{ companyId: r.companyId }}
                search={{ tab: "requests" }}
                className="text-xs font-medium text-[var(--link)] hover:underline"
              >
                {r.company}
              </Link>
              <span className="ml-auto text-xs text-muted-foreground">
                {r.id} · raised {r.raisedAt} · due {r.due}
              </span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{r.message}</p>
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {r.items.map((i) => (
                <li key={i}>
                  <Pill tone="neutral">
                    <FileText className="h-3 w-3" /> {i}
                  </Pill>
                </li>
              ))}
            </ul>
            {r.response ? (
              <div className="mt-3 rounded-lg border border-[#b9d3fb] bg-[var(--brand-soft)]/50 px-3 py-2 text-xs">
                <p className="font-medium text-[var(--brand)]">Partner response · {r.response.at}</p>
                <p className="mt-0.5 text-muted-foreground">{r.response.message}</p>
              </div>
            ) : null}
          </Panel>
        ))}
        {rows.length === 0 ? (
          <Panel>
            <p className="py-6 text-center text-sm text-muted-foreground">No requests match the current filter.</p>
          </Panel>
        ) : null}
      </div>
      {open && companies[0] ? (
        <RequestInfoModal companyId={companies[0].id} onClose={() => setOpen(false)} />
      ) : null}
    </AppShell>
  );
}
