import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "@/components/miner-shell";
import { StatusChip } from "@/components/status-chip";
import { useMiner } from "@/lib/miner-store";

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
  const { state } = useMiner();
  const a = state.application;

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
            ["Legal name", a.org.legalName],
            ["Trading name", a.org.tradingName],
            ["Registration number", a.org.registrationNo],
            ["Tax ID", a.org.taxId],
            ["Entity type", a.org.entityType],
            ["Incorporated", a.org.incorporatedOn],
            ["Country", a.org.country],
            ["Address", a.org.address],
          ]}
        />
        <Block
          heading="Ownership & contacts"
          rows={[
            ["Primary contact", a.contacts.primaryName],
            ["Position", a.contacts.primaryRole],
            ["Email", a.contacts.primaryEmail],
            ["Phone", a.contacts.primaryPhone],
            ["Beneficial owners", a.contacts.beneficialOwners],
            ["Structure", a.contacts.ownershipStructure],
          ]}
        />
        <Block
          heading="Licences & permits"
          rows={[
            ["Licence number", a.licences.licenceNumber],
            ["Licence type", a.licences.licenceType],
            ["Issuing authority", a.licences.issuingAuthority],
            ["Minerals", a.licences.minerals],
            ["Issued", a.licences.issuedOn],
            ["Expires", a.licences.expiresOn],
          ]}
        />
        <Block
          heading="Environment & safety"
          rows={[
            ["EMP reference", a.environment.empNumber],
            ["Rehabilitation bond", a.environment.rehabBond],
            ["Water use permit", a.environment.waterUsePermit],
            ["Incidents (12m)", a.environment.incidentsLast12m],
            ["Safety officer", a.environment.safetyOfficer],
            ["Notes", a.environment.notes],
          ]}
        />

        <section className="rounded-md border border-border bg-card lg:col-span-2">
          <h2 className="border-b border-border px-5 py-3 text-sm font-semibold text-card-foreground">
            Declared mining sites ({a.sites.length})
          </h2>
          <ul className="divide-y divide-border">
            {a.sites.map((s) => (
              <li key={s.id} className="px-5 py-3 text-sm">
                <div className="font-medium text-card-foreground">{s.name}</div>
                <div className="text-muted-foreground">
                  {s.licenceNo} · {s.region} · {s.mineral} · {s.method} · {s.hectares} ha · {s.workforce} workers ·{" "}
                  {s.status}
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-md border border-border bg-card">
          <h2 className="border-b border-border px-5 py-3 text-sm font-semibold text-card-foreground">
            Equipment ({a.equipment.length})
          </h2>
          <ul className="divide-y divide-border">
            {a.equipment.map((e) => (
              <li key={e.id} className="px-5 py-3 text-sm">
                <div className="font-medium text-card-foreground">{e.name}</div>
                <div className="text-muted-foreground">
                  {e.type} · {e.serial} · {a.sites.find((s) => s.id === e.siteId)?.name ?? "Unassigned"} · {e.condition}
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-md border border-border bg-card">
          <h2 className="border-b border-border px-5 py-3 text-sm font-semibold text-card-foreground">Documents</h2>
          <ul className="divide-y divide-border">
            {a.documents.map((d) => (
              <li key={d.id} className="flex items-center justify-between gap-4 px-5 py-3 text-sm">
                <div>
                  <div className="text-card-foreground">{d.label}</div>
                  <div className="text-xs text-muted-foreground">{d.fileName ?? "Not provided"}</div>
                </div>
                <StatusChip tone={d.fileName ? "success" : "warning"}>{d.fileName ? "Uploaded" : "Missing"}</StatusChip>
              </li>
            ))}
          </ul>
        </section>

        <Block
          heading="Declaration"
          rows={[
            ["Signatory", a.declaration.signatory],
            ["Position", a.declaration.position],
            ["Signed on", a.declaration.signedOn],
            ["Accuracy confirmed", a.declaration.accurate ? "Yes" : "No"],
            ["Authority confirmed", a.declaration.authorised ? "Yes" : "No"],
            ["Verification consent", a.declaration.consent ? "Yes" : "No"],
          ]}
        />
      </div>
    </>
  );
}
