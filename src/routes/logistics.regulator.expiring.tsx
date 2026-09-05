import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/verticals/logistics/AppShell";
import { PageHeader, Panel, Pill, ReadOnlyNotice } from "@/verticals/logistics/bits";
import { useApp } from "@/verticals/logistics/store";

export const Route = createFileRoute("/logistics/regulator/expiring")({
  head: () => ({
    meta: [
      { title: "Expiring credentials | Beldium Regulatory Portal" },
      { name: "description", content: "Licences, permits and insurance approaching expiry across registered logistics operators." },
      { property: "og:title", content: "Expiring credentials | Beldium Regulatory Portal" },
      { property: "og:description", content: "Monitor credentials nearing expiry across the sector." },
    ],
  }),
  component: RegulatorExpiring,
});

function RegulatorExpiring() {
  const { companies } = useApp();
  const rows = companies
    .flatMap((c) => c.documents.map((d) => ({ ...d, company: c.name, companyId: c.id })))
    .filter((d) => d.expires < "2026-12-01")
    .sort((a, b) => a.expires.localeCompare(b.expires));

  return (
    <AppShell role="regulator" breadcrumbs={[{ label: "Regulatory Oversight", to: "/logistics/regulator" }, { label: "Expiring credentials" }]}>
      <PageHeader title="Expiring credentials" description="Credentials expiring within the current monitoring window." />
      <ReadOnlyNotice text="Read-only monitoring view. Renewal enforcement is handled by Beldium compliance operations." />
      <Panel className="mt-4" bodyClassName="p-0" title="Expiry watchlist" description={`${rows.length} credentials`}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/60 text-left text-[11px] tracking-wide text-muted-foreground uppercase">
                <th className="px-5 py-3 font-semibold">Credential</th>
                <th className="px-3 py-3 font-semibold">Operator</th>
                <th className="px-3 py-3 font-semibold">Issuer</th>
                <th className="px-3 py-3 font-semibold">Reference</th>
                <th className="px-5 py-3 font-semibold">Expires</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((d) => (
                <tr key={`${d.companyId}-${d.id}`} className="hover:bg-muted/40">
                  <td className="px-5 py-3 text-sm font-medium text-[var(--brand)]">{d.name}</td>
                  <td className="px-3 py-3 text-xs">{d.company}</td>
                  <td className="px-3 py-3 text-xs text-muted-foreground">{d.issuer}</td>
                  <td className="px-3 py-3 text-xs">{d.reference}</td>
                  <td className="px-5 py-3">
                    <Pill tone={d.expires < "2026-09-15" ? "danger" : d.expires < "2026-10-15" ? "warning" : "neutral"}>{d.expires}</Pill>
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
