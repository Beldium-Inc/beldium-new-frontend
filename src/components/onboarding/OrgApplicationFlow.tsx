import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Check, Loader2, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { AuthShell, InfoRow, ProgressHeader, StepBar } from "@/components/onboarding/ui";
import {
  ChipToggleGroup,
  FieldErrorProvider,
  SectionCard,
  SelectField,
  TextField,
  YesNoField,
} from "@/components/onboarding/fields";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  ApiError,
  DOCUMENT_STATUS_LABELS,
  ORGANISATION_TYPE_LABELS,
  saveSection,
  useCreateComplianceApplication,
  useCreateOrganisation,
  useCreatePersonnel,
  useDocumentRequirements,
  useSaveSection,
  useSubmitApplication,
  useUploadDocument,
  type ComplianceApplication,
  type OrganisationProfileData,
  type OrganisationType,
} from "@/lib/api";
import {
  complianceServiceOptions,
  nigerianStates,
  personnelRoleOptions,
} from "@/lib/onboarding/data";
import { useApplicationContext } from "@/lib/onboarding/application";
import { useOnboarding } from "@/lib/onboarding/store";
import { VERTICAL_BY_SLUG } from "@/lib/verticals";

// Steps follow the backend's seven sections plus documents, personnel and a
// review gate, rather than the shape the local prototype store used: each save
// below is a real PATCH, and a step only advances once the API accepts it.
const steps = [
  "Organisation",
  "Representative",
  "Compliance Services",
  "Professional Capability",
  "Inspection Capability",
  "Documents",
  "Personnel",
  "Conflict Declaration",
  "Declarations",
  "Review",
];

const ORG_TYPE_ENTRIES = Object.entries(ORGANISATION_TYPE_LABELS) as [OrganisationType, string][];
const ORG_TYPE_LABELS = ORG_TYPE_ENTRIES.map(([, label]) => label);

const EVIDENCE_STANDARDS = [
  "GPS coordinates",
  "Photographic evidence",
  "Video evidence",
  "Digital inspection reports",
  "Physical sampling",
];

/** The six confirmations the declaration section requires, all of which must be true. */
const DECLARATION_ITEMS = [
  {
    key: "accuracy_confirmed",
    label: "Accuracy Declaration",
    detail: "All information supplied in this application is accurate and complete.",
  },
  {
    key: "documents_genuine",
    label: "Document Authenticity",
    detail: "Every document attached is genuine and unaltered.",
  },
  {
    key: "compliance_agreed",
    label: "Compliance Undertaking",
    detail: "Compliance work will be carried out independently and to Beldium's standard.",
  },
  {
    key: "disclose_changes",
    label: "Disclosure Undertaking",
    detail: "Any material change will be disclosed to Beldium without delay.",
  },
  {
    key: "authorised",
    label: "Authorised Representative",
    detail: "I am authorised to submit this application on behalf of the organisation.",
  },
  {
    key: "confirmed",
    label: "Final Confirmation",
    detail: "I confirm this application is complete and ready for review.",
  },
] as const;

type DeclarationKey = (typeof DECLARATION_ITEMS)[number]["key"];

