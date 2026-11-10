import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExpiryBadge } from "@/components/shared/expiry-badge";
import { useStore } from "@/verticals/mining/store";
import type { PendingReview } from "@/verticals/mining/types";
import { PageHeader, Panel } from "@/verticals/mining/components/primitives";
import { StatusChip } from "@/verticals/mining/components/chips";
import {
  ListState,
  ListToolbar,
  errorMessage,
  fmtDate,
  matchesFilters,
  useListFilters,
  useMiningPermissions,
  useSiteNames,
} from "@/verticals/mining/components/listkit";

export const Route = createFileRoute("/mining/reviews")({ component: ReviewsPage });

const PRIORITY_ORDER = { High: 0, Normal: 1, Low: 2 } as const;

function ReviewsPage() {
  const { reviews, isLoading, error } = useStore();
  const siteName = useSiteNames();
  const [filters, setFilters] = useListFilters();

  const filtered = reviews.filter((r) =>
    matchesFilters(filters, r, [r.subject, r.type, siteName(r.siteId), r.assignedTo]),
  );
  // Oldest due first, then priority, so the queue reads as "what to do next".
  const byDue = (a: PendingReview, b: PendingReview) =>
    (a.due || "9999").localeCompare(b.due || "9999") ||
    PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
  const open = filtered.filter((r) => r.status !== "Completed").sort(byDue);
  const done = filtered.filter((r) => r.status === "Completed");

  return (
    <>
      <PageHeader
        eyebrow="Review"
        title="Pending reviews"
        description="Site submissions waiting for the compliance desk, oldest due date first."
      />
      <ListToolbar
        filters={filters}
        onChange={setFilters}
        placeholder="Search subject, type or site"
      />
      <Tabs defaultValue="open">
        <TabsList>
          <TabsTrigger value="open">Open ({open.length})</TabsTrigger>
          <TabsTrigger value="done">Completed ({done.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="open" className="mt-4">
          <ListState
            loading={isLoading}
            error={error}
            empty={open.length === 0}
            emptyTitle="No reviews waiting"
            emptyDescription="New site submissions appear here when the desk queues them."
          >
            <ReviewTable rows={open} />
          </ListState>
        </TabsContent>
        <TabsContent value="done" className="mt-4">
          <ListState
            loading={isLoading}
            empty={done.length === 0}
            emptyTitle="No completed reviews yet"
          >
            <ReviewTable rows={done} />
          </ListState>
        </TabsContent>
      </Tabs>
    </>
  );
}

function ReviewTable({ rows }: { rows: PendingReview[] }) {
  const { startReview, completeReview } = useStore();
  const { canDecide } = useMiningPermissions();
  const siteName = useSiteNames();
  const [busy, setBusy] = useState<string | null>(null);

  const act = async (id: string, fn: (id: string) => Promise<void>, done: string) => {
    setBusy(id);
    try {
      await fn(id);
      toast.success(done);
    } catch (err) {
      toast.error("Could not update the review", { description: errorMessage(err) });
    } finally {
      setBusy(null);
    }
  };

  return (
    <Panel bodyClassName="p-0">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Subject</TableHead>
              <TableHead>Site</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead>Due</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Assigned to</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">
                  {r.subject}
                  <p className="text-xs text-muted-foreground">{r.type}</p>
                </TableCell>
                <TableCell className="text-sm">{siteName(r.siteId)}</TableCell>
                <TableCell>
                  <StatusChip value={r.priority} />
                </TableCell>
                <TableCell className="text-sm">{fmtDate(r.submitted)}</TableCell>
                <TableCell>
                  {r.status === "Completed" ? (
                    <span className="text-sm">{fmtDate(r.due)}</span>
                  ) : (
                    <ExpiryBadge date={r.due || null} compact mode="due" />
                  )}
                </TableCell>
                <TableCell>
                  <StatusChip value={r.status} />
                </TableCell>
                <TableCell className="text-sm">{r.assignedTo || "Unassigned"}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    {canDecide && r.status === "Queued" && (
                      <Button
                        size="sm"
                        disabled={busy === r.id}
                        onClick={() => act(r.id, startReview, "Review started")}
                      >
                        Start
                      </Button>
                    )}
                    {canDecide && r.status === "In Progress" && (
                      <Button
                        size="sm"
                        disabled={busy === r.id}
                        onClick={() => act(r.id, completeReview, "Review completed")}
                      >
                        Complete
                      </Button>
                    )}
                    <Button asChild size="sm" variant="outline">
                      <Link to="/mining/sites/$siteId" params={{ siteId: r.siteId }}>
                        Open site
                      </Link>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Panel>
  );
}
