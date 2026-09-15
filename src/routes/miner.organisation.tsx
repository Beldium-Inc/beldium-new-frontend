import { createFileRoute } from "@tanstack/react-router";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMineSites, useOrganisationProfiles } from "@/lib/api/mining-queries";

export const Route = createFileRoute("/miner/organisation")({ component: OrganisationPage });

function personLabel(entry: Record<string, unknown>): string {
  const name =
    typeof entry["name"] === "string"
      ? entry["name"]
      : typeof entry["full_name"] === "string"
        ? entry["full_name"]
        : "Unnamed";
  const role =
    typeof entry["role"] === "string" ? entry["role"] : typeof entry["title"] === "string" ? entry["title"] : null;
  const share =
    typeof entry["share_percent"] === "number"
      ? `${entry["share_percent"]}% share`
      : typeof entry["ownership_percent"] === "number"
        ? `${entry["ownership_percent"]}% ownership`
        : null;
  const parts = [role, share].filter(Boolean);
  return parts.length > 0 ? `${name} (${parts.join(", ")})` : name;
}

function OrganisationPage() {
  const sitesQuery = useMineSites();
  const profilesQuery = useOrganisationProfiles();

  const site = sitesQuery.data?.results?.[0];
  const profile = profilesQuery.data?.results?.[0];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">My Organisation</h1>
        <p className="text-sm text-muted-foreground">Organisation profile linked to your mining operations.</p>
      </div>

      {sitesQuery.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading.</p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="divide-y divide-border text-sm">
                {[
                  ["Site name", site?.name ?? "–"],
                  ["Site code", site?.code ?? "–"],
                  ["Mineral", site?.mineral ?? "–"],
                  ["State / LGA", site ? `${site.lga}, ${site.state}` : "–"],
                  ["Status", site?.status ?? "–"],
                  ["Compliance score", site ? `${site.compliance_score}%` : "–"],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-6 py-2">
                    <dt className="text-muted-foreground">{k}</dt>
                    <dd className="text-right font-medium">{v}</dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Directors and beneficial owners</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {!profile || (profile.directors.length === 0 && profile.beneficial_owners.length === 0) ? (
                <p className="text-muted-foreground">No director or beneficial-owner records on file.</p>
              ) : (
                <>
                  <div>
                    <p className="mb-1 font-medium">Directors</p>
                    {profile.directors.length === 0 ? (
                      <p className="text-muted-foreground">None on file.</p>
                    ) : (
                      <ul className="list-disc space-y-1 pl-4 text-muted-foreground">
                        {profile.directors.map((d, i) => (
                          <li key={i}>{personLabel(d)}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div>
                    <p className="mb-1 font-medium">Beneficial owners</p>
                    {profile.beneficial_owners.length === 0 ? (
                      <p className="text-muted-foreground">None on file.</p>
                    ) : (
                      <ul className="list-disc space-y-1 pl-4 text-muted-foreground">
                        {profile.beneficial_owners.map((d, i) => (
                          <li key={i}>{personLabel(d)}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
