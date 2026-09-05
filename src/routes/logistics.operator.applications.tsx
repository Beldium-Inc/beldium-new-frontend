import * as React from "react";
import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { Eye, Filter, MessageSquareWarning, PlayCircle, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/verticals/logistics/AppShell";
import { PageHeader, Panel, Pill, RiskBadge, StatusBadge } from "@/verticals/logistics/bits";
import { useApp } from "@/verticals/logistics/store";

export const Route = createFileRoute("/logistics/operator/applications")({
  head: () => ({
    meta: [
      { title: "Applications | Beldium Compliance Operations" },
      { name: "description", content: "Review, assign and action logistics operator compliance applications." },
      { property: "og:title", content: "Applications | Beldium Compliance Operations" },
      { property: "og:description", content: "Filterable register of operator applications with risk and reviewer state." },
    ],
  }),
  component: ApplicationsRoute,
});

const REVIEWERS = ["Ngozi Adeyemi", "Tunde Ayeni", "Chioma Balogun"];

function ApplicationsRoute() {
  const isChild = useRouterState({
    select: (s) => s.location.pathname !== "/logistics/operator/applications" && s.location.pathname !== "/logistics/operator/applications/",
  });
  if (isChild) return <Outlet />;
  return <ApplicationsList />;
}

function ApplicationsList() {
  const { companies, assignReviewer, startReview } = useApp();
  const [query, setQuery] = React.useState("");
  const [status, setStatus] = React.useState("All");
  const [risk, setRisk] = React.useState("All");

  const rows = companies.filter(
    (c) =>
      (status === "All" || c.status === status) &&
      (risk === "All" || c.risk === risk) &&
      (c.name.toLowerCase().includes(query.toLowerCase()) ||
        c.id.toLowerCase().includes(query.toLowerCase()) ||
        c.location.toLowerCase().includes(query.toLowerCase())),
  );

  const statuses = ["All", ...Array.from(new Set(companies.map((c) => c.status)))];

  return (
    <AppShell
      role="operator"
      breadcrumbs={[{ label: "Compliance Operations", to: "/logistics/operator" }, { label: "Applications" }]}
      search={{ value: query, onChange: setQuery, placeholder: "Search company, ID or location…" }}
    >
      <PageHeader
        title="Applications"
        description="Every onboarding and re-verification case in the Beldium register."
        actions={<Pill tone="info">{rows.length} of {companies.length} shown</Pill>}
      />

      <Panel bodyClassName="p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Filter className="h-3.5 w-3.5" /> Filters
          </span>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-lg border border-input bg-white px-3 py-1.5 text-xs text-[var(--brand)] outline-none focus:border-[var(--link)]"
          >
            {statuses.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <select
            value={risk}
            onChange={(e) => setRisk(e.target.value)}
            className="rounded-lg border border-input bg-white px-3 py-1.5 text-xs text-[var(--brand)] outline-none focus:border-[var(--link)]"
          >
            {["All", "Low", "Medium", "High"].map((s) => (
              <option key={s}>{s} risk</option>
            ))}
          </select>
          {(status !== "All" || risk !== "All" || query) && (
            <button
              type="button"
              onClick={() => {
                setStatus("All");
                setRisk("All");
                setQuery("");
              }}
              className="text-xs font-medium text-[var(--link)] hover:underline"
            >
              Clear
            </button>
          )}
        </div>
      </Panel>

      <Panel className="mt-4" bodyClassName="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1080px] text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/60 text-left text-[11px] tracking-wide text-muted-foreground uppercase">
                <th className="px-5 py-3 font-semibold">Company</th>
                <th className="px-3 py-3 font-semibold">ID</th>
                <th className="px-3 py-3 font-semibold">Location</th>
                <th className="px-3 py-3 font-semibold">Fleet</th>
                <th className="px-3 py-3 font-semibold">Status</th>
                <th className="px-3 py-3 font-semibold">Risk</th>
                <th className="px-3 py-3 font-semibold">Submitted</th>
                <th className="px-3 py-3 font-semibold">Reviewer</th>
                <th className="px-3 py-3 font-semibold">Activity</th>
                <th className="px-5 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((c) => (
                <tr key={c.id} className="hover:bg-muted/40">
                  <td className="px-5 py-3">
                    <Link
                      to="/logistics/operator/applications/$companyId"
                      params={{ companyId: c.id }}
                      search={{ tab: "overview" as const }}
                      className="font-medium text-[var(--brand)] hover:text-[var(--link)]"
                    >
                      {c.name}
                    </Link>
                    <p className="text-xs text-muted-foreground">{c.services[0]}</p>
                  </td>
                  <td className="px-3 py-3 text-xs text-muted-foreground">{c.id}</td>
                  <td className="px-3 py-3 text-xs">{c.location}, {c.state}</td>
                  <td className="px-3 py-3 text-xs">
                    {c.fleetSize} veh · {c.driverCount} drv
                  </td>
                  <td className="px-3 py-3"><StatusBadge status={c.status} /></td>
                  <td className="px-3 py-3"><RiskBadge risk={c.risk} score={c.riskScore} /></td>
                  <td className="px-3 py-3 text-xs text-muted-foreground">{c.submitted}</td>
                  <td className="px-3 py-3 text-xs">{c.reviewer}</td>
                  <td className="px-3 py-3 text-xs text-muted-foreground">{c.lastActivity}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        to="/logistics/operator/applications/$companyId"
                        params={{ companyId: c.id }}
                        search={{ tab: "overview" as const }}
                        title="View company"
                        className="rounded-md border border-border p-1.5 text-[var(--brand)] hover:border-[var(--link)]/50 hover:text-[var(--link)]"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Link>
                      <button
                        type="button"
                        title="Assign reviewer"
                        onClick={() => {
                          const next = REVIEWERS[(REVIEWERS.indexOf(c.reviewer) + 1) % REVIEWERS.length] ?? REVIEWERS[0]!;
                          assignReviewer(c.id, next);
                          toast.success(`${c.name} assigned to ${next}`);
                        }}
                        className="rounded-md border border-border p-1.5 text-[var(--brand)] hover:border-[var(--link)]/50 hover:text-[var(--link)]"
                      >
                        <UserPlus className="h-3.5 w-3.5" />
                      </button>
                      <Link
                        to="/logistics/operator/applications/$companyId"
                        params={{ companyId: c.id }}
                        search={{ tab: "requests" }}
                        title="Request information"
                        className="rounded-md border border-border p-1.5 text-[var(--brand)] hover:border-[var(--link)]/50 hover:text-[var(--link)]"
                      >
                        <MessageSquareWarning className="h-3.5 w-3.5" />
                      </Link>
                      <button
                        type="button"
                        title="Start review"
                        onClick={() => {
                          startReview(c.id);
                          toast.success(`Review started for ${c.name}`);
                        }}
                        className="inline-flex items-center gap-1 rounded-md bg-[var(--brand)] px-2 py-1.5 text-[11px] font-medium text-white hover:bg-[var(--brand)]/90"
                      >
                        <PlayCircle className="h-3.5 w-3.5" /> Review
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-5 py-10 text-center text-sm text-muted-foreground">
                    No applications match the current filters.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Panel>
    </AppShell>
  );
}
