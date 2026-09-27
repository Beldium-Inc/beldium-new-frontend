import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";

import { PageHeader } from "@/components/beldium/shell";
import { StartApplication, UnderReviewDashboard, VerifiedBanner } from "@/components/beldium/application-status";
import { Panel } from "@/components/beldium/stat-card";
import { OpsMap } from "@/components/beldium/ops-map";
import { StatusBadge } from "@/components/beldium/status-badge";
import { StageActionButton } from "@/components/beldium/ops-dialogs";
import { useOpenTarget, IdLink } from "@/components/beldium/ops-ui";
import { cn } from "@/lib/utils";
import { isVerified, useWorkspace, type ApplicationRecord } from "@/lib/workspace";
import {
  actionItems,
  fmt,
  fmtTime,
  markRead,
  movementStatus,
  requestStatus,
  siteName,
  useOps,
  vehicleAvailability,
  driverAvailability,
  type Target,
} from "@/lib/ops-store";

export const Route = createFileRoute("/portal/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Command Centre - Beldium Logistics Hub" },
      { name: "description", content: "Beldium logistics command centre: KPIs, action queue, new requests, active movements, exceptions and live operations map." },
      { property: "og:title", content: "Command Centre - Beldium Logistics Hub" },
      { property: "og:description", content: "Run sample and bulk mineral movements across the Beldium network." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PortalHome,
});

function PortalHome() {
  const { loading, record } = useWorkspace();
  if (loading) return <p className="text-sm text-muted-foreground">Loading your workspace…</p>;
  if (!record) return <StartApplication />;
  if (!isVerified(record.stage)) return <UnderReviewDashboard record={record} />;
  return <CommandCentre record={record} />;
}

