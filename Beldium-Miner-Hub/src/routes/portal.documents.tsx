import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { PageHeader, StatCard } from "@/components/miner-shell";
import { StatusChip } from "@/components/status-chip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMineSites, useMiningDocuments, useUploadMiningDocument } from "@/lib/api/mining-queries";

const title = "Documents - Beldium Miner Hub";
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
  const documentsQuery = useMiningDocuments();
  const sitesQuery = useMineSites();
  const upload = useUploadMiningDocument();

  const docs = Array.isArray(documentsQuery.data) ? documentsQuery.data : (documentsQuery.data?.results ?? []);
  const sites = Array.isArray(sitesQuery.data) ? sitesQuery.data : (sitesQuery.data?.results ?? []);

  const [site, setSite] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const verified = docs.filter((d) => d.status === "verified").length;

  function submit() {
    if (!site || !name || !category || !file) return;
    upload.mutate(
      { site, name, category, file },
      { onSuccess: () => { setName(""); setCategory(""); setFile(null); } },
    );
  }

  return (
    <>
      <PageHeader title="Documents" description="Upload licences, permits and supporting documents for your sites." />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="On file" value={String(docs.length)} />
        <StatCard label="Verified" value={String(verified)} />
        <StatCard label="Pending review" value={String(docs.filter((d) => d.status === "pending").length)} />
      </div>

      <div className="mt-6 rounded-md border border-border bg-card p-5">
        <h2 className="text-sm font-semibold text-card-foreground">Upload a document</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Site</Label>
            <Select value={site} onValueChange={setSite}>
              <SelectTrigger>
                <SelectValue placeholder="Select a site" />
              </SelectTrigger>
              <SelectContent>
                {sites.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Document name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Environmental permit" />
          </div>
          <div className="space-y-2">
            <Label>Category</Label>
            <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="permit" />
          </div>
          <div className="space-y-2">
            <Label>File</Label>
            <input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="text-sm" />
          </div>
        </div>
        <Button className="mt-4" disabled={!site || !name || !category || !file || upload.isPending} onClick={submit}>
          Upload
        </Button>
      </div>

      <ul className="mt-6 divide-y divide-border rounded-md border border-border bg-card">
        {docs.map((d) => (
          <li key={d.id} className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
            <div>
              <span className="font-medium text-card-foreground">{d.name}</span>
              <div className="mt-0.5 text-xs text-muted-foreground">
                {d.category} · {d.original_name || "No file"} {d.expires_on ? `· expires ${d.expires_on}` : ""}
              </div>
            </div>
            <StatusChip tone={d.status === "verified" ? "success" : d.status === "rejected" ? "danger" : "warning"}>
              {d.status}
            </StatusChip>
          </li>
        ))}
        {docs.length === 0 ? (
          <li className="px-5 py-8 text-center text-sm text-muted-foreground">No documents uploaded yet.</li>
        ) : null}
      </ul>
    </>
  );
}
