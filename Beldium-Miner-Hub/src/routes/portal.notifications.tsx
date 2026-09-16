import { createFileRoute } from "@tanstack/react-router";
import { Bell } from "lucide-react";

import { PageHeader } from "@/components/miner-shell";
import { useMiningDashboard } from "@/lib/api/mining-queries";

const title = "Notifications — Beldium Miner Hub";
const description = "Verification updates, information requests and compliance reminders.";

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
  const dashboard = useMiningDashboard();
  const notifications = dashboard.data?.notifications ?? [];

  return (
    <>
      <PageHeader title="Notifications" description="Recent activity across your applications, sites and reviews." />

      <ul className="divide-y divide-border rounded-md border border-border bg-card">
        {notifications.map((n) => (
          <li key={n.id} className="flex gap-3 px-5 py-4">
            <Bell className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
            <div>
              <div className="text-sm font-medium text-card-foreground">{n.title}</div>
              <p className="mt-0.5 text-sm text-muted-foreground">{n.body}</p>
              <div className="mt-1 text-xs text-muted-foreground">{n.at}</div>
            </div>
          </li>
        ))}
        {notifications.length === 0 ? (
          <li className="px-5 py-8 text-center text-sm text-muted-foreground">No notifications yet.</li>
        ) : null}
      </ul>
    </>
  );
}
