import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Check, Trash2 } from "lucide-react";
import { AuthShell, InfoRow, ProgressHeader, StepBar } from "@/components/onboarding/ui";
import { ChipToggleGroup, SectionCard, SelectField, TextField, YesNoField } from "@/components/onboarding/fields";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  complianceServiceOptions,
  mineralOptions,
  nigerianStates,
  orgCredentialCatalogue,
  orgDeclarationItems,
  personnelRoleOptions,
} from "@/lib/onboarding/data";
import { useOnboarding } from "@/lib/onboarding/store";
import { VERTICAL_BY_SLUG } from "@/lib/verticals";

const steps = [
  "Organisation",
  "Compliance Services",
  "Credentials & Documents",
  "Personnel",
  "Compliance Capability",
  "Declarations",
  "Review",
];

const entityTypes = ["Private Limited Company", "Public Limited Company", "Business Name", "Incorporated Trustees", "Partnership"];

export function OrgApplicationFlow() {
  const {
    sector,
    application,
    updateApplication,
    documents,
    addDocument,
    removeDocument,
    personnel,
    addPersonnel,
    removePersonnel,
    capability,
    updateCapability,
    declarations,
    setDeclaration,
    submitApplication,
  } = useOnboarding();
  const sectorName = sector ? VERTICAL_BY_SLUG[sector].name : "your sector";
  const navigate = useNavigate();
  const [step, setStep] = useState(0);

  const [docDraft, setDocDraft] = useState({ category: orgCredentialCatalogue[0]!, name: "", reference: "", issued: "", expiry: "" });
  const [person, setPerson] = useState({
    name: "",
    position: personnelRoleOptions[0]!,
    email: "",
    phone: "",
    qualification: "",
    registration: "",
    yearsExperience: "",
    cvAttached: false,
    certificatesAttached: false,
  });

  const toggle = (list: string[], value: string) => (list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  const allDeclared = orgDeclarationItems.every((d) => declarations[d.key]);

  const submit = () => {
    const ref = submitApplication();
    void ref;
    navigate({ to: "/onboarding/submitted" });
  };

  return (
    <AuthShell
      eyebrow={`Organisation Application · Step ${step + 1} of ${steps.length}`}
      title={steps[step] ?? ""}
      description={`Register your organisation as an approved Beldium compliance partner in ${sectorName}. Operating sites and licences are not registered here.`}
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
            <TextField label="Registered Legal Name" value={application.legalName} onChange={(v) => updateApplication({ legalName: v })} />
            <TextField label="Trading Name" value={application.tradingName} onChange={(v) => updateApplication({ tradingName: v })} />
            <TextField label="RC / CAC Number" value={application.rcNumber} onChange={(v) => updateApplication({ rcNumber: v })} />
            <TextField label="TIN" value={application.tin} onChange={(v) => updateApplication({ tin: v })} />
            <SelectField label="Entity Type" value={application.entityType} onChange={(v) => updateApplication({ entityType: v })} options={entityTypes} />
            <TextField label="Date of Incorporation" type="date" value={application.incorporated} onChange={(v) => updateApplication({ incorporated: v })} />
            <TextField label="Registered Address" value={application.hqAddress} onChange={(v) => updateApplication({ hqAddress: v })} className="sm:col-span-2" />
            <TextField label="Operating Address" value={application.operatingAddress} onChange={(v) => updateApplication({ operatingAddress: v })} className="sm:col-span-2" />
            <TextField label="Official Email" type="email" value={application.officialEmail} onChange={(v) => updateApplication({ officialEmail: v })} />
            <TextField label="Phone" value={application.officialPhone} onChange={(v) => updateApplication({ officialPhone: v })} />
            <TextField label="Website" value={application.website} onChange={(v) => updateApplication({ website: v })} />
            <TextField label="Primary Contact" value={application.primaryContact} onChange={(v) => updateApplication({ primaryContact: v })} />
            <TextField label="Years in Operation" value={application.yearsInOperation} onChange={(v) => updateApplication({ yearsInOperation: v })} />
            <SelectField label="State" value={application.state} onChange={(v) => updateApplication({ state: v })} options={nigerianStates} />
          </div>
        )}

        {step === 1 && (
          <div className="space-y-6">
            <ChipToggleGroup
              label="Compliance Services Offered"
              hint="Select every service your organisation is able to deliver."
              options={complianceServiceOptions}
              selected={application.services}
              onToggle={(v) => updateApplication({ services: toggle(application.services, v) })}
            />
            {application.services.includes("Other") && (
              <TextField label="Other service" value={application.otherService} onChange={(v) => updateApplication({ otherService: v })} />
            )}
            <SelectField
              label="Coverage"
              value={application.coverage}
              onChange={(v) => updateApplication({ coverage: v })}
              options={["Nationwide", "Selected States"]}
            />
            {application.coverage === "Selected States" && (
              <ChipToggleGroup
                label="States Covered"
                options={nigerianStates}
                selected={application.statesCovered}
                onToggle={(v) => updateApplication({ statesCovered: toggle(application.statesCovered, v) })}
              />
            )}
            <ChipToggleGroup
              label="Minerals Experienced With"
              options={mineralOptions}
              selected={application.mineralsExperience}
              onToggle={(v) => updateApplication({ mineralsExperience: toggle(application.mineralsExperience, v) })}
            />
            <YesNoField
              label="Physical site inspection available"
              value={application.siteInspectionAvailable}
              onChange={(v) => updateApplication({ siteInspectionAvailable: v })}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField label="Average Mobilisation Time" placeholder="e.g. 5 working days" value={application.mobilisationTime} onChange={(v) => updateApplication({ mobilisationTime: v })} />
              <TextField label="Monthly Inspection Capacity" value={application.monthlyInspectionCapacity} onChange={(v) => updateApplication({ monthlyInspectionCapacity: v })} />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <SectionCard title="Attach a credential">
              <div className="grid gap-4 sm:grid-cols-2">
                <SelectField label="Document type" value={docDraft.category} onChange={(v) => setDocDraft({ ...docDraft, category: v })} options={orgCredentialCatalogue} />
                <TextField label="File name" placeholder="cac-certificate.pdf" value={docDraft.name} onChange={(v) => setDocDraft({ ...docDraft, name: v })} />
                <TextField label="Reference" value={docDraft.reference} onChange={(v) => setDocDraft({ ...docDraft, reference: v })} />
                <TextField label="Issued" type="date" value={docDraft.issued} onChange={(v) => setDocDraft({ ...docDraft, issued: v })} />
                <TextField label="Expiry" type="date" value={docDraft.expiry} onChange={(v) => setDocDraft({ ...docDraft, expiry: v })} />
              </div>
              <Button
                className="mt-4"
                disabled={!docDraft.name.trim()}
                onClick={() => {
                  addDocument(docDraft);
                  setDocDraft({ category: orgCredentialCatalogue[0]!, name: "", reference: "", issued: "", expiry: "" });
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
                    <p className="text-xs text-muted-foreground">{d.name}{d.reference ? ` · ${d.reference}` : ""}</p>
                  </div>
                  <Button variant="ghost" size="icon" aria-label="Remove document" onClick={() => removeDocument(d.id)}>
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <SectionCard title="Register a key professional">
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField label="Name" value={person.name} onChange={(v) => setPerson({ ...person, name: v })} />
                <SelectField label="Role" value={person.position} onChange={(v) => setPerson({ ...person, position: v })} options={personnelRoleOptions} />
                <TextField label="Email" type="email" value={person.email} onChange={(v) => setPerson({ ...person, email: v })} />
                <TextField label="Phone" value={person.phone} onChange={(v) => setPerson({ ...person, phone: v })} />
                <TextField label="Qualification" value={person.qualification} onChange={(v) => setPerson({ ...person, qualification: v })} />
                <TextField label="Professional Registration" value={person.registration} onChange={(v) => setPerson({ ...person, registration: v })} />
                <TextField label="Years Experience" value={person.yearsExperience} onChange={(v) => setPerson({ ...person, yearsExperience: v })} />
              </div>
              <div className="mt-4 space-y-2">
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox checked={person.cvAttached} onCheckedChange={(c) => setPerson({ ...person, cvAttached: Boolean(c) })} />
                  CV attached
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox checked={person.certificatesAttached} onCheckedChange={(c) => setPerson({ ...person, certificatesAttached: Boolean(c) })} />
                  Certificates attached
                </label>
              </div>
              <Button
                className="mt-4"
                disabled={!person.name.trim()}
                onClick={() => {
                  addPersonnel({ ...person, certification: person.registration, isSignatory: false });
                  setPerson({
                    name: "",
                    position: personnelRoleOptions[0]!,
                    email: "",
                    phone: "",
                    qualification: "",
                    registration: "",
                    yearsExperience: "",
                    cvAttached: false,
                    certificatesAttached: false,
                  });
                }}
              >
                Add personnel
              </Button>
            </SectionCard>

            <div className="space-y-2">
              {personnel.length === 0 && <p className="text-sm text-muted-foreground">No personnel registered yet.</p>}
              {personnel.map((p) => (
                <div key={p.id} className="flex items-center justify-between gap-3 rounded-[14px] border border-border px-4 py-3">
                  <div>
                    <p className="text-sm font-medium">{p.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.position}
                      {p.yearsExperience ? ` · ${p.yearsExperience} yrs` : ""}
                      {p.qualification ? ` · ${p.qualification}` : ""}
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" aria-label="Remove personnel" onClick={() => removePersonnel(p.id)}>
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField label="Number of Compliance Professionals" value={capability.professionalCount} onChange={(v) => updateCapability({ professionalCount: v })} />
              <TextField label="Number of Field Inspectors" value={capability.inspectorCount} onChange={(v) => updateCapability({ inspectorCount: v })} />
              <TextField label="Mining Engineers" value={capability.engineerCount} onChange={(v) => updateCapability({ engineerCount: v })} />
              <TextField label="Geologists" value={capability.geologistCount} onChange={(v) => updateCapability({ geologistCount: v })} />
              <TextField label="Environmental Specialists" value={capability.environmentalCount} onChange={(v) => updateCapability({ environmentalCount: v })} />
              <TextField label="HSE Specialists" value={capability.hseCount} onChange={(v) => updateCapability({ hseCount: v })} />
            </div>
            <div className="space-y-2">
              <YesNoField label="Field inspection capability" value={capability.fieldInspection} onChange={(v) => updateCapability({ fieldInspection: v })} />
              <YesNoField label="GPS evidence capture" value={capability.gpsEvidence} onChange={(v) => updateCapability({ gpsEvidence: v })} />
              <YesNoField label="Photo / video evidence" value={capability.photoVideoEvidence} onChange={(v) => updateCapability({ photoVideoEvidence: v })} />
              <YesNoField label="Digital inspection reports" value={capability.digitalReports} onChange={(v) => updateCapability({ digitalReports: v })} />
              <YesNoField label="Sampling capability (where applicable)" value={capability.samplingCapability} onChange={(v) => updateCapability({ samplingCapability: v })} />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <TextField label="Maximum Monthly Reviews" value={capability.maxMonthlyReviews} onChange={(v) => updateCapability({ maxMonthlyReviews: v })} />
              <TextField label="Maximum Monthly Site Inspections" value={capability.maxMonthlySiteInspections} onChange={(v) => updateCapability({ maxMonthlySiteInspections: v })} />
              <TextField label="Average Review Turnaround" placeholder="e.g. 7 days" value={capability.averageTurnaround} onChange={(v) => updateCapability({ averageTurnaround: v })} />
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-3">
            {orgDeclarationItems.map((d) => (
              <label key={d.key} className="flex items-start gap-3 rounded-[14px] border border-border px-4 py-3">
                <Checkbox className="mt-0.5" checked={Boolean(declarations[d.key])} onCheckedChange={(c) => setDeclaration(d.key, Boolean(c))} />
                <span>
                  <span className="block text-sm font-medium">{d.label}</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">{d.detail}</span>
                </span>
              </label>
            ))}
          </div>
        )}

        {step === 6 && (
          <div className="space-y-4">
            <SectionCard title="Organisation" action={<Button variant="ghost" size="sm" onClick={() => setStep(0)}>Edit section</Button>}>
              <div className="space-y-1">
                <InfoRow label="Legal name" value={application.legalName || "-"} />
                <InfoRow label="RC / CAC" value={application.rcNumber || "-"} />
                <InfoRow label="TIN" value={application.tin || "-"} />
                <InfoRow label="Entity type" value={application.entityType} />
                <InfoRow label="Registered address" value={application.hqAddress || "-"} />
                <InfoRow label="Operating address" value={application.operatingAddress || "-"} />
                <InfoRow label="Official email" value={application.officialEmail || "-"} />
                <InfoRow label="Phone" value={application.officialPhone || "-"} />
                <InfoRow label="Primary contact" value={application.primaryContact || "-"} />
                <InfoRow label="Years in operation" value={application.yearsInOperation || "-"} />
              </div>
            </SectionCard>

            <SectionCard title="Compliance services" action={<Button variant="ghost" size="sm" onClick={() => setStep(1)}>Edit section</Button>}>
              <div className="space-y-1">
                <InfoRow label="Services" value={application.services.join(", ") || "-"} />
                <InfoRow label="Coverage" value={application.coverage === "Nationwide" ? "Nationwide" : application.statesCovered.join(", ") || "-"} />
                <InfoRow label="Minerals" value={application.mineralsExperience.join(", ") || "-"} />
                <InfoRow label="Site inspection" value={application.siteInspectionAvailable ? "Available" : "Not available"} />
                <InfoRow label="Mobilisation" value={application.mobilisationTime || "-"} />
                <InfoRow label="Monthly inspection capacity" value={application.monthlyInspectionCapacity || "-"} />
              </div>
            </SectionCard>

            <SectionCard title={`Credentials & documents (${documents.length})`} action={<Button variant="ghost" size="sm" onClick={() => setStep(2)}>Edit section</Button>}>
              <div className="space-y-1">
                {documents.length === 0 && <p className="text-sm text-muted-foreground">No documents attached.</p>}
                {documents.map((d) => (
                  <InfoRow key={d.id} label={d.category} value={d.name} />
                ))}
              </div>
            </SectionCard>

            <SectionCard title={`Personnel (${personnel.length})`} action={<Button variant="ghost" size="sm" onClick={() => setStep(3)}>Edit section</Button>}>
              <div className="space-y-1">
                {personnel.length === 0 && <p className="text-sm text-muted-foreground">No personnel registered.</p>}
                {personnel.map((p) => (
                  <InfoRow key={p.id} label={p.name} value={p.position} />
                ))}
              </div>
            </SectionCard>

            <SectionCard title="Compliance capability" action={<Button variant="ghost" size="sm" onClick={() => setStep(4)}>Edit section</Button>}>
              <div className="space-y-1">
                <InfoRow label="Compliance professionals" value={capability.professionalCount || "-"} />
                <InfoRow label="Field inspectors" value={capability.inspectorCount || "-"} />
                <InfoRow label="Max monthly reviews" value={capability.maxMonthlyReviews || "-"} />
                <InfoRow label="Max monthly inspections" value={capability.maxMonthlySiteInspections || "-"} />
                <InfoRow label="Average turnaround" value={capability.averageTurnaround || "-"} />
              </div>
            </SectionCard>

            <SectionCard title="Declarations" action={<Button variant="ghost" size="sm" onClick={() => setStep(5)}>Edit section</Button>}>
              <div className="space-y-1">
                {orgDeclarationItems.map((d) => (
                  <InfoRow key={d.key} label={d.label} value={declarations[d.key] ? "Accepted" : "Outstanding"} />
                ))}
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
          <Button size="lg" disabled={!allDeclared} onClick={submit}>
            <Check className="mr-1 size-4" /> Submit application
          </Button>
        )}
        {step > 0 && (
          <Button size="lg" variant="ghost" onClick={() => setStep(step - 1)}>
            Back
          </Button>
        )}
      </div>
      {step === steps.length - 1 && !allDeclared && (
        <p className="mt-3 text-xs text-muted-foreground">Accept all declarations in step 6 to submit.</p>
      )}
    </AuthShell>
  );
}
