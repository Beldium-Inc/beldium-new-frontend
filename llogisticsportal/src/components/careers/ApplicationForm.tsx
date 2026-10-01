/* eslint-disable @typescript-eslint/no-explicit-any -- migrated as-is from the standalone Careers Hub; form values are typed loosely across pathway schemas. */
import { useEffect, useMemo, useState } from "react";
import { useForm, type UseFormReturn } from "react-hook-form";

type AnyForm = UseFormReturn<any>;
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Loader2, Shield } from "lucide-react";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/careers/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileDropzone } from "@/components/careers/FileDropzone";
import {
  PATHWAY_META,
  generateReferenceId,
  schemaFor,
  type Pathway,
} from "@/lib/careers/application-schemas";
import {
  APPLICATION_DOCUMENTS_BUCKET,
  SupabaseNotConfiguredError,
  supabase,
} from "@/lib/careers/supabase";
import { ApplicationsUnavailable } from "@/components/careers/ApplicationsUnavailable";
import { cn } from "@/lib/utils";

interface ApplicationFormProps {
  pathway: Pathway;
  onBack: () => void;
  onSubmitted: (referenceId: string) => void;
}

/* ---------- small helpers ---------- */

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
}: {
  form: AnyForm;
  name: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  rows?: number;
}) {
  const err = (form.formState.errors as any)[name]?.message as string | undefined;
  return (
    <div className="space-y-1.5">
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

function SelectField({
  form,
  name,
  label,
  options,
  placeholder,
  required,
}: {
  form: AnyForm;
  name: string;
  label: string;
  options: { value: string; label: string }[];
  placeholder?: string;
  required?: boolean;
}) {
  const err = (form.formState.errors as any)[name]?.message as string | undefined;
  const value = form.watch(name) as string | undefined;
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      <Select
        value={value ?? ""}
        onValueChange={(v) => form.setValue(name, v, { shouldValidate: true, shouldDirty: true })}
      >
        <SelectTrigger id={name} aria-invalid={!!err}>
          <SelectValue placeholder={placeholder ?? "Select…"} />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {err && <p className="text-xs font-medium text-destructive">{err}</p>}
    </div>
  );
}

function SectionTitle({
  step,
  title,
  description,
}: {
  step: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mb-6 flex items-start gap-4">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-navy-deep font-display text-sm font-bold text-white">
        {step}
      </span>
      <div className="min-w-0">
        <h3 className="font-display text-lg font-bold text-brand-navy-deep">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

/* ---------- form ---------- */

export function ApplicationForm({ pathway, onBack, onSubmitted }: ApplicationFormProps) {
  const meta = PATHWAY_META[pathway];
  const schema = useMemo(() => schemaFor(pathway), [pathway]);

  const form = useForm<any>({
    resolver: zodResolver(schema as any) as any,
    mode: "onBlur",
    defaultValues: {},
  });

  const [resume, setResume] = useState<File | null>(null);
  const [headshot, setHeadshot] = useState<File | null>(null);
  const [companyProfile, setCompanyProfile] = useState<File | null>(null);
  const [consent, setConsent] = useState(false);
  const [notHuman, setNotHuman] = useState(true); // simple honeypot / bot check
  const [confirmHuman, setConfirmHuman] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    form.reset({});
    setResume(null);
    setHeadshot(null);
    setCompanyProfile(null);
    setConsent(false);
    setConfirmHuman(false);
  }, [pathway]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync file names into RHF so schema validation catches missing required files
  useEffect(() => {
    form.setValue("resumeName", resume?.name ?? "", {
      shouldValidate: form.formState.isSubmitted,
    });
  }, [resume]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    form.setValue("headshotName", headshot?.name ?? "");
  }, [headshot]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (pathway === "partnership") {
      form.setValue("companyProfileName", companyProfile?.name ?? "", {
        shouldValidate: form.formState.isSubmitted,
      });
    }
  }, [companyProfile, pathway]); // eslint-disable-line react-hooks/exhaustive-deps

  async function onSubmit(values: Record<string, unknown>) {
    if (!consent) {
      toast.error("Please accept the data & privacy consent to continue.");
      return;
    }
    if (!confirmHuman) {
      toast.error("Please confirm you are not a robot.");
      return;
    }
    if (!notHuman) return; // honeypot, silent

    setSubmitting(true);
    try {
      const referenceId = generateReferenceId(pathway);

      async function uploadFile(file: File | null, label: string) {
        if (!file) return null;
        const path = `${referenceId}/${label}-${file.name}`;
        const { error } = await supabase.storage
          .from(APPLICATION_DOCUMENTS_BUCKET)
          .upload(path, file, { upsert: false });
        if (error) throw error;
        return path;
      }

      const [resumePath, headshotPath, companyProfilePath] = await Promise.all([
        uploadFile(resume, "resume"),
        uploadFile(headshot, "headshot"),
        uploadFile(companyProfile, "company-profile"),
      ]);

      const {
        fullName,
        email,
        phone,
        country,
        state,
        city,
        linkedin,
        portfolio,
        resumeName,
        headshotName,
        companyProfileName,
        ...rest
      } = values as Record<string, unknown>;

      const { error } = await supabase.from("applications").insert({
        reference_id: referenceId,
        pathway,
        full_name: fullName,
        email,
        phone,
        country,
        state,
        city,
        linkedin,
        portfolio: portfolio || null,
        resume_path: resumePath,
        headshot_path: headshotPath,
        company_profile_path: companyProfilePath,
        answers: rest,
      });
      if (error) throw error;

      const documents = [
        resumePath && {
          label: "Resume / CV",
          bucket: APPLICATION_DOCUMENTS_BUCKET,
          path: resumePath,
        },
        headshotPath && {
          label: "Professional headshot",
          bucket: APPLICATION_DOCUMENTS_BUCKET,
          path: headshotPath,
        },
        companyProfilePath && {
          label: "Company profile",
          bucket: APPLICATION_DOCUMENTS_BUCKET,
          path: companyProfilePath,
        },
      ].filter(Boolean);

      supabase.functions
        .invoke("bright-api", {
          body: {
            kind: "application",
            referenceId,
            answers: {
              Pathway: meta.title,
              "Full name": fullName,
              Email: email,
              Phone: phone,
              Country: country,
              State: state,
              City: city,
              LinkedIn: linkedin,
              Portfolio: portfolio,
              ...rest,
            },
            documents,
          },
        })
        .catch((err) => console.error("bright-api notify failed", err));

      onSubmitted(referenceId);
    } catch (err) {
      console.error(err);
      toast.error(
        err instanceof SupabaseNotConfiguredError
          ? err.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="mx-auto w-full max-w-4xl" noValidate>
      <ApplicationsUnavailable />
      {/* Honeypot */}
      <input
        type="text"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute h-0 w-0 opacity-0"
        onChange={(e) => setNotHuman(e.target.value.length === 0)}
      />

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex w-fit items-center gap-2 text-sm font-medium text-brand-navy-soft transition hover:text-brand-navy-deep"
        >
          <ArrowLeft className="h-4 w-4" />
          Choose a different pathway
        </button>
        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-brand-navy/15 bg-white/70 px-3 py-1 text-xs font-semibold tracking-[0.18em] text-brand-navy-deep uppercase">
          {meta.title}
        </span>
      </div>

      <div className="glass-card rounded-3xl p-6 sm:p-10">
        <div className="mb-8 border-b border-border pb-6">
          <h2 className="font-display text-3xl font-bold text-brand-navy-deep">
            {meta.title} application
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">{meta.blurb}</p>
        </div>

        {/* Common */}
        <section className="mb-10">
          <SectionTitle
            step="01"
            title="About you"
            description="Contact information we'll use to reach you."
          />
          <div className="grid gap-5 sm:grid-cols-2">
            <Field form={form} name="fullName" label="Full name" required />
            <Field form={form} name="email" label="Email address" type="email" required />
            <Field
              form={form}
              name="phone"
              label="Phone (with country code)"
              placeholder="+234 800 000 0000"
              required
            />
            <Field form={form} name="country" label="Country" required />
            <Field form={form} name="state" label="State / Province" required />
            <Field form={form} name="city" label="City" required />
            <Field
              form={form}
              name="linkedin"
              label="LinkedIn profile"
              placeholder="https://linkedin.com/in/…"
              required
              className="sm:col-span-2"
            />
            <Field
              form={form}
              name="portfolio"
              label="Portfolio / website (optional)"
              placeholder="https://…"
              className="sm:col-span-2"
            />
          </div>

          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <FileDropzone
              id="resume"
              label="Resume / CV"
              description="PDF or DOCX, up to 8MB"
              accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              required
              value={resume}
              onChange={setResume}
              error={form.formState.errors["resumeName"]?.message as string | undefined}
            />
            <FileDropzone
              id="headshot"
              label="Professional headshot (optional)"
              description="JPG or PNG, up to 8MB"
              accept="image/png,image/jpeg"
              value={headshot}
              onChange={setHeadshot}
            />
          </div>
        </section>

        {/* Pathway-specific */}
        {pathway === "internship" && (
          <section className="mb-10">
            <SectionTitle
              step="02"
              title="Academic & experience"
              description="Help us place you with the right team."
            />
            <div className="grid gap-5 sm:grid-cols-2">
              <Field form={form} name="university" label="University / Institution" required />
              <Field form={form} name="courseOfStudy" label="Course of study" required />
              <Field
                form={form}
                name="graduationYear"
                label="Graduation year"
                placeholder="2026"
                required
              />
              <SelectField
                form={form}
                name="currentLevel"
                label="Current level"
                required
                options={[
                  { value: "100", label: "100 Level / Year 1" },
                  { value: "200", label: "200 Level / Year 2" },
                  { value: "300", label: "300 Level / Year 3" },
                  { value: "400", label: "400 Level / Year 4" },
                  { value: "500", label: "500 Level / Year 5" },
                  { value: "postgrad", label: "Postgraduate" },
                  { value: "graduate", label: "Recent graduate" },
                ]}
              />
              <AreaField form={form} name="relevantSkills" label="Relevant skills" required />
              <AreaField
                form={form}
                name="softwareExperience"
                label="Software experience"
                placeholder="Tools, platforms, languages…"
                required
              />
              <AreaField form={form} name="areasOfInterest" label="Areas of interest" required />
              <AreaField
                form={form}
                name="motivation"
                label="Why do you want to intern at Beldium?"
                rows={5}
                required
              />
              <SelectField
                form={form}
                name="weeklyAvailability"
                label="Weekly availability"
                required
                options={[
                  { value: "10", label: "Up to 10 hrs / week" },
                  { value: "20", label: "10 – 20 hrs / week" },
                  { value: "30", label: "20 – 30 hrs / week" },
                  { value: "40", label: "Full-time (40 hrs)" },
                ]}
              />
              <SelectField
                form={form}
                name="hasLaptop"
                label="Do you have a laptop?"
                required
                options={[
                  { value: "yes", label: "Yes" },
                  { value: "no", label: "No" },
                ]}
              />
              <SelectField
                form={form}
                name="internetReliability"
                label="Internet reliability"
                required
                options={[
                  { value: "excellent", label: "Excellent (fibre / 5G)" },
                  { value: "reliable", label: "Reliable most days" },
                  { value: "intermittent", label: "Intermittent" },
                ]}
              />
              <Field
                form={form}
                name="earliestStartDate"
                label="Earliest start date"
                type="date"
                required
              />
            </div>
          </section>
        )}

        {pathway === "volunteer" && (
          <section className="mb-10">
            <SectionTitle
              step="02"
              title="Experience & availability"
              description="Tell us where your expertise fits best."
            />
            <div className="grid gap-5 sm:grid-cols-2">
              <Field form={form} name="occupation" label="Current occupation" required />
              <Field form={form} name="expertise" label="Area of expertise" required />
              <Field
                form={form}
                name="yearsExperience"
                label="Years of experience"
                type="number"
                required
              />
              <SelectField
                form={form}
                name="weeklyAvailability"
                label="Weekly availability"
                required
                options={[
                  { value: "5", label: "Up to 5 hrs / week" },
                  { value: "10", label: "5 – 10 hrs / week" },
                  { value: "20", label: "10 – 20 hrs / week" },
                  { value: "20+", label: "20+ hrs / week" },
                ]}
              />
              <AreaField
                form={form}
                name="background"
                label="Professional background"
                rows={4}
                required
              />
              <AreaField form={form} name="skills" label="Skills" required />
              <AreaField
                form={form}
                name="previousVolunteer"
                label="Previous volunteer experience (optional)"
              />
              <SelectField
                form={form}
                name="preferredTeam"
                label="Preferred logistics team"
                required
                options={[
                  { value: "operations", label: "Operations & Dispatch" },
                  { value: "technology", label: "Technology & Product" },
                  { value: "community", label: "Community & Partnerships" },
                  { value: "design", label: "Design & Brand" },
                  { value: "data", label: "Data & Analytics" },
                  { value: "safety", label: "Safety & Compliance" },
                ]}
              />
              <AreaField
                form={form}
                name="motivation"
                label="Motivation for joining"
                rows={5}
                required
              />
              <AreaField
                form={form}
                name="references"
                label="References (optional)"
                placeholder="Name, role, contact…"
              />
            </div>
          </section>
        )}

        {pathway === "partnership" && (
          <section className="mb-10">
            <SectionTitle
              step="02"
              title="Company & partnership vision"
              description="Details about your organisation and how we might build together."
            />
            <div className="grid gap-5 sm:grid-cols-2">
              <Field form={form} name="companyName" label="Company name" required />
              <Field form={form} name="website" label="Website" placeholder="https://…" required />
              <Field form={form} name="industry" label="Industry" required />
              <SelectField
                form={form}
                name="companySize"
                label="Company size"
                required
                options={[
                  { value: "1-10", label: "1 – 10" },
                  { value: "11-50", label: "11 – 50" },
                  { value: "51-200", label: "51 – 200" },
                  { value: "201-1000", label: "201 – 1,000" },
                  { value: "1000+", label: "1,000+" },
                ]}
              />
              <Field form={form} name="contactPerson" label="Primary contact person" required />
              <Field form={form} name="position" label="Position" required />
              <Field form={form} name="companyCountry" label="Company country" required />
              <Field
                form={form}
                name="fleetSize"
                label="Fleet size (if applicable)"
                placeholder="e.g. 25 vehicles"
              />
              <AreaField form={form} name="services" label="Services offered" required />
              <AreaField
                form={form}
                name="challenges"
                label="Existing challenges"
                rows={5}
                required
              />
              <AreaField
                form={form}
                name="collaborationAreas"
                label="Areas of collaboration"
                required
              />
              <AreaField
                form={form}
                name="expectedOutcome"
                label="Expected partnership outcome"
                required
              />
              <AreaField form={form} name="additionalNotes" label="Additional notes (optional)" />
            </div>

            <div className="mt-6">
              <FileDropzone
                id="companyProfile"
                label="Company profile upload"
                description="PDF or DOCX, up to 8MB"
                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                required
                value={companyProfile}
                onChange={setCompanyProfile}
                error={form.formState.errors["companyProfileName"]?.message as string | undefined}
              />
            </div>
          </section>
        )}

        {/* Consent + submit */}
        <section className="border-t border-border pt-8">
          <SectionTitle
            step="03"
            title="Consent & submit"
            description="A quick confirmation and you're done."
          />
          <div className="space-y-4 rounded-2xl bg-brand-mist/50 p-5">
            <label className="flex items-start gap-3 text-sm text-brand-navy-deep">
              <Checkbox
                checked={consent}
                onCheckedChange={(v) => setConsent(!!v)}
                className="mt-0.5"
              />
              <span>
                I consent to Beldium processing my application data and uploaded documents for
                recruitment and partnership purposes, in line with Beldium&apos;s privacy practices.
              </span>
            </label>
            <label className="flex items-start gap-3 text-sm text-brand-navy-deep">
              <Checkbox
                checked={confirmHuman}
                onCheckedChange={(v) => setConfirmHuman(!!v)}
                className="mt-0.5"
              />
              <span className="inline-flex items-center gap-2">
                <Shield className="h-4 w-4 text-brand-navy-soft" />I confirm I am a human submitting
                my own application.
              </span>
            </label>
          </div>

          <div className="mt-8 flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">
              Your data is transmitted securely. A confirmation email will be sent to the address
              above.
            </p>
            <Button
              type="submit"
              size="lg"
              disabled={submitting}
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
          </div>
        </section>
      </div>
    </form>
  );
}
