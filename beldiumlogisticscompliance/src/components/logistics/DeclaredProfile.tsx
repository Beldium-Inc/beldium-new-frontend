import { KeyValue } from '@/components/beldium/bits';
import type { DeclaredProfileData } from '@/lib/mock-data';
import { Section } from './fields';

// Roles on the onboarding form's responsible officers list, in form order.
const OFFICER_ROLES = ['Fleet Manager', 'Operations Manager', 'Transport Safety Manager', 'Compliance Officer', 'Maintenance Manager', 'Dispatch Coordinator'];

const shown = (value?: string) => (value?.trim() ? value : 'Not declared');

// Shows every field the applicant declared during onboarding. Nothing here is verified.
export function DeclaredProfile({ profile }: { profile?: DeclaredProfileData | undefined }) {
  if (!profile) {
    return (
      <Section title="Declared onboarding profile">
        <p className="text-sm text-muted-foreground">No onboarding declarations are on record for this organization.</p>
      </Section>
    );
  }
  const { identity: i, representative: r, officers: o, operations: p } = profile;
  const serviceCategories = (p.services || '').split(',').filter(Boolean).join(', ');
  return (
    <>
      <Section title="Organization identity">
        <p className="mb-4 text-xs text-muted-foreground">Applicant-declared. Not verified against registries.</p>
        <KeyValue
          items={[
            { label: 'Registered name', value: shown(i.name) },
            { label: 'CAC registration number', value: shown(i.cac) },
            { label: 'Tax identification number', value: shown(i.tin) },
            { label: 'Business email', value: shown(i.email) },
            { label: 'Business telephone', value: shown(i.telephone) },
            { label: 'Registered business address', value: shown(i.address) },
            { label: 'State', value: shown(i.state) },
            { label: 'Local government area', value: shown(i.lga) },
            { label: 'Website', value: shown(i.website) },
            { label: 'Year established', value: shown(i.year) },
            { label: 'Organization type', value: shown(i.type) },
            { label: 'Business description', value: shown(i.description) },
          ]}
        />
      </Section>
      <Section title="Authorized representative">
        <KeyValue
          items={[
            { label: 'Full name', value: shown(r.name) },
            { label: 'Job title', value: shown(r.title) },
            { label: 'Work email', value: shown(r.email) },
            { label: 'Phone', value: shown(r.phone) },
            { label: 'Relationship to organization', value: shown(r.relationship) },
            { label: 'Authorized signatory designation', value: shown(r.signatory) },
            { label: 'Authority to represent', value: r.authority === 'yes' ? 'Declared' : 'Not declared' },
          ]}
        />
      </Section>
      <Section title="Responsible officers">
        <KeyValue items={OFFICER_ROLES.map((role) => ({ label: role, value: shown(o[role]) }))} />
      </Section>
      <Section title="Operating profile">
        <KeyValue
          items={[
            { label: 'Primary transport service', value: shown(p.primaryService) },
            { label: 'Secondary services', value: shown(p.secondary) },
            { label: 'Mineral haulage experience', value: shown(p.experience) },
            { label: 'Minerals transported', value: shown(p.minerals) },
            { label: 'Operating states', value: shown(p.states) },
            { label: 'Transport corridors', value: shown(p.corridors) },
            { label: 'Fleet ownership model', value: shown(p.ownership) },
            { label: 'Transport service coverage', value: shown(p.coverage) },
            { label: 'Operating schedule', value: shown(p.schedule) },
            { label: 'Dispatch capability', value: shown(p.dispatch) },
            { label: 'Estimated monthly capacity', value: shown(p.monthlyCapacity) },
            { label: 'Typical shipment quantity', value: shown(p.typicalQuantity) },
            { label: 'Maximum declared load', value: shown(p.maximumLoad) },
            { label: 'Cargo characteristics', value: shown(p.cargo) },
            { label: 'Service categories', value: shown(serviceCategories) },
          ]}
        />
        <p className="mt-4 text-xs text-muted-foreground">All capacities are applicant-declared, not verified availability.</p>
      </Section>
    </>
  );
}
