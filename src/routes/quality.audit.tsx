import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";

import { ApiError } from "@/lib/api/errors";
import type { AuditEntry, AuditLogQuery } from "@/lib/api/quality-admin";
import { useAuditLog } from "@/lib/api/quality-admin-queries";
import { ServerPager } from "@/components/shared/server-pager";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AppShell } from "@/verticals/quality/shell";
import { useBeldium } from "@/verticals/quality/store";
import { EmptyState, PageHeader, Pill, SectionTitle, Surface } from "@/verticals/quality/ui";

export const Route = createFileRoute("/quality/audit")({
  head: () => ({
    meta: [
      { title: "Audit trail | Beldium Quality & Control" },
      {
        name: "description",
        content: "Append only record of every Q&C action, refused attempts included.",
      },
    ],
  }),
  component: () => (
    <AppShell>
      <AuditPage />
    </AppShell>
  ),
});

const RECORD_TYPES = [
  "",
  "sample",
  "verification_certificate",
  "quality_application",
  "ncr_capa",
  "users_and_roles",
  "setting",
  "audit_log",
];

function AuditPage() {
  const { canDo } = useBeldium();
  const allowed = canDo("audit_log", "read");
  const [draft, setDraft] = React.useState<AuditLogQuery>({ outcome: "", record_type: "" });
  const [query, setQuery] = React.useState<AuditLogQuery>({ page: 1 });
  const log = useAuditLog(query, allowed);

  if (!allowed) {
    return (
      <Surface>
        <EmptyState
          title="Your role does not have access to the audit log"
          hint="Q&C, the CEO, the Technical Lead and Legal read it. Beldium Admin does not (decision 8)."
        />
      </Surface>
    );
  }

  const apply = () => setQuery({ ...draft, page: 1 });

  return (
    <>
      <PageHeader
        eyebrow="Evidence"
        title="Audit trail"
        description="Every Q&C action is written once and never changed, including refused attempts. Reading this log is itself recorded."
      />

      <Surface>
        <SectionTitle title="Filter" hint="At most 366 days per search." />
        <form
          className="grid gap-3 p-6 md:grid-cols-3 xl:grid-cols-6"
          onSubmit={(event) => {
            event.preventDefault();
            apply();
          }}
        >
          <select
            aria-label="Record type"
            value={draft.record_type ?? ""}
            onChange={(e) => setDraft({ ...draft, record_type: e.target.value })}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            {RECORD_TYPES.map((type) => (
              <option key={type} value={type}>
                {type ? type.replace(/_/g, " ") : "All records"}
              </option>
            ))}
          </select>
          <select
            aria-label="Outcome"
            value={draft.outcome ?? ""}
            onChange={(e) =>
              setDraft({ ...draft, outcome: e.target.value as "" | "success" | "refused" })
            }
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">All outcomes</option>
            <option value="success">Done</option>
            <option value="refused">Refused</option>
          </select>
          <Input
            aria-label="Record id"
            placeholder="Record id"
            value={draft.record_id ?? ""}
            onChange={(e) => setDraft({ ...draft, record_id: e.target.value })}
          />
          <Input
            aria-label="From"
            type="date"
            value={draft.from ?? ""}
            onChange={(e) => setDraft({ ...draft, from: e.target.value })}
          />
          <Input
            aria-label="To"
            type="date"
            value={draft.to ?? ""}
            onChange={(e) => setDraft({ ...draft, to: e.target.value })}
          />
          <Button type="submit">Search</Button>
        </form>
      </Surface>

      <Surface className="mt-6">
        <SectionTitle title="Entries" hint="Newest first" />
        {log.isPending ? (
          <EmptyState title="Loading…" />
        ) : log.isError ? (
          <EmptyState
            title={
              log.error instanceof ApiError ? log.error.message : "The log could not be loaded."
            }
          />
        ) : log.data.results.length === 0 ? (
          <EmptyState title="No matching entries" />
        ) : (
          <div className="divide-y divide-border">
            {log.data.results.map((entry) => (
              <EntryRow key={entry.id} entry={entry} />
            ))}
          </div>
        )}
        {log.data ? (
          <ServerPager
            page={query.page ?? 1}
            count={log.data.count}
            hasNext={Boolean(log.data.next)}
            busy={log.isFetching}
            onPage={(page) => setQuery({ ...query, page })}
          />
        ) : null}
      </Surface>
    </>
  );
}

function EntryRow({ entry }: { entry: AuditEntry }) {
  const [open, setOpen] = React.useState(false);
  const hasChange = entry.before !== null || entry.after !== null;
  return (
    <div className="px-6 py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-navy">{entry.action}</p>
            <Pill tone={entry.outcome === "refused" ? "danger" : "success"}>
              {entry.outcome === "refused" ? "Refused" : "Done"}
            </Pill>
            {entry.actor_role_code ? <Pill tone="neutral">{entry.actor_role_code}</Pill> : null}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {entry.record_label || entry.record_id || entry.record_type || "No record"}
            {entry.reason ? ` · ${entry.reason}` : ""}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-navy">{entry.actor_name || "System"}</p>
          <p className="text-xs text-muted-foreground">
            {new Date(entry.occurred_at).toLocaleString()} · {entry.ip_address || "no address"}
          </p>
        </div>
      </div>
      {hasChange ? (
        <button
          className="mt-2 text-xs font-medium text-link underline"
          onClick={() => setOpen(!open)}
        >
          {open ? "Hide change" : "Show change"}
        </button>
      ) : null}
      {open ? (
        <div className="mt-2 grid gap-2 md:grid-cols-2">
          <pre className="overflow-auto rounded-lg bg-muted p-3 text-xs">
            Before: {JSON.stringify(entry.before, null, 2)}
          </pre>
          <pre className="overflow-auto rounded-lg bg-muted p-3 text-xs">
            After: {JSON.stringify(entry.after, null, 2)}
          </pre>
        </div>
      ) : null}
    </div>
  );
}
