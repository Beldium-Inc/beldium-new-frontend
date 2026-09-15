import { createFileRoute } from "@tanstack/react-router";
import { Bell, BellOff } from "lucide-react";

import { PageHeader } from "@/components/miner-shell";
import { Button } from "@/components/ui/button";
import { useMiner } from "@/lib/miner-store";
import { cn } from "@/lib/utils";

const title = "Notifications — Beldium Miner Hub";
const description = "Verification updates, information requests, compliance reminders and inspection notices.";

export const Route = createFileRoute("/portal/notifications")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: NotificationsPage,
});

function NotificationsPage() {
  const { state, markNotificationsRead } = useMiner();
  const unread = state.notifications.filter((n) => !n.read).length;

  return (
    <>
      <PageHeader
        title="Notifications"
        description={unread ? `${unread} unread` : "You are up to date"}
        actions={
          <Button variant="outline" size="sm" disabled={!unread} onClick={() => markNotificationsRead()}>
            Mark all as read
          </Button>
        }
      />

      <ul className="divide-y divide-border rounded-md border border-border bg-card">
        {state.notifications.map((n) => (
          <li key={n.id} className={cn("flex gap-3 px-5 py-4", !n.read && "bg-accent/5")}>
            {n.read ? (
              <BellOff className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            ) : (
              <Bell className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
            )}
            <div>
              <div className="text-sm font-medium text-card-foreground">{n.title}</div>
              <p className="mt-0.5 text-sm text-muted-foreground">{n.body}</p>
              <div className="mt-1 text-xs text-muted-foreground">{n.at}</div>
            </div>
          </li>
        ))}
        {state.notifications.length === 0 ? (
          <li className="px-5 py-8 text-center text-sm text-muted-foreground">No notifications yet.</li>
        ) : null}
      </ul>
    </>
  );
}
