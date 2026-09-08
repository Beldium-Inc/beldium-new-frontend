import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Check, Trash2 } from "lucide-react";
import { AuthShell, InfoRow, ProgressHeader, StepBar } from "@/components/onboarding/ui";
import { AreaField, ChipToggleGroup, SectionCard, SelectField, TextField, YesNoField } from "@/components/onboarding/fields";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  independenceQuestions,
  nigerianStates,
  professionOptions,
  professionalDeclarationItems,
  professionalDocumentCatalogue,
  reviewCapabilityOptions,
} from "@/lib/onboarding/data";
import { useOnboarding } from "@/lib/onboarding/store";

const steps = [
  "Personal Details",
  "Professional Profile",
  "Qualifications & Certifications",
  "Review Expertise",
  "Mineral Specialisation",
  "Field Inspection Capability",
  "Supporting Documents",
  "Independence & Declaration",
];

const idTypes = ["National Identification Number (NIN)", "International Passport", "Driver's Licence", "Voter's Card"];
const employmentStatuses = ["Self-employed / Independent", "Employed", "Consultant", "Retired professional"];

export function ProfessionalApplicationFlow() {
  const { professional, updateProfessional, documents, addDocument, removeDocument, submitApplication } = useOnboarding();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [docDraft, setDocDraft] = useState({ category: professionalDocumentCatalogue[0]!, name: "", reference: "", issued: "", expiry: "" });

  const toggle = (list: string[], value: string) => (list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  const setIndependence = (key: string, value: boolean) =>
    updateProfessional({ independence: { ...professional.independence, [key]: value } });
  const setDecl = (key: string, value: boolean) =>
    updateProfessional({ declarations: { ...professional.declarations, [key]: value } });

  const needsDisclosure = independenceQuestions.some((q) => professional.independence[q.key] === true);
  const allAnswered = independenceQuestions.every((q) => typeof professional.independence[q.key] === "boolean");
  const allDeclared = professionalDeclarationItems.every((d) => professional.declarations[d.key]);
  const canSubmit = allAnswered && allDeclared && (!needsDisclosure || professional.independenceDisclosure.trim().length > 0);

  const submit = () => {
    submitApplication();
    navigate({ to: "/onboarding/submitted" });
  };

  return (
    <AuthShell
      eyebrow={`Professional Application · Step ${step + 1} of ${steps.length}`}
      title={steps[step] ?? ""}
      description="Beldium assigns approved compliance professionals to independently review and verify miner submissions. Register your credentials and the review work you are qualified to perform."
      width="lg"
    >
      <ProgressHeader
        step={step + 1}
        total={steps.length}
        onBack={() => (step === 0 ? navigate({ to: "/onboarding/verify" }) : setStep(step - 1))}
      />
      <StepBar steps={steps} current={step} />

      <div className="mt-7 space-y-5">
        {step === 0 && (
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="Full Name" value={professional.fullName} onChange={(v) => updateProfessional({ fullName: v })} />
            <TextField label="Phone Number" value={professional.phone} onChange={(v) => updateProfessional({ phone: v })} />
            <TextField label="Email Address" type="email" value={professional.email} onChange={(v) => updateProfessional({ email: v })} />
            <TextField label="Residential / Professional Address" value={professional.address} onChange={(v) => updateProfessional({ address: v })} />
            <SelectField label="State" value={professional.state} onChange={(v) => updateProfessional({ state: v })} options={nigerianStates} />
            <TextField label="Country" value={professional.country} onChange={(v) => updateProfessional({ country: v })} />
            <SelectField label="Government ID Type" value={professional.idType} onChange={(v) => updateProfessional({ idType: v })} options={idTypes} />
            <TextField label="Government ID Number" value={professional.idNumber} onChange={(v) => updateProfessional({ idNumber: v })} />
          </div>
        )}

        {step === 1 && (
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="Job Title" value={professional.jobTitle} onChange={(v) => updateProfessional({ jobTitle: v })} />
            <SelectField label="Profession / Discipline" value={professional.profession} onChange={(v) => updateProfessional({ profession: v })} options={professionOptions} />
            <SelectField label="Current Employment Status" value={professional.employmentStatus} onChange={(v) => updateProfessional({ employmentStatus: v })} options={employmentStatuses} />
            <TextField label="Years of Mining Industry Experience" value={professional.yearsMining} onChange={(v) => updateProfessional({ yearsMining: v })} />
            <TextField label="Years of Compliance / Inspection Experience" value={professional.yearsCompliance} onChange={(v) => updateProfessional({ yearsCompliance: v })} />
            <AreaField label="Professional Summary" rows={5} value={professional.summary} onChange={(v) => updateProfessional({ summary: v })} className="sm:col-span-2" />
          </div>
        )}

        {step === 2 && (
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="Highest Qualification" value={professional.highestQualification} onChange={(v) => updateProfessional({ highestQualification: v })} />
            <TextField label="Institution" value={professional.institution} onChange={(v) => updateProfessional({ institution: v })} />
            <TextField label="Field of Study" value={professional.fieldOfStudy} onChange={(v) => updateProfessional({ fieldOfStudy: v })} />
            <TextField label="Professional Registration Number" value={professional.registrationNumber} onChange={(v) => updateProfessional({ registrationNumber: v })} />
            <AreaField label="Professional Certifications" value={professional.certifications} onChange={(v) => updateProfessional({ certifications: v })} className="sm:col-span-2" />
            <AreaField label="Professional Memberships" value={professional.memberships} onChange={(v) => updateProfessional({ memberships: v })} className="sm:col-span-2" />
            <TextField label="Issue Date" type="date" value={professional.issueDate} onChange={(v) => updateProfessional({ issueDate: v })} />
            <TextField label="Expiry Date (where applicable)" type="date" value={professional.expiryDate} onChange={(v) => updateProfessional({ expiryDate: v })} />
          </div>
        )}

        {step === 3 && (
          <ChipToggleGroup
            label="Mining Compliance Review Expertise"
            hint="Select exactly what miner submissions you are qualified to review. Beldium uses these approved capabilities when assigning miner applications."
            options={reviewCapabilityOptions}
            selected={professional.reviewCapabilities}
            onToggle={(v) => updateProfessional({ reviewCapabilities: toggle(professional.reviewCapabilities, v) })}
          />
        )}

        {step === 4 && (
          <div className="space-y-5">
            <div className="rounded-[14px] border border-brand/30 bg-brand-soft/40 px-4 py-3 text-sm">
              Mineral specialisation: <span className="font-semibold">Lithium</span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField label="Years of Lithium / Hard Rock Mining Experience" value={professional.lithiumYears} onChange={(v) => updateProfessional({ lithiumYears: v })} />
              <TextField label="Lithium Mining Review Experience" value={professional.lithiumReviewExperience} onChange={(v) => updateProfessional({ lithiumReviewExperience: v })} />
              <TextField label="Lithium Mine Inspection Experience" value={professional.lithiumInspectionExperience} onChange={(v) => updateProfessional({ lithiumInspectionExperience: v })} />
            </div>
            <AreaField label="Relevant Lithium Projects or Assignments" rows={4} value={professional.lithiumProjects} onChange={(v) => updateProfessional({ lithiumProjects: v })} />
          </div>
        )}

        {step === 5 && (
          <div className="space-y-5">
            <ChipToggleGroup
              label="States Covered"
              options={nigerianStates}
              selected={professional.statesCovered}
              onToggle={(v) => updateProfessional({ statesCovered: toggle(professional.statesCovered, v) })}
            />
            <div className="space-y-2">
              <YesNoField label="Available for physical mine site inspection" value={professional.availableForInspection} onChange={(v) => updateProfessional({ availableForInspection: v })} />
              <YesNoField label="Can capture GPS evidence" value={professional.canCaptureGps} onChange={(v) => updateProfessional({ canCaptureGps: v })} />
              <YesNoField label="Can capture timestamped photos" value={professional.canCapturePhotos} onChange={(v) => updateProfessional({ canCapturePhotos: v })} />
              <YesNoField label="Can capture video evidence" value={professional.canCaptureVideo} onChange={(v) => updateProfessional({ canCaptureVideo: v })} />
              <YesNoField label="Can verify mine coordinates" value={professional.canVerifyCoordinates} onChange={(v) => updateProfessional({ canVerifyCoordinates: v })} />
              <YesNoField label="Can review site documents" value={professional.canReviewSiteDocuments} onChange={(v) => updateProfessional({ canReviewSiteDocuments: v })} />
              <YesNoField label="Sampling experience" value={professional.samplingExperience} onChange={(v) => updateProfessional({ samplingExperience: v })} />
              <YesNoField label="Can submit digital inspection reports" value={professional.canSubmitDigitalReports} onChange={(v) => updateProfessional({ canSubmitDigitalReports: v })} />
            </div>
            <TextField label="Mobilisation Time" placeholder="e.g. 3 working days" value={professional.mobilisationTime} onChange={(v) => updateProfessional({ mobilisationTime: v })} />
          </div>
        )}

        {step === 6 && (
          <div className="space-y-5">
            <SectionCard title="Attach a supporting document">
              <div className="grid gap-4 sm:grid-cols-2">
                <SelectField label="Document type" value={docDraft.category} onChange={(v) => setDocDraft({ ...docDraft, category: v })} options={professionalDocumentCatalogue} />
                <TextField label="File name" placeholder="cv.pdf" value={docDraft.name} onChange={(v) => setDocDraft({ ...docDraft, name: v })} />
                <TextField label="Reference" value={docDraft.reference} onChange={(v) => setDocDraft({ ...docDraft, reference: v })} />
                <TextField label="Issued" type="date" value={docDraft.issued} onChange={(v) => setDocDraft({ ...docDraft, issued: v })} />
                <TextField label="Expiry" type="date" value={docDraft.expiry} onChange={(v) => setDocDraft({ ...docDraft, expiry: v })} />
              </div>
              <Button
                className="mt-4"
                disabled={!docDraft.name.trim()}
                onClick={() => {
                  addDocument(docDraft);
                  setDocDraft({ category: professionalDocumentCatalogue[0]!, name: "", reference: "", issued: "", expiry: "" });
                }}
              >
                Attach document
              </Button>
            </SectionCard>
            <div className="space-y-2">
              {documents.length === 0 && <p className="text-sm text-muted-foreground">No documents attached yet.</p>}
              {documents.map((d) => (
                <div key={d.id} className="flex items-center justify-between gap-3 rounded-[14px] border border-border px-4 py-3">
                  <div>
                    <p className="text-sm font-medium">{d.category}</p>
                    <p className="text-xs text-muted-foreground">{d.name}</p>
                  </div>
                  <Button variant="ghost" size="icon" aria-label="Remove document" onClick={() => removeDocument(d.id)}>
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 7 && (
          <div className="space-y-6">
            <div className="space-y-2">
              {independenceQuestions.map((q) => (
                <YesNoField
                  key={q.key}
                  label={q.label}
                  value={professional.independence[q.key] ?? null}
                  onChange={(v) => setIndependence(q.key, v)}
                />
              ))}
            </div>
            {needsDisclosure && (
              <AreaField
                label="Disclosure (required)"
                rows={4}
                placeholder="Describe the interest or relationship and how independence will be maintained."
                value={professional.independenceDisclosure}
                onChange={(v) => updateProfessional({ independenceDisclosure: v })}
              />
            )}

            <div className="space-y-2">
              {professionalDeclarationItems.map((d) => (
                <label key={d.key} className="flex items-start gap-3 rounded-[14px] border border-border px-4 py-3">
                  <Checkbox className="mt-0.5" checked={Boolean(professional.declarations[d.key])} onCheckedChange={(c) => setDecl(d.key, Boolean(c))} />
                  <span className="text-sm">{d.label}</span>
                </label>
              ))}
            </div>

            <SectionCard title="Review application" action={<Button variant="ghost" size="sm" onClick={() => setStep(0)}>Edit from start</Button>}>
              <div className="space-y-1">
                <InfoRow label="Full name" value={professional.fullName || "—"} />
                <InfoRow label="Email" value={professional.email || "—"} />
                <InfoRow label="Profession" value={professional.profession} />
                <InfoRow label="Mining experience" value={professional.yearsMining ? `${professional.yearsMining} yrs` : "—"} />
                <InfoRow label="Compliance experience" value={professional.yearsCompliance ? `${professional.yearsCompliance} yrs` : "—"} />
                <InfoRow label="Review expertise" value={professional.reviewCapabilities.join(", ") || "—"} />
                <InfoRow label="States covered" value={professional.statesCovered.join(", ") || "—"} />
                <InfoRow label="Site inspection" value={professional.availableForInspection ? "Available" : "Not available"} />
                <InfoRow label="Documents" value={`${documents.length} attached`} />
              </div>
            </SectionCard>
          </div>
        )}
      </div>

      <div className="mt-7 flex flex-wrap gap-3">
        {step < steps.length - 1 ? (
          <Button size="lg" onClick={() => setStep(step + 1)}>
            Continue
          </Button>
        ) : (
          <Button size="lg" disabled={!canSubmit} onClick={submit}>
            <Check className="mr-1 size-4" /> Submit application
          </Button>
        )}
        {step > 0 && (
          <Button size="lg" variant="ghost" onClick={() => setStep(step - 1)}>
            Back
          </Button>
        )}
      </div>
      {step === steps.length - 1 && !canSubmit && (
        <p className="mt-3 text-xs text-muted-foreground">Answer all independence questions, provide any required disclosure and accept every confirmation to submit.</p>
      )}
    </AuthShell>
  );
}
