import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Download, FileText, Upload } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/verticals/logistics/AppShell";
import { DocStatusBadge, PageHeader, Panel } from "@/verticals/logistics/bits";
import { useApp } from "@/verticals/logistics/store";
import { PRIMARY_COMPANY_ID } from "@/verticals/logistics/mock-data";

export const Route = createFileRoute("/logistics/partner/documents")({
  head: () => ({
    meta: [
      { title: "Documents | Beldium Logistics Partner Portal" },
      { name: "description", content: "All compliance documents submitted to Beldium, with verification status and expiry dates." },
      { property: "og:title", content: "Documents | Beldium Logistics Partner Portal" },
      { property: "og:description", content: "Submitted compliance documents and their review status." },
    ],
  }),
  component: PartnerDocuments,
});

function PartnerDocuments() {
  const { companies } = useApp();
  const c = companies.find((x) => x.id === PRIMARY_COMPANY_ID)!;
  const [query, setQuery] = React.useState("");
  const docs = c.documents.filter((d) => [d.name, d.category, d.issuer, d.reference].join(" ").toLowerCase().includes(query.toLowerCase()));

  return (
    <AppShell
      role="partner"
      breadcrumbs={[{ label: "Sahel Haulage & Minerals Ltd", to: "/logistics/partner" }, { label: "Documents" }]}
      search={{ value: query, onChange: setQuery, placeholder: "Search documents…" }}
    >
      <PageHeader
        title="Documents"
        description="Verified documents are locked. Rejected or replacement-requested documents must be re-uploaded."
        actions={
          <button
            type="button"
            onClick={() => toast.success("Upload dialog simulated, attach files from the request centre")}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--brand)] px-3 py-2 text-xs font-medium text-white hover:bg-[var(--brand)]/90"
          >
            <Upload className="h-3.5 w-3.5" /> Upload document
          </button>
        }
      />
      <Panel bodyClassName="p-0" title="Document library" description={`${docs.length} documents`}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/60 text-left text-[11px] tracking-wide text-muted-foreground uppercase">
                <th className="px-5 py-3 font-semibold">Document</th>
                <th className="px-3 py-3 font-semibold">Category</th>
                <th className="px-3 py-3 font-semibold">Issuer</th>
                <th className="px-3 py-3 font-semibold">Reference</th>
                <th className="px-3 py-3 font-semibold">Expires</th>
                <th className="px-3 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {docs.map((d) => (
                <tr key={d.id} className="hover:bg-muted/40">
                  <td className="px-5 py-3">
                    <p className="flex items-center gap-2 text-sm font-medium text-[var(--brand)]">
                      <FileText className="h-3.5 w-3.5 text-[var(--link)]" /> {d.name}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {d.size} · uploaded {d.uploadedAt} by {d.uploadedBy}
                    </p>
                  </td>
                  <td className="px-3 py-3 text-xs">{d.category}</td>
                  <td className="px-3 py-3 text-xs text-muted-foreground">{d.issuer}</td>
                  <td className="px-3 py-3 text-xs">{d.reference}</td>
                  <td className="px-3 py-3 text-xs">{d.expires}</td>
                  <td className="px-3 py-3">
                    <DocStatusBadge status={d.status} />
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="inline-flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => toast.success(`${d.name} downloaded`)}
                        className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[11px] font-medium text-[var(--brand)] hover:border-[var(--link)]/60"
                      >
                        <Download className="h-3 w-3" /> Download
                      </button>
                      {d.status === "rejected" || d.status === "replacement" ? (
                        <button
                          type="button"
                          onClick={() => toast.success(`Replacement uploaded for ${d.name}`)}
                          className="inline-flex items-center gap-1 rounded-md bg-[var(--brand)] px-2 py-1 text-[11px] font-medium text-white hover:bg-[var(--brand)]/90"
                        >
                          <Upload className="h-3 w-3" /> Re-upload
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </AppShell>
  );
}
