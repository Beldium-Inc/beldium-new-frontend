import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { StatusBadge } from "./status-badge";
import type { Target, TimelineEvent } from "@/lib/ops-store";
import { fmt } from "@/lib/ops-store";

/* ------------------------------------------------------------ navigation */

export function useOpenTarget() {
  const navigate = useNavigate();
  return (t: Target) => {
    switch (t.kind) {
      case "movement":
        return navigate({ to: "/portal/movements/$movementId", params: { movementId: t.id } });
      case "request":
        return navigate({
          to: "/portal/transport-requests/$requestId",
          params: { requestId: t.id },
        });
      case "vehicle":
        return navigate({ to: "/portal/vehicles/$vehicleId", params: { vehicleId: t.id } });
      case "driver":
        return navigate({ to: "/portal/drivers/$driverId", params: { driverId: t.id } });
      case "transaction":
        return navigate({ to: "/portal/transactions/$txnId", params: { txnId: t.id } });
      case "queue":
        return navigate({ to: t.path, search: t.tab ? { tab: t.tab } : {} });
    }
  };
}

export function IdLink({
  kind,
  id,
  className,
}: {
  kind: "movement" | "request" | "vehicle" | "driver" | "transaction";
  id?: string | undefined;
  className?: string | undefined;
}) {
  if (!id) return <span className="text-muted-foreground">-</span>;
  const cls = cn("font-semibold text-colorLink hover:underline", className);
  const stop = (e: React.MouseEvent) => e.stopPropagation();
  if (kind === "movement")
    return (
      <Link
        onClick={stop}
        to="/portal/movements/$movementId"
        params={{ movementId: id }}
        className={cls}
      >
        {id}
      </Link>
    );
  if (kind === "request")
    return (
      <Link
        onClick={stop}
        to="/portal/transport-requests/$requestId"
        params={{ requestId: id }}
        className={cls}
      >
        {id}
      </Link>
    );
  if (kind === "vehicle")
    return (
      <Link
        onClick={stop}
        to="/portal/vehicles/$vehicleId"
        params={{ vehicleId: id }}
        className={cls}
      >
        {id}
      </Link>
    );
  if (kind === "driver")
    return (
      <Link onClick={stop} to="/portal/drivers/$driverId" params={{ driverId: id }} className={cls}>
        {id}
      </Link>
    );
  return (
    <Link onClick={stop} to="/portal/transactions/$txnId" params={{ txnId: id }} className={cls}>
      {id}
    </Link>
  );
}

export const tabSearch = (s: Record<string, unknown>): { tab?: string } =>
  typeof s["tab"] === "string" ? { tab: s["tab"] } : {};

/* ------------------------------------------------------------ buttons */

export function Btn({
  children,
  onClick,
  variant = "primary",
  size = "default",
  disabled,
  title,
  type = "button",
  className,
}: {
  children: React.ReactNode;
  onClick?: (() => unknown) | undefined;
  variant?: "primary" | "outline" | "danger" | "ghost" | undefined;
  size?: "default" | "sm" | undefined;
  disabled?: boolean | undefined;
  title?: string | undefined;
  type?: "button" | "submit" | undefined;
  className?: string | undefined;
}) {
  // Miner Hub's pill Button; the variant names predate it and are mapped here.
  return (
    <Button
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={title}
      size={size}
      variant={variant === "primary" ? "default" : variant === "danger" ? "destructive" : variant}
      className={className}
    >
      {children}
    </Button>
  );
}

/* ------------------------------------------------------------ queue view */

export type QCol<T> = {
  key: string;
  header: string;
  render: (r: T) => React.ReactNode;
  sort?: ((r: T) => string | number) | undefined;
};
export type QTab<T> = { label: string; test: (r: T) => boolean };
export type QFilter<T> = { label: string; get: (r: T) => string };

