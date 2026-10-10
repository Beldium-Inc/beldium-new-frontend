import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Check, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { AuthShell, InfoRow, ProgressHeader, StepBar } from "@/components/onboarding/ui";
import {
  AreaField,
  ChipToggleGroup,
  FieldErrorProvider,
  SectionCard,
  SelectField,
  TextField,
} from "@/components/onboarding/fields";
import { reportError } from "@/components/onboarding/OrgApplicationFlow";
import {
  DOCUMENT_ACCEPT,
  DOCUMENT_HINT,
  DOCUMENT_STATUS_NOTE,
  DocumentRow,
  FieldNote,
  QualityDeclarationFields,
  RowsField,
  emptyQualityDeclaration,
  filledRows,
  required,
  validateQualityDeclaration,
} from "@/components/onboarding/quality-parts";
import { Button } from "@/components/ui/button";
import {
  ApiError,
  DOCUMENT_STATUS_LABELS,
  queryKeys,
  saveQualitySection,
  useCreateComplianceApplication,
  useCreateOrganisation,
  useSubmitApplication,
  useUploadDocument,
  type ComplianceApplication,
  type QualitySectionData,
  type QualitySectionSlug,
} from "@/lib/api";
import { useApplicationContext } from "@/lib/onboarding/application";
import {
  SELECT_PLACEHOLDER,
  qualityCapabilityOptions,
  qualityCoverageOptions,
  qualityDocumentCatalogue,
  qualityMineralOptions,
  qualityOrganisationTypes,
  qualitySealingOptions,
  qualityTestingMethodOptions,
} from "@/lib/onboarding/quality";

const steps = [
  "Organisation Details",
  "Services & Testing Capability",
  "Laboratory Details",
  "Accreditation & Scope",
  "Testing Methods",
  "Equipment",
  "Key Personnel",
  "Sampling & Inspection Capability",
  "Documents",
  "Declaration",
  "Review",
];

const stepDescriptions = [
  "Legal identity of the organisation applying to operate on Beldium.",
  "Services you will offer through Beldium and the materials you support.",
  "An organisation can operate multiple laboratories. Each is verified separately.",
  "Accreditation held by your laboratories and the scope it covers.",
  "Methods your laboratories run. Only accredited methods unlock certificate issuance.",
  "Major equipment with calibration status. Calibration certificates are requested under Documents.",
  "Signatories, quality managers and lead analysts.",
  "Field capability for drawing, sealing and inspecting samples.",
  "Upload supporting evidence.",
  "Confirm the accuracy of your application and consent to verification.",
  "Check every section before submitting. You can jump back to edit any step.",
];

const ORG_TYPE_OPTIONS = [SELECT_PLACEHOLDER, ...qualityOrganisationTypes.map((t) => t.label)];
const SEALING_OPTIONS = [SELECT_PLACEHOLDER, ...qualitySealingOptions];

const blankLaboratory = { name: "", location: "", registration_number: "" };
const blankEquipment = { name: "", serial_number: "", calibration_date: "" };
const blankPerson = { full_name: "", role: "", email: "" };

