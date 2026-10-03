import { useMemo, useState } from "react";
import { useSiteDetail, useStore } from "@/verticals/mining/store";
import { Field, Panel } from "@/verticals/mining/components/primitives";
import { StatusChip } from "@/verticals/mining/components/chips";
import { FileRow } from "@/verticals/mining/components/SiteReview";
import { SiteDocumentViewer } from "@/verticals/mining/components/SiteDocumentViewer";
import { buildSiteFiles, isOrganisationFile } from "@/verticals/mining/site-files";
import { useSiteFiles } from "@/lib/api/mining-queries";
import type { OrganisationVerificationRow } from "@/lib/api/mining";

const orgStatusLabel = {
  draft: "Under Review",
  under_review: "Under Review",
  verified: "Verified",
  rejected: "Rejected",
  suspended: "Suspended",
} as const;

/**
 * Stage one of a claimed application: the mining organisation and the papers
 * that belong to it (incorporation, tax clearance). Every one has to be
 * verified before the organisation can be, and the site stays locked until it is.
 */
export function OrganisationReview({
  siteId,
  siteIds,
  org,
}: {
  siteId: string | null;
  siteIds: string[];
  org: OrganisationVerificationRow | null;
}) {
  const { organisations, sites } = useStore();
  const { site } = useSiteDetail(siteId);
  const [openId, setOpenId] = useState<string | null>(null);
  const siteFiles = useSiteFiles(siteIds);
  const profile = organisations.find((o) => o.id === org?.id);

  const files = useMemo(() => {
    if (!site) return [];
    const names = new Map(sites.map((s) => [s.id, s.name]));
    names.set(site.id, site.name);
    return buildSiteFiles({
      site,
      siteNames: names,
      documents: siteFiles.documents,
      licences: [],
    }).filter(isOrganisationFile);
  }, [site, sites, siteFiles.documents]);

  const awaiting = files.filter((f) => f.status === "pending").length;

  return (
    <div className="space-y-5">
      <Panel title="Mining organisation">
        {org ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Name" value={org.name} />
            <Field label="Beldium ID" value={org.beldium_id ?? "-"} />
            <Field label="Verification">
              <StatusChip value={orgStatusLabel[org.verification_status]} />
            </Field>
            <Field
              label="Organisation documents verified"
              value={`${org.documents_verified}/${org.documents_total}`}
            />
            {profile?.rcNumber ? <Field label="RC number" value={profile.rcNumber} /> : null}
            {profile?.hq ? <Field label="Head office" value={profile.hq} /> : null}
            {profile?.contact ? <Field label="Contact" value={profile.contact} /> : null}
            {profile?.email ? <Field label="Email" value={profile.email} /> : null}
            {org.rejection_reason ? (
              <Field label="Rejection reason" value={org.rejection_reason} />
            ) : null}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Organisation details unavailable.</p>
        )}
      </Panel>

      <Panel
        title={`Organisation documents (${files.length})`}
        description={
          awaiting
            ? `${awaiting} awaiting your review. Verify each one against the organisation's records.`
            : "Incorporation and tax papers the organisation filed."
        }
        bodyClassName="p-0"
      >
        {siteFiles.isLoading && files.length === 0 ? (
          <p className="px-5 py-6 text-sm text-muted-foreground">Loading documents…</p>
        ) : files.length === 0 ? (
          <p className="px-5 py-6 text-sm text-muted-foreground">
            The organisation has not filed any organisation documents yet.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {files.map((f) => (
              <FileRow key={f.key} file={f} showSection={false} onOpen={() => setOpenId(f.key)} />
            ))}
          </ul>
        )}
      </Panel>

      {site ? (
        <SiteDocumentViewer
          documents={files}
          documentId={openId}
          context={{
            siteName: site.name,
            siteCode: site.code,
            organisationName: org?.name ?? null,
            licence: null,
            location: `${site.lga}, ${site.state} State`,
          }}
          onNavigate={setOpenId}
          onClose={() => setOpenId(null)}
        />
      ) : null}
    </div>
  );
}
