import { createFileRoute } from "@tanstack/react-router";
import { Bell, CheckCheck } from "lucide-react";
import { AppShell } from "@/components/beldium/AppShell";
import { PageHeader, Panel, Pill } from "@/components/beldium/bits";
import { useApp } from "@/lib/app-state";

export const Route = createFileRoute("/regulator/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — Beldium Regulatory Portal" },
      { name: "description", content: "Regulatory notices published by Beldium continuous compliance monitoring." },
      { property: "og:title", content: "Notifications — Beldium Regulatory Portal" },
      { property: "og:description", content: "Compliance notices for regulatory oversight." },
    ],
  }),
  component: RegulatorNotifications,
});

function RegulatorNotifications() {
  const { notifications, markNotificationRead, markAllRead } = useApp();
  const list = notifications.filter((n) => n.audience.includes("regulator"));

  return (
    <AppShell role="regulator" breadcrumbs={[{ label: "Regulatory Oversight", to: "/regulator" }, { label: "Notifications" }]}>
      <PageHeader
        title="Notifications"
        description="Notices shared with regulatory stakeholders."
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
                  <Pill tone={n.tone === "critical" ? "danger" : n.tone === "warning" ? "warning" : n.tone === "success" ? "success" : "info"}>{n.tone}</Pill>
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
