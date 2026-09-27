import { StatusBadge } from "./status-badge";
import { cn } from "@/lib/utils";

export type Column<T> = {
  key: string;
  header: string;
  render?: ((row: T) => React.ReactNode) | undefined;
  value?: ((row: T) => string) | undefined;
  badge?: boolean | undefined;
  mono?: boolean | undefined;
};

export function DataTable<T extends Record<string, unknown>>({
  columns,
  rows,
  actions,
  emptyMessage = "Nothing to show yet.",
}: {
  columns: Column<T>[];
  rows: T[];
  actions?: (row: T) => React.ReactNode | undefined;
  emptyMessage?: string | undefined;
}) {
  return (
    <div className="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
      <table className="w-full min-w-max border-collapse text-sm">
        <thead>
          <tr className="border-b border-border">
            {columns.map((c) => (
              <th
                key={c.key}
                className="whitespace-nowrap px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
              >
                {c.header}
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
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length + (actions ? 1 : 0)}
                className="px-3 py-8 text-center text-sm text-muted-foreground"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row, i) => (
              <tr
                key={i}
                className="border-b border-border/60 transition-colors last:border-0 hover:bg-secondary/40"
              >
                {columns.map((c) => {
                  const raw: string = c.value ? c.value(row) : String(row[c.key] ?? "-");
                  return (
                    <td
                      key={c.key}
                      className={cn(
                        "whitespace-nowrap px-3 py-2.5 align-middle",
                        c.mono && "beldium-mono text-muted-foreground",
                      )}
                    >
                      {c.render ? c.render(row) : c.badge ? <StatusBadge value={raw} /> : raw}
                    </td>
                  );
                })}
                {actions ? (
                  <td className="px-3 py-2.5 text-right">
                    <div className="flex justify-end gap-1.5">{actions(row)}</div>
                  </td>
                ) : null}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export function RowAction({
  children,
  disabled,
  title,
  onClick,
}: {
  children: React.ReactNode;
  disabled?: boolean | undefined;
  title?: string | undefined;
  onClick?: (() => unknown) | undefined;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      title={title}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      className={cn(
        "rounded-full border border-border px-2.5 py-1 text-xs font-medium transition-colors",
        disabled
          ? "cursor-not-allowed border-border/60 text-muted-foreground/60"
          : "text-foreground hover:border-primary/60 hover:bg-primary/10 hover:text-primary",
      )}
    >
      {children}
    </button>
  );
}

export function FieldGrid({ items }: { items: { label: string; value: React.ReactNode }[] }) {
  return (
    <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <div key={item.label} className="min-w-0">
          <dt className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {item.label}
          </dt>
          <dd className="mt-0.5 truncate text-sm text-foreground">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
