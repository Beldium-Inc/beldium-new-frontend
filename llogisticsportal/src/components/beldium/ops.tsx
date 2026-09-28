import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ApiError } from "@/lib/api/errors";
import type { OpsListQuery } from "@/lib/api/operations";
import type { Paginated } from "@/lib/api/types";
import { cn } from "@/lib/utils";

// Building blocks for the operations screens, styled like Miner Hub's
// ecosystem-ui (hairline tables, uppercase heads, pill tabs).

// --- formatting ----------------------------------------------------------------

export const pretty = (value: string | null | undefined) =>
  value ? value.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase()) : "-";

export function fmtDateTime(iso: string | null | undefined) {
  if (!iso) return "-";
  return new Date(iso).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });
}

export function fmtDate(iso: string | null | undefined) {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("en-GB", { dateStyle: "medium" });
}

export function naira(value: string | number | null | undefined) {
  const n = Number(value ?? 0);
  return `₦${n.toLocaleString("en-NG", { maximumFractionDigits: 0 })}`;
}

export function errorMessage(cause: unknown, fallback = "Something went wrong. Try again.") {
  return cause instanceof ApiError ? cause.message : fallback;
}

/** Matches components/ui/input, for native selects. */
export const fieldCls =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring md:text-sm";

// --- list state -------------------------------------------------------------------

/** Page, debounced search and filter values, turned into an API query. */
export function useListQuery(initial: Record<string, string> = {}) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>(initial);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);
  useEffect(() => setPage(1), [debounced, filters]);

  const query: OpsListQuery = { page, ...(debounced ? { search: debounced } : {}) };
  for (const [k, v] of Object.entries(filters)) if (v) query[k] = v;

  return {
    query,
    page,
    setPage,
    search,
    setSearch,
    filters,
    setFilter: (key: string, value: string) => setFilters((f) => ({ ...f, [key]: value })),
  };
}

/** A client-side subset of a page, shaped like the API's so ResourceTable counts it correctly. */
export function withResults<T>(page: Paginated<T>, results: T[]): Paginated<T> {
  return { ...page, results, count: results.length, next: null, previous: null };
}

// --- toolbar ---------------------------------------------------------------------------

export function PillTabs({
  tabs,
  value,
  onChange,
}: {
  tabs: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="max-w-full overflow-x-auto">
      <div className="inline-flex h-9 items-center rounded-full bg-muted p-1 text-muted-foreground">
        {tabs.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => onChange(t.value)}
            className={cn(
              "inline-flex shrink-0 items-center whitespace-nowrap rounded-full px-3 py-1 text-sm font-medium transition-all",
              value === t.value ? "bg-background text-foreground shadow" : "hover:text-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function SearchBox({
  value,
  onChange,
  placeholder = "Search",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="relative min-w-[220px] flex-1">
      <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(fieldCls, "pl-8")}
      />
    </label>
  );
}

export function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[] | string[];
  onChange: (v: string) => void;
}) {
  const opts = options.map((o) => (typeof o === "string" ? { value: o, label: pretty(o) } : o));
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(fieldCls, "w-auto")}
    >
      <option value="">{label}: All</option>
      {opts.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

const recordCount = (n: number) => `${n} record${n === 1 ? "" : "s"}`;

// --- table ---------------------------------------------------------------------------------

export type Column<T> = { header: string; cell: (row: T) => React.ReactNode; className?: string };

export function ResourceTable<T extends { id: string }>({
  columns,
  data,
  isLoading,
  error,
  page,
  onPage,
  onRowClick,
  empty = "Nothing here yet.",
}: {
  columns: Column<T>[];
  data: Paginated<T> | undefined;
  isLoading: boolean;
  error: unknown;
  page?: number;
  onPage?: (page: number) => void;
  onRowClick?: (row: T) => void;
  empty?: string;
}) {
  if (error)
    return (
      <p className="py-6 text-center text-sm text-destructive">
        {errorMessage(error, "Could not load this list.")}
      </p>
    );
  if (isLoading && !data)
    return <p className="py-6 text-center text-sm text-muted-foreground">Loading…</p>;
  const rows = data?.results ?? [];

  return (
    <div>
      <div className="-mx-5 overflow-x-auto px-5">
        <table className="w-full min-w-[720px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              {columns.map((c) => (
                <th
                  key={c.header}
                  className="px-2 py-2 text-[11px] font-semibold tracking-wide whitespace-nowrap text-muted-foreground uppercase"
                >
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.id}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(
                  "border-b border-border/60",
                  onRowClick && "cursor-pointer hover:bg-muted/50",
                )}
              >
                {columns.map((c) => (
                  <td
                    key={c.header}
                    className={cn("px-2 py-2.5 align-middle text-card-foreground", c.className)}
                  >
                    {c.cell(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">{empty}</p>
      ) : null}
      {data && onPage && page && (data.next || data.previous) ? (
        <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
          <span>{recordCount(data.count)}</span>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={!data.previous}
              onClick={() => onPage(page - 1)}
            >
              <ChevronLeft /> Previous
            </Button>
            <span>Page {page}</span>
            <Button
              size="sm"
              variant="outline"
              disabled={!data.next}
              onClick={() => onPage(page + 1)}
            >
              Next <ChevronRight />
            </Button>
          </div>
        </div>
      ) : data ? (
        <p className="mt-4 text-xs text-muted-foreground">{recordCount(data.count)}</p>
      ) : null}
    </div>
  );
}

// --- detail ---------------------------------------------------------------------------------

export function FieldGrid({ items }: { items: [string, React.ReactNode][] }) {
  return (
    <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
      {items.map(([label, value]) => (
        <div key={label}>
          <dt className="text-xs text-muted-foreground">{label}</dt>
          <dd className="mt-0.5 text-foreground">
            {value === "" || value === null || value === undefined ? "-" : value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

// --- dialog ---------------------------------------------------------------------------------

export function FormDialog({
  open,
  onClose,
  title,
  children,
  submitLabel,
  onSubmit,
  busy,
  error,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  submitLabel: string;
  onSubmit: () => void;
  busy?: boolean;
  error?: string;
}) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">{children}</div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={busy}>
            {busy ? "Saving…" : submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-sm leading-none font-medium text-foreground">{label}</span>
      {children}
    </label>
  );
}
