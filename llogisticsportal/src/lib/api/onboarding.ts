import { runPool } from "../batch";
import { formatPhoneNumber } from "../phone";
import {
  getState,
  recordServerId,
  requiredDomains,
  type DraftState,
  type VehicleRecord,
} from "../onboarding-store";
import {
  createApplication,
  createCompany,
  createDriver,
  createVehicle,
  fetchLogisticsDashboard,
  saveLogisticsApplicationSection,
  submitLogisticsApplication,
  uploadLogisticsApplicationDocument,
  type LogisticsDomainKey,
  type Vehicle,
} from "./logistics";
import { createOrganisation } from "./organisations";
import type { User, UUID } from "./types";

// Submits the application draft in the order the backend's foreign keys need:
//
//   organisation → company → application → sections → vehicles → drivers
//                → documents → submit
//
// Every record the API creates is written back into the draft (`server`), and
// an account that already has a company reuses it, so a failure part-way
// through resumes on retry instead of tripping the duplicate-organisation guard.

/** Files can't live in the localStorage draft, so the wizard parks them here until upload. */
export const pendingDocumentFiles = new Map<string, File>();

const OWNERSHIP: Record<string, Vehicle["ownership"]> = {
  Owned: "owned",
  Leased: "leased",
  Subcontracted: "contracted",
};

function gps(v: VehicleRecord): Vehicle["gps_status"] {
  if (v.trackerInstalled !== "Yes") return "inactive";
  return v.trackerId ? "active" : "unknown";
}

const orNull = (value: string) => (value ? value : null);

/** Section payloads: the backend needs non-empty data for every applicable domain. */
function sectionData(d: DraftState): Record<LogisticsDomainKey, Record<string, unknown>> {
  const org = d.organisation!;
  const cap = d.capability!;
  const answers = d.compliance;
  const docsFor = (domain: LogisticsDomainKey) =>
    d.documents
      .filter((x) => x.domain === domain)
      .map((x) => ({ type: x.type, number: x.number, expires: x.expiryDate }));
  return {
    corporate: { ...org },
    regulatory: {
      registration_number: org.registrationNumber,
      tax_identifier: org.tin,
      organisation_type: org.orgType,
      licences: docsFor("regulatory"),
    },
    fleet: {
      fleet_size: cap.fleetSize,
      vehicle_categories: cap.vehicleCategories,
      max_capacity_tonnes: cap.maxCapacity,
      vehicles: d.vehicles.map((v) => ({
        registration: v.registration,
        type: v.type,
        status: v.operatingStatus,
      })),
      inspection_records: answers["Do you maintain vehicle inspection records?"],
      maintenance_records: answers["Do you maintain vehicle maintenance records?"],
    },
    driver: {
      drivers: d.drivers.map((x) => ({
        name: x.name,
        licence_class: x.licenceClass,
        safety: x.safetyStatus,
      })),
      verified_before_assignment: answers["Do you verify drivers before assignment?"],
      licence_expiry_records: answers["Do you maintain driver licence expiry records?"],
    },
    insurance: {
      vehicles: d.vehicles.map((v) => ({
        registration: v.registration,
        insurer: v.insurer,
        expires: v.insuranceExpiry,
      })),
      policies: docsFor("insurance"),
    },
    hs: {
      emergency_response: answers["Do you have emergency response procedures?"],
      incident_records: answers["Do you maintain incident records?"],
      journey_management: answers["Do you operate journey management procedures?"],
    },
    operational: {
      participant_type: cap.participantType,
      services: cap.services,
      operating_states: cap.operatingStates,
      routes_covered: cap.routesCovered,
      security: cap.security,
      pickup_delivery_evidence: answers["Do you maintain pickup and delivery evidence?"],
      cargo_handover_records: answers["Do you maintain quantity / cargo handover records?"],
    },
    mineral: {
      minerals: cap.minerals,
      sample_chain_of_custody: cap.sampleCustody,
      chain_of_custody: answers["Do you support chain of custody?"],
    },
    data: {
      tracking: cap.tracking,
      active_tracking: answers["Do vehicles have active tracking?"],
      trackers: d.vehicles
        .filter((v) => v.trackerId)
        .map((v) => ({ registration: v.registration, tracker: v.trackerId })),
      declarations: d.declarations,
    },
  };
}

/** Documents whose file was lost (page reload before upload) and must be re-attached. */
export function missingFiles(d: DraftState) {
  return d.documents.filter(
    (doc) => !d.server.documents[doc.id] && !pendingDocumentFiles.has(doc.id),
  );
}

/** How many requests go to the API at once while the application is sent. */
const SEND_CONCURRENCY = 4;

export type SubmitProgress = { label: string; done: number; total: number };

