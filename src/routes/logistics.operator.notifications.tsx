import { createFileRoute } from "@tanstack/react-router";
import { Bell, CheckCheck } from "lucide-react";
import { AppShell } from "@/verticals/logistics/AppShell";
import { PageHeader, Panel, Pill } from "@/verticals/logistics/bits";
import { useApp } from "@/verticals/logistics/store";

export const Route = createFileRoute("/logistics/operator/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications | Beldium Compliance Operations" },
      { name: "description", content: "Platform alerts for compliance operators: new applications, expiries and SLA risks." },
      { property: "og:title", content: "Notifications | Beldium Compliance Operations" },
      { property: "og:description", content: "Compliance alerts and monitoring notices." },
    ],
  }),
  component: NotificationsPage,
});

function NotificationsPage() {
  const { notifications, markNotificationRead, markAllRead } = useApp();
  const list = notifications.filter((n) => n.audience.includes("operator"));

  return (
    <AppShell role="operator" breadcrumbs={[{ label: "Compliance Operations", to: "/logistics/operator" }, { label: "Notifications" }]}>
      <PageHeader
        title="Notifications"
        description="Continuous monitoring alerts and workflow updates."
        actions={
          <button
            type="button"
            onClick={markAllRead}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-white px-3 py-2 text-xs font-medium text-[var(--brand)] hover:border-[var(--link)]/50"
          >
            <CheckCheck className="h-3.5 w-3.5" /> Mark all read
          </button>
        }
      />
      <Panel bodyClassName="p-0">
        <ul className="divide-y divide-border">
          {list.map((n) => (
            <li key={n.id} className={"flex gap-3 px-5 py-4 " + (n.read ? "" : "bg-[var(--brand-soft)]/30")}>
              <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-muted text-[var(--brand)]">
                <Bell className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium text-[var(--brand)]">{n.title}</p>
                  <Pill tone={n.tone === "critical" ? "danger" : n.tone === "warning" ? "warning" : n.tone === "success" ? "success" : "info"}>
                    {n.tone}
                  </Pill>
                  <span className="ml-auto text-xs text-muted-foreground">{n.at}</span>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">{n.body}</p>
              </div>
              {!n.read ? (
                <button type="button" onClick={() => markNotificationRead(n.id)} className="self-start text-xs font-medium text-[var(--link)] hover:underline">
                  Mark read
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      </Panel>
    </AppShell>
  );
}
