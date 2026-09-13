import { createFileRoute, useNavigate } from "@tanstack/react-router";
import * as React from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ApiError } from "@/lib/api/errors";
import { useOrganisationDirectory } from "@/lib/api/queries";
import { useCreateApplication } from "@/lib/api/miner-queries";
import { PageHeader, Panel, Field } from "@/verticals/miner/components/primitives";
import { Chip } from "@/verticals/miner/components/chips";

export const Route = createFileRoute("/miner/application")({ component: ApplicationWizard });

const STEPS = [
  "Organisation",
  "Licence & site",
  "Equipment",
  "Environmental & safety",
  "Documents",
  "Declaration",
] as const;

function ApplicationWizard() {
  const navigate = useNavigate();
  const orgDirectory = useOrganisationDirectory();
  const createApplication = useCreateApplication();

  const [step, setStep] = React.useState(0);
  const [orgName, setOrgName] = React.useState("");
  const [siteName, setSiteName] = React.useState("");
  const [mineral, setMineral] = React.useState("");
  const [state, setState] = React.useState("");
  const [lga, setLga] = React.useState("");
  const [equipmentNotes, setEquipmentNotes] = React.useState("");
  const [envNotes, setEnvNotes] = React.useState("");
  const [documentsNotes, setDocumentsNotes] = React.useState("");
  const [declared, setDeclared] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  const organisation = orgDirectory.data?.results[0];

  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const submit = async () => {
    if (!organisation) {
      toast.error("No organisation found on your account yet.");
      return;
    }
    if (!siteName || !mineral || !declared) {
      toast.error("Complete the required fields and confirm the declaration.");
      return;
    }
    setSubmitting(true);
    try {
      const fullSiteName = [siteName, [state, lga].filter(Boolean).join(", ")]
        .filter(Boolean)
        .join(" — ");
      await createApplication.mutateAsync({
        organisation: organisation.id,
        type: "site_admission",
        mineral,
        site_name: fullSiteName,
      });
      toast.success("Application submitted for review.");
      navigate({ to: "/miner/application-record" });
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not submit the application.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Organisation application"
        description="Complete every section, then submit for compliance review."
      />

      <div className="mb-5 flex flex-wrap gap-2">
        {STEPS.map((label, i) => (
          <Chip key={label} tone={i === step ? "brand" : i < step ? "success" : "neutral"}>
            {i + 1}. {label}
          </Chip>
        ))}
      </div>

      <Panel title={STEPS[step] as string}>
        {step === 0 && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Organisation on file" value={organisation?.name ?? "Loading…"} />
            <div className="space-y-1.5">
              <Label>Display name (optional)</Label>
              <Input value={orgName} onChange={(e) => setOrgName(e.target.value)} placeholder={organisation?.name} />
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Site name</Label>
              <Input value={siteName} onChange={(e) => setSiteName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Mineral</Label>
              <Input value={mineral} onChange={(e) => setMineral(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>State</Label>
              <Input value={state} onChange={(e) => setState(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>LGA</Label>
              <Input value={lga} onChange={(e) => setLga(e.target.value)} />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-1.5">
            <Label>Equipment on site</Label>
            <Textarea
              value={equipmentNotes}
              onChange={(e) => setEquipmentNotes(e.target.value)}
              placeholder="List major equipment, serial numbers and certification status…"
            />
          </div>
        )}

        {step === 3 && (
          <div className="space-y-1.5">
            <Label>Environmental & safety notes</Label>
            <Textarea
              value={envNotes}
              onChange={(e) => setEnvNotes(e.target.value)}
              placeholder="Environmental management plan, safety procedures, incident history…"
            />
          </div>
        )}

        {step === 4 && (
          <div className="space-y-1.5">
            <Label>Documents to be provided</Label>
            <Textarea
              value={documentsNotes}
              onChange={(e) => setDocumentsNotes(e.target.value)}
              placeholder="Licence, incorporation certificate, tax clearance… (upload from the Documents page once submitted)"
            />
          </div>
        )}

        {step === 5 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              By submitting, you confirm that the information provided is accurate and that Beldium
              may verify it against public records and site inspection.
            </p>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={declared} onChange={(e) => setDeclared(e.target.checked)} />
              I confirm the information provided is accurate.
            </label>
          </div>
        )}

        <div className="mt-6 flex items-center justify-between">
          <Button variant="outline" size="sm" onClick={back} disabled={step === 0}>
            Back
          </Button>
          {step < STEPS.length - 1 ? (
            <Button size="sm" onClick={next}>
              Next
            </Button>
          ) : (
            <Button size="sm" onClick={() => void submit()} disabled={submitting}>
              {submitting ? "Submitting…" : "Submit application"}
            </Button>
          )}
        </div>
      </Panel>
    </>
  );
}
