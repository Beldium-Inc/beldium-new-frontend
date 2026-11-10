import { createFileRoute } from "@tanstack/react-router";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useStore } from "@/verticals/mining/store";
import { KpiCard, PageHeader, Panel } from "@/verticals/mining/components/primitives";
import { StatusChip } from "@/verticals/mining/components/chips";
import {
  ListState,
  ListToolbar,
  fmtDate,
  fmtNumber,
  matchesFilters,
  useListFilters,
} from "@/verticals/mining/components/listkit";

export const Route = createFileRoute("/mining/transactions")({ component: TransactionsPage });

/**
 * Sales and offtake of the miner's material. Today these come from each
 * site's own `transactions` record. When the backend exposes a transactions
 * endpoint fed by marketplace orders and logistics movements (task BE-M3,
 * decision D1), swap the source here; the table stays the same.
 */
function TransactionsPage() {
  const { sites, isLoading, error } = useStore();
  const [filters, setFilters] = useListFilters();

  const all = sites.flatMap((s) =>
    s.transactions.map((t, i) => ({
      ...t,
      // Stored rows carry {date, buyer, tonnes, value, status}; an id is optional.
      ref: t.id ? String(t.id) : "",
      key: `${s.id}-${t.id ?? i}`,
      siteId: s.id,
      siteName: s.name,
      mineral: s.mineral,
    })),
  );
  const rows = all
    .filter((t) =>
      matchesFilters(filters, { siteId: t.siteId }, [t.ref, t.buyer, t.status, t.siteName]),
    )
    .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));
  const tonnes = rows.reduce((sum, t) => sum + (Number(t.tonnes) || 0), 0);
  const buyers = new Set(rows.map((t) => t.buyer).filter(Boolean)).size;

  return (
    <>
      <PageHeader
        eyebrow="Operations"
        title="Transactions"
        description="Sales and offtake of material from your sites."
      />
      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        <KpiCard label="Transactions" value={rows.length} />
        <KpiCard label="Tonnes sold" value={`${fmtNumber(tonnes)} t`} />
        <KpiCard label="Buyers" value={buyers} />
      </div>
      <ListToolbar
        filters={filters}
        onChange={setFilters}
        placeholder="Search buyer, reference or status"
      />
      <ListState
        loading={isLoading}
        error={error}
        empty={rows.length === 0}
        emptyTitle="No transactions recorded"
        emptyDescription="Sales made through the Beldium marketplace will be listed here once they are linked to your sites."
      >
        <Panel bodyClassName="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reference</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Site</TableHead>
                  <TableHead>Buyer</TableHead>
                  <TableHead className="text-right">Tonnes</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((t) => (
                  <TableRow key={t.key}>
                    <TableCell className="font-mono text-xs">{t.ref || "—"}</TableCell>
                    <TableCell className="text-sm">{fmtDate(t.date)}</TableCell>
                    <TableCell className="text-sm font-medium">
                      {t.siteName}
                      <p className="text-xs text-muted-foreground">{t.mineral}</p>
                    </TableCell>
                    <TableCell className="text-sm">{t.buyer || "—"}</TableCell>
                    <TableCell className="text-right tabular-nums">{fmtNumber(t.tonnes)}</TableCell>
                    <TableCell className="text-right tabular-nums">{t.value || "—"}</TableCell>
                    <TableCell>{t.status ? <StatusChip value={t.status} /> : "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Panel>
      </ListState>
    </>
  );
}
