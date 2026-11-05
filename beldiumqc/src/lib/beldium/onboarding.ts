import type { Role } from "./types";

export type QcRoleKey =
  | "qc_org"
  | "qc_officer"
  | "lab_analyst"
  | "reg_org"
  | "reg_officer"
  | "independent";

export type AppStatus =
  | "submitted"
  | "under_review"
  | "information_required"
  | "inspection_required"
  | "conditionally_approved"
  | "approved"
  | "rejected"
  | "suspended";

export const appStatuses: AppStatus[] = [
  "submitted",
  "under_review",
  "information_required",
  "inspection_required",
  "conditionally_approved",
  "approved",
  "rejected",
  "suspended",
];

export type DocState =
  | "uploaded"
  | "under_review"
  | "verified"
  | "information_required"
  | "rejected"
  | "expiring"
  | "expired";

export const documentTypes = [
  "CAC / Organisation Registration",
  "TIN",
  "Laboratory Registration",
  "Accreditation Certificate",
  "Accreditation Scope",
  "Professional Qualifications",
  "Professional Certifications",
  "Testing Method Evidence",
  "Equipment Calibration Certificates",
  "Inspection Credentials",
  "Sampling Credentials",
  "Quality Management Documents",
  "Relevant Regulatory Approvals",
  "Insurance",
  "Other Supporting Documents",
] as const;

export const organisationTypes = [
  "Laboratory",
  "Assay Organisation",
  "Inspection Organisation",
  "Quality Assurance Organisation",
  "Conformity Assessment Organisation",
  "Sampling Organisation",
  "Mineral Testing Organisation",
  "Independent Inspection Organisation",
  "Regulatory / Standards Institution",
  "Other",
];

