import { createFileRoute } from "@tanstack/react-router";
import { useMiner } from "@/verticals/miner/store";
import { PageHeader, Panel, EmptyState } from "@/verticals/miner/components/primitives";
import { Chip } from "@/verticals/miner/components/chips";

export const Route = createFileRoute("/miner/notifications")({ component: NotificationsPage });

function NotificationsPage() {
  const { notifications } = useMiner();
  return (
    <>
      <PageHeader title="Notifications" description="Updates and alerts about your organisation and sites." />
      <Panel bodyClassName="p-0">
        {notifications.length === 0 ? (
          <div className="p-6">
            <EmptyState title="No notifications yet" />
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {notifications.map((n) => (
              <li key={n.id} className="flex items-start justify-between gap-3 px-5 py-4">
                <div>
                  <p className="text-sm font-medium">{n.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{n.body}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground/70">{n.at}</p>
                </div>
                <Chip
                  tone={
                    n.tone === "positive" ? "success" : n.tone === "negative" ? "danger" : n.tone === "warning" ? "warning" : "neutral"
                  }
                >
                  {n.read ? "Read" : "New"}
                </Chip>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
}
