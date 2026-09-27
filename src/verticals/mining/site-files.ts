import {
  downloadDocumentUrl,
  downloadLicenceUrl,
  downloadSiteEvidenceUrl,
  type DocumentRecord,
  type LicenceDoc,
  type SectionKey,
} from "@/lib/api/mining";
import type { MineSite } from "./types";

/**
 * One file a miner submitted, whichever register it was filed in: the flat
 * document list (reviewable here), a review section's evidence (decided with
 * the section verdict), or a licence record.
 */
export type SiteFile = {
  /** Unique across sources, e.g. `document:<uuid>`. */
  key: string;
  source: "document" | "evidence" | "licence";
  /** The record id in its own register. */
  id: string;
  name: string;
  category: string;
  /** Raw API status (pending / verified / rejected / expired / active …). */
  status: string;
  /** Download endpoint path, or null when no file was attached. */
  downloadUrl: string | null;
  originalName: string;
  uploadedBy: string;
  createdAt: string | null;
  updatedAt: string | null;
  expiresOn: string | null;
  siteName: string;
  section: SectionKey | null;
  sectionTitle: string | null;
};

export const SOURCE_LABEL: Record<SiteFile["source"], string> = {
  document: "Application document",
  evidence: "Section evidence",
  licence: "Licence record",
};

// The Miner Hub application files its supporting documents under these
// labels (Beldium-Miner-Hub/src/lib/miner-data.ts). Matching on the label puts
// an organisation-level document under the review section it evidences, even
// when it was filed against a different site of the same organisation.
const SECTION_BY_DOCUMENT_NAME: Record<string, SectionKey> = {
  "certificate of incorporation": "corporate",
  "tax clearance certificate": "corporate",
  "mining licence / right": "licence",
  "environmental management plan": "environmental",
  "proof of rehabilitation bond": "environmental",
  "site survey plan": "site",
};

const normalise = (name: string) => name.trim().toLowerCase();

/**
 * Every file a miner submitted that bears on this site's review: the site's
 * own section evidence, plus the documents and licences filed against any
 * site of the same organisation. Evidence that duplicates a flat document of
 * the same name on the same site is dropped in favour of the document, which
 * is the copy a reviewer can accept or reject.
 */
export function buildSiteFiles({
  site,
  siteNames,
  documents,
  licences,
}: {
  site: MineSite;
  siteNames: Map<string, string>;
  documents: DocumentRecord[];
  licences: LicenceDoc[];
}): SiteFile[] {
  const titles = new Map(site.sections.map((s) => [s.key, s.title]));
  const titleOf = (key: SectionKey | null) => (key ? (titles.get(key) ?? key) : null);
  const siteName = (id: string) => siteNames.get(id) ?? "Another site";

  const documentFiles: SiteFile[] = documents.map((d) => {
    const section = SECTION_BY_DOCUMENT_NAME[normalise(d.name)] ?? null;
    return {
      key: `document:${d.id}`,
      source: "document",
      id: d.id,
      name: d.name,
      category: d.category,
      status: d.status,
      downloadUrl: d.file_url ? downloadDocumentUrl(d.id) : null,
      originalName: d.original_name,
      uploadedBy: d.uploaded_by_name,
      createdAt: d.created_at,
      updatedAt: d.updated_at,
      expiresOn: d.expires_on,
      siteName: siteName(d.site),
      section,
      sectionTitle: titleOf(section),
    };
  });

  const documentNamesHere = new Set(
    documents.filter((d) => d.site === site.id).map((d) => normalise(d.name)),
  );

  const evidenceFiles: SiteFile[] = site.sections.flatMap((s) =>
    s.evidence
      .filter((e) => !documentNamesHere.has(normalise(e.name)))
      .map((e): SiteFile => ({
        key: `evidence:${e.id}`,
        source: "evidence",
        id: e.id,
        name: e.name,
        category: e.kind,
        status: e.status.toLowerCase(),
        downloadUrl: e.fileUrl ? downloadSiteEvidenceUrl(site.id, e.id) : null,
        originalName: e.originalName,
        uploadedBy: e.uploadedBy,
        createdAt: e.createdAt,
        updatedAt: e.updatedAt,
        expiresOn: null,
        siteName: site.name,
        section: s.key,
        sectionTitle: s.title,
      })),
  );

  // The Miner Hub files one licence record per site but attaches the scan
  // once, so keep a single row per licence number: the one carrying the file,
  // else this site's own record.
  const byNumber = new Map<string, LicenceDoc>();
  const rank = (l: LicenceDoc) => (l.file_url ? 2 : 0) + (l.site === site.id ? 1 : 0);
  for (const l of licences) {
    const key = normalise(l.number) || l.id;
    const current = byNumber.get(key);
    if (!current || rank(l) > rank(current)) byNumber.set(key, l);
  }

  const licenceFiles: SiteFile[] = [...byNumber.values()].map((l) => ({
    key: `licence:${l.id}`,
    source: "licence",
    id: l.id,
    name: `${l.type} ${l.number}`.trim(),
    category: l.authority ? `Issued by ${l.authority}` : "Licence",
    status: l.status,
    downloadUrl: l.file_url ? downloadLicenceUrl(l.id) : null,
    originalName: "",
    uploadedBy: "",
    createdAt: l.created_at,
    updatedAt: l.updated_at,
    expiresOn: l.expires_on,
    siteName: l.site_name || siteName(l.site),
    section: "licence",
    sectionTitle: titleOf("licence"),
  }));

  // Awaiting a decision first, so the reviewer's Next walks the work queue.
  const order = (f: SiteFile) => (f.source === "document" && f.status === "pending" ? 0 : 1);
  return [...documentFiles, ...evidenceFiles, ...licenceFiles].sort((a, b) => order(a) - order(b));
}
