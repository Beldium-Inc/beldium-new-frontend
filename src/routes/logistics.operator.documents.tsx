import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarClock, FileClock } from "lucide-react";
import { toast } from "sonner";
import { AppShell, ComplianceBanner } from "@/verticals/logistics/AppShell";
import { PageHeader, Panel, Pill, StatCard } from "@/verticals/logistics/bits";
import { expiringDocuments } from "@/verticals/logistics/mock-data";

export const Route = createFileRoute("/logistics/operator/documents")({
  head: () => ({
    meta: [
      { title: "Expiring documents | Beldium Compliance Operations" },
      { name: "description", content: "Continuous monitoring of expiring licences, insurance and roadworthiness certificates." },
      { property: "og:title", content: "Expiring documents | Beldium Compliance Operations" },
      { property: "og:description", content: "Track credentials approaching expiry across the operator register." },
    ],
  }),
  component: ExpiringDocs,
});

function ExpiringDocs() {
  const [query, setQuery] = React.useState("");
  const [severity, setSeverity] = React.useState("All");

  const rows = expiringDocuments.filter(
    (d) =>
      (severity === "All" || d.severity === severity.toLowerCase()) &&
      (d.company.toLowerCase().includes(query.toLowerCase()) || d.document.toLowerCase().includes(query.toLowerCase())),
  );

  return (
    <AppShell
      role="operator"
      breadcrumbs={[{ label: "Compliance Operations", to: "/logistics/operator" }, { label: "Expiring documents" }]}
      search={{ value: query, onChange: setQuery, placeholder: "Search documents or operators…" }}
    >
      <PageHeader title="Expiring documents" description="Automated monitoring flags credentials before they lapse and restricts scope where required." />

      <ComplianceBanner
        tone="danger"
        title="3 credentials expire within 10 days"
        body="Operators with lapsed insurance are automatically suspended from dispatch until renewed cover is verified."
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard label="Critical (≤10 days)" value={expiringDocuments.filter((d) => d.severity === "critical").length} icon={FileClock} tone="danger" onClick={() => setSeverity("Critical")} active={severity === "Critical"} />
        <StatCard label="Warning (≤30 days)" value={expiringDocuments.filter((d) => d.severity === "warning").length} icon={CalendarClock} tone="warning" onClick={() => setSeverity("Warning")} active={severity === "Warning"} />
        <StatCard label="Watchlist (≤90 days)" value={expiringDocuments.filter((d) => d.severity === "watch").length} icon={CalendarClock} tone="info" onClick={() => setSeverity("Watch")} active={severity === "Watch"} />
      </div>

      <Panel
        className="mt-4"
        title="Monitoring schedule"
        description={`${rows.length} credentials tracked`}
        bodyClassName="p-0"
        actions={
          severity !== "All" ? (
            <button type="button" onClick={() => setSeverity("All")} className="text-xs font-medium text-[var(--link)] hover:underline">
              Clear filter
            </button>
          ) : null
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/60 text-left text-[11px] tracking-wide text-muted-foreground uppercase">
                <th className="px-5 py-3 font-semibold">Document</th>
                <th className="px-3 py-3 font-semibold">Operator</th>
                <th className="px-3 py-3 font-semibold">Category</th>
                <th className="px-3 py-3 font-semibold">Expires</th>
                <th className="px-3 py-3 font-semibold">Days left</th>
                <th className="px-5 py-3 text-right font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((d) => (
                <tr key={d.id} className="hover:bg-muted/40">
                  <td className="px-5 py-3 font-medium text-[var(--brand)]">{d.document}</td>
                  <td className="px-3 py-3 text-xs">
                    <Link to="/logistics/operator/applications/$companyId" params={{ companyId: d.companyId }} search={{ tab: "overview" as const }} className="text-[var(--link)] hover:underline">
                      {d.company}
                    </Link>
                  </td>
                  <td className="px-3 py-3 text-xs">{d.category}</td>
                  <td className="px-3 py-3 text-xs text-muted-foreground">{d.expires}</td>
                  <td className="px-3 py-3">
                    <Pill tone={d.severity === "critical" ? "danger" : d.severity === "warning" ? "warning" : "neutral"}>{d.daysLeft} days</Pill>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => toast.success(`Renewal reminder sent to ${d.company}`)}
                      className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-[var(--brand)] hover:border-[var(--link)]/50"
                    >
                      Send reminder
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </AppShell>
  );
}
