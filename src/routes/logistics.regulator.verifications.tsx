import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/verticals/logistics/AppShell";
import { PageHeader, Panel, Pill, ReadOnlyNotice } from "@/verticals/logistics/bits";
import { useApp } from "@/verticals/logistics/store";
import { parseVerification } from "@/verticals/logistics/verification";

export const Route = createFileRoute("/logistics/regulator/verifications")({
  head: () => ({
    meta: [
      { title: "Verification records | Beldium Regulatory Portal" },
      {
        name: "description",
        content:
          "How Beldium compliance officers verified logistics operators' evidence: source, method, findings, decision and next review.",
      },
      { property: "og:title", content: "Verification records | Beldium Regulatory Portal" },
      {
        property: "og:description",
        content: "Officer verification records for logistics operator evidence.",
      },
    ],
  }),
  component: RegulatorVerifications,
});

function RegulatorVerifications() {
  const { companies } = useApp();
  const rows = companies.flatMap((c) =>
    c.documents
      .filter((d) => d.status === "verified")
      .map((d) => ({ doc: d, company: c, record: parseVerification(d.reviewNotes) })),
  );
  const structured = rows.filter((r) => r.record).length;

  return (
    <AppShell
      role="regulator"
      breadcrumbs={[
        { label: "Regulatory Oversight", to: "/logistics/regulator" },
        { label: "Verification records" },
      ]}
    >
      <PageHeader
        title="Verification records"
        description="Every verified document, with where and how the officer checked it and what they found."
      />
      <ReadOnlyNotice text="Read-only. Verification decisions are made by Beldium compliance officers, not from this portal." />
      <Panel
        className="mt-4"
        bodyClassName="p-0"
        title="Verified evidence"
        description={`${rows.length} verified documents · ${structured} with a structured record`}
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/60 text-left text-[11px] tracking-wide text-muted-foreground uppercase">
                <th className="px-5 py-3 font-semibold">Requirement</th>
                <th className="px-3 py-3 font-semibold">Operator</th>
                <th className="px-3 py-3 font-semibold">Source</th>
                <th className="px-3 py-3 font-semibold">Method</th>
                <th className="px-3 py-3 font-semibold">Findings</th>
                <th className="px-3 py-3 font-semibold">Decision / scope</th>
                <th className="px-5 py-3 font-semibold">Next review</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map(({ doc, company, record }) => (
                <tr key={`${company.id}-${doc.id}`} className="align-top hover:bg-muted/40">
                  <td className="px-5 py-3">
                    <p className="text-sm font-medium text-[var(--brand)]">{doc.name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {doc.category}
                      {doc.reviewedAt ? ` · ${doc.reviewedAt}` : ""}
                    </p>
                  </td>
                  <td className="px-3 py-3 text-xs">{company.name}</td>
                  {record ? (
                    <>
                      <td className="px-3 py-3 text-xs">{record.source}</td>
                      <td className="px-3 py-3 text-xs">{record.method}</td>
                      <td className="max-w-xs px-3 py-3 text-xs">{record.findings}</td>
                      <td className="px-3 py-3 text-xs">
                        <Pill tone="success">{record.decision || "Verified"}</Pill>
                        <p className="mt-1 text-muted-foreground">{record.scope}</p>
                      </td>
                      <td className="px-5 py-3 text-xs">{record.nextReview || "Not set"}</td>
                    </>
                  ) : (
                    <td colSpan={5} className="px-3 py-3 text-xs text-muted-foreground">
                      Verified before structured records: {doc.reviewNotes || "no note recorded"}
                    </td>
                  )}
                </tr>
              ))}
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-sm text-muted-foreground">
                    No verified documents yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Panel>
    </AppShell>
  );
}
