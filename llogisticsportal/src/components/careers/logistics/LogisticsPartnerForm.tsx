/* eslint-disable @typescript-eslint/no-explicit-any -- migrated as-is from the standalone Careers Hub; form values are typed loosely across pathway schemas. */
import { useState } from "react";
import { useForm, type UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/careers/ui/button";
import { cn } from "@/lib/utils";
import { Stepper } from "@/components/careers/logistics/Stepper";
import { DocumentUpload } from "@/components/careers/logistics/DocumentUpload";
import { AgreementCard } from "@/components/careers/logistics/AgreementCard";
import {
  companyInfoSchema,
  REQUIRED_DOCUMENTS,
  OPTIONAL_DOCUMENTS,
  AGREEMENTS,
  type CompanyInfoValues,
  type DocumentKey,
  type AgreementKey,
} from "@/lib/careers/logistics-schemas";
import { submitPartnerApplication } from "@/lib/careers/logistics-api";
import { SupabaseNotConfiguredError } from "@/lib/careers/supabase";
import { ApplicationsUnavailable } from "@/components/careers/ApplicationsUnavailable";

type AnyForm = UseFormReturn<any>;

const STEP_LABELS = ["Company Information", "Document Uploads", "Agreements"];

/* ---------- small field helpers (mirrors ApplicationForm.tsx conventions) ---------- */

function Field({
  form,
  name,
  label,
  placeholder,
  type = "text",
  required,
  className,
}: {
  form: AnyForm;
  name: string;
  label: string;
  placeholder?: string;
  type?: string;
  required?: boolean;
  className?: string;
}) {
  const err = (form.formState.errors as any)[name]?.message as string | undefined;
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={name}>
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      <Input
        id={name}
        type={type}
        placeholder={placeholder}
        aria-invalid={!!err}
        {...form.register(name)}
      />
      {err && <p className="text-xs font-medium text-destructive">{err}</p>}
    </div>
  );
}

function AreaField({
  form,
  name,
  label,
  placeholder,
  required,
  rows = 4,
  className,
}: {
  form: AnyForm;
  name: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  rows?: number;
  className?: string;
}) {
  const err = (form.formState.errors as any)[name]?.message as string | undefined;
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={name}>
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      <Textarea
        id={name}
        rows={rows}
        placeholder={placeholder}
        aria-invalid={!!err}
        {...form.register(name)}
      />
      {err && <p className="text-xs font-medium text-destructive">{err}</p>}
    </div>
  );
}

