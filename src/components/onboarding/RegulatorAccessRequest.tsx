import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { AuthShell, ProgressHeader } from "@/components/onboarding/ui";
import { AreaField, ChipToggleGroup, SelectField, TextField } from "@/components/onboarding/fields";
import { FieldNote } from "@/components/onboarding/quality-parts";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { allNigerianStates, regulatorInstitutionTypes } from "@/lib/onboarding/data";
import { useOnboarding } from "@/lib/onboarding/store";
import { COMPLIANCE_VERTICALS, VERTICAL_BY_SLUG } from "@/lib/verticals";
import { ApiError, createRegulatorRequest } from "@/lib/api";

/** Free mail providers: an agency request from one needs its letter attached. */
const FREE_MAIL = /@(gmail|yahoo|hotmail|outlook|live|icloud|aol|proton(mail)?|ymail)\./i;

/**
 * Regulatory access request (backend plan BE-O5). A regulator asks for
 * read-only access to one or more sectors; a Beldium operator checks the
 * official email or the agency letter, approves it and picks which sectors it
 * covers (D9). Nothing is visible until then.
 *
 * The request is sent to POST /onboarding/regulator-requests/. The answers are
 * also kept with the onboarding draft for the submitted screen.
 */
export function RegulatorAccessRequest() {
  const { regulator, updateRegulator, account, sector, submitApplication } = useOnboarding();
  const navigate = useNavigate();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmed, setConfirmed] = useState(false);
  const [letter, setLetter] = useState<string>(regulator.authorityLetter ?? "");
  const [letterFile, setLetterFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);

  const sectorsRequested =
    regulator.sectorsRequested ?? (sector ? [VERTICAL_BY_SLUG[sector].name] : []);
  const officialEmail = regulator.officialEmail || account.email;
  const freeMail = FREE_MAIL.test(officialEmail);

  const submit = async () => {
    const next: Record<string, string> = {};
    if (!regulator.legalName.trim()) next["legalName"] = "Enter the agency's name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(officialEmail))
      next["officialEmail"] = "Enter a valid official email.";
    if (!regulator.headOffice.trim()) next["headOffice"] = "Enter the office you work from.";
    if (!regulator.state || regulator.state === "Select…") next["state"] = "Choose the state.";
    if (!sectorsRequested.length) next["sectors"] = "Choose at least one sector.";
    if (freeMail && !letterFile)
      next["letter"] =
        "Attach a letter from your agency, since this is not an official email address.";
    if (!confirmed)
      next["confirmed"] = "Confirm that you are authorised to ask on the agency's behalf.";
    setErrors(next);
    if (Object.keys(next).length) return;
    const slugs = COMPLIANCE_VERTICALS.filter((v) => sectorsRequested.includes(v.name)).map(
      (v) => v.slug,
    );
    setSending(true);
    try {
      await createRegulatorRequest({
        agency_name: regulator.legalName.trim(),
        institution_type: regulator.institutionType,
        official_email: officialEmail,
        office: regulator.headOffice.trim(),
        state: regulator.state,
        requester_title: regulator.requesterTitle ?? account.jobTitle,
        requested_sectors: slugs,
        mandate: regulator.mandate,
        authority_letter: letterFile,
      });
    } catch (error) {
      setSending(false);
      if (error instanceof ApiError && error.status === 409) {
        // A request is already waiting: show it rather than failing.
        toast.info("Your agency's request is already waiting for Beldium.");
      } else {
        toast.error(error instanceof Error ? error.message : "The request could not be sent.");
        return;
      }
    }
    updateRegulator({
      officialEmail,
      sectorsRequested,
      authorityLetter: letter,
      requesterTitle: regulator.requesterTitle ?? account.jobTitle,
    });
    submitApplication();
    navigate({ to: "/onboarding/submitted" });
  };

  return (
    <AuthShell
      eyebrow="Regulatory access"
      title="Request read-only access"
      description="For government regulators and oversight agencies. You will be able to view the sectors Beldium approves for your agency. You cannot change any record."
      width="md"
    >
      <ProgressHeader step={5} total={6} onBack={() => navigate({ to: "/onboarding/verify" })} />
      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <TextField
              name="legalName"
              label="Agency name *"
              value={regulator.legalName}
              onChange={(v) => updateRegulator({ legalName: v })}
              placeholder="Mines Inspectorate Department"
            />
            <FieldNote error={errors["legalName"]} />
          </div>
          <SelectField
            name="institutionType"
            label="Type of agency"
            value={regulator.institutionType}
            onChange={(v) => updateRegulator({ institutionType: v })}
            options={regulatorInstitutionTypes}
          />
          <div>
            <TextField
              name="officialEmail"
              label="Official email *"
              type="email"
              value={officialEmail}
              onChange={(v) => updateRegulator({ officialEmail: v })}
            />
            <FieldNote error={errors["officialEmail"]} />
            {freeMail && !errors["officialEmail"] && (
              <p className="mt-1.5 text-xs text-muted-foreground">
                This looks like a personal address. Attach a letter from your agency below.
              </p>
            )}
          </div>
          <div>
            <TextField
              name="headOffice"
              label="Office or department *"
              value={regulator.headOffice}
              onChange={(v) => updateRegulator({ headOffice: v })}
              placeholder="Zonal office, Jos"
            />
            <FieldNote error={errors["headOffice"]} />
          </div>
          <div>
            <SelectField
              name="state"
              label="State *"
              value={regulator.state || "Select…"}
              onChange={(v) => updateRegulator({ state: v })}
              options={["Select…", "Federal (all states)", ...allNigerianStates]}
            />
            <FieldNote error={errors["state"]} />
          </div>
          <div className="sm:col-span-2">
            <TextField
              name="requesterTitle"
              label="Your job title"
              value={regulator.requesterTitle ?? account.jobTitle}
              onChange={(v) => updateRegulator({ requesterTitle: v })}
              placeholder="Assistant Director, Mines Inspectorate"
            />
          </div>
        </div>

        <div>
          <ChipToggleGroup
            label="Sectors you need to see *"
            options={COMPLIANCE_VERTICALS.map((v) => v.name)}
            selected={sectorsRequested}
            onToggle={(v) =>
              updateRegulator({
                sectorsRequested: sectorsRequested.includes(v)
                  ? sectorsRequested.filter((s) => s !== v)
                  : [...sectorsRequested, v],
              })
            }
          />
          <FieldNote error={errors["sectors"]} />
          <p className="mt-1.5 text-xs text-muted-foreground">
            Beldium may approve fewer sectors than you ask for.
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="authority-letter">
            Letter of authority from your agency{freeMail ? " *" : " (optional)"}
          </Label>
          <Input
            id="authority-letter"
            type="file"
            accept=".pdf,image/*"
            onChange={(e) => {
              const file = e.target.files?.[0] ?? null;
              setLetterFile(file);
              setLetter(file?.name ?? "");
            }}
          />
          {letter && <p className="text-xs text-muted-foreground">Selected: {letter}</p>}
          <FieldNote error={errors["letter"]} />
        </div>

        <AreaField
          name="mandate"
          label="Why your agency needs access"
          rows={3}
          value={regulator.mandate}
          onChange={(v) => updateRegulator({ mandate: v })}
        />

        <div>
          <label className="flex items-start gap-3 text-sm">
            <Checkbox
              checked={confirmed}
              onCheckedChange={(v) => setConfirmed(v === true)}
              className="mt-0.5"
            />
            <span>
              I am authorised to request this access on behalf of the agency, and I understand the
              access is read-only.
            </span>
          </label>
          <FieldNote error={errors["confirmed"]} />
        </div>

        <div className="flex flex-wrap gap-3 pt-2">
          <Button size="lg" onClick={() => void submit()} disabled={sending}>
            {sending ? "Sending…" : "Send request"}
          </Button>
        </div>
      </div>
    </AuthShell>
  );
}
