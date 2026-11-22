// Sends a completed independent-operator application to the Beldium logistics
// API, so it appears in the compliance desk's Logistics queue for vetting.
//
// Each step records its backend id on the application (`backend`), so a retry
// after a partial failure resumes instead of creating duplicate records.

import { apiFetch } from "@/lib/api/client";
import { createOrganisation } from "@/lib/api/organisations";
import {
  type LogisticsDomainKey,
  type NewDriverInput,
  type NewVehicleInput,
  createApplication,
  createCompany,
  createDriver,
  createVehicle,
  getApplication,
  saveLogisticsApplicationSection,
  submitLogisticsApplication,
  uploadLogisticsApplicationDocument,
} from "@/lib/api/logistics";

import {
  type IndependentApplication,
  type IndependentBackendState,
  applicableReqs,
  val,
} from "./model";

/** Evidence requirement id -> backend document type and review domain. */
export const EVIDENCE_TO_DOCUMENT: Record<string, { type: string; domain: LogisticsDomainKey }> = {
  identity: { type: "logistics_representative_declaration", domain: "corporate" },
  business: { type: "logistics_cac_incorporation", domain: "corporate" },
  tax: { type: "logistics_tax_documentation", domain: "corporate" },
  licence: { type: "logistics_driver_schedule", domain: "driver" },
  frsc: { type: "logistics_transport_authorization", domain: "regulatory" },
  vehicleDocs: { type: "logistics_vehicle_schedule", domain: "fleet" },
  ownerAuth: { type: "logistics_lease_declaration", domain: "fleet" },
  insurance: { type: "logistics_vehicle_insurance", domain: "insurance" },
  maintenance: { type: "logistics_maintenance_procedures", domain: "hs" },
  hse: { type: "logistics_hse_declaration", domain: "hs" },
  mineral: { type: "logistics_mineral_haulage_authorization", domain: "mineral" },
  hazard: { type: "logistics_hazardous_cargo_procedure", domain: "hs" },
  corridor: { type: "logistics_corridor_risk_declaration", domain: "operational" },
};

const sectionData = (a: IndependentApplication): Record<LogisticsDomainKey, Record<string, unknown>> => {
  const services = val(a.profile, "services") ?? "";
  return {
    corporate: { declared: true, operator_type: val(a.profile, "operatorType") },
    regulatory: { declared: true, transport_authorization: Boolean(a.authorizations["frsc"]) },
    fleet: {
      declared: true,
      vehicles: a.vehicles.map((v) => ({ registration: v.registration, ownership: v.ownership })),
    },
    driver: {
      declared: true,
      licence_class: val(a.licence, "class"),
      licence_expiry: val(a.licence, "expiry"),
      competence: val(a.licence, "competence"),
    },
    insurance: { declared: Boolean(a.authorizations["insurance"]) },
    hs: {
      declared: true,
      maintenance: Boolean(a.authorizations["maintenance"]),
      hse: Boolean(a.authorizations["hse"]),
    },
    operational: {
      declared: true,
      corridors: val(a.scope, "corridors"),
      safety: val(a.scope, "safety"),
      services,
    },
    mineral: { declared: true, minerals: val(a.scope, "minerals") },
    data: { declared: true, platform: "Beldium Logistics Hub" },
  };
};

export interface BackendSubmitInput {
  application: IndependentApplication;
  files: Record<string, File>;
  persist: (backend: IndependentBackendState) => void;
}

/**
 * Creates the organisation, company, vehicles, driver, application sections and
 * documents on the backend, then submits. Returns the backend application id.
 */
