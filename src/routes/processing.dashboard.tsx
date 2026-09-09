import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowUpRight,
  CalendarClock,
  ClipboardCheck,
  FileStack,
  Gauge,
  Leaf,
  Siren,
  Factory,
  ShieldAlert,
  FileBarChart,
} from "lucide-react";
import {
  Panel,
  PanelHeader,
  PageHeader,
  Pill,
  RegisterState,
  StatCard,
  ScoreBar,
  RiskBadge,
  statusTone,
} from "@/verticals/processing/bpc";
import { useAppState } from "@/verticals/processing/store";
import { processingTypeLabel } from "@/verticals/processing/domain";

export const Route = createFileRoute("/processing/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard · Beldium Processing Compliance" },
      {
        name: "description",
        content:
          "Role-specific compliance dashboard covering applications, risk, non-conformities, inspections and environmental signals.",
      },
      { property: "og:title", content: "Dashboard · Beldium Processing Compliance" },
      {
        property: "og:description",
        content:
          "Role-specific compliance and oversight dashboard for mineral processing facilities.",
      },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { user } = useAppState();
  if (user?.role === "processor") return <ApplicantDashboard />;
  return user?.role === "operator" ? <OperatorDashboard /> : <RegulatorDashboard />;
}

/**
 * The applicant's own position: how far their submission has got, what is
 * still outstanding, and what the desk has asked of them.
 */
