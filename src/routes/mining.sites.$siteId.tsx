import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { FileSearch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useSiteDetail, useStore } from "@/verticals/mining/store";
import { Field, PageHeader, Panel } from "@/verticals/mining/components/primitives";
import { RiskChip, ScorePill, StatusChip } from "@/verticals/mining/components/chips";
import { GeoPanel } from "@/verticals/mining/components/GeoPanel";
import { ScoreBreakdown } from "@/verticals/mining/components/ScoreBreakdown";
import { ReviewActions } from "@/verticals/mining/components/ReviewActions";
import { RequestInfoDialog } from "@/verticals/mining/components/RequestInfoDialog";
import { useMiningDocuments } from "@/lib/api/mining-queries";
import { SiteDocumentViewer } from "@/verticals/mining/components/SiteDocumentViewer";

export const Route = createFileRoute("/mining/sites/$siteId")({ component: SiteDetail });

function SiteDetail() {
  const { siteId } = Route.useParams();
  const { nonConformities, inspections, organisations, licences, samples } = useStore();
  const { site, isLoading } = useSiteDetail(siteId);
  const [tab, setTab] = useState<string>("corporate");
  const [infoFor, setInfoFor] = useState<string | null>(null);
  const documentsQuery = useMiningDocuments({ site: siteId });
  const [openDocumentId, setOpenDocumentId] = useState<string | null>(null);

  if (!site) {
    return (
      <Panel title={isLoading ? "Loading site…" : "Site not found"}>
        <p className="text-sm text-muted-foreground">
          {isLoading ? "Fetching the mine review record." : `No site matches ${siteId}.`}
        </p>
        {!isLoading && (
          <Button asChild className="mt-4" variant="outline">
            <Link to="/mining/sites">Back to sites</Link>
          </Button>
        )}
      </Panel>
    );
  }

  const org = organisations.find((o) => o.id === site.orgId);
  const lic = licences.find((l) => l.siteId === site.id);
  const documents = documentsQuery.data?.results ?? [];

  return (
    <>
      <PageHeader
        eyebrow={org?.name ?? "Organisation"}
        title={`${site.name}: mine review`}
        description="Section-by-section review with evidence, reviewer decisions and an explainable compliance score."
      />

      <Panel title="Review header">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Mine code" value={site.code} />
          <Field label="Mineral" value={site.mineral} />
          <Field label="Licence" value={lic ? `${lic.number} (${lic.type})` : "-"} />
          <Field label="Licence status">{lic ? <StatusChip value={lic.status} /> : null}</Field>
          <Field label="Location" value={`${site.lga}, ${site.state} State`} />
          <Field label="Compliance score">
            <ScorePill score={site.complianceScore} />
          </Field>
          <Field label="Risk">
            <RiskChip value={site.risk} />
          </Field>
          <Field label="Status">
            <StatusChip value={site.status === "Operational" ? "Verified" : site.status} />
          </Field>
        </div>
      </Panel>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Panel
          title="Review sections"
          description="Evidence and reviewer decision per section."
          bodyClassName="p-4"
        >
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="flex h-auto flex-wrap justify-start gap-1">
              {site.sections.map((s) => (
                <TabsTrigger key={s.key} value={s.key} className="text-xs">
                  {s.title}
                </TabsTrigger>
              ))}
            </TabsList>
            {site.sections.map((s) => (
              <TabsContent key={s.key} value={s.key} className="mt-4 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-base font-semibold">{s.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {s.summary || "No summary has been provided for this section."}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Weight {s.weight}% · Section score {s.score}/100
                    </p>
                  </div>
                  <StatusChip value={s.status} />
                </div>
                {s.decidedBy ? (
                  <div className="rounded-md border border-border bg-muted/40 p-3 text-sm">
                    <p>
                      Last decision by <span className="font-medium">{s.decidedBy}</span>
                      {s.decidedAt ? ` on ${new Date(s.decidedAt).toLocaleString()}` : ""}
                    </p>
                    {s.decisionNote ? (
                      <p className="mt-1 text-muted-foreground">{s.decisionNote}</p>
                    ) : null}
                  </div>
                ) : null}
                {s.fields.length ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {s.fields.map((f) => (
                      <Field key={f.label} label={f.label} value={f.value} />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    The miner has not submitted any answers for this section yet.
                  </p>
                )}
                <div className="rounded-md border border-border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Evidence</TableHead>
                        <TableHead>Reference</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {s.evidence.map((e) => (
                        <TableRow key={e.id}>
                          <TableCell className="text-sm font-medium">
                            {e.name}
                            <p className="text-xs text-muted-foreground">{e.kind}</p>
                          </TableCell>
                          <TableCell className="font-mono text-xs">{e.uploaded}</TableCell>
                          <TableCell>
                            <StatusChip value={e.status} />
                          </TableCell>
                        </TableRow>
                      ))}
                      {s.evidence.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={3} className="text-sm text-muted-foreground">
                            No evidence uploaded for this section.
                          </TableCell>
                        </TableRow>
                      ) : null}
                    </TableBody>
                  </Table>
                </div>
                <ReviewActions
                  siteId={site.id}
                  section={s.key}
                  onRequestInfo={() => setInfoFor(s.key)}
                />
              </TabsContent>
            ))}
          </Tabs>
        </Panel>

        <div className="space-y-5">
          <ScoreBreakdown site={site} />
          <GeoPanel site={site} />
          <Panel title="Inspections" bodyClassName="p-0">
            <ul className="divide-y divide-border">
              {inspections
                .filter((i) => i.siteId === site.id)
                .map((i) => (
                  <li key={i.id} className="px-5 py-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs">{i.ref}</span>
                      <StatusChip value={i.result ?? i.status} />
                    </div>
                    <p className="mt-1 text-sm">
                      {i.type} · {i.scheduled}
                    </p>
                    <p className="text-xs text-muted-foreground">{i.inspector}</p>
                  </li>
                ))}
            </ul>
          </Panel>
          <Panel title="Samples & lab results" bodyClassName="p-0">
            <ul className="divide-y divide-border">
              {samples
                .filter((s) => s.siteId === site.id)
                .map((s) => (
                  <li key={s.id} className="px-5 py-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs">{s.ref}</span>
                      <StatusChip value={s.status} />
                    </div>
                    <p className="mt-1 text-sm">
                      Li2O {s.li2o}% · {s.lab}
                    </p>
                    <p className="text-xs text-muted-foreground">Collected {s.collected}</p>
                  </li>
                ))}
            </ul>
          </Panel>
          <Panel title="Uploaded documents" bodyClassName="p-0">
            <ul className="divide-y divide-border">
              {documents.map((d) => (
                <li key={d.id} className="px-5 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium">{d.name}</span>
                    <StatusChip value={d.status} />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {d.category} · {d.original_name || "no file"} · uploaded by {d.uploaded_by_name}
                  </p>
                  <div className="mt-2">
                    <Button
                      size="sm"
                      variant={d.status === "pending" ? "default" : "outline"}
                      disabled={!d.file_url}
                      title={!d.file_url ? "No file was uploaded for this document" : undefined}
                      onClick={() => setOpenDocumentId(d.id)}
                    >
                      <FileSearch className="size-3.5" />
                      {d.status === "pending" ? "Open & review" : "View document"}
                    </Button>
                  </div>
                </li>
              ))}
              {documents.length === 0 ? (
                <li className="px-5 py-6 text-sm text-muted-foreground">
                  No documents uploaded for this site.
                </li>
              ) : null}
            </ul>
          </Panel>
          <SiteDocumentViewer
            documents={documents}
            documentId={openDocumentId}
            context={{
              siteName: site.name,
              siteCode: site.code,
              organisationName: org?.name ?? null,
              licence: lic ? `${lic.number} (${lic.type})` : null,
              location: `${site.lga}, ${site.state} State`,
            }}
            onNavigate={setOpenDocumentId}
            onClose={() => setOpenDocumentId(null)}
          />
          <Panel title="Non-conformities" bodyClassName="p-0">
            <ul className="divide-y divide-border">
              {nonConformities
                .filter((n) => n.siteId === site.id)
                .map((n) => (
                  <li key={n.id} className="px-5 py-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs">{n.ref}</span>
                      <StatusChip value={n.severity} />
                    </div>
                    <p className="mt-1 text-sm font-medium">{n.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {n.status} · due {n.deadline}
                    </p>
                  </li>
                ))}
            </ul>
            <div className="px-5 py-4">
              <Button asChild size="sm" variant="outline">
                <Link to="/mining/nonconformities">Open non-conformity tracking</Link>
              </Button>
            </div>
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
