import { createFileRoute } from "@tanstack/react-router";
import { Bell, Mail, MessageSquareText } from "lucide-react";
import { AppShell, Button, SectionCard } from "@/verticals/marketplace/AppShell";
import { fmtDateTime, useDemo } from "@/verticals/marketplace/store";

export const Route = createFileRoute("/marketplace/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications | Beldium Marketplace" },
      { name: "description", content: "In-app, email and SMS notifications across compliance decisions, RFQ aggregation and shipments." },
      { property: "og:title", content: "Notifications | Beldium Marketplace" },
      { property: "og:description", content: "Multi-channel notification log for your role." },
    ],
  }),
  component: Notifications,
});

function Notifications() {
  const { state, markAllRead } = useDemo();
  const items = state.notifications.filter((n) => n.audience === state.role || n.audience === "all");

  return (
    <AppShell
      title="Notifications"
      subtitle="Distributed via in-app, email and SMS"
      actions={
        <Button variant="outline" size="sm" onClick={markAllRead}>
          Mark all read
        </Button>
      }
    >
      <SectionCard title="Inbox" description={`${items.length} message(s)`}>
        <ul className="space-y-3">
          {items.map((n) => (
            <li
              key={n.id}
              className={`flex gap-3 rounded-md border p-3 ${n.read ? "border-border" : "border-primary/40 bg-secondary/30"}`}
            >
              <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-secondary text-primary">
                {n.channel === "sms" ? (
                  <MessageSquareText className="size-4" />
                ) : n.channel === "email" ? (
                  <Mail className="size-4" />
                ) : (
                  <Bell className="size-4" />
                )}
              </span>
              <div>
                <p className="text-sm font-medium">{n.title}</p>
                <p className="text-sm text-muted-foreground">{n.body}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {n.channel === "in_app" ? "In-app" : n.channel.toUpperCase()} · {fmtDateTime(n.at)}
                </p>
              </div>
            </li>
          ))}
          {items.length === 0 && <li className="text-sm text-muted-foreground">Nothing here yet.</li>}
        </ul>
      </SectionCard>
    </AppShell>
  );
}
