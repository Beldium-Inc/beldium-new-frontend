import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "@/components/miner-shell";
import { StatusChip, complianceTone, prettify } from "@/components/status-chip";

import { useMiner } from "@/lib/miner-store";

const title = "Organisation & members — Beldium Miner Hub";
const description = "Organisation profile, team members, roles and pending join requests.";

export const Route = createFileRoute("/portal/organisation")({
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
  component: OrganisationPage,
});

function OrganisationPage() {
  const { state } = useMiner();
  const org = state.application.org;

  return (
    <>
      <PageHeader title="Organisation" description="Profile and people attached to this miner workspace." />

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-md border border-border bg-card">
          <h2 className="border-b border-border px-5 py-3 text-sm font-semibold text-card-foreground">Profile</h2>
          <dl className="divide-y divide-border">
            {[
              ["Legal name", org.legalName],
              ["Trading name", org.tradingName],
              ["Registration number", org.registrationNo],
              ["Entity type", org.entityType],
              ["Country", org.country],
              ["Address", org.address],
              ["Verification status", prettify(state.orgStatus)],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-6 px-5 py-2.5 text-sm">
                <dt className="text-muted-foreground">{k}</dt>
                <dd className="text-right text-card-foreground">{v || "—"}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="rounded-md border border-border bg-card">
          <h2 className="border-b border-border px-5 py-3 text-sm font-semibold text-card-foreground">Members</h2>
          <ul className="divide-y divide-border">
            {state.members.map((m) => (
              <li key={m.id} className="flex items-center justify-between gap-4 px-5 py-3 text-sm">
                <div>
                  <div className="font-medium text-card-foreground">{m.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {m.email} · {m.role}
                  </div>
                </div>
                <StatusChip tone={complianceTone(m.status)}>{prettify(m.status)}</StatusChip>
              </li>
            ))}
            {state.members.length === 0 ? (
              <li className="px-5 py-6 text-sm text-muted-foreground">No members yet.</li>
            ) : null}
          </ul>
        </section>

        <section className="rounded-md border border-border bg-card lg:col-span-2">
          <h2 className="border-b border-border px-5 py-3 text-sm font-semibold text-card-foreground">
            Join requests
          </h2>
          <ul className="divide-y divide-border">
            {state.joinRequest ? (
              <li className="flex items-center justify-between gap-4 px-5 py-3 text-sm">
                <div>
                  <div className="font-medium text-card-foreground">{state.account?.fullName ?? "Pending member"}</div>
                  <div className="text-xs text-muted-foreground">
                    {state.joinRequest.reference} · {state.joinRequest.organisationName} · submitted{" "}
                    {state.joinRequest.submittedAt}
                  </div>
                </div>
                <StatusChip tone={complianceTone(state.joinRequest.status)}>
                  {prettify(state.joinRequest.status)}
                </StatusChip>
              </li>
            ) : (
              <li className="px-5 py-6 text-sm text-muted-foreground">No pending join requests.</li>
            )}
          </ul>
        </section>
      </div>
    </>
  );
}
