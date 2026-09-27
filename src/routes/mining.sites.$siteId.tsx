import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { FileSearch, FileX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSiteDetail, useStore } from "@/verticals/mining/store";
import { Field, PageHeader, Panel } from "@/verticals/mining/components/primitives";
import { RiskChip, ScorePill, StatusChip } from "@/verticals/mining/components/chips";
import { GeoPanel } from "@/verticals/mining/components/GeoPanel";
import { ScoreBreakdown } from "@/verticals/mining/components/ScoreBreakdown";
import { ReviewActions } from "@/verticals/mining/components/ReviewActions";
import { RequestInfoDialog } from "@/verticals/mining/components/RequestInfoDialog";
import { useSiteFiles } from "@/lib/api/mining-queries";
import { SiteDocumentViewer } from "@/verticals/mining/components/SiteDocumentViewer";
import { buildSiteFiles, SOURCE_LABEL, type SiteFile } from "@/verticals/mining/site-files";

const statusLabel = (status: string) =>
  status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

/** One submitted file, with the action that opens it in the viewer. */
function FileRow({
  file,
  showSection,
  onOpen,
}: {
  file: SiteFile;
  showSection: boolean;
  onOpen: () => void;
}) {
  const awaiting = file.source === "document" && file.status === "pending";
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
      <div className="min-w-0 flex-1">
        <button
          type="button"
          className="text-left text-sm font-medium hover:underline disabled:no-underline"
          disabled={!file.downloadUrl}
          onClick={onOpen}
        >
          {file.name}
        </button>
        <p className="break-words text-xs text-muted-foreground">
          {SOURCE_LABEL[file.source]}
          {showSection && file.sectionTitle ? ` · ${file.sectionTitle}` : ""}
          {` · ${file.siteName}`}
          {file.originalName ? ` · ${file.originalName}` : ""}
          {file.uploadedBy ? ` · by ${file.uploadedBy}` : ""}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <StatusChip value={statusLabel(file.status)} />
        {file.downloadUrl ? (
          <Button size="sm" variant={awaiting ? "default" : "outline"} onClick={onOpen}>
            <FileSearch className="size-3.5" />
            {awaiting ? "Open & review" : "Open"}
          </Button>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <FileX className="size-3.5" /> No file attached
          </span>
        )}
      </div>
    </li>
  );
}

export const Route = createFileRoute("/mining/sites/$siteId")({ component: SiteDetail });

function SiteDetail() {
  const { siteId } = Route.useParams();
  const { nonConformities, inspections, organisations, licences, samples, sites } = useStore();
  const { site, isLoading } = useSiteDetail(siteId);
  const [tab, setTab] = useState<string>("corporate");
  const [infoFor, setInfoFor] = useState<string | null>(null);
  const [openDocumentId, setOpenDocumentId] = useState<string | null>(null);

  // Organisation-level papers are filed against one site only, so read the
  // files of every site this organisation operates.
  const orgId = site?.orgId ?? "";
  const orgSites = useMemo(
    () => (orgId ? sites.filter((s) => s.orgId === orgId) : []),
    [sites, orgId],
  );
  const siteIds = useMemo(() => {
    const ids = new Set(orgSites.map((s) => s.id));
    ids.add(siteId);
    return [...ids].sort();
  }, [orgSites, siteId]);
  const siteFiles = useSiteFiles(siteIds);
  const files = useMemo(() => {
    if (!site) return [];
    const siteNames = new Map(orgSites.map((s) => [s.id, s.name]));
    siteNames.set(site.id, site.name);
    return buildSiteFiles({
      site,
      siteNames,
      documents: siteFiles.documents,
      licences: siteFiles.licences,
    });
  }, [site, orgSites, siteFiles.documents, siteFiles.licences]);

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
  const awaitingReview = files.filter((f) => f.source === "document" && f.status === "pending");
  const unfiled = files.filter((f) => f.section === null);

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

      <Panel
        title={`Submitted documents (${files.length})`}
        description={
          awaitingReview.length
            ? `${awaitingReview.length} awaiting your review. Everything the operator filed for ${org?.name ?? "this organisation"}, across all of its sites.`
            : `Everything the operator filed for ${org?.name ?? "this organisation"}, across all of its sites.`
        }
        className="mt-5"
        bodyClassName="p-0"
      >
        {siteFiles.isLoading && files.length === 0 ? (
          <p className="px-5 py-6 text-sm text-muted-foreground">Loading submitted documents…</p>
        ) : files.length === 0 ? (
          <p className="px-5 py-6 text-sm text-muted-foreground">
            The operator has not uploaded any documents yet.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {files.map((f) => (
              <FileRow key={f.key} file={f} showSection onOpen={() => setOpenDocumentId(f.key)} />
            ))}
          </ul>
        )}
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
                  <p className="border-b border-border px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Documents for this section
                  </p>
                  {(() => {
                    const sectionFiles = files.filter((f) => f.section === s.key);
                    return sectionFiles.length ? (
                      <ul className="divide-y divide-border">
                        {sectionFiles.map((f) => (
                          <FileRow
                            key={f.key}
                            file={f}
                            showSection={false}
                            onOpen={() => setOpenDocumentId(f.key)}
                          />
                        ))}
                      </ul>
                    ) : (
                      <p className="px-4 py-3 text-sm text-muted-foreground">
                        No documents were filed under this section.
                        {unfiled.length
                          ? ` ${unfiled.length} other document${unfiled.length > 1 ? "s are" : " is"} listed under Submitted documents above.`
                          : ""}
                      </p>
                    );
                  })()}
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
          <SiteDocumentViewer
            documents={files}
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
