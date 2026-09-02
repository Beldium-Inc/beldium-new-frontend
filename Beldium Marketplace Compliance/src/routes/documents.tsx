import { createFileRoute } from "@tanstack/react-router";
import { AppShell, SectionCard } from "@/components/AppShell";
import { StatusBadge } from "@/components/StatusBadge";
import { fmtDate, useDemo } from "@/lib/store";

export const Route = createFileRoute("/documents")({
  head: () => ({
    meta: [
      { title: "Documents — Beldium Marketplace Compliance" },
      { name: "description", content: "KYC, traceability and trade documents with verification and expiry status." },
      { property: "og:title", content: "Documents — Beldium Marketplace Compliance" },
      { property: "og:description", content: "Central document register across onboarding and trade files." },
    ],
  }),
  component: Documents,
});

function Documents() {
  const { state } = useDemo();
  const isOperator = state.role === "operator";
  const scoped = isOperator
    ? state.applications
    : state.applications.filter((a) =>
        state.role === "offtaker" ? a.id === "APP-2041" : state.role === "buyer" ? a.id === "APP-2026" : a.id === "APP-2029",
      );
  const docs = scoped.flatMap((a) => a.documents.map((d) => ({ ...d, entity: a.entityName })));

  return (
    <AppShell title="Documents" subtitle={isOperator ? "All onboarding document packs" : "Your submitted documents"}>
      <SectionCard title="Document register" description={`${docs.length} document(s)`}>
        <div className="-mx-5 overflow-x-auto px-5">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs tracking-wide text-muted-foreground uppercase">
                <th className="py-2 pr-4 font-medium">Document</th>
                <th className="py-2 pr-4 font-medium">Entity</th>
                <th className="py-2 pr-4 font-medium">Category</th>
                <th className="py-2 pr-4 font-medium">Uploaded</th>
                <th className="py-2 pr-4 font-medium">Expires</th>
                <th className="py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {docs.map((d) => (
                <tr key={d.id} className="border-b border-border/70 last:border-0">
                  <td className="py-3 pr-4 font-medium">{d.name}</td>
                  <td className="py-3 pr-4">{d.entity}</td>
                  <td className="py-3 pr-4">{d.kind}</td>
                  <td className="py-3 pr-4 whitespace-nowrap">{fmtDate(d.uploadedAt)}</td>
                  <td className="py-3 pr-4 whitespace-nowrap">{d.expires ? fmtDate(d.expires) : "—"}</td>
                  <td className="py-3">
                    <StatusBadge status={d.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </AppShell>
  );
}
