import type { OrganisationType } from "@/lib/api";

// Option lists for the Quality & Control organisation application.

/** Shown first in a select that has no sensible default. */
export const SELECT_PLACEHOLDER = "Select…";

/**
 * The organisation types a Q&C applicant picks from, and the platform-wide
 * organisation type each one is registered as. The platform type decides which
 * Quality & Control desk the organisation lands on.
 */
export const qualityOrganisationTypes: { label: string; registersAs: OrganisationType }[] = [
  { label: "Laboratory", registersAs: "laboratory" },
  { label: "Assay Organisation", registersAs: "laboratory" },
  { label: "Inspection Organisation", registersAs: "inspection_body" },
  { label: "Quality Assurance Organisation", registersAs: "compliance_partner" },
  { label: "Conformity Assessment Organisation", registersAs: "compliance_partner" },
  { label: "Sampling Organisation", registersAs: "inspection_body" },
  { label: "Mineral Testing Organisation", registersAs: "laboratory" },
  { label: "Independent Inspection Organisation", registersAs: "inspection_body" },
  { label: "Regulatory / Standards Institution", registersAs: "regulator" },
  { label: "Other", registersAs: "compliance_partner" },
];

export const qualityCapabilityOptions = [
  "Sampling",
  "Sample Inspection",
  "Mineral Testing",
  "Assay",
  "Laboratory Analysis",
  "Quality Verification",
  "Conformity Assessment",
  "Pre Shipment Inspection",
  "Post Processing Quality Testing",
  "Chain of Custody Verification",
  "Certificate / Report Issuance",
];

export const qualityMineralOptions = [
  "Gold",
  "Tin (Cassiterite)",
  "Tantalum (Coltan)",
  "Tungsten (Wolframite)",
  "Lithium",
  "Lead / Zinc",
  "Copper",
  "Barite",
  "Iron Ore",
  "Gemstones",
];

export const qualityTestingMethodOptions = [
  "Fire Assay (FA-AAS)",
  "ICP-OES",
  "ICP-MS",
  "XRF",
  "XRD",
  "Gravimetric",
  "Moisture (ISO 12742)",
  "Particle Size Distribution",
  "Leco Carbon / Sulphur",
];

export const qualityCoverageOptions = [
  "North Central Nigeria",
  "North West Nigeria",
  "South West Nigeria",
  "South South Nigeria",
  "Great Lakes (DRC / Rwanda)",
  "West Africa (ECOWAS)",
  "European Union",
  "Global",
];

export const qualitySealingOptions = ["Numbered seals", "Numbered seals + photo", "None"];

/** The Q&C document checklist. `required` ones carry an asterisk in the form. */
export const qualityDocumentCatalogue: { type: string; title: string; required: boolean }[] = [
  {
    type: "qc_organisation_registration",
    title: "CAC / Organisation Registration",
    required: true,
  },
  { type: "qc_tin", title: "TIN", required: true },
  { type: "qc_laboratory_registration", title: "Laboratory Registration", required: true },
  { type: "qc_accreditation_certificate", title: "Accreditation Certificate", required: true },
  { type: "qc_accreditation_scope", title: "Accreditation Scope", required: true },
  { type: "qc_testing_method_evidence", title: "Testing Method Evidence", required: false },
  {
    type: "qc_equipment_calibration_certificates",
    title: "Equipment Calibration Certificates",
    required: false,
  },
  {
    type: "qc_quality_management_documents",
    title: "Quality Management Documents",
    required: false,
  },
  { type: "qc_regulatory_approvals", title: "Relevant Regulatory Approvals", required: false },
  { type: "qc_insurance", title: "Insurance", required: false },
  { type: "qc_other_supporting_documents", title: "Other Supporting Documents", required: false },
];

export const qualityDeclarationItems = [
  {
    key: "information_true",
    label: "The information in this application is true, complete and not misleading.",
  },
  {
    key: "consent_to_verification",
    label:
      "I consent to Beldium verifying documents with issuing bodies, accreditation registries and regulators.",
  },
  {
    key: "understands_verification",
    label:
      "I understand uploading a document is not verification, and that approval can be conditioned, suspended or revoked.",
  },
] as const;

// --- Quality & Control Officer / Inspector application -------------------------

export const qualityOfficerCapabilityOptions = [
  "Sampling",
  "Sample Inspection",
  "Pre Shipment Inspection",
  "Chain of Custody Verification",
];

export const qualityOfficerDocumentCatalogue: { type: string; title: string; required: boolean }[] =
  [
    { type: "professional_qualifications", title: "Professional Qualifications", required: true },
    { type: "inspection_credentials", title: "Inspection Credentials", required: true },
    { type: "sampling_credentials", title: "Sampling Credentials", required: false },
    { type: "professional_certifications", title: "Professional Certifications", required: false },
    { type: "other_supporting_documents", title: "Other Supporting Documents", required: false },
  ];