/** The API stores a URL; people type a bare domain. */
function normaliseWebsite(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

const toggle = (list: string[], value: string) =>
  list.includes(value) ? list.filter((v) => v !== value) : [...list, value];

export function QualityOrgApplicationFlow() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  /** Per-field messages, from this form's own checks or a rejected save. */
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const { organisation, application, applicationId, loading } = useApplicationContext();

  const createOrganisation = useCreateOrganisation();
  const createApplication = useCreateComplianceApplication();
  const submit = useSubmitApplication(applicationId);
  const uploadDocument = useUploadDocument(applicationId);

  const [org, setOrg] = useState({
    legal_name: "",
    trading_name: "",
    organisation_type: SELECT_PLACEHOLDER,
    registration_number: "",
    tax_identifier: "",
    registered_address: "",
    country: "",
    website: "",
  });
  const [services, setServices] = useState({
    capabilities: [] as string[],
    minerals: [] as string[],
  });
  const [laboratories, setLaboratories] = useState([blankLaboratory]);
  const [accreditation, setAccreditation] = useState({
    accreditation_body: "",
    accreditation_number: "",
    accreditation_expiry: "",
    standard: "",
    accredited_scope: "",
  });
  const [methods, setMethods] = useState<string[]>([]);
  const [equipment, setEquipment] = useState([blankEquipment]);
  const [personnel, setPersonnel] = useState([blankPerson]);
  const [sampling, setSampling] = useState({
    geographic_coverage: [] as string[],
    field_sampling_teams: "",
    tamper_evident_sealing: SELECT_PLACEHOLDER,
    sampling_procedure_summary: "",
  });
  const [declaration, setDeclaration] = useState(emptyQualityDeclaration);
  const [uploadingType, setUploadingType] = useState<string | null>(null);

  // Rehydrate from whatever the server holds the first time it arrives.
  const [seeded, setSeeded] = useState(false);
  useEffect(() => {
    if (seeded || !application) return;
    const saved = application.quality_profile ?? {};
    if (saved.organisation) {
      setOrg((s) => ({ ...s, ...saved.organisation }));
    } else if (organisation) {
      setOrg((s) => ({
        ...s,
        legal_name: organisation.name || s.legal_name,
        registration_number: organisation.registration_number || s.registration_number,
        tax_identifier: organisation.tax_identifier || s.tax_identifier,
        registered_address: organisation.address || s.registered_address,
        country: organisation.country || s.country,
        website: organisation.website || s.website,
      }));
    }
    if (saved.services) setServices(saved.services);
    if (saved.laboratories?.laboratories.length) setLaboratories(saved.laboratories.laboratories);
    if (saved.accreditation) setAccreditation(saved.accreditation);
    if (saved["testing-methods"]) setMethods(saved["testing-methods"].testing_methods);
    if (saved.equipment?.equipment.length) setEquipment(saved.equipment.equipment);
    if (saved.personnel?.personnel.length) setPersonnel(saved.personnel.personnel);
    if (saved.sampling)
      setSampling({
        ...saved.sampling,
        field_sampling_teams: String(saved.sampling.field_sampling_teams ?? ""),
      });
    if (saved.declaration) setDeclaration(saved.declaration);
    setSeeded(true);
  }, [application, organisation, seeded]);

  const registersAs = () =>
    qualityOrganisationTypes.find((t) => t.label === org.organisation_type)?.registersAs ??
    "compliance_partner";

  /**
   * The first step doubles as the bootstrap: an Organisation and its
   * application have to exist before any section can be written.
   */
  const ensureApplication = async (): Promise<ComplianceApplication> => {
    if (application) return application;
    let organisationId = organisation?.id;
    if (!organisationId) {
      const created = await createOrganisation.mutateAsync({
        name: org.legal_name.trim(),
        organisation_type: registersAs(),
        registration_number: org.registration_number.trim(),
        tax_identifier: org.tax_identifier.trim(),
        website: normaliseWebsite(org.website),
        address: org.registered_address.trim(),
        country: org.country.trim(),
      });
      organisationId = created.id;
    }
    return createApplication.mutateAsync({ organisation: organisationId, sector: "quality" });
  };

  const saveSection = async <S extends QualitySectionSlug>(
    id: string,
    section: S,
    data: QualitySectionData[S],
  ) => {
    const saved = await saveQualitySection(id, section, data);
    queryClient.setQueryData(queryKeys.application(saved.id), saved);
  };

  /** What this step is missing, by field name; empty when it can be saved. */
  const validateStep = (): Record<string, string> => {
    const errors: Record<string, string> = {};
    const need = (name: string, value: string, message = "This field is required.") => {
      if (!value.trim() || value === SELECT_PLACEHOLDER) errors[name] = message;
    };
    switch (step) {
      case 0:
        need("legal_name", org.legal_name);
        need("organisation_type", org.organisation_type, "Select an organisation type.");
        need("registration_number", org.registration_number);
        need("tax_identifier", org.tax_identifier);
        need("registered_address", org.registered_address);
        need("country", org.country);
        break;
      case 1:
        if (!services.capabilities.length)
          errors["capabilities"] = "Select at least one capability.";
        if (!services.minerals.length)
          errors["minerals"] = "Select at least one mineral or material.";
        break;
      case 3:
        need("accreditation_body", accreditation.accreditation_body);
        need("accreditation_number", accreditation.accreditation_number);
        need("accreditation_expiry", accreditation.accreditation_expiry);
        need("accredited_scope", accreditation.accredited_scope);
        break;
      case 4:
        if (!methods.length) errors["testing_methods"] = "Select at least one testing method.";
        break;
      case 7: {
        if (!sampling.geographic_coverage.length)
          errors["geographic_coverage"] = "Select at least one region.";
        const teams = Number(sampling.field_sampling_teams);
        if (!sampling.field_sampling_teams.trim() || !Number.isInteger(teams) || teams < 0)
          errors["field_sampling_teams"] = "Enter a whole number.";
        need("tamper_evident_sealing", sampling.tamper_evident_sealing, "Select a sealing method.");
        break;
      }
      case 9:
        Object.assign(errors, validateQualityDeclaration(declaration));
        break;
    }
    return errors;
  };

  /** Persist the current step, and only advance once it has been accepted. */
  const saveStep = async (): Promise<boolean> => {
    const missing = validateStep();
    if (Object.keys(missing).length) {
      setFieldErrors(missing);
      toast.error("Some entries need attention: see the highlighted fields.");
      return false;
    }
    setFieldErrors({});

    setSaving(true);
    try {
      if (step === 0) {
        const target = await ensureApplication();
        await saveSection(target.id, "quality-organisation", {
          legal_name: org.legal_name.trim(),
          trading_name: org.trading_name.trim(),
          organisation_type: org.organisation_type,
          registration_number: org.registration_number.trim(),
          tax_identifier: org.tax_identifier.trim(),
          registered_address: org.registered_address.trim(),
          country: org.country.trim(),
          website: normaliseWebsite(org.website),
        });
        return true;
      }
      // Documents (8) save as they are uploaded; the review (10) saves nothing.
      if (step === 8 || step === 10) return true;
      if (!applicationId) {
        toast.error("Save the organisation details first.");
        return false;
      }
      switch (step) {
        case 1:
          await saveSection(applicationId, "quality-services", services);
          break;
        case 2:
          await saveSection(applicationId, "quality-laboratories", {
            laboratories: filledRows(laboratories),
          });
          break;
        case 3:
          await saveSection(applicationId, "quality-accreditation", {
            accreditation_body: accreditation.accreditation_body.trim(),
            accreditation_number: accreditation.accreditation_number.trim(),
            accreditation_expiry: accreditation.accreditation_expiry,
            standard: accreditation.standard.trim(),
            accredited_scope: accreditation.accredited_scope.trim(),
          });
          break;
        case 4:
          await saveSection(applicationId, "quality-testing-methods", { testing_methods: methods });
          break;
        case 5:
          await saveSection(applicationId, "quality-equipment", {
            equipment: filledRows(equipment),
          });
          break;
        case 6:
          await saveSection(applicationId, "quality-personnel", {
            personnel: filledRows(personnel),
          });
          break;
        case 7:
          await saveSection(applicationId, "quality-sampling", {
            geographic_coverage: sampling.geographic_coverage,
            field_sampling_teams: Number(sampling.field_sampling_teams),
            tamper_evident_sealing: sampling.tamper_evident_sealing,
            sampling_procedure_summary: sampling.sampling_procedure_summary.trim(),
          });
          break;
        case 9:
          await saveSection(applicationId, "quality-declaration", {
            ...declaration,
            signature: declaration.signature.trim(),
          });
          break;
      }
      return true;
    } catch (error) {
      setFieldErrors(reportError(error, "That section could not be saved."));
      return false;
    } finally {
      setSaving(false);
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

  const onUpload = async (documentType: string, title: string, file: File) => {
    if (!applicationId) {
      toast.error("Save the organisation details first.");
      return;
    }
    setUploadingType(documentType);
    try {
      await uploadDocument.mutateAsync({ document_type: documentType, file, title });
      toast.success(`${title} uploaded.`);
    } catch (error) {
      setFieldErrors(reportError(error, "That file could not be uploaded."));
    } finally {
      setUploadingType(null);
    }
  };

  const documentsByType = useMemo(
    () => new Map((application?.documents ?? []).map((d) => [d.document_type, d])),
    [application?.documents],
  );
  const uploadedCount = qualityDocumentCatalogue.filter((d) => documentsByType.has(d.type)).length;
  const missingRequired = qualityDocumentCatalogue.filter(
    (d) => d.required && !documentsByType.has(d.type),
  );

  const progress = application?.progress;
  const rejectedDocuments = progress?.documents.rejected ?? [];
  const blockedReason = progress?.blocking.includes("account")
    ? "Verify your email address before submitting."
    : rejectedDocuments.length
      ? `Replace the rejected ${rejectedDocuments.length > 1 ? "documents" : "document"} first.`
      : null;

  if (loading) {
    return (
      <AuthShell eyebrow="Organisation Application" title="Loading your application" width="lg">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Fetching what has already been saved…
        </div>
      </AuthShell>
    );
  }

  const editAction = (target: number) => (
    <Button variant="ghost" size="sm" onClick={() => setStep(target)}>
      Edit section
    </Button>
  );
  const rowsSummary = (rows: Record<string, string>[]) =>
    rows.length === 0 ? (
      <p className="text-sm text-muted-foreground">None added.</p>
    ) : (
      rows.map((row, index) => (
        <p key={index} className="text-sm font-medium">
          {Object.values(row).filter(Boolean).join(" · ")}
        </p>
      ))
    );

  return (
    <AuthShell
      eyebrow={`Organisation Application · Step ${step + 1} of ${steps.length}`}
      title={steps[step] ?? ""}
      description={stepDescriptions[step] ?? ""}
      width="lg"
    >
      <FieldErrorProvider errors={fieldErrors} clear={clearFieldError}>
        <ProgressHeader
          step={step + 1}
          total={steps.length}
          onBack={() => (step === 0 ? navigate({ to: "/onboarding/verify" }) : setStep(step - 1))}
        />
        <StepBar steps={steps} current={step} />

        <div className="mt-7 space-y-5">
          {step === 0 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                name="legal_name"
                label={required("Registered legal name")}
                value={org.legal_name}
                onChange={(v) => setOrg({ ...org, legal_name: v })}
                className="sm:col-span-2"
              />
              <TextField
                name="trading_name"
                label="Trading name"
                value={org.trading_name}
                onChange={(v) => setOrg({ ...org, trading_name: v })}
              />
              <SelectField
                name="organisation_type"
                label={required("Organisation type")}
                value={org.organisation_type}
                onChange={(v) => setOrg({ ...org, organisation_type: v })}
                options={ORG_TYPE_OPTIONS}
              />
              <TextField
                name="registration_number"
                label={required("CAC / registration number")}
                placeholder="RC-1234567"
                value={org.registration_number}
                onChange={(v) => setOrg({ ...org, registration_number: v })}
              />
              <TextField
                name="tax_identifier"
                label={required("TIN")}
                placeholder="12345678-0001"
                value={org.tax_identifier}
                onChange={(v) => setOrg({ ...org, tax_identifier: v })}
              />
              <TextField
                name="registered_address"
                label={required("Registered address")}
                value={org.registered_address}
                onChange={(v) => setOrg({ ...org, registered_address: v })}
                className="sm:col-span-2"
              />
              <TextField
                name="country"
                label={required("Country")}
                value={org.country}
                onChange={(v) => setOrg({ ...org, country: v })}
              />
              <TextField
                name="website"
                label="Website"
                value={org.website}
                onChange={(v) => setOrg({ ...org, website: v })}
              />
            </div>
          )}

          {step === 1 && (
            <div className="space-y-6">
              <div>
                <ChipToggleGroup
                  label={required("Capabilities")}
                  options={qualityCapabilityOptions}
                  selected={services.capabilities}
                  onToggle={(v) => {
                    clearFieldError("capabilities");
                    setServices({ ...services, capabilities: toggle(services.capabilities, v) });
                  }}
                />
                <FieldNote error={fieldErrors["capabilities"]} />
              </div>
              <div>
                <ChipToggleGroup
                  label={required("Minerals / materials supported")}
                  options={qualityMineralOptions}
                  selected={services.minerals}
                  onToggle={(v) => {
                    clearFieldError("minerals");
                    setServices({ ...services, minerals: toggle(services.minerals, v) });
                  }}
                />
                <FieldNote error={fieldErrors["minerals"]} />
              </div>
            </div>
          )}

          {step === 2 && (
            <RowsField
              label="Laboratories"
              columns={[
                { key: "name", label: "Laboratory name", placeholder: "Jos Central Laboratory" },
                { key: "location", label: "Location", placeholder: "Jos, Plateau" },
                {
                  key: "registration_number",
                  label: "Laboratory registration number",
                  placeholder: "LAB-NG-0412",
                },
              ]}
              rows={laboratories}
              onChange={setLaboratories}
              addLabel="Add laboratory"
            />
          )}

          {step === 3 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                name="accreditation_body"
                label={required("Accreditation body")}
                placeholder="NiNAS"
                value={accreditation.accreditation_body}
                onChange={(v) => setAccreditation({ ...accreditation, accreditation_body: v })}
              />
              <TextField
                name="accreditation_number"
                label={required("Accreditation number")}
                value={accreditation.accreditation_number}
                onChange={(v) => setAccreditation({ ...accreditation, accreditation_number: v })}
              />
              <TextField
                name="accreditation_expiry"
                label={required("Accreditation expiry")}
                type="date"
                value={accreditation.accreditation_expiry}
                onChange={(v) => setAccreditation({ ...accreditation, accreditation_expiry: v })}
              />
              <TextField
                name="standard"
                label="Standard"
                placeholder="ISO/IEC 17025:2017"
                value={accreditation.standard}
                onChange={(v) => setAccreditation({ ...accreditation, standard: v })}
              />
              <AreaField
                name="accredited_scope"
                label={required("Accredited scope")}
                placeholder="Au by FA-AAS in ores, 0.01–100 g/t..."
                rows={4}
                value={accreditation.accredited_scope}
                onChange={(v) => setAccreditation({ ...accreditation, accredited_scope: v })}
                className="sm:col-span-2"
              />
            </div>
          )}

          {step === 4 && (
            <div>
              <ChipToggleGroup
                label={required("Testing methods")}
                options={qualityTestingMethodOptions}
                selected={methods}
                onToggle={(v) => {
                  clearFieldError("testing_methods");
                  setMethods(toggle(methods, v));
                }}
              />
              <FieldNote error={fieldErrors["testing_methods"]} />
            </div>
          )}

          {step === 5 && (
            <RowsField
              label="Equipment register"
              columns={[
                { key: "name", label: "Equipment", placeholder: "Agilent 5110 ICP-OES" },
                { key: "serial_number", label: "Serial number", placeholder: "MY21480012" },
                { key: "calibration_date", label: "Calibration date", type: "date" },
              ]}
              rows={equipment}
              onChange={setEquipment}
              addLabel="Add equipment"
            />
          )}

          {step === 6 && (
            <RowsField
              label="Key personnel"
              columns={[
                { key: "full_name", label: "Full name", placeholder: "Dr. Ngozi Eze" },
                { key: "role", label: "Role", placeholder: "Quality Manager" },
                { key: "email", label: "Email", placeholder: "ngozi@lab.ng", type: "email" },
              ]}
              rows={personnel}
              onChange={setPersonnel}
              addLabel="Add person"
            />
          )}

          {step === 7 && (
            <div className="space-y-6">
              <div>
                <ChipToggleGroup
                  label={required("Geographic coverage")}
                  options={qualityCoverageOptions}
                  selected={sampling.geographic_coverage}
                  onToggle={(v) => {
                    clearFieldError("geographic_coverage");
                    setSampling({
                      ...sampling,
                      geographic_coverage: toggle(sampling.geographic_coverage, v),
                    });
                  }}
                />
                <FieldNote error={fieldErrors["geographic_coverage"]} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField
                  name="field_sampling_teams"
                  label={required("Number of field sampling teams")}
                  type="number"
                  value={sampling.field_sampling_teams}
                  onChange={(v) => setSampling({ ...sampling, field_sampling_teams: v })}
                />
                <SelectField
                  name="tamper_evident_sealing"
                  label={required("Tamper-evident sealing")}
                  value={sampling.tamper_evident_sealing}
                  onChange={(v) => setSampling({ ...sampling, tamper_evident_sealing: v })}
                  options={SEALING_OPTIONS}
                />
              </div>
              <AreaField
                name="sampling_procedure_summary"
                label="Sampling procedure summary"
                rows={4}
                value={sampling.sampling_procedure_summary}
                onChange={(v) => setSampling({ ...sampling, sampling_procedure_summary: v })}
              />
            </div>
          )}

          {step === 8 && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">{DOCUMENT_STATUS_NOTE}</p>
              {qualityDocumentCatalogue.map((item) => {
                const uploaded = documentsByType.get(item.type);
                return (
                  <DocumentRow
                    key={item.type}
                    title={item.title}
                    required={item.required}
                    detail={
                      uploaded
                        ? [
                            uploaded.original_name,
                            DOCUMENT_STATUS_LABELS[uploaded.status],
                            uploaded.review_notes,
                          ]
                            .filter(Boolean)
                            .join(" · ")
                        : DOCUMENT_HINT
                    }
                  >
                    <label>
                      <input
                        type="file"
                        className="hidden"
                        accept={DOCUMENT_ACCEPT}
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          event.target.value = "";
                          if (file) void onUpload(item.type, item.title, file);
                        }}
                      />
                      <span className="inline-flex cursor-pointer items-center gap-1.5 rounded-[10px] border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted">
                        {uploadingType === item.type ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          <Upload className="size-3.5" />
                        )}
                        {uploaded ? "Replace" : "Upload"}
                      </span>
                    </label>
                  </DocumentRow>
                );
              })}
            </div>
          )}

          {step === 9 && (
            <QualityDeclarationFields
              value={declaration}
              onChange={(value) => {
                clearFieldError("declaration");
                setDeclaration(value);
              }}
              error={fieldErrors["declaration"]}
            />
          )}

          {step === 10 && (
            <div className="space-y-4">
              <SectionCard title="Organisation Details" action={editAction(0)}>
                <div className="space-y-1">
                  <InfoRow label="Registered legal name" value={org.legal_name} />
                  <InfoRow label="Trading name" value={org.trading_name} />
                  <InfoRow
                    label="Organisation type"
                    value={
                      org.organisation_type === SELECT_PLACEHOLDER ? "" : org.organisation_type
                    }
                  />
                  <InfoRow label="CAC / registration number" value={org.registration_number} />
                  <InfoRow label="TIN" value={org.tax_identifier} />
                  <InfoRow label="Registered address" value={org.registered_address} />
                  <InfoRow label="Country" value={org.country} />
                  <InfoRow label="Website" value={org.website} />
                </div>
              </SectionCard>

              <SectionCard title="Services & Testing Capability" action={editAction(1)}>
                <div className="space-y-1">
                  <InfoRow label="Capabilities" value={services.capabilities.join(", ")} />
                  <InfoRow
                    label="Minerals / materials supported"
                    value={services.minerals.join(", ")}
                  />
                </div>
              </SectionCard>

              <SectionCard title="Laboratory Details" action={editAction(2)}>
                {rowsSummary(filledRows(laboratories))}
              </SectionCard>

              <SectionCard title="Accreditation & Scope" action={editAction(3)}>
                <div className="space-y-1">
                  <InfoRow label="Accreditation body" value={accreditation.accreditation_body} />
                  <InfoRow
                    label="Accreditation number"
                    value={accreditation.accreditation_number}
                  />
                  <InfoRow
                    label="Accreditation expiry"
                    value={accreditation.accreditation_expiry}
                  />
                  <InfoRow label="Standard" value={accreditation.standard} />
                  <InfoRow label="Accredited scope" value={accreditation.accredited_scope} />
                </div>
              </SectionCard>

              <SectionCard title="Testing Methods" action={editAction(4)}>
                <InfoRow label="Testing methods" value={methods.join(", ")} />
              </SectionCard>

              <SectionCard title="Equipment" action={editAction(5)}>
                {rowsSummary(filledRows(equipment))}
              </SectionCard>

              <SectionCard title="Key Personnel" action={editAction(6)}>
                {rowsSummary(filledRows(personnel))}
              </SectionCard>

              <SectionCard title="Sampling & Inspection Capability" action={editAction(7)}>
                <div className="space-y-1">
                  <InfoRow
                    label="Geographic coverage"
                    value={sampling.geographic_coverage.join(", ")}
                  />
                  <InfoRow
                    label="Number of field sampling teams"
                    value={sampling.field_sampling_teams}
                  />
                  <InfoRow
                    label="Tamper-evident sealing"
                    value={
                      sampling.tamper_evident_sealing === SELECT_PLACEHOLDER
                        ? ""
                        : sampling.tamper_evident_sealing
                    }
                  />
                  <InfoRow
                    label="Sampling procedure summary"
                    value={sampling.sampling_procedure_summary}
                  />
                </div>
              </SectionCard>

              <SectionCard title="Documents" action={editAction(8)}>
                <div className="space-y-1">
                  <InfoRow label="Documents" value={`${uploadedCount} document(s) uploaded`} />
                  {missingRequired.map((d) => (
                    <InfoRow key={d.type} label={d.title} value="Not submitted" />
                  ))}
                </div>
              </SectionCard>

              <SectionCard title="Declaration" action={editAction(9)}>
                <InfoRow
                  label="Declaration"
                  value={declaration.signature ? `Signed by ${declaration.signature}` : ""}
                />
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
        {step === steps.length - 1 && blockedReason && (
          <p className="mt-3 text-xs text-muted-foreground">{blockedReason}</p>
        )}
      </FieldErrorProvider>
    </AuthShell>
  );
}
