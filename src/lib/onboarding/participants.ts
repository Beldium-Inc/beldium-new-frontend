// What each sector asks one of its own companies when it registers (the
// applicant side of the onboarding screen). Mining and Logistics companies
// register on their own portals, so only these four are configured here.

import type { VerticalSlug } from "../verticals";

export type ParticipantField =
  | {
      key: string;
      label: string;
      kind: "text" | "number" | "date";
      required?: boolean;
      placeholder?: string;
    }
  | { key: string; label: string; kind: "select"; options: string[]; required?: boolean }
  | { key: string; label: string; kind: "chips"; options: string[]; required?: boolean }
  | { key: string; label: string; kind: "yesno"; required?: boolean }
  | { key: string; label: string; kind: "area"; required?: boolean; placeholder?: string };

export interface ParticipantConfig {
  /** "Processing company", "Exporter", ... */
  noun: string;
  /** The operations step: what the company does and at what scale. */
  operationsTitle: string;
  operations: ParticipantField[];
  /** A repeatable list (plants, warehouses, depots, owners). */
  sites: {
    title: string;
    itemLabel: string;
    columns: { key: string; label: string; placeholder?: string }[];
    min: number;
  };
  documents: { title: string; required: boolean }[];
  declarations: { key: string; label: string }[];
}

const MINERALS = [
  "Lithium (Spodumene / Lepidolite)",
  "Tin (Cassiterite)",
  "Columbite / Tantalite",
  "Gold",
  "Lead / Zinc",
  "Barite",
  "Iron ore",
  "Gemstones",
  "Other",
];

const CORPORATE_DOCS = [
  { title: "CAC Certificate of Incorporation", required: true },
  { title: "CAC Status Report (Form CO7)", required: true },
  { title: "Tax Identification Certificate", required: true },
];

const COMMON_DECLARATIONS = [
  { key: "accurate", label: "The information in this application is true and complete." },
  { key: "verify", label: "Beldium may verify it with the issuing authorities and third parties." },
  {
    key: "notLicence",
    label: "A Beldium compliance record is not a government licence or permit.",
  },
];

