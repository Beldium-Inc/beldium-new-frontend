import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Check, Trash2 } from "lucide-react";
import { AuthShell, InfoRow, ProgressHeader, StepBar } from "@/components/onboarding/ui";
import { AreaField, ChipToggleGroup, PhoneField, SectionCard, SelectField, TextField, YesNoField } from "@/components/onboarding/fields";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  authorisationLevels,
  mineralOptions,
  miningOversightFunctionOptions,
  nigerianStates,
  oversightCapabilityOptions,
  regulatorDeclarationItems,
  regulatorDocumentCatalogue,
  regulatorInstitutionTypes,
  regulatoryResponsibilityOptions,
  regulatoryRoleOptions,
} from "@/lib/onboarding/data";
import { useOnboarding } from "@/lib/onboarding/store";

const steps = [
  "Organisation",
  "Regulatory Authority",
  "Documents",
  "Authorised Personnel",
  "Oversight Capability",
  "Declarations",
  "Review",
];

export function RegulatorApplicationFlow() {
  const {
    regulator,
    updateRegulator,
    documents,
    addDocument,
    removeDocument,
    personnel,
    addPersonnel,
    removePersonnel,
    declarations,
    setDeclaration,
    submitApplication,
  } = useOnboarding();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);

  const [docDraft, setDocDraft] = useState({ category: regulatorDocumentCatalogue[0]!, name: "", reference: "", issued: "", expiry: "" });
  const emptyOfficer = {
    name: "",
    position: regulatoryRoleOptions[0]!,
    department: "",
    email: "",
    phone: "",
    staffId: "",
    authorisationLevel: authorisationLevels[0]!,
    appointmentDocAttached: false,
    jobTitle: "",
  };
  const [officer, setOfficer] = useState(emptyOfficer);

  const toggle = (list: string[], value: string) => (list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  const allDeclared = regulatorDeclarationItems.every((d) => declarations[d.key]);

  const submit = () => {
    submitApplication();
    navigate({ to: "/onboarding/submitted" });
  };

  return (
    <AuthShell
      eyebrow={`Regulatory Organisation Application · Step ${step + 1} of ${steps.length}`}
      title={steps[step] ?? ""}
      description="Register your government or authorised institution for regulatory oversight on Beldium. Regulatory permissions are activated only after Beldium approves the organisation."
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
            <TextField label="Organisation Legal Name" value={regulator.legalName} onChange={(v) => updateRegulator({ legalName: v })} className="sm:col-span-2" />
            <SelectField label="Government / Regulatory Institution Type" value={regulator.institutionType} onChange={(v) => updateRegulator({ institutionType: v })} options={regulatorInstitutionTypes} />
            <TextField label="Date Established" type="date" value={regulator.established} onChange={(v) => updateRegulator({ established: v })} />
            <TextField label="Head Office Address" value={regulator.headOffice} onChange={(v) => updateRegulator({ headOffice: v })} className="sm:col-span-2" />
            <TextField label="Country" value={regulator.country} onChange={(v) => updateRegulator({ country: v })} />
            <SelectField label="State" value={regulator.state} onChange={(v) => updateRegulator({ state: v })} options={nigerianStates} />
            <TextField label="Official Email" type="email" value={regulator.officialEmail} onChange={(v) => updateRegulator({ officialEmail: v })} />
            <PhoneField label="Official Phone" value={regulator.officialPhone} onChange={(v) => updateRegulator({ officialPhone: v })} />
            <TextField label="Website" value={regulator.website} onChange={(v) => updateRegulator({ website: v })} />
            <TextField label="Primary Authorised Representative" value={regulator.primaryRepresentative} onChange={(v) => updateRegulator({ primaryRepresentative: v })} />
          </div>
        )}

        {step === 1 && (
          <div className="space-y-6">
            <AreaField label="Regulatory Mandate" rows={3} placeholder="Summarise the statutory mandate of the institution." value={regulator.mandate} onChange={(v) => updateRegulator({ mandate: v })} />
            <TextField label="Government Ministry / Agency Affiliation" value={regulator.ministry} onChange={(v) => updateRegulator({ ministry: v })} />
            <ChipToggleGroup
              label="Areas of Regulatory Responsibility"
              options={regulatoryResponsibilityOptions}
              selected={regulator.responsibilities}
              onToggle={(v) => updateRegulator({ responsibilities: toggle(regulator.responsibilities, v) })}
            />
            <ChipToggleGroup
              label="Mining Oversight Functions"
              options={miningOversightFunctionOptions}
              selected={regulator.oversightFunctions}
              onToggle={(v) => updateRegulator({ oversightFunctions: toggle(regulator.oversightFunctions, v) })}
            />
            <ChipToggleGroup
              label="States / Geographic Jurisdiction"
              options={nigerianStates}
              selected={regulator.jurisdiction}
              onToggle={(v) => updateRegulator({ jurisdiction: toggle(regulator.jurisdiction, v) })}
            />
            <ChipToggleGroup
              label="Minerals Covered"
              options={mineralOptions}
              selected={regulator.mineralsCovered}
              onToggle={(v) => updateRegulator({ mineralsCovered: toggle(regulator.mineralsCovered, v) })}
            />
            <div className="space-y-2">
              <YesNoField label="Authority to inspect mining operations" value={regulator.canInspect} onChange={(v) => updateRegulator({ canInspect: v })} />
              <YesNoField label="Authority to review licences / permits" value={regulator.canReviewLicences} onChange={(v) => updateRegulator({ canReviewLicences: v })} />
              <YesNoField label="Authority to issue regulatory decisions" value={regulator.canIssueDecisions} onChange={(v) => updateRegulator({ canIssueDecisions: v })} />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <SectionCard title="Attach a document">
              <div className="grid gap-4 sm:grid-cols-2">
                <SelectField label="Document type" value={docDraft.category} onChange={(v) => setDocDraft({ ...docDraft, category: v })} options={regulatorDocumentCatalogue} />
                <TextField label="File name" placeholder="enabling-act.pdf" value={docDraft.name} onChange={(v) => setDocDraft({ ...docDraft, name: v })} />
                <TextField label="Reference" value={docDraft.reference} onChange={(v) => setDocDraft({ ...docDraft, reference: v })} />
                <TextField label="Issued" type="date" value={docDraft.issued} onChange={(v) => setDocDraft({ ...docDraft, issued: v })} />
                <TextField label="Expiry" type="date" value={docDraft.expiry} onChange={(v) => setDocDraft({ ...docDraft, expiry: v })} />
              </div>
              <Button
                className="mt-4"
                disabled={!docDraft.name.trim()}
                onClick={() => {
                  addDocument(docDraft);
                  setDocDraft({ category: regulatorDocumentCatalogue[0]!, name: "", reference: "", issued: "", expiry: "" });
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
            <SectionCard title="Add an authorised officer">
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField label="Full Name" value={officer.name} onChange={(v) => setOfficer({ ...officer, name: v })} />
                <TextField label="Job Title" value={officer.jobTitle} onChange={(v) => setOfficer({ ...officer, jobTitle: v })} />
                <TextField label="Department" value={officer.department} onChange={(v) => setOfficer({ ...officer, department: v })} />
                <TextField label="Official Email" type="email" value={officer.email} onChange={(v) => setOfficer({ ...officer, email: v })} />
                <PhoneField label="Phone" value={officer.phone} onChange={(v) => setOfficer({ ...officer, phone: v })} />
                <SelectField label="Role" value={officer.position} onChange={(v) => setOfficer({ ...officer, position: v })} options={regulatoryRoleOptions} />
                <TextField label="Employee / Staff ID" value={officer.staffId} onChange={(v) => setOfficer({ ...officer, staffId: v })} />
                <SelectField label="Authorisation Level" value={officer.authorisationLevel} onChange={(v) => setOfficer({ ...officer, authorisationLevel: v })} options={authorisationLevels} />
              </div>
              <label className="mt-4 flex items-center gap-2 text-sm">
                <Checkbox
                  checked={officer.appointmentDocAttached}
                  onCheckedChange={(c) => setOfficer({ ...officer, appointmentDocAttached: Boolean(c) })}
                />
                Identification / appointment document attached
              </label>
              <Button
                className="mt-4"
                disabled={!officer.name.trim()}
                onClick={() => {
                  addPersonnel({
                    name: officer.name,
                    position: officer.position,
                    email: officer.email,
                    phone: officer.phone,
                    certification: "",
                    qualification: officer.jobTitle,
                    registration: officer.staffId,
                    yearsExperience: "",
                    cvAttached: false,
                    certificatesAttached: officer.appointmentDocAttached,
                    isSignatory: officer.authorisationLevel === "Administrator",
                    department: officer.department,
                    staffId: officer.staffId,
                    authorisationLevel: officer.authorisationLevel,
                    appointmentDocAttached: officer.appointmentDocAttached,
                  });
                  setOfficer(emptyOfficer);
                }}
              >
                Add officer
              </Button>
            </SectionCard>

            <div className="space-y-2">
              {personnel.length === 0 && <p className="text-sm text-muted-foreground">No authorised officers added yet.</p>}
              {personnel.map((p) => (
                <div key={p.id} className="flex items-center justify-between gap-3 rounded-[14px] border border-border px-4 py-3">
                  <div>
                    <p className="text-sm font-medium">{p.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.position}
                      {p.department ? ` · ${p.department}` : ""}
                      {p.authorisationLevel ? ` · ${p.authorisationLevel}` : ""}
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" aria-label="Remove officer" onClick={() => removePersonnel(p.id)}>
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 4 && (
          <ChipToggleGroup
            label="Oversight Capabilities"
            hint="Select the oversight functions this organisation performs. Beldium activates only the capabilities it approves."
            options={oversightCapabilityOptions}
            selected={regulator.oversightCapabilities}
            onToggle={(v) => updateRegulator({ oversightCapabilities: toggle(regulator.oversightCapabilities, v) })}
          />
        )}

        {step === 5 && (
          <div className="space-y-3">
            {regulatorDeclarationItems.map((d) => (
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
                <InfoRow label="Legal name" value={regulator.legalName || "-"} />
                <InfoRow label="Institution type" value={regulator.institutionType} />
                <InfoRow label="Established" value={regulator.established || "-"} />
                <InfoRow label="Head office" value={regulator.headOffice || "-"} />
                <InfoRow label="Country / State" value={`${regulator.country || "-"} · ${regulator.state}`} />
                <InfoRow label="Official email" value={regulator.officialEmail || "-"} />
                <InfoRow label="Official phone" value={regulator.officialPhone || "-"} />
                <InfoRow label="Representative" value={regulator.primaryRepresentative || "-"} />
              </div>
            </SectionCard>

            <SectionCard title="Regulatory authority" action={<Button variant="ghost" size="sm" onClick={() => setStep(1)}>Edit section</Button>}>
              <div className="space-y-1">
                <InfoRow label="Mandate" value={regulator.mandate || "-"} />
                <InfoRow label="Ministry / agency" value={regulator.ministry || "-"} />
                <InfoRow label="Responsibilities" value={regulator.responsibilities.join(", ") || "-"} />
                <InfoRow label="Oversight functions" value={regulator.oversightFunctions.join(", ") || "-"} />
                <InfoRow label="Jurisdiction" value={regulator.jurisdiction.join(", ") || "-"} />
                <InfoRow label="Minerals covered" value={regulator.mineralsCovered.join(", ") || "-"} />
                <InfoRow label="Inspection authority" value={regulator.canInspect ? "Yes" : "No"} />
                <InfoRow label="Licence review authority" value={regulator.canReviewLicences ? "Yes" : "No"} />
                <InfoRow label="Regulatory decisions" value={regulator.canIssueDecisions ? "Yes" : "No"} />
              </div>
            </SectionCard>

            <SectionCard title={`Documents (${documents.length})`} action={<Button variant="ghost" size="sm" onClick={() => setStep(2)}>Edit section</Button>}>
              <div className="space-y-1">
                {documents.length === 0 && <p className="text-sm text-muted-foreground">No documents attached.</p>}
                {documents.map((d) => (
                  <InfoRow key={d.id} label={d.category} value={d.name} />
                ))}
              </div>
            </SectionCard>

            <SectionCard title={`Authorised personnel (${personnel.length})`} action={<Button variant="ghost" size="sm" onClick={() => setStep(3)}>Edit section</Button>}>
              <div className="space-y-1">
                {personnel.length === 0 && <p className="text-sm text-muted-foreground">No officers added.</p>}
                {personnel.map((p) => (
                  <InfoRow key={p.id} label={p.name} value={`${p.position}${p.authorisationLevel ? ` · ${p.authorisationLevel}` : ""}`} />
                ))}
              </div>
            </SectionCard>

            <SectionCard title="Oversight capability" action={<Button variant="ghost" size="sm" onClick={() => setStep(4)}>Edit section</Button>}>
              <InfoRow label="Capabilities" value={regulator.oversightCapabilities.join(", ") || "-"} />
            </SectionCard>

            <SectionCard title="Declarations" action={<Button variant="ghost" size="sm" onClick={() => setStep(5)}>Edit section</Button>}>
              <div className="space-y-1">
                {regulatorDeclarationItems.map((d) => (
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
