import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useStore } from "@/lib/prototype/store";
import { MINER_ORG_ID, MINER_PRIMARY_SITE, organisations } from "@/lib/prototype/data";
import { KpiCard, Panel, PageHeader, Field, DemoNote } from "../primitives";
import { RiskChip, ScorePill, StatusChip, Chip } from "../chips";

export function MinerDashboard() {
  const { sites, nonConformities, infoRequests, inspections } = useStore();
  const org = organisations.find((o) => o.id === MINER_ORG_ID)!;
  const mine = sites.filter((s) => s.orgId === MINER_ORG_ID);
  const site = mine.find((s) => s.id === MINER_PRIMARY_SITE)!;
  const openNc = nonConformities.filter((n) => mine.some((m) => m.id === n.siteId) && n.status !== "Closed");
  const openIr = infoRequests.filter((r) => r.status === "Open");

  return (
    <>
      <PageHeader
        eyebrow={org.name}
        title="Operator dashboard"
        description="Your organisation's compliance position, site status and outstanding actions."
        actions={
          <Button asChild>
            <Link to="/app/actions">Open action required ({openNc.length + openIr.length})</Link>
          </Button>
        }
      />
      <div className="mb-5"><DemoNote>Seeded operator view for {org.name}. All submissions stay in your browser.</DemoNote></div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Organisation compliance" value={`${org.complianceScore}/100`} hint={`${org.risk} risk band`} tone={org.complianceScore >= 80 ? "success" : "warning"} />
        <KpiCard label="Mine status" value={site.status} hint={`${site.code} · ${site.mineral}`} tone={site.status === "Operational" ? "success" : "warning"} />
        <KpiCard label="Licensed capacity" value={`${site.capacityTpa.toLocaleString()} t/yr`} hint={`Current run rate ${site.currentTpa.toLocaleString()} t/yr (${Math.round((site.currentTpa / site.capacityTpa) * 100)}%)`} />
        <KpiCard label="Open actions required" value={openNc.length + openIr.length} hint={`${openNc.length} non-conformities · ${openIr.length} information requests`} tone="danger" />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Panel title={`Site dashboard — ${site.name}`} description="Verification status and production position.">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Compliance score"><ScorePill score={site.complianceScore} /></Field>
            <Field label="Risk"><RiskChip value={site.risk} /></Field>
            <Field label="Mine status"><StatusChip value={site.status} /></Field>
            <Field label="Site verification"><StatusChip value={site.verification.site ? "Verified" : "Pending"} /></Field>
            <Field label="Licence verification"><StatusChip value={site.verification.licence ? "Verified" : "Pending"} /></Field>
            <Field label="Documents verification"><StatusChip value={site.verification.documents ? "Verified" : "Pending"} /></Field>
            <Field label="Workforce" value={`${site.workforce} people`} />
            <Field label="Last inspection" value={site.lastInspection} />
            <Field label="Location" value={`${site.lga}, ${site.state} State`} />
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button asChild size="sm" variant="outline"><Link to="/app/production">Production</Link></Button>
            <Button asChild size="sm" variant="outline"><Link to="/app/inventory">Inventory</Link></Button>
            <Button asChild size="sm" variant="outline"><Link to="/app/transactions">Transactions</Link></Button>
            <Button asChild size="sm" variant="outline"><Link to="/app/documents">Licences &amp; documents</Link></Button>
            <Button asChild size="sm" variant="outline"><Link to="/app/compliance">Compliance</Link></Button>
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
                <Button asChild size="sm" variant="outline" className="mt-2"><Link to="/app/actions">Respond</Link></Button>
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
                <Button asChild size="sm" variant="outline" className="mt-2"><Link to="/app/actions">Respond</Link></Button>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Panel title="My sites" bodyClassName="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>Site</TableHead><TableHead>Status</TableHead><TableHead>Score</TableHead><TableHead className="text-right">Open</TableHead></TableRow></TableHeader>
            <TableBody>
              {mine.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.name}<p className="text-xs text-muted-foreground">{s.mineral}</p></TableCell>
                  <TableCell><StatusChip value={s.status} /></TableCell>
                  <TableCell><ScorePill score={s.complianceScore} /></TableCell>
                  <TableCell className="text-right"><Button asChild size="sm" variant="outline"><Link to="/app/sites/$siteId" params={{ siteId: s.id }}>View</Link></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Panel>
        <Panel title="Upcoming & recent inspections" bodyClassName="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>Reference</TableHead><TableHead>Type</TableHead><TableHead>Date</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
            <TableBody>
              {inspections.filter((i) => mine.some((m) => m.id === i.siteId)).map((i) => (
                <TableRow key={i.id}>
                  <TableCell className="font-mono text-xs">{i.ref}</TableCell>
                  <TableCell className="text-sm">{i.type}</TableCell>
                  <TableCell className="text-sm tabular-nums">{i.scheduled}</TableCell>
                  <TableCell><StatusChip value={i.status} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Panel>
      </div>
    </>
  );
}
