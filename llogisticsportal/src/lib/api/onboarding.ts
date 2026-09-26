import { formatPhoneNumber } from "../phone";
import type { DocumentRecord, OperatorState, VehicleRecord } from "../onboarding-store";
import {
  createApplication,
  createCompany,
  createDriver,
  createVehicle,
  saveLogisticsApplicationSection,
  submitLogisticsApplication,
  uploadLogisticsApplicationDocument,
  type LogisticsDomainKey,
  type Vehicle,
} from "./logistics";
import { createOrganisation } from "./organisations";
import type { UUID } from "./types";

// Submits the onboarding wizard's draft to the Beldium API, in the order the
// backend's foreign keys require:
//
//   organisation → logistics company → application → sections
//                → vehicles → drivers (may reference a vehicle) → documents → submit
//
// Each call is a separate request, so a failure part-way leaves earlier records
// in place; the error is surfaced and the draft is kept so the user can retry.

/** Files can't live in the localStorage draft, so the wizard parks them here until submit. */
export const pendingDocumentFiles = new Map<string, File>();

const DOCUMENT_DOMAIN: Record<string, LogisticsDomainKey> = {
  "Organisation documents": "corporate",
  "Vehicle documents": "fleet",
  "Driver documents": "driver",
  "Safety & operations documents": "hs",
  "Compliance documents": "regulatory",
  Insurance: "insurance",
};

const OWNERSHIP: Record<string, Vehicle["ownership"]> = {
  Owned: "owned",
  Leased: "leased",
  Subcontracted: "contracted",
};

function vehicleGps(v: VehicleRecord): Vehicle["gps_status"] {
  if (v.trackerInstalled !== "Yes") return "inactive";
  return v.trackerId ? "active" : "unknown";
}

const orNull = (value: string) => (value ? value : null);

export async function submitOperatorApplication(
  draft: OperatorState,
): Promise<{ applicationId: UUID; reference: string }> {
  const org = draft.organisation;
  const cap = draft.capability;
  const account = draft.account;
  if (!org || !cap || !account) throw new Error("The application is incomplete.");

  const phone = formatPhoneNumber(org.phone || account.phone);

  const organisation = await createOrganisation({
    name: org.name,
    organisation_type: "logistics_company",
    registration_number: org.registrationNumber,
    tax_identifier: org.tin,
    email: org.email || account.email,
    phone_number: phone,
    website: org.website,
    address: org.registeredAddress,
    country: account.country || "Nigeria",
    state: org.state,
  });

  const company = await createCompany({
    organisation: organisation.id,
    contact_name: org.primaryContact || `${account.firstName} ${account.lastName}`.trim(),
    contact_email: org.email || account.email,
    contact_phone: phone,
    incorporated_on: org.yearEstablished ? `${org.yearEstablished}-01-01` : null,
    annual_tonnage: cap.maxCapacity ? Number(cap.maxCapacity) : undefined,
    services: cap.services,
  });

  const application = await createApplication({ company: company.id });

  const sections: [LogisticsDomainKey, Record<string, unknown>][] = [
    ["corporate", { ...org, participant_type: account.participantType }],
    ["operational", { ...cap }],
    ["hs", { answers: draft.compliance }],
    ["data", { declarations: draft.declarations }],
  ];
  for (const [key, data] of sections) {
    await saveLogisticsApplicationSection(application.id, key, data);
  }

  const vehicleIds = new Map<string, UUID>();
  for (const v of draft.vehicles) {
    const created = await createVehicle({
      company: company.id,
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
      gps_status: vehicleGps(v),
      location: org.operatingAddress,
      is_active: v.operatingStatus !== "Out of service",
    });
    vehicleIds.set(v.registration || v.id, created.id);
  }

  const driverIds = new Map<string, UUID>();
  for (const d of draft.drivers) {
    const created = await createDriver({
      company: company.id,
      full_name: d.name,
      licence_number: d.licenceNumber,
      licence_class: d.licenceClass,
      licence_expiry: d.expiryDate,
      national_id: d.nationalId,
      years_experience: Number(d.yearsExperience) || 0,
      assigned_vehicle: vehicleIds.get(d.assignedVehicle) ?? null,
      training: d.training
        ? d.training
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
        : [],
      medical_expiry: d.medicalExpiry,
      is_active: d.safetyStatus !== "Restricted",
    });
    driverIds.set(d.name || d.id, created.id);
  }

  for (const doc of draft.documents) {
    await uploadDocument(application.id, doc, vehicleIds, driverIds);
  }

  await submitLogisticsApplication(application.id);
  pendingDocumentFiles.clear();
  return { applicationId: application.id, reference: company.reference };
}

async function uploadDocument(
  applicationId: UUID,
  doc: DocumentRecord,
  vehicleIds: Map<string, UUID>,
  driverIds: Map<string, UUID>,
) {
  const file = pendingDocumentFiles.get(doc.id);
  // A reload drops parked files; the reviewer will request anything missing.
  if (!file) return;
  await uploadLogisticsApplicationDocument(applicationId, {
    domain: DOCUMENT_DOMAIN[doc.group] ?? "regulatory",
    document_type: doc.type,
    title: doc.type,
    file,
    issuer: doc.issuingAuthority,
    reference: doc.number,
    issued_on: orNull(doc.issueDate),
    expires_on: orNull(doc.expiryDate),
    vehicle: vehicleIds.get(doc.related) ?? null,
    driver: driverIds.get(doc.related) ?? null,
  });
}
