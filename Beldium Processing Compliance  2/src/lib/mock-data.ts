// Static mock data for the Beldium Processing Compliance prototype.
// No backend, no persistence — everything here is illustrative demo content.

export type ReviewState = "pending" | "verified" | "rejected" | "info_requested" | "flagged";

export type SectionKey =
  | "corporate"
  | "regulatory"
  | "facility"
  | "environmental"
  | "health_safety"
  | "equipment"
  | "operational"
  | "quality"
  | "waste"
  | "inspection";

export const SECTIONS: { key: SectionKey; label: string; short: string }[] = [
  { key: "corporate", label: "Corporate & Legal Identity", short: "Corporate" },
  { key: "regulatory", label: "Regulatory Licences & Permits", short: "Regulatory" },
  { key: "facility", label: "Facility & Site Infrastructure", short: "Facility" },
  { key: "environmental", label: "Environmental Management", short: "Environmental" },
  { key: "health_safety", label: "Health, Safety & Workforce", short: "Health & Safety" },
  { key: "equipment", label: "Equipment & Process Technology", short: "Equipment" },
  { key: "operational", label: "Operational Controls", short: "Operational" },
  { key: "quality", label: "Quality Controls & Laboratory", short: "Quality" },
  { key: "waste", label: "Waste & Residue Handling", short: "Waste" },
  { key: "inspection", label: "Physical Inspection Readiness", short: "Inspection" },
];

export type ProcessingType =
  | "crushing_milling"
  | "chemical_refining"
  | "smelting"
  | "sorting_baling";

export const PROCESSING_TYPES: {
  key: ProcessingType;
  label: string;
  blurb: string;
  extra: string[];
}[] = [
  {
    key: "crushing_milling",
    label: "Crushing & Milling",
    blurb: "Mechanical size reduction of ore, aggregate or mineral feedstock.",
    extra: ["Dust suppression plan", "Noise & vibration survey", "Crusher calibration records"],
  },
  {
    key: "chemical_refining",
    label: "Chemical Processing / Refining",
    blurb: "Leaching, solvent extraction, acid handling and refining operations.",
    extra: [
      "NESREA effluent discharge permit",
      "Chemical inventory & MSDS register",
      "Tailings / effluent containment design",
      "Emergency chemical spill response plan",
      "Reagent storage bund certification",
    ],
  },
  {
    key: "smelting",
    label: "Smelting & Thermal Recovery",
    blurb: "High-temperature recovery with stack emissions and slag handling.",
    extra: ["Stack emission monitoring", "Slag disposal agreement", "Thermal PPE certification"],
  },
  {
    key: "sorting_baling",
    label: "Sorting, Washing & Baling",
    blurb: "Manual and mechanical separation, washing and densification.",
    extra: ["Wash water recycling plan", "Manual handling risk assessment"],
  },
];

export type DocItem = {
  id: string;
  name: string;
  ref: string;
  issuer: string;
  issued: string;
  expires: string | null;
  status: "valid" | "expiring" | "expired" | "missing";
};

export type Field = { label: string; value: string; flag?: "ok" | "warn" | "bad" };

export type SectionData = {
  key: SectionKey;
  fields: Field[];
  docs: DocItem[];
  notes?: string;
};

export type Application = {
  id: string;
  company: string;
  rcNumber: string;
  tin: string;
  processingType: ProcessingType;
  state: string;
  lga: string;
  facility: string;
  submitted: string;
  contact: string;
  email: string;
  phone: string;
  capacity: string;
  workforce: number;
  riskScore: number;
  riskBand: "low" | "medium" | "high";
  stage: "New" | "In Review" | "Awaiting Info" | "Inspection" | "Decided";
  decision?: "Approved" | "Conditional Approval" | "More Info Required" | "Rejected";
  completeness: number;
  riskCauses: { cause: string; weight: number; detail: string }[];
  sections: Record<SectionKey, SectionData>;
};

const doc = (
  id: string,
  name: string,
  ref: string,
  issuer: string,
  issued: string,
  expires: string | null,
  status: DocItem["status"],
): DocItem => ({ id, name, ref, issuer, issued, expires, status });

