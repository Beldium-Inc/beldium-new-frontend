import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, ArrowUpRight, CircleDot, FileText } from "lucide-react";

import { PageHeader, StatCard } from "@/components/miner-shell";
import { StatusChip, complianceTone, prettify } from "@/components/status-chip";
import { Button } from "@/components/ui/button";
import {
  Bar,
  DataTable,
  DomainChip,
  EmptyState,
  Panel,
  StageChip,
  StatusPill,
  Td,
  TxLink,
} from "@/components/ecosystem-ui";
import { actionItems, ecosystemMetrics, isClosed, stageProgress, tonnes, usd } from "@/lib/ecosystem-data";
import { useMiner } from "@/lib/miner-store";
import { cn } from "@/lib/utils";

const title = "Miner dashboard — Beldium Miner Hub";
const description = "Verification progress, activity, information requests and operational KPIs for your mining organisation.";

export const Route = createFileRoute("/portal/")({
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
  component: PortalHome,
});

function PortalHome() {
  const { state } = useMiner();
  if (state.orgStatus === "verified") return <VerifiedDashboard />;
  if (state.orgStatus === "draft") return <DraftDashboard />;
  return <UnderReviewDashboard />;
}

function DraftDashboard() {
  const { state } = useMiner();
  const done = state.application.documents.filter((d) => d.fileName).length;
  return (
    <>
      <PageHeader
        title="Finish your organisation application"
        description="Your workspace unlocks once your mining organisation application is submitted and verified."
        actions={
          <Button asChild>
            <Link to="/application">Continue application</Link>
          </Button>
        }
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Sites declared" value={String(state.application.sites.length)} />
        <StatCard label="Equipment declared" value={String(state.application.equipment.length)} />
        <StatCard label="Documents uploaded" value={`${done}/${state.application.documents.length}`} />
      </div>
    </>
  );
}

