import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, Bell, CheckCircle2, HardHat } from "lucide-react";

import { PageHeader } from "@/components/miner-shell";
import { useMiningDashboard } from "@/lib/api/mining-queries";

const title = "Notifications - Beldium Miner Hub";
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
      <PageHeader
        title="Notifications"
        description="Requests, flags, inspections and decisions from the compliance desk across your applications and sites."
      />

      <ul className="divide-y divide-border rounded-md border border-border bg-card">
        {notifications.map((n) => {
          const Icon =
            n.entity === "inspection"
              ? HardHat
              : n.kind === "success"
                ? CheckCircle2
                : n.kind === "info"
                  ? Bell
                  : AlertTriangle;
          const tone =
            n.kind === "error"
              ? "text-destructive"
              : n.kind === "warn"
                ? "text-warning"
                : n.kind === "success"
                  ? "text-success"
                  : "text-accent";
          const to =
            n.entity === "info_request"
              ? "/portal/requests"
              : n.entity === "non_conformity"
                ? "/portal/corrective-actions"
                : n.entity === "review_section"
                  ? "/portal/sites"
                  : null;
          return (
            <li key={n.id} className="flex gap-3 px-5 py-4">
              <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${tone}`} />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-card-foreground">{n.title}</div>
                <p className="mt-0.5 text-sm text-muted-foreground">{n.body}</p>
                <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <span>{n.at ? new Date(n.at).toLocaleString() : ""}</span>
                  {to ? (
                    <Link to={to} className="font-medium text-accent hover:underline">
                      {n.entity === "info_request" ? "Respond" : "View"}
                    </Link>
                  ) : null}
                </div>
              </div>
            </li>
          );
        })}
        {notifications.length === 0 ? (
          <li className="px-5 py-8 text-center text-sm text-muted-foreground">
            No notifications yet.
          </li>
        ) : null}
      </ul>
    </>
  );
}