function baseSections(overrides: Partial<Record<SectionKey, Partial<SectionData>>> = {}) {
  const defaults: Record<SectionKey, SectionData> = {
    corporate: {
      key: "corporate",
      fields: [
        { label: "Registered name", value: "—" },
        { label: "CAC RC number", value: "—" },
        { label: "Tax Identification Number (TIN)", value: "—" },
        { label: "Company type", value: "Private Limited (Ltd)" },
        { label: "Directors declared", value: "3" },
        { label: "Beneficial ownership disclosed", value: "Yes", flag: "ok" },
      ],
      docs: [
        doc("d1", "CAC Certificate of Incorporation", "RC-DOC-1", "CAC", "2019-03-12", null, "valid"),
        doc("d2", "CAC Status Report (CAC 1.1)", "SR-2026-114", "CAC", "2026-01-20", "2027-01-20", "valid"),
        doc("d3", "FIRS Tax Clearance Certificate", "TCC/2026/8841", "FIRS", "2026-02-02", "2026-12-31", "valid"),
      ],
    },
    regulatory: {
      key: "regulatory",
      fields: [
        { label: "Mining/Processing licence class", value: "Mineral Processing Licence" },
        { label: "Issuing authority", value: "Mining Cadastre Office" },
        { label: "NESREA registration", value: "Registered", flag: "ok" },
        { label: "State environmental permit", value: "Held", flag: "ok" },
      ],
      docs: [
        doc("d4", "Mineral Processing Licence", "MPL/NG/2023/0417", "Mining Cadastre Office", "2023-06-01", "2028-05-31", "valid"),
        doc("d5", "NESREA Facility Registration", "NESREA/FR/2025/2210", "NESREA", "2025-04-11", "2026-10-10", "expiring"),
        doc("d6", "State Environmental Permit", "SEP/OY/2025/077", "State Ministry of Environment", "2025-08-01", "2026-07-31", "valid"),
      ],
    },
    facility: {
      key: "facility",
      fields: [
        { label: "Site address", value: "—" },
        { label: "Land title / C of O", value: "Held", flag: "ok" },
        { label: "Site area", value: "4.8 hectares" },
        { label: "Perimeter security", value: "Fenced, 24h manned gate" },
        { label: "Weighbridge", value: "Calibrated 60t bridge" },
        { label: "Power source", value: "Grid + 500kVA standby" },
      ],
      docs: [
        doc("d7", "Certificate of Occupancy", "C-of-O/2018/3312", "State Land Bureau", "2018-11-04", null, "valid"),
        doc("d8", "Weighbridge Calibration Certificate", "WB-CAL-2026-19", "SON Approved Calibrator", "2026-01-15", "2027-01-14", "valid"),
        doc("d9", "Site Layout & Process Flow Drawing", "DWG-SITE-04", "Applicant", "2025-12-01", null, "valid"),
      ],
    },
    environmental: {
      key: "environmental",
      fields: [
        { label: "EIA / EMP status", value: "EMP approved" },
        { label: "Effluent discharge route", value: "Closed loop, no surface discharge", flag: "ok" },
        { label: "Air quality monitoring", value: "Quarterly, third-party" },
        { label: "Last effluent test", value: "2026-06-18" },
        { label: "Community grievance log", value: "Maintained" },
      ],
      docs: [
        doc("d10", "Environmental Management Plan", "EMP-2025-118", "Accredited Consultant", "2025-05-20", "2028-05-19", "valid"),
        doc("d11", "Quarterly Effluent Analysis Report", "EFF-Q2-2026", "Independent Lab", "2026-06-25", null, "valid"),
      ],
    },
    health_safety: {
      key: "health_safety",
      fields: [
        { label: "HSE officer appointed", value: "Yes — full-time" },
        { label: "PPE issuance register", value: "Maintained" },
        { label: "Lost-time injuries (12 mo)", value: "1", flag: "warn" },
        { label: "Emergency drill frequency", value: "Quarterly" },
        { label: "Workforce medical screening", value: "Annual" },
      ],
      docs: [
        doc("d12", "HSE Policy & Procedures Manual", "HSE-MAN-v4", "Applicant", "2025-09-10", null, "valid"),
        doc("d13", "Fire Safety Certificate", "FSC/2025/4410", "State Fire Service", "2025-10-02", "2026-10-01", "expiring"),
        doc("d14", "Employee Group Accident Cover", "INS-GA-2026", "Insurer", "2026-01-01", "2026-12-31", "valid"),
      ],
    },
    equipment: {
      key: "equipment",
      fields: [
        { label: "Primary process line", value: "—" },
        { label: "Installed capacity", value: "—" },
        { label: "Maintenance regime", value: "Planned preventive, monthly" },
        { label: "Calibration programme", value: "Annual, third-party" },
      ],
      docs: [
        doc("d15", "Equipment Asset Register", "EQ-REG-2026", "Applicant", "2026-02-01", null, "valid"),
        doc("d16", "Pressure Vessel Integrity Test", "PVI-2025-08", "Certified Inspector", "2025-08-14", "2026-08-13", "expiring"),
      ],
    },
    operational: {
      key: "operational",
      fields: [
        { label: "Batch traceability system", value: "Beldium Batch ID enabled", flag: "ok" },
        { label: "Input source verification", value: "Supplier due-diligence file" },
        { label: "Shift logging", value: "Digital run sheets" },
        { label: "Chain of custody", value: "Documented per run" },
        { label: "Reconciliation frequency", value: "Per production run" },
      ],
      docs: [
        doc("d17", "Standard Operating Procedures Pack", "SOP-PACK-v6", "Applicant", "2026-01-08", null, "valid"),
        doc("d18", "Input Supplier Due-Diligence Register", "SDD-2026", "Applicant", "2026-03-02", null, "valid"),
      ],
    },
    quality: {
      key: "quality",
      fields: [
        { label: "On-site laboratory", value: "Yes" },
        { label: "Assay method", value: "XRF + wet chemistry cross-check" },
        { label: "Third-party verification lab", value: "Engaged" },
        { label: "Retention sample policy", value: "90 days per output batch" },
      ],
      docs: [
        doc("d19", "Laboratory Quality Manual", "LQM-v3", "Applicant", "2025-11-11", null, "valid"),
        doc("d20", "XRF Calibration Certificate", "XRF-CAL-2026-2", "OEM Service", "2026-02-19", "2027-02-18", "valid"),
      ],
    },
    waste: {
      key: "waste",
      fields: [
        { label: "Waste streams identified", value: "Slag, wash sludge, packaging" },
        { label: "Licensed waste handler", value: "Contracted" },
        { label: "Tailings storage", value: "Lined containment cell" },
        { label: "Waste manifest system", value: "In use" },
      ],
      docs: [
        doc("d21", "Waste Handler Contract", "WH-CT-2026-3", "Licensed Handler", "2026-01-05", "2027-01-04", "valid"),
        doc("d22", "Waste Manifest Sample Set", "WM-SAMPLE", "Applicant", "2026-05-30", null, "valid"),
      ],
    },
    inspection: {
      key: "inspection",
      fields: [
        { label: "Preferred inspection window", value: "Weekdays, 09:00–15:00" },
        { label: "Site access constraints", value: "Escort required beyond gatehouse" },
        { label: "Previous inspection", value: "None on record" },
        { label: "Self-declared readiness", value: "Ready" },
      ],
      docs: [
        doc("d23", "Site Access & Induction Pack", "ACC-PACK-2026", "Applicant", "2026-04-02", null, "valid"),
      ],
    },
  };

  for (const k of Object.keys(overrides) as SectionKey[]) {
    defaults[k] = { ...defaults[k], ...overrides[k] } as SectionData;
  }
  return defaults;
}

