import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Check, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { reportError } from "@/components/onboarding/OrgApplicationFlow";
import { AuthShell, InfoRow, ProgressHeader, StepBar } from "@/components/onboarding/ui";
import {
  AreaField,
  ChipToggleGroup,
  FieldErrorProvider,
  PhoneField,
  SectionCard,
  SelectField,
  TextField,
} from "@/components/onboarding/fields";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ApiError,
  createOrganisation,
  fullName,
  updateOrganisation,
  useCurrentUser,
  useMyOrganisations,
  type LogisticsDomainKey,
  type NewDriverInput,
  type NewVehicleInput,
  type Vehicle,
} from "@/lib/api";
import {
  useCreateApplication,
  useCreateCompany,
  useCreateDriver,
  useCreateVehicle,
  useLogisticsApplications,
  useLogisticsCompanies,
  useLogisticsDocuments,
  useLogisticsDrivers,
  useLogisticsVehicles,
  useSaveLogisticsApplicationSection,
  useSubmitLogisticsApplication,
  useUpdateCompany,
  useUpdateDriver,
  useUpdateVehicle,
  useUploadLogisticsApplicationDocument,
} from "@/lib/api/logistics-queries";
import { allNigerianStates } from "@/lib/onboarding/data";
import { logisticsDocumentCatalogue } from "@/lib/onboarding/logistics";
import { useSession } from "@/lib/session";

const STEPS = [
  "Organisation",
  "Representative",
  "Operating Profile",
  "Fleet",
  "Drivers",
  "Compliance Declarations",
  "Evidence",
  "Review",
];

const STEP_TITLES = [
  "Register Your Logistics Organisation",
  "Authorised Representative and Responsible Officers",
  "Transport Services and Operating Coverage",
  "Register Your Transport Fleet",
  "Driver Registration and Operational Competence",
  "Transport Compliance and Operational Readiness",
  "Prepare Your Logistics Compliance Evidence",
  "Review Your Logistics Compliance Application",
];

const EVIDENCE_STEP = 6;
const REVIEW_STEP = 7;

const ORG_TYPES = [
  "Mineral Haulage Company",
  "General Logistics and Transport Company",
  "Fleet Owner / Fleet Operator",
  "Third-Party Logistics Provider",
  "Integrated Logistics and Warehousing Provider",
  "Independent Transport Service Provider",
  "Other Logistics Service Provider",
];

const SERVICES = [
  "Mine-to-warehouse transportation",
  "Mine-to-processing-facility transportation",
  "Warehouse-to-port transportation",
  "Processing-facility-to-port transportation",
  "Inter-facility transportation",
  "Bulk mineral haulage",
  "Containerized mineral transport",
  "Aggregation and collection transport",
  "Other mineral logistics services",
];

const OFFICERS = [
  ["fleet_manager", "Fleet Manager"],
  ["operations_manager", "Operations Manager"],
  ["transport_safety_manager", "Transport Safety Manager"],
  ["compliance_officer", "Compliance Officer"],
  ["maintenance_manager", "Maintenance Manager"],
  ["dispatch_coordinator", "Dispatch Coordinator"],
] as const;

// Each declaration is filed on the review domain it speaks to, so the reviewer
// reads it beside that domain's evidence.
const DECLARATIONS: {
  category: string;
  domain: LogisticsDomainKey;
  items: string[];
}[] = [
  {
    category: "Corporate registration",
    domain: "corporate",
    items: [
      "CAC incorporation evidence",
      "Tax documentation",
      "Authorised representative declaration",
      "Business operating information",
    ],
  },
  {
    category: "Transport regulatory readiness",
    domain: "regulatory",
    items: [
      "Applicable operator registration",
      "FRSC compliance declaration",
      "RTSSS information where applicable",
      "Vehicle registration",
      "Roadworthiness evidence",
      "Commercial insurance",
      "Mineral transport authorisation where applicable",
    ],
  },
  {
    category: "Vehicle safety",
    domain: "fleet",
    items: [
      "Inspection procedures",
      "Preventive maintenance",
      "Tyre and braking controls",
      "Load restraint",
      "Axle-load controls",
      "Emergency equipment",
      "Breakdown response",
    ],
  },
  {
    category: "Driver safety",
    domain: "driver",
    items: [
      "Licence readiness",
      "Driver competence",
      "Safety induction",
      "Fatigue management",
      "Incident reporting",
      "Driver fitness",
      "Emergency response",
    ],
  },
  {
    category: "Mineral cargo integrity",
    domain: "mineral",
    items: [
      "Cargo identification",
      "Loading procedures",
      "Weighbridge records",
      "Cargo sealing where applicable",
      "Material handling",
      "Loss and discrepancy reporting",
      "Chain of custody",
      "Delivery verification",
    ],
  },
  {
    category: "Environmental and operational risk",
    domain: "hs",
    items: [
      "Spill prevention",
      "Dust suppression",
      "Environmental incident procedures",
      "Route risk assessment",
      "Journey management",
      "Emergency response arrangements",
    ],
  },
];

const ACKNOWLEDGMENTS = [
  ["accuracy", "I acknowledge the accuracy of submitted information"],
  ["authority", "I have authority to submit this organisation application"],
  ["not_regulatory_approval", "I understand submission does not constitute regulatory approval"],
] as const;

const EDITABLE = ["draft", "awaiting_information", "rejected"];
const REQUIRED = "This field is required.";

const blankVehicle = {
  vehicle_reference: "",
  registration: "",
  vehicle_type: "",
  make: "",
  model: "",
  year: "",
  ownership: "",
  vin: "",
  capacity: "",
  capacity_unit: "",
  operating_status: "",
  location: "",
  maintenance_status: "",
  tracking_capability: "",
  insurance_expiry: "",
  roadworthiness_expiry: "",
  insurance_declared: false,
  roadworthiness_declared: false,
  safety_equipment_declared: false,
};

const blankDriver = {
  full_name: "",
  driver_reference: "",
  phone: "",
  employment_relationship: "",
  licence_class: "",
  licence_number: "",
  licence_expiry: "",
  years_experience: "",
  mineral_haulage_experience: "",
  operating_base: "",
  availability: "",
  emergency_contact: "",
  safety_training_declared: false,
};

