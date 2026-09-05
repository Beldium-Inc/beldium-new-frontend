import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Bell, CheckCheck, Mail, MessageSquareText, Radio, Send } from "lucide-react";
import { AppShell, Button, DemoNote, Metric, SectionCard } from "@/verticals/marketplace/AppShell";
import { StatusBadge } from "@/verticals/marketplace/StatusBadge";
import { Input } from "@/components/ui/input";
import { fmtDateTime, fmtTonnes, fmtUsd, useDemo } from "@/verticals/marketplace/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/marketplace/rfqs/$id")({
  head: () => ({
    meta: [
      { title: "RFQ aggregation | Beldium Marketplace" },
      {
        name: "description",
        content:
          "Aggregate verified mine capacity against an offtake RFQ, notify miners by SMS, email and in-app, then accept.",
      },
      { property: "og:title", content: "RFQ aggregation | Beldium Marketplace" },
      {
        property: "og:description",
        content: "Roll up verified miner capacity to target volume and confirm aggregated supply.",
      },
    ],
  }),
  component: RfqDetail,
});

function RfqDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const {
    state,
    autoAggregate,
    toggleAllocation,
    setAllocationTonnes,
    dispatchNotifications,
    acceptAggregation,
  } = useDemo();
  const rfq = state.rfqs.find((r) => r.id === id);
  if (!rfq) throw notFound();

  const [channelFilter, setChannelFilter] = useState<"all" | "sms" | "email" | "in_app">("all");

  const allocations = rfq.allocations.map((a) => ({
    ...a,
    miner: state.miners.find((m) => m.id === a.minerId)!,
  }));
  const filled = allocations.reduce((s, a) => s + a.tonnes, 0);
  const accepted = allocations.filter((a) => a.state === "accepted");
  const acceptedTonnes = accepted.reduce((s, a) => s + a.tonnes, 0);
  const pct = Math.min(100, Math.round((filled / rfq.volumeTonnes) * 100));
  const commitment = filled * rfq.targetPriceUsd;
  const notifications = rfq.notifications.filter(
    (n) => channelFilter === "all" || n.channel === channelFilter,
  );

  return (
    <AppShell
      title={`${rfq.reference}: ${fmtTonnes(rfq.volumeTonnes)} ${rfq.commodity}`}
      subtitle={`${rfq.grade} · ${rfq.incoterm} ${rfq.destination} · ${rfq.deliveryWindow} · target $${rfq.targetPriceUsd}/t`}
      actions={
        <Button variant="outline" size="sm" asChild>
          <Link to="/marketplace/rfqs">
            <ArrowLeft className="size-4" /> RFQs
          </Link>
        </Button>
      }
    >
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Metric label="Target volume" value={fmtTonnes(rfq.volumeTonnes)} hint={rfq.deliveryWindow} />
          <Metric
            label="Aggregated"
            value={`${pct}%`}
            hint={`${fmtTonnes(filled)} from ${allocations.length} verified miners`}
            tone={pct >= 100 ? "success" : "warning"}
          />
          <Metric label="Indicative commitment" value={fmtUsd(commitment)} hint={`at $${rfq.targetPriceUsd}/t`} />
          <Metric
            label="Status"
            value={rfq.status.replace(/_/g, " ")}
            hint={`${rfq.notifications.length} notifications dispatched`}
          />
        </div>

        <SectionCard
          title="Aggregation progress"
          description="Verified miner capacity rolling up to the requested volume"
          actions={
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => autoAggregate(rfq.id)}>
                Re-run matching
              </Button>
              <Button size="sm" onClick={() => {
                dispatchNotifications(rfq.id);
                toast.success("Notifications dispatched", {
                  description: "SMS, email and in-app messages queued to eligible verified miners.",
                });
              }}>
                <Send className="size-4" /> Notify eligible miners
              </Button>
            </div>
          }
        >
          <div className="mb-5">
            <div className="flex items-end justify-between text-sm">
              <span className="font-medium">
                {fmtTonnes(filled)} aggregated of {fmtTonnes(rfq.volumeTonnes)}
              </span>
              <span className="text-muted-foreground">
                shortfall {fmtTonnes(Math.max(0, rfq.volumeTonnes - filled))}
              </span>
            </div>
            <div className="mt-2 flex h-3 w-full overflow-hidden rounded-full bg-muted">
              {allocations.map((a, i) => (
                <div
                  key={a.minerId}
                  title={`${a.miner.name}: ${fmtTonnes(a.tonnes)}`}
                  className={cn(
                    "h-full border-r border-card last:border-0",
                    i % 3 === 0 ? "bg-primary" : i % 3 === 1 ? "bg-primary-soft" : "bg-info",
                  )}
                  style={{ width: `${(a.tonnes / rfq.volumeTonnes) * 100}%` }}
                />
              ))}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Only miners with verified compliance status are eligible for aggregation. Restricted and
              under-review producers are excluded automatically.
            </p>
          </div>

          <div className="-mx-5 overflow-x-auto px-5">
            <table className="w-full min-w-[860px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs tracking-wide text-muted-foreground uppercase">
                  <th className="py-2 pr-4 font-medium">Miner</th>
                  <th className="py-2 pr-4 font-medium">Origin</th>
                  <th className="py-2 pr-4 font-medium">Grade</th>
                  <th className="py-2 pr-4 font-medium">Capacity p.a.</th>
                  <th className="py-2 pr-4 font-medium">Allocated (t)</th>
                  <th className="py-2 pr-4 font-medium">Price $/t</th>
                  <th className="py-2 pr-4 font-medium">Compliance</th>
                  <th className="py-2 font-medium">Allocation</th>
                </tr>
              </thead>
              <tbody>
                {allocations.map((a) => (
                  <tr key={a.minerId} className="border-b border-border/70 last:border-0">
                    <td className="py-3 pr-4">
                      <span className="font-medium">{a.miner.name}</span>
                      <span className="block text-xs text-muted-foreground">
                        ESG {a.miner.esgScore}/100 · {a.miner.logistics}
                      </span>
                    </td>
                    <td className="py-3 pr-4">{a.miner.country}</td>
                    <td className="py-3 pr-4">{a.miner.grade}</td>
                    <td className="py-3 pr-4">{fmtTonnes(a.miner.capacityTpa)}</td>
                    <td className="py-3 pr-4">
                      <Input
                        className="h-8 w-28"
                        value={String(a.tonnes)}
                        onChange={(e) =>
                          setAllocationTonnes(rfq.id, a.minerId, Number(e.target.value) || 0)
                        }
                      />
                    </td>
                    <td className="py-3 pr-4">${a.priceUsdPerTonne}</td>
                    <td className="py-3 pr-4">
                      <StatusBadge status={a.miner.compliance} />
                    </td>
                    <td className="py-3">
                      <Button
                        size="sm"
                        variant={a.state === "accepted" ? "default" : "outline"}
                        onClick={() => toggleAllocation(rfq.id, a.minerId)}
                      >
                        {a.state === "accepted" ? "Accepted" : "Accept"}
                      </Button>
                    </td>
                  </tr>
                ))}
                {allocations.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-sm text-muted-foreground">
                      No allocations yet: run matching to aggregate verified capacity.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </SectionCard>

        <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
          <SectionCard
            title="Miner notification log"
            description="Distribution across SMS, email and in-app channels"
            actions={
              <div className="flex flex-wrap gap-1.5">
                {(["all", "sms", "email", "in_app"] as const).map((c) => (
                  <button
                    key={c}
                    onClick={() => setChannelFilter(c)}
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs font-medium transition",
                      channelFilter === c
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border text-muted-foreground hover:border-primary/40",
                    )}
                  >
                    {c === "in_app" ? "In-app" : c.toUpperCase()}
                  </button>
                ))}
              </div>
            }
          >
            {notifications.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No notifications dispatched yet. Use “Notify eligible miners” above.
              </p>
            ) : (
              <ul className="space-y-3">
                {notifications.map((n) => (
                  <li key={n.id} className="flex gap-3 rounded-md border border-border p-3">
                    <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-secondary text-primary">
                      {n.channel === "sms" ? (
                        <MessageSquareText className="size-4" />
                      ) : n.channel === "email" ? (
                        <Mail className="size-4" />
                      ) : (
                        <Bell className="size-4" />
                      )}
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium">{n.minerName}</span>
                        <StatusBadge status={n.status === "delivered" ? "verified" : "pending"} />
                        <span className="text-xs text-muted-foreground">
                          {n.channel === "in_app" ? "In-app" : n.channel.toUpperCase()} ·{" "}
                          {fmtDateTime(n.at)}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{n.preview}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>

          <SectionCard title="Acceptance" description="Confirm the aggregated supply pool">
            <dl className="space-y-3 text-sm">
              <Row label="Miners accepted" value={`${accepted.length} of ${allocations.length}`} />
              <Row label="Accepted volume" value={fmtTonnes(acceptedTonnes)} />
              <Row label="Coverage of request" value={`${Math.round((acceptedTonnes / rfq.volumeTonnes) * 100)}%`} />
              <Row label="Weighted price" value={`$${(
                accepted.reduce((s, a) => s + a.priceUsdPerTonne * a.tonnes, 0) /
                  (acceptedTonnes || 1)
              ).toFixed(2)}/t`} />
            </dl>

            <div className="mt-4 grid gap-2">
              <Button
                disabled={allocations.length === 0}
                onClick={() => {
                  acceptAggregation(rfq.id);
                  toast.success("Aggregated supply accepted", {
                    description: `${fmtTonnes(filled)} confirmed, buyer notified. Continue to transaction services.`,
                  });
                }}
              >
                <CheckCheck className="size-4" /> Accept aggregated supply
              </Button>
              <Button
                variant="outline"
                disabled={rfq.status !== "accepted" && rfq.status !== "contracted"}
                onClick={() => navigate({ to: "/marketplace/orders" })}
              >
                <Radio className="size-4" /> Transaction services setup
              </Button>
            </div>
            <DemoNote>
              Acceptance notifies the requesting buyer/offtaker in-app, then unlocks the transaction
              services and finance workflow for the aggregated pool.
            </DemoNote>
          </SectionCard>
        </div>
      </div>
    </AppShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border pb-2 last:border-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