export const APPLICATIONS: Application[] = [
  {
    id: "BPC-APP-2026-0142",
    company: "Ilesa Mineral Processing Ltd",
    rcNumber: "RC 1428907",
    tin: "20418833-0001",
    processingType: "chemical_refining",
    state: "Osun",
    lga: "Ilesa East",
    facility: "Ilesa Refining Plant A",
    submitted: "2026-07-28",
    contact: "Adebayo Ogunleye",
    email: "a.ogunleye@ilesamineral.ng",
    phone: "+234 803 441 2290",
    capacity: "180 t/month",
    workforce: 84,
    riskScore: 68,
    riskBand: "high",
    stage: "In Review",
    completeness: 86,
    riskCauses: [
      { cause: "Chemical/refining process class", weight: 22, detail: "Acid leaching and solvent extraction on site raises inherent process hazard weighting." },
      { cause: "Expiring NESREA registration", weight: 16, detail: "Facility registration NESREA/FR/2025/2210 expires within 60 days." },
      { cause: "Effluent containment design gaps", weight: 14, detail: "Bund capacity calculation not provided for reagent store." },
      { cause: "One lost-time injury in 12 months", weight: 9, detail: "Recorded LTI in Q4 2025; corrective action file incomplete." },
      { cause: "No prior physical inspection", weight: 7, detail: "First-time applicant with no verified site history." },
    ],
    sections: baseSections({
      corporate: {
        key: "corporate",
        fields: [
          { label: "Registered name", value: "Ilesa Mineral Processing Ltd" },
          { label: "CAC RC number", value: "RC 1428907" },
          { label: "Tax Identification Number (TIN)", value: "20418833-0001" },
          { label: "Company type", value: "Private Limited (Ltd)" },
          { label: "Directors declared", value: "4" },
          { label: "Beneficial ownership disclosed", value: "Yes", flag: "ok" },
        ],
        docs: [
          doc("d1", "CAC Certificate of Incorporation", "RC 1428907", "CAC", "2019-03-12", null, "valid"),
          doc("d2", "CAC Status Report (CAC 1.1)", "SR-2026-114", "CAC", "2026-01-20", "2027-01-20", "valid"),
          doc("d3", "FIRS Tax Clearance Certificate", "TCC/2026/8841", "FIRS", "2026-02-02", "2026-12-31", "valid"),
        ],
      },
      facility: {
        key: "facility",
        fields: [
          { label: "Site address", value: "Plot 14, Ilesa Industrial Layout, Osun State" },
          { label: "LGA", value: "Ilesa East" },
          { label: "Land title / C of O", value: "Held", flag: "ok" },
          { label: "Site area", value: "6.2 hectares" },
          { label: "Perimeter security", value: "Fenced, 24h manned gate" },
          { label: "Weighbridge", value: "Calibrated 60t bridge" },
        ],
        docs: [
          doc("d7", "Certificate of Occupancy", "C-of-O/OS/2018/3312", "Osun State Land Bureau", "2018-11-04", null, "valid"),
          doc("d8", "Weighbridge Calibration Certificate", "WB-CAL-2026-19", "SON Approved Calibrator", "2026-01-15", "2027-01-14", "valid"),
        ],
      },
      environmental: {
        key: "environmental",
        notes: "Bund capacity calculation for the reagent store was not attached to the EMP annex.",
        fields: [
          { label: "EIA / EMP status", value: "EMP approved" },
          { label: "Effluent discharge route", value: "Closed loop, no surface discharge", flag: "ok" },
          { label: "Reagent bund capacity calc", value: "Not provided", flag: "bad" },
          { label: "Air quality monitoring", value: "Quarterly, third-party" },
          { label: "Last effluent test", value: "2026-06-18" },
        ],
        docs: [
          doc("d10", "Environmental Management Plan", "EMP-2025-118", "Accredited Consultant", "2025-05-20", "2028-05-19", "valid"),
          doc("d11", "Quarterly Effluent Analysis Report", "EFF-Q2-2026", "Independent Lab", "2026-06-25", null, "valid"),
          doc("d11b", "Reagent Bund Capacity Calculation", "—", "Applicant", "—", null, "missing"),
        ],
      },
      equipment: {
        key: "equipment",
        fields: [
          { label: "Primary process line", value: "Leach tanks + solvent extraction train" },
          { label: "Installed capacity", value: "180 t/month" },
          { label: "Maintenance regime", value: "Planned preventive, monthly" },
          { label: "Calibration programme", value: "Annual, third-party" },
        ],
        docs: [
          doc("d15", "Equipment Asset Register", "EQ-REG-2026", "Applicant", "2026-02-01", null, "valid"),
          doc("d16", "Pressure Vessel Integrity Test", "PVI-2025-08", "Certified Inspector", "2025-08-14", "2026-08-13", "expiring"),
        ],
      },
    }),
  },
  {
    id: "BPC-APP-2026-0138",
    company: "Kaduna Aggregate Crushing Co.",
    rcNumber: "RC 998117",
    tin: "11940022-0001",
    processingType: "crushing_milling",
    state: "Kaduna",
    lga: "Chikun",
    facility: "Chikun Quarry Plant",
    submitted: "2026-07-22",
    contact: "Fatima Bello",
    email: "f.bello@kadunaagg.ng",
    phone: "+234 806 220 7741",
    capacity: "900 t/month",
    workforce: 121,
    riskScore: 34,
    riskBand: "medium",
    stage: "Awaiting Info",
    completeness: 72,
    riskCauses: [
      { cause: "Dust suppression evidence incomplete", weight: 12, detail: "Water spray coverage map missing for secondary crusher." },
      { cause: "Community grievance log entries", weight: 10, detail: "Two noise complaints logged in Q1 2026." },
      { cause: "High throughput volume", weight: 8, detail: "900 t/month places facility in upper tier for monitoring." },
      { cause: "Fire safety certificate expiring", weight: 4, detail: "Expires in 47 days." },
    ],
    sections: baseSections({
      corporate: {
        key: "corporate",
        fields: [
          { label: "Registered name", value: "Kaduna Aggregate Crushing Co." },
          { label: "CAC RC number", value: "RC 998117" },
          { label: "Tax Identification Number (TIN)", value: "11940022-0001" },
          { label: "Company type", value: "Private Limited (Ltd)" },
          { label: "Directors declared", value: "3" },
          { label: "Beneficial ownership disclosed", value: "Yes", flag: "ok" },
        ],
        docs: [
          doc("d1", "CAC Certificate of Incorporation", "RC 998117", "CAC", "2016-07-19", null, "valid"),
          doc("d3", "FIRS Tax Clearance Certificate", "TCC/2026/2210", "FIRS", "2026-01-30", "2026-12-31", "valid"),
        ],
      },
      facility: {
        key: "facility",
        fields: [
          { label: "Site address", value: "Km 12 Kachia Road, Chikun, Kaduna State" },
          { label: "LGA", value: "Chikun" },
          { label: "Land title / C of O", value: "Held", flag: "ok" },
          { label: "Site area", value: "18 hectares" },
          { label: "Weighbridge", value: "Calibrated 80t bridge" },
          { label: "Dust suppression coverage map", value: "Partial", flag: "warn" },
        ],
        docs: [
          doc("d7", "Certificate of Occupancy", "C-of-O/KD/2015/1180", "Kaduna State Land Bureau", "2015-02-10", null, "valid"),
        ],
      },
    }),
  },
  {
    id: "BPC-APP-2026-0151",
    company: "Port Harcourt Metal Recovery Ltd",
    rcNumber: "RC 1720445",
    tin: "30881204-0001",
    processingType: "smelting",
    state: "Rivers",
    lga: "Obio-Akpor",
    facility: "Trans-Amadi Recovery Works",
    submitted: "2026-08-05",
    contact: "Chinedu Okafor",
    email: "c.okafor@phmetal.ng",
    phone: "+234 810 553 6612",
    capacity: "260 t/month",
    workforce: 66,
    riskScore: 55,
    riskBand: "high",
    stage: "Inspection",
    completeness: 91,
    riskCauses: [
      { cause: "Thermal / stack emission process class", weight: 20, detail: "Smelting operations require continuous stack monitoring." },
      { cause: "Urban-adjacent siting", weight: 15, detail: "Facility sits within 800m of residential Trans-Amadi housing." },
      { cause: "Open non-conformity", weight: 12, detail: "NC-2026-018 slag storage exceedance remains open." },
      { cause: "Slag disposal agreement expiring", weight: 8, detail: "Handler contract expires in 90 days." },
    ],
    sections: baseSections({
      corporate: {
        key: "corporate",
        fields: [
          { label: "Registered name", value: "Port Harcourt Metal Recovery Ltd" },
          { label: "CAC RC number", value: "RC 1720445" },
          { label: "Tax Identification Number (TIN)", value: "30881204-0001" },
          { label: "Company type", value: "Private Limited (Ltd)" },
          { label: "Directors declared", value: "5" },
          { label: "Beneficial ownership disclosed", value: "Yes", flag: "ok" },
        ],
        docs: [
          doc("d1", "CAC Certificate of Incorporation", "RC 1720445", "CAC", "2021-09-30", null, "valid"),
        ],
      },
      facility: {
        key: "facility",
        fields: [
          { label: "Site address", value: "27 Trans-Amadi Industrial Layout, Rivers State" },
          { label: "LGA", value: "Obio-Akpor" },
          { label: "Nearest residential boundary", value: "780 m", flag: "warn" },
          { label: "Site area", value: "3.1 hectares" },
        ],
        docs: [
          doc("d7", "Certificate of Occupancy", "C-of-O/RV/2020/8891", "Rivers State Land Bureau", "2020-05-16", null, "valid"),
        ],
      },
    }),
  },
  {
    id: "BPC-APP-2026-0129",
    company: "Jos Tin Sorting Enterprises",
    rcNumber: "RC 774318",
    tin: "10022778-0001",
    processingType: "sorting_baling",
    state: "Plateau",
    lga: "Jos South",
    facility: "Bukuru Sorting Yard",
    submitted: "2026-07-09",
    contact: "Grace Danjuma",
    email: "g.danjuma@jostin.ng",
    phone: "+234 802 118 9930",
    capacity: "410 t/month",
    workforce: 45,
    riskScore: 18,
    riskBand: "low",
    stage: "New",
    completeness: 64,
    riskCauses: [
      { cause: "Low-hazard mechanical process class", weight: 6, detail: "Sorting and baling carry limited inherent hazard." },
      { cause: "Documentation completeness 64%", weight: 8, detail: "Quality and waste sections partially populated." },
      { cause: "Informal labour exposure", weight: 4, detail: "Seasonal casual workforce not fully on medical screening register." },
    ],
    sections: baseSections({
      corporate: {
        key: "corporate",
        fields: [
          { label: "Registered name", value: "Jos Tin Sorting Enterprises" },
          { label: "CAC RC number", value: "RC 774318" },
          { label: "Tax Identification Number (TIN)", value: "10022778-0001" },
          { label: "Company type", value: "Private Limited (Ltd)" },
          { label: "Directors declared", value: "2" },
          { label: "Beneficial ownership disclosed", value: "Yes", flag: "ok" },
        ],
        docs: [doc("d1", "CAC Certificate of Incorporation", "RC 774318", "CAC", "2014-04-22", null, "valid")],
      },
      facility: {
        key: "facility",
        fields: [
          { label: "Site address", value: "Bukuru Industrial Road, Jos South, Plateau State" },
          { label: "LGA", value: "Jos South" },
          { label: "Site area", value: "2.4 hectares" },
          { label: "Weighbridge", value: "Shared third-party bridge", flag: "warn" },
        ],
        docs: [doc("d7", "Certificate of Occupancy", "C-of-O/PL/2013/2044", "Plateau State Land Bureau", "2013-08-01", null, "valid")],
      },
    }),
  },
  {
    id: "BPC-APP-2026-0117",
    company: "Ogun Industrial Minerals Plc",
    rcNumber: "RC 501992",
    tin: "40119922-0001",
    processingType: "crushing_milling",
    state: "Ogun",
    lga: "Ewekoro",
    facility: "Ewekoro Milling Complex",
    submitted: "2026-06-30",
    contact: "Tunde Adeniyi",
    email: "t.adeniyi@ogunminerals.ng",
    phone: "+234 809 774 1120",
    capacity: "1,250 t/month",
    workforce: 208,
    riskScore: 26,
    riskBand: "medium",
    stage: "Decided",
    decision: "Approved",
    completeness: 100,
    riskCauses: [
      { cause: "Large workforce scale", weight: 10, detail: "208 workers increases HSE oversight burden." },
      { cause: "High throughput volume", weight: 9, detail: "1,250 t/month upper-tier monitoring." },
      { cause: "Clean inspection history", weight: -8, detail: "Two consecutive inspections with no major findings." },
    ],
    sections: baseSections({
      corporate: {
        key: "corporate",
        fields: [
          { label: "Registered name", value: "Ogun Industrial Minerals Plc" },
          { label: "CAC RC number", value: "RC 501992" },
          { label: "Tax Identification Number (TIN)", value: "40119922-0001" },
          { label: "Company type", value: "Public Limited (Plc)" },
          { label: "Directors declared", value: "7" },
          { label: "Beneficial ownership disclosed", value: "Yes", flag: "ok" },
        ],
        docs: [doc("d1", "CAC Certificate of Incorporation", "RC 501992", "CAC", "2009-01-14", null, "valid")],
      },
    }),
  },
];

