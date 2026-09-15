import { createFileRoute } from "@tanstack/react-router";

import { PageHeader, StatCard } from "@/components/miner-shell";
import { StatusChip } from "@/components/status-chip";
import { useMiner } from "@/lib/miner-store";

const title = "Documents — Beldium Miner Hub";
const description = "Licences, permits, environmental plans and supporting documents held for your organisation.";

export const Route = createFileRoute("/portal/documents")({
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
  component: DocumentsPage,
});

function DocumentsPage() {
  const { state, updateApplication } = useMiner();
  const docs = state.application.documents;
  const uploaded = docs.filter((d) => d.fileName).length;
  const missingRequired = docs.filter((d) => d.required && !d.fileName).length;

  return (
    <>
      <PageHeader title="Documents" description="Replace an expired document by uploading a new version." />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Documents on file" value={`${uploaded}/${docs.length}`} />
        <StatCard label="Missing required" value={String(missingRequired)} />
        <StatCard label="Optional supplied" value={String(docs.filter((d) => !d.required && d.fileName).length)} />
      </div>

      <ul className="mt-6 divide-y divide-border rounded-md border border-border bg-card">
        {docs.map((d) => (
          <li key={d.id} className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-card-foreground">{d.label}</span>
                {d.required ? <StatusChip tone="info">Required</StatusChip> : null}
              </div>
              <div className="mt-0.5 text-xs text-muted-foreground">
                {d.fileName ? `${d.fileName}${d.uploadedAt ? ` · uploaded ${d.uploadedAt}` : ""}` : "No file on record"}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <StatusChip tone={d.fileName ? "success" : d.required ? "warning" : "neutral"}>
                {d.fileName ? "On file" : d.required ? "Missing" : "Optional"}
              </StatusChip>
              <label className="inline-flex">
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    const name = e.target.files?.[0]?.name;
                    if (!name) return;
                    updateApplication((draft) => ({
                      ...draft,
                      documents: draft.documents.map((doc) =>
                        doc.id === d.id
                          ? { ...doc, fileName: name, uploadedAt: new Date().toISOString().slice(0, 10) }
                          : doc,
                      ),
                    }));
                  }}
                />
                <span className="inline-flex cursor-pointer items-center rounded-full border border-input bg-background px-3 py-1.5 text-sm hover:bg-muted">
                  {d.fileName ? "Replace" : "Upload"}
                </span>
              </label>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
