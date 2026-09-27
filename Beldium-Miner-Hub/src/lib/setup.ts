import { useQuery } from "@tanstack/react-query";

import { listApplications } from "./api/mining";
import { listMyJoinRequests, listOrganisations } from "./api/organisations";
import { useHasTokens } from "./api/queries";
import type { Organisation, Paginated } from "./api/types";

/**
 * Where a miner's account setup stands, as the API sees it.
 *
 * - `complete`: the organisation exists and its admission application went in.
 * - `no_organisation`: signed up and verified, but the application wizard was
 *   never submitted (the organisation is only created on submit).
 * - `unsubmitted`: the organisation was created but submission stopped before
 *   the admission application was filed, e.g. a dropped connection.
 * - `join_pending`: asked to join an existing organisation, not yet approved.
 */
export type SetupStage = "complete" | "no_organisation" | "unsubmitted" | "join_pending";

export type MinerSetup = { stage: SetupStage; organisation: Organisation | null };

const rows = <T>(page: Paginated<T> | T[]): T[] => (Array.isArray(page) ? page : page.results);

/** The mining organisation this account belongs to, if any. */
export function pickMiningOrganisation(organisations: Organisation[]): Organisation | null {
  return (
    organisations.find((o) => o.organisation_type === "mining_company") ?? organisations[0] ?? null
  );
}

export async function fetchMinerSetup(): Promise<MinerSetup> {
  const organisations = await listOrganisations();
  const organisation = pickMiningOrganisation(organisations.results);

  if (!organisation) {
    const requests = await listMyJoinRequests();
    const pending = requests.results.some((r) => r.status === "pending");
    return { stage: pending ? "join_pending" : "no_organisation", organisation };
  }

  // A verified organisation is past onboarding whatever its application list says.
  if (organisation.verification_status === "verified") return { stage: "complete", organisation };

  const applications = rows(await listApplications());
  const filed = applications.some((a) => a.organisation === organisation.id);
  return { stage: filed ? "complete" : "unsubmitted", organisation };
}

export function useMinerSetup() {
  const hasTokens = useHasTokens();
  return useQuery({
    queryKey: ["miner-setup"],
    queryFn: fetchMinerSetup,
    enabled: hasTokens,
    staleTime: 60_000,
  });
}
