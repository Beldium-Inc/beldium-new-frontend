import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Search } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Panel, StatusPill, toneForStatus } from "@/components/compliance-ui";
import { labelStatus } from "@/lib/demo/data";
import { useDemo } from "@/lib/demo/store";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/partner/applications/")({
  head: () => ({
    meta: [
      { title: "Applications | Beldium Compliance Partner" },
      {
        name: "description",
        content: "Warehouse registration applications queued for compliance partner review, with risk scores and SLA dates.",
      },
      { property: "og:title", content: "Applications | Beldium Compliance Partner" },
      { property: "og:description", content: "Review queue for mineral warehouse registration applications." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ApplicationsPage,
});

const FILTERS = ["All", "Pending review", "Information requested", "Decided"] as const;

function ApplicationsPage() {
  const { applications } = useDemo();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");
  const [query, setQuery] = useState("");

  const rows = applications.filter((a) => {
    const matchQuery = `${a.id} ${a.company} ${a.facility} ${a.state} ${a.commodities}`
      .toLowerCase()
      .includes(query.toLowerCase());
    const matchFilter =
      filter === "All"
        ? true
        : filter === "Pending review"
          ? a.status === "pending"
          : filter === "Information requested"
            ? a.status === "info-requested"
            : ["approved", "conditional", "rejected"].includes(a.status);
    return matchQuery && matchFilter;
  });

  return (
    <AppShell
      role="partner"
      title="Applications"
      subtitle="Warehouse registration files assigned to Beldium Compliance Partners"
    >
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
                placeholder="Search company, state, commodity"
                className="h-10 w-64 rounded-xl pl-9"
              />
            </div>
          </div>
        }
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Reference</TableHead>
              <TableHead>Applicant</TableHead>
              <TableHead>Commodities</TableHead>
              <TableHead>Capacity</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead>SLA due</TableHead>
              <TableHead>Risk</TableHead>
              <TableHead>Status</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((a) => (
              <TableRow key={a.id}>
                <TableCell>
                  <p className="font-medium text-primary">{a.id}</p>
                  <p className="text-xs text-muted-foreground">{a.ref}</p>
                </TableCell>
                <TableCell>
                  <p className="font-medium text-foreground">{a.company}</p>
                  <p className="text-xs text-muted-foreground">
                    {a.facility} · {a.state}
                  </p>
                </TableCell>
                <TableCell className="max-w-56 text-sm text-muted-foreground">{a.commodities}</TableCell>
                <TableCell className="text-sm">{a.capacityTonnes.toLocaleString()} t</TableCell>
                <TableCell className="text-sm text-muted-foreground">{a.submitted}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{a.slaDue}</TableCell>
                <TableCell className="font-heading font-semibold">{a.riskScore}</TableCell>
                <TableCell>
                  <StatusPill tone={toneForStatus(a.status)}>{labelStatus(a.status)}</StatusPill>
                </TableCell>
                <TableCell className="text-right">
                  <Link
                    to="/partner/applications/$id"
                    params={{ id: a.id }}
                    className="text-sm font-medium text-link hover:underline"
                  >
                    Open
                  </Link>
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="py-10 text-center text-sm text-muted-foreground">
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