export const PARTICIPANTS: Partial<Record<VerticalSlug, ParticipantConfig>> = {
  processing: {
    noun: "Processing company",
    operationsTitle: "Processing operations",
    operations: [
      {
        key: "processingTypes",
        label: "What you do",
        kind: "chips",
        required: true,
        options: [
          "Concentration / beneficiation",
          "Smelting",
          "Refining",
          "Toll processing",
          "Chemical processing",
        ],
      },
      {
        key: "minerals",
        label: "Minerals you process",
        kind: "chips",
        required: true,
        options: MINERALS,
      },
      {
        key: "designCapacity",
        label: "Design capacity (tonnes per month)",
        kind: "number",
        required: true,
      },
      { key: "throughput", label: "Current throughput (tonnes per month)", kind: "number" },
      {
        key: "feedSources",
        label: "Where your feed comes from",
        kind: "chips",
        required: true,
        options: [
          "Own mines",
          "Licensed third-party miners",
          "Licensed traders / aggregators",
          "Imports",
        ],
      },
      {
        key: "outputs",
        label: "Products you sell",
        kind: "text",
        placeholder: "Spodumene concentrate 6% Li2O",
      },
      {
        key: "processingLicence",
        label: "Mineral processing licence number",
        kind: "text",
        required: true,
      },
    ],
    sites: {
      title: "Plants",
      itemLabel: "plant",
      min: 1,
      columns: [
        { key: "name", label: "Plant name" },
        { key: "address", label: "Address / LGA" },
        { key: "state", label: "State" },
        { key: "gps", label: "GPS", placeholder: "9.9, 8.9" },
        { key: "capacity", label: "Capacity (t/month)" },
      ],
    },
    documents: [
      ...CORPORATE_DOCS,
      { title: "Mineral Processing Licence", required: true },
      { title: "Environmental Impact Assessment / Permit", required: true },
      { title: "Factory registration (Occupational H&S)", required: false },
      { title: "Waste and tailings management plan", required: false },
      { title: "Feedstock sourcing policy", required: false },
    ],
    declarations: [
      ...COMMON_DECLARATIONS,
      { key: "sourcing", label: "We only process feed from licensed and traceable sources." },
    ],
  },
  warehousing: {
    noun: "Warehouse operator",
    operationsTitle: "Storage operations",
    operations: [
      {
        key: "storageTypes",
        label: "How you store material",
        kind: "chips",
        required: true,
        options: ["Covered warehouse", "Open yard", "Bagged / palletised", "Bulk", "Bonded store"],
      },
      {
        key: "minerals",
        label: "Minerals you store",
        kind: "chips",
        required: true,
        options: MINERALS,
      },
      { key: "totalCapacity", label: "Total capacity (tonnes)", kind: "number", required: true },
      {
        key: "security",
        label: "Security in place",
        kind: "chips",
        options: ["Perimeter fence", "CCTV", "24-hour guards", "Access log", "Sealed bays"],
      },
      { key: "weighbridge", label: "Weighbridge on site", kind: "yesno", required: true },
      { key: "bonded", label: "Licensed as a bonded warehouse", kind: "yesno" },
      {
        key: "operatingLicence",
        label: "Warehouse operating licence / permit number",
        kind: "text",
      },
    ],
    sites: {
      title: "Warehouses",
      itemLabel: "warehouse",
      min: 1,
      columns: [
        { key: "name", label: "Facility name" },
        { key: "address", label: "Address / LGA" },
        { key: "state", label: "State" },
        { key: "gps", label: "GPS", placeholder: "6.5, 3.4" },
        { key: "capacity", label: "Capacity (t)" },
      ],
    },
    documents: [
      ...CORPORATE_DOCS,
      { title: "Warehouse operating licence / permit", required: true },
      { title: "Fire safety certificate", required: true },
      { title: "Insurance for goods in custody", required: true },
      { title: "Bonded warehouse licence (if bonded)", required: false },
      { title: "Site layout plan", required: false },
    ],
    declarations: [
      ...COMMON_DECLARATIONS,
      { key: "custody", label: "We release stored material only against an authorised release." },
    ],
  },
  export: {
    noun: "Exporter",
    operationsTitle: "Export operations",
    operations: [
      {
        key: "minerals",
        label: "Minerals you export",
        kind: "chips",
        required: true,
        options: MINERALS,
      },
      {
        key: "destinations",
        label: "Main destination countries",
        kind: "text",
        required: true,
        placeholder: "China, UAE",
      },
      {
        key: "annualVolume",
        label: "Expected annual volume (tonnes)",
        kind: "number",
        required: true,
      },
      { key: "exportPermit", label: "Mineral export permit number", kind: "text", required: true },
      { key: "nepc", label: "NEPC registration number", kind: "text", required: true },
      {
        key: "exitPoints",
        label: "Ports or border crossings you use",
        kind: "chips",
        options: [
          "Apapa (Lagos)",
          "Tin Can (Lagos)",
          "Onne (Rivers)",
          "Seme border",
          "Airport cargo",
        ],
      },
      { key: "customsAgent", label: "Licensed customs agent", kind: "text" },
    ],
    sites: {
      title: "Depots and supply sources",
      itemLabel: "depot or source",
      min: 0,
      columns: [
        { key: "name", label: "Name" },
        { key: "type", label: "Type (depot, mine, processor)" },
        { key: "state", label: "State" },
        { key: "reference", label: "Licence / Beldium ID" },
      ],
    },
    documents: [
      ...CORPORATE_DOCS,
      { title: "Mineral export permit", required: true },
      { title: "NEPC export registration certificate", required: true },
      { title: "Royalty payment receipts (last 6 months)", required: false },
      { title: "AML / KYC policy", required: false },
    ],
    declarations: [
      ...COMMON_DECLARATIONS,
      { key: "origin", label: "Every consignment we export can be traced to a licensed source." },
    ],
  },
  marketplace: {
    noun: "Buyer, offtaker or OEM",
    operationsTitle: "Purchasing profile",
    operations: [
      {
        key: "participantType",
        label: "You are a",
        kind: "select",
        required: true,
        options: ["Buyer", "Offtaker", "OEM"],
      },
      {
        key: "minerals",
        label: "Minerals you want to buy",
        kind: "chips",
        required: true,
        options: MINERALS,
      },
      {
        key: "annualVolume",
        label: "Expected annual volume (tonnes)",
        kind: "number",
        required: true,
      },
      {
        key: "endUse",
        label: "End use",
        kind: "text",
        required: true,
        placeholder: "Battery precursor manufacturing",
      },
      { key: "countries", label: "Countries you operate in", kind: "text", required: true },
      {
        key: "sanctionsConsent",
        label: "We agree to sanctions and PEP screening",
        kind: "yesno",
        required: true,
      },
    ],
    sites: {
      title: "Beneficial owners",
      itemLabel: "owner",
      min: 1,
      columns: [
        { key: "name", label: "Full name" },
        { key: "nationality", label: "Nationality" },
        { key: "stake", label: "Ownership %" },
        { key: "pep", label: "Politically exposed? (yes / no)" },
      ],
    },
    documents: [
      { title: "Certificate of incorporation", required: true },
      { title: "Tax identification certificate", required: true },
      { title: "Proof of registered address", required: true },
      { title: "Beneficial ownership declaration", required: true },
      { title: "AML / KYC policy", required: false },
      { title: "Bank reference letter", required: false },
    ],
    declarations: [
      ...COMMON_DECLARATIONS,
      {
        key: "responsible",
        label: "We buy only verified material and will not resell it unverified.",
      },
    ],
  },
};