export type NonConformity = {
  id: string;
  applicationId: string;
  company: string;
  section: SectionKey;
  severity: "Minor" | "Major" | "Critical";
  title: string;
  detail: string;
  raised: string;
  due: string;
  status: "Open" | "Evidence Submitted" | "Closed";
  evidence?: { name: string; submitted: string; note: string };
};

export const NON_CONFORMITIES: NonConformity[] = [
  {
    id: "NC-2026-018",
    applicationId: "BPC-APP-2026-0151",
    company: "Port Harcourt Metal Recovery Ltd",
    section: "waste",
    severity: "Major",
    title: "Slag storage exceeds designated containment area",
    detail: "Slag stockpile observed outside the lined containment cell during pre-inspection photo review.",
    raised: "2026-08-06",
    due: "2026-09-05",
    status: "Evidence Submitted",
    evidence: {
      name: "Slag relocation photo set + handler manifest",
      submitted: "2026-08-19",
      note: "Stockpile relocated to lined cell; manifest WM-2026-0912 attached for 42t removed off-site.",
    },
  },
  {
    id: "NC-2026-021",
    applicationId: "BPC-APP-2026-0142",
    company: "Ilesa Mineral Processing Ltd",
    section: "environmental",
    severity: "Critical",
    title: "Reagent bund capacity calculation not provided",
    detail: "EMP annex omits the 110% bund capacity calculation for the acid reagent store.",
    raised: "2026-08-11",
    due: "2026-08-25",
    status: "Open",
  },
  {
    id: "NC-2026-014",
    applicationId: "BPC-APP-2026-0138",
    company: "Kaduna Aggregate Crushing Co.",
    section: "facility",
    severity: "Minor",
    title: "Dust suppression coverage map incomplete",
    detail: "Secondary crusher spray coverage not shown on submitted layout.",
    raised: "2026-07-30",
    due: "2026-08-29",
    status: "Open",
  },
  {
    id: "NC-2026-009",
    applicationId: "BPC-APP-2026-0117",
    company: "Ogun Industrial Minerals Plc",
    section: "health_safety",
    severity: "Minor",
    title: "PPE register gaps for contract workforce",
    detail: "Issuance records missing for 11 contract staff in March cycle.",
    raised: "2026-07-02",
    due: "2026-08-01",
    status: "Closed",
    evidence: {
      name: "Updated PPE issuance register",
      submitted: "2026-07-24",
      note: "All 11 records backfilled and countersigned by HSE officer.",
    },
  },
];

