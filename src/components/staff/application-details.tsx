import { useCallback, useState, type ReactNode } from "react";
import { ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { apiFetchBlob } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import type { ComplianceApplication, Personnel } from "@/lib/api/types";

/**
 * Open a protected file in a new browser tab. The download endpoints need the
 * bearer token, so the file is fetched with it and shown from an object URL.
 * The tab is opened synchronously, inside the click, so pop-up blockers allow
 * it; `onOpened` fires only once the file actually arrived, which is what the
 * vetting desk uses to unlock "Verify".
 */
function useOpenFile() {
  const [opening, setOpening] = useState<string | null>(null);

  const open = useCallback(async (key: string, url: string | null, onOpened?: () => void) => {
    if (!url) {
      toast.error("No file was uploaded for this item.");
      return;
    }
    const tab = window.open("", "_blank");
    setOpening(key);
    try {
      const blob = await apiFetchBlob(url);
      const objectUrl = URL.createObjectURL(blob);
      if (tab) tab.location.href = objectUrl;
      else window.open(objectUrl, "_blank");
      // Leave the URL alive long enough for the tab to load it.
      setTimeout(() => URL.revokeObjectURL(objectUrl), 5 * 60_000);
      onOpened?.();
    } catch (err) {
      tab?.close();
      toast.error("Could not open this file", {
        description: err instanceof ApiError ? err.message : "Please try again.",
      });
    } finally {
      setOpening(null);
    }
  }, []);

  return { open, opening };
}

export function OpenFileButton({
  label,
  url,
  fileKey,
  onOpened,
}: {
  label: string;
  url: string | null;
  fileKey: string;
  onOpened?: () => void;
}) {
  const { open, opening } = useOpenFile();
  return (
    <Button
      size="sm"
      variant="outline"
      disabled={!url || opening !== null}
      onClick={() => void open(fileKey, url, onOpened)}
    >
      {opening ? (
        <Loader2 className="size-3.5 animate-spin" />
      ) : (
        <ExternalLink className="size-3.5" />
      )}
      {label}
    </Button>
  );
}

const yesNo = (v: boolean | undefined) => (v === undefined ? "-" : v ? "Yes" : "No");
const text = (v: string | number | null | undefined) =>
  v === undefined || v === null || v === "" ? "-" : String(v);
const list = (v: string[] | undefined) => (v && v.length ? v.join(", ") : "-");
const title = (v: string) => v.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="break-words">{children}</p>
    </div>
  );
}

function Section({
  heading,
  empty,
  children,
}: {
  heading: string;
  empty?: boolean;
  children: ReactNode;
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {heading}
      </p>
      {empty ? (
        <p className="text-sm text-muted-foreground">Not provided yet.</p>
      ) : (
        <div className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3">{children}</div>
      )}
    </div>
  );
}

function PersonnelCard({ person }: { person: Personnel }) {
  return (
    <div className="rounded-md border border-border px-3 py-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-medium">
          {person.full_name}{" "}
          <span className="text-xs font-normal text-muted-foreground">({person.role})</span>
        </p>
        <div className="flex gap-2">
          <OpenFileButton label="Open CV" url={person.cv_url} fileKey={`cv-${person.id}`} />
          <OpenFileButton
            label="Open certificate"
            url={person.certificate_url}
            fileKey={`cert-${person.id}`}
          />
        </div>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-4">
        <Field label="Discipline">{text(person.discipline)}</Field>
        <Field label="Qualification">{text(person.qualification)}</Field>
        <Field label="Years of experience">{text(person.years_experience)}</Field>
        <Field label="Registration number">{text(person.registration_number)}</Field>
      </div>
    </div>
  );
}

