import type { OnboardingRole } from "./types";

export const roleCatalogue: {
  role: OnboardingRole;
  title: string;
  blurb: string;
  permissions: string[];
  needsOrganisation: boolean;
  joinOnly?: boolean;
  oversight?: boolean;
}[] = [
  {
    role: "compliance-org",
    title: "Compliance Organisation",
    blurb:
      "An independent organisation providing compliance, verification, inspection, environmental, regulatory or technical assessment services in your sector.",
    permissions: ["Register organisation & personnel", "Run compliance reviews", "File inspection reports", "Raise non-conformities"],
    needsOrganisation: true,
  },
  {
    role: "compliance-officer",
    title: "Compliance Officer",
    blurb: "An authorised professional working under an existing organisation.",
    permissions: ["Work assigned reviews", "Upload evidence", "Track corrective actions"],
    needsOrganisation: true,
    joinOnly: true,
  },
  {
    role: "regulator-org",
    title: "Regulatory / Oversight Organisation",
    blurb: "A government agency or authorised institution participating in oversight.",
    permissions: ["View compliance register", "Request information", "Acknowledge submissions"],
    needsOrganisation: true,
    oversight: true,
  },
  {
    role: "regulator-officer",
    title: "Regulatory / Oversight Officer",
    blurb: "An authorised user operating under an approved regulatory organisation.",
    permissions: ["View assigned register", "Request information", "Flag sites"],
    needsOrganisation: true,
    joinOnly: true,
    oversight: true,
  },
  {
    role: "independent",
    title: "Independent Compliance Professional",
    blurb: "An individual professional providing eligible compliance services independently.",
    permissions: ["Accept assignments", "Upload accreditation evidence", "File findings"],
    needsOrganisation: false,
  },
];

export const registeredOrganisations = [
  { id: "org-1", name: "Nasarawa Lithium Minerals Ltd", rcNumber: "RC-1428871", state: "Nasarawa", admin: "A. Bello", sites: 3 },
  { id: "org-2", name: "Kogi Mineral Resources Plc", rcNumber: "RC-1039442", state: "Kogi", admin: "F. Adeyemi", sites: 2 },
  { id: "org-3", name: "Sunrise Minerals Holding Ltd", rcNumber: "RC-1655230", state: "Kwara", admin: "O. Ibrahim", sites: 2 },
  { id: "org-4", name: "Plateau Spodumene Ventures Ltd", rcNumber: "RC-1811204", state: "Plateau", admin: "J. Danladi", sites: 1 },
];

export const documentCatalogue = [
  "CAC Certificate of Incorporation",
  "CAC Status Report (Form CO7)",
  "Tax Identification Certificate",
  "Mining Licence / Lease",
  "Environmental Impact Assessment",
  "Community Development Agreement",
  "Health & Safety Policy",
  "Explosives Handling Permit",
  "Accreditation Certificate",
  "Professional Indemnity Insurance",
];

export const nigerianStates = [
  "Nasarawa",
  "Kogi",
  "Kwara",
  "Plateau",
  "Oyo",
  "Ekiti",
  "Kaduna",
  "FCT Abuja",
];

export const mineralOptions = ["Lithium (Spodumene)", "Lithium (Lepidolite)", "Tin", "Columbite", "Tantalite", "Feldspar"];

export const inspectionDisciplines = [
  "Geological verification",
  "Environmental monitoring",
  "Health & safety audit",
  "Equipment certification",
  "Sampling & assay oversight",
];

export const complianceServiceOptions = [
  "Mining Licence Verification",
  "Mineral Title Review",
  "Permit Verification",
  "Regulatory Compliance Review",
  "Mine Site Inspection",
  "Environmental Compliance",
  "EIA / Environmental Documentation Review",
  "HSE / Safety Assessment",
  "Mining Operations Review",
  "Production Compliance",
  "Geological / Technical Review",
  "GPS / Site Verification",
  "Document Verification",
  "Incident Investigation",
  "Other",
];

export const orgCredentialCatalogue = [
  "Certificate of Incorporation",
  "CAC Company Information",
  "TIN Evidence",
  "Company Profile",
  "Relevant Professional Registrations",
  "Relevant Government / Industry Authorisations",
  "Professional Indemnity Insurance (where applicable)",
  "Compliance Procedures",
  "Inspection Procedures",
  "Conflict of Interest Policy",
  "Code of Conduct",
  "Quality Assurance Procedure",
];

export const personnelRoleOptions = [
  "Compliance Manager",
  "Mining Compliance Officer",
  "Mining Engineer",
  "Geologist",
  "Environmental Specialist",
  "HSE Specialist",
  "Inspector",
  "Legal / Regulatory Specialist",
  "Technical Reviewer",
];

export const orgDeclarationItems = [
  { key: "accuracy", label: "Accuracy Declaration", detail: "All information supplied in this application is accurate and complete." },
  { key: "independence", label: "Independence Declaration", detail: "Compliance work will be carried out independently and objectively." },
  { key: "conflict", label: "Conflict of Interest Disclosure", detail: "Any conflict of interest will be disclosed to Beldium without delay." },
  { key: "dataIntegrity", label: "Data Integrity Declaration", detail: "Evidence, findings and reports will not be altered or misrepresented." },
  { key: "authorised", label: "Authorised Representative Declaration", detail: "I am authorised to submit this application on behalf of the organisation." },
];