export type Inspection = {
  id: string;
  applicationId: string;
  company: string;
  facility: string;
  state: string;
  scheduled: string;
  inspector: string;
  type: "Pre-approval" | "Routine" | "Follow-up" | "Incident-triggered";
  status: "Scheduled" | "In Progress" | "Completed" | "Requested";
  outcome?: string;
};

export const INSPECTIONS: Inspection[] = [
  {
    id: "INS-2026-0431",
    applicationId: "BPC-APP-2026-0151",
    company: "Port Harcourt Metal Recovery Ltd",
    facility: "Trans-Amadi Recovery Works",
    state: "Rivers",
    scheduled: "2026-08-27",
    inspector: "Eng. Musa Ibrahim",
    type: "Pre-approval",
    status: "Scheduled",
  },
  {
    id: "INS-2026-0428",
    applicationId: "BPC-APP-2026-0142",
    company: "Ilesa Mineral Processing Ltd",
    facility: "Ilesa Refining Plant A",
    state: "Osun",
    scheduled: "2026-09-02",
    inspector: "Unassigned",
    type: "Pre-approval",
    status: "Requested",
  },
  {
    id: "INS-2026-0410",
    applicationId: "BPC-APP-2026-0138",
    company: "Kaduna Aggregate Crushing Co.",
    facility: "Chikun Quarry Plant",
    state: "Kaduna",
    scheduled: "2026-08-14",
    inspector: "Mrs. Halima Yusuf",
    type: "Follow-up",
    status: "Completed",
    outcome: "2 minor findings — dust suppression, signage",
  },
  {
    id: "INS-2026-0399",
    applicationId: "BPC-APP-2026-0117",
    company: "Ogun Industrial Minerals Plc",
    facility: "Ewekoro Milling Complex",
    state: "Ogun",
    scheduled: "2026-07-18",
    inspector: "Eng. Musa Ibrahim",
    type: "Routine",
    status: "Completed",
    outcome: "No major findings",
  },
];