export function QueueView<T>({
  rows,
  columns,
  tabs,
  initialTab,
  searchText,
  filters = [],
  onOpen,
  actions,
  getKey,
  empty = "No records in this queue.",
  toolbar,
}: {
  rows: T[];
  columns: QCol<T>[];
  tabs?: QTab<T>[] | undefined;
  initialTab?: string | undefined;
  searchText: (r: T) => string;
  filters?: QFilter<T>[] | undefined;
  onOpen?: ((r: T) => unknown) | undefined;
  actions?: (r: T) => React.ReactNode | undefined;
  getKey: (r: T) => string;
  empty?: string | undefined;
  toolbar?: React.ReactNode | undefined;
}) {
  const [tab, setTab] = useState(
    initialTab && tabs?.some((t) => t.label === initialTab) ? initialTab : tabs?.[0]?.label,
  );
  useEffect(() => {
    if (initialTab && tabs?.some((t) => t.label === initialTab)) setTab(initialTab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialTab]);
  const [q, setQ] = useState("");
  const [fv, setFv] = useState<Record<string, string>>({});
  const [sort, setSort] = useState<{ key: string; dir: 1 | -1 } | null>(null);

  const activeTab = tabs?.find((t) => t.label === tab);
  const filtered = useMemo(() => {
    let r = rows;
    if (activeTab) r = r.filter(activeTab.test);
    if (q.trim()) {
      const needle = q.trim().toLowerCase();
      r = r.filter((x) => searchText(x).toLowerCase().includes(needle));
    }
    for (const f of filters) {
      const v = fv[f.label];
      if (v) r = r.filter((x) => f.get(x) === v);
    }
    if (sort) {
      const col = columns.find((c) => c.key === sort.key);
      if (col?.sort) {
        const get = col.sort;
        r = [...r].sort((a, b) => {
          const x = get(a);
          const y = get(b);
          return (x > y ? 1 : x < y ? -1 : 0) * sort.dir;
        });
      }
    }
    return r;
  }, [rows, activeTab, q, fv, sort, filters, columns, searchText]);

  return (
    <div className="space-y-3">
      {tabs ? (
        <div className="max-w-full overflow-x-auto">
          <div className="inline-flex h-9 items-center rounded-full bg-muted p-1 text-muted-foreground">
          {tabs.map((t) => {
            const n = rows.filter(t.test).length;
            return (
              <button
                key={t.label}
                type="button"
                onClick={() => setTab(t.label)}
                className={cn(
                  "inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1 text-sm font-medium transition-all",
                  tab === t.label ? "bg-background text-foreground shadow" : "hover:text-foreground",
                )}
              >
                {t.label}
                <span
                  className={cn(
                    "rounded-full px-1.5 text-[10px]",
                    tab === t.label ? "bg-primary text-primary-foreground" : "bg-background/70",
                  )}
                >
                  {n}
                </span>
              </button>
            );
          })}
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap items-end gap-2">
        <label className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search"
            className={cn(fieldCls, "pl-8")}
          />
        </label>
        {filters.map((f) => {
          const opts = Array.from(new Set(rows.map(f.get)))
            .filter(Boolean)
            .sort();
          return (
            <select
              key={f.label}
              value={fv[f.label] ?? ""}
              onChange={(e) => setFv({ ...fv, [f.label]: e.target.value })}
              className={cn(fieldCls, "w-auto")}
              aria-label={f.label}
            >
              <option value="">{f.label}: All</option>
              {opts.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          );
        })}
        {toolbar}
        <span className="ml-auto text-xs font-semibold text-muted-foreground">
          {filtered.length} record{filtered.length === 1 ? "" : "s"}
        </span>
      </div>

      <div className="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
        <table className="w-full min-w-max border-collapse text-sm">
          <thead>
            <tr className="border-b border-border">
              {columns.map((c) => (
                <th
                  key={c.key}
                  className="whitespace-nowrap px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  {c.sort ? (
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 uppercase hover:text-primary"
                      onClick={() =>
                        setSort(
                          sort?.key === c.key
                            ? { key: c.key, dir: sort.dir === 1 ? -1 : 1 }
                            : { key: c.key, dir: 1 },
                        )
                      }
                    >
                      {c.header}
                      {sort?.key === c.key ? (
                        sort.dir === 1 ? (
                          <ArrowUp className="size-3" />
                        ) : (
                          <ArrowDown className="size-3" />
                        )
                      ) : null}
                    </button>
                  ) : (
                    c.header
                  )}
                </th>
              ))}
              {actions ? (
                <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Actions
                </th>
              ) : null}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (actions ? 1 : 0)}
                  className="px-3 py-8 text-center text-sm text-muted-foreground"
                >
                  {empty}
                </td>
              </tr>
            ) : (
              filtered.map((r) => (
                <tr
                  key={getKey(r)}
                  onClick={onOpen ? () => onOpen(r) : undefined}
                  className={cn(
                    "border-b border-border/60 last:border-0 hover:bg-secondary/40",
                    onOpen && "cursor-pointer",
                  )}
                >
                  {columns.map((c) => (
                    <td key={c.key} className="whitespace-nowrap px-3 py-2.5 align-middle">
                      {c.render(r)}
                    </td>
                  ))}
                  {actions ? (
                    <td className="px-3 py-2.5 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-1.5">{actions(r)}</div>
                    </td>
                  ) : null}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ modal */

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode | undefined;
  wide?: boolean | undefined;
}) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className={cn("max-h-[90vh] overflow-y-auto", wide ? "sm:max-w-2xl" : "sm:max-w-lg")}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {children}
        {footer ? <DialogFooter className="gap-2">{footer}</DialogFooter> : null}
      </DialogContent>
    </Dialog>
  );
}

export function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-sm font-medium leading-none text-foreground">{label}</span>
      {children}
    </label>
  );
}
/** Matches components/ui/input, for native inputs and selects. */
export const fieldCls =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring md:text-sm";