export const reviewCapabilityOptions = [
  "Mining Licence / Mineral Title Verification",
  "Mine Site Verification",
  "Mine Location / GPS Verification",
  "Environmental Compliance",
  "EIA / Environmental Documentation Review",
  "HSE / Safety Compliance",
  "Mining Operations Review",
  "Production Capacity Review",
  "Geological Documentation Review",
  "Technical Mining Assessment",
  "Regulatory Documentation Review",
  "Mine Site Inspection",
  "Supporting Document Verification",
];

export const professionalDocumentCatalogue = [
  "Government ID",
  "CV",
  "Academic Qualifications",
  "Professional Certificates",
  "Professional Registration / Licence",
  "Evidence of Relevant Mining Experience",
  "Evidence of Previous Inspection / Compliance Work",
  "Other Supporting Documents",
];

export const professionalDeclarationItems = [
  { key: "accurate", label: "Information provided is accurate." },
  { key: "genuine", label: "Documents submitted are genuine." },
  { key: "independent", label: "Reviews will be conducted independently." },
  { key: "disclose", label: "Conflicts of interest will be disclosed." },
  { key: "confidential", label: "Miner information will remain confidential." },
  { key: "evidence", label: "Inspection and review findings will be evidence based." },
  { key: "verify", label: "Beldium may verify credentials and submitted information." },
];

export const independenceQuestions = [
  { key: "ownsMining", label: "Do you own or have a financial interest in a mining company?" },
  { key: "tradesMinerals", label: "Do you trade minerals?" },
  { key: "worksForMiner", label: "Do you work for a miner you may be assigned to review?" },
  { key: "otherRelationship", label: "Do you have any relationship that could affect independent judgement?" },
];

export const professionOptions = [
  "Mining Engineer",
  "Geologist",
  "Environmental Scientist",
  "HSE Professional",
  "Metallurgist",
  "Surveyor",
  "Legal / Regulatory Specialist",
  "Compliance Specialist",
];

export const regulatoryRoleOptions = [
  "Regulatory Administrator",
  "Regulatory Compliance Manager",
  "Senior Regulatory Officer",
  "Regulatory Compliance Officer",
  "Mining Inspector",
  "Environmental Compliance Officer",
  "Licensing and Permits Officer",
  "Technical / Mining Officer",
  "Health and Safety Officer",
  "Enforcement Officer",
  "Monitoring and Evaluation Officer",
  "Legal / Regulatory Officer",
  "Data and Reporting Analyst",
  "Audit / Investigation Officer",
  "Read Only / Oversight User",
  "Other",
];

export const partnerJoinRoleOptions = [
  "Compliance Manager",
  "Mining Compliance Officer",
  "Site Manager",
  "Director / Signatory",
  "Environmental Officer",
  "HSE Specialist",
  "Document Controller",
];

export const regulatorInstitutionTypes = [
  "Federal Ministry",
  "Federal Agency / Parastatal",
  "State Ministry",
  "State Agency",
  "Regulatory Commission",
  "Statutory Oversight Institution",
  "Other Authorised Institution",
];

export const regulatoryResponsibilityOptions = [
  "Mineral titles & licensing",
  "Mines inspectorate",
  "Environmental regulation",
  "Health & safety regulation",
  "Mines surveillance & enforcement",
  "Royalty & production monitoring",
  "Community & social compliance",
  "Data, statistics & reporting",
];

export const miningOversightFunctionOptions = [
  "Licence and permit oversight",
  "Mine site inspection",
  "Environmental monitoring",
  "Health and safety enforcement",
  "Production and royalty verification",
  "Incident investigation",
  "Regulatory reporting",
];

export const regulatorDocumentCatalogue = [
  "Establishment / Enabling Document",
  "Official Registration Evidence",
  "Regulatory Mandate Evidence",
  "Authorisation Document",
  "Organisation Profile",
  "Other Supporting Documents",
];

export const oversightCapabilityOptions = [
  "Mining licence oversight",
  "Permit verification",
  "Mine site inspection",
  "Environmental oversight",
  "Health and safety oversight",
  "Production monitoring",
  "Regulatory document review",
  "Compliance enforcement",
  "Incident review",
  "Compliance reporting",
  "Data / regulatory oversight",
];

export const regulatorDeclarationItems = [
  { key: "authority", label: "Organisation Authority", detail: "This organisation holds lawful authority to carry out the regulatory functions declared." },
  { key: "accuracy", label: "Accuracy of Information", detail: "All information and documents submitted are accurate and complete." },
  { key: "representative", label: "Authorised Representative", detail: "I am authorised to submit this application on behalf of the institution." },
  { key: "terms", label: "Beldium Terms & Data Requirements", detail: "The institution accepts Beldium's platform terms and data handling requirements." },
];

export const authorisationLevels = ["Administrator", "Approver", "Officer", "Read Only"];
