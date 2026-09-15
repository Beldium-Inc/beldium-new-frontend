import {
  useComplianceApplication,
  useComplianceApplications,
  useMyOrganisations,
  type ComplianceApplication,
  type Organisation,
  type UUID,
} from "@/lib/api";

/**
 * Resolves the organisation and compliance application this person is working
 * on, from the API rather than the local onboarding store.
 *
 * A compliance application hangs off an organisation (the backend field is a
 * OneToOne), so both have to exist before any section can be saved. Neither is
 * created here; the organisation step of the flow creates them on its first
 * save, once it has the name and type the API requires.
 */
export interface ApplicationContext {
  organisation: Organisation | null;
  application: ComplianceApplication | null;
  applicationId: UUID | null;
  /** True until both lookups have settled; the flow shows a placeholder. */
  loading: boolean;
  error: Error | null;
}

export function useApplicationContext(): ApplicationContext {
  const organisations = useMyOrganisations();
  const applications = useComplianceApplications();

  const organisation = organisations.data?.results?.[0] ?? null;

  // The list is already scoped to organisations this user belongs to, so the
  // match is only needed when somebody belongs to more than one.
  const listed =
    applications.data?.results?.find((a) => a.organisation === organisation?.id) ??
    applications.data?.results?.[0] ??
    null;

  // Re-read the detail route once an id is known: the list serialiser and the
  // detail route return the same shape, but the detail cache is what every
  // mutation writes back into, so reads and writes stay on one cache entry.
  const detail = useComplianceApplication(listed?.id ?? null);
  const application = detail.data ?? listed;

  return {
    organisation,
    application,
    applicationId: application?.id ?? null,
    loading: organisations.isLoading || applications.isLoading,
    error: (organisations.error ?? applications.error ?? detail.error) as Error | null,
  };
}