const blankOperations = {
  primary_service: "",
  secondary_services: "",
  mineral_experience: "",
  minerals_transported: "",
  transport_corridors: "",
  fleet_ownership_model: "",
  service_coverage: "",
  operating_schedule: "",
  dispatch_capability: "",
  monthly_capacity: "",
  typical_shipment: "",
  maximum_load: "",
  cargo_characteristics: "",
};

/** Field messages for whichever of `names` are blank. */
function blanks(values: Record<string, unknown>, names: string[]): Record<string, string> {
  return Object.fromEntries(
    names.filter((name) => !String(values[name] ?? "").trim()).map((name) => [name, REQUIRED]),
  );
}

const withBlank = (options: string[]) => ["", ...options];

/**
 * The application a logistics company files about itself: organisation, fleet,
 * drivers, declarations and evidence. Compliance partners, who review these
 * companies, apply through OrgApplicationFlow instead.
 *
 * Every step is saved to the logistics API before moving on, so the page can be
 * left and resumed at any time.
 */
export function LogisticsCompanyApplicationFlow() {
  const navigate = useNavigate();
  const { signIn: startSession } = useSession();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");

  const user = useCurrentUser();
  const organisations = useMyOrganisations();
  const companies = useLogisticsCompanies();
  const applications = useLogisticsApplications();
  const vehicles = useLogisticsVehicles();
  const drivers = useLogisticsDrivers();
  const documents = useLogisticsDocuments();

  const createCompany = useCreateCompany();
  const updateCompany = useUpdateCompany();
  const createApplication = useCreateApplication();
  const saveSection = useSaveLogisticsApplicationSection();
  const createVehicle = useCreateVehicle();
  const updateVehicle = useUpdateVehicle();
  const createDriver = useCreateDriver();
  const updateDriver = useUpdateDriver();
  const upload = useUploadLogisticsApplicationDocument();
  const submit = useSubmitLogisticsApplication();

  const organisation = useMemo(
    () =>
      organisations.data?.results?.find((o) => o.organisation_type === "logistics_company") ?? null,
    [organisations.data],
  );
  const company = useMemo(
    () => companies.data?.results.find((c) => c.organisation === organisation?.id) ?? null,
    [companies.data, organisation],
  );
  const application = useMemo(
    () => applications.data?.results.find((a) => a.company === company?.id) ?? null,
    [applications.data, company],
  );
  const myVehicles = useMemo(
    () => (vehicles.data?.results ?? []).filter((v) => v.company === company?.id),
    [vehicles.data, company],
  );
  const myDrivers = useMemo(
    () => (drivers.data?.results ?? []).filter((d) => d.company === company?.id),
    [drivers.data, company],
  );
  const activeVehicles = myVehicles.filter((v) => v.is_active);
  const activeDrivers = myDrivers.filter((d) => d.is_active);
  const myDocuments = useMemo(
    () =>
      (documents.data?.results ?? []).filter(
        (d) => d.application === application?.id && d.is_current,
      ),
    [documents.data, application],
  );

  const [identity, setIdentity] = useState({
    name: "",
    registration_number: "",
    tax_identifier: "",
    email: "",
    phone_number: "",
    address: "",
    state: "",
    local_government_area: "",
    website: "",
    year_established: "",
    logistics_type: "",
    business_description: "",
  });
  const [representative, setRepresentative] = useState({
    name: "",
    title: "",
    email: "",
    phone: "",
    relationship: "",
    signatory: "",
    authority: false,
  });
  const [officers, setOfficers] = useState<Record<string, string>>({});
  const [operations, setOperations] = useState(blankOperations);
  const [operatingStates, setOperatingStates] = useState<string[]>([]);
  const [services, setServices] = useState<string[]>([]);
  const [vehicle, setVehicle] = useState(blankVehicle);
  const [driver, setDriver] = useState(blankDriver);
  const [declared, setDeclared] = useState<Record<string, boolean>>({});
  const [acknowledged, setAcknowledged] = useState<Record<string, boolean>>({});
  const [uploading, setUploading] = useState<string | null>(null);

  // Fill the forms from the server the first time it answers, so reopening the
  // flow shows what is actually stored.
  const settled = !organisations.isLoading && !companies.isLoading && !applications.isLoading;
  const [seeded, setSeeded] = useState(false);
  useEffect(() => {
    if (seeded || !settled || !user.data) return;
    const account = user.data;
    setRepresentative((r) => ({
      ...r,
      name: company?.representative.name ?? fullName(account),
      title: company?.representative.title ?? "",
      email: company?.representative.email ?? account.email,
      phone: company?.representative.phone ?? "",
      relationship: company?.representative.relationship ?? "",
      signatory: company?.representative.signatory ?? "",
      authority: Boolean(company?.representative.authority),
    }));
    if (organisation) {
      setIdentity((i) => ({
        ...i,
        name: organisation.name,
        registration_number: organisation.registration_number,
        tax_identifier: organisation.tax_identifier,
        email: organisation.email,
        phone_number: organisation.phone_number,
        address: organisation.address,
        state: organisation.state,
        website: organisation.website,
      }));
    }
    if (company) {
      setIdentity((i) => ({
        ...i,
        local_government_area: company.local_government_area,
        year_established: company.year_established ? String(company.year_established) : "",
        logistics_type: company.logistics_type,
        business_description: company.business_description,
      }));
      setOfficers({ ...company.responsible_officers });
      const { operating_states: states, ...profile } = company.operating_profile;
      setOperations((o) => ({ ...o, ...profile }));
      setOperatingStates(states ? states.split(", ").filter(Boolean) : []);
      setServices(company.services);
    }
    if (application) {
      const data = (key: string) => application.sections.find((s) => s.key === key)?.data ?? {};
      setDeclared(
        Object.fromEntries(
          DECLARATIONS.map((d) => [d.category, data(d.domain)["declared"] === true]),
        ),
      );
      const given = data("data");
      setAcknowledged(
        Object.fromEntries(ACKNOWLEDGMENTS.map(([key]) => [key, given[key] === true])),
      );
    }
    setSeeded(true);
  }, [seeded, settled, user.data, organisation, company, application]);

  const clearFieldError = useCallback((name: string) => {
    setFieldErrors((current) => {
      if (!(name in current)) return current;
      const next = { ...current };
      delete next[name];
      return next;
    });
  }, []);

  /** Shows the messages and reports whether there were none. */
  const check = (errors: Record<string, string>) => {
    setFieldErrors(errors);
    if (Object.keys(errors).length) {
      toast.error("Some entries need attention: see the highlighted fields.");
      return false;
    }
    return true;
  };

  const saveIdentity = async () => {
    const valid = check(
      blanks(identity, [
        "name",
        "registration_number",
        "tax_identifier",
        "email",
        "phone_number",
        "address",
        "state",
        "local_government_area",
        "year_established",
        "logistics_type",
        "business_description",
      ]),
    );
    if (!valid) return false;
    const organisationInput = {
      name: identity.name.trim(),
      registration_number: identity.registration_number.trim(),
      tax_identifier: identity.tax_identifier.trim(),
      email: identity.email.trim(),
      phone_number: identity.phone_number.replace(/[\s-]/g, ""),
      website: identity.website.trim(),
      address: identity.address.trim(),
      state: identity.state,
      country: "Nigeria",
    };
    const saved = organisation
      ? await updateOrganisation(organisation.id, organisationInput)
      : await createOrganisation({ ...organisationInput, organisation_type: "logistics_company" });
    const profile = {
      contact_email: organisationInput.email,
      contact_phone: organisationInput.phone_number,
      local_government_area: identity.local_government_area.trim(),
      year_established: Number.parseInt(identity.year_established, 10),
      logistics_type: identity.logistics_type,
      business_description: identity.business_description.trim(),
    };
    if (company) await updateCompany.mutateAsync({ id: company.id, patch: profile });
    else
      await createCompany.mutateAsync({
        ...profile,
        organisation: saved.id,
        contact_name: representative.name.trim() || (user.data ? fullName(user.data) : saved.name),
      });
    await Promise.all([organisations.refetch(), companies.refetch()]);
    return true;
  };

  const saveRepresentative = async () => {
    const errors = blanks(representative, [
      "name",
      "title",
      "email",
      "phone",
      "relationship",
      "signatory",
    ]);
    if (!representative.authority) errors["authority"] = "Declare your authority to continue.";
    if (!check(errors) || !company) return false;
    await updateCompany.mutateAsync({
      id: company.id,
      patch: {
        contact_name: representative.name.trim(),
        representative: {
          ...representative,
          phone: representative.phone.replace(/[\s-]/g, ""),
        },
        responsible_officers: Object.fromEntries(
          Object.entries(officers).filter(([, name]) => name.trim()),
        ),
      },
    });
    return true;
  };

  const saveOperations = async () => {
    const errors = blanks(operations, [
      "primary_service",
      "mineral_experience",
      "minerals_transported",
      "transport_corridors",
      "fleet_ownership_model",
      "service_coverage",
      "operating_schedule",
      "dispatch_capability",
      "monthly_capacity",
      "typical_shipment",
      "maximum_load",
    ]);
    if (!operatingStates.length) errors["operating_states"] = REQUIRED;
    if (!services.length) errors["services"] = "Select at least one service category.";
    if (!check(errors) || !company) return false;
    await updateCompany.mutateAsync({
      id: company.id,
      patch: {
        services,
        operating_profile: { ...operations, operating_states: operatingStates.join(", ") },
      },
    });
    // The application lays down its review domains from the declared services,
    // so it waits until they are known.
    if (!application) await createApplication.mutateAsync({ company: company.id });
    await applications.refetch();
    return true;
  };

  const saveDeclarations = async () => {
    const outstanding = DECLARATIONS.filter((d) => !declared[d.category]);
    if (outstanding.length) {
      setFormError(`Declare: ${outstanding.map((d) => d.category.toLowerCase()).join(", ")}.`);
      return false;
    }
    if (!application || !company) return false;
    const sections: [LogisticsDomainKey, Record<string, unknown>][] = [
      ...DECLARATIONS.map((d): [LogisticsDomainKey, Record<string, unknown>] => [
        d.domain,
        { declared: true, category: d.category, items: d.items },
      ]),
      ["operational", { declared: true, ...company.operating_profile }],
      [
        "insurance",
        {
          declared: activeVehicles.some((v) => v.insurance_declared),
          vehicles: activeVehicles.map((v) => ({
            registration: v.registration,
            insurance_declared: v.insurance_declared,
            insurance_expiry: v.insurance_expiry,
          })),
        },
      ],
    ];
    for (const [key, data] of sections) {
      await saveSection.mutateAsync({ id: application.id, key, data });
    }
    await applications.refetch();
    return true;
  };

  const saveStep = async () => {
    setFormError("");
    try {
      switch (step) {
        case 0:
          return await saveIdentity();
        case 1:
          return await saveRepresentative();
        case 2:
          return await saveOperations();
        case 3:
          if (activeVehicles.length) return true;
          setFormError("Register at least one vehicle to continue.");
          return false;
        case 4:
          if (activeDrivers.length) return true;
          setFormError("Register at least one driver to continue.");
          return false;
        case 5:
          return await saveDeclarations();
        default:
          // Evidence uploads as it is chosen, and may be finished later.
          return true;
      }
    } catch (error) {
      setFieldErrors(reportError(error, "That section could not be saved."));
      return false;
    }
  };

  const advance = async () => {
    setSaving(true);
    const saved = await saveStep();
    setSaving(false);
    if (!saved) return;
    setFieldErrors({});
    setStep((s) => Math.min(s + 1, REVIEW_STEP));
    window.scrollTo(0, 0);
  };

  const goTo = (target: number) => {
    setFormError("");
    setFieldErrors({});
    setStep(target);
    window.scrollTo(0, 0);
  };

  const addVehicle = async () => {
    const errors = blanks(vehicle, [
      "vehicle_reference",
      "registration",
      "vehicle_type",
      "make",
      "model",
      "year",
      "ownership",
      "capacity",
      "capacity_unit",
      "operating_status",
      "location",
      "maintenance_status",
      "tracking_capability",
    ]);
    if (!check(errors) || !company) return;
    const input: NewVehicleInput = {
      ...vehicle,
      company: company.id,
      year: Number.parseInt(vehicle.year, 10),
      ownership: vehicle.ownership.toLowerCase() as Vehicle["ownership"],
      capacity_unit: vehicle.capacity_unit as Vehicle["capacity_unit"],
      vin: vehicle.vin.trim(),
      insurance_expiry: vehicle.insurance_expiry || null,
      roadworthiness_expiry: vehicle.roadworthiness_expiry || null,
      is_active: true,
    };
    try {
      // A removed vehicle keeps its record, so registering it again restores it.
      const removed = myVehicles.find(
        (v) => !v.is_active && v.registration === input.registration.trim(),
      );
      if (removed) await updateVehicle.mutateAsync({ id: removed.id, patch: input });
      else await createVehicle.mutateAsync(input);
      setVehicle(blankVehicle);
      setFormError("");
      await vehicles.refetch();
    } catch (error) {
      setFieldErrors(reportError(error, "That vehicle could not be registered."));
    }
  };

  const addDriver = async () => {
    const errors = blanks(driver, [
      "full_name",
      "driver_reference",
      "phone",
      "employment_relationship",
      "licence_class",
      "licence_number",
      "licence_expiry",
      "years_experience",
      "mineral_haulage_experience",
      "operating_base",
      "availability",
    ]);
    if (!check(errors) || !company) return;
    const input: NewDriverInput = {
      ...driver,
      company: company.id,
      phone: driver.phone.replace(/[\s-]/g, ""),
      years_experience: Number.parseInt(driver.years_experience, 10),
      is_active: true,
    };
    try {
      const removed = myDrivers.find(
        (d) => !d.is_active && d.licence_number === input.licence_number.trim(),
      );
      if (removed) await updateDriver.mutateAsync({ id: removed.id, patch: input });
      else await createDriver.mutateAsync(input);
      setDriver(blankDriver);
      setFormError("");
      await drivers.refetch();
    } catch (error) {
      setFieldErrors(reportError(error, "That driver could not be registered."));
    }
  };

  const onFile = async (row: (typeof logisticsDocumentCatalogue)[number], file: File) => {
    if (!application) return;
    setUploading(row.type);
    try {
      await upload.mutateAsync({
        id: application.id,
        domain: row.domain,
        document_type: row.type,
        title: row.title,
        file,
      });
      toast.success(`${row.title} uploaded.`);
      await Promise.all([documents.refetch(), applications.refetch()]);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "That file could not be uploaded.");
    } finally {
      setUploading(null);
    }
  };

  const onSubmit = async () => {
    const outstanding = ACKNOWLEDGMENTS.filter(([key]) => !acknowledged[key]);
    if (outstanding.length) {
      setFormError("Tick all three acknowledgments to submit.");
      return;
    }
    if (!application) return;
    setFormError("");
    try {
      await saveSection.mutateAsync({ id: application.id, key: "data", data: acknowledged });
      await submit.mutateAsync(application.id);
      toast.success("Application submitted. Submission is not regulatory approval.");
      startSession("logistics", "partner");
      navigate({ to: "/logistics/partner" });
    } catch (error) {
      if (error instanceof ApiError && error.code === "application_incomplete") {
        await applications.refetch();
        setFormError("The application is not complete yet: see what is still missing below.");
        return;
      }
      setFormError(
        error instanceof ApiError ? error.message : "The application could not be submitted.",
      );
    }
  };

  if (!settled || user.isLoading) {
    return (
      <AuthShell eyebrow="Logistics Application" title="Loading your application" width="lg">
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Reading what you have saved so far.
        </p>
      </AuthShell>
    );
  }

  if (application && !EDITABLE.includes(application.status)) {
    return (
      <AuthShell
        eyebrow="Logistics Application"
        title="Your application is with Beldium"
        width="lg"
      >
        <p className="text-sm text-muted-foreground">
          It can no longer be edited while it is being reviewed. Follow its progress and answer any
          requests from your workspace.
        </p>
        <Button
          className="mt-6"
          size="lg"
          onClick={() => {
            startSession("logistics", "partner");
            navigate({ to: "/logistics/partner" });
          }}
        >
          Open workspace
        </Button>
      </AuthShell>
    );
  }

  const progress = application?.progress;
  const missingDocuments = (progress?.missing_document_types ?? []).map(
    (type) => logisticsDocumentCatalogue.find((d) => d.type === type)?.title ?? type,
  );
  const shown = (value: string | number | null | undefined) => (value ? String(value) : "-");

  return (
    <AuthShell
      eyebrow={`Logistics Application · Step ${step + 1} of ${STEPS.length}`}
      title={STEP_TITLES[step] ?? ""}
      description="Register your logistics company for Beldium compliance review. Everything here is applicant-declared until Beldium has reviewed it."
      width="lg"
    >
      <FieldErrorProvider errors={fieldErrors} clear={clearFieldError}>
        <ProgressHeader
          step={step + 1}
          total={STEPS.length}
          onBack={() => (step === 0 ? navigate({ to: "/onboarding/verify" }) : goTo(step - 1))}
        />
        <StepBar steps={STEPS} current={step} />

        {progress && (
          <p className="mt-3 text-xs text-muted-foreground">
            Saved progress: {progress.percent}% · {activeVehicles.length} vehicles ·{" "}
            {activeDrivers.length} drivers · {progress.documents_submitted} documents
          </p>
        )}

        <div className="mt-7 space-y-5">
          {step === 0 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                name="name"
                label="Registered company name"
                value={identity.name}
                onChange={(v) => setIdentity({ ...identity, name: v })}
              />
              <TextField
                name="registration_number"
                label="CAC registration number"
                value={identity.registration_number}
                onChange={(v) => setIdentity({ ...identity, registration_number: v })}
              />
              <TextField
                name="tax_identifier"
                label="Tax Identification Number"
                value={identity.tax_identifier}
                onChange={(v) => setIdentity({ ...identity, tax_identifier: v })}
              />
              <TextField
                name="email"
                label="Business email"
                type="email"
                value={identity.email}
                onChange={(v) => setIdentity({ ...identity, email: v })}
              />
              <PhoneField
                name="phone_number"
                label="Business telephone"
                placeholder="+2348030000000"
                value={identity.phone_number}
                onChange={(v) => setIdentity({ ...identity, phone_number: v })}
              />
              <TextField
                name="address"
                label="Registered business address"
                value={identity.address}
                onChange={(v) => setIdentity({ ...identity, address: v })}
              />
              <SelectField
                name="state"
                label="State"
                value={identity.state}
                onChange={(v) => setIdentity({ ...identity, state: v })}
                options={withBlank(allNigerianStates)}
              />
              <TextField
                name="local_government_area"
                label="Local Government Area"
                value={identity.local_government_area}
                onChange={(v) => setIdentity({ ...identity, local_government_area: v })}
              />
              <TextField
                name="website"
                label="Organisation website (optional)"
                placeholder="https://example.com"
                value={identity.website}
                onChange={(v) => setIdentity({ ...identity, website: v })}
              />
              <TextField
                name="year_established"
                label="Year established"
                type="number"
                placeholder="e.g. 2015"
                value={identity.year_established}
                onChange={(v) => setIdentity({ ...identity, year_established: v })}
              />
              <SelectField
                name="logistics_type"
                label="Logistics organisation type"
                value={identity.logistics_type}
                onChange={(v) => setIdentity({ ...identity, logistics_type: v })}
                options={withBlank(ORG_TYPES)}
              />
              <AreaField
                name="business_description"
                label="Business description"
                value={identity.business_description}
                onChange={(v) => setIdentity({ ...identity, business_description: v })}
                className="sm:col-span-2"
              />
            </div>
          )}

          {step === 1 && (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField
                  name="name"
                  label="Full name"
                  value={representative.name}
                  onChange={(v) => setRepresentative({ ...representative, name: v })}
                />
                <TextField
                  name="title"
                  label="Job title"
                  value={representative.title}
                  onChange={(v) => setRepresentative({ ...representative, title: v })}
                />
                <TextField
                  name="email"
                  label="Representative work email"
                  type="email"
                  value={representative.email}
                  onChange={(v) => setRepresentative({ ...representative, email: v })}
                />
                <PhoneField
                  name="phone"
                  label="Representative phone"
                  placeholder="+2348030000000"
                  value={representative.phone}
                  onChange={(v) => setRepresentative({ ...representative, phone: v })}
                />
                <TextField
                  name="relationship"
                  label="Relationship to organisation"
                  value={representative.relationship}
                  onChange={(v) => setRepresentative({ ...representative, relationship: v })}
                />
                <TextField
                  name="signatory"
                  label="Authorised signatory designation"
                  value={representative.signatory}
                  onChange={(v) => setRepresentative({ ...representative, signatory: v })}
                />
                <label className="flex items-start gap-3 rounded-[14px] border border-border px-4 py-3 sm:col-span-2">
                  <Checkbox
                    className="mt-0.5"
                    checked={representative.authority}
                    onCheckedChange={(c) => {
                      clearFieldError("authority");
                      setRepresentative({ ...representative, authority: Boolean(c) });
                    }}
                  />
                  <span className="text-sm">
                    I declare authority to represent this organisation
                  </span>
                </label>
                {fieldErrors["authority"] && (
                  <p className="text-xs text-destructive sm:col-span-2">
                    {fieldErrors["authority"]}
                  </p>
                )}
              </div>
              <SectionCard title="Responsible officers (optional)">
                <div className="grid gap-4 sm:grid-cols-2">
                  {OFFICERS.map(([key, label]) => (
                    <TextField
                      key={key}
                      name={key}
                      label={label}
                      value={officers[key] ?? ""}
                      onChange={(v) => setOfficers({ ...officers, [key]: v })}
                    />
                  ))}
                </div>
              </SectionCard>
            </>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <SelectField
                  name="primary_service"
                  label="Primary transport service"
                  value={operations.primary_service}
                  onChange={(v) => setOperations({ ...operations, primary_service: v })}
                  options={withBlank(SERVICES)}
                />
                <TextField
                  name="secondary_services"
                  label="Secondary services (optional)"
                  value={operations.secondary_services}
                  onChange={(v) => setOperations({ ...operations, secondary_services: v })}
                />
                <TextField
                  name="mineral_experience"
                  label="Mineral haulage experience"
                  value={operations.mineral_experience}
                  onChange={(v) => setOperations({ ...operations, mineral_experience: v })}
                />
                <TextField
                  name="minerals_transported"
                  label="Minerals transported"
                  value={operations.minerals_transported}
                  onChange={(v) => setOperations({ ...operations, minerals_transported: v })}
                />
                <TextField
                  name="transport_corridors"
                  label="Transport corridors"
                  value={operations.transport_corridors}
                  onChange={(v) => setOperations({ ...operations, transport_corridors: v })}
                />
                <SelectField
                  name="fleet_ownership_model"
                  label="Fleet ownership model"
                  value={operations.fleet_ownership_model}
                  onChange={(v) => setOperations({ ...operations, fleet_ownership_model: v })}
                  options={withBlank(["Owned", "Leased", "Contracted", "Mixed"])}
                />
                <SelectField
                  name="service_coverage"
                  label="Transport service coverage"
                  value={operations.service_coverage}
                  onChange={(v) => setOperations({ ...operations, service_coverage: v })}
                  options={withBlank(["Local", "National", "Regional", "International"])}
                />
                <TextField
                  name="operating_schedule"
                  label="Operating schedule"
                  value={operations.operating_schedule}
                  onChange={(v) => setOperations({ ...operations, operating_schedule: v })}
                />
                <TextField
                  name="dispatch_capability"
                  label="Dispatch capability"
                  value={operations.dispatch_capability}
                  onChange={(v) => setOperations({ ...operations, dispatch_capability: v })}
                />
                <TextField
                  name="monthly_capacity"
                  label="Estimated monthly capacity (declared)"
                  value={operations.monthly_capacity}
                  onChange={(v) => setOperations({ ...operations, monthly_capacity: v })}
                />
                <TextField
                  name="typical_shipment"
                  label="Typical shipment quantity and unit"
                  value={operations.typical_shipment}
                  onChange={(v) => setOperations({ ...operations, typical_shipment: v })}
                />
                <TextField
                  name="maximum_load"
                  label="Maximum declared load and unit"
                  value={operations.maximum_load}
                  onChange={(v) => setOperations({ ...operations, maximum_load: v })}
                />
                <SelectField
                  name="cargo_characteristics"
                  label="Cargo characteristics (optional)"
                  value={operations.cargo_characteristics}
                  onChange={(v) => setOperations({ ...operations, cargo_characteristics: v })}
                  options={withBlank(["Non-hazardous", "Hazardous"])}
                />
              </div>
              <ChipToggleGroup
                label="Operating states"
                options={allNigerianStates}
                selected={operatingStates}
                onToggle={(v) => {
                  clearFieldError("operating_states");
                  setOperatingStates((list) =>
                    list.includes(v) ? list.filter((s) => s !== v) : [...list, v],
                  );
                }}
              />
              {fieldErrors["operating_states"] && (
                <p className="text-xs text-destructive">{fieldErrors["operating_states"]}</p>
              )}
              <ChipToggleGroup
                label="Service categories"
                options={SERVICES}
                selected={services}
                onToggle={(v) => {
                  clearFieldError("services");
                  setServices((list) =>
                    list.includes(v) ? list.filter((s) => s !== v) : [...list, v],
                  );
                }}
              />
              {fieldErrors["services"] && (
                <p className="text-xs text-destructive">{fieldErrors["services"]}</p>
              )}
              <p className="text-xs text-muted-foreground">
                All capacities are applicant-declared, not verified availability.
              </p>
            </div>
          )}

          {step === 3 && (
            <>
              {activeVehicles.length > 0 && (
                <SectionCard title={`Registered vehicles (${activeVehicles.length})`}>
                  <ul className="divide-y divide-border">
                    {activeVehicles.map((v) => (
                      <li key={v.id} className="flex items-center justify-between gap-3 py-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium">
                            {v.registration} · {v.vehicle_type}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {v.vehicle_reference} · {v.capacity} {v.capacity_unit}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            void updateVehicle
                              .mutateAsync({ id: v.id, patch: { is_active: false } })
                              .then(() => vehicles.refetch())
                          }
                        >
                          Remove
                        </Button>
                      </li>
                    ))}
                  </ul>
                </SectionCard>
              )}
              <SectionCard title="Add a vehicle">
                <div className="grid gap-4 sm:grid-cols-2">
                  <TextField
                    name="vehicle_reference"
                    label="Vehicle reference"
                    value={vehicle.vehicle_reference}
                    onChange={(v) => setVehicle({ ...vehicle, vehicle_reference: v })}
                  />
                  <TextField
                    name="registration"
                    label="Registration number"
                    value={vehicle.registration}
                    onChange={(v) => setVehicle({ ...vehicle, registration: v })}
                  />
                  <SelectField
                    name="vehicle_type"
                    label="Vehicle type"
                    value={vehicle.vehicle_type}
                    onChange={(v) => setVehicle({ ...vehicle, vehicle_type: v })}
                    options={withBlank([
                      "Flatbed truck",
                      "Tipper truck",
                      "Articulated truck",
                      "Container truck",
                      "Low-bed truck",
                      "Tanker",
                      "Other transport vehicle",
                    ])}
                  />
                  <TextField
                    name="make"
                    label="Manufacturer"
                    value={vehicle.make}
                    onChange={(v) => setVehicle({ ...vehicle, make: v })}
                  />
                  <TextField
                    name="model"
                    label="Model"
                    value={vehicle.model}
                    onChange={(v) => setVehicle({ ...vehicle, model: v })}
                  />
                  <TextField
                    name="year"
                    label="Year of manufacture"
                    type="number"
                    value={vehicle.year}
                    onChange={(v) => setVehicle({ ...vehicle, year: v })}
                  />
                  <SelectField
                    name="ownership"
                    label="Ownership / lease status"
                    value={vehicle.ownership}
                    onChange={(v) => setVehicle({ ...vehicle, ownership: v })}
                    options={withBlank(["Owned", "Leased", "Contracted"])}
                  />
                  <TextField
                    name="vin"
                    label="VIN (optional)"
                    value={vehicle.vin}
                    onChange={(v) => setVehicle({ ...vehicle, vin: v })}
                  />
                  <TextField
                    name="capacity"
                    label="Rated carrying capacity"
                    type="number"
                    value={vehicle.capacity}
                    onChange={(v) => setVehicle({ ...vehicle, capacity: v })}
                  />
                  <SelectField
                    name="capacity_unit"
                    label="Capacity unit"
                    value={vehicle.capacity_unit}
                    onChange={(v) => setVehicle({ ...vehicle, capacity_unit: v })}
                    options={withBlank(["tonnes", "kg", "m3"])}
                  />
                  <SelectField
                    name="operating_status"
                    label="Operating status"
                    value={vehicle.operating_status}
                    onChange={(v) => setVehicle({ ...vehicle, operating_status: v })}
                    options={withBlank(["Available", "Maintenance", "Unavailable"])}
                  />
                  <TextField
                    name="location"
                    label="Assigned operating base"
                    value={vehicle.location}
                    onChange={(v) => setVehicle({ ...vehicle, location: v })}
                  />
                  <SelectField
                    name="maintenance_status"
                    label="Maintenance status"
                    value={vehicle.maintenance_status}
                    onChange={(v) => setVehicle({ ...vehicle, maintenance_status: v })}
                    options={withBlank(["Current", "Due", "Not declared"])}
                  />
                  <SelectField
                    name="tracking_capability"
                    label="Tracking capability"
                    value={vehicle.tracking_capability}
                    onChange={(v) => setVehicle({ ...vehicle, tracking_capability: v })}
                    options={withBlank(["Available", "Not available"])}
                  />
                  <TextField
                    name="insurance_expiry"
                    label="Insurance validity declaration"
                    type="date"
                    value={vehicle.insurance_expiry}
                    onChange={(v) => setVehicle({ ...vehicle, insurance_expiry: v })}
                  />
                  <TextField
                    name="roadworthiness_expiry"
                    label="Roadworthiness validity declaration"
                    type="date"
                    value={vehicle.roadworthiness_expiry}
                    onChange={(v) => setVehicle({ ...vehicle, roadworthiness_expiry: v })}
                  />
                </div>
                <div className="mt-4 flex flex-wrap gap-5">
                  {(
                    [
                      ["insurance_declared", "Insurance declared"],
                      ["roadworthiness_declared", "Roadworthiness declared"],
                      ["safety_equipment_declared", "Safety equipment declared"],
                    ] as const
                  ).map(([key, label]) => (
                    <label key={key} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={vehicle[key]}
                        onCheckedChange={(c) => setVehicle({ ...vehicle, [key]: Boolean(c) })}
                      />
                      {label}
                    </label>
                  ))}
                </div>
                <Button className="mt-4" onClick={() => void addVehicle()}>
                  Register vehicle
                </Button>
                <p className="mt-3 text-xs text-muted-foreground">
                  Applicant-declared record. Vehicle readiness requires separate review.
                </p>
              </SectionCard>
            </>
          )}

          {step === 4 && (
            <>
              {activeDrivers.length > 0 && (
                <SectionCard title={`Registered drivers (${activeDrivers.length})`}>
                  <ul className="divide-y divide-border">
                    {activeDrivers.map((d) => (
                      <li key={d.id} className="flex items-center justify-between gap-3 py-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium">
                            {d.full_name} · {d.driver_reference}
                          </p>
                          <p className="text-xs text-muted-foreground">{d.licence_class}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            void updateDriver
                              .mutateAsync({ id: d.id, patch: { is_active: false } })
                              .then(() => drivers.refetch())
                          }
                        >
                          Remove
                        </Button>
                      </li>
                    ))}
                  </ul>
                </SectionCard>
              )}
              <SectionCard title="Add a driver">
                <div className="grid gap-4 sm:grid-cols-2">
                  <TextField
                    name="full_name"
                    label="Driver full name"
                    value={driver.full_name}
                    onChange={(v) => setDriver({ ...driver, full_name: v })}
                  />
                  <TextField
                    name="driver_reference"
                    label="Driver reference"
                    value={driver.driver_reference}
                    onChange={(v) => setDriver({ ...driver, driver_reference: v })}
                  />
                  <PhoneField
                    name="phone"
                    label="Driver phone"
                    placeholder="+2348030000000"
                    value={driver.phone}
                    onChange={(v) => setDriver({ ...driver, phone: v })}
                  />
                  <SelectField
                    name="employment_relationship"
                    label="Employment / contractual relationship"
                    value={driver.employment_relationship}
                    onChange={(v) => setDriver({ ...driver, employment_relationship: v })}
                    options={withBlank(["Employee", "Contractor", "Owner-driver"])}
                  />
                  <SelectField
                    name="licence_class"
                    label="Licence category"
                    value={driver.licence_class}
                    onChange={(v) => setDriver({ ...driver, licence_class: v })}
                    options={withBlank(["Class E", "Class G", "Other declared category"])}
                  />
                  <TextField
                    name="licence_number"
                    label="Licence reference"
                    value={driver.licence_number}
                    onChange={(v) => setDriver({ ...driver, licence_number: v })}
                  />
                  <TextField
                    name="licence_expiry"
                    label="Licence validity date"
                    type="date"
                    value={driver.licence_expiry}
                    onChange={(v) => setDriver({ ...driver, licence_expiry: v })}
                  />
                  <TextField
                    name="years_experience"
                    label="Heavy goods experience (years)"
                    type="number"
                    value={driver.years_experience}
                    onChange={(v) => setDriver({ ...driver, years_experience: v })}
                  />
                  <TextField
                    name="mineral_haulage_experience"
                    label="Mineral haulage experience"
                    value={driver.mineral_haulage_experience}
                    onChange={(v) => setDriver({ ...driver, mineral_haulage_experience: v })}
                  />
                  <TextField
                    name="operating_base"
                    label="Driver operating base"
                    value={driver.operating_base}
                    onChange={(v) => setDriver({ ...driver, operating_base: v })}
                  />
                  <SelectField
                    name="availability"
                    label="Driver availability"
                    value={driver.availability}
                    onChange={(v) => setDriver({ ...driver, availability: v })}
                    options={withBlank(["Available", "Unavailable"])}
                  />
                  <TextField
                    name="emergency_contact"
                    label="Emergency contact (optional)"
                    value={driver.emergency_contact}
                    onChange={(v) => setDriver({ ...driver, emergency_contact: v })}
                  />
                </div>
                <label className="mt-4 flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={driver.safety_training_declared}
                    onCheckedChange={(c) =>
                      setDriver({ ...driver, safety_training_declared: Boolean(c) })
                    }
                  />
                  Safety training declared
                </label>
                <Button className="mt-4" onClick={() => void addDriver()}>
                  Register driver
                </Button>
                <p className="mt-3 text-xs text-muted-foreground">
                  Licence declarations are not government-verified.
                </p>
              </SectionCard>
            </>
          )}

          {step === 5 && (
            <>
              <p className="text-sm text-muted-foreground">
                Applicability and legal requirements are configurable by Beldium review. These are
                not universally mandatory statutory requirements or live registry checks.
              </p>
              {DECLARATIONS.map((d) => (
                <SectionCard key={d.category} title={d.category}>
                  <ul className="mb-4 grid gap-1.5 text-xs text-muted-foreground sm:grid-cols-2">
                    {d.items.map((item) => (
                      <li key={item}>• {item}</li>
                    ))}
                  </ul>
                  <label className="flex items-start gap-3 text-sm">
                    <Checkbox
                      className="mt-0.5"
                      checked={Boolean(declared[d.category])}
                      onCheckedChange={(c) =>
                        setDeclared({ ...declared, [d.category]: Boolean(c) })
                      }
                    />
                    I declare the {d.category.toLowerCase()} information is ready for review
                  </label>
                </SectionCard>
              ))}
            </>
          )}

          {step === EVIDENCE_STEP && (
            <SectionCard title="Required and conditional documents">
              <p className="mb-3 text-xs text-muted-foreground">
                Upload what you have now. Everything marked required has to be here before you can
                submit.
              </p>
              <ul className="divide-y divide-border">
                {logisticsDocumentCatalogue.map((row) => {
                  const document = myDocuments.find((d) => d.document_type === row.type);
                  return (
                    <li
                      key={row.type}
                      className="flex flex-wrap items-center justify-between gap-3 py-3"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{row.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {row.required ? "Required" : "Conditional / optional"}
                          {row.appliesWhen ? ` · ${row.appliesWhen}` : ""}
                          {document ? ` · ${document.original_name}` : " · Missing"}
                        </p>
                      </div>
                      <Button asChild variant="outline" size="sm">
                        <label className="cursor-pointer">
                          <input
                            type="file"
                            className="hidden"
                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                            disabled={uploading !== null}
                            onChange={(event) => {
                              const file = event.target.files?.[0];
                              event.target.value = "";
                              if (file) void onFile(row, file);
                            }}
                          />
                          {uploading === row.type ? (
                            <Loader2 className="mr-1 size-3 animate-spin" />
                          ) : (
                            <Upload className="mr-1 size-3" />
                          )}
                          {document ? "Replace" : "Upload"}
                        </label>
                      </Button>
                    </li>
                  );
                })}
              </ul>
            </SectionCard>
          )}

          {step === REVIEW_STEP && (
            <>
              <SectionCard
                title="Organisation identity"
                action={
                  <Button variant="ghost" size="sm" onClick={() => goTo(0)}>
                    Edit section
                  </Button>
                }
              >
                <InfoRow label="Registered name" value={shown(identity.name)} />
                <InfoRow label="CAC number" value={shown(identity.registration_number)} />
                <InfoRow label="TIN" value={shown(identity.tax_identifier)} />
                <InfoRow label="Business email" value={shown(identity.email)} />
                <InfoRow label="Business telephone" value={shown(identity.phone_number)} />
                <InfoRow label="Address" value={shown(identity.address)} />
                <InfoRow
                  label="State / LGA"
                  value={`${shown(identity.state)} / ${shown(identity.local_government_area)}`}
                />
                <InfoRow label="Website" value={shown(identity.website)} />
                <InfoRow label="Year established" value={shown(identity.year_established)} />
                <InfoRow label="Type" value={shown(identity.logistics_type)} />
                <InfoRow label="Description" value={shown(identity.business_description)} />
              </SectionCard>
              <SectionCard
                title="Authorised representative"
                action={
                  <Button variant="ghost" size="sm" onClick={() => goTo(1)}>
                    Edit section
                  </Button>
                }
              >
                <InfoRow label="Name" value={shown(representative.name)} />
                <InfoRow label="Job title" value={shown(representative.title)} />
                <InfoRow label="Email" value={shown(representative.email)} />
                <InfoRow label="Phone" value={shown(representative.phone)} />
                <InfoRow label="Relationship" value={shown(representative.relationship)} />
                <InfoRow label="Signatory" value={shown(representative.signatory)} />
                <InfoRow label="Authority" value={representative.authority ? "Declared" : "-"} />
                {OFFICERS.map(([key, label]) => (
                  <InfoRow key={key} label={label} value={shown(officers[key])} />
                ))}
              </SectionCard>
              <SectionCard
                title="Operating profile"
                action={
                  <Button variant="ghost" size="sm" onClick={() => goTo(2)}>
                    Edit section
                  </Button>
                }
              >
                <InfoRow label="Primary service" value={shown(operations.primary_service)} />
                <InfoRow label="Service categories" value={shown(services.join(", "))} />
                <InfoRow label="Secondary services" value={shown(operations.secondary_services)} />
                <InfoRow label="Mineral experience" value={shown(operations.mineral_experience)} />
                <InfoRow label="Minerals" value={shown(operations.minerals_transported)} />
                <InfoRow label="States" value={shown(operatingStates.join(", "))} />
                <InfoRow label="Corridors" value={shown(operations.transport_corridors)} />
                <InfoRow label="Ownership" value={shown(operations.fleet_ownership_model)} />
                <InfoRow label="Coverage" value={shown(operations.service_coverage)} />
                <InfoRow label="Schedule" value={shown(operations.operating_schedule)} />
                <InfoRow label="Dispatch" value={shown(operations.dispatch_capability)} />
                <InfoRow label="Monthly capacity" value={shown(operations.monthly_capacity)} />
                <InfoRow label="Typical shipment" value={shown(operations.typical_shipment)} />
                <InfoRow label="Maximum load" value={shown(operations.maximum_load)} />
                <InfoRow label="Cargo" value={shown(operations.cargo_characteristics)} />
              </SectionCard>
              <SectionCard
                title={`Fleet (${activeVehicles.length})`}
                action={
                  <Button variant="ghost" size="sm" onClick={() => goTo(3)}>
                    Edit section
                  </Button>
                }
              >
                {activeVehicles.map((v) => (
                  <InfoRow
                    key={v.id}
                    label={v.registration}
                    value={`${v.capacity} ${v.capacity_unit}`}
                  />
                ))}
              </SectionCard>
              <SectionCard
                title={`Drivers (${activeDrivers.length})`}
                action={
                  <Button variant="ghost" size="sm" onClick={() => goTo(4)}>
                    Edit section
                  </Button>
                }
              >
                {activeDrivers.map((d) => (
                  <InfoRow key={d.id} label={d.full_name} value={d.licence_class} />
                ))}
              </SectionCard>
              <SectionCard
                title="Compliance declarations"
                action={
                  <Button variant="ghost" size="sm" onClick={() => goTo(5)}>
                    Edit section
                  </Button>
                }
              >
                {DECLARATIONS.map((d) => (
                  <InfoRow
                    key={d.category}
                    label={d.category}
                    value={declared[d.category] ? "Declared" : "Missing"}
                  />
                ))}
              </SectionCard>
              <SectionCard
                title="Evidence"
                action={
                  <Button variant="ghost" size="sm" onClick={() => goTo(EVIDENCE_STEP)}>
                    Edit section
                  </Button>
                }
              >
                <InfoRow label="Documents supplied" value={String(myDocuments.length)} />
                {missingDocuments.length > 0 && (
                  <p className="mt-2 text-xs text-destructive">
                    Missing: {missingDocuments.join(", ")}
                  </p>
                )}
              </SectionCard>
              <div className="space-y-3">
                {ACKNOWLEDGMENTS.map(([key, label]) => (
                  <label key={key} className="flex items-start gap-3 text-sm">
                    <Checkbox
                      className="mt-0.5"
                      checked={Boolean(acknowledged[key])}
                      onCheckedChange={(c) =>
                        setAcknowledged({ ...acknowledged, [key]: Boolean(c) })
                      }
                    />
                    {label}
                  </label>
                ))}
              </div>
            </>
          )}
        </div>

        {formError && (
          <p role="alert" className="mt-5 text-sm text-destructive">
            {formError}
          </p>
        )}

        <div className="mt-7 flex flex-wrap gap-3">
          {step < REVIEW_STEP ? (
            <Button size="lg" disabled={saving} onClick={() => void advance()}>
              {saving ? "Saving…" : "Save and continue"}
            </Button>
          ) : (
            <Button
              size="lg"
              disabled={submit.isPending || saveSection.isPending}
              onClick={() => void onSubmit()}
            >
              <Check className="mr-1 size-4" />
              {submit.isPending ? "Submitting…" : "Submit compliance application"}
            </Button>
          )}
          {step > 0 && (
            <Button size="lg" variant="ghost" onClick={() => goTo(step - 1)}>
              Back
            </Button>
          )}
        </div>
      </FieldErrorProvider>
    </AuthShell>
  );
}