function ApplicantDashboard() {
  const { myApplication, nonConformities, inspections, isLoading, error } = useAppState();
  const openFindings = nonConformities.filter((n) => n.status !== "Closed");
  const upcoming = inspections.filter((i) => i.status !== "Completed");

  if (!myApplication) {
    return (
      <>
        <PageHeader
          eyebrow="Applicant"
          title="Your processing compliance application"
          description="Register your facility with the Beldium compliance desk: ten evidence sections, reviewed one at a time."
        />
        <Panel>
          <RegisterState
            isLoading={isLoading}
            error={error}
            empty={{
              title: "You have not started an application",
              body: "Starting one lays down the ten evidence sections and shows exactly what to supply.",
            }}
          />
          <div className="border-t border-border px-5 py-4 text-center">
            <Link
              to="/processing/onboarding"
              className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            >
              Start an application
            </Link>
          </div>
        </Panel>
      </>
    );
  }

  const submittable = myApplication.completeness === 100;

  return (
    <>
      <PageHeader
        eyebrow="Applicant"
        title={myApplication.company}
        description={`${myApplication.id} · ${myApplication.facility || "Facility not named"}`}
        actions={
          <Link
            to="/processing/application"
            className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Open my application
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Completeness"
          value={`${myApplication.completeness}%`}
          hint={submittable ? "Ready to submit" : "Evidence still outstanding"}
          tone={submittable ? "success" : "warning"}
          icon={<Gauge className="size-4" />}
        />
        <StatCard
          label="Stage"
          value={myApplication.stage}
          hint={myApplication.decision ?? "No decision yet"}
          icon={<ClipboardCheck className="size-4" />}
        />
        <StatCard
          label="Open findings"
          value={openFindings.length}
          hint="Awaiting corrective action"
          tone={openFindings.length ? "danger" : "success"}
          icon={<ShieldAlert className="size-4" />}
        />
        <StatCard
          label="Inspections"
          value={upcoming.length}
          hint="Requested or scheduled"
          icon={<CalendarClock className="size-4" />}
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Panel>
          <PanelHeader
            title="What the desk is waiting for"
            subtitle="Findings raised against your application"
            icon={<AlertTriangle className="size-4" />}
          />
          {openFindings.length === 0 ? (
            <p className="px-5 py-6 text-center text-xs text-muted-foreground">
              Nothing outstanding. Any finding raised during review will appear here.
            </p>
          ) : (
            <div className="divide-y divide-border">
              {openFindings.map((finding) => (
                <Link
                  key={finding.id}
                  to="/processing/nonconformities"
                  className="block px-5 py-3 hover:bg-accent/60"
                >
                  <div className="flex items-center gap-2">
                    <Pill tone={statusTone(finding.severity)}>{finding.severity}</Pill>
                    <span className="text-[11px] text-muted-foreground">due {finding.due}</span>
                  </div>
                  <p className="mt-1 text-xs font-medium">{finding.title}</p>
                </Link>
              ))}
            </div>
          )}
        </Panel>

        <Panel>
          <PanelHeader
            title="Inspection record"
            subtitle="Site visits linked to your facility"
            icon={<ClipboardCheck className="size-4" />}
          />
          {upcoming.length === 0 ? (
            <p className="px-5 py-6 text-center text-xs text-muted-foreground">
              No inspection is currently scheduled.
            </p>
          ) : (
            <div className="divide-y divide-border">
              {upcoming.map((inspection) => (
                <div key={inspection.id} className="px-5 py-3">
                  <p className="text-xs font-medium">{inspection.facility}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {inspection.type} · {inspection.scheduled} · {inspection.inspector}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>
    </>
  );
}

function TrendBars() {
  const { kpiTrend } = useAppState();
  // Math.max() of an empty list is -Infinity, which renders every bar wrong.
  const max = Math.max(1, ...kpiTrend.map((k) => k.inspections));
  return (
    <div className="flex items-end gap-4 px-5 py-5">
      {kpiTrend.map((k) => (
        <div key={k.month} className="flex flex-1 flex-col items-center gap-2">
          <div className="flex h-32 w-full items-end justify-center gap-1">
            <div
              className="w-2.5 rounded-t bg-primary"
              style={{ height: `${(k.approvals / max) * 100}%` }}
              title={`${k.approvals} approvals`}
            />
            <div
              className="w-2.5 rounded-t bg-warning"
              style={{ height: `${(k.nonconformities / max) * 100}%` }}
              title={`${k.nonconformities} non-conformities`}
            />
            <div
              className="w-2.5 rounded-t bg-secondary"
              style={{ height: `${(k.inspections / max) * 100}%` }}
              title={`${k.inspections} inspections`}
            />
          </div>
          <span className="text-[11px] text-muted-foreground">{k.month}</span>
        </div>
      ))}
    </div>
  );
}

function Legend() {
  return (
    <div className="flex flex-wrap gap-4 border-t border-border px-5 py-3 text-[11px] text-muted-foreground">
      <span className="flex items-center gap-1.5">
        <span className="size-2 rounded-full bg-primary" /> Approvals
      </span>
      <span className="flex items-center gap-1.5">
        <span className="size-2 rounded-full bg-warning" /> Non-conformities
      </span>
      <span className="flex items-center gap-1.5">
        <span className="size-2 rounded-full bg-secondary" /> Inspections
      </span>
    </div>
  );
}

function OperatorDashboard() {
  const {
    applications,
    nonConformities,
    inspections,
    user,
    processors,
    envAlerts,
    incidents,
    expiringDocs,
  } = useAppState();
  const pending = applications.filter((a) => a.stage !== "Decided");
  const openNCs = nonConformities.filter((n) => n.status !== "Closed");
  const openInspections = inspections.filter((i) => i.status !== "Completed");
  const avgRisk = applications.length
    ? Math.round(applications.reduce((s, a) => s + a.riskScore, 0) / applications.length)
    : 0;

  return (
    <>
      <PageHeader
        eyebrow="Compliance operations"
        title={`Good morning, ${user?.name.split(" ")[0]}`}
        description="Applications assigned to the Beldium compliance desk, with risk posture, expiring documentation and open corrective actions."
        actions={
          <>
            <Link
              to="/processing/onboarding"
              className="rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-accent"
            >
              Start application
            </Link>
            <Link
              to="/processing/applications"
              className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              Review queue
            </Link>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Applications"
          value={applications.length}
          hint={`${pending.length} awaiting a decision`}
          icon={<FileStack className="size-4" />}
        />
        <StatCard
          label="Pending reviews"
          value={pending.length}
          hint="Assigned to your desk"
          tone="info"
          icon={<ClipboardCheck className="size-4" />}
        />
        <StatCard
          label="Portfolio risk score"
          value={avgRisk}
          hint="Weighted mean across active applications"
          tone={avgRisk >= 55 ? "danger" : avgRisk >= 30 ? "warning" : "success"}
          icon={<Gauge className="size-4" />}
        />
        <StatCard
          label="Open non-conformities"
          value={openNCs.length}
          hint={`${nonConformities.filter((n) => n.status === "Evidence Submitted").length} awaiting evidence review`}
          tone="danger"
          icon={<AlertTriangle className="size-4" />}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Panel className="xl:col-span-2">
          <PanelHeader
            title="Active review queue"
            subtitle="Applications requiring operator action"
            icon={<FileStack className="size-4" />}
            action={
              <Link
                to="/processing/applications"
                className="text-xs font-medium text-primary hover:underline"
              >
                View all
              </Link>
            }
          />
          <div className="divide-y divide-border">
            {pending.map((a) => (
              <Link
                key={a.id}
                to="/processing/applications/$id"
                params={{ id: a.id }}
                className="flex flex-wrap items-center gap-3 px-5 py-4 hover:bg-accent/60"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-medium">{a.company}</p>
                    <Pill tone={statusTone(a.stage)}>{a.stage}</Pill>
                  </div>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {a.id} · {processingTypeLabel(a.processingType)} · {a.lga} LGA, {a.state} State
                  </p>
                </div>
                <div className="w-32">
                  <p className="mb-1 text-[10px] text-muted-foreground">
                    Completeness {a.completeness}%
                  </p>
                  <ScoreBar
                    value={a.completeness}
                    tone={a.completeness > 85 ? "success" : "warning"}
                  />
                </div>
                <RiskBadge score={a.riskScore} />
                <ArrowUpRight className="size-4 text-muted-foreground" />
              </Link>
            ))}
          </div>
        </Panel>

        <div className="space-y-6">
          <Panel>
            <PanelHeader
              title="Expiring documentation"
              subtitle="Next 90 days"
              icon={<CalendarClock className="size-4" />}
            />
            <div className="divide-y divide-border">
              {expiringDocs.map((d) => (
                <div key={d.ref} className="px-5 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-medium">{d.doc}</p>
                    <Pill tone={d.days < 0 ? "danger" : d.days < 60 ? "warning" : "neutral"}>
                      {d.days < 0 ? `${Math.abs(d.days)}d overdue` : `${d.days}d`}
                    </Pill>
                  </div>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {d.company} · {d.ref}
                  </p>
                </div>
              ))}
            </div>
          </Panel>

          <Panel>
            <PanelHeader
              title="Inspection activity"
              subtitle="Flagged and scheduled site visits"
              icon={<ClipboardCheck className="size-4" />}
              action={
                <Link
                  to="/processing/inspections"
                  className="text-xs font-medium text-primary hover:underline"
                >
                  Open
                </Link>
              }
            />
            <div className="divide-y divide-border">
              {openInspections.slice(0, 4).map((i) => (
                <div key={i.id} className="px-5 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-medium">{i.company}</p>
                    <Pill tone={statusTone(i.status)}>{i.status}</Pill>
                  </div>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {i.id} · {i.type} · {i.scheduled}
                  </p>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Panel className="xl:col-span-2">
          <PanelHeader
            title="Desk throughput"
            subtitle="Approvals, non-conformities and inspections, last 6 months"
            icon={<Gauge className="size-4" />}
          />
          <TrendBars />
          <Legend />
        </Panel>

        <Panel>
          <PanelHeader
            title="Open non-conformities"
            subtitle="Corrective actions in flight"
            icon={<ShieldAlert className="size-4" />}
            action={
              <Link
                to="/processing/nonconformities"
                className="text-xs font-medium text-primary hover:underline"
              >
                Manage
              </Link>
            }
          />
          <div className="divide-y divide-border">
            {openNCs.map((n) => (
              <div key={n.id} className="px-5 py-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-medium">{n.id}</p>
                  <Pill tone={statusTone(n.severity)}>{n.severity}</Pill>
                </div>
                <p className="mt-0.5 text-[11px] text-muted-foreground">{n.title}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {n.company} · due {n.due}
                </p>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </>
  );
}

function RegulatorDashboard() {
  const {
    nonConformities,
    inspections,
    processors,
    envAlerts,
    incidents,
    regionalCompliance,
    totals,
  } = useAppState();
  const openAlerts = envAlerts.filter((a) => a.status !== "Resolved");
  const facilities = processors.reduce((sum, p) => sum + p.facilities, 0);

  return (
    <>
      <PageHeader
        eyebrow="Regulatory oversight"
        title="National processing compliance overview"
        description="Read-only oversight of registered processors, regional compliance posture, inspections, environmental exceedances and incidents. Approval and configuration controls are not available to this role."
        actions={
          <Pill tone="info">
            <Gauge className="size-3" /> Oversight permissions · read-only
          </Pill>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Registered processors"
          value={totals?.processors ?? processors.length}
          hint={`${facilities} ${facilities === 1 ? "facility" : "facilities"} nationally`}
          icon={<Factory className="size-4" />}
        />
        <StatCard
          label="National compliance"
          value={`${totals?.average_compliance_score ?? 0}%`}
          hint={`Mean across ${regionalCompliance.length} ${regionalCompliance.length === 1 ? "region" : "regions"}`}
          tone="success"
          icon={<Gauge className="size-4" />}
        />
        <StatCard
          label="Open environmental alerts"
          value={openAlerts.length}
          hint={`${envAlerts.filter((a) => a.severity === "Critical").length} critical exceedance`}
          tone="warning"
          icon={<Leaf className="size-4" />}
        />
        <StatCard
          label="Incidents under investigation"
          value={incidents.filter((i) => i.status === "Under Investigation").length}
          hint="Reported in the last 30 days"
          tone="danger"
          icon={<Siren className="size-4" />}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Panel className="xl:col-span-2">
          <PanelHeader
            title="Regional compliance status"
            subtitle="Processor standing by geopolitical zone"
            icon={<Factory className="size-4" />}
            action={
              <Link
                to="/processing/monitoring"
                className="text-xs font-medium text-primary hover:underline"
              >
                Compliance monitoring
              </Link>
            }
          />
          <div className="divide-y divide-border">
            {regionalCompliance.map((r) => (
              <div key={r.region} className="px-5 py-4">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium">{r.region}</p>
                  <span className="text-[11px] text-muted-foreground">
                    {r.processors} processors
                  </span>
                  <Pill
                    tone={r.avgScore >= 78 ? "success" : r.avgScore >= 70 ? "warning" : "danger"}
                    className="ml-auto"
                  >
                    Avg score {r.avgScore}
                  </Pill>
                </div>
                <div className="mt-2">
                  <ScoreBar
                    value={r.avgScore}
                    tone={r.avgScore >= 78 ? "success" : r.avgScore >= 70 ? "warning" : "danger"}
                  />
                </div>
                <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-muted-foreground">
                  <span>{r.compliant} compliant</span>
                  <span>{r.conditional} conditional</span>
                  <span>{r.suspended} suspended</span>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <div className="space-y-6">
          <Panel>
            <PanelHeader
              title="Environmental alerts"
              subtitle="Threshold exceedances"
              icon={<Leaf className="size-4" />}
              action={
                <Link
                  to="/processing/environmental"
                  className="text-xs font-medium text-primary hover:underline"
                >
                  Open
                </Link>
              }
            />
            <div className="divide-y divide-border">
              {envAlerts.slice(0, 3).map((a) => (
                <div key={a.id} className="px-5 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-medium">{a.parameter}</p>
                    <Pill tone={statusTone(a.severity)}>{a.severity}</Pill>
                  </div>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {a.facility} · {a.reading} vs {a.threshold}
                  </p>
                </div>
              ))}
            </div>
          </Panel>

          <Panel>
            <PanelHeader
              title="Inspection queue"
              subtitle="Scheduled and requested"
              icon={<ClipboardCheck className="size-4" />}
              action={
                <Link
                  to="/processing/inspections"
                  className="text-xs font-medium text-primary hover:underline"
                >
                  Open
                </Link>
              }
            />
            <div className="divide-y divide-border">
              {inspections.slice(0, 4).map((i) => (
                <div key={i.id} className="px-5 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-medium">{i.facility}</p>
                    <Pill tone={statusTone(i.status)}>{i.status}</Pill>
                  </div>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {i.id} · {i.state} State · {i.scheduled}
                  </p>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Panel className="xl:col-span-2">
          <PanelHeader
            title="National activity trend"
            subtitle="Approvals, non-conformities and inspections"
            icon={<FileBarChart className="size-4" />}
          />
          <TrendBars />
          <Legend />
        </Panel>

        <Panel>
          <PanelHeader
            title="Non-conformity register"
            subtitle="Across all registered processors"
            icon={<AlertTriangle className="size-4" />}
            action={
              <Link
                to="/processing/nonconformities"
                className="text-xs font-medium text-primary hover:underline"
              >
                Open
              </Link>
            }
          />
          <div className="divide-y divide-border">
            {nonConformities.slice(0, 4).map((n) => (
              <div key={n.id} className="px-5 py-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-medium">{n.id}</p>
                  <Pill tone={statusTone(n.status)}>{n.status}</Pill>
                </div>
                <p className="mt-0.5 text-[11px] text-muted-foreground">{n.company}</p>
                <p className="text-[11px] text-muted-foreground">{n.title}</p>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </>
  );
}
