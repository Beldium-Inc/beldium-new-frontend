import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "@/components/miner-shell";
import { StatusChip } from "@/components/status-chip";
import { fullName, MEMBERSHIP_ROLE_LABELS } from "@/lib/api/types";
import {
  useMyJoinRequests,
  useMyOrganisations,
  useOrganisationMembers,
} from "@/lib/api/queries";

const title = "Organisation & members - Beldium Miner Hub";
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
  const organisations = useMyOrganisations();
  const org = organisations.data?.results[0] ?? null;
  const members = useOrganisationMembers(org?.id ?? null);
  const joinRequests = useMyJoinRequests();

  if (!org) {
    return <p className="text-sm text-muted-foreground">No organisation on record yet.</p>;
  }

  return (
    <>
      <PageHeader title="Organisation" description="Profile and people attached to this miner workspace." />

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-md border border-border bg-card">
          <h2 className="border-b border-border px-5 py-3 text-sm font-semibold text-card-foreground">Profile</h2>
          <dl className="divide-y divide-border">
            {[
              ["Legal name", org.name],
              ["Beldium ID", org.beldium_id],
              ["Registration number", org.registration_number],
              ["Tax identifier", org.tax_identifier],
              ["Country", org.country],
              ["Address", org.address],
              ["Verification status", org.verification_status.replace("_", " ")],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-6 px-5 py-2.5 text-sm">
                <dt className="text-muted-foreground">{k}</dt>
                <dd className="text-right text-card-foreground">{v || "-"}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="rounded-md border border-border bg-card">
          <h2 className="border-b border-border px-5 py-3 text-sm font-semibold text-card-foreground">Members</h2>
          <ul className="divide-y divide-border">
            {(members.data ?? []).map((m) => (
              <li key={m.id} className="flex items-center justify-between gap-4 px-5 py-3 text-sm">
                <div>
                  <div className="font-medium text-card-foreground">{fullName(m.user)}</div>
                  <div className="text-xs text-muted-foreground">
                    {m.user.email} · {MEMBERSHIP_ROLE_LABELS[m.role]}
                  </div>
                </div>
                <StatusChip tone={m.is_active ? "success" : "neutral"}>{m.is_active ? "Active" : "Inactive"}</StatusChip>
              </li>
            ))}
            {(members.data ?? []).length === 0 ? (
              <li className="px-5 py-6 text-sm text-muted-foreground">No members yet.</li>
            ) : null}
          </ul>
        </section>

        <section className="rounded-md border border-border bg-card lg:col-span-2">
          <h2 className="border-b border-border px-5 py-3 text-sm font-semibold text-card-foreground">
            Join requests
          </h2>
          <ul className="divide-y divide-border">
            {(joinRequests.data?.results ?? []).map((jr) => (
              <li key={jr.id} className="flex items-center justify-between gap-4 px-5 py-3 text-sm">
                <div>
                  <div className="font-medium text-card-foreground">{fullName(jr.requester)}</div>
                  <div className="text-xs text-muted-foreground">
                    {jr.organisation_name} · {MEMBERSHIP_ROLE_LABELS[jr.requested_role]}
                  </div>
                </div>
                <StatusChip tone={jr.status === "approved" ? "success" : jr.status === "rejected" ? "danger" : "warning"}>
                  {jr.status}
                </StatusChip>
              </li>
            ))}
            {(joinRequests.data?.results ?? []).length === 0 ? (
              <li className="px-5 py-6 text-sm text-muted-foreground">No pending join requests.</li>
            ) : null}
          </ul>
        </section>
      </div>
    </>
  );
}
