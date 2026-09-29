import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";

import {
  JoinPending,
  StartApplication,
  UnderReviewDashboard,
  VerifiedBanner,
} from "@/components/beldium/application-status";
import { errorMessage, fmtDateTime, naira, pretty } from "@/components/beldium/ops";
import { PageHeader } from "@/components/beldium/shell";
import { Panel, StatCard } from "@/components/beldium/stat-card";
import { StatusBadge } from "@/components/beldium/status-badge";
import { Button } from "@/components/ui/button";
import {
  useCompleteActionItem,
  useMarkEventRead,
  useOperationsDashboard,
} from "@/lib/api/operations-queries";
import { cn } from "@/lib/utils";
import { isVerified, useWorkspace, type ApplicationRecord } from "@/lib/workspace";

export const Route = createFileRoute("/portal/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Command Centre - Beldium Logistics Hub" },
      {
        name: "description",
        content: "Live logistics operations: requests, movements, exceptions, fleet and payments.",
      },
    ],
  }),
  component: PortalHome,
});

function PortalHome() {
  const { loading, error, record, pendingJoin } = useWorkspace();
  if (loading) return <p className="text-sm text-muted-foreground">Loading your workspace…</p>;
  if (error)
    return (
      <p className="text-sm text-destructive">
        {errorMessage(error, "Could not load your workspace.")}
      </p>
    );
  if (!record && pendingJoin) return <JoinPending {...pendingJoin} />;
  if (!record) return <StartApplication />;
  if (!isVerified(record.stage)) return <UnderReviewDashboard record={record} />;
  return <CommandCentre record={record} />;
}