export const capabilities = [
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

export const minerals = [
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

export const methods = [
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

export const regions = [
  "North Central Nigeria",
  "North West Nigeria",
  "South West Nigeria",
  "South South Nigeria",
  "Great Lakes (DRC / Rwanda)",
  "West Africa (ECOWAS)",
  "European Union",
  "Global",
];

export const oversightAreas = [
  "Licensing oversight",
  "Export certification",
  "Laboratory accreditation oversight",
  "Mine site inspection",
  "Chain of custody audit",
  "Enforcement & sanctions",
];

export type FieldDef =
  | {
      kind: "text" | "email" | "date" | "number" | "textarea" | "tel";
      key: string;
      label: string;
      required?: boolean;
      placeholder?: string;
      half?: boolean;
    }
  | { kind: "select"; key: string; label: string; options: string[]; required?: boolean; half?: boolean }
  | { kind: "chips"; key: string; label: string; options: string[]; min?: number }
  | {
      kind: "repeater";
      key: string;
      label: string;
      columns: { key: string; label: string; placeholder?: string }[];
      min?: number;
      addLabel: string;
    }
  | { kind: "docs"; key: string; required: string[]; optional: string[] }
  | { kind: "join"; key: string; directory: "qc" | "lab" | "regulator"; label: string }
  | { kind: "declaration"; key: string };

export interface StepDef {
  id: string;
  title: string;
  description: string;
  fields: FieldDef[];
  review?: boolean;
}

export interface RoleDef {
  key: QcRoleKey;
  title: string;
  short: string;
  description: string;
  applicationType: string;
  individual: boolean;
  workspaceRole: Role;
  steps: StepDef[];
  permissions: string[];
}

const declaration = (): StepDef => ({
  id: "declaration",
  title: "Declaration",
  description: "Confirm the accuracy of your application and consent to verification.",
  fields: [{ kind: "declaration", key: "declaration" }],
});

const review = (): StepDef => ({
  id: "review",
  title: "Review",
  description: "Check every section before submitting. You can jump back to edit any step.",
  fields: [],
  review: true,
});

const qualifications: StepDef = {
  id: "qualifications",
  title: "Qualifications",
  description: "Academic and professional qualifications relevant to quality and control work.",
  fields: [
    {
      kind: "repeater",
      key: "qualifications",
      label: "Qualifications",
      addLabel: "Add qualification",
      min: 1,
      columns: [
        { key: "title", label: "Qualification", placeholder: "BSc Geology" },
        { key: "institution", label: "Institution", placeholder: "University of Jos" },
        { key: "year", label: "Year", placeholder: "2014" },
      ],
    },
  ],
};

const certifications = (title = "Certifications"): StepDef => ({
  id: "certifications",
  title,
  description: "Professional certifications, licences or accreditations you currently hold.",
  fields: [
    {
      kind: "repeater",
      key: "certifications",
      label: "Certifications",
      addLabel: "Add certification",
      min: 1,
      columns: [
        { key: "name", label: "Certification", placeholder: "ISO 17025 Internal Auditor" },
        { key: "number", label: "Number", placeholder: "CERT-88213" },
        { key: "expiry", label: "Expiry", placeholder: "2027-06-30" },
      ],
    },
  ],
});

const equipmentStep: StepDef = {
  id: "equipment",
  title: "Equipment",
  description: "Major equipment with calibration status. Calibration certificates are requested under Documents.",
  fields: [
    {
      kind: "repeater",
      key: "equipment",
      label: "Equipment register",
      addLabel: "Add equipment",
      min: 1,
      columns: [
        { key: "name", label: "Equipment", placeholder: "Agilent 5110 ICP-OES" },
        { key: "serial", label: "Serial no.", placeholder: "MY21480012" },
        { key: "calibrated", label: "Last calibrated", placeholder: "2026-03-14" },
      ],
    },
  ],
};

export const roleDefs: Record<QcRoleKey, RoleDef> = {
  qc_org: {
    key: "qc_org",
    title: "Quality & Control Organisation",
    short: "Organisation",
    description:
      "Laboratories, assay, inspection and conformity assessment organisations operating one or more facilities.",
    applicationType: "Organisation Application",
    individual: false,
    workspaceRole: "partner",
    permissions: [
      "Accept test requests within accredited scope",
      "Manage laboratories, equipment and personnel",
      "Publish results and issue certificates",
      "Respond to non-conformities",
    ],
    steps: [
      {
        id: "org_details",
        title: "Organisation Details",
        description: "Legal identity of the organisation applying to operate on Beldium.",
        fields: [
          { kind: "text", key: "legalName", label: "Registered legal name", required: true },
          { kind: "text", key: "tradingName", label: "Trading name", half: true },
          { kind: "select", key: "orgType", label: "Organisation type", options: organisationTypes, required: true, half: true },
          { kind: "text", key: "cac", label: "CAC / registration number", required: true, half: true, placeholder: "RC-1234567" },
          { kind: "text", key: "tin", label: "TIN", required: true, half: true, placeholder: "12345678-0001" },
          { kind: "text", key: "address", label: "Registered address", required: true },
          { kind: "text", key: "country", label: "Country", required: true, half: true },
          { kind: "text", key: "website", label: "Website", half: true },
        ],
      },
      {
        id: "representative",
        title: "Authorized Representative",
        description: "The person authorised to act and sign for the organisation, plus responsible officers where applicable.",
        fields: [
          { kind: "text", key: "repName", label: "Full name", required: true, half: true },
          { kind: "text", key: "repTitle", label: "Job title", required: true, half: true },
          { kind: "email", key: "repEmail", label: "Work email", required: true, half: true },
          { kind: "tel", key: "repPhone", label: "Phone number", required: true, half: true },
          {
            kind: "select",
            key: "repRelationship",
            label: "Relationship to organisation",
            options: ["Director", "Chief Executive", "Company Secretary", "Authorised Officer", "Other"],
            required: true,
            half: true,
          },
          {
            kind: "select",
            key: "repSignatory",
            label: "Authorised signatory?",
            options: ["Yes — authorised to sign", "No — signatory listed below"],
            required: true,
            half: true,
          },
          {
            kind: "repeater",
            key: "officers",
            label: "Responsible officers (Quality / Technical / Operations / Laboratory Manager, HSE — as applicable)",
            addLabel: "Add responsible officer",
            columns: [
              { key: "name", label: "Full name", placeholder: "Hauwa Bello" },
              { key: "office", label: "Office", placeholder: "Quality Manager" },
              { key: "email", label: "Email", placeholder: "hauwa@lab.ng" },
            ],
          },
        ],
      },
      {
        id: "services",
        title: "Services & Testing Capability",
        description: "Services you will offer through Beldium and the materials you support.",
        fields: [
          { kind: "chips", key: "capabilities", label: "Capabilities", options: capabilities, min: 1 },
          { kind: "chips", key: "minerals", label: "Minerals / materials supported", options: minerals, min: 1 },
        ],
      },
      {
        id: "facilities",
        title: "Facilities & Operating Locations",
        description: "Register every operating base. One organisation may run multiple facilities; each is verified separately.",
        fields: [
          {
            kind: "repeater",
            key: "facilities",
            label: "Facilities",
            addLabel: "Add facility",
            min: 1,
            columns: [
              { key: "name", label: "Facility name", placeholder: "Kaduna Field Base" },
              { key: "type", label: "Type", placeholder: "Sampling field base / Testing laboratory…" },
              { key: "location", label: "Address, State", placeholder: "Kaduna, Kaduna State" },
            ],
          },
        ],
      },
      {
        id: "laboratories",
        title: "Laboratory Details",
        description: "An organisation can operate multiple laboratories. Each is verified separately.",
        fields: [
          {
            kind: "repeater",
            key: "laboratories",
            label: "Laboratories",
            addLabel: "Add laboratory",
            min: 1,
            columns: [
              { key: "name", label: "Laboratory name", placeholder: "Jos Central Laboratory" },
              { key: "location", label: "Location", placeholder: "Jos, Plateau" },
              { key: "registration", label: "Registration no.", placeholder: "LAB-NG-0412" },
            ],
          },
        ],
      },
      {
        id: "accreditation",
        title: "Accreditation & Scope",
        description: "Accreditation held by your laboratories and the scope it covers.",
        fields: [
          { kind: "text", key: "accBody", label: "Accreditation body", required: true, half: true, placeholder: "NiNAS" },
          { kind: "text", key: "accNumber", label: "Accreditation number", required: true, half: true },
          { kind: "date", key: "accExpiry", label: "Accreditation expiry", required: true, half: true },
          { kind: "text", key: "accStandard", label: "Standard", half: true, placeholder: "ISO/IEC 17025:2017" },
          { kind: "textarea", key: "accScope", label: "Accredited scope", required: true, placeholder: "Au by FA-AAS in ores, 0.01–100 g/t…" },
        ],
      },
      {
        id: "methods",
        title: "Testing Methods",
        description: "Methods your laboratories run. Only accredited methods unlock certificate issuance.",
        fields: [{ kind: "chips", key: "methods", label: "Testing methods", options: methods, min: 1 }],
      },
      equipmentStep,
      {
        id: "personnel",
        title: "Key Personnel",
        description: "Signatories, quality managers and lead analysts.",
        fields: [
          {
            kind: "repeater",
            key: "personnel",
            label: "Key personnel",
            addLabel: "Add person",
            min: 1,
            columns: [
              { key: "name", label: "Full name", placeholder: "Dr. Ngozi Eze" },
              { key: "role", label: "Role", placeholder: "Quality Manager" },
              { key: "email", label: "Email", placeholder: "ngozi@lab.ng" },
            ],
          },
        ],
      },
      {
        id: "sampling",
        title: "Sampling & Inspection Capability",
        description: "Field capability for drawing, sealing and inspecting samples.",
        fields: [
          { kind: "chips", key: "regions", label: "Geographic coverage", options: regions, min: 1 },
          { kind: "number", key: "fieldTeams", label: "Number of field sampling teams", required: true, half: true },
          { kind: "select", key: "sealing", label: "Tamper-evident sealing", options: ["Numbered seals", "Numbered seals + photo", "None"], required: true, half: true },
          { kind: "textarea", key: "samplingProcedure", label: "Sampling procedure summary" },
        ],
      },
      {
        id: "documents",
        title: "Documents",
        description: "Upload supporting evidence. Uploading does not equal verification — each file is reviewed.",
        fields: [
          {
            kind: "docs",
            key: "documents",
            required: [
              "CAC / Organisation Registration",
              "TIN",
              "Laboratory Registration",
              "Accreditation Certificate",
              "Accreditation Scope",
            ],
            optional: [
              "Testing Method Evidence",
              "Equipment Calibration Certificates",
              "Quality Management Documents",
              "Relevant Regulatory Approvals",
              "Insurance",
              "Other Supporting Documents",
            ],
          },
        ],
      },
      declaration(),
      review(),
    ],
  },
  qc_officer: {
    key: "qc_officer",
    title: "Quality & Control Officer / Inspector",
    short: "Officer / Inspector",
    description: "Individual inspectors and sampling officers working for a Q&C organisation.",
    applicationType: "Professional Application",
    individual: true,
    workspaceRole: "partner",
    permissions: [
      "Record custody events and seal checks",
      "Perform inspections within your organisation's scope",
      "View assigned samples",
    ],
    steps: [
      {
        id: "join",
        title: "Find / Join Organisation",
        description: "Request membership of the Q&C organisation you work for.",
        fields: [{ kind: "join", key: "organisation", directory: "qc", label: "Organisation" }],
      },
      {
        id: "personal",
        title: "Personal Details",
        description: "Your identity as it appears on official documents.",
        fields: [
          { kind: "text", key: "fullName", label: "Full legal name", required: true },
          { kind: "date", key: "dob", label: "Date of birth", required: true, half: true },
          { kind: "text", key: "nin", label: "National ID (NIN)", required: true, half: true },
          { kind: "text", key: "jobTitle", label: "Job title", required: true, half: true },
          { kind: "text", key: "city", label: "Base city", half: true },
        ],
      },
      qualifications,
      certifications(),
      {
        id: "sampling",
        title: "Sampling / Inspection Capability",
        description: "What you are competent to do in the field.",
        fields: [
          { kind: "chips", key: "capabilities", label: "Capabilities", options: ["Sampling", "Sample Inspection", "Pre Shipment Inspection", "Chain of Custody Verification"], min: 1 },
          { kind: "chips", key: "minerals", label: "Minerals / materials", options: minerals, min: 1 },
        ],
      },
      {
        id: "experience",
        title: "Experience",
        description: "Relevant professional history.",
        fields: [
          { kind: "number", key: "years", label: "Years of experience", required: true, half: true },
          { kind: "text", key: "employer", label: "Previous employer", half: true },
          { kind: "textarea", key: "summary", label: "Experience summary", required: true },
        ],
      },
      {
        id: "documents",
        title: "Documents",
        description: "Uploading does not equal verification — each file is reviewed.",
        fields: [
          {
            kind: "docs",
            key: "documents",
            required: ["Professional Qualifications", "Inspection Credentials"],
            optional: ["Sampling Credentials", "Professional Certifications", "Other Supporting Documents"],
          },
        ],
      },
      declaration(),
    ],
  },
  lab_analyst: {
    key: "lab_analyst",
    title: "Laboratory Analyst",
    short: "Analyst",
    description: "Bench analysts running accredited methods inside a registered laboratory.",
    applicationType: "Professional Application",
    individual: true,
    workspaceRole: "partner",
    permissions: ["Enter results for methods you are authorised on", "View samples at your laboratory"],
    steps: [
      {
        id: "join",
        title: "Find / Join Laboratory",
        description: "Request membership of the laboratory where you work.",
        fields: [{ kind: "join", key: "laboratory", directory: "lab", label: "Laboratory" }],
      },
      qualifications,
      {
        id: "lab_experience",
        title: "Laboratory Experience",
        description: "Your bench experience.",
        fields: [
          { kind: "number", key: "years", label: "Years at the bench", required: true, half: true },
          { kind: "text", key: "position", label: "Current position", required: true, half: true },
          { kind: "textarea", key: "summary", label: "Experience summary", required: true },
        ],
      },
      {
        id: "methods",
        title: "Testing Methods",
        description: "Methods you are trained and competent to run.",
        fields: [{ kind: "chips", key: "methods", label: "Methods", options: methods, min: 1 }],
      },
      {
        id: "minerals",
        title: "Mineral / Material Experience",
        description: "Matrices you have analysed.",
        fields: [{ kind: "chips", key: "minerals", label: "Minerals / materials", options: minerals, min: 1 }],
      },
      certifications(),
      {
        id: "documents",
        title: "Documents",
        description: "Uploading does not equal verification — each file is reviewed.",
        fields: [
          {
            kind: "docs",
            key: "documents",
            required: ["Professional Qualifications"],
            optional: ["Professional Certifications", "Testing Method Evidence", "Other Supporting Documents"],
          },
        ],
      },
      declaration(),
    ],
  },
  reg_org: {
    key: "reg_org",
    title: "Regulatory / Oversight Organisation",
    short: "Regulator",
    description: "Ministries, agencies and standards bodies supervising mineral quality and trade.",
    applicationType: "Organisation Application",
    individual: false,
    workspaceRole: "regulator",
    permissions: ["Read-only oversight of applications, samples and certificates", "Raise non-conformities", "Export audit trails"],
    steps: [
      {
        id: "authority",
        title: "Regulatory Authority Details",
        description: "The authority and its statutory mandate.",
        fields: [
          { kind: "text", key: "legalName", label: "Authority name", required: true },
          { kind: "text", key: "mandate", label: "Enabling statute / mandate", required: true },
          { kind: "text", key: "jurisdiction", label: "Jurisdiction", required: true, half: true },
          { kind: "text", key: "address", label: "Head office address", required: true, half: true },
        ],
      },
      {
        id: "documents",
        title: "Documents",
        description: "Uploading does not equal verification — each file is reviewed.",
        fields: [
          {
            kind: "docs",
            key: "documents",
            required: ["Relevant Regulatory Approvals"],
            optional: ["CAC / Organisation Registration", "Other Supporting Documents"],
          },
        ],
      },
      {
        id: "personnel",
        title: "Authorised Personnel",
        description: "Officers authorised to act for the authority on Beldium.",
        fields: [
          {
            kind: "repeater",
            key: "personnel",
            label: "Authorised personnel",
            addLabel: "Add officer",
            min: 1,
            columns: [
              { key: "name", label: "Full name" },
              { key: "role", label: "Designation" },
              { key: "email", label: "Official email" },
            ],
          },
        ],
      },
      {
        id: "oversight",
        title: "Oversight Capability",
        description: "Areas the authority supervises.",
        fields: [
          { kind: "chips", key: "oversight", label: "Oversight areas", options: oversightAreas, min: 1 },
          { kind: "chips", key: "regions", label: "Geographic remit", options: regions, min: 1 },
        ],
      },
      declaration(),
      review(),
    ],
  },
  reg_officer: {
    key: "reg_officer",
    title: "Regulatory / Oversight Officer",
    short: "Regulatory Officer",
    description: "Individual officers employed by an approved regulatory organisation.",
    applicationType: "Professional Application",
    individual: true,
    workspaceRole: "regulator",
    permissions: ["Read-only oversight within your authority's remit", "Raise non-conformities"],
    steps: [
      {
        id: "join",
        title: "Find / Join Regulatory Organisation",
        description: "Request membership of your authority.",
        fields: [{ kind: "join", key: "authority", directory: "regulator", label: "Regulatory organisation" }],
      },
      {
        id: "employment",
        title: "Authority / Employment Details",
        description: "Your employment with the authority.",
        fields: [
          { kind: "text", key: "staffId", label: "Staff ID", required: true, half: true },
          { kind: "text", key: "designation", label: "Designation", required: true, half: true },
          { kind: "text", key: "department", label: "Department", required: true, half: true },
          { kind: "date", key: "startDate", label: "Employment start date", half: true },
        ],
      },
      {
        id: "professional",
        title: "Professional Details",
        description: "Background relevant to oversight duties.",
        fields: [
          { kind: "text", key: "fullName", label: "Full legal name", required: true, half: true },
          { kind: "number", key: "years", label: "Years in regulation", required: true, half: true },
          { kind: "textarea", key: "summary", label: "Professional summary" },
        ],
      },
      {
        id: "documents",
        title: "Supporting Documents",
        description: "Uploading does not equal verification — each file is reviewed.",
        fields: [
          {
            kind: "docs",
            key: "documents",
            required: ["Relevant Regulatory Approvals"],
            optional: ["Professional Qualifications", "Other Supporting Documents"],
          },
        ],
      },
      declaration(),
    ],
  },
  independent: {
    key: "independent",
    title: "Independent Quality Professional",
    short: "Independent",
    description: "Self-employed samplers, inspectors and testing consultants offering services directly.",
    applicationType: "Independent Professional Application",
    individual: true,
    workspaceRole: "partner",
    permissions: [
      "Accept engagements within your services and coverage",
      "Record custody and inspection events",
      "Issue reports within your accreditation",
    ],
    steps: [
      {
        id: "professional",
        title: "Professional Details",
        description: "Who you are and how you trade.",
        fields: [
          { kind: "text", key: "fullName", label: "Full legal name", required: true, half: true },
          { kind: "text", key: "businessName", label: "Business name (if any)", half: true },
          { kind: "text", key: "nin", label: "National ID (NIN)", required: true, half: true },
          { kind: "text", key: "tin", label: "TIN", half: true },
        ],
      },
      qualifications,
      certifications("Certifications / Accreditation"),
      {
        id: "services",
        title: "Services",
        description: "Services you offer.",
        fields: [{ kind: "chips", key: "capabilities", label: "Services", options: capabilities, min: 1 }],
      },
      {
        id: "minerals",
        title: "Minerals / Materials",
        description: "Materials you work with.",
        fields: [{ kind: "chips", key: "minerals", label: "Minerals / materials", options: minerals, min: 1 }],
      },
      {
        id: "sampling",
        title: "Sampling Capability",
        description: "Field sampling capability.",
        fields: [
          { kind: "select", key: "samplingType", label: "Sampling types", options: ["Grab", "Channel", "Composite / lot", "Not offered"], required: true, half: true },
          { kind: "select", key: "sealing", label: "Tamper-evident sealing", options: ["Numbered seals", "Numbered seals + photo", "None"], required: true, half: true },
        ],
      },
      {
        id: "inspection",
        title: "Inspection Capability",
        description: "Inspection services.",
        fields: [
          { kind: "select", key: "inspectionType", label: "Inspection type", options: ["Pre-shipment", "Site", "Warehouse", "Not offered"], required: true, half: true },
          { kind: "textarea", key: "inspectionNotes", label: "Inspection approach" },
        ],
      },
      {
        id: "testing",
        title: "Testing Capability",
        description: "Only where applicable — leave empty if you do not test.",
        fields: [{ kind: "chips", key: "methods", label: "Testing methods (optional)", options: methods }],
      },
      {
        id: "coverage",
        title: "Geographic Coverage",
        description: "Where you can operate.",
        fields: [{ kind: "chips", key: "regions", label: "Regions", options: regions, min: 1 }],
      },
      equipmentStep,
      {
        id: "documents",
        title: "Documents",
        description: "Uploading does not equal verification — each file is reviewed.",
        fields: [
          {
            kind: "docs",
            key: "documents",
            required: ["Professional Qualifications", "Professional Certifications"],
            optional: ["Sampling Credentials", "Inspection Credentials", "Equipment Calibration Certificates", "Insurance", "Other Supporting Documents"],
          },
        ],
      },
      declaration(),
    ],
  },
};

export const roleOrder: QcRoleKey[] = [
  "qc_org",
  "qc_officer",
  "lab_analyst",
  "reg_org",
  "reg_officer",
  "independent",
];

/** Directory of existing records used by Find / Join steps. */
export interface DirectoryOrg {
  id: string;
  name: string;
  type: string;
  city: string;
  status: "approved" | "under_review";
  laboratories: {
    id: string;
    name: string;
    location: string;
    accreditation: string;
    expiry: string;
    scope: string[];
    equipment: string[];
    personnel: string[];
  }[];
}

export const directory: DirectoryOrg[] = [
  {
    id: "org-aal",
    name: "Antwerp Assay Laboratories NV",
    type: "Laboratory",
    city: "Antwerp, BE",
    status: "approved",
    laboratories: [
      { id: "lab-ant", name: "Antwerp Main Bench", location: "Antwerp, BE", accreditation: "BELAC 412-TEST", expiry: "2027-09-30", scope: ["Fire Assay (FA-AAS)", "ICP-OES", "XRF"], equipment: ["Agilent 5110 ICP-OES", "Thermo iCAP RQ"], personnel: ["Dr. Pieter Vos", "Elena Marx"] },
      { id: "lab-lag", name: "Lagos Satellite Laboratory", location: "Lagos, NG", accreditation: "NiNAS-LAB-0091", expiry: "2026-12-14", scope: ["XRF", "Moisture (ISO 12742)"], equipment: ["Bruker S8 Tiger"], personnel: ["Kunle Adeyemi"] },
    ],
  },
  {
    id: "org-jos",
    name: "Jos Plateau Minerals Testing Ltd",
    type: "Mineral Testing Organisation",
    city: "Jos, NG",
    status: "approved",
    laboratories: [
      { id: "lab-jos", name: "Jos Central Laboratory", location: "Jos, NG", accreditation: "NiNAS-LAB-0204", expiry: "2027-03-01", scope: ["XRF", "Gravimetric", "ICP-OES"], equipment: ["PANalytical Epsilon 4"], personnel: ["Hauwa Bello", "Musa Danjuma"] },
    ],
  },
  {
    id: "org-sgx",
    name: "Sahel Inspection Services",
    type: "Inspection Organisation",
    city: "Kaduna, NG",
    status: "approved",
    laboratories: [],
  },
  {
    id: "org-ksl",
    name: "Kivu Sampling Laboratories",
    type: "Sampling Organisation",
    city: "Goma, CD",
    status: "under_review",
    laboratories: [
      { id: "lab-gom", name: "Goma Field Laboratory", location: "Goma, CD", accreditation: "Pending", expiry: "—", scope: ["XRF"], equipment: ["Olympus Vanta pXRF"], personnel: ["Jean-Paul Mbala"] },
    ],
  },
  { id: "reg-mmsd", name: "Ministry of Solid Minerals Development — Mines Inspectorate", type: "Regulatory / Standards Institution", city: "Abuja, NG", status: "approved", laboratories: [] },
  { id: "reg-son", name: "Standards Organisation of Nigeria", type: "Regulatory / Standards Institution", city: "Abuja, NG", status: "approved", laboratories: [] },
  { id: "reg-icglr", name: "ICGLR Regional Certification Mechanism", type: "Regulatory / Standards Institution", city: "Bujumbura, BI", status: "approved", laboratories: [] },
];
