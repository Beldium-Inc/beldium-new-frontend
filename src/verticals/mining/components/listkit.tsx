// Shared parts for the mining register pages (reviews, documents, inspections,
// sampling, ...), so every list has the same search, site filter, loading and
// empty states, and the same notion of "can this person change things".

import { useMemo, useState, type ReactNode } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiFetchBlob } from "@/lib/api/client";
import { apiUrl } from "@/lib/api/config";
import { useMiningCapabilities } from "@/lib/api/mining-queries";
import { useStore } from "@/verticals/mining/store";
import type { Role } from "@/verticals/mining/types";
import { EmptyState, Panel } from "./primitives";

export const ALL = "__all__";

/** Site id -> display name, from the sites the caller can see. */
export function useSiteNames(): (siteId: string) => string {
  const { sites } = useStore();
  const byId = useMemo(() => new Map(sites.map((s) => [s.id, s.name])), [sites]);
  return (siteId: string) => byId.get(siteId) ?? "Unknown site";
}

/**
 * What the current role may do on a register page. The server enforces all of
 * it again; this only decides which buttons to show.
 */
export function useMiningPermissions(): {
  role: Role | null;
  isDesk: boolean;
  isMiner: boolean;
  isRegulator: boolean;
  canDecide: boolean;
} {
  const { role } = useStore();
  const capabilities = useMiningCapabilities();
  const isMiner = role === "miner";
  const isRegulator = role === "regulator";
  const isDesk = role === "partner";
  return {
    role,
    isDesk,
    isMiner,
    isRegulator,
    canDecide: isDesk && (capabilities.data?.can_decide ?? true),
  };
}

export interface ListFilters {
  search: string;
  siteId: string;
  status: string;
}

/** Search box, site picker and an optional status picker, held in local state. */
export function useListFilters(): [ListFilters, (patch: Partial<ListFilters>) => void] {
  const [filters, setFilters] = useState<ListFilters>({ search: "", siteId: ALL, status: ALL });
  return [filters, (patch) => setFilters((f) => ({ ...f, ...patch }))];
}

export function matchesFilters(
  filters: ListFilters,
  row: { siteId?: string; status?: string },
  haystack: (string | undefined | null)[],
): boolean {
  if (filters.siteId !== ALL && row.siteId !== filters.siteId) return false;
  if (filters.status !== ALL && row.status !== filters.status) return false;
  const q = filters.search.trim().toLowerCase();
  if (!q) return true;
  return haystack.some((h) => (h ?? "").toLowerCase().includes(q));
}

export function ListToolbar({
  filters,
  onChange,
  statuses,
  placeholder = "Search",
  showSite = true,
  children,
}: {
  filters: ListFilters;
  onChange: (patch: Partial<ListFilters>) => void;
  statuses?: readonly string[];
  placeholder?: string;
  showSite?: boolean;
  children?: ReactNode;
}) {
  const { sites } = useStore();
  return (
    <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
      <div className="relative sm:w-72">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={filters.search}
          onChange={(e) => onChange({ search: e.target.value })}
          placeholder={placeholder}
          className="pl-8"
          aria-label={placeholder}
        />
      </div>
      {showSite && sites.length > 1 && (
        <Select value={filters.siteId} onValueChange={(siteId) => onChange({ siteId })}>
          <SelectTrigger className="sm:w-56" aria-label="Filter by site">
            <SelectValue placeholder="All sites" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All sites</SelectItem>
            {sites.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      {statuses && statuses.length > 0 && (
        <Select value={filters.status} onValueChange={(status) => onChange({ status })}>
          <SelectTrigger className="sm:w-48" aria-label="Filter by status">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All statuses</SelectItem>
            {statuses.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      {children && <div className="flex flex-wrap gap-2 sm:ml-auto">{children}</div>}
    </div>
  );
}

/** Loading and empty states every register page shares. */
export function ListState({
  loading,
  error,
  empty,
  emptyTitle,
  emptyDescription,
  children,
}: {
  loading?: boolean;
  error?: unknown;
  empty: boolean;
  emptyTitle: string;
  emptyDescription?: string | undefined;
  children: ReactNode;
}) {
  if (loading) {
    return (
      <Panel>
        <p className="py-6 text-center text-sm text-muted-foreground">Loading…</p>
      </Panel>
    );
  }
  if (error) {
    return (
      <Panel>
        <EmptyState
          title="This list could not be loaded"
          description={error instanceof Error ? error.message : "Please refresh and try again."}
        />
      </Panel>
    );
  }
  if (empty) {
    return (
      <Panel>
        <EmptyState
          title={emptyTitle}
          {...(emptyDescription ? { description: emptyDescription } : {})}
        />
      </Panel>
    );
  }
  return <>{children}</>;
}

/** "2026-11-10T09:30:00Z" -> "10 Nov 2026". Leaves "—" for blanks. */
export function fmtDate(value: string | null | undefined): string {
  if (!value) return "—";
  const t = Date.parse(value.length === 10 ? `${value}T00:00:00` : value);
  if (Number.isNaN(t)) return value;
  return new Date(t).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function fmtNumber(value: string | number | null | undefined, digits = 2): string {
  if (value === null || value === undefined || value === "") return "—";
  const n = typeof value === "number" ? value : Number(value);
  if (Number.isNaN(n)) return String(value);
  return n.toLocaleString("en-GB", { maximumFractionDigits: digits });
}

/** Turn any thrown value into a message for a toast. */
export function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : "Please try again.";
}

/**
 * Open a protected file (licence, document) in a new tab. A plain link would
 * arrive without the bearer token, so fetch it as a blob first.
 */
export async function openProtectedFile(path: string, filename?: string): Promise<void> {
  const blob = await apiFetchBlob(apiUrl(path));
  const url = URL.createObjectURL(blob);
  const opened = window.open(url, "_blank", "noopener");
  if (!opened) {
    const a = document.createElement("a");
    a.href = url;
    a.download = filename ?? "document";
    a.click();
  }
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

/** Choose one of the sites the caller can see. */
export function SitePicker({
  value,
  onChange,
  id = "site",
}: {
  value: string;
  onChange: (v: string) => void;
  id?: string;
}) {
  const { sites } = useStore();
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger id={id}>
        <SelectValue placeholder="Choose a site" />
      </SelectTrigger>
      <SelectContent>
        {sites.map((s) => (
          <SelectItem key={s.id} value={s.id}>
            {s.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
