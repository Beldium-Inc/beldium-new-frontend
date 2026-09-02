import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { AppShell } from "@/components/beldium/shell";
import { EmptyState, PageHeader, Pill, SectionTitle, Stat, StatusPill, Surface } from "@/components/beldium/ui";
import { useBeldium } from "@/lib/beldium/store";
import type { ApplicationStatus } from "@/lib/beldium/types";

export const Route = createFileRoute("/applications/")({
  head: () => ({
    meta: [
      { title: "Partner application queue — Beldium" },
      {
        name: "description",
        content:
          "Queue of Quality & Control Partner applications with risk scoring, document completeness and decision status.",
      },
      { property: "og:title", content: "Partner application queue — Beldium" },
      {
        property: "og:description",
        content: "Risk-scored verification queue for Quality & Control Partner applications.",
      },
    ],
  }),
  component: () => (
    <AppShell>
      <ApplicationsPage />
    </AppShell>
  ),
});

const filters: { key: ApplicationStatus | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "submitted", label: "New" },
  { key: "in_review", label: "In review" },
  { key: "info_requested", label: "Info requested" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
];

function ApplicationsPage() {
  const { state, role } = useBeldium();
  const [filter, setFilter] = React.useState<ApplicationStatus | "all">("all");
  const [q, setQ] = React.useState("");

  const list = state.applications.filter(
    (a) =>
      (filter === "all" || a.status === filter) &&
      (q.trim() === "" ||
        `${a.ref} ${a.organisation.legalName} ${a.organisation.country}`
          .toLowerCase()
          .includes(q.toLowerCase())),
  );

  return (
    <>
      <PageHeader
        eyebrow={role === "regulator" ? "Oversight · read only" : "Verification"}
        title="Quality & Control Partner applications"
        description="Each applicant must evidence a legal organisation, competent professionals, an accredited laboratory and a scope that covers the material they intend to certify."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="In queue" value={state.applications.filter((a) => a.status !== "approved" && a.status !== "rejected").length} />
        <Stat label="Awaiting applicant" value={state.applications.filter((a) => a.status === "info_requested").length} sub="information requested" />
        <Stat label="Approved partners" value={state.applications.filter((a) => a.status === "approved").length} tone="pale" />
        <Stat label="High risk" value={state.applications.filter((a) => a.riskScore > 50).length} sub="score above 50" />
      </div>

      <Surface className="mt-6">
        <SectionTitle
          title="Application queue"
          hint="Sorted by submission date"
          action={
            <div className="relative">
              <Search className="absolute top-2.5 left-3 size-4 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search organisation or reference"
                className="w-64 rounded-xl border border-border bg-background py-2 pr-3 pl-9 text-sm outline-none focus:border-link"
              />
            </div>
          }
        />
        <div className="flex flex-wrap gap-2 border-b border-border px-6 py-3">
          {filters.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={
                filter === f.key
                  ? "rounded-full bg-navy px-3 py-1.5 text-xs font-semibold text-navy-foreground"
                  : "rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:border-link hover:text-link"
              }
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="hidden grid-cols-12 gap-3 border-b border-border px-6 py-3 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase lg:grid">
          <span className="col-span-4">Organisation</span>
          <span className="col-span-2">Reference</span>
          <span className="col-span-2">Accreditation</span>
          <span className="col-span-1">Docs</span>
          <span className="col-span-1">Risk</span>
          <span className="col-span-2 text-right">Status</span>
        </div>

        <div className="divide-y divide-border">
          {list.length === 0 ? (
            <EmptyState title="No applications match" hint="Adjust the filter or search term." />
          ) : (
            list.map((a) => {
              const verified = a.documents.filter((d) => d.status === "verified").length;
              return (
                <Link
                  key={a.id}
                  to="/applications/$id"
                  params={{ id: a.id }}
                  className="grid grid-cols-1 gap-2 px-6 py-4 transition hover:bg-accent/50 lg:grid-cols-12 lg:items-center lg:gap-3"
                >
                  <div className="lg:col-span-4">
                    <p className="font-display text-sm font-semibold text-navy">
                      {a.organisation.legalName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {a.organisation.city}, {a.organisation.country} · submitted {a.submittedAt}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground lg:col-span-2">{a.ref}</p>
                  <p className="text-xs text-muted-foreground lg:col-span-2">
                    {a.laboratory.accreditationBody}
                  </p>
                  <p className="text-xs text-navy lg:col-span-1">
                    {verified}/{a.documents.length}
                  </p>
                  <div className="lg:col-span-1">
                    <Pill tone={a.riskScore > 50 ? "danger" : a.riskScore > 25 ? "warning" : "success"}>
                      {a.riskScore}
                    </Pill>
                  </div>
                  <div className="lg:col-span-2 lg:text-right">
                    <StatusPill value={a.status} />
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </Surface>
    </>
  );
}
