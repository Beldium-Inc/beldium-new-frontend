import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useMiner } from "@/verticals/miner/store";
import { KpiCard, Panel, PageHeader, Field, EmptyState } from "../primitives";
import { RiskChip, ScorePill, StatusChip, Chip } from "../chips";

export function MinerDashboard() {
  const { sites, primarySite, nonConformities, infoRequests, orgName } = useMiner();

  if (!primarySite) {
    return (
      <>
        <PageHeader
          title="Dashboard"
          description="Your organisation, sites, production and compliance in one place."
        />
        <EmptyState
          title="No mine site is associated with this account yet."
          description="Submit an organisation application to get started."
        />
        <div className="mt-4">
          <Button asChild>
            <Link to="/miner/application">Start application</Link>
          </Button>
        </div>
      </>
    );
  }

  const openNc = nonConformities.filter(
    (n) => sites.some((m) => m.id === n.siteId) && n.status !== "Closed",
  );
  const openIr = infoRequests.filter((r) => r.status === "Open");

  return (
    <>
      <PageHeader
        eyebrow={orgName}
        title="Miner dashboard"
        description="Your organisation's compliance position, site status and outstanding actions."
        actions={
          <Button asChild>
            <Link to="/miner/actions">Open action required ({openNc.length + openIr.length})</Link>
          </Button>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Site compliance"
          value={`${primarySite.complianceScore}/100`}
          hint={`${primarySite.risk} risk band`}
          tone={primarySite.complianceScore >= 80 ? "success" : "warning"}
        />
        <KpiCard
          label="Mine status"
          value={primarySite.status}
          hint={`${primarySite.code} · ${primarySite.mineral}`}
          tone={primarySite.status === "Operational" ? "success" : "warning"}
        />
        <KpiCard
          label="Licensed capacity"
          value={`${primarySite.capacityTpa.toLocaleString()} t/yr`}
          {...(primarySite.capacityTpa
            ? {
                hint: `Current run rate ${primarySite.currentTpa.toLocaleString()} t/yr (${Math.round((primarySite.currentTpa / primarySite.capacityTpa) * 100)}%)`,
              }
            : {})}
        />
        <KpiCard
          label="Open actions required"
          value={openNc.length + openIr.length}
          hint={`${openNc.length} non-conformities · ${openIr.length} information requests`}
          tone="danger"
        />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Panel title={`Site dashboard: ${primarySite.name}`} description="Verification status and production position.">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Compliance score">
              <ScorePill score={primarySite.complianceScore} />
            </Field>
            <Field label="Risk">
              <RiskChip value={primarySite.risk} />
            </Field>
            <Field label="Mine status">
              <StatusChip value={primarySite.status} />
            </Field>
            <Field label="Site verification">
              <StatusChip value={primarySite.verification.site ? "Verified" : "Pending"} />
            </Field>
            <Field label="Licence verification">
              <StatusChip value={primarySite.verification.licence ? "Verified" : "Pending"} />
            </Field>
            <Field label="Documents verification">
              <StatusChip value={primarySite.verification.documents ? "Verified" : "Pending"} />
            </Field>
            <Field label="Workforce" value={`${primarySite.workforce} people`} />
            <Field label="Last inspection" value={primarySite.lastInspection || "—"} />
            <Field label="Location" value={`${primarySite.lga}, ${primarySite.state} State`} />
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button asChild size="sm" variant="outline">
              <Link to="/miner/production">Production</Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link to="/miner/inventory">Inventory</Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link to="/miner/documents">Documents</Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link to="/miner/compliance">Compliance</Link>
            </Button>
          </div>
        </Panel>

        <Panel title="Action required" description="Items awaiting your response." bodyClassName="p-0">
          <ul className="divide-y divide-border">
            {openNc.map((n) => (
              <li key={n.id} className="px-5 py-3.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs text-muted-foreground">{n.ref}</span>
                  <StatusChip value={n.severity} />
                </div>
                <p className="mt-1 text-sm font-medium">{n.title}</p>
                <p className="text-xs text-muted-foreground">Due {n.deadline}</p>
                <Button asChild size="sm" variant="outline" className="mt-2">
                  <Link to="/miner/actions">Respond</Link>
                </Button>
              </li>
            ))}
            {openIr.map((r) => (
              <li key={r.id} className="px-5 py-3.5">
                <div className="flex items-center justify-between gap-2">
                  <Chip tone="info">Information request</Chip>
                  <StatusChip value={r.priority} />
                </div>
                <p className="mt-1 text-sm font-medium">{r.subject}</p>
                <p className="text-xs text-muted-foreground">Due {r.dueBy}</p>
                <Button asChild size="sm" variant="outline" className="mt-2">
                  <Link to="/miner/actions">Respond</Link>
                </Button>
              </li>
            ))}
            {openNc.length + openIr.length === 0 && (
              <li className="px-5 py-8 text-center text-sm text-muted-foreground">
                Nothing outstanding right now.
              </li>
            )}
          </ul>
        </Panel>
      </div>

      <div className="mt-5">
        <Panel title="My sites" bodyClassName="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Site</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Score</TableHead>
                <TableHead className="text-right">Open</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sites.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">
                    {s.name}
                    <p className="text-xs text-muted-foreground">{s.mineral}</p>
                  </TableCell>
                  <TableCell>
                    <StatusChip value={s.status} />
                  </TableCell>
                  <TableCell>
                    <ScorePill score={s.complianceScore} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild size="sm" variant="outline">
                      <Link to="/miner/sites/$siteId" params={{ siteId: s.id }}>
                        View
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Panel>
      </div>
    </>
  );
}