/** Every onboarding section an applicant filled in, read-only, for the desk. */
export function ApplicationDetails({ application: a }: { application: ComplianceApplication }) {
  const org = a.organisation_profile;
  const rep = a.representative;
  const svc = a.services;
  const pro = a.professional_capability;
  const insp = a.inspection_capability;
  const conflict = a.conflict_declaration;
  const decl = a.declaration;
  const isEmpty = (o: object) => Object.keys(o).length === 0;

  const counts: [string, number | undefined][] = [
    ["Compliance professionals", pro.compliance_professionals],
    ["Mining engineers", pro.mining_engineers],
    ["Geologists", pro.geologists],
    ["Environmental specialists", pro.environmental_specialists],
    ["HSE specialists", pro.hse_specialists],
    ["Legal / regulatory specialists", pro.legal_regulatory_specialists],
    ["Field inspectors", pro.field_inspectors],
    ["Other technical personnel", pro.other_technical_personnel],
  ];

  const confirmations: [string, boolean | undefined][] = [
    ["Information is accurate", decl.accuracy_confirmed],
    ["Documents are genuine", decl.documents_genuine],
    ["Agrees to comply with Beldium requirements", decl.compliance_agreed],
    ["Will disclose material changes", decl.disclose_changes],
    ["Signatory is authorised", decl.authorised],
    ["Final confirmation", decl.confirmed],
  ];

  return (
    <div className="space-y-5">
      <Section heading="Organisation" empty={isEmpty(org)}>
        <Field label="Registered legal name">{text(org.name)}</Field>
        <Field label="Organisation type">
          {text(org.organisation_type && title(org.organisation_type))}
        </Field>
        <Field label="Registration number">{text(org.registration_number)}</Field>
        <Field label="Tax identifier">{text(org.tax_identifier)}</Field>
        <Field label="Year established">{text(org.year_established)}</Field>
        <Field label="Website">{text(org.website)}</Field>
        <Field label="Registered address">{text(org.registered_address)}</Field>
        <Field label="Operating address">{text(org.operating_address)}</Field>
        <Field label="Country">{text(org.country)}</Field>
        <Field label="State / LGA">
          {text(org.state)} / {text(org.lga)}
        </Field>
      </Section>

      <Section heading="Representative" empty={isEmpty(rep)}>
        <Field label="Full name">{text(rep.full_name)}</Field>
        <Field label="Position">{text(rep.position)}</Field>
        <Field label="Official email">{text(rep.official_email)}</Field>
        <Field label="Official phone">{text(rep.official_phone)}</Field>
        <Field label="Authorised to represent">{yesNo(rep.authorised)}</Field>
      </Section>

      <Section heading="Compliance services" empty={isEmpty(svc)}>
        <Field label="Services offered">{list(svc.selected_services)}</Field>
        <Field label="Geographic coverage">
          {text(svc.geographic_coverage && title(svc.geographic_coverage))}
        </Field>
        <Field label="States covered">{list(svc.states_covered)}</Field>
      </Section>

      <Section heading="Professional capability" empty={isEmpty(pro)}>
        <Field label="Years of mining experience">{text(pro.years_mining_experience)}</Field>
        {counts.map(([label, value]) => (
          <Field key={label} label={label}>
            {text(value)}
          </Field>
        ))}
      </Section>

      <Section heading="Inspection capability" empty={isEmpty(insp)}>
        <Field label="Conducts physical inspections">
          {yesNo(insp.conducts_physical_inspections)}
        </Field>
        <Field label="Active inspectors">{text(insp.active_inspectors)}</Field>
        <Field label="Max inspections per month">{text(insp.maximum_inspections_per_month)}</Field>
        <Field label="Average turnaround">{text(insp.average_turnaround_time)}</Field>
        <Field label="Typical mobilisation time">{text(insp.typical_mobilisation_time)}</Field>
        <Field label="Evidence standards">{list(insp.inspection_evidence_standards)}</Field>
        {insp.equipment && Object.keys(insp.equipment).length ? (
          <Field label="Equipment / evidence capture">
            {Object.entries(insp.equipment)
              .map(
                ([name, value]) =>
                  `${name}: ${typeof value === "boolean" ? yesNo(value) : String(value)}`,
              )
              .join(", ")}
          </Field>
        ) : null}
      </Section>

      <Section heading="Conflict declaration" empty={isEmpty(conflict)}>
        <Field label="Owns mining assets">{yesNo(conflict.owns_assets)}</Field>
        <Field label="Serves mining companies">{yesNo(conflict.serves_mining_companies)}</Field>
        <Field label="Trades minerals">{yesNo(conflict.trades_minerals)}</Field>
        <Field label="Relationships disclosed">{text(conflict.relationships)}</Field>
        <Field label="Agreed to disclosure terms">{yesNo(conflict.agreed)}</Field>
      </Section>

      <Section heading="Declarations" empty={isEmpty(decl)}>
        {confirmations.map(([label, value]) => (
          <Field key={label} label={label}>
            {yesNo(value)}
          </Field>
        ))}
        <Field label="Signatory name">{text(decl.signatory_name)}</Field>
        <Field label="Signatory position">{text(decl.signatory_position)}</Field>
        <Field label="Declaration date">{text(decl.declaration_date)}</Field>
      </Section>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Personnel ({a.personnel.length})
        </p>
        {a.personnel.length === 0 ? (
          <p className="text-sm text-muted-foreground">No personnel added yet.</p>
        ) : (
          <div className="space-y-2">
            {a.personnel.map((p) => (
              <PersonnelCard key={p.id} person={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