function numeric(value: string): number {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

/**
 * Turns a DRF 400 into something a person can act on.
 *
 * The per-field messages are returned so the caller can put them on the
 * offending inputs; the toast carries only what has nowhere else to go: a
 * non-field error, or a failure with no field detail at all. Repeating every
 * field message in a toast as well would say the same thing twice.
 */
function reportError(error: unknown, fallback: string): Record<string, string> {
  if (!(error instanceof ApiError)) {
    toast.error(fallback);
    return {};
  }
  const fields = error.fieldErrors();
  const loose = Object.entries(fields)
    .filter(([field]) => field.endsWith("non_field_errors"))
    .map(([, message]) => message);

  const anchored = Object.keys(fields).some((field) => !field.endsWith("non_field_errors"));
  if (loose.length) toast.error(loose.join(" · "));
  else if (!anchored) toast.error(error.message || fallback);
  else toast.error("Some entries need attention: see the highlighted fields.");

  return fields;
}

export function OrgApplicationFlow() {
  const { sector } = useOnboarding();
  const sectorName = sector ? VERTICAL_BY_SLUG[sector].name : "your sector";
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  /** Per-field validation messages from the last rejected save, by API field name. */
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const { organisation, application, applicationId, loading } = useApplicationContext();

  const createOrganisation = useCreateOrganisation();
  const createApplication = useCreateComplianceApplication();
  const saveOrganisation = useSaveSection(applicationId, "organisation");
  const saveRepresentative = useSaveSection(applicationId, "representative");
  const saveServices = useSaveSection(applicationId, "services");
  const saveProfessional = useSaveSection(applicationId, "professional-capability");
  const saveInspection = useSaveSection(applicationId, "inspection-capability");
  const saveConflict = useSaveSection(applicationId, "conflict-declaration");
  const saveDeclaration = useSaveSection(applicationId, "declaration");
  const submit = useSubmitApplication(applicationId);

  const requirements = useDocumentRequirements(applicationId);
  const uploadDocument = useUploadDocument(applicationId);
  const createPersonnel = useCreatePersonnel(applicationId);

  // --- form state, seeded from whatever the API has already stored ----------

  const [org, setOrg] = useState({
    name: "",
    organisation_type: ORG_TYPE_LABELS[1] ?? "",
    registration_number: "",
    tax_identifier: "",
    year_established: "",
    website: "",
    registered_address: "",
    operating_address: "",
    country: "Nigeria",
    state: nigerianStates[0] ?? "",
    lga: "",
  });
  const [rep, setRep] = useState({
    full_name: "",
    position: "",
    official_email: "",
    official_phone: "",
    authorised: false,
  });
  const [services, setServices] = useState({
    selected_services: [] as string[],
    coverage: "Nationwide",
    states_covered: [] as string[],
  });
  const [professional, setProfessional] = useState({
    years_mining_experience: "",
    compliance_professionals: "",
    mining_engineers: "",
    geologists: "",
    environmental_specialists: "",
    hse_specialists: "",
    legal_regulatory_specialists: "",
    field_inspectors: "",
    other_technical_personnel: "",
  });
  const [inspection, setInspection] = useState({
    conducts_physical_inspections: false,
    active_inspectors: "",
    maximum_inspections_per_month: "",
    average_turnaround_time: "",
    typical_mobilisation_time: "",
    evidence: [] as string[],
  });
  const [conflict, setConflict] = useState({
    owns_assets: false,
    serves_mining_companies: false,
    trades_minerals: false,
    relationships: "",
    agreed: false,
  });
  const [declarations, setDeclarations] = useState<Record<DeclarationKey, boolean>>({
    accuracy_confirmed: false,
    documents_genuine: false,
    compliance_agreed: false,
    disclose_changes: false,
    authorised: false,
    confirmed: false,
  });
  const [signatory, setSignatory] = useState({ signatory_name: "", signatory_position: "" });
  const [person, setPerson] = useState({
    full_name: "",
    role: personnelRoleOptions[0] ?? "",
    discipline: "",
    qualification: "",
    registration_number: "",
    years_experience: "",
  });
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [certificateFile, setCertificateFile] = useState<File | null>(null);
  const [uploadingType, setUploadingType] = useState<string | null>(null);

  // Rehydrate each form from the saved section the first time it arrives, so
  // reopening the flow shows what the server actually holds.
  const [seeded, setSeeded] = useState(false);
  useEffect(() => {
    if (seeded || !application) return;
    const profile = application.organisation_profile ?? {};
    if (profile.name) {
      const label = profile.organisation_type
        ? ORGANISATION_TYPE_LABELS[profile.organisation_type]
        : undefined;
      setOrg((s) => ({
        ...s,
        name: profile.name ?? s.name,
        organisation_type: label ?? s.organisation_type,
        registration_number: profile.registration_number ?? s.registration_number,
        tax_identifier: profile.tax_identifier ?? s.tax_identifier,
        year_established: profile.year_established
          ? String(profile.year_established)
          : s.year_established,
        website: profile.website ?? s.website,
        registered_address: profile.registered_address ?? s.registered_address,
        operating_address: profile.operating_address ?? s.operating_address,
        country: profile.country ?? s.country,
        state: profile.state ?? s.state,
        lga: profile.lga ?? s.lga,
      }));
    } else if (organisation) {
      setOrg((s) => ({
        ...s,
        name: organisation.name || s.name,
        organisation_type:
          ORGANISATION_TYPE_LABELS[organisation.organisation_type] ?? s.organisation_type,
        registration_number: organisation.registration_number || s.registration_number,
        tax_identifier: organisation.tax_identifier || s.tax_identifier,
        website: organisation.website || s.website,
        registered_address: organisation.address || s.registered_address,
        country: organisation.country || s.country,
        state: organisation.state || s.state,
      }));
    }

    const representative = application.representative ?? {};
    if (representative.full_name) {
      setRep((s) => ({
        full_name: representative.full_name ?? s.full_name,
        position: representative.position ?? s.position,
        official_email: representative.official_email ?? s.official_email,
        official_phone: representative.official_phone ?? s.official_phone,
        authorised: Boolean(representative.authorised),
      }));
    }

    const saved = application.services ?? {};
    if (saved.selected_services) {
      setServices({
        selected_services: saved.selected_services ?? [],
        coverage:
          saved.geographic_coverage === "selected_states" ? "Selected States" : "Nationwide",
        states_covered: saved.states_covered ?? [],
      });
    }

    const capability = application.professional_capability ?? {};
    if (capability.years_mining_experience !== undefined) {
      setProfessional({
        years_mining_experience: String(capability.years_mining_experience ?? ""),
        compliance_professionals: String(capability.compliance_professionals ?? ""),
        mining_engineers: String(capability.mining_engineers ?? ""),
        geologists: String(capability.geologists ?? ""),
        environmental_specialists: String(capability.environmental_specialists ?? ""),
        hse_specialists: String(capability.hse_specialists ?? ""),
        legal_regulatory_specialists: String(capability.legal_regulatory_specialists ?? ""),
        field_inspectors: String(capability.field_inspectors ?? ""),
        other_technical_personnel: String(capability.other_technical_personnel ?? ""),
      });
    }

    const inspect = application.inspection_capability ?? {};
    if (inspect.conducts_physical_inspections !== undefined) {
      setInspection({
        conducts_physical_inspections: Boolean(inspect.conducts_physical_inspections),
        active_inspectors: String(inspect.active_inspectors ?? ""),
        maximum_inspections_per_month: String(inspect.maximum_inspections_per_month ?? ""),
        average_turnaround_time: inspect.average_turnaround_time ?? "",
        typical_mobilisation_time: inspect.typical_mobilisation_time ?? "",
        evidence: inspect.inspection_evidence_standards ?? [],
      });
    }

    const declared = application.conflict_declaration ?? {};
    if (declared.agreed !== undefined) {
      setConflict({
        owns_assets: Boolean(declared.owns_assets),
        serves_mining_companies: Boolean(declared.serves_mining_companies),
        trades_minerals: Boolean(declared.trades_minerals),
        relationships: declared.relationships ?? "",
        agreed: Boolean(declared.agreed),
      });
    }

    const declaration = application.declaration ?? {};
    if (declaration.confirmed !== undefined) {
      setDeclarations({
        accuracy_confirmed: Boolean(declaration.accuracy_confirmed),
        documents_genuine: Boolean(declaration.documents_genuine),
        compliance_agreed: Boolean(declaration.compliance_agreed),
        disclose_changes: Boolean(declaration.disclose_changes),
        authorised: Boolean(declaration.authorised),
        confirmed: Boolean(declaration.confirmed),
      });
      setSignatory({
        signatory_name: declaration.signatory_name ?? "",
        signatory_position: declaration.signatory_position ?? "",
      });
    }
    setSeeded(true);
  }, [application, organisation, seeded]);

  const toggle = (list: string[], value: string) =>
    list.includes(value) ? list.filter((v) => v !== value) : [...list, value];

  const typeValueFor = (label: string): OrganisationType =>
    ORG_TYPE_ENTRIES.find(([, l]) => l === label)?.[0] ?? "compliance_partner";

  const organisationPayload = (): OrganisationProfileData => ({
    name: org.name.trim(),
    organisation_type: typeValueFor(org.organisation_type),
    registration_number: org.registration_number.trim(),
    tax_identifier: org.tax_identifier.trim(),
    year_established: numeric(org.year_established),
    website: org.website.trim(),
    registered_address: org.registered_address.trim(),
    operating_address: org.operating_address.trim(),
    country: org.country.trim() || "Nigeria",
    state: org.state.trim(),
    lga: org.lga.trim(),
  });

  /**
   * The organisation step doubles as the bootstrap: the API needs an
   * Organisation and a ComplianceApplication to exist before any section can be
   * written, and this is the first step holding the name and type to make one.
   */
  const ensureApplication = async (): Promise<ComplianceApplication | null> => {
    if (application) return application;
    let organisationId = organisation?.id;
    if (!organisationId) {
      const created = await createOrganisation.mutateAsync({
        name: org.name.trim(),
        organisation_type: typeValueFor(org.organisation_type),
        registration_number: org.registration_number.trim(),
        tax_identifier: org.tax_identifier.trim(),
        website: org.website.trim(),
        address: org.registered_address.trim(),
        country: org.country.trim() || "Nigeria",
        state: org.state.trim(),
      });
      organisationId = created.id;
    }
    return createApplication.mutateAsync(organisationId);
  };

  const saving =
    saveOrganisation.isPending ||
    saveRepresentative.isPending ||
    saveServices.isPending ||
    saveProfessional.isPending ||
    saveInspection.isPending ||
    saveConflict.isPending ||
    saveDeclaration.isPending ||
    createOrganisation.isPending ||
    createApplication.isPending;

  /** Persist the current step, and only advance once the API has accepted it. */
  const saveStep = async (): Promise<boolean> => {
    try {
      switch (step) {
        case 0: {
          const target = await ensureApplication();
          if (!target) return false;
          // On the very first pass the id is newer than the hook's closure, so
          // the bare client call is used until the next render picks it up.
          if (target.id === applicationId)
            await saveOrganisation.mutateAsync(organisationPayload());
          else await saveSection(target.id, "organisation", organisationPayload());
          return true;
        }
        case 1:
          await saveRepresentative.mutateAsync({
            full_name: rep.full_name.trim(),
            position: rep.position.trim(),
            official_email: rep.official_email.trim(),
            official_phone: rep.official_phone.replace(/[\s-]/g, ""),
            authorised: rep.authorised,
          });
          return true;
        case 2:
          await saveServices.mutateAsync({
            selected_services: services.selected_services,
            geographic_coverage:
              services.coverage === "Nationwide" ? "nationwide" : "selected_states",
            states_covered: services.coverage === "Nationwide" ? [] : services.states_covered,
          });
          return true;
        case 3:
          await saveProfessional.mutateAsync({
            years_mining_experience: numeric(professional.years_mining_experience),
            compliance_professionals: numeric(professional.compliance_professionals),
            mining_engineers: numeric(professional.mining_engineers),
            geologists: numeric(professional.geologists),
            environmental_specialists: numeric(professional.environmental_specialists),
            hse_specialists: numeric(professional.hse_specialists),
            legal_regulatory_specialists: numeric(professional.legal_regulatory_specialists),
            field_inspectors: numeric(professional.field_inspectors),
            other_technical_personnel: numeric(professional.other_technical_personnel),
          });
          return true;
        case 4:
          await saveInspection.mutateAsync({
            conducts_physical_inspections: inspection.conducts_physical_inspections,
            active_inspectors: numeric(inspection.active_inspectors),
            maximum_inspections_per_month: numeric(inspection.maximum_inspections_per_month),
            average_turnaround_time: inspection.average_turnaround_time.trim(),
            typical_mobilisation_time: inspection.typical_mobilisation_time.trim(),
            equipment: Object.fromEntries(
              EVIDENCE_STANDARDS.map((e) => [e, inspection.evidence.includes(e)]),
            ),
            inspection_evidence_standards: inspection.evidence,
          });
          return true;
        case 7:
          await saveConflict.mutateAsync({
            owns_assets: conflict.owns_assets,
            serves_mining_companies: conflict.serves_mining_companies,
            trades_minerals: conflict.trades_minerals,
            relationships: conflict.relationships.trim() || "None declared.",
            agreed: conflict.agreed,
          });
          return true;
        case 8:
          // `declaration_date` is deliberately not sent: the backend parses it
          // to a Python date and then writes the section straight into a
          // JSONField, which raises and returns 500. The field is optional, so
          // omitting it is the only way to save this section today.
          await saveDeclaration.mutateAsync({
            ...declarations,
            signatory_name: signatory.signatory_name.trim(),
            signatory_position: signatory.signatory_position.trim(),
          });
          return true;
        default:
          // Documents (5), personnel (6) and review (9) save as you act on them.
          return true;
      }
    } catch (error) {
      setFieldErrors(reportError(error, "That section could not be saved."));
      return false;
    }
  };

  const advance = async () => {
    if (await saveStep()) setStep((s) => Math.min(s + 1, steps.length - 1));
  };

  /** Drop a field's message once the person starts fixing it. */
  const clearFieldError = useCallback((name: string) => {
    setFieldErrors((current) => {
      if (!(`data.${name}` in current) && !(name in current)) return current;
      const next = { ...current };
      delete next[`data.${name}`];
      delete next[name];
      return next;
    });
  }, []);

  const onSubmit = async () => {
    try {
      const result = await submit.mutateAsync();
      navigate({ to: "/onboarding/submitted", search: { id: result.id } });
    } catch (error) {
      // Both blocking cases already say exactly what to do, so the API message
      // is better than anything restated here.
      if (
        error instanceof ApiError &&
        (error.code === "applicant_not_verified" || error.code === "documents_rejected")
      ) {
        toast.error(error.message);
        return;
      }
      setFieldErrors(reportError(error, "The application could not be submitted."));
    }
  };

  const progress = application?.progress;

  /**
   * Why the API would refuse this submission, or null when it would take it.
   * An incomplete application is not a reason: only an unverified applicant,
   * or evidence the desk rejected and is still waiting on.
   */
  const rejectedDocuments = progress?.documents.rejected ?? [];
  const blockedReason = progress?.blocking.includes("account")
    ? "Verify your email address before submitting."
    : rejectedDocuments.length
      ? `Replace the rejected ${rejectedDocuments.length > 1 ? "documents" : "document"} first.`
      : null;
  const documentsByType = useMemo(
    () => new Map((application?.documents ?? []).map((d) => [d.document_type, d])),
    [application?.documents],
  );
  const outstandingDocuments = useMemo(
    () =>
      (requirements.data ?? []).filter(
        (r) => r.status === "not_submitted" || r.status === "requested",
      ),
    [requirements.data],
  );

  if (loading) {
    return (
      <AuthShell eyebrow="Organisation Application" title="Loading your application" width="lg">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Fetching what has already been saved…
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      eyebrow={`Organisation Application · Step ${step + 1} of ${steps.length}`}
      title={steps[step] ?? ""}
      description={`Register your organisation as an approved Beldium compliance partner in ${sectorName}. Operating sites and licences are not registered here.`}
      width="lg"
    >
      <FieldErrorProvider errors={fieldErrors} clear={clearFieldError}>
        <ProgressHeader
          step={step + 1}
          total={steps.length}
          onBack={() => (step === 0 ? navigate({ to: "/onboarding/verify" }) : setStep(step - 1))}
        />
        <StepBar steps={steps} current={step} />

        {progress && (
          <p className="mt-3 text-xs text-muted-foreground">
            Saved progress: {progress.percent}% · {progress.completed} of {progress.total} sections
            · {progress.documents.submitted} of {progress.documents.required} required documents
          </p>
        )}

        <div className="mt-7 space-y-5">
          {step === 0 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                name="name"
                label="Registered Legal Name"
                value={org.name}
                onChange={(v) => setOrg({ ...org, name: v })}
              />
              <SelectField
                name="organisation_type"
                label="Organisation Type"
                value={org.organisation_type}
                onChange={(v) => setOrg({ ...org, organisation_type: v })}
                options={ORG_TYPE_LABELS}
              />
              <TextField
                name="registration_number"
                label="RC / CAC Number"
                value={org.registration_number}
                onChange={(v) => setOrg({ ...org, registration_number: v })}
              />
              <TextField
                name="tax_identifier"
                label="TIN"
                value={org.tax_identifier}
                onChange={(v) => setOrg({ ...org, tax_identifier: v })}
              />
              <TextField
                name="year_established"
                label="Year Established"
                type="number"
                placeholder="e.g. 2015"
                value={org.year_established}
                onChange={(v) => setOrg({ ...org, year_established: v })}
              />
              <TextField
                name="website"
                label="Website"
                placeholder="https://example.com"
                value={org.website}
                onChange={(v) => setOrg({ ...org, website: v })}
              />
              <TextField
                name="registered_address"
                label="Registered Address"
                value={org.registered_address}
                onChange={(v) => setOrg({ ...org, registered_address: v })}
                className="sm:col-span-2"
              />
              <TextField
                name="operating_address"
                label="Operating Address"
                value={org.operating_address}
                onChange={(v) => setOrg({ ...org, operating_address: v })}
                className="sm:col-span-2"
              />
              <TextField
                name="country"
                label="Country"
                value={org.country}
                onChange={(v) => setOrg({ ...org, country: v })}
              />
              <SelectField
                name="state"
                label="State"
                value={org.state}
                onChange={(v) => setOrg({ ...org, state: v })}
                options={nigerianStates}
              />
              <TextField
                name="lga"
                label="LGA"
                value={org.lga}
                onChange={(v) => setOrg({ ...org, lga: v })}
              />
            </div>
          )}

          {step === 1 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                name="full_name"
                label="Full Name"
                value={rep.full_name}
                onChange={(v) => setRep({ ...rep, full_name: v })}
              />
              <TextField
                name="position"
                label="Position"
                value={rep.position}
                onChange={(v) => setRep({ ...rep, position: v })}
              />
              <TextField
                name="official_email"
                label="Official Email"
                type="email"
                value={rep.official_email}
                onChange={(v) => setRep({ ...rep, official_email: v })}
              />
              <TextField
                name="official_phone"
                label="Official Phone"
                placeholder="+2348030000000"
                value={rep.official_phone}
                onChange={(v) => setRep({ ...rep, official_phone: v })}
              />
              <label className="flex items-start gap-3 rounded-[14px] border border-border px-4 py-3 sm:col-span-2">
                <Checkbox
                  className="mt-0.5"
                  checked={rep.authorised}
                  onCheckedChange={(c) => setRep({ ...rep, authorised: Boolean(c) })}
                />
                <span className="text-sm">
                  I am authorised to represent this organisation in its dealings with Beldium.
                </span>
              </label>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <ChipToggleGroup
                label="Compliance Services Offered"
                hint="Select every service your organisation is able to deliver."
                options={complianceServiceOptions}
                selected={services.selected_services}
                onToggle={(v) =>
                  setServices({
                    ...services,
                    selected_services: toggle(services.selected_services, v),
                  })
                }
              />
              <SelectField
                name="coverage"
                label="Coverage"
                value={services.coverage}
                onChange={(v) => setServices({ ...services, coverage: v })}
                options={["Nationwide", "Selected States"]}
              />
              {services.coverage === "Selected States" && (
                <ChipToggleGroup
                  label="States Covered"
                  options={nigerianStates}
                  selected={services.states_covered}
                  onToggle={(v) =>
                    setServices({ ...services, states_covered: toggle(services.states_covered, v) })
                  }
                />
              )}
            </div>
          )}

          {step === 3 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                name="years_mining_experience"
                label="Years of Mining Experience"
                type="number"
                value={professional.years_mining_experience}
                onChange={(v) => setProfessional({ ...professional, years_mining_experience: v })}
              />
              <TextField
                name="compliance_professionals"
                label="Compliance Professionals"
                type="number"
                value={professional.compliance_professionals}
                onChange={(v) => setProfessional({ ...professional, compliance_professionals: v })}
              />
              <TextField
                name="mining_engineers"
                label="Mining Engineers"
                type="number"
                value={professional.mining_engineers}
                onChange={(v) => setProfessional({ ...professional, mining_engineers: v })}
              />
              <TextField
                name="geologists"
                label="Geologists"
                type="number"
                value={professional.geologists}
                onChange={(v) => setProfessional({ ...professional, geologists: v })}
              />
              <TextField
                name="environmental_specialists"
                label="Environmental Specialists"
                type="number"
                value={professional.environmental_specialists}
                onChange={(v) => setProfessional({ ...professional, environmental_specialists: v })}
              />
              <TextField
                name="hse_specialists"
                label="HSE Specialists"
                type="number"
                value={professional.hse_specialists}
                onChange={(v) => setProfessional({ ...professional, hse_specialists: v })}
              />
              <TextField
                name="legal_regulatory_specialists"
                label="Legal / Regulatory Specialists"
                type="number"
                value={professional.legal_regulatory_specialists}
                onChange={(v) =>
                  setProfessional({ ...professional, legal_regulatory_specialists: v })
                }
              />
              <TextField
                name="field_inspectors"
                label="Field Inspectors"
                type="number"
                value={professional.field_inspectors}
                onChange={(v) => setProfessional({ ...professional, field_inspectors: v })}
              />
              <TextField
                name="other_technical_personnel"
                label="Other Technical Personnel"
                type="number"
                value={professional.other_technical_personnel}
                onChange={(v) => setProfessional({ ...professional, other_technical_personnel: v })}
              />
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <YesNoField
                label="Conducts physical site inspections"
                value={inspection.conducts_physical_inspections}
                onChange={(v) => setInspection({ ...inspection, conducts_physical_inspections: v })}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField
                  name="active_inspectors"
                  label="Active Inspectors"
                  type="number"
                  value={inspection.active_inspectors}
                  onChange={(v) => setInspection({ ...inspection, active_inspectors: v })}
                />
                <TextField
                  name="maximum_inspections_per_month"
                  label="Maximum Inspections per Month"
                  type="number"
                  value={inspection.maximum_inspections_per_month}
                  onChange={(v) =>
                    setInspection({ ...inspection, maximum_inspections_per_month: v })
                  }
                />
                <TextField
                  name="average_turnaround_time"
                  label="Average Turnaround Time"
                  placeholder="e.g. 7 days"
                  value={inspection.average_turnaround_time}
                  onChange={(v) => setInspection({ ...inspection, average_turnaround_time: v })}
                />
                <TextField
                  name="typical_mobilisation_time"
                  label="Typical Mobilisation Time"
                  placeholder="e.g. 5 working days"
                  value={inspection.typical_mobilisation_time}
                  onChange={(v) => setInspection({ ...inspection, typical_mobilisation_time: v })}
                />
              </div>
              <ChipToggleGroup
                label="Inspection Evidence Standards"
                options={EVIDENCE_STANDARDS}
                selected={inspection.evidence}
                onToggle={(v) =>
                  setInspection({ ...inspection, evidence: toggle(inspection.evidence, v) })
                }
              />
            </div>
          )}

          {step === 5 && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Every document below is required before the application can be submitted. PDF, Word,
                JPEG or PNG, up to 10 MB each.
              </p>
              {requirements.isLoading && (
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" /> Loading the checklist…
                </p>
              )}
              {!applicationId && (
                <p className="text-sm text-muted-foreground">
                  Save the organisation step first to open the checklist.
                </p>
              )}
              {(requirements.data ?? []).map((requirement) => {
                const uploaded = documentsByType.get(requirement.document_type);
                return (
                  <div
                    key={requirement.document_type}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-[14px] border border-border px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{requirement.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {DOCUMENT_STATUS_LABELS[requirement.status]}
                        {uploaded?.original_name ? ` · ${uploaded.original_name}` : ""}
                        {uploaded?.review_notes ? ` · ${uploaded.review_notes}` : ""}
                      </p>
                    </div>
                    <label className="shrink-0">
                      <input
                        type="file"
                        className="hidden"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        onChange={async (event) => {
                          const file = event.target.files?.[0];
                          event.target.value = "";
                          if (!file) return;
                          setUploadingType(requirement.document_type);
                          try {
                            await uploadDocument.mutateAsync({
                              document_type: requirement.document_type,
                              file,
                              title: requirement.title,
                            });
                            toast.success(`${requirement.title} uploaded.`);
                          } catch (error) {
                            setFieldErrors(reportError(error, "That file could not be uploaded."));
                          } finally {
                            setUploadingType(null);
                          }
                        }}
                      />
                      <span className="inline-flex cursor-pointer items-center gap-1.5 rounded-[10px] border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted">
                        {uploadingType === requirement.document_type ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          <Upload className="size-3.5" />
                        )}
                        {requirement.status === "not_submitted" ? "Upload" : "Replace"}
                      </span>
                    </label>
                  </div>
                );
              })}
            </div>
          )}

          {step === 6 && (
            <div className="space-y-5">
              <SectionCard title="Register a key professional">
                <div className="grid gap-4 sm:grid-cols-2">
                  <TextField
                    name="full_name"
                    label="Full Name"
                    value={person.full_name}
                    onChange={(v) => setPerson({ ...person, full_name: v })}
                  />
                  <SelectField
                    name="role"
                    label="Role"
                    value={person.role}
                    onChange={(v) => setPerson({ ...person, role: v })}
                    options={personnelRoleOptions}
                  />
                  <TextField
                    name="discipline"
                    label="Discipline"
                    value={person.discipline}
                    onChange={(v) => setPerson({ ...person, discipline: v })}
                  />
                  <TextField
                    name="qualification"
                    label="Qualification"
                    value={person.qualification}
                    onChange={(v) => setPerson({ ...person, qualification: v })}
                  />
                  <TextField
                    name="registration_number"
                    label="Professional Registration"
                    value={person.registration_number}
                    onChange={(v) => setPerson({ ...person, registration_number: v })}
                  />
                  <TextField
                    name="years_experience"
                    label="Years Experience"
                    type="number"
                    value={person.years_experience}
                    onChange={(v) => setPerson({ ...person, years_experience: v })}
                  />
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <label className="text-sm">
                    <span className="mb-1.5 block font-medium">CV (PDF or Word)</span>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      className="block w-full text-xs"
                      onChange={(e) => setCvFile(e.target.files?.[0] ?? null)}
                    />
                  </label>
                  <label className="text-sm">
                    <span className="mb-1.5 block font-medium">Certificate (PDF or image)</span>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="block w-full text-xs"
                      onChange={(e) => setCertificateFile(e.target.files?.[0] ?? null)}
                    />
                  </label>
                </div>
                <Button
                  className="mt-4"
                  disabled={
                    !person.full_name.trim() || !person.role.trim() || createPersonnel.isPending
                  }
                  onClick={async () => {
                    try {
                      await createPersonnel.mutateAsync({
                        full_name: person.full_name.trim(),
                        role: person.role.trim(),
                        discipline: person.discipline.trim(),
                        qualification: person.qualification.trim(),
                        registration_number: person.registration_number.trim(),
                        years_experience: numeric(person.years_experience),
                        cv: cvFile,
                        certificate: certificateFile,
                      });
                      setPerson({
                        full_name: "",
                        role: personnelRoleOptions[0] ?? "",
                        discipline: "",
                        qualification: "",
                        registration_number: "",
                        years_experience: "",
                      });
                      setCvFile(null);
                      setCertificateFile(null);
                      toast.success("Personnel added.");
                    } catch (error) {
                      setFieldErrors(reportError(error, "That person could not be added."));
                    }
                  }}
                >
                  {createPersonnel.isPending ? "Adding…" : "Add personnel"}
                </Button>
              </SectionCard>

              <div className="space-y-2">
                {(application?.personnel ?? []).length === 0 && (
                  <p className="text-sm text-muted-foreground">No personnel registered yet.</p>
                )}
                {(application?.personnel ?? []).length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Personnel cannot be removed yet: the API rejects DELETE on this route.
                  </p>
                )}
                {(application?.personnel ?? []).map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between gap-3 rounded-[14px] border border-border px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{p.full_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {p.role}
                        {p.years_experience ? ` · ${p.years_experience} yrs` : ""}
                        {p.qualification ? ` · ${p.qualification}` : ""}
                        {p.cv_url ? " · CV attached" : ""}
                      </p>
                    </div>
                    {/*
                    Removal is wired to DELETE personnel/{id}, but the viewset's
                    http_method_names omits "delete", so the route answers 405.
                    The control stays visible and disabled rather than shipping a
                    button that always fails.
                  */}
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Remove ${p.full_name}`}
                      disabled
                      title="Removing personnel is not available: the API rejects DELETE on this route."
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 7 && (
            <div className="space-y-5">
              <YesNoField
                label="Does your organisation own mining assets or titles?"
                value={conflict.owns_assets}
                onChange={(v) => setConflict({ ...conflict, owns_assets: v })}
              />
              <YesNoField
                label="Do you provide services to mining companies?"
                value={conflict.serves_mining_companies}
                onChange={(v) => setConflict({ ...conflict, serves_mining_companies: v })}
              />
              <YesNoField
                label="Do you trade in minerals?"
                value={conflict.trades_minerals}
                onChange={(v) => setConflict({ ...conflict, trades_minerals: v })}
              />
              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Relationships to disclose
                </label>
                <Textarea
                  rows={4}
                  placeholder="Describe any relationship that could affect independence, or state that there are none."
                  value={conflict.relationships}
                  onChange={(e) => setConflict({ ...conflict, relationships: e.target.value })}
                />
              </div>
              <label className="flex items-start gap-3 rounded-[14px] border border-border px-4 py-3">
                <Checkbox
                  className="mt-0.5"
                  checked={conflict.agreed}
                  onCheckedChange={(c) => setConflict({ ...conflict, agreed: Boolean(c) })}
                />
                <span className="text-sm">
                  I agree to disclose any conflict of interest to Beldium without delay.
                </span>
              </label>
            </div>
          )}

          {step === 8 && (
            <div className="space-y-3">
              {DECLARATION_ITEMS.map((d) => (
                <label
                  key={d.key}
                  className="flex items-start gap-3 rounded-[14px] border border-border px-4 py-3"
                >
                  <Checkbox
                    className="mt-0.5"
                    checked={declarations[d.key]}
                    onCheckedChange={(c) =>
                      setDeclarations({ ...declarations, [d.key]: Boolean(c) })
                    }
                  />
                  <span>
                    <span className="block text-sm font-medium">{d.label}</span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">{d.detail}</span>
                  </span>
                </label>
              ))}
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField
                  name="signatory_name"
                  label="Signatory Name"
                  value={signatory.signatory_name}
                  onChange={(v) => setSignatory({ ...signatory, signatory_name: v })}
                />
                <TextField
                  name="signatory_position"
                  label="Signatory Position"
                  value={signatory.signatory_position}
                  onChange={(v) => setSignatory({ ...signatory, signatory_position: v })}
                />
              </div>
            </div>
          )}

          {step === 9 && (
            <div className="space-y-4">
              <SectionCard
                title="Organisation"
                action={
                  <Button variant="ghost" size="sm" onClick={() => setStep(0)}>
                    Edit section
                  </Button>
                }
              >
                <div className="space-y-1">
                  <InfoRow
                    label="Legal name"
                    value={application?.organisation_profile?.name || "-"}
                  />
                  <InfoRow
                    label="RC / CAC"
                    value={application?.organisation_profile?.registration_number || "-"}
                  />
                  <InfoRow
                    label="TIN"
                    value={application?.organisation_profile?.tax_identifier || "-"}
                  />
                  <InfoRow
                    label="Year established"
                    value={application?.organisation_profile?.year_established ?? "-"}
                  />
                  <InfoRow
                    label="Registered address"
                    value={application?.organisation_profile?.registered_address || "-"}
                  />
                  <InfoRow
                    label="State / LGA"
                    value={`${application?.organisation_profile?.state ?? "-"} · ${application?.organisation_profile?.lga ?? "-"}`}
                  />
                </div>
              </SectionCard>

              <SectionCard
                title="Representative"
                action={
                  <Button variant="ghost" size="sm" onClick={() => setStep(1)}>
                    Edit section
                  </Button>
                }
              >
                <div className="space-y-1">
                  <InfoRow label="Name" value={application?.representative?.full_name || "-"} />
                  <InfoRow label="Position" value={application?.representative?.position || "-"} />
                  <InfoRow
                    label="Email"
                    value={application?.representative?.official_email || "-"}
                  />
                  <InfoRow
                    label="Phone"
                    value={application?.representative?.official_phone || "-"}
                  />
                </div>
              </SectionCard>

              <SectionCard
                title="Compliance services"
                action={
                  <Button variant="ghost" size="sm" onClick={() => setStep(2)}>
                    Edit section
                  </Button>
                }
              >
                <div className="space-y-1">
                  <InfoRow
                    label="Services"
                    value={application?.services?.selected_services?.join(", ") || "-"}
                  />
                  <InfoRow
                    label="Coverage"
                    value={
                      application?.services?.geographic_coverage === "selected_states"
                        ? application.services.states_covered?.join(", ") || "-"
                        : "Nationwide"
                    }
                  />
                </div>
              </SectionCard>

              <SectionCard
                title={`Documents (${progress?.documents.submitted ?? 0}/${progress?.documents.required ?? 0})`}
                action={
                  <Button variant="ghost" size="sm" onClick={() => setStep(5)}>
                    Edit section
                  </Button>
                }
              >
                <div className="space-y-1">
                  {outstandingDocuments.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      All required documents uploaded.
                    </p>
                  ) : (
                    outstandingDocuments.map((r) => (
                      <InfoRow
                        key={r.document_type}
                        label={r.title}
                        value={DOCUMENT_STATUS_LABELS[r.status]}
                      />
                    ))
                  )}
                </div>
              </SectionCard>

              <SectionCard
                title={`Personnel (${application?.personnel.length ?? 0})`}
                action={
                  <Button variant="ghost" size="sm" onClick={() => setStep(6)}>
                    Edit section
                  </Button>
                }
              >
                <div className="space-y-1">
                  {(application?.personnel ?? []).length === 0 && (
                    <p className="text-sm text-muted-foreground">No personnel registered.</p>
                  )}
                  {(application?.personnel ?? []).map((p) => (
                    <InfoRow key={p.id} label={p.full_name} value={p.role} />
                  ))}
                </div>
              </SectionCard>

              <SectionCard
                title="Declarations"
                action={
                  <Button variant="ghost" size="sm" onClick={() => setStep(8)}>
                    Edit section
                  </Button>
                }
              >
                <div className="space-y-1">
                  {DECLARATION_ITEMS.map((d) => (
                    <InfoRow
                      key={d.key}
                      label={d.label}
                      value={declarations[d.key] ? "Accepted" : "Outstanding"}
                    />
                  ))}
                </div>
              </SectionCard>
            </div>
          )}
        </div>

        <div className="mt-7 flex flex-wrap gap-3">
          {step < steps.length - 1 ? (
            <Button size="lg" disabled={saving} onClick={() => void advance()}>
              {saving ? "Saving…" : "Save and continue"}
            </Button>
          ) : (
            <Button
              size="lg"
              disabled={submit.isPending || blockedReason !== null}
              title={blockedReason ?? undefined}
              onClick={() => void onSubmit()}
            >
              <Check className="mr-1 size-4" />{" "}
              {submit.isPending ? "Submitting…" : "Submit application"}
            </Button>
          )}
          {step > 0 && (
            <Button size="lg" variant="ghost" onClick={() => setStep(step - 1)}>
              Back
            </Button>
          )}
        </div>
        {step === steps.length - 1 && progress && progress.percent !== 100 && (
          <p className="mt-3 text-xs text-muted-foreground">
            You can submit now with{" "}
            {Object.entries(progress.sections)
              .filter(([, done]) => !done)
              .map(([name]) => name.replaceAll("_", " "))
              .join(", ")}{" "}
            still outstanding. The reviewer will see what is missing and can request it. Approval
            needs a complete application, so anything left now will be asked for later.
          </p>
        )}
      </FieldErrorProvider>
    </AuthShell>
  );
}