export async function submitOperatorApplication(
  user: User,
  onProgress?: (progress: SubmitProgress) => void,
): Promise<{ applicationId: UUID }> {
  const draft = getState();
  const org = draft.organisation;
  const cap = draft.capability;
  if (!org || !cap) throw new Error("The application is incomplete.");

  const lost = missingFiles(draft);
  if (lost.length) {
    throw new Error(
      `Re-attach the file for: ${lost.map((d) => d.type).join(", ")} (files are not kept after a page reload).`,
    );
  }

  const phone = formatPhoneNumber(org.phone || user.phone_number);

  // An account that already registered a company (another device, an earlier
  // attempt) continues that record rather than creating a second one.
  if (!getState().server.company) {
    const existing = (await fetchLogisticsDashboard()).companies[0];
    if (existing) {
      recordServerId({
        company: existing.company_id,
        application: existing.application_id ?? undefined,
      });
    }
  }

  if (!getState().server.company) {
    if (!getState().server.organisation) {
      const organisation = await createOrganisation({
        name: org.name,
        organisation_type: "logistics_company",
        registration_number: org.registrationNumber,
        tax_identifier: org.tin,
        email: org.email || user.email,
        phone_number: phone,
        website: org.website,
        address: org.registeredAddress,
        country: user.country || "Nigeria",
        state: org.state,
      });
      recordServerId({ organisation: organisation.id });
    }
    const company = await createCompany({
      organisation: getState().server.organisation!,
      contact_name: org.primaryContact || `${user.first_name} ${user.last_name}`.trim(),
      contact_email: org.email || user.email,
      contact_phone: phone,
      incorporated_on: org.yearEstablished ? `${org.yearEstablished}-01-01` : null,
      employees: Number(org.employees) || 0,
      annual_tonnage: cap.maxCapacity ? Number(cap.maxCapacity) : undefined,
      services: cap.services,
    });
    recordServerId({ company: company.id });
  }
  const companyId = getState().server.company!;

  if (!getState().server.application) {
    const application = await createApplication({ company: companyId });
    recordServerId({ application: application.id });
  }
  const applicationId = getState().server.application!;

  // Sections are re-saved every time: the draft may have changed since.
  const data = sectionData(getState());
  const domains = requiredDomains(cap.services);
  const newVehicles = getState().vehicles.filter((v) => !getState().server.vehicles[v.id]);
  const newDrivers = getState().drivers.filter((d) => !getState().server.drivers[d.id]);
  const newDocuments = getState().documents.filter((d) => !getState().server.documents[d.id]);
  const total = domains.length + newVehicles.length + newDrivers.length + newDocuments.length + 1;
  let done = 0;
  const tick = (label: string) => onProgress?.({ label, done: ++done, total });
  onProgress?.({ label: "Saving your sections", done, total });

  await runPool(domains, SEND_CONCURRENCY, async (key) => {
    await saveLogisticsApplicationSection(applicationId, key, data[key]);
    tick("Saving your sections");
  });

  await runPool(newVehicles, SEND_CONCURRENCY, async (v) => {
    const created = await createVehicle({
      company: companyId,
      registration: v.registration,
      vin: v.vin,
      vehicle_type: v.type,
      make: v.make,
      model: v.model,
      year: Number(v.year),
      capacity: v.capacity,
      capacity_unit: "tonnes",
      ownership: OWNERSHIP[v.ownership] ?? "owned",
      insurer: v.insurer,
      insurance_expiry: v.insuranceExpiry,
      roadworthiness_expiry: v.roadworthinessExpiry,
      gps_status: gps(v),
      location: org.operatingAddress,
      is_active: v.operatingStatus !== "Out of service",
    });
    recordServerId({ vehicles: { ...getState().server.vehicles, [v.id]: created.id } });
    tick("Saving vehicles");
  });

  const vehicleByRegistration = (registration: string) => {
    const local = getState().vehicles.find((v) => v.registration === registration);
    return local ? (getState().server.vehicles[local.id] ?? null) : null;
  };

  // Drivers can name a vehicle, so they go only once every vehicle has an id.
  await runPool(newDrivers, SEND_CONCURRENCY, async (d) => {
    const created = await createDriver({
      company: companyId,
      full_name: d.name,
      licence_number: d.licenceNumber,
      licence_class: d.licenceClass,
      licence_expiry: d.expiryDate,
      national_id: d.nationalId,
      years_experience: Number(d.yearsExperience) || 0,
      assigned_vehicle: d.assignedVehicle ? vehicleByRegistration(d.assignedVehicle) : null,
      training: d.training
        ? d.training
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
        : [],
      medical_expiry: d.medicalExpiry,
      is_active: d.safetyStatus !== "Restricted",
    });
    recordServerId({ drivers: { ...getState().server.drivers, [d.id]: created.id } });
    tick("Saving drivers");
  });

  // The API treats uploads sharing a document_type as versions of one document,
  // so those go one after another, in the order they were added. Different
  // document types go up side by side.
  const byType = new Map<string, typeof newDocuments>();
  for (const doc of newDocuments)
    byType.set(doc.documentType, [...(byType.get(doc.documentType) ?? []), doc]);

  await runPool([...byType.values()], SEND_CONCURRENCY, async (versions) => {
    for (const doc of versions) {
      await sendDocument(doc);
      tick("Uploading documents");
    }
  });

  async function sendDocument(doc: (typeof newDocuments)[number]) {
    const file = pendingDocumentFiles.get(doc.id)!;
    const uploaded = await uploadLogisticsApplicationDocument(applicationId, {
      domain: doc.domain,
      document_type: doc.documentType,
      title: doc.type,
      file,
      issuer: doc.issuingAuthority,
      reference: doc.number,
      issued_on: orNull(doc.issueDate),
      expires_on: orNull(doc.expiryDate),
    });
    pendingDocumentFiles.delete(doc.id);
    recordServerId({ documents: { ...getState().server.documents, [doc.id]: uploaded.id } });
  }

  onProgress?.({ label: "Submitting for review", done, total });
  await submitLogisticsApplication(applicationId);
  tick("Submitting for review");
  return { applicationId };
}