export async function submitIndependentToBackend({
  application: a,
  files,
  persist,
}: BackendSubmitInput): Promise<string> {
  const b: IndependentBackendState = { vehicles: {}, documents: {}, ...a.backend };
  const first = val(a.personal, "firstName") ?? "";
  const last = val(a.personal, "lastName") ?? "";
  const fullName = `${first} ${last}`.trim();
  const email = val(a.personal, "email") ?? "";
  const phone = (val(a.personal, "phone") ?? "").replace(/[\s-]/g, "");
  const registered = val(a.profile, "registeredBusiness") === "Yes";
  const businessName = registered ? val(a.profile, "businessName") : undefined;
  const services = (val(a.profile, "services") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (!b.organisation) {
    const org = await createOrganisation({
      name: businessName || fullName,
      organisation_type: "logistics_company",
      registration_number: registered ? val(a.profile, "bnNumber") : "",
      email,
      phone_number: phone,
      address: val(a.personal, "address"),
      state: val(a.personal, "state"),
      country: "Nigeria",
    });
    b.organisation = org.id;
    persist({ ...b });
  }

  if (!b.company) {
    const company = await createCompany({
      organisation: b.organisation,
      contact_name: fullName,
      contact_email: email,
      contact_phone: phone,
      services,
    });
    b.company = company.id;
    persist({ ...b });
    // The representative and operating profile are not in the typed client; the
    // backend accepts them on the company record, so they are saved in one patch.
    await apiFetch(`/logistics/companies/${company.id}/`, {
      method: "PATCH",
      body: {
        representative: {
          name: fullName,
          email,
          phone,
          relationship: "Owner-driver",
          signatory: fullName,
          authority: true,
        },
        operating_profile: {
          primary_service: services[0],
          operating_states: val(a.scope, "states"),
          transport_corridors: val(a.scope, "corridors"),
          minerals_transported: val(a.scope, "minerals"),
          monthly_capacity: val(a.scope, "monthlyCapacity"),
        },
      },
    });
  }
  const company = b.company;

  for (const v of a.vehicles) {
    if (b.vehicles[v.id]) continue;
    // The backend fills the optional fields (VIN, GPS). VIN is left out entirely:
    // sending null breaks the backend's VIN validation.
    const vehicle = await createVehicle({
      insurer: "",
      location: "",
      gps_status: "unknown",
      is_active: true,
      company,
      registration: v.registration,
      vehicle_type: v.type,
      make: v.make ?? "",
      model: v.model ?? "",
      year: v.year ?? new Date().getFullYear(),
      capacity: String(v.payload),
      capacity_unit: "tonnes",
      ownership: v.ownership.toLowerCase() as "owned" | "leased" | "contracted",
      insurance_expiry: v.insuranceExpiry,
      roadworthiness_expiry: v.roadworthinessExpiry,
    } as NewVehicleInput);
    b.vehicles[v.id] = vehicle.id;
    persist({ ...b, vehicles: { ...b.vehicles } });
  }

  if (!b.driver) {
    const driver = await createDriver({
      is_active: true,
      national_id: "",
      training: [] as string[],
      medical_expiry: null,
      company,
      full_name: fullName,
      licence_number: val(a.licence, "number") ?? "",
      licence_class: val(a.licence, "class") ?? "",
      licence_expiry: val(a.licence, "expiry") ?? "",
      years_experience: Number(val(a.profile, "experience") ?? 0) || 0,
      assigned_vehicle: a.vehicles[0] ? (b.vehicles[a.vehicles[0].id] ?? null) : null,
    } as unknown as NewDriverInput);
    b.driver = driver.id;
    persist({ ...b });
  }

  if (!b.application) {
    const application = await createApplication({ company });
    b.application = application.id;
    persist({ ...b });
  }
  const applicationId = b.application;

  const sections = (await getApplication(applicationId)).sections;
  const data = sectionData(a);
  for (const section of sections) {
    if (!section.applicable) continue;
    if (section.data && Object.keys(section.data).length) continue;
    await saveLogisticsApplicationSection(applicationId, section.key, data[section.key]);
  }

  for (const req of applicableReqs(a)) {
    const mapping = EVIDENCE_TO_DOCUMENT[req.id];
    const file = files[req.id];
    if (!mapping || !file || b.documents[req.id]) continue;
    const document = await uploadLogisticsApplicationDocument(applicationId, {
      domain: mapping.domain,
      document_type: mapping.type,
      title: req.name,
      file,
    });
    b.documents[req.id] = document.id;
    persist({ ...b, documents: { ...b.documents } });
  }

  await submitLogisticsApplication(applicationId);
  return applicationId;
}