function UnderReviewDashboard() {
  const { state } = useMiner();
  const openRequests = state.informationRequests.filter((r) => r.status === "open");

  return (
    <>
      <PageHeader
        title="Verification under review"
        description="Your organisation application is with the Beldium review team. Keep an eye on information requests."
        actions={
          <Button asChild variant="outline">
            <Link to="/portal/application-record">
              <FileText className="mr-1.5 h-4 w-4" /> View submitted application
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Status" value="Under review" hint="Technical review stage" />
        <StatCard label="Open requests" value={String(openRequests.length)} hint="Awaiting your evidence" />
        <StatCard label="Declared sites" value={String(state.application.sites.length)} />
        <StatCard label="Equipment items" value={String(state.application.equipment.length)} />
      </div>

      {openRequests.length ? (
        <div className="mt-6 rounded-md border border-warning/40 bg-warning/10 p-5">
          <div className="flex items-center gap-2 text-sm font-medium text-warning-foreground">
            <AlertTriangle className="h-4 w-4" /> {openRequests.length} information request
            {openRequests.length > 1 ? "s" : ""} need a response
          </div>
          <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
            {openRequests.map((r) => (
              <li key={r.id}>
                {r.reference} — {r.subject} (due {r.dueAt})
              </li>
            ))}
          </ul>
          <Button asChild size="sm" className="mt-4">
            <Link to="/portal/requests">Respond with evidence</Link>
          </Button>
        </div>
      ) : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-md border border-border bg-card p-5">
          <h2 className="text-sm font-semibold text-card-foreground">Review timeline</h2>
          <ol className="mt-4 space-y-0">
            {state.timeline.map((stage, i) => (
              <li key={stage.id} className="relative flex gap-4 pb-6 last:pb-0">
                {i < state.timeline.length - 1 ? (
                  <span className="absolute top-5 left-[7px] h-full w-px bg-border" aria-hidden />
                ) : null}
                <span
                  className={cn(
                    "z-10 mt-1 h-3.5 w-3.5 shrink-0 rounded-full border-2",
                    stage.state === "complete"
                      ? "border-success bg-success"
                      : stage.state === "active"
                        ? "border-accent bg-card"
                        : "border-border bg-card",
                  )}
                />
                <div className="text-sm">
                  <div className="flex items-center gap-2 font-medium text-card-foreground">
                    {stage.label}
                    {stage.state === "active" ? <StatusChip tone="accent">In progress</StatusChip> : null}
                  </div>
                  <p className="mt-0.5 text-muted-foreground">{stage.description}</p>
                  {stage.at ? <p className="mt-0.5 text-xs text-muted-foreground">{stage.at}</p> : null}
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="rounded-md border border-border bg-card p-5">
          <h2 className="text-sm font-semibold text-card-foreground">Activity</h2>
          <ul className="mt-4 space-y-4">
            {state.activity.map((a) => (
              <li key={a.id} className="flex gap-3 text-sm">
                <CircleDot className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
                <div>
                  <div className="text-card-foreground">{a.message}</div>
                  <div className="text-xs text-muted-foreground">
                    {a.actor} · {a.at} · {prettify(a.kind)}
                  </div>
                </div>
              </li>
            ))}
            {state.activity.length === 0 ? (
              <li className="text-sm text-muted-foreground">No activity yet.</li>
            ) : null}
          </ul>
        </section>
      </div>
    </>
  );
}

function VerifiedDashboard() {
  const { state, advanceTransaction, recordSettlement } = useMiner();
  const sites = state.application.sites;
  const latest = state.production.filter((p) => p.period === "2026-08");
  const mined = latest.reduce((s, p) => s + p.tonnesMined, 0);
  const overdue = state.compliance.filter((c) => c.status === "overdue").length;
  const openActions = state.correctiveActions.filter((a) => a.status !== "closed").length;
  const lowStock = state.inventory.filter((i) => i.quantity < i.reorderLevel);
  const unread = state.notifications.filter((n) => !n.read).length;

  const m = ecosystemMetrics(state);
  const actions = actionItems(state);
  const activity = [...state.ecosystemEvents].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 10);
  const activeTx = state.transactions.filter((tx) => !isClosed(tx));
  const complianceHealth = overdue > 0 ? "Attention" : state.compliance.some((c) => c.status !== "compliant") ? "Action due" : "Compliant";

  return (
    <>
      <PageHeader
        title={`Welcome back, ${state.account?.fullName?.split(" ")[0] ?? "miner"}`}
        description="Interconnected ecosystem view — demand, commitments, material location and settlement across every transaction."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <StatCard label="Compliance status" value={complianceHealth} hint={`${overdue} overdue · ${openActions} corrective actions`} />
        <StatCard label="Active RFQs" value={String(m.activeRfqs)} hint={`${tonnes(m.demandReceivedTonnes)} demand received`} />
        <StatCard label="Active supply commitments" value={String(m.activeCommitments)} hint={`${tonnes(m.committedTonnes)} committed`} />
        <StatCard label="Aggregated to date" value={tonnes(m.aggregatedTonnes)} hint={`${tonnes(Math.max(0, m.committedTonnes - m.aggregatedTonnes))} remaining`} />
        <StatCard label="Available inventory" value={tonnes(m.availableInventory)} hint="Unallocated stockpile" />
        <StatCard label="In transit" value={tonnes(m.inTransit)} hint="Bulk consignments moving" />
        <StatCard label="In processing" value={tonnes(m.inProcessing)} hint="At processors" />
        <StatCard label="Export ready" value={tonnes(m.exportReady)} hint="Cleared for shipment" />
        <StatCard label="Active transactions" value={String(m.activeTransactions)} hint={`${m.awaitingQuality} awaiting quality · ${m.awaitingBuyer} awaiting buyer`} />
        <StatCard label="Outstanding payments" value={usd(m.outstandingPayments)} hint="Across open invoices" />
        <StatCard label="Unread notifications" value={String(unread)} hint="Notification centre" />
        <StatCard label="Actions required" value={String(actions.length)} hint="Action centre below" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <Panel
          title="Action centre"
          description="Everything waiting on you, ordered by urgency, with direct actions."
          actions={
            <Button asChild size="sm" variant="ghost">
              <Link to="/portal/transactions">
                All transactions <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            </Button>
          }
        >
          {actions.length ? (
            <ul className="space-y-3">
              {actions
                .slice()
                .sort((a, b) => (a.severity === b.severity ? 0 : a.severity === "high" ? -1 : 1))
                .map((a) => (
                  <li key={a.id} className="flex flex-wrap items-start justify-between gap-3 rounded-lg border border-border p-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <DomainChip domain={a.domain} />
                        <StatusChip tone={a.severity === "high" ? "warning" : "info"}>{prettify(a.severity)}</StatusChip>
                      </div>
                      <div className="mt-1.5 text-sm font-medium text-card-foreground">{a.title}</div>
                      <p className="text-xs text-muted-foreground">{a.detail}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {a.transactionId && a.domain === "finance" ? (
                        <Button size="sm" variant="outline" onClick={() => recordSettlement(a.transactionId!)}>
                          Record settlement
                        </Button>
                      ) : a.transactionId ? (
                        <Button size="sm" variant="outline" onClick={() => advanceTransaction(a.transactionId!)}>
                          Advance stage
                        </Button>
                      ) : null}
                      <Button asChild size="sm" variant="ghost">
                        <Link to={a.to}>Open</Link>
                      </Button>
                    </div>
                  </li>
                ))}
            </ul>
          ) : (
            <EmptyState label="Nothing needs your attention right now." />
          )}
        </Panel>

        <Panel title="Live ecosystem activity" description="Timestamped events across marketplace, quality, logistics, warehousing, processing, export and finance.">
          {activity.length ? (
            <ul className="space-y-3.5">
              {activity.map((e) => (
                <li key={e.id} className="flex gap-3 text-sm">
                  <CircleDot className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
                  <div className="min-w-0">
                    <div className="text-card-foreground">{e.message}</div>
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                      <DomainChip domain={e.domain} />
                      <span>{e.at}</span>
                      {e.reference ? <span>· {e.reference}</span> : null}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState label="No ecosystem activity yet." />
          )}
        </Panel>
      </div>

      <div className="mt-6">
        <Panel title="Material location & stage" description="Where every active commitment sits in the RFQ to settlement chain.">
          <DataTable head={["Transaction", "Buyer", "Mineral", "Committed", "Current stage", "Progress", "Payment"]}>
            {activeTx.map((tx) => (
              <tr key={tx.id}>
                <Td><TxLink tx={tx} /></Td>
                <Td>{tx.buyer}</Td>
                <Td>{tx.mineral}</Td>
                <Td>{tonnes(tx.committedTonnes)}</Td>
                <Td><StageChip tx={tx} /></Td>
                <Td className="w-40"><Bar pct={stageProgress(tx)} /></Td>
                <Td><StatusPill value={tx.payment.status} /></Td>
              </tr>
            ))}
          </DataTable>
          {activeTx.length === 0 ? <EmptyState label="No active transactions." /> : null}
        </Panel>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-md border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-5 py-3">
            <h2 className="text-sm font-semibold text-card-foreground">Mining sites</h2>
            <Button asChild size="sm" variant="ghost">
              <Link to="/portal/sites">
                All sites <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
          <ul className="divide-y divide-border">
            {sites.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-4 px-5 py-3.5 text-sm">
                <div>
                  <Link
                    to="/portal/sites/$siteId"
                    params={{ siteId: s.id }}
                    className="font-medium text-card-foreground hover:underline"
                  >
                    {s.name}
                  </Link>
                  <div className="text-muted-foreground">
                    {s.mineral} · {s.method} · {s.region}
                  </div>
                </div>
                <StatusChip tone={s.status === "Operating" ? "success" : "warning"}>{s.status}</StatusChip>
              </li>
            ))}
          </ul>
        </section>

        <div className="space-y-6">
          <section className="rounded-md border border-border bg-card p-5">
            <h2 className="text-sm font-semibold text-card-foreground">Compliance attention</h2>
            <ul className="mt-3 space-y-2.5 text-sm">
              {state.compliance
                .filter((c) => c.status !== "compliant")
                .map((c) => (
                  <li key={c.id} className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-card-foreground">{c.obligation}</div>
                      <div className="text-xs text-muted-foreground">
                        {c.authority} · due {c.dueAt}
                      </div>
                    </div>
                    <StatusChip tone={complianceTone(c.status)}>{prettify(c.status)}</StatusChip>
                  </li>
                ))}
            </ul>
          </section>

          <section className="rounded-md border border-border bg-card p-5">
            <h2 className="text-sm font-semibold text-card-foreground">Below reorder level</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {lowStock.length ? (
                lowStock.map((i) => (
                  <li key={i.id} className="flex justify-between gap-3">
                    <span className="text-card-foreground">{i.name}</span>
                    <span className="text-muted-foreground">
                      {i.quantity.toLocaleString()} {i.unit} / {i.reorderLevel.toLocaleString()}
                    </span>
                  </li>
                ))
              ) : (
                <li className="text-muted-foreground">All stock above reorder level.</li>
              )}
            </ul>
          </section>
        </div>
      </div>
    </>
  );
}
