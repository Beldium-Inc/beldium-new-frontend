import { z } from "zod";

/**
 * Nigerian mobile/landline numbers: optional +234/234/0 prefix, then 10 digits,
 * optionally grouped with spaces or dashes.
 */
const NG_PHONE_RE = /^(?:\+234|234|0)[789][01]\d{8}$/;

const nonEmpty = (label: string, max = 200) =>
  z
    .string({ required_error: `${label} is required` })
    .trim()
    .min(1, `${label} is required`)
    .max(max, `${label} must be under ${max} characters`);

export const companyInfoSchema = z.object({
  companyName: nonEmpty("Company name", 200),
  rcNumber: nonEmpty("RC number", 60),
  companyEmail: z.string().trim().email("Enter a valid email address").max(200),
  phoneNumber: z
    .string({ required_error: "Phone number is required" })
    .trim()
    .refine(
      (v) => NG_PHONE_RE.test(v.replace(/[\s-]/g, "")),
      "Enter a valid Nigerian phone number, e.g. 0803 123 4567",
    ),
  businessAddress: nonEmpty("Business address", 400),
  contactPerson: nonEmpty("Contact person", 120),
});

export type CompanyInfoValues = z.infer<typeof companyInfoSchema>;

/* ---------- Documents ---------- */

export const REQUIRED_DOCUMENTS = [
  {
    key: "cacCertificate",
    label: "Certificate of Incorporation (CAC)",
    description: "Official CAC incorporation certificate for your company.",
    accept: ".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png",
    maxMb: 10,
  },
  {
    key: "tinCertificate",
    label: "Tax Identification Number (TIN) Certificate",
    description: "Current TIN certificate issued by FIRS.",
    accept: ".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png",
    maxMb: 10,
  },
  {
    key: "representativeId",
    label: "Means of Identification of the Company Representative",
    description: "A valid government-issued ID (e.g. National ID, passport, driver's licence).",
    accept: ".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png",
    maxMb: 10,
  },
  {
    key: "bankConfirmation",
    label: "Bank Account Confirmation Letter or Cancelled Cheque",
    description: "Recent bank confirmation letter or a cancelled cheque.",
    accept: ".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png",
    maxMb: 10,
  },
] as const;

export const OPTIONAL_DOCUMENTS = [
  {
    key: "companyProfile",
    label: "Company Profile",
    description: "PDF only: an overview of your company and services.",
    accept: ".pdf,application/pdf",
    maxMb: 10,
  },
  {
    key: "goodsInTransitInsurance",
    label: "Goods in Transit Insurance Certificate",
    description: "Valid insurance certificate covering goods in transit.",
    accept: ".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png",
    maxMb: 10,
  },
  {
    key: "vehicleInsurance",
    label: "Vehicle Insurance Certificate",
    description: "For at least one operational truck in your fleet.",
    accept: ".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png",
    maxMb: 10,
  },
  {
    key: "roadWorthiness",
    label: "Road Worthiness Certificate",
    description: "For at least one operational truck in your fleet.",
    accept: ".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png",
    maxMb: 10,
  },
  {
    key: "fleetList",
    label: "Fleet List",
    description: "PDF or Excel spreadsheet listing all operational vehicles.",
    accept:
      ".pdf,.xls,.xlsx,application/pdf,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    maxMb: 10,
  },
  {
    key: "driversLicence",
    label: "Driver's Licence",
    description: "For the primary assigned driver.",
    accept: ".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png",
    maxMb: 10,
  },
  {
    key: "hseDocument",
    label: "Health, Safety and Environment Policy",
    description: "Your company's HSE policy document, if available.",
    accept: ".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png",
    maxMb: 10,
  },
  {
    key: "isoCertifications",
    label: "ISO Certifications",
    description: "Any relevant ISO certifications held by your company.",
    accept: ".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png",
    maxMb: 10,
  },
  {
    key: "priorExperience",
    label: "Previous Mining or Industrial Logistics Experience",
    description: "Evidence of prior mining or industrial logistics work.",
    accept: ".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png",
    maxMb: 10,
  },
  {
    key: "clientReferences",
    label: "Client References",
    description: "Letters or contacts of previous clients who can vouch for your service.",
    accept: ".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png",
    maxMb: 10,
  },
] as const;

export type RequiredDocumentKey = (typeof REQUIRED_DOCUMENTS)[number]["key"];
export type OptionalDocumentKey = (typeof OPTIONAL_DOCUMENTS)[number]["key"];
export type DocumentKey = RequiredDocumentKey | OptionalDocumentKey;

/* ---------- Agreements ---------- */

export const AGREEMENTS = [
  {
    key: "partnerAgreement",
    title: "Beldium Logistics Partner Agreement",
    summary:
      "Sets out the terms under which your company operates as a verified logistics partner on the Beldium platform, including RFQ participation, assignment fulfilment, and performance standards.",
  },
  {
    key: "codeOfConduct",
    title: "Code of Conduct and Ethics Declaration",
    summary:
      "Confirms your company's commitment to ethical business practices, anti-bribery standards, and fair treatment of drivers, staff, and clients while operating on the platform.",
  },
  {
    key: "dataPrivacyAgreement",
    title: "Data Privacy and Confidentiality Agreement",
    summary:
      "Governs how your company's data and any confidential platform information shared with you is handled, stored, and protected.",
  },
  {
    key: "serviceLevelAgreement",
    title: "Service Level Agreement",
    summary:
      "Defines expected turnaround times, communication standards, and delivery performance benchmarks for assignments received through the platform.",
  },
] as const;

export type AgreementKey = (typeof AGREEMENTS)[number]["key"];
