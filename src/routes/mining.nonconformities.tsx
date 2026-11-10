import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useStore } from "@/verticals/mining/store";
import type { NonConformity } from "@/verticals/mining/types";
import {
  CreateNonConformity,
  NonConformityCard,
} from "@/verticals/mining/components/NonConformity";
import { KpiCard, PageHeader } from "@/verticals/mining/components/primitives";
import {
  ALL,
  ListState,
  ListToolbar,
  matchesFilters,
  useListFilters,
  useMiningPermissions,
  useSiteNames,
} from "@/verticals/mining/components/listkit";

export const Route = createFileRoute("/mining/nonconformities")({ component: NonConformitiesPage });

const OPEN: NonConformity["status"][] = ["Open", "In Progress", "Awaiting Review", "Escalated"];
const SEVERITY_ORDER = { Critical: 0, Major: 1, Minor: 2 } as const;

function NonConformitiesPage() {
  const { nonConformities, isLoading, error } = useStore();
  const { canDecide, isMiner } = useMiningPermissions();
  const siteName = useSiteNames();
  const [filters, setFilters] = useListFilters();
  const today = new Date().toISOString().slice(0, 10);

  const rows = nonConformities
    .filter((nc) =>
      matchesFilters(filters, nc, [
        nc.ref,
        nc.title,
        nc.category,
        nc.responsiblePerson,
        siteName(nc.siteId),
      ]),
    )
    .sort(
      (a, b) =>
        SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity] ||
        a.deadline.localeCompare(b.deadline),
    );
  const open = rows.filter((nc) => OPEN.includes(nc.status));
  const awaiting = rows.filter((nc) => nc.status === "Awaiting Review");
  const closed = rows.filter((nc) => nc.status === "Closed");
  const overdue = open.filter((nc) => nc.deadline && nc.deadline < today);

  return (
    <>
      <PageHeader
        eyebrow={canDecide ? "Assurance" : "Monitoring"}
        title="Non-conformities"
        description="Findings raised against sites, the corrective action asked for, and the evidence the miner sent back."
        actions={
          canDecide &&
          (filters.siteId !== ALL ? (
            <CreateNonConformity
              siteId={filters.siteId}
              trigger={
                <Button>
                  <Plus className="size-4" /> Raise finding at {siteName(filters.siteId)}
                </Button>
              }
            />
          ) : (
            <p className="text-xs text-muted-foreground">
              Pick a site in the filter to raise a finding.
            </p>
          ))
        }
      />
      <div className="mb-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Open" value={open.length} tone="warning" />
        <KpiCard label="Overdue" value={overdue.length} tone="danger" />
        <KpiCard label="Awaiting review" value={awaiting.length} />
        <KpiCard label="Closed" value={closed.length} tone="success" />
      </div>
      <ListToolbar
        filters={filters}
        onChange={setFilters}
        statuses={[...OPEN, "Closed"]}
        placeholder="Search reference, title or person"
      />
      <Tabs defaultValue={canDecide && awaiting.length > 0 ? "awaiting" : "open"}>
        <TabsList>
          <TabsTrigger value="open">Open ({open.length})</TabsTrigger>
          <TabsTrigger value="awaiting">Awaiting review ({awaiting.length})</TabsTrigger>
          <TabsTrigger value="closed">Closed ({closed.length})</TabsTrigger>
        </TabsList>
        {(
          [
            ["open", open, "No open findings"],
            ["awaiting", awaiting, "No corrective action is waiting for review"],
            ["closed", closed, "No closed findings yet"],
          ] as const
        ).map(([key, list, empty]) => (
          <TabsContent key={key} value={key} className="mt-4">
            <ListState
              loading={isLoading}
              error={error}
              empty={list.length === 0}
              emptyTitle={empty}
            >
              <div className="space-y-4">
                {list.map((nc) => (
                  <NonConformityCard
                    key={nc.id}
                    nc={nc}
                    canDecide={canDecide}
                    canRespond={isMiner}
                  />
                ))}
              </div>
            </ListState>
          </TabsContent>
        ))}
      </Tabs>
    </>
  );
}
