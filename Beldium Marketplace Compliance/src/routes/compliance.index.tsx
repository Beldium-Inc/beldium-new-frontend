import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { AppShell, Metric, SectionCard } from "@/components/AppShell";
import { StatusBadge } from "@/components/StatusBadge";
import { Input } from "@/components/ui/input";
import { fmtDate, fmtUsd, useDemo } from "@/lib/store";
import type { AppStatus } from "@/lib/demo-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/compliance/")({
  head: () => ({
    meta: [
      { title: "Compliance queue — Beldium" },
      {
        name: "description",
        content:
          "Searchable partner application queue with pending, under review, verified and restricted states.",
      },
      { property: "og:title", content: "Compliance queue — Beldium" },
      {
        property: "og:description",
        content: "Triage Buyer, Offtaker and OEM onboarding applications with risk and document status.",
      },
    ],
  }),
  component: ComplianceQueue,
});

const STATUSES: (AppStatus | "all")[] = [
  "all",
  "pending",
  "under_review",
  "info_requested",
  "flagged",
  "escalated",
  "verified",
  "restricted",
  "rejected",
];

function ComplianceQueue() {
  const { state } = useDemo();
  const isOperator = state.role === "operator";
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<AppStatus | "all">("all");
  const [type, setType] = useState<"all" | "Buyer" | "Offtaker" | "OEM">("all");

  const own = ["APP-2041", "APP-2026", "APP-2029"];
  const scoped = isOperator
    ? state.applications
    : state.applications.filter((a) =>
        state.role === "offtaker"
          ? a.id === "APP-2041"
          : state.role === "buyer"
            ? a.id === "APP-2026"
            : a.id === "APP-2029",
      );

  const rows = useMemo(
    () =>
      scoped.filter((a) => {
        const matchesQ =
          !q ||
          [a.entityName, a.id, a.country, a.type].join(" ").toLowerCase().includes(q.toLowerCase());
        return matchesQ && (status === "all" || a.status === status) && (type === "all" || a.type === type);
      }),
    [scoped, q, status, type],
  );

  return (
    <AppShell
      title={isOperator ? "Compliance — partner application queue" : "My compliance standing"}
      subtitle={
        isOperator
          ? "Search, filter and triage onboarding applications"
          : "Verification status, open items and approved trading limits"
      }
    >
      <div className="space-y-6">
        {isOperator && (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Metric label="In queue" value={String(state.applications.length)} hint="All applicant types" />
            <Metric
              label="Median risk score"
              value={String(
                [...state.applications].sort((a, b) => a.riskScore - b.riskScore)[
                  Math.floor(state.applications.length / 2)
                ]?.riskScore ?? 0,
              )}
              hint="Weighted model v3.2"
            />
            <Metric
              label="High risk band"
              value={String(state.applications.filter((a) => a.riskBand === "High").length)}
              tone="danger"
              hint="Enhanced due diligence"
            />
            <Metric
              label="Approved monthly limits"
              value={fmtUsd(state.applications.reduce((s, a) => s + a.limits.approvedMonthlyUsd, 0))}
              tone="success"
              hint="Across verified partners"
            />
          </div>
        )}

        <SectionCard
          title={isOperator ? "Applications" : "My applications"}
          description={`${rows.length} record${rows.length === 1 ? "" : "s"}`}
        >
          {isOperator && (
            <div className="mb-4 space-y-3">
              <div className="relative max-w-sm">
                <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search entity, ID or country"
                  className="pl-9"
                />
              </div>
              <div className="flex flex-wrap gap-1.5">
                {STATUSES.map((s) => (
                  <Chip key={s} active={status === s} onClick={() => setStatus(s)}>
                    {s === "all" ? "All statuses" : s.replace(/_/g, " ")}
                  </Chip>
                ))}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(["all", "Buyer", "Offtaker", "OEM"] as const).map((t) => (
                  <Chip key={t} active={type === t} onClick={() => setType(t)}>
                    {t === "all" ? "All types" : t}
                  </Chip>
                ))}
              </div>
            </div>
          )}

          <div className="-mx-5 overflow-x-auto px-5">
            <table className="w-full min-w-[820px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs tracking-wide text-muted-foreground uppercase">
                  <th className="py-2 pr-4 font-medium">Entity</th>
                  <th className="py-2 pr-4 font-medium">Type</th>
                  <th className="py-2 pr-4 font-medium">Jurisdiction</th>
                  <th className="py-2 pr-4 font-medium">Submitted</th>
                  <th className="py-2 pr-4 font-medium">Risk</th>
                  <th className="py-2 pr-4 font-medium">Open NCs</th>
                  <th className="py-2 pr-4 font-medium">Status</th>
                  <th className="py-2 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((a) => (
                  <tr key={a.id} className="border-b border-border/70 last:border-0">
                    <td className="py-3 pr-4">
                      <span className="font-medium">{a.entityName}</span>
                      <span className="block text-xs text-muted-foreground">{a.id}</span>
                    </td>
                    <td className="py-3 pr-4">{a.type}</td>
                    <td className="py-3 pr-4">{a.jurisdiction}</td>
                    <td className="py-3 pr-4 whitespace-nowrap">{fmtDate(a.submittedAt)}</td>
                    <td className="py-3 pr-4">
                      <span className="font-medium">{a.riskScore}</span>
                      <span className="text-xs text-muted-foreground"> / {a.riskBand}</span>
                    </td>
                    <td className="py-3 pr-4">
                      {a.nonConformities.filter((n) => n.status !== "closed").length}
                    </td>
                    <td className="py-3 pr-4">
                      <StatusBadge status={a.status} />
                    </td>
                    <td className="py-3 text-right">
                      <Link
                        to="/compliance/$id"
                        params={{ id: a.id }}
                        className="text-sm font-medium text-primary hover:underline"
                      >
                        {isOperator ? "Review" : "View"}
                      </Link>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-sm text-muted-foreground">
                      No applications match the current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {!isOperator && own.length > 0 && (
            <p className="mt-4 text-xs text-muted-foreground">
              Partners only see their own onboarding record. The compliance desk sees the full queue.
            </p>
          )}
        </SectionCard>
      </div>
    </AppShell>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1 text-xs font-medium capitalize transition",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-muted-foreground hover:border-primary/40",
      )}
    >
      {children}
    </button>
  );
}