function SectionTitle({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-6">
      <h3 className="font-display text-lg font-bold text-brand-navy-deep">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

/* ---------- main form ---------- */

interface LogisticsPartnerFormProps {
  onSubmitted: (applicationId: string) => void;
}

export function LogisticsPartnerForm({ onSubmitted }: LogisticsPartnerFormProps) {
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<any>({
    resolver: zodResolver(companyInfoSchema) as any,
    mode: "onBlur",
    defaultValues: {},
  });

  const [documents, setDocuments] = useState<Partial<Record<DocumentKey, File>>>({});
  const [documentErrors, setDocumentErrors] = useState<Partial<Record<DocumentKey, string>>>({});

  const [agreementChecks, setAgreementChecks] = useState<Record<AgreementKey, boolean>>(
    Object.fromEntries(AGREEMENTS.map((a) => [a.key, false])) as Record<AgreementKey, boolean>,
  );
  const [agreementSignatures, setAgreementSignatures] = useState<Record<AgreementKey, string>>(
    Object.fromEntries(AGREEMENTS.map((a) => [a.key, ""])) as Record<AgreementKey, string>,
  );
  const [agreementErrors, setAgreementErrors] = useState<Partial<Record<AgreementKey, string>>>({});

  const allAgreementsSigned = AGREEMENTS.every(
    (a) => agreementChecks[a.key] && agreementSignatures[a.key].trim().length > 0,
  );

  const validateStep1 = async () => form.trigger();

  const validateStep2 = () => {
    const errors: Partial<Record<DocumentKey, string>> = {};
    for (const doc of REQUIRED_DOCUMENTS) {
      if (!documents[doc.key]) errors[doc.key] = `${doc.label} is required`;
    }
    setDocumentErrors(errors);
    return errors;
  };

  const validateStep3 = () => {
    const errors: Partial<Record<AgreementKey, string>> = {};
    for (const a of AGREEMENTS) {
      if (!agreementChecks[a.key]) {
        errors[a.key] = "You must agree to this document";
      } else if (!agreementSignatures[a.key].trim()) {
        errors[a.key] = "Please type your full name to sign";
      }
    }
    setAgreementErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const goNext = async () => {
    if (step === 0) {
      const valid = await validateStep1();
      if (!valid) {
        toast.error("Please fix the errors before continuing.");
        return;
      }
    }
    if (step === 1) {
      const errors = validateStep2();
      const firstMissingKey = Object.keys(errors)[0];
      if (firstMissingKey) {
        toast.error("Please upload all required documents before continuing.");
        document
          .getElementById(firstMissingKey)
          ?.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }
    }
    setStep((s) => Math.min(s + 1, STEP_LABELS.length - 1));
  };

  const goBack = () => setStep((s) => Math.max(s - 1, 0));

  const handleSubmit = async () => {
    if (!validateStep3()) {
      toast.error("Please confirm and sign all agreements before submitting.");
      return;
    }
    setSubmitting(true);
    try {
      const company = form.getValues();
      const result = await submitPartnerApplication({
        company,
        documents,
        agreements: AGREEMENTS.map((a) => ({
          key: a.key,
          signedName: agreementSignatures[a.key],
          signedAt: new Date().toISOString(),
        })),
      });
      onSubmitted(result.applicationId);
    } catch (err) {
      console.error(err);
      toast.error(
        err instanceof SupabaseNotConfiguredError
          ? err.message
          : "Something went wrong while submitting. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-4xl">
      <ApplicationsUnavailable />
      <div className="mb-8">
        <Stepper steps={STEP_LABELS} currentStep={step} />
      </div>

      <div className="glass-card rounded-3xl p-6 sm:p-10">
        <div className="mb-8 border-b border-border pb-6">
          <h2 className="font-display text-3xl font-bold text-brand-navy-deep">
            Logistics Partner Registration
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Apply to become a verified logistics partner and start receiving RFQs and transport
            assignments on the Beldium platform.
          </p>
        </div>

        {step === 0 && (
          <section>
            <SectionTitle
              title="Company Information"
              description="Tell us about your transport company."
            />
            <div className="grid gap-5 sm:grid-cols-2">
              <Field form={form} name="companyName" label="Company Name" required />
              <Field form={form} name="rcNumber" label="RC Number" required />
              <Field form={form} name="companyEmail" label="Company Email" type="email" required />
              <Field
                form={form}
                name="phoneNumber"
                label="Phone Number"
                placeholder="0803 123 4567"
                required
              />
              <Field form={form} name="contactPerson" label="Contact Person" required />
              <AreaField
                form={form}
                name="businessAddress"
                label="Business Address"
                required
                className="sm:col-span-2"
              />
            </div>
          </section>
        )}

        {step === 1 && (
          <section>
            <SectionTitle
              title="Document Uploads"
              description="Upload all required documents. Accepted formats: PDF, JPG, PNG unless noted otherwise."
            />
            <div className="grid gap-6 sm:grid-cols-2">
              {REQUIRED_DOCUMENTS.map((doc) => (
                <DocumentUpload
                  key={doc.key}
                  id={doc.key}
                  label={doc.label}
                  description={doc.description}
                  accept={doc.accept}
                  maxMb={doc.maxMb}
                  required
                  value={documents[doc.key] ?? null}
                  onChange={(file) => {
                    setDocuments((prev) => ({ ...prev, [doc.key]: file ?? undefined }));
                    setDocumentErrors((prev) => ({ ...prev, [doc.key]: undefined }));
                  }}
                  error={documentErrors[doc.key]}
                />
              ))}
            </div>

            <div className="mt-10 border-t border-dashed border-border pt-6">
              <div className="mb-4 flex items-center gap-2">
                <h4 className="font-display text-base font-semibold text-brand-navy-deep">
                  Optional Documents
                </h4>
                <span className="rounded-full bg-brand-mist px-2.5 py-0.5 text-[11px] font-semibold tracking-wide text-brand-navy-soft uppercase">
                  Not required
                </span>
              </div>
              <div className="grid gap-6 sm:grid-cols-2">
                {OPTIONAL_DOCUMENTS.map((doc) => (
                  <DocumentUpload
                    key={doc.key}
                    id={doc.key}
                    label={doc.label}
                    description={doc.description}
                    accept={doc.accept}
                    maxMb={doc.maxMb}
                    value={documents[doc.key] ?? null}
                    onChange={(file) =>
                      setDocuments((prev) => ({ ...prev, [doc.key]: file ?? undefined }))
                    }
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        {step === 2 && (
          <section>
            <SectionTitle
              title="Agreements"
              description="Review and digitally sign each document. All four must be confirmed before you can submit."
            />
            <div className="space-y-5">
              {AGREEMENTS.map((a) => (
                <AgreementCard
                  key={a.key}
                  title={a.title}
                  summary={a.summary}
                  checked={agreementChecks[a.key]}
                  onCheckedChange={(v) => {
                    setAgreementChecks((prev) => ({ ...prev, [a.key]: v }));
                    setAgreementErrors((prev) => ({ ...prev, [a.key]: undefined }));
                  }}
                  signedName={agreementSignatures[a.key]}
                  onSignedNameChange={(name) => {
                    setAgreementSignatures((prev) => ({ ...prev, [a.key]: name }));
                    setAgreementErrors((prev) => ({ ...prev, [a.key]: undefined }));
                  }}
                  error={agreementErrors[a.key]}
                />
              ))}
            </div>
          </section>
        )}

        <div className="mt-10 flex flex-col-reverse items-stretch gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={goBack}
            disabled={step === 0}
            className="rounded-full"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>

          {step < STEP_LABELS.length - 1 ? (
            <Button
              type="button"
              onClick={goNext}
              size="lg"
              className="rounded-full bg-brand-navy-deep px-8 hover:bg-brand-navy"
            >
              Continue
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleSubmit}
              size="lg"
              disabled={!allAgreementsSigned || submitting}
              className="rounded-full bg-brand-navy-deep px-8 hover:bg-brand-navy"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting…
                </>
              ) : (
                <>Submit application</>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