export type Processor = {
  id: string;
  name: string;
  rcNumber: string;
  tin: string;
  state: string;
  lga: string;
  facilities: number;
  processingType: ProcessingType;
  status: "Approved" | "Conditional" | "Suspended" | "Under Review";
  complianceScore: number;
  lastInspection: string;
  openNCs: number;
  registered: string;
};

export const PROCESSORS: Processor[] = [
  {
    id: "PRC-0041",
    name: "Ogun Industrial Minerals Plc",
    rcNumber: "RC 501992",
    tin: "40119922-0001",
    state: "Ogun",
    lga: "Ewekoro",
    facilities: 3,
    processingType: "crushing_milling",
    status: "Approved",
    complianceScore: 92,
    lastInspection: "2026-07-18",
    openNCs: 0,
    registered: "2021-03-04",
  },
  {
    id: "PRC-0058",
    name: "Port Harcourt Metal Recovery Ltd",
    rcNumber: "RC 1720445",
    tin: "30881204-0001",
    state: "Rivers",
    lga: "Obio-Akpor",
    facilities: 1,
    processingType: "smelting",
    status: "Conditional",
    complianceScore: 64,
    lastInspection: "2026-05-11",
    openNCs: 1,
    registered: "2023-01-19",
  },
  {
    id: "PRC-0063",
    name: "Kaduna Aggregate Crushing Co.",
    rcNumber: "RC 998117",
    tin: "11940022-0001",
    state: "Kaduna",
    lga: "Chikun",
    facilities: 2,
    processingType: "crushing_milling",
    status: "Under Review",
    complianceScore: 71,
    lastInspection: "2026-08-14",
    openNCs: 1,
    registered: "2022-11-02",
  },
  {
    id: "PRC-0070",
    name: "Ilesa Mineral Processing Ltd",
    rcNumber: "RC 1428907",
    tin: "20418833-0001",
    state: "Osun",
    lga: "Ilesa East",
    facilities: 1,
    processingType: "chemical_refining",
    status: "Under Review",
    complianceScore: 58,
    lastInspection: "—",
    openNCs: 1,
    registered: "2026-07-28",
  },
  {
    id: "PRC-0033",
    name: "Enugu Coal Preparation Ltd",
    rcNumber: "RC 660214",
    tin: "50231144-0001",
    state: "Enugu",
    lga: "Udi",
    facilities: 1,
    processingType: "crushing_milling",
    status: "Suspended",
    complianceScore: 41,
    lastInspection: "2026-04-03",
    openNCs: 3,
    registered: "2020-06-15",
  },
  {
    id: "PRC-0029",
    name: "Jos Tin Sorting Enterprises",
    rcNumber: "RC 774318",
    tin: "10022778-0001",
    state: "Plateau",
    lga: "Jos South",
    facilities: 1,
    processingType: "sorting_baling",
    status: "Under Review",
    complianceScore: 76,
    lastInspection: "2025-12-09",
    openNCs: 0,
    registered: "2019-10-21",
  },
];

