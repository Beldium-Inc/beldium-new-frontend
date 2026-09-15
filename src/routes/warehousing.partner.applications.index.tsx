import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Search } from "lucide-react";
import { AppShell } from "@/verticals/warehousing/app-shell";
import { Panel, StatusPill, toneForStatus } from "@/verticals/warehousing/compliance-ui";
import { labelStatus } from "@/verticals/warehousing/data";
import { useDemo } from "@/verticals/warehousing/store";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/warehousing/partner/applications/")({
  head: () => ({
    meta: [
      { title: "Applications | Beldium Compliance Partner" },
      {
        name: "description",
        content: "Warehouse registration applications queued for compliance partner review.",
      },
    ],
  }),
  component: ApplicationsPage,
});

const FILTERS = ["All", "Pending review", "Awaiting information", "Decided"] as const;
const DECIDED = new Set(["approved", "conditionally_approved", "rejected"]);

function ApplicationsPage() {
  const { state } = useDemo();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");
  const [query, setQuery] = useState("");

  const rows = state.applications.filter((a) => {
    const w = state.warehouses.find((x) => x.id === a.warehouse);
    const matchQuery = `${w?.name ?? ""} ${w?.reference ?? ""}`.toLowerCase().includes(query.toLowerCase());
    const matchFilter =
      filter === "All"
        ? true
        : filter === "Pending review"
          ? a.status === "submitted" || a.status === "under_review"
          : filter === "Awaiting information"
            ? a.status === "awaiting_information"
            : DECIDED.has(a.status);
    return matchQuery && matchFilter;
  });

  return (
    <AppShell role="partner" title="Applications" subtitle="Warehouse registration files assigned to Beldium Compliance Partners">
      <Panel
        title={`${rows.length} application${rows.length === 1 ? "" : "s"}`}
        description="Select a reference to open the full review workspace."
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <Tabs value={filter} onValueChange={(v) => setFilter(v as (typeof FILTERS)[number])}>
              <TabsList className="rounded-xl">
                {FILTERS.map((f) => (
                  <TabsTrigger key={f} value={f} className="rounded-lg text-xs">
                    {f}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search warehouse"
                className="h-10 w-64 rounded-xl pl-9"
              />
            </div>
          </div>
        }
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Warehouse</TableHead>
              <TableHead>Progress</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead>Risk</TableHead>
              <TableHead>Status</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((a) => {
              const w = state.warehouses.find((x) => x.id === a.warehouse);
              return (
                <TableRow key={a.id}>
                  <TableCell>
                    <p className="font-medium text-primary">{w?.name ?? a.warehouse}</p>
                    <p className="text-xs text-muted-foreground">{w?.reference}</p>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {a.progress.complete}/{a.progress.total}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{a.submitted_at ?? "-"}</TableCell>
                  <TableCell className="font-heading font-semibold">{a.risk.compliance_score}</TableCell>
                  <TableCell>
                    <StatusPill tone={toneForStatus(a.status)}>{labelStatus(a.status)}</StatusPill>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link
                      to="/warehousing/partner/applications/$id"
                      params={{ id: a.warehouse }}
                      className="text-sm font-medium text-link hover:underline"
                    >
                      Open
                    </Link>
                  </TableCell>
                </TableRow>
              );
            })}
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                  No applications match this filter.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </Panel>
    </AppShell>
  );
}
