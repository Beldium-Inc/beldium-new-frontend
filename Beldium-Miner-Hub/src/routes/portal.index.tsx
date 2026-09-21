import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, ArrowUpRight, CircleDot, FileText } from "lucide-react";

import { PageHeader, StatCard } from "@/components/miner-shell";
import { StatusChip } from "@/components/status-chip";
import { Button } from "@/components/ui/button";
import { DataTable, DomainChip, EmptyState, Panel, Td } from "@/components/ecosystem-ui";
import { useMyOrganisations, useOrganisationTimeline } from "@/lib/api/queries";
import { useMineSites, useMiningApplications, useMiningDashboard } from "@/lib/api/mining-queries";
import {
  useAdvanceTransactionStage,
  useEcosystemDashboard,
  useRecordSettlement,
  useTransactions,
} from "@/lib/api/ecosystem-queries";
import { nextStage } from "@/lib/api/ecosystem";

const title = "Miner dashboard - Beldium Miner Hub";
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

function usd(v: number): string {
  return `$${v.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

function tonnes(v: number): string {
  return `${v.toLocaleString(undefined, { maximumFractionDigits: 1 })} t`;
}

function PortalHome() {
  const organisations = useMyOrganisations();
  const org = organisations.data?.results[0] ?? null;

  if (organisations.isLoading) {
    return <p className="text-sm text-muted-foreground">Loading your workspace…</p>;
  }

  if (!org) {
    return (
      <PageHeader
        title="Start your organisation application"
        description="Register your mining organisation to unlock your workspace."
        actions={
          <Button asChild>
            <Link to="/application">Start application</Link>
          </Button>
        }
      />
    );
  }

  if (org.verification_status === "verified") return <VerifiedDashboard orgName={org.name} />;
  return <UnderReviewDashboard orgId={org.id} orgName={org.name} status={org.verification_status} />;
}

function UnderReviewDashboard({ orgId, orgName, status }: { orgId: string; orgName: string; status: string }) {
  const timeline = useOrganisationTimeline(orgId);
  const applications = useMiningApplications();
  const sites = useMineSites();
  const apps = Array.isArray(applications.data) ? applications.data : (applications.data?.results ?? []);
  const siteList = Array.isArray(sites.data) ? sites.data : (sites.data?.results ?? []);
  const infoRequested = apps.filter((a) => a.status === "info_requested");

  return (
    <>
      <PageHeader
        title={orgName}
        description={`Your organisation is ${status.replace("_", " ")}. Keep an eye on information requests from the review team.`}
        actions={
          <Button asChild variant="outline">
            <Link to="/portal/application-record">
              <FileText className="mr-1.5 h-4 w-4" /> View submitted application
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Status" value={status.replace("_", " ")} hint="Organisation verification" />
        <StatCard label="Applications" value={String(apps.length)} hint={`${infoRequested.length} need info`} />
        <StatCard
          label="Declared sites"
          value={String(siteList.length)}
          hint={`${timeline.data?.sites.verified ?? 0} verified`}
        />
        <StatCard label="Info requests" value={String(infoRequested.length)} hint="Awaiting your response" />
      </div>

      {infoRequested.length ? (
        <div className="mt-6 rounded-md border border-warning/40 bg-warning/10 p-5">
          <div className="flex items-center gap-2 text-sm font-medium text-warning-foreground">
            <AlertTriangle className="h-4 w-4" /> {infoRequested.length} application
            {infoRequested.length > 1 ? "s" : ""} need more information
          </div>
          <Button asChild size="sm" className="mt-4">
            <Link to="/portal/requests">Respond with evidence</Link>
          </Button>
        </div>
      ) : null}

      <div className="mt-6 rounded-md border border-border bg-card p-5">
        <h2 className="text-sm font-semibold text-card-foreground">Applications</h2>
        <ul className="mt-4 space-y-3">
          {apps.map((a) => (
            <li key={a.id} className="flex items-center justify-between text-sm">
              <div>
                <div className="font-medium text-card-foreground">{a.reference}</div>
                <div className="text-muted-foreground">{a.type} · {a.mineral ?? "-"}</div>
              </div>
              <StatusChip tone={a.status === "approved" ? "success" : a.status === "rejected" ? "danger" : "info"}>
                {a.status.replace("_", " ")}
              </StatusChip>
            </li>
          ))}
          {apps.length === 0 ? <li className="text-sm text-muted-foreground">No applications yet.</li> : null}
        </ul>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[3fr_2fr]">
        <div className="rounded-md border border-border bg-card p-5">
          <h2 className="text-sm font-semibold text-card-foreground">Review timeline</h2>
          {timeline.isPending ? <p className="mt-4 text-sm text-muted-foreground">Loading timeline…</p> : null}
          {timeline.isError ? <p className="mt-4 text-sm text-destructive">Could not load the review timeline.</p> : null}
          <ol className="mt-4 space-y-5">
            {timeline.data?.stages.map((stage) => (
              <li key={stage.key} className="flex gap-3">
                <span
                  className={`mt-1.5 h-3 w-3 shrink-0 rounded-full ${
                    stage.state === "complete"
                      ? "bg-success"
                      : stage.state === "current"
                        ? "bg-success ring-4 ring-success/20"
                        : stage.state === "attention"
                          ? "bg-warning ring-4 ring-warning/20"
                          : stage.state === "failed"
                            ? "bg-destructive"
                            : "bg-muted-foreground/30"
                  }`}
                />
                <div className="text-sm">
                  <div className="font-medium text-card-foreground">{stage.title}</div>
                  <div className="text-muted-foreground">{stage.detail || stage.description}</div>
                  {stage.at ? (
                    <div className="mt-0.5 text-xs text-muted-foreground">{new Date(stage.at).toLocaleDateString()}</div>
                  ) : null}
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div className="rounded-md border border-border bg-card p-5">
          <h2 className="text-sm font-semibold text-card-foreground">Activity</h2>
          <ul className="mt-4 space-y-3">
            {timeline.data?.activity.map((a) => (
              <li key={a.id} className="text-sm">
                <div className="text-card-foreground">{a.message}</div>
                <div className="text-xs text-muted-foreground">
                  {a.actor} · {new Date(a.at).toLocaleString()}
                </div>
              </li>
            ))}
            {timeline.data && timeline.data.activity.length === 0 ? (
              <li className="text-sm text-muted-foreground">No activity yet.</li>
            ) : null}
          </ul>
        </div>
      </div>
    </>
  );
}

function VerifiedDashboard({ orgName }: { orgName: string }) {
  const dashboard = useMiningDashboard();
  const ecosystem = useEcosystemDashboard();
  const sites = useMineSites();
  const transactions = useTransactions();
  const advanceStage = useAdvanceTransactionStage();
  const recordSettlement = useRecordSettlement();

  const d = dashboard.data;
  const e = ecosystem.data;
  const siteList = Array.isArray(sites.data) ? sites.data : (sites.data?.results ?? []);
  const txList = Array.isArray(transactions.data) ? transactions.data : (transactions.data?.results ?? []);
  const activeTx = txList.filter((tx) => !tx.is_closed);

  return (
    <>
      <PageHeader
        title={`Welcome back, ${orgName}`}
        description="Interconnected ecosystem view - demand, commitments, material location and settlement across every transaction."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <StatCard
          label="Compliance status"
          value={d ? `${d.totals.average_compliance_score}%` : "-"}
          {...(d ? { hint: `${d.totals.overdue_non_conformities} overdue · ${d.totals.open_non_conformities} open` } : {})}
        />
        <StatCard label="Active RFQs" value={e ? String(e.active_rfqs) : "-"} />
        <StatCard label="Active supply commitments" value={e ? String(e.active_supply_commitments) : "-"} />
        <StatCard label="Aggregated to date" value={e ? tonnes(e.aggregated_to_date) : "-"} />
        <StatCard label="Available inventory" value={e ? tonnes(e.available_inventory) : "-"} hint="Unallocated stockpile" />
        <StatCard label="In transit" value={e ? tonnes(e.in_transit) : "-"} />
        <StatCard label="In processing" value={e ? tonnes(e.in_processing) : "-"} />
        <StatCard label="Export ready" value={e ? tonnes(e.export_ready) : "-"} />
        <StatCard label="Active transactions" value={e ? String(e.active_transactions) : "-"} />
        <StatCard label="Outstanding payments" value={e ? usd(e.outstanding_payments) : "-"} />
        <StatCard label="Actions required" value={e ? String(e.actions_required.length) : "-"} />
        <StatCard label="Mining sites" value={String(siteList.length)} />
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
          {e && e.actions_required.length ? (
            <ul className="space-y-3">
              {e.actions_required.map((a) => (
                <li key={a.id} className="flex flex-wrap items-start justify-between gap-3 rounded-lg border border-border p-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <DomainChip domain={a.domain} />
                      <StatusChip tone={a.severity === "high" ? "warning" : "info"}>{a.severity}</StatusChip>
                    </div>
                    <div className="mt-1.5 text-sm font-medium text-card-foreground">{a.title}</div>
                    <p className="text-xs text-muted-foreground">{a.detail}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {a.transaction_id && a.domain === "finance" ? (
                      <Button size="sm" variant="outline" onClick={() => recordSettlement.mutate(a.transaction_id!)}>
                        Record settlement
                      </Button>
                    ) : a.transaction_id ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const tx = txList.find((t) => t.id === a.transaction_id);
                          if (tx) advanceStage.mutate({ id: tx.id, stage: nextStage(tx.stage) });
                        }}
                      >
                        Advance stage
                      </Button>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState label="Nothing needs your attention right now." />
          )}
        </Panel>

        <Panel title="Live ecosystem activity" description="Timestamped events across the transaction lifecycle.">
          {e && e.live_ecosystem_activity.length ? (
            <ul className="space-y-3.5">
              {e.live_ecosystem_activity.map((ev) => (
                <li key={ev.id} className="flex gap-3 text-sm">
                  <CircleDot className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
                  <div className="min-w-0">
                    <div className="text-card-foreground">{ev.message}</div>
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{ev.stage}</span>
                      <span>· {ev.at}</span>
                      {ev.reference ? <span>· {ev.reference}</span> : null}
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
        <Panel title="Material location & stage" description="Where every active transaction sits in the RFQ to settlement chain.">
          <DataTable head={["Transaction", "Buyer", "Mineral", "Committed", "Current stage"]}>
            {activeTx.map((tx) => (
              <tr key={tx.id}>
                <Td>
                  <Link to="/portal/transactions/$transactionId" params={{ transactionId: tx.id }} className="hover:underline">
                    {tx.reference}
                  </Link>
                </Td>
                <Td>{tx.buyer_name}</Td>
                <Td>{tx.mineral}</Td>
                <Td>{tonnes(tx.committed_tonnes)}</Td>
                <Td>{tx.stage.replace(/_/g, " ")}</Td>
              </tr>
            ))}
          </DataTable>
          {activeTx.length === 0 ? <EmptyState label="No active transactions." /> : null}
        </Panel>
      </div>

      <div className="mt-6 rounded-md border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <h2 className="text-sm font-semibold text-card-foreground">Mining sites</h2>
          <Button asChild size="sm" variant="ghost">
            <Link to="/portal/sites">
              All sites <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
        <ul className="divide-y divide-border">
          {siteList.map((s) => (
            <li key={s.id} className="flex items-center justify-between gap-4 px-5 py-3.5 text-sm">
              <div>
                <Link to="/portal/sites/$siteId" params={{ siteId: s.id }} className="font-medium text-card-foreground hover:underline">
                  {s.name}
                </Link>
                <div className="text-muted-foreground">
                  {s.mineral} · {s.state ?? "-"}
                </div>
              </div>
              <StatusChip tone={s.status === "operational" ? "success" : "warning"}>{(s.status ?? "").replace("_", " ")}</StatusChip>
            </li>
          ))}
          {siteList.length === 0 ? <li className="px-5 py-3.5 text-sm text-muted-foreground">No sites yet.</li> : null}
        </ul>
      </div>
    </>
  );
}