export const REGIONAL_COMPLIANCE = [
  { region: "South West", processors: 34, compliant: 27, conditional: 5, suspended: 2, avgScore: 81 },
  { region: "North Central", processors: 21, compliant: 15, conditional: 4, suspended: 2, avgScore: 74 },
  { region: "South South", processors: 18, compliant: 11, conditional: 5, suspended: 2, avgScore: 69 },
  { region: "North West", processors: 26, compliant: 20, conditional: 4, suspended: 2, avgScore: 77 },
  { region: "South East", processors: 14, compliant: 9, conditional: 3, suspended: 2, avgScore: 66 },
  { region: "North East", processors: 9, compliant: 6, conditional: 2, suspended: 1, avgScore: 71 },
];

export type EnvAlert = {
  id: string;
  facility: string;
  state: string;
  parameter: string;
  reading: string;
  threshold: string;
  severity: "Warning" | "Critical";
  detected: string;
  status: "Open" | "Acknowledged" | "Resolved";
};

export const ENV_ALERTS: EnvAlert[] = [
  { id: "ENV-2026-0091", facility: "Trans-Amadi Recovery Works", state: "Rivers", parameter: "Stack particulate (PM10)", reading: "128 µg/m³", threshold: "100 µg/m³", severity: "Critical", detected: "2026-08-18", status: "Open" },
  { id: "ENV-2026-0088", facility: "Chikun Quarry Plant", state: "Kaduna", parameter: "Ambient dust (TSP)", reading: "231 µg/m³", threshold: "200 µg/m³", severity: "Warning", detected: "2026-08-15", status: "Acknowledged" },
  { id: "ENV-2026-0081", facility: "Ilesa Refining Plant A", state: "Osun", parameter: "Effluent pH", reading: "5.4", threshold: "6.0 – 9.0", severity: "Warning", detected: "2026-08-09", status: "Open" },
  { id: "ENV-2026-0074", facility: "Ewekoro Milling Complex", state: "Ogun", parameter: "Noise (boundary, night)", reading: "58 dB", threshold: "55 dB", severity: "Warning", detected: "2026-07-30", status: "Resolved" },
];

export type Incident = {
  id: string;
  facility: string;
  state: string;
  type: string;
  severity: "Low" | "Moderate" | "Severe";
  reported: string;
  status: "Under Investigation" | "Closed" | "Reported";
  summary: string;
};

export const INCIDENTS: Incident[] = [
  { id: "INC-2026-0037", facility: "Trans-Amadi Recovery Works", state: "Rivers", type: "Uncontrolled emission event", severity: "Severe", reported: "2026-08-17", status: "Under Investigation", summary: "Baghouse bypass during furnace tap led to visible stack plume for ~40 minutes." },
  { id: "INC-2026-0032", facility: "Chikun Quarry Plant", state: "Kaduna", type: "Equipment failure", severity: "Moderate", reported: "2026-08-02", status: "Under Investigation", summary: "Secondary crusher bearing seizure; no injuries, production halted 11 hours." },
  { id: "INC-2026-0028", facility: "Ilesa Refining Plant A", state: "Osun", type: "Chemical spill (contained)", severity: "Moderate", reported: "2026-07-21", status: "Closed", summary: "12 litres of sulphuric acid released within bunded area; neutralised on site." },
  { id: "INC-2026-0019", facility: "Ewekoro Milling Complex", state: "Ogun", type: "Lost-time injury", severity: "Low", reported: "2026-06-14", status: "Closed", summary: "Hand laceration during belt maintenance; 3 days lost, retraining completed." },
];

export type AuditEvent = {
  id: string;
  at: string;
  actor: string;
  role: string;
  action: string;
  target: string;
  detail: string;
};

export const AUDIT_LOG: AuditEvent[] = [
  { id: "A-9921", at: "2026-08-20 14:22", actor: "O. Adeyemi", role: "Compliance Operator", action: "Non-conformity raised", target: "NC-2026-021", detail: "Critical NC on Environmental section of BPC-APP-2026-0142." },
  { id: "A-9918", at: "2026-08-20 11:05", actor: "O. Adeyemi", role: "Compliance Operator", action: "Section verified", target: "BPC-APP-2026-0142 · Corporate", detail: "CAC and TIN cross-checked against registry extract." },
  { id: "A-9911", at: "2026-08-19 16:48", actor: "System", role: "Platform", action: "Evidence submitted", target: "NC-2026-018", detail: "Applicant uploaded slag relocation photo set + manifest." },
  { id: "A-9903", at: "2026-08-18 09:31", actor: "Env. Monitoring Feed", role: "Platform", action: "Environmental alert", target: "ENV-2026-0091", detail: "PM10 exceedance at Trans-Amadi Recovery Works." },
  { id: "A-9890", at: "2026-08-14 15:10", actor: "H. Yusuf", role: "Inspector", action: "Inspection completed", target: "INS-2026-0410", detail: "Follow-up inspection at Chikun Quarry Plant, 2 minor findings." },
  { id: "A-9871", at: "2026-08-11 10:02", actor: "O. Adeyemi", role: "Compliance Operator", action: "Information requested", target: "BPC-APP-2026-0138", detail: "Requested secondary crusher dust suppression coverage map." },
  { id: "A-9854", at: "2026-08-05 08:44", actor: "System", role: "Platform", action: "Application submitted", target: "BPC-APP-2026-0151", detail: "Port Harcourt Metal Recovery Ltd submitted processing application." },
  { id: "A-9840", at: "2026-07-18 13:20", actor: "M. Ibrahim", role: "Inspector", action: "Inspection completed", target: "INS-2026-0399", detail: "Routine inspection, no major findings." },
];

