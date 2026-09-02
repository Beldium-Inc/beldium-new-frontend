import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/beldium/AppShell";
import { PageHeader, Panel, Pill } from "@/components/beldium/bits";
import { useApp } from "@/lib/app-state";
import { PRIMARY_COMPANY_ID } from "@/lib/mock-data";

export const Route = createFileRoute("/partner/activity")({
  head: () => ({
    meta: [
      { title: "Activity — Beldium Logistics Partner Portal" },
      { name: "description", content: "Full activity timeline between your company and Beldium compliance." },
      { property: "og:title", content: "Activity — Beldium Logistics Partner Portal" },
      { property: "og:description", content: "Timeline of submissions, reviews and platform notices." },
    ],
  }),
  component: ActivityPage,
});

function ActivityPage() {
  const { companies } = useApp();
  const c = companies.find((x) => x.id === PRIMARY_COMPANY_ID)!;

  return (
    <AppShell role="partner" breadcrumbs={[{ label: "Sahel Haulage & Minerals Ltd", to: "/partner" }, { label: "Activity" }]}>
      <PageHeader title="Activity" description="Everything that has happened on your Beldium account." />
      <Panel bodyClassName="p-0">
        <ul className="divide-y divide-border">
          {c.activity.map((a) => (
            <li key={a.id} className="flex flex-wrap items-center gap-3 px-5 py-3.5">
              <Pill tone={a.channel === "Operator" ? "info" : a.channel === "System" ? "neutral" : a.channel === "Regulator" ? "warning" : "success"}>{a.channel}</Pill>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-[var(--brand)]">{a.action}</p>
                <p className="text-xs text-muted-foreground">{a.detail}</p>
              </div>
              <span className="text-xs text-muted-foreground">
                {a.actor} · {a.at}
              </span>
            </li>
          ))}
        </ul>
      </Panel>
    </AppShell>
  );
}