function CommandCentre({ record }: { record: ApplicationRecord }) {
  const s = useOps();
  const open = useOpenTarget();
  const actions = actionItems(s);
  const newReqs = s.requests.filter((r) => r.status === "New" || r.status === "Awaiting Decision");
  const active = s.movements.filter((m) => m.stage !== "Completed");
  const exceptions = active.filter((m) => m.exception || m.delayed || m.deviated);
  const today = new Date().toDateString();
  const kpis: { label: string; value: number; tone: string; target: Target }[] = [
    { label: "New requests", value: newReqs.length, tone: "text-colorLink", target: { kind: "queue", path: "/portal/transport-requests", tab: "Awaiting Decision" } },
    { label: "Active movements", value: active.filter((m) => m.stage !== "Awaiting Assignment").length, tone: "text-primary", target: { kind: "queue", path: "/portal/active-movements" } },
    { label: "In transit", value: active.filter((m) => m.stage === "In Transit").length, tone: "text-colorLink", target: { kind: "queue", path: "/portal/active-movements", tab: "In Transit" } },
    { label: "Exceptions", value: exceptions.length, tone: "text-destructive", target: { kind: "queue", path: "/portal/active-movements", tab: "Exceptions" } },
    { label: "Delivered today", value: s.movements.filter((m) => m.completedAt && new Date(m.completedAt).toDateString() === today).length, tone: "text-success", target: { kind: "queue", path: "/portal/deliveries", tab: "Completed" } },
    { label: "Available vehicles", value: s.vehicles.filter((v) => vehicleAvailability(v, s) === "Available").length, tone: "text-success", target: { kind: "queue", path: "/portal/fleet", tab: "Available" } },
    { label: "Available drivers", value: s.drivers.filter((d) => driverAvailability(d, s) === "Available").length, tone: "text-success", target: { kind: "queue", path: "/portal/drivers", tab: "Available" } },
    { label: "Open incidents", value: s.incidents.filter((i) => i.status === "Open").length, tone: "text-warning", target: { kind: "queue", path: "/portal/incidents", tab: "Open" } },
  ];
  const notes = s.notifications.slice(0, 6);

  return (
    <>
      <PageHeader title="Command Centre" description={`${record.organisationName} · live operations across the Beldium network.`} />
      <VerifiedBanner record={record} />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8">
        {kpis.map((k) => (
          <button key={k.label} type="button" onClick={() => open(k.target)} className="beldium-panel p-4 text-left transition-colors hover:border-primary/50">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{k.label}</p>
            <p className={cn("mt-2 text-2xl font-bold leading-none", k.tone)}>{k.value}</p>
          </button>
        ))}
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_1.4fr]">
        <Panel title="Action Required" action={<span className="text-xs font-semibold text-muted-foreground">{actions.length}</span>}>
          {actions.length === 0 ? <p className="text-sm text-muted-foreground">All clear.</p> : null}
          <ul className="space-y-2">
            {actions.map((a) => (
              <li key={a.id}>
                <button type="button" onClick={() => open(a.target)} className="flex w-full items-center gap-3 rounded-lg border border-border px-3 py-2 text-left hover:border-primary">
                  <span className={cn("grid size-7 shrink-0 place-items-center rounded-full text-xs font-bold", a.tone === "danger" ? "bg-destructive/15 text-destructive" : a.tone === "warning" ? "bg-warning/20 text-warning" : "bg-secondary text-primary")}>{a.count}</span>
                  <span className="flex-1 text-sm font-medium">{a.label}</span>
                  <ChevronRight className="size-4 text-muted-foreground" />
                </button>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Live Operations Map">
          <OpsMap />
        </Panel>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <Panel title="New Requests" action={<Link to="/portal/transport-requests" search={{ tab: "Awaiting Decision" }} className="text-xs font-semibold text-colorLink">Open queue</Link>}>
          <ul className="divide-y divide-border">
            {newReqs.length === 0 ? <li className="py-2 text-sm text-muted-foreground">No requests waiting.</li> : null}
            {newReqs.slice(0, 5).map((r) => (
              <li key={r.id} className="flex cursor-pointer items-center justify-between gap-3 py-2" onClick={() => open({ kind: "request", id: r.id })}>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-primary">
                    {r.id} · {r.movementType}
                  </p>
                  <p className="beldium-small truncate">
                    {siteName(s, r.originId)} → {siteName(s, r.destinationId)} · {r.quantity} {r.unit}
                  </p>
                </div>
                <StatusBadge value={requestStatus(s, r)} />
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Active Movements" action={<Link to="/portal/active-movements" className="text-xs font-semibold text-colorLink">Open queue</Link>}>
          <ul className="divide-y divide-border">
            {active.slice(0, 6).map((m) => (
              <li key={m.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <div className="min-w-0">
                  <IdLink kind="movement" id={m.id} />
                  <p className="beldium-small truncate">
                    {m.movementType} · {m.vehicleId ?? "unassigned"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge value={movementStatus(m)} />
                  <StageActionButton movement={m} size="sm" />
                </div>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Exceptions" action={<Link to="/portal/active-movements" search={{ tab: "Exceptions" }} className="text-xs font-semibold text-colorLink">Open queue</Link>}>
          <ul className="divide-y divide-border">
            {exceptions.length === 0 ? <li className="py-2 text-sm text-muted-foreground">No exceptions.</li> : null}
            {exceptions.map((m) => (
              <li key={m.id} className="flex cursor-pointer items-center justify-between gap-2 py-2" onClick={() => open({ kind: "movement", id: m.id })}>
                <div>
                  <p className="text-sm font-semibold text-primary">{m.id}</p>
                  <p className="beldium-small">{[m.exception && "Open incident", m.delayed && "Delayed", m.deviated && "Route deviation", m.stopped && "Stopped"].filter(Boolean).join(" · ")}</p>
                </div>
                <StatusBadge value={movementStatus(m)} />
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Notifications" action={<Link to="/portal/notifications" className="text-xs font-semibold text-colorLink">View all</Link>}>
          <ul className="divide-y divide-border">
            {notes.map((n) => (
              <li key={n.id}>
                <button
                  type="button"
                  onClick={() => {
                    markRead(n.id);
                    open(n.target);
                  }}
                  className="flex w-full items-start gap-2 py-2 text-left"
                >
                  <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", n.read ? "bg-border" : "bg-colorLink")} />
                  <span className="min-w-0 flex-1">
                    <span className={cn("block text-sm", !n.read && "font-semibold")}>{n.title}</span>
                    <span className="beldium-small block truncate">{n.body}</span>
                  </span>
                  <span className="beldium-small shrink-0">{fmt(n.at)}</span>
                </button>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <div className="mt-5">
        <Panel title="Recent Activity">
          <ul className="grid gap-x-6 gap-y-1 md:grid-cols-2">
            {s.activity.slice(0, 12).map((a) => (
              <li key={a.id}>
                <button type="button" onClick={() => open(a.target)} className="flex w-full items-baseline gap-3 py-1.5 text-left hover:text-primary">
                  <span className="beldium-mono w-12 shrink-0 font-semibold text-primary">{fmtTime(a.at)}</span>
                  <span className="text-sm">{a.text}</span>
                  <span className="beldium-small ml-auto shrink-0">{a.sector}</span>
                </button>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </>
  );
}