export type TraceRun = {
  runId: string;
  inputBatch: string;
  inputSource: string;
  inputMass: string;
  process: string;
  started: string;
  completed: string;
  outputBatch: string;
  outputMass: string;
  yield: string;
  qc: { assay: string; moisture: string; verdict: "Pass" | "Hold" | "Fail"; lab: string };
  facility: string;
};

export const TRACE_RUNS: TraceRun[] = [
  {
    runId: "RUN-2026-0884",
    inputBatch: "BLD-IN-2026-004182",
    inputSource: "Ilesa Artisanal Cooperative · Osun",
    inputMass: "24.6 t",
    process: "Acid leach → solvent extraction",
    started: "2026-08-14 06:00",
    completed: "2026-08-15 18:40",
    outputBatch: "BLD-OUT-2026-001907",
    outputMass: "8.2 t",
    yield: "33.3%",
    qc: { assay: "98.4% purity", moisture: "0.6%", verdict: "Pass", lab: "On-site XRF + third-party cross-check" },
    facility: "Ilesa Refining Plant A",
  },
  {
    runId: "RUN-2026-0879",
    inputBatch: "BLD-IN-2026-004155",
    inputSource: "Chikun Pit 3 · Kaduna",
    inputMass: "310.0 t",
    process: "Primary crush → secondary crush → screening",
    started: "2026-08-12 07:15",
    completed: "2026-08-12 19:50",
    outputBatch: "BLD-OUT-2026-001884",
    outputMass: "296.4 t",
    yield: "95.6%",
    qc: { assay: "Grade 2 aggregate", moisture: "2.1%", verdict: "Pass", lab: "On-site sieve analysis" },
    facility: "Chikun Quarry Plant",
  },
  {
    runId: "RUN-2026-0871",
    inputBatch: "BLD-IN-2026-004098",
    inputSource: "Trans-Amadi Scrap Aggregators · Rivers",
    inputMass: "51.3 t",
    process: "Sort → furnace smelt → casting",
    started: "2026-08-09 05:30",
    completed: "2026-08-10 22:10",
    outputBatch: "BLD-OUT-2026-001860",
    outputMass: "34.7 t",
    yield: "67.6%",
    qc: { assay: "Cu 96.1%", moisture: "n/a", verdict: "Hold", lab: "Third-party lab — retest requested" },
    facility: "Trans-Amadi Recovery Works",
  },
];

export const NOTIFICATIONS = [
  { id: "n1", title: "NC-2026-018 evidence submitted", body: "Port Harcourt Metal Recovery Ltd uploaded corrective-action evidence.", at: "2h ago", kind: "info" as const },
  { id: "n2", title: "Critical environmental alert", body: "PM10 exceedance at Trans-Amadi Recovery Works.", at: "1d ago", kind: "error" as const },
  { id: "n3", title: "Document expiring", body: "NESREA registration for Ilesa Refining Plant A expires in 51 days.", at: "2d ago", kind: "warn" as const },
  { id: "n4", title: "Inspection scheduled", body: "INS-2026-0431 scheduled for 27 Aug 2026.", at: "3d ago", kind: "info" as const },
];

export const EXPIRING_DOCS = [
  { doc: "NESREA Facility Registration", ref: "NESREA/FR/2025/2210", company: "Ilesa Mineral Processing Ltd", expires: "2026-10-10", days: 51 },
  { doc: "Fire Safety Certificate", ref: "FSC/2025/4410", company: "Kaduna Aggregate Crushing Co.", expires: "2026-10-01", days: 42 },
  { doc: "Pressure Vessel Integrity Test", ref: "PVI-2025-08", company: "Ilesa Mineral Processing Ltd", expires: "2026-08-13", days: -8 },
  { doc: "Slag Handler Contract", ref: "WH-CT-2025-11", company: "Port Harcourt Metal Recovery Ltd", expires: "2026-11-18", days: 90 },
];

export const REPORTS = [
  { id: "RPT-2026-Q2-NAT", title: "Q2 2026 National Processing Compliance Report", period: "Apr – Jun 2026", generated: "2026-07-12", pages: 48, scope: "All regions" },
  { id: "RPT-2026-07-ENV", title: "July 2026 Environmental Exceedance Summary", period: "Jul 2026", generated: "2026-08-03", pages: 16, scope: "Environmental" },
  { id: "RPT-2026-H1-INSP", title: "H1 2026 Inspection Programme Review", period: "Jan – Jun 2026", generated: "2026-07-05", pages: 31, scope: "Inspections" },
  { id: "RPT-2026-06-SW", title: "South West Regional Compliance Brief", period: "Jun 2026", generated: "2026-07-01", pages: 12, scope: "South West" },
];

export const KPI_TREND = [
  { month: "Mar", approvals: 12, nonconformities: 9, inspections: 14 },
  { month: "Apr", approvals: 15, nonconformities: 11, inspections: 17 },
  { month: "May", approvals: 11, nonconformities: 14, inspections: 19 },
  { month: "Jun", approvals: 18, nonconformities: 8, inspections: 22 },
  { month: "Jul", approvals: 16, nonconformities: 12, inspections: 20 },
  { month: "Aug", approvals: 9, nonconformities: 6, inspections: 13 },
];

export function processingTypeLabel(t: ProcessingType) {
  return PROCESSING_TYPES.find((p) => p.key === t)?.label ?? t;
}

export function sectionLabel(k: SectionKey) {
  return SECTIONS.find((s) => s.key === k)?.label ?? k;
}
