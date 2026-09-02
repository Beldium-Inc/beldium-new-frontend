import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useStore } from "@/lib/prototype/store";
import { licences, organisations, samples } from "@/lib/prototype/data";
import { Field, PageHeader, Panel, DemoNote } from "@/components/app/primitives";
import { RiskChip, ScorePill, StatusChip } from "@/components/app/chips";
import { GeoPanel } from "@/components/app/GeoPanel";
import { ScoreBreakdown } from "@/components/app/ScoreBreakdown";
import { ReviewActions } from "@/components/app/ReviewActions";
import { RequestInfoDialog } from "@/components/app/RequestInfoDialog";

export const Route = createFileRoute("/app/sites/$siteId")({ component: SiteDetail });

function SiteDetail() {
  const { siteId } = Route.useParams();
  const { sites, nonConformities, inspections } = useStore();
  const site = sites.find((s) => s.id === siteId);
  const [tab, setTab] = useState<string>("corporate");
  const [infoFor, setInfoFor] = useState<string | null>(null);

  if (!site) {
    return (
      <Panel title="Site not found">
        <p className="text-sm text-muted-foreground">No site matches {siteId}.</p>
        <Button asChild className="mt-4" variant="outline"><Link to="/app/sites">Back to sites</Link></Button>
      </Panel>
    );
  }

  const org = organisations.find((o) => o.id === site.orgId);
  const lic = licences.find((l) => l.id === site.licenceId);

  return (
    <>
      <PageHeader
        eyebrow={org?.name ?? "Organisation"}
        title={`${site.name} — mine review`}
        description="Section-by-section review with evidence, reviewer decisions and an explainable compliance score."
      />
      <div className="mb-5"><DemoNote>Reviewer actions update status, activity and the audit trail locally.</DemoNote></div>

      <Panel title="Review header">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Mine code" value={site.code} />
          <Field label="Mineral" value={site.mineral} />
          <Field label="Licence" value={lic ? `${lic.number} (${lic.type})` : "—"} />
          <Field label="Licence status">{lic ? <StatusChip value={lic.status} /> : null}</Field>
          <Field label="Location" value={`${site.lga}, ${site.state} State`} />
          <Field label="Compliance score"><ScorePill score={site.complianceScore} /></Field>
          <Field label="Risk"><RiskChip value={site.risk} /></Field>
          <Field label="Status"><StatusChip value={site.status} /></Field>
        </div>
      </Panel>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Panel title="Review sections" description="Evidence and reviewer decision per section." bodyClassName="p-4">
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="flex h-auto flex-wrap justify-start gap-1">
              {site.sections.map((s) => (
                <TabsTrigger key={s.key} value={s.key} className="text-xs">{s.title}</TabsTrigger>
              ))}
            </TabsList>
            {site.sections.map((s) => (
              <TabsContent key={s.key} value={s.key} className="mt-4 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm text-muted-foreground">{s.summary}</p>
                  <StatusChip value={s.status} />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  {s.fields.map((f) => (
                    <Field key={f.label} label={f.label} value={f.value} />
                  ))}
                </div>
                <div className="rounded-md border border-border">
                  <Table>
                    <TableHeader><TableRow><TableHead>Evidence</TableHead><TableHead>Reference</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {s.evidence.map((e) => (
                        <TableRow key={e.id}>
                          <TableCell className="text-sm font-medium">{e.name}<p className="text-xs text-muted-foreground">{e.kind}</p></TableCell>
                          <TableCell className="font-mono text-xs">{e.uploaded}</TableCell>
                          <TableCell><StatusChip value={e.status} /></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <ReviewActions siteId={site.id} section={s.key} onRequestInfo={() => setInfoFor(s.key)} />
              </TabsContent>
            ))}
          </Tabs>
        </Panel>

        <div className="space-y-5">
          <ScoreBreakdown site={site} />
          <GeoPanel site={site} />
          <Panel title="Inspections" bodyClassName="p-0">
            <ul className="divide-y divide-border">
              {inspections.filter((i) => i.siteId === site.id).map((i) => (
                <li key={i.id} className="px-5 py-3">
                  <div className="flex items-center justify-between gap-2"><span className="font-mono text-xs">{i.ref}</span><StatusChip value={i.result ?? i.status} /></div>
                  <p className="mt-1 text-sm">{i.type} · {i.scheduled}</p>
                  <p className="text-xs text-muted-foreground">{i.inspector}</p>
                </li>
              ))}
            </ul>
          </Panel>
          <Panel title="Samples & lab results" bodyClassName="p-0">
            <ul className="divide-y divide-border">
              {samples.filter((s) => s.siteId === site.id).map((s) => (
                <li key={s.id} className="px-5 py-3">
                  <div className="flex items-center justify-between gap-2"><span className="font-mono text-xs">{s.ref}</span><StatusChip value={s.status} /></div>
                  <p className="mt-1 text-sm">Li2O {s.li2o}% · {s.lab}</p>
                  <p className="text-xs text-muted-foreground">Collected {s.collected}</p>
                </li>
              ))}
            </ul>
          </Panel>
          <Panel title="Non-conformities" bodyClassName="p-0">
            <ul className="divide-y divide-border">
              {nonConformities.filter((n) => n.siteId === site.id).map((n) => (
                <li key={n.id} className="px-5 py-3">
                  <div className="flex items-center justify-between gap-2"><span className="font-mono text-xs">{n.ref}</span><StatusChip value={n.severity} /></div>
                  <p className="mt-1 text-sm font-medium">{n.title}</p>
                  <p className="text-xs text-muted-foreground">{n.status} · due {n.deadline}</p>
                </li>
              ))}
            </ul>
            <div className="px-5 py-4"><Button asChild size="sm" variant="outline"><Link to="/app/nonconformities">Open non-conformity tracking</Link></Button></div>
          </Panel>
        </div>
      </div>
      {infoFor ? (
        <RequestInfoDialog
          siteId={site.id}
          section={infoFor as never}
          open={infoFor !== null}
          onOpenChange={(o) => setInfoFor(o ? infoFor : null)}
          requestedFrom={org?.name ?? "Operator"}
        />
      ) : null}
    </>
  );
}
