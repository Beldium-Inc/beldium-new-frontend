import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "@/components/miner-shell";
import { StatusChip } from "@/components/status-chip";
import { useMyOrganisations } from "@/lib/api/queries";
import { useEquipment, useMineSites, useMiningApplications, useMiningDocuments } from "@/lib/api/mining-queries";

const title = "Submitted application — Beldium Miner Hub";
const description = "Read-only record of the mining organisation application submitted for verification.";

export const Route = createFileRoute("/portal/application-record")({
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
  component: RecordPage,
});

function Block({ heading, rows }: { heading: string; rows: [string, string][] }) {
  return (
    <section className="rounded-md border border-border bg-card">
      <h2 className="border-b border-border px-5 py-3 text-sm font-semibold text-card-foreground">{heading}</h2>
      <dl className="divide-y divide-border">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-6 px-5 py-2.5 text-sm">
            <dt className="text-muted-foreground">{k}</dt>
            <dd className="text-right font-medium text-card-foreground">{v || "—"}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function RecordPage() {
  const organisations = useMyOrganisations();
  const applications = useMiningApplications();
  const sitesQuery = useMineSites();
  const equipmentQuery = useEquipment();
  const documentsQuery = useMiningDocuments();

  const org = organisations.data?.results[0] ?? null;
  const apps = Array.isArray(applications.data) ? applications.data : (applications.data?.results ?? []);
  const sites = Array.isArray(sitesQuery.data) ? sitesQuery.data : (sitesQuery.data?.results ?? []);
  const equipment = Array.isArray(equipmentQuery.data) ? equipmentQuery.data : (equipmentQuery.data?.results ?? []);
  const documents = Array.isArray(documentsQuery.data) ? documentsQuery.data : (documentsQuery.data?.results ?? []);

  if (!org) return <p className="text-sm text-muted-foreground">No application on record.</p>;

  return (
    <>
      <PageHeader
        title="Submitted application"
        description="Locked while under review. Changes are made through information requests."
        actions={<StatusChip tone="info">Read-only</StatusChip>}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Block
          heading="Organisation details"
          rows={[
            ["Legal name", org.name],
            ["Registration number", org.registration_number],
            ["Tax ID", org.tax_identifier],
            ["Country", org.country],
            ["Address", org.address],
            ["Verification status", org.verification_status.replace("_", " ")],
          ]}
        />

        <section className="rounded-md border border-border bg-card">
          <h2 className="border-b border-border px-5 py-3 text-sm font-semibold text-card-foreground">
            Applications ({apps.length})
          </h2>
          <ul className="divide-y divide-border">
            {apps.map((a) => (
              <li key={a.id} className="px-5 py-3 text-sm">
                <div className="font-medium text-card-foreground">{a.reference}</div>
                <div className="text-muted-foreground">
                  {a.type} · {a.mineral ?? "—"} · {a.status.replace("_", " ")}
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-md border border-border bg-card lg:col-span-2">
          <h2 className="border-b border-border px-5 py-3 text-sm font-semibold text-card-foreground">
            Declared mining sites ({sites.length})
          </h2>
          <ul className="divide-y divide-border">
            {sites.map((s) => (
              <li key={s.id} className="px-5 py-3 text-sm">
                <div className="font-medium text-card-foreground">{s.name}</div>
                <div className="text-muted-foreground">
                  {s.code} · {s.state ?? "—"} · {s.mineral} · {s.area_ha ?? "—"} ha · {s.workforce ?? "—"} workers ·{" "}
                  {(s.status ?? "").replace("_", " ")}
                </div>
              </li>
            ))}
            {sites.length === 0 ? <li className="px-5 py-6 text-sm text-muted-foreground">No sites declared.</li> : null}
          </ul>
        </section>

        <section className="rounded-md border border-border bg-card">
          <h2 className="border-b border-border px-5 py-3 text-sm font-semibold text-card-foreground">
            Equipment ({equipment.length})
          </h2>
          <ul className="divide-y divide-border">
            {equipment.map((e) => (
              <li key={e.id} className="px-5 py-3 text-sm">
                <div className="font-medium text-card-foreground">{e.name}</div>
                <div className="text-muted-foreground">
                  {e.serial} · {e.site_name} · {e.status.replace("_", " ")}
                </div>
              </li>
            ))}
            {equipment.length === 0 ? <li className="px-5 py-6 text-sm text-muted-foreground">None declared.</li> : null}
          </ul>
        </section>

        <section className="rounded-md border border-border bg-card">
          <h2 className="border-b border-border px-5 py-3 text-sm font-semibold text-card-foreground">Documents</h2>
          <ul className="divide-y divide-border">
            {documents.map((d) => (
              <li key={d.id} className="flex items-center justify-between gap-4 px-5 py-3 text-sm">
                <div>
                  <div className="text-card-foreground">{d.name}</div>
                  <div className="text-xs text-muted-foreground">{d.original_name || "Not provided"}</div>
                </div>
                <StatusChip tone={d.status === "verified" ? "success" : "warning"}>{d.status}</StatusChip>
              </li>
            ))}
            {documents.length === 0 ? <li className="px-5 py-6 text-sm text-muted-foreground">No documents uploaded.</li> : null}
          </ul>
        </section>
      </div>
    </>
  );
}
