import { useQuery, type QueryClient } from "@tanstack/react-query";

import { listComplianceApplications } from "../api/compliance";
import { listMyJoinRequests, listOrganisations } from "../api/organisations";
import { queryKeys, useHasTokens } from "../api/queries";
import type { ComplianceApplication, Organisation, User } from "../api/types";
import { roleIn, type VerticalSlug } from "../verticals";

/**
 * Where a compliance account's registration stands, as the API sees it.
 *
 * - `complete`: the application has been submitted (under review or decided).
 * - `no_organisation`: signed up and verified, but never started the
 *   organisation application, or never got past its first save.
 * - `join_pending`: asked to join an existing organisation; the admin has not
 *   answered yet.
 * - `draft`: started the application but never submitted it.
 */
export type SetupStage = "complete" | "no_organisation" | "join_pending" | "draft";

export type AccountSetup = {
  stage: SetupStage;
  organisation: Organisation | null;
  application: ComplianceApplication | null;
  /** Registration progress, 0–100. */
  percent: number;
  /** Where the person should go to carry on. */
  resumeTo: "/onboarding/application" | "/onboarding/dashboard" | "/onboarding/join";
};

/**
 * Only the compliance seats (the partner / operator desks that onboarding
 * registers) depend on a submitted application. Miners, regulators, buyers
 * and the like onboard elsewhere or are provisioned directly, so they are
 * never held back here.
 */
export function needsComplianceSetup(slug: VerticalSlug, roleId: string): boolean {
  return roleIn(slug, roleId)?.label.startsWith("Compliance") ?? false;
}

function resolve(
  organisations: Organisation[],
  applications: ComplianceApplication[],
  hasPendingJoin: boolean,
): AccountSetup {
  const organisation = organisations[0] ?? null;
  const application =
    applications.find((a) => a.organisation === organisation?.id) ?? applications[0] ?? null;
  const percent = application?.progress.percent ?? 0;

  if (!organisation) {
    return hasPendingJoin
      ? { stage: "join_pending", organisation, application, percent, resumeTo: "/onboarding/join" }
      : {
          stage: "no_organisation",
          organisation,
          application,
          percent,
          resumeTo: "/onboarding/application",
        };
  }
  // A member who joined an existing organisation sees its application, so
  // this only catches an organisation whose own application was never sent.
  if (!application) {
    return {
      stage: "no_organisation",
      organisation,
      application,
      percent,
      resumeTo: "/onboarding/application",
    };
  }
  if (application.status === "draft") {
    return {
      stage: "draft",
      organisation,
      application,
      percent,
      resumeTo: "/onboarding/dashboard",
    };
  }
  return {
    stage: "complete",
    organisation,
    application,
    percent,
    resumeTo: "/onboarding/dashboard",
  };
}

/**
 * Read the setup stage straight after sign-in, through the same cache keys
 * the onboarding pages use so they open without refetching.
 */
export async function fetchAccountSetup(queryClient: QueryClient): Promise<AccountSetup> {
  const [organisations, applications] = await Promise.all([
    queryClient.fetchQuery({
      queryKey: queryKeys.organisations({}),
      queryFn: () => listOrganisations({}),
    }),
    queryClient.fetchQuery({
      queryKey: queryKeys.applications,
      queryFn: () => listComplianceApplications(),
    }),
  ]);
  let hasPendingJoin = false;
  if (organisations.results.length === 0) {
    const requests = await queryClient.fetchQuery({
      queryKey: queryKeys.myJoinRequests,
      queryFn: () => listMyJoinRequests(),
    });
    hasPendingJoin = requests.results.some((r) => r.status === "pending");
  }
  return resolve(organisations.results, applications.results, hasPendingJoin);
}

/** The same check, live, for the in-workspace "finish your setup" banner. */
export function useAccountSetup(user: User | null, enabled: boolean) {
  const hasTokens = useHasTokens();
  return useQuery({
    queryKey: ["account-setup", user?.id ?? "anonymous"],
    queryFn: async () => {
      const [organisations, applications, requests] = await Promise.all([
        listOrganisations({}),
        listComplianceApplications(),
        listMyJoinRequests(),
      ]);
      return resolve(
        organisations.results,
        applications.results,
        requests.results.some((r) => r.status === "pending"),
      );
    },
    enabled: enabled && hasTokens && Boolean(user) && !user?.is_staff,
    staleTime: 60_000,
  });
}
