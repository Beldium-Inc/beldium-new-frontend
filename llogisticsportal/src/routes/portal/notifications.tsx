import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "@/components/beldium/shell";
import { Panel } from "@/components/beldium/stat-card";
import { StatusBadge } from "@/components/beldium/status-badge";
import { RowAction } from "@/components/beldium/data-table";
import { Btn, QueueView, tabSearch, useOpenTarget } from "@/components/beldium/ops-ui";
import { cn } from "@/lib/utils";
import { fmt, markAllRead, markRead, useOps, type Notification } from "@/lib/ops-store";

export const Route = createFileRoute("/portal/notifications")({
  validateSearch: tabSearch,
  head: () => ({
    meta: [
      { title: "Notifications - Beldium Logistics Hub" },
      { name: "description", content: "Notification centre for requests, assignments, pickups, deliveries, incidents, compliance and payments." },
      { property: "og:title", content: "Notifications - Beldium Logistics Hub" },
      { property: "og:description", content: "Every logistics event that needs your attention." },
    ],
  }),
  component: Page,
});

function Page() {
  const s = useOps();
  const { tab } = Route.useSearch();
  const open = useOpenTarget();
  const unread = s.notifications.filter((n) => !n.read).length;
  const go = (n: Notification) => {
    markRead(n.id);
    open(n.target);
  };
  return (
    <>
      <PageHeader title="Notifications">
        <Btn variant="outline" disabled={unread === 0} onClick={markAllRead}>
          Mark All Read
        </Btn>
      </PageHeader>
      <Panel title="Notification Centre">
        <QueueView
          rows={s.notifications}
          getKey={(n) => n.id}
          initialTab={tab ?? "Unread"}
          tabs={[
            { label: "Unread", test: (n) => !n.read },
            { label: "All", test: () => true },
            { label: "Read", test: (n) => n.read },
          ]}
          columns={[
            { key: "at", header: "Time", render: (n) => <span className="beldium-mono">{fmt(n.at)}</span>, sort: (n) => n.at },
            { key: "cat", header: "Category", render: (n) => <StatusBadge value={n.category} tone="default" /> },
            {
              key: "title",
              header: "Notification",
              render: (n) => (
                <span className="flex items-start gap-2">
                  <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", n.read ? "bg-border" : "bg-colorLink")} />
                  <span>
                    <span className={cn("block text-sm", !n.read && "font-semibold")}>{n.title}</span>
                    <span className="beldium-small">{n.body}</span>
                  </span>
                </span>
              ),
            },
          ]}
          searchText={(n) => `${n.title} ${n.body} ${n.category}`}
          filters={[{ label: "Category", get: (n) => n.category }]}
          onOpen={go}
          actions={(n) => (
            <>
              <RowAction onClick={() => go(n)}>Open</RowAction>
              {!n.read ? <RowAction onClick={() => markRead(n.id)}>Mark Read</RowAction> : null}
            </>
          )}
        />
      </Panel>
    </>
  );
}
