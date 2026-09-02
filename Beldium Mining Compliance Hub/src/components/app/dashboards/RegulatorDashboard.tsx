import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useStore } from "@/lib/prototype/store";
import { envRecords, licences, organisations, safetyIncidents } from "@/lib/prototype/data";
import { KpiCard, PageHeader, Panel, DemoNote } from "../primitives";
import { RiskChip, ScorePill, StatusChip } from "../chips";

export function RegulatorDashboard() {
  const { sites, nonConformities, inspections, activity, regulatorAction } = useStore();
  const [busy, setBusy] = useState<string | null>(null);

  const act = (kind: "Send Reminder" | "Request Information" | "Flag Site" | "Acknowledge Submission", siteId: string) => {
    setBusy(siteId + kind);
    regulatorAction(kind, siteId);
    toast.success(`${kind} recorded`, { description: `${siteId} — oversight action logged to the audit history.` });
    setBusy(null);
  };

  return (
    <>
      <PageHeader
        eyebrow="Federal Ministry of Solid Minerals Development"
        title="Regulatory oversight dashboard"
        description="Sector-wide view of organisations, sites, licences and compliance signals. Oversight actions are limited to reminders, information requests, flags and acknowledgements."
      />
      <div className="mb-5"><DemoNote>Oversight role is read-mostly: no verification, rejection or scoring changes are available here.</DemoNote></div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Registered organisations" value={organisations.length} hint={`${organisations.filter((o) => o.status !== "Active").length} not in good standing`} />
        <KpiCard label="Mine sites" value={sites.length} hint={`${sites.filter((s) => s.status === "Operational").length} operational`} />
        <KpiCard label="Licences expiring or expired" value={licences.filter((l) => l.status !== "Active").length} tone="warning" hint="Renewal exposure across the register" />
        <KpiCard label="Open non-conformities" value={nonConformities.filter((n) => n.status !== "Closed").length} tone="danger" hint={`${nonConformities.filter((n) => n.severity === "Critical" && n.status !== "Closed").length} critical`} />
      </div>

      <div className="mt-5 grid gap-5">
        <Panel title="Organisations register" description="Licence and compliance standing by organisation." bodyClassName="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow><TableHead>Organisation</TableHead><TableHead>RC number</TableHead><TableHead>Sites</TableHead><TableHead>Score</TableHead><TableHead>Risk</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Oversight action</TableHead></TableRow></TableHeader>
              <TableBody>
                {organisations.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="font-medium">{o.name}<p className="text-xs text-muted-foreground">{o.hq}</p></TableCell>
                    <TableCell className="font-mono text-xs">{o.rcNumber}</TableCell>
                    <TableCell className="tabular-nums">{o.siteCount}</TableCell>
                    <TableCell><ScorePill score={o.complianceScore} /></TableCell>
                    <TableCell><RiskChip value={o.risk} /></TableCell>
                    <TableCell><StatusChip value={o.status} /></TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-wrap justify-end gap-1.5">
                        <Button size="sm" variant="outline" disabled={busy !== null} onClick={() => act("Send Reminder", o.id)}>Send reminder</Button>
                        <Button size="sm" variant="outline" disabled={busy !== null} onClick={() => act("Request Information", o.id)}>Request information</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Panel>

        <Panel title="Mine sites — licence & compliance status" bodyClassName="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow><TableHead>Site</TableHead><TableHead>Licence</TableHead><TableHead>Licence status</TableHead><TableHead>Score</TableHead><TableHead>Risk</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
              <TableBody>
                {sites.map((s) => {
                  const lic = licences.find((l) => l.id === s.licenceId);
                  return (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.name}<p className="text-xs text-muted-foreground">{s.lga}, {s.state} State</p></TableCell>
                      <TableCell className="font-mono text-xs">{lic?.number}</TableCell>
                      <TableCell>{lic && <StatusChip value={lic.status} />}</TableCell>
                      <TableCell><ScorePill score={s.complianceScore} /></TableCell>
                      <TableCell><RiskChip value={s.risk} /></TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-wrap justify-end gap-1.5">
                          <Button asChild size="sm" variant="ghost"><Link to="/app/sites/$siteId" params={{ siteId: s.id }}>View status</Link></Button>
                          <Button size="sm" variant="outline" onClick={() => act("Flag Site", s.id)}>Flag site</Button>
                          <Button size="sm" variant="outline" onClick={() => act("Acknowledge Submission", s.id)}>Acknowledge</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </Panel>

        <div className="grid gap-5 lg:grid-cols-2">
          <Panel title="Environmental alerts" bodyClassName="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>Site</TableHead><TableHead>Metric</TableHead><TableHead>Value</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
              <TableBody>
                {envRecords.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="font-mono text-xs">{e.siteId}</TableCell>
                    <TableCell className="text-sm">{e.metric}<p className="text-xs text-muted-foreground">Limit {e.limit}</p></TableCell>
                    <TableCell className="text-sm tabular-nums">{e.value}</TableCell>
                    <TableCell><StatusChip value={e.status} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Panel>
          <Panel title="Safety incidents" bodyClassName="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Site</TableHead><TableHead>Type</TableHead><TableHead>Severity</TableHead></TableRow></TableHeader>
              <TableBody>
                {safetyIncidents.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="text-sm tabular-nums">{s.date}</TableCell>
                    <TableCell className="font-mono text-xs">{s.siteId}</TableCell>
                    <TableCell className="text-sm">{s.type}<p className="text-xs text-muted-foreground">{s.summary}</p></TableCell>
                    <TableCell><StatusChip value={s.severity} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Panel>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <Panel title="Inspections" bodyClassName="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>Reference</TableHead><TableHead>Site</TableHead><TableHead>Date</TableHead><TableHead>Result</TableHead></TableRow></TableHeader>
              <TableBody>
                {inspections.map((i) => (
                  <TableRow key={i.id}>
                    <TableCell className="font-mono text-xs">{i.ref}</TableCell>
                    <TableCell className="font-mono text-xs">{i.siteId}</TableCell>
                    <TableCell className="text-sm tabular-nums">{i.scheduled}</TableCell>
                    <TableCell><StatusChip value={i.result ?? i.status} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Panel>
          <Panel title="Audit history" bodyClassName="p-0">
            <ul className="divide-y divide-border">
              {activity.slice(0, 10).map((a) => (
                <li key={a.id} className="px-5 py-3">
                  <p className="text-sm font-medium">{a.action}</p>
                  <p className="text-xs text-muted-foreground">{a.detail}</p>
                  <p className="text-[10px] text-muted-foreground/70">{a.actor} · {a.at} · {a.target ?? "—"}</p>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>
    </>
  );
}
