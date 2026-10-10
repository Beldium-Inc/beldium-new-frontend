import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Check, Search, Upload } from "lucide-react";
import { toast } from "sonner";
import { AuthShell, OptionCard, ProgressHeader, StepBar } from "@/components/onboarding/ui";
import {
  AreaField,
  ChipToggleGroup,
  FieldErrorProvider,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ApiError,
  ORGANISATION_TYPE_LABELS,
  submitQualityProfessionalApplication,
  useCreateJoinRequest,
  useOrganisationDirectory,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";
import {
  qualityMineralOptions,
  qualityOfficerCapabilityOptions,
  qualityOfficerDocumentCatalogue,
} from "@/lib/onboarding/quality";
import { useOnboarding } from "@/lib/onboarding/store";

const ROLE_TITLE = "Quality & Control Officer / Inspector";

const steps = [
  "Find / Join Organisation",
  "Personal Details",
  "Qualifications",
  "Certifications",
  "Sampling / Inspection Capability",
  "Experience",
  "Documents",
  "Declaration",
];

const stepDescriptions = [
  "Request membership of the Q&C organisation you work for.",
  "Your identity as it appears on official documents.",
  "Academic and professional qualifications relevant to quality and control work.",
  "Professional certifications, licences or accreditations you currently hold.",
  "What you are competent to do in the field.",
  "Relevant professional history.",
  "Upload supporting evidence.",
  "Confirm the accuracy of your application and consent to verification.",
];

const blankQualification = { qualification: "", institution: "", year: "" };
const blankCertification = { name: "", certificate_number: "", expiry: "" };

const toggle = (list: string[], value: string) =>
  list.includes(value) ? list.filter((v) => v !== value) : [...list, value];

export function QualityProfessionalApplicationFlow() {
  const navigate = useNavigate();
  const { account } = useOnboarding();
  const { status: authStatus } = useAuth();
  const signedIn = authStatus === "authenticated";

  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [organisationId, setOrganisationId] = useState<string | null>(null);
  const [personal, setPersonal] = useState({
    full_legal_name: account.fullName,
    date_of_birth: "",
    national_id: "",
    job_title: account.jobTitle,
    base_city: "",
  });
  const [qualifications, setQualifications] = useState([blankQualification]);
  const [certifications, setCertifications] = useState([blankCertification]);
  const [capability, setCapability] = useState({
    capabilities: [] as string[],
    minerals: [] as string[],
  });
  const [experience, setExperience] = useState({
    years_experience: "",
    previous_employer: "",
    summary: "",
  });
  /** Held here until submission: there is no record to attach a file to before then. */
  const [files, setFiles] = useState<Record<string, File>>({});
  const [declaration, setDeclaration] = useState(emptyQualityDeclaration);

  // The register is searched server-side; wait for a pause in typing.
  useEffect(() => {
    const timer = setTimeout(() => setSearch(query.trim()), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const directory = useOrganisationDirectory({ search, page_size: 25 }, { enabled: signedIn });
  const createJoinRequest = useCreateJoinRequest();
  const organisations = directory.data?.results ?? [];

  const clearFieldError = useCallback((name: string) => {
    setFieldErrors((current) => {
      if (!(name in current)) return current;
      const next = { ...current };
      delete next[name];
      return next;
    });
  }, []);

  /** What this step is missing, by field name; empty when it can move on. */
  const validateStep = (): Record<string, string> => {
    const errors: Record<string, string> = {};
    const need = (name: string, value: string) => {
      if (!value.trim()) errors[name] = "This field is required.";
    };
    switch (step) {
      case 0:
        if (!organisationId) errors["organisation"] = "Select the organisation you work for.";
        break;
      case 1:
        need("full_legal_name", personal.full_legal_name);
        need("date_of_birth", personal.date_of_birth);
        need("national_id", personal.national_id);
        need("job_title", personal.job_title);
        break;
      case 4:
        if (!capability.capabilities.length)
          errors["capabilities"] = "Select at least one capability.";
        if (!capability.minerals.length)
          errors["minerals"] = "Select at least one mineral or material.";
        break;
      case 5: {
        const years = Number(experience.years_experience);
        if (!experience.years_experience.trim() || !Number.isInteger(years) || years < 0)
          errors["years_experience"] = "Enter a whole number.";
        need("summary", experience.summary);
        break;
      }
      case 6:
        for (const item of qualityOfficerDocumentCatalogue)
          if (item.required && !files[item.type]) errors[item.type] = "This document is required.";
        break;
      case 7:
        Object.assign(errors, validateQualityDeclaration(declaration));
        break;
    }
    return errors;
  };

  const stepIsValid = (): boolean => {
    const missing = validateStep();
    setFieldErrors(missing);
    if (Object.keys(missing).length === 0) return true;
    toast.error("Some entries need attention: see the highlighted fields.");
    return false;
  };

  const onSubmit = async () => {
    if (!stepIsValid() || !organisationId) return;
    setSubmitting(true);
    try {
      const application = await submitQualityProfessionalApplication(
        {
          organisation: organisationId,
          role: "officer_inspector",
          personal: {
            full_legal_name: personal.full_legal_name.trim(),
            date_of_birth: personal.date_of_birth,
            national_id: personal.national_id.trim(),
            job_title: personal.job_title.trim(),
            base_city: personal.base_city.trim(),
          },
          qualifications: filledRows(qualifications),
          certifications: filledRows(certifications),
          capability,
          experience: {
            years_experience: Number(experience.years_experience),
            previous_employer: experience.previous_employer.trim(),
            summary: experience.summary.trim(),
          },
          declaration: { ...declaration, signature: declaration.signature.trim() },
        },
        files,
      );

      // The membership request goes to the organisation's administrator, who
      // answers it separately from Beldium's review. The application is already
      // in by this point, so a refused request (one is already pending, say) is
      // reported without undoing it.
      try {
        await createJoinRequest.mutateAsync({
          organisation: organisationId,
          requested_role: "inspector",
          justification: `${ROLE_TITLE} application ${application.reference}: ${personal.job_title.trim()}.`,
        });
      } catch (error) {
        toast.warning(
          error instanceof ApiError
            ? `Application submitted, but the membership request was not sent: ${error.message}`
            : "Application submitted, but the membership request was not sent.",
        );
      }
      navigate({ to: "/onboarding/submitted", search: { reference: application.reference } });
    } catch (error) {
      // The API names a nested field by its path (`personal.job_title`); the
      // inputs here are named by the last part alone.
      const reported = reportError(error, "The application could not be submitted.");
      setFieldErrors(
        Object.fromEntries(
          Object.entries(reported).map(([path, message]) => [
            path.split(".").pop() ?? path,
            message,
          ]),
        ),
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!signedIn) {
    return (
      <AuthShell
        eyebrow="Professional Application"
        title={ROLE_TITLE}
        description="Verify your email address first: searching the Beldium register and applying both need a signed-in account."
      >
        <div className="flex flex-wrap gap-3">
          <Button size="lg" onClick={() => navigate({ to: "/onboarding/verify" })}>
            {authStatus === "loading" ? "Checking your session…" : "Verify your email"}
          </Button>
          <Button size="lg" variant="ghost" onClick={() => navigate({ to: "/signin" })}>
            Sign in
          </Button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      eyebrow={`Professional Application · ${ROLE_TITLE} · Step ${step + 1} of ${steps.length}`}
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
            <div>
              <div className="space-y-2">
                <Label htmlFor="orgsearch">Search organisation</Label>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="orgsearch"
                    className="pl-9"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Name, city or type"
                  />
                </div>
              </div>

              <div className="mt-4 space-y-3">
                {directory.isPending && (
                  <div className="rounded-[18px] border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                    Loading the register…
                  </div>
                )}
                {directory.isError && (
                  <div className="rounded-[18px] border border-dashed border-danger/50 p-6 text-center text-sm text-danger">
                    {directory.error instanceof ApiError
                      ? directory.error.message
                      : "The register could not be loaded."}
                  </div>
                )}
                {organisations.map((organisation) => (
                  <OptionCard
                    key={organisation.id}
                    active={organisationId === organisation.id}
                    title={organisation.name}
                    description={[
                      ORGANISATION_TYPE_LABELS[organisation.organisation_type],
                      [organisation.state, organisation.country].filter(Boolean).join(", "),
                      organisation.verification_status.replaceAll("_", " "),
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                    onClick={() => {
                      clearFieldError("organisation");
                      setOrganisationId(organisation.id);
                    }}
                  />
                ))}
                {directory.isSuccess && organisations.length === 0 && (
                  <div className="rounded-[18px] border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                    {search
                      ? "No verified organisation matches that search."
                      : "No verified organisations yet."}
                  </div>
                )}
              </div>
              <FieldNote error={fieldErrors["organisation"]} />
              <p className="mt-4 text-xs text-muted-foreground">
                Your membership request is sent to the organisation administrator alongside this
                application.
              </p>
            </div>
          )}

          {step === 1 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                name="full_legal_name"
                label={required("Full legal name")}
                value={personal.full_legal_name}
                onChange={(v) => setPersonal({ ...personal, full_legal_name: v })}
                className="sm:col-span-2"
              />
              <TextField
                name="date_of_birth"
                label={required("Date of birth")}
                type="date"
                value={personal.date_of_birth}
                onChange={(v) => setPersonal({ ...personal, date_of_birth: v })}
              />
              <TextField
                name="national_id"
                label={required("National ID (NIN)")}
                value={personal.national_id}
                onChange={(v) => setPersonal({ ...personal, national_id: v })}
              />
              <TextField
                name="job_title"
                label={required("Job title")}
                value={personal.job_title}
                onChange={(v) => setPersonal({ ...personal, job_title: v })}
              />
              <TextField
                name="base_city"
                label="Base city"
                value={personal.base_city}
                onChange={(v) => setPersonal({ ...personal, base_city: v })}
              />
            </div>
          )}

          {step === 2 && (
            <RowsField
              label="Qualifications"
              columns={[
                { key: "qualification", label: "Qualification" },
                { key: "institution", label: "Institution" },
                { key: "year", label: "Year" },
              ]}
              rows={qualifications}
              onChange={setQualifications}
              addLabel="Add qualification"
            />
          )}

          {step === 3 && (
            <RowsField
              label="Certifications"
              columns={[
                { key: "name", label: "Certification", placeholder: "ISO 17025 Internal Auditor" },
                {
                  key: "certificate_number",
                  label: "Certificate number",
                  placeholder: "CERT-88213",
                },
                { key: "expiry", label: "Expiry date", type: "date" },
              ]}
              rows={certifications}
              onChange={setCertifications}
              addLabel="Add certification"
            />
          )}

          {step === 4 && (
            <div className="space-y-6">
              <div>
                <ChipToggleGroup
                  label={required("Capabilities")}
                  options={qualityOfficerCapabilityOptions}
                  selected={capability.capabilities}
                  onToggle={(v) => {
                    clearFieldError("capabilities");
                    setCapability({
                      ...capability,
                      capabilities: toggle(capability.capabilities, v),
                    });
                  }}
                />
                <FieldNote error={fieldErrors["capabilities"]} />
              </div>
              <div>
                <ChipToggleGroup
                  label={required("Minerals / materials")}
                  options={qualityMineralOptions}
                  selected={capability.minerals}
                  onToggle={(v) => {
                    clearFieldError("minerals");
                    setCapability({ ...capability, minerals: toggle(capability.minerals, v) });
                  }}
                />
                <FieldNote error={fieldErrors["minerals"]} />
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                name="years_experience"
                label={required("Years of experience")}
                type="number"
                value={experience.years_experience}
                onChange={(v) => setExperience({ ...experience, years_experience: v })}
              />
              <TextField
                name="previous_employer"
                label="Previous employer"
                value={experience.previous_employer}
                onChange={(v) => setExperience({ ...experience, previous_employer: v })}
              />
              <AreaField
                name="summary"
                label={required("Experience summary")}
                rows={4}
                value={experience.summary}
                onChange={(v) => setExperience({ ...experience, summary: v })}
                className="sm:col-span-2"
              />
            </div>
          )}

          {step === 6 && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">{DOCUMENT_STATUS_NOTE}</p>
              {qualityOfficerDocumentCatalogue.map((item) => {
                const file = files[item.type];
                return (
                  <div key={item.type}>
                    <DocumentRow
                      title={item.title}
                      required={item.required}
                      detail={
                        file
                          ? `${file.name} · ${Math.max(1, Math.round(file.size / 1024))} KB · Uploaded`
                          : DOCUMENT_HINT
                      }
                    >
                      {file && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setFiles((current) => {
                              const next = { ...current };
                              delete next[item.type];
                              return next;
                            })
                          }
                        >
                          Remove
                        </Button>
                      )}
                      <label>
                        <input
                          type="file"
                          className="hidden"
                          accept={DOCUMENT_ACCEPT}
                          onChange={(event) => {
                            const picked = event.target.files?.[0];
                            event.target.value = "";
                            if (!picked) return;
                            if (picked.size > 10 * 1024 * 1024) {
                              toast.error("File too large; the maximum size is 10 MB.");
                              return;
                            }
                            clearFieldError(item.type);
                            setFiles((current) => ({ ...current, [item.type]: picked }));
                          }}
                        />
                        <span className="inline-flex cursor-pointer items-center gap-1.5 rounded-[10px] border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted">
                          <Upload className="size-3.5" />
                          {file ? "Replace" : "Upload"}
                        </span>
                      </label>
                    </DocumentRow>
                    <FieldNote error={fieldErrors[item.type]} />
                  </div>
                );
              })}
            </div>
          )}

          {step === 7 && (
            <QualityDeclarationFields
              value={declaration}
              onChange={(value) => {
                clearFieldError("declaration");
                setDeclaration(value);
              }}
              error={fieldErrors["declaration"]}
            />
          )}
        </div>

        <div className="mt-7 flex flex-wrap gap-3">
          {step < steps.length - 1 ? (
            <Button
              size="lg"
              onClick={() => {
                if (stepIsValid()) setStep(step + 1);
              }}
            >
              Continue
            </Button>
          ) : (
            <Button size="lg" disabled={submitting} onClick={() => void onSubmit()}>
              <Check className="mr-1 size-4" /> {submitting ? "Submitting…" : "Submit application"}
            </Button>
          )}
          {step > 0 && (
            <Button size="lg" variant="ghost" onClick={() => setStep(step - 1)}>
              Back
            </Button>
          )}
        </div>
      </FieldErrorProvider>
    </AuthShell>
  );
}