/* ------------------------------------------------------------ timeline */

export function Timeline({
  events,
  newestFirst = true,
}: {
  events: TimelineEvent[];
  newestFirst?: boolean;
}) {
  const list = newestFirst ? [...events].reverse() : events;
  if (!list.length) return <p className="text-sm text-muted-foreground">No events yet.</p>;
  return (
    <ol className="relative space-y-4 border-l border-border pl-5">
      {list.map((e, i) => (
        <li key={i} className="relative">
          <span className="absolute -left-[26px] top-1.5 size-2.5 rounded-full bg-primary ring-4 ring-card" />
          <div className="flex flex-wrap items-baseline gap-x-2">
            <span className="beldium-mono font-semibold text-primary">{fmt(e.at)}</span>
            <span className="text-sm font-medium text-foreground">{e.event}</span>
          </div>
          <p className="beldium-small">
            {[
              e.actor,
              e.location,
              e.gps ? `GPS ${e.gps}` : null,
              e.quantity,
              e.evidence,
              `via ${e.source}`,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </li>
      ))}
    </ol>
  );
}

export function Stages({ stages, current }: { stages: string[]; current: string }) {
  const idx = stages.indexOf(current);
  return (
    <ol className="flex flex-wrap gap-2">
      {stages.map((s, i) => (
        <li
          key={s}
          className={cn(
            "rounded-full border px-3 py-1 text-[11px] font-medium",
            i < idx && "border-success/40 bg-success/10 text-success",
            i === idx && "border-primary bg-primary text-primary-foreground",
            i > idx && "border-border text-muted-foreground",
          )}
        >
          {i + 1}. {s}
        </li>
      ))}
    </ol>
  );
}

export function Badge({ v }: { v: string }) {
  return <StatusBadge value={v} />;
}

export function WorkspaceTabs({
  tabs,
  value,
  onChange,
}: {
  tabs: string[];
  value: string;
  onChange: (t: string) => void;
}) {
  // Same look as components/ui/tabs (Miner Hub's pill tab list).
  return (
    <div className="mb-4 max-w-full overflow-x-auto">
      <div className="inline-flex h-9 items-center rounded-full bg-muted p-1 text-muted-foreground">
        {tabs.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => onChange(t)}
            className={cn(
              "inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-full px-3 py-1 text-sm font-medium transition-all",
              value === t ? "bg-background text-foreground shadow" : "hover:text-foreground",
            )}
          >
            {t}
          </button>
        ))}
      </div>
    </div>
  );
}
