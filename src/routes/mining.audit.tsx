import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useMiningAudit } from "@/lib/api/mining-queries";
import { PageHeader, Panel } from "@/verticals/mining/components/primitives";
import { Chip } from "@/verticals/mining/components/chips";
import { ListState, useMiningPermissions } from "@/verticals/mining/components/listkit";

export const Route = createFileRoute("/mining/audit")({ component: AuditPage });

const PAGE_SIZE = 50;

/** "production_record_created" -> "Production record created". */
function humanise(action: string): string {
  const s = action.replace(/[_.]+/g, " ").trim();
  return s ? s[0]!.toUpperCase() + s.slice(1) : action;
}

function AuditPage() {
  const { isRegulator } = useMiningPermissions();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  // The trail is paged on the server, unlike the other registers: it grows
  // with every action. The server has no search on it yet (backend task
  // BE-M1), so the box filters the page on screen only.
  const audit = useMiningAudit({ page, page_size: PAGE_SIZE, ordering: "-created_at" });
  const q = search.trim().toLowerCase();
  const rows = (audit.data?.results ?? []).filter(
    (e) =>
      !q ||
      [e.actor, e.action, e.target, e.detail, e.role].some((v) => v.toLowerCase().includes(q)),
  );
  const total = audit.data?.count ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <>
      <PageHeader
        eyebrow="Assurance"
        title={isRegulator ? "Audit history" : "Audit trail"}
        description="Every action taken in the mining register: who, when, what and on which record. Read only."
      />
      <div className="mb-4 space-y-1.5 sm:w-80">
        <Label htmlFor="audit-search">Filter this page</Label>
        <Input
          id="audit-search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Actor, action or record"
        />
      </div>
      <ListState
        loading={audit.isPending}
        error={audit.error}
        empty={rows.length === 0}
        emptyTitle={q ? "Nothing on this page matches" : "No audit events yet"}
      >
        <Panel bodyClassName="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>When</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Record</TableHead>
                  <TableHead>Detail</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="text-xs whitespace-nowrap tabular-nums">
                      {new Date(e.created_at).toLocaleString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </TableCell>
                    <TableCell className="text-sm font-medium">{e.actor || "System"}</TableCell>
                    <TableCell>{e.role ? <Chip>{e.role}</Chip> : "—"}</TableCell>
                    <TableCell className="text-sm">{humanise(e.action)}</TableCell>
                    <TableCell className="text-sm">{e.target || "—"}</TableCell>
                    <TableCell className="max-w-sm text-xs text-muted-foreground">
                      {e.detail || "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center justify-between border-t border-border px-5 py-3 text-xs text-muted-foreground">
            <span>
              {total} event{total === 1 ? "" : "s"} · page {page} of {pages}
            </span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={page <= 1 || audit.isFetching}
                onClick={() => setPage((p) => p - 1)}
                aria-label="Previous page"
              >
                <ChevronLeft className="size-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={page >= pages || audit.isFetching}
                onClick={() => setPage((p) => p + 1)}
                aria-label="Next page"
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        </Panel>
      </ListState>
    </>
  );
}
