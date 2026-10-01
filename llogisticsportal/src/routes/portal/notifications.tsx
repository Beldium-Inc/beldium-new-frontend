import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import {
  PillTabs,
  ResourceTable,
  fmtDateTime,
  useListQuery,
  type Column,
} from "@/components/beldium/ops";
import { PageHeader } from "@/components/beldium/shell";
import { Panel } from "@/components/beldium/stat-card";
import { Button } from "@/components/ui/button";
import { listNotifications, markNotificationRead, type Notification } from "@/lib/api/logistics";
import { listOperationsEvents, type OperationsEvent } from "@/lib/api/operations";
import {
  useMarkEventRead,
  useOperationsDashboard,
  useOpsList,
  useOpsMutation,
} from "@/lib/api/operations-queries";
import { cn } from "@/lib/utils";
import { isVerified, useWorkspace } from "@/lib/workspace";

export const Route = createFileRoute("/portal/notifications")({
  head: () => ({ meta: [{ title: "Notifications - Beldium Logistics Hub" }] }),
  component: NotificationsPage,
});

function NotificationsPage() {
  const { record } = useWorkspace();
  const verified = isVerified(record?.stage);
  const stats = useOperationsDashboard({ enabled: verified }).data?.stats;
  const count = (n: number | undefined) => (n ? ` (${n})` : "");
  const [view, setView] = useState("compliance");
  const complianceList = useListQuery();
  const eventList = useListQuery();
  const notifications = useOpsList("notifications", listNotifications, complianceList.query, {
    enabled: view === "compliance",
  });
  const events = useOpsList("operations-events", listOperationsEvents, eventList.query, {
    enabled: view === "operations",
  });
  const markNotification = useOpsMutation((id: string) => markNotificationRead(id));
  const markEvent = useMarkEventRead();

  const notificationColumns: Column<Notification>[] = [
    {
      header: "Notification",
      cell: (n) => (
        <div className="flex gap-2">
          <span
            className={cn(
              "mt-1.5 size-2 shrink-0 rounded-full",
              n.read_at ? "bg-border" : "bg-primary",
            )}
          />
          <div>
            <div className={cn("text-sm", !n.read_at && "font-medium")}>{n.title}</div>
            <div className="text-xs text-muted-foreground">{n.body}</div>
          </div>
        </div>
      ),
    },
    { header: "Received", cell: (n) => fmtDateTime(n.created_at) },
    {
      header: "",
      cell: (n) =>
        n.read_at ? null : (
          <Button
            size="sm"
            variant="ghost"
            disabled={markNotification.isPending}
            onClick={() => markNotification.mutate(n.id)}
          >
            Mark read
          </Button>
        ),
    },
  ];

  const eventColumns: Column<OperationsEvent>[] = [
    {
      header: "Event",
      cell: (e) => (
        <div className="flex gap-2">
          <span
            className={cn(
              "mt-1.5 size-2 shrink-0 rounded-full",
              e.unread ? "bg-primary" : "bg-border",
            )}
          />
          <span className={cn("text-sm", e.unread && "font-medium")}>{e.text}</span>
        </div>
      ),
    },
    { header: "Sector", cell: (e) => e.sector },
    { header: "Type", cell: (e) => e.event_type || "-" },
    { header: "When", cell: (e) => fmtDateTime(e.occurred_at) },
    {
      header: "",
      cell: (e) =>
        e.unread ? (
          <Button
            size="sm"
            variant="ghost"
            disabled={markEvent.isPending}
            onClick={() => markEvent.mutate(e.id)}
          >
            Mark read
          </Button>
        ) : null,
    },
  ];

  return (
    <>
      <PageHeader
        title="Notifications"
        description="Messages from Beldium Logistics Compliance and activity across your operations."
      />
      <Panel title="Inbox">
        <div className="space-y-4">
          {verified ? (
            <PillTabs
              tabs={[
                { value: "compliance", label: `Compliance${count(stats?.unread_notifications)}` },
                {
                  value: "operations",
                  label: `Operations activity${count(stats?.unread_events)}`,
                },
              ]}
              value={view}
              onChange={setView}
            />
          ) : null}
          {view === "compliance" ? (
            <ResourceTable
              columns={notificationColumns}
              data={notifications.data}
              isLoading={notifications.isLoading}
              error={notifications.error}
              page={complianceList.page}
              onPage={complianceList.setPage}
              empty="No notifications."
            />
          ) : (
            <ResourceTable
              columns={eventColumns}
              data={events.data}
              isLoading={events.isLoading}
              error={events.error}
              page={eventList.page}
              onPage={eventList.setPage}
              empty="No activity yet."
            />
          )}
        </div>
      </Panel>
    </>
  );
}