function CommandCentre({ record }: { record: ApplicationRecord }) {
  const navigate = useNavigate();
  const dashboard = useOperationsDashboard();
  const completeItem = useCompleteActionItem();
  const markRead = useMarkEventRead();
  const d = dashboard.data;

  if (dashboard.isLoading)
    return <p className="text-sm text-muted-foreground">Loading operations…</p>;
  if (dashboard.error || !d) {
    return (
      <p className="text-sm text-destructive">
        {errorMessage(dashboard.error, "Could not load operations.")}
      </p>
    );
  }

  const s = d.stats;
  const kpis: {
    label: string;
    value: string;
    hint?: string;
    tone?: "danger" | "warning" | "success" | "primary" | undefined;
    to: string;
  }[] = [
    {
      label: "New requests",
      value: String(s.new_transport_requests),
      hint: "Awaiting acceptance",
      tone: "primary",
      to: "/portal/transport-requests",
    },
    {
      label: "Active jobs",
      value: String(s.active_jobs),
      hint: `${s.awaiting_pickup} awaiting pickup`,
      to: "/portal/movements",
    },
    {
      label: "In transit",
      value: String(s.in_transit),
      hint: `${s.loading} loading`,
      tone: "primary",
      to: "/portal/tracking",
    },
    {
      label: "Delayed",
      value: String(s.delayed_shipments),
      tone: s.delayed_shipments ? "danger" : undefined,
      to: "/portal/movements",
    },
    {
      label: "Open incidents",
      value: String(s.open_incidents),
      tone: s.open_incidents ? "warning" : undefined,
      to: "/portal/incidents",
    },
    {
      label: "Compliance alerts",
      value: String(s.compliance_alerts),
      tone: s.compliance_alerts ? "warning" : undefined,
      to: "/portal/compliance",
    },
    {
      label: "Available vehicles",
      value: String(s.available_vehicles),
      hint: `${s.vehicles_assigned} assigned`,
      tone: "success",
      to: "/portal/vehicles",
    },
    {
      label: "Outstanding payments",
      value: naira(s.outstanding_payments),
      hint: `${Number(s.tonnes_moved).toLocaleString()} t moved`,
      to: "/portal/payments",
    },
  ];

  return (
    <>
      <PageHeader
        title="Command Centre"
        description={`${record.organisationName} · live operations across the Beldium network.`}
      />
      <VerifiedBanner record={record} />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {kpis.map((k) => (
          <Link key={k.label} to={k.to} className="block transition-opacity hover:opacity-90">
            <StatCard
              label={k.label}
              value={k.value}
              tone={k.tone ?? "default"}
              {...(k.hint ? { hint: k.hint } : {})}
            />
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        <Panel
          title="Action required"
          action={<span className="text-xs text-muted-foreground">{d.action_items.length}</span>}
        >
          <ul className="space-y-2">
            {d.action_items.map((a) => (
              <li
                key={a.id}
                className="flex items-center gap-3 rounded-md border border-border px-3 py-2"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-foreground">{a.action}</div>
                  <div className="truncate text-xs text-muted-foreground">
                    {a.target}
                    {a.movement_reference ? ` · ${a.movement_reference}` : ""}
                  </div>
                </div>
                <StatusBadge value={a.urgency} />
                {a.related_movement ? (
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label="Open movement"
                    onClick={() =>
                      navigate({
                        to: "/portal/movements/$movementId",
                        params: { movementId: a.related_movement! },
                      })
                    }
                  >
                    <ChevronRight />
                  </Button>
                ) : null}
                <Button
                  size="sm"
                  variant="outline"
                  disabled={completeItem.isPending}
                  onClick={() => completeItem.mutate(a.id)}
                >
                  Done
                </Button>
              </li>
            ))}
            {d.action_items.length === 0 ? (
              <li className="text-sm text-muted-foreground">All clear.</li>
            ) : null}
          </ul>
        </Panel>

        <Panel title="Movement status">
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {d.status_breakdown.map((row) => (
              <li key={row.status} className="rounded-md border border-border p-3">
                <div className="text-xs text-muted-foreground">{pretty(row.status)}</div>
                <div className="mt-1 text-xl font-semibold text-card-foreground">{row.count}</div>
              </li>
            ))}
            {d.status_breakdown.length === 0 ? (
              <li className="text-sm text-muted-foreground">No movements yet.</li>
            ) : null}
          </ul>
        </Panel>

        <Panel
          title="Transport requests"
          action={
            <Link
              to="/portal/transport-requests"
              className="text-xs font-medium text-primary hover:underline"
            >
              Open queue
            </Link>
          }
        >
          <ul className="divide-y divide-border">
            {d.transport_requests.slice(0, 6).map((r) => (
              <li key={r.id}>
                <Link
                  to="/portal/transport-requests/$requestId"
                  params={{ requestId: r.id }}
                  className="flex items-center justify-between gap-3 py-2 hover:text-primary"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-medium">
                      {r.reference} · {r.movement_type}
                    </div>
                    <div className="truncate text-xs text-muted-foreground">
                      {r.origin} → {r.destination} · {r.quantity_display}
                    </div>
                  </div>
                  <StatusBadge value={pretty(r.status)} />
                </Link>
              </li>
            ))}
            {d.transport_requests.length === 0 ? (
              <li className="py-2 text-sm text-muted-foreground">No requests.</li>
            ) : null}
          </ul>
        </Panel>

        <Panel
          title="Active movements"
          action={
            <Link
              to="/portal/movements"
              className="text-xs font-medium text-primary hover:underline"
            >
              Open queue
            </Link>
          }
        >
          <ul className="divide-y divide-border">
            {d.active_movements.slice(0, 6).map((m) => (
              <li key={m.id}>
                <Link
                  to="/portal/movements/$movementId"
                  params={{ movementId: m.id }}
                  className="flex items-center justify-between gap-3 py-2 hover:text-primary"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-medium">
                      {m.reference} · {m.mineral || m.movement_type}
                    </div>
                    <div className="truncate text-xs text-muted-foreground">
                      {m.vehicle_registration ?? "No vehicle"} · {m.driver_name ?? "No driver"} ·
                      ETA {fmtDateTime(m.eta_at)}
                    </div>
                  </div>
                  <StatusBadge value={pretty(m.status)} />
                </Link>
              </li>
            ))}
            {d.active_movements.length === 0 ? (
              <li className="py-2 text-sm text-muted-foreground">No active movements.</li>
            ) : null}
          </ul>
        </Panel>
      </div>

      <div className="mt-6">
        <Panel
          title="Recent activity"
          action={
            <Link
              to="/portal/notifications"
              className="text-xs font-medium text-primary hover:underline"
            >
              View all
            </Link>
          }
        >
          <ul className="grid gap-x-6 gap-y-1 md:grid-cols-2">
            {d.events.slice(0, 12).map((e) => (
              <li key={e.id}>
                <button
                  type="button"
                  disabled={!e.unread}
                  onClick={() => markRead.mutate(e.id)}
                  className="flex w-full items-baseline gap-3 py-1.5 text-left disabled:cursor-default"
                  title={e.unread ? "Mark as read" : undefined}
                >
                  <span
                    className={cn(
                      "mt-1.5 size-2 shrink-0 rounded-full",
                      e.unread ? "bg-primary" : "bg-border",
                    )}
                  />
                  <span className={cn("text-sm", e.unread && "font-medium")}>{e.text}</span>
                  <span className="beldium-small ml-auto shrink-0">
                    {fmtDateTime(e.occurred_at)}
                  </span>
                </button>
              </li>
            ))}
            {d.events.length === 0 ? (
              <li className="text-sm text-muted-foreground">No activity yet.</li>
            ) : null}
          </ul>
        </Panel>
      </div>
    </>
  );
}
