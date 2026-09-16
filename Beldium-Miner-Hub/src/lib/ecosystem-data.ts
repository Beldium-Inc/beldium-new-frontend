/**
 * Canonical seeded ecosystem model for the Beldium Miner Hub prototype.
 * Everything the dashboard, marketplace, logistics, warehousing, processing,
 * export and finance screens show is derived from the RFQ -> transaction ->
 * material chain defined here. Frontend-only, no backend.
 */

export const LIFECYCLE_STAGES = [
  { id: "rfq_received", label: "RFQ received", domain: "marketplace" },
  { id: "accepted", label: "Accepted", domain: "marketplace" },
  { id: "aggregation", label: "Aggregation", domain: "marketplace" },
  { id: "sample_requested", label: "Sample requested", domain: "quality" },
  { id: "sample_logistics", label: "Sample logistics assigned", domain: "logistics" },
  { id: "sample_collected", label: "Sample collected", domain: "logistics" },
  { id: "lab_received", label: "Laboratory received", domain: "quality" },
  { id: "testing", label: "Testing", domain: "quality" },
  { id: "results_published", label: "Results published", domain: "quality" },
  { id: "buyer_quality_acceptance", label: "Buyer quality acceptance", domain: "marketplace" },
  { id: "bulk_logistics", label: "Bulk logistics assigned", domain: "logistics" },
  { id: "material_picked_up", label: "Material picked up", domain: "logistics" },
  { id: "in_transit", label: "In transit", domain: "logistics" },
  { id: "warehouse_received", label: "Warehouse / processor received", domain: "warehousing" },
  { id: "processing_started", label: "Processing started", domain: "processing" },
  { id: "processing_completed", label: "Processing completed", domain: "processing" },
  { id: "output_recorded", label: "Output tonnage recorded", domain: "processing" },
  { id: "post_processing_quality", label: "Post processing quality", domain: "quality" },
  { id: "export_compliance", label: "Export compliance", domain: "export" },
  { id: "export_ready", label: "Export ready", domain: "export" },
  { id: "shipped", label: "Shipped", domain: "export" },
  { id: "buyer_destination", label: "Buyer destination", domain: "export" },
  { id: "delivered", label: "Delivered", domain: "export" },
  { id: "payment_settlement", label: "Payment / settlement", domain: "finance" },
] as const;

export type StageId = (typeof LIFECYCLE_STAGES)[number]["id"];
export type EcosystemDomain =
  | "marketplace"
  | "quality"
  | "logistics"
  | "warehousing"
  | "processing"
  | "export"
  | "finance";

export const stageIndexOf = (id: StageId) => LIFECYCLE_STAGES.findIndex((s) => s.id === id);

export type Rfq = {
  id: string;
  reference: string;
  buyer: string;
  buyerCountry: string;
  mineral: string;
  gradeSpec: string;
  quantityRequested: number;
  unit: string;
  indicativePriceUsd: number;
  incoterm: string;
  destination: string;
  receivedAt: string;
  respondBy: string;
  notes: string;
  status: "open" | "accepted" | "partially_accepted" | "declined" | "expired";
  committedQuantity: number;
  decidedAt: string | null;
};

export type MaterialBatch = {
  id: string;
  reference: string;
  siteId: string;
  mineral: string;
  tonnes: number;
  grade: number;
  stage:
    | "stockpile"
    | "allocated"
    | "in_transit"
    | "warehouse"
    | "processing"
    | "export_ready"
    | "shipped"
    | "delivered";
  location: string;
  updatedAt: string;
  transactionId: string | null;
};

export type LogisticsMove = {
  id: string;
  kind: "sample" | "bulk";
  carrier: string;
  vehicle: string;
  driver: string;
  from: string;
  to: string;
  tonnes: number;
  assignedAt: string;
  pickedUpAt: string | null;
  arrivedAt: string | null;
  status: "assigned" | "in_transit" | "delivered";
};

export type Transaction = {
  id: string;
  reference: string;
  rfqId: string;
  buyer: string;
  buyerCountry: string;
  mineral: string;
  gradeSpec: string;
  committedTonnes: number;
  aggregatedTonnes: number;
  unitPriceUsd: number;
  incoterm: string;
  destination: string;
  createdAt: string;
  stage: StageId;
  stageLog: Partial<Record<StageId, string>>;
  batchIds: string[];
  sample: {
    reference: string;
    laboratory: string;
    requestedAt: string | null;
    collectedAt: string | null;
    labReceivedAt: string | null;
    resultGrade: number | null;
    moisture: number | null;
    publishedAt: string | null;
    buyerAcceptedAt: string | null;
    status: "requested" | "in_transit" | "at_lab" | "testing" | "published" | "accepted" | "rejected";
  };
  logistics: LogisticsMove[];
  warehouse: {
    facility: string;
    lot: string;
    receivedAt: string | null;
    tonnesReceived: number | null;
  } | null;
  processing: {
    facility: string;
    method: string;
    startedAt: string | null;
    completedAt: string | null;
    inputTonnes: number;
    outputTonnes: number | null;
    recovery: number | null;
    postGrade: number | null;
  } | null;
  exportRecord: {
    permitRef: string;
    complianceStatus: "not_started" | "in_review" | "cleared" | "query";
    readyAt: string | null;
    port: string;
    vessel: string;
    shippedAt: string | null;
    eta: string | null;
    deliveredAt: string | null;
  };
  payment: {
    invoiceRef: string;
    amountUsd: number;
    advancePct: number;
    dueAt: string;
    paidAt: string | null;
    status: "not_due" | "pending" | "partial" | "paid" | "overdue";
  };
};

export type EcosystemEvent = {
  id: string;
  at: string;
  domain: EcosystemDomain;
  message: string;
  reference: string;
};

export type ActionItem = {
  id: string;
  title: string;
  detail: string;
  domain: EcosystemDomain | "compliance";
  severity: "high" | "medium" | "low";
  dueAt: string | null;
  to: string;
  transactionId?: string;
};

export type EcosystemSlice = {
  rfqs: Rfq[];
  transactions: Transaction[];
  batches: MaterialBatch[];
  ecosystemEvents: EcosystemEvent[];
};

const t = (d: string) => d;

function stageLogUpTo(stage: StageId, times: Partial<Record<StageId, string>>): Partial<Record<StageId, string>> {
  const limit = stageIndexOf(stage);
  const out: Partial<Record<StageId, string>> = {};
  LIFECYCLE_STAGES.forEach((s, i) => {
    if (i <= limit && times[s.id]) out[s.id] = times[s.id]!;
  });
  return out;
}

export function emptyEcosystem(): EcosystemSlice {
  return { rfqs: [], transactions: [], batches: [], ecosystemEvents: [] };
}

export function ecosystemSeed(): EcosystemSlice {
  const rfqs: Rfq[] = [
    {
      id: "rfq-201",
      reference: "RFQ-2026-0201",
      buyer: "Hanwa Metals Asia",
      buyerCountry: "Singapore",
      mineral: "Copper concentrate",
      gradeSpec: "≥ 24% Cu, ≤ 8% moisture",
      quantityRequested: 5000,
      unit: "t",
      indicativePriceUsd: 412,
      incoterm: "FOB Dar es Salaam",
      destination: "Singapore",
      receivedAt: t("2026-09-01 08:42"),
      respondBy: t("2026-09-08"),
      notes: "Monthly offtake, first shipment within 45 days of acceptance.",
      status: "open",
      committedQuantity: 0,
      decidedAt: null,
    },
    {
      id: "rfq-202",
      reference: "RFQ-2026-0202",
      buyer: "Aurum Refiners SA",
      buyerCountry: "South Africa",
      mineral: "Gold concentrate",
      gradeSpec: "≥ 0.85 g/t recoverable",
      quantityRequested: 1200,
      unit: "t",
      indicativePriceUsd: 1980,
      incoterm: "CIF Johannesburg",
      destination: "Johannesburg",
      receivedAt: t("2026-09-02 14:05"),
      respondBy: t("2026-09-09"),
      notes: "Requires third-party assay before dispatch.",
      status: "open",
      committedQuantity: 0,
      decidedAt: null,
    },
    {
      id: "rfq-203",
      reference: "RFQ-2026-0203",
      buyer: "Nordic Battery Materials",
      buyerCountry: "Finland",
      mineral: "Cobalt hydroxide",
      gradeSpec: "≥ 28% Co",
      quantityRequested: 800,
      unit: "t",
      indicativePriceUsd: 5400,
      incoterm: "FOB Beira",
      destination: "Kotka",
      receivedAt: t("2026-09-03 06:20"),
      respondBy: t("2026-09-12"),
      notes: "ESG documentation pack required with acceptance.",
      status: "open",
      committedQuantity: 0,
      decidedAt: null,
    },
    {
      id: "rfq-198",
      reference: "RFQ-2026-0198",
      buyer: "Tianhe Smelting Group",
      buyerCountry: "China",
      mineral: "Copper concentrate",
      gradeSpec: "≥ 22% Cu",
      quantityRequested: 8000,
      unit: "t",
      indicativePriceUsd: 398,
      incoterm: "FOB Dar es Salaam",
      destination: "Qingdao",
      receivedAt: t("2026-08-12 09:10"),
      respondBy: t("2026-08-18"),
      notes: "Accepted in part — capacity limited by plant throughput.",
      status: "partially_accepted",
      committedQuantity: 4500,
      decidedAt: t("2026-08-13 11:30"),
    },
    {
      id: "rfq-195",
      reference: "RFQ-2026-0195",
      buyer: "Kariba Metals Trading",
      buyerCountry: "Zimbabwe",
      mineral: "Gold concentrate",
      gradeSpec: "≥ 0.9 g/t",
      quantityRequested: 900,
      unit: "t",
      indicativePriceUsd: 1940,
      incoterm: "CIF Harare",
      destination: "Harare",
      receivedAt: t("2026-08-05 10:00"),
      respondBy: t("2026-08-11"),
      notes: "Fully accepted.",
      status: "accepted",
      committedQuantity: 900,
      decidedAt: t("2026-08-06 08:15"),
    },
    {
      id: "rfq-190",
      reference: "RFQ-2026-0190",
      buyer: "Atlas Alloys Turkey",
      buyerCountry: "Türkiye",
      mineral: "Cobalt hydroxide",
      gradeSpec: "≥ 30% Co",
      quantityRequested: 600,
      unit: "t",
      indicativePriceUsd: 5600,
      incoterm: "FOB Beira",
      destination: "Izmir",
      receivedAt: t("2026-07-22 07:45"),
      respondBy: t("2026-07-28"),
      notes: "Fully accepted, shipment closed and settled.",
      status: "accepted",
      committedQuantity: 500,
      decidedAt: t("2026-07-23 09:00"),
    },
    {
      id: "rfq-188",
      reference: "RFQ-2026-0188",
      buyer: "Delta Ore Brokers",
      buyerCountry: "UAE",
      mineral: "Copper concentrate",
      gradeSpec: "≥ 26% Cu",
      quantityRequested: 3000,
      unit: "t",
      indicativePriceUsd: 388,
      incoterm: "FOB Durban",
      destination: "Jebel Ali",
      receivedAt: t("2026-07-15 12:30"),
      respondBy: t("2026-07-20"),
      notes: "Declined — grade specification above current plant output.",
      status: "declined",
      committedQuantity: 0,
      decidedAt: t("2026-07-16 15:40"),
    },
  ];

  const transactions: Transaction[] = [
    {
      id: "tx-4501",
      reference: "TX-2026-4501",
      rfqId: "rfq-198",
      buyer: "Tianhe Smelting Group",
      buyerCountry: "China",
      mineral: "Copper concentrate",
      gradeSpec: "≥ 22% Cu",
      committedTonnes: 4500,
      aggregatedTonnes: 4500,
      unitPriceUsd: 398,
      incoterm: "FOB Dar es Salaam",
      destination: "Qingdao",
      createdAt: t("2026-08-13 11:30"),
      stage: "in_transit",
      stageLog: stageLogUpTo("in_transit", {
        rfq_received: "2026-08-12 09:10",
        accepted: "2026-08-13 11:30",
        aggregation: "2026-08-16 16:05",
        sample_requested: "2026-08-17 08:20",
        sample_logistics: "2026-08-17 13:40",
        sample_collected: "2026-08-18 07:55",
        lab_received: "2026-08-19 10:12",
        testing: "2026-08-19 14:00",
        results_published: "2026-08-22 09:30",
        buyer_quality_acceptance: "2026-08-23 11:05",
        bulk_logistics: "2026-08-26 08:00",
        material_picked_up: "2026-08-28 06:40",
        in_transit: "2026-08-28 09:15",
      }),
      batchIds: ["batch-cu-01", "batch-cu-02"],
      sample: {
        reference: "SMP-4501-A",
        laboratory: "Ndola Assay Laboratories",
        requestedAt: "2026-08-17 08:20",
        collectedAt: "2026-08-18 07:55",
        labReceivedAt: "2026-08-19 10:12",
        resultGrade: 23.4,
        moisture: 7.1,
        publishedAt: "2026-08-22 09:30",
        buyerAcceptedAt: "2026-08-23 11:05",
        status: "accepted",
      },
      logistics: [
        {
          id: "mv-4501-s",
          kind: "sample",
          carrier: "SwiftLab Couriers",
          vehicle: "LC-2210",
          driver: "M. Phiri",
          from: "Kabwe North Pit",
          to: "Ndola Assay Laboratories",
          tonnes: 0.05,
          assignedAt: "2026-08-17 13:40",
          pickedUpAt: "2026-08-18 07:55",
          arrivedAt: "2026-08-19 10:12",
          status: "delivered",
        },
        {
          id: "mv-4501-b",
          kind: "bulk",
          carrier: "TransZam Bulk Haulage",
          vehicle: "Fleet convoy TZ-14",
          driver: "K. Mulenga (lead)",
          from: "Kabwe North Pit",
          to: "Kapiri Consolidation Warehouse",
          tonnes: 4500,
          assignedAt: "2026-08-26 08:00",
          pickedUpAt: "2026-08-28 06:40",
          arrivedAt: null,
          status: "in_transit",
        },
      ],
      warehouse: { facility: "Kapiri Consolidation Warehouse", lot: "LOT-4501", receivedAt: null, tonnesReceived: null },
      processing: {
        facility: "Kapiri Concentrator",
        method: "Flotation",
        startedAt: null,
        completedAt: null,
        inputTonnes: 4500,
        outputTonnes: null,
        recovery: null,
        postGrade: null,
      },
      exportRecord: {
        permitRef: "EXP-2026-1181",
        complianceStatus: "not_started",
        readyAt: null,
        port: "Dar es Salaam",
        vessel: "TBC",
        shippedAt: null,
        eta: "2026-10-06",
        deliveredAt: null,
      },
      payment: {
        invoiceRef: "INV-4501",
        amountUsd: 4500 * 398,
        advancePct: 30,
        dueAt: "2026-10-20",
        paidAt: null,
        status: "pending",
      },
    },
    {
      id: "tx-4488",
      reference: "TX-2026-4488",
      rfqId: "rfq-195",
      buyer: "Kariba Metals Trading",
      buyerCountry: "Zimbabwe",
      mineral: "Gold concentrate",
      gradeSpec: "≥ 0.9 g/t",
      committedTonnes: 900,
      aggregatedTonnes: 900,
      unitPriceUsd: 1940,
      incoterm: "CIF Harare",
      destination: "Harare",
      createdAt: t("2026-08-06 08:15"),
      stage: "processing_started",
      stageLog: stageLogUpTo("processing_started", {
        rfq_received: "2026-08-05 10:00",
        accepted: "2026-08-06 08:15",
        aggregation: "2026-08-09 15:10",
        sample_requested: "2026-08-10 07:30",
        sample_logistics: "2026-08-10 12:00",
        sample_collected: "2026-08-11 06:45",
        lab_received: "2026-08-12 09:05",
        testing: "2026-08-12 13:20",
        results_published: "2026-08-15 10:40",
        buyer_quality_acceptance: "2026-08-16 08:55",
        bulk_logistics: "2026-08-18 09:00",
        material_picked_up: "2026-08-20 05:50",
        in_transit: "2026-08-20 08:30",
        warehouse_received: "2026-08-23 14:25",
        processing_started: "2026-08-26 07:10",
      }),
      batchIds: ["batch-au-01"],
      sample: {
        reference: "SMP-4488-A",
        laboratory: "Solwezi Minerals Lab",
        requestedAt: "2026-08-10 07:30",
        collectedAt: "2026-08-11 06:45",
        labReceivedAt: "2026-08-12 09:05",
        resultGrade: 0.94,
        moisture: 5.4,
        publishedAt: "2026-08-15 10:40",
        buyerAcceptedAt: "2026-08-16 08:55",
        status: "accepted",
      },
      logistics: [
        {
          id: "mv-4488-s",
          kind: "sample",
          carrier: "SwiftLab Couriers",
          vehicle: "LC-1188",
          driver: "J. Sakala",
          from: "Lunga Alluvial Block C",
          to: "Solwezi Minerals Lab",
          tonnes: 0.03,
          assignedAt: "2026-08-10 12:00",
          pickedUpAt: "2026-08-11 06:45",
          arrivedAt: "2026-08-12 09:05",
          status: "delivered",
        },
        {
          id: "mv-4488-b",
          kind: "bulk",
          carrier: "Lunga Logistics Co-op",
          vehicle: "Convoy LL-06",
          driver: "P. Chanda (lead)",
          from: "Lunga Alluvial Block C",
          to: "Solwezi Processing Hub",
          tonnes: 900,
          assignedAt: "2026-08-18 09:00",
          pickedUpAt: "2026-08-20 05:50",
          arrivedAt: "2026-08-23 14:25",
          status: "delivered",
        },
      ],
      warehouse: {
        facility: "Solwezi Processing Hub",
        lot: "LOT-4488",
        receivedAt: "2026-08-23 14:25",
        tonnesReceived: 898,
      },
      processing: {
        facility: "Solwezi Processing Hub",
        method: "Gravity + CIL",
        startedAt: "2026-08-26 07:10",
        completedAt: null,
        inputTonnes: 898,
        outputTonnes: null,
        recovery: null,
        postGrade: null,
      },
      exportRecord: {
        permitRef: "EXP-2026-1174",
        complianceStatus: "not_started",
        readyAt: null,
        port: "Chirundu (road)",
        vessel: "Road freight",
        shippedAt: null,
        eta: "2026-09-25",
        deliveredAt: null,
      },
      payment: {
        invoiceRef: "INV-4488",
        amountUsd: 900 * 1940,
        advancePct: 25,
        dueAt: "2026-10-05",
        paidAt: null,
        status: "pending",
      },
    },
    {
      id: "tx-4462",
      reference: "TX-2026-4462",
      rfqId: "rfq-190",
      buyer: "Atlas Alloys Turkey",
      buyerCountry: "Türkiye",
      mineral: "Cobalt hydroxide",
      gradeSpec: "≥ 30% Co",
      committedTonnes: 500,
      aggregatedTonnes: 500,
      unitPriceUsd: 5600,
      incoterm: "FOB Beira",
      destination: "Izmir",
      createdAt: t("2026-07-23 09:00"),
      stage: "payment_settlement",
      stageLog: stageLogUpTo("payment_settlement", {
        rfq_received: "2026-07-22 07:45",
        accepted: "2026-07-23 09:00",
        aggregation: "2026-07-25 16:30",
        sample_requested: "2026-07-26 08:00",
        sample_logistics: "2026-07-26 11:20",
        sample_collected: "2026-07-27 07:10",
        lab_received: "2026-07-28 09:40",
        testing: "2026-07-28 13:15",
        results_published: "2026-07-31 10:05",
        buyer_quality_acceptance: "2026-08-01 09:20",
        bulk_logistics: "2026-08-02 08:10",
        material_picked_up: "2026-08-04 06:00",
        in_transit: "2026-08-04 08:45",
        warehouse_received: "2026-08-07 15:30",
        processing_started: "2026-08-08 07:00",
        processing_completed: "2026-08-14 18:20",
        output_recorded: "2026-08-15 09:10",
        post_processing_quality: "2026-08-17 11:00",
        export_compliance: "2026-08-19 10:30",
        export_ready: "2026-08-20 12:00",
        shipped: "2026-08-22 17:45",
        buyer_destination: "2026-08-30 06:30",
        delivered: "2026-08-31 09:15",
        payment_settlement: "2026-09-02 10:40",
      }),
      batchIds: ["batch-co-01"],
      sample: {
        reference: "SMP-4462-A",
        laboratory: "Kitwe Metallurgical Institute",
        requestedAt: "2026-07-26 08:00",
        collectedAt: "2026-07-27 07:10",
        labReceivedAt: "2026-07-28 09:40",
        resultGrade: 31.2,
        moisture: 3.8,
        publishedAt: "2026-07-31 10:05",
        buyerAcceptedAt: "2026-08-01 09:20",
        status: "accepted",
      },
      logistics: [
        {
          id: "mv-4462-s",
          kind: "sample",
          carrier: "SwiftLab Couriers",
          vehicle: "LC-3301",
          driver: "R. Zulu",
          from: "Mopani Shaft 4",
          to: "Kitwe Metallurgical Institute",
          tonnes: 0.02,
          assignedAt: "2026-07-26 11:20",
          pickedUpAt: "2026-07-27 07:10",
          arrivedAt: "2026-07-28 09:40",
          status: "delivered",
        },
        {
          id: "mv-4462-b",
          kind: "bulk",
          carrier: "Beira Corridor Freight",
          vehicle: "Convoy BC-22",
          driver: "S. Nyoni (lead)",
          from: "Mopani Shaft 4",
          to: "Kitwe Hydromet Plant",
          tonnes: 500,
          assignedAt: "2026-08-02 08:10",
          pickedUpAt: "2026-08-04 06:00",
          arrivedAt: "2026-08-07 15:30",
          status: "delivered",
        },
      ],
      warehouse: {
        facility: "Kitwe Bonded Warehouse",
        lot: "LOT-4462",
        receivedAt: "2026-08-07 15:30",
        tonnesReceived: 499,
      },
      processing: {
        facility: "Kitwe Hydromet Plant",
        method: "Leach + precipitation",
        startedAt: "2026-08-08 07:00",
        completedAt: "2026-08-14 18:20",
        inputTonnes: 499,
        outputTonnes: 486,
        recovery: 92.6,
        postGrade: 30.8,
      },
      exportRecord: {
        permitRef: "EXP-2026-1152",
        complianceStatus: "cleared",
        readyAt: "2026-08-20 12:00",
        port: "Beira",
        vessel: "MV Anatolia Star",
        shippedAt: "2026-08-22 17:45",
        eta: "2026-08-30",
        deliveredAt: "2026-08-31 09:15",
      },
      payment: {
        invoiceRef: "INV-4462",
        amountUsd: 500 * 5600,
        advancePct: 30,
        dueAt: "2026-09-05",
        paidAt: "2026-09-02 10:40",
        status: "paid",
      },
    },
    {
      id: "tx-4510",
      reference: "TX-2026-4510",
      rfqId: "rfq-198",
      buyer: "Tianhe Smelting Group",
      buyerCountry: "China",
      mineral: "Copper concentrate",
      gradeSpec: "≥ 22% Cu",
      committedTonnes: 2000,
      aggregatedTonnes: 1250,
      unitPriceUsd: 398,
      incoterm: "FOB Dar es Salaam",
      destination: "Qingdao",
      createdAt: t("2026-08-30 09:00"),
      stage: "sample_collected",
      stageLog: stageLogUpTo("sample_collected", {
        rfq_received: "2026-08-12 09:10",
        accepted: "2026-08-30 09:00",
        aggregation: "2026-09-01 10:15",
        sample_requested: "2026-09-02 08:05",
        sample_logistics: "2026-09-02 12:35",
        sample_collected: "2026-09-03 07:20",
      }),
      batchIds: ["batch-cu-03"],
      sample: {
        reference: "SMP-4510-A",
        laboratory: "Ndola Assay Laboratories",
        requestedAt: "2026-09-02 08:05",
        collectedAt: "2026-09-03 07:20",
        labReceivedAt: null,
        resultGrade: null,
        moisture: null,
        publishedAt: null,
        buyerAcceptedAt: null,
        status: "in_transit",
      },
      logistics: [
        {
          id: "mv-4510-s",
          kind: "sample",
          carrier: "SwiftLab Couriers",
          vehicle: "LC-2244",
          driver: "M. Phiri",
          from: "Kabwe North Pit",
          to: "Ndola Assay Laboratories",
          tonnes: 0.05,
          assignedAt: "2026-09-02 12:35",
          pickedUpAt: "2026-09-03 07:20",
          arrivedAt: null,
          status: "in_transit",
        },
      ],
      warehouse: null,
      processing: null,
      exportRecord: {
        permitRef: "EXP-2026-1190",
        complianceStatus: "not_started",
        readyAt: null,
        port: "Dar es Salaam",
        vessel: "TBC",
        shippedAt: null,
        eta: "2026-10-28",
        deliveredAt: null,
      },
      payment: {
        invoiceRef: "INV-4510",
        amountUsd: 2000 * 398,
        advancePct: 30,
        dueAt: "2026-11-10",
        paidAt: null,
        status: "not_due",
      },
    },
  ];

  const batches: MaterialBatch[] = [
    {
      id: "batch-cu-01",
      reference: "BATCH-CU-2608",
      siteId: "site-kabwe",
      mineral: "Copper concentrate",
      tonnes: 2600,
      grade: 23.4,
      stage: "in_transit",
      location: "En route to Kapiri Consolidation Warehouse",
      updatedAt: "2026-08-28 06:40",
      transactionId: "tx-4501",
    },
    {
      id: "batch-cu-02",
      reference: "BATCH-CU-2609",
      siteId: "site-kabwe",
      mineral: "Copper concentrate",
      tonnes: 1900,
      grade: 23.1,
      stage: "in_transit",
      location: "En route to Kapiri Consolidation Warehouse",
      updatedAt: "2026-08-28 06:40",
      transactionId: "tx-4501",
    },
    {
      id: "batch-cu-03",
      reference: "BATCH-CU-2701",
      siteId: "site-kabwe",
      mineral: "Copper concentrate",
      tonnes: 1250,
      grade: 22.8,
      stage: "allocated",
      location: "Kabwe North Pit — pad 3",
      updatedAt: "2026-09-01 10:15",
      transactionId: "tx-4510",
    },
    {
      id: "batch-au-01",
      reference: "BATCH-AU-1142",
      siteId: "site-lunga",
      mineral: "Gold concentrate",
      tonnes: 900,
      grade: 0.94,
      stage: "processing",
      location: "Solwezi Processing Hub",
      updatedAt: "2026-08-26 07:10",
      transactionId: "tx-4488",
    },
    {
      id: "batch-co-01",
      reference: "BATCH-CO-0904",
      siteId: "site-mopani",
      mineral: "Cobalt hydroxide",
      tonnes: 500,
      grade: 31.2,
      stage: "delivered",
      location: "Izmir, delivered to buyer",
      updatedAt: "2026-08-31 09:15",
      transactionId: "tx-4462",
    },
    {
      id: "batch-cu-04",
      reference: "BATCH-CU-2702",
      siteId: "site-kabwe",
      mineral: "Copper concentrate",
      tonnes: 3400,
      grade: 22.4,
      stage: "stockpile",
      location: "Kabwe North Pit — pad 1",
      updatedAt: "2026-09-02 17:00",
      transactionId: null,
    },
    {
      id: "batch-au-02",
      reference: "BATCH-AU-1150",
      siteId: "site-lunga",
      mineral: "Gold concentrate",
      tonnes: 640,
      grade: 0.89,
      stage: "stockpile",
      location: "Lunga Block C — sheds",
      updatedAt: "2026-09-02 12:10",
      transactionId: null,
    },
    {
      id: "batch-co-02",
      reference: "BATCH-CO-0911",
      siteId: "site-mopani",
      mineral: "Cobalt hydroxide",
      tonnes: 260,
      grade: 29.6,
      stage: "export_ready",
      location: "Kitwe Bonded Warehouse — bay 2",
      updatedAt: "2026-09-01 08:00",
      transactionId: null,
    },
  ];

  const ecosystemEvents: EcosystemEvent[] = [
    { id: "ev-1", at: "2026-09-03 07:20", domain: "logistics", message: "Sample SMP-4510-A collected from Kabwe North Pit by SwiftLab Couriers.", reference: "TX-2026-4510" },
    { id: "ev-2", at: "2026-09-03 06:20", domain: "marketplace", message: "New RFQ received from Nordic Battery Materials for 800 t cobalt hydroxide.", reference: "RFQ-2026-0203" },
    { id: "ev-3", at: "2026-09-02 14:05", domain: "marketplace", message: "New RFQ received from Aurum Refiners SA for 1,200 t gold concentrate.", reference: "RFQ-2026-0202" },
    { id: "ev-4", at: "2026-09-02 10:40", domain: "finance", message: "Settlement of USD 2,800,000 received for Atlas Alloys shipment.", reference: "TX-2026-4462" },
    { id: "ev-5", at: "2026-09-02 08:05", domain: "quality", message: "Sample requested for aggregation lot LOT-4510.", reference: "TX-2026-4510" },
    { id: "ev-6", at: "2026-09-01 10:15", domain: "marketplace", message: "1,250 t aggregated against Tianhe partial commitment.", reference: "TX-2026-4510" },
    { id: "ev-7", at: "2026-08-31 09:15", domain: "export", message: "Cargo delivered to buyer destination Izmir.", reference: "TX-2026-4462" },
    { id: "ev-8", at: "2026-08-28 06:40", domain: "logistics", message: "4,500 t picked up by TransZam Bulk Haulage convoy TZ-14.", reference: "TX-2026-4501" },
    { id: "ev-9", at: "2026-08-26 07:10", domain: "processing", message: "Processing started at Solwezi Processing Hub (898 t input).", reference: "TX-2026-4488" },
    { id: "ev-10", at: "2026-08-23 14:25", domain: "warehousing", message: "898 t received at Solwezi Processing Hub, lot LOT-4488.", reference: "TX-2026-4488" },
    { id: "ev-11", at: "2026-08-22 09:30", domain: "quality", message: "Assay results published: 23.4% Cu, 7.1% moisture.", reference: "TX-2026-4501" },
    { id: "ev-12", at: "2026-08-20 12:00", domain: "export", message: "Export ready — permit EXP-2026-1152 cleared.", reference: "TX-2026-4462" },
  ];

  return { rfqs, transactions, batches, ecosystemEvents };
}

/* ------------------------------ derivations ------------------------------ */

export const stageLabel = (id: StageId) => LIFECYCLE_STAGES.find((s) => s.id === id)?.label ?? id;

export const isClosed = (tx: Transaction) => tx.stage === "payment_settlement" && tx.payment.status === "paid";

export function stageProgress(tx: Transaction) {
  return Math.round(((stageIndexOf(tx.stage) + 1) / LIFECYCLE_STAGES.length) * 100);
}

export function transactionValue(tx: Transaction) {
  return tx.committedTonnes * tx.unitPriceUsd;
}

export function usd(value: number) {
  return `USD ${Math.round(value).toLocaleString("en-US")}`;
}

export function tonnes(value: number) {
  return `${value.toLocaleString("en-US")} t`;
}

export type Commitment = {
  transaction: Transaction;
  rfq: Rfq | undefined;
  requested: number;
  committed: number;
  aggregated: number;
  remaining: number;
  fulfilment: number;
};

export function commitmentsFrom(rfqs: Rfq[], transactions: Transaction[]): Commitment[] {
  return transactions.map((tx) => {
    const rfq = rfqs.find((r) => r.id === tx.rfqId);
    const remaining = Math.max(tx.committedTonnes - tx.aggregatedTonnes, 0);
    return {
      transaction: tx,
      rfq,
      requested: rfq?.quantityRequested ?? tx.committedTonnes,
      committed: tx.committedTonnes,
      aggregated: tx.aggregatedTonnes,
      remaining,
      fulfilment: tx.committedTonnes ? Math.round((tx.aggregatedTonnes / tx.committedTonnes) * 100) : 0,
    };
  });
}

export function sampleRows(transactions: Transaction[]) {
  return transactions
    .filter((tx) => tx.sample.requestedAt)
    .map((tx) => ({ tx, sample: tx.sample }));
}

export function logisticsRows(transactions: Transaction[]) {
  return transactions.flatMap((tx) => tx.logistics.map((move) => ({ tx, move })));
}

export function warehouseRows(transactions: Transaction[]) {
  return transactions.filter((tx) => tx.warehouse).map((tx) => ({ tx, wh: tx.warehouse! }));
}

export function processingRows(transactions: Transaction[]) {
  return transactions.filter((tx) => tx.processing).map((tx) => ({ tx, pr: tx.processing! }));
}

export function exportRows(transactions: Transaction[]) {
  return transactions
    .filter((tx) => stageIndexOf(tx.stage) >= stageIndexOf("post_processing_quality"))
    .map((tx) => ({ tx, ex: tx.exportRecord }));
}

export function financeRows(transactions: Transaction[]) {
  return transactions.map((tx) => ({ tx, pay: tx.payment }));
}

export function ecosystemMetrics(slice: EcosystemSlice) {
  const { rfqs, transactions, batches } = slice;
  const active = transactions.filter((tx) => !isClosed(tx));
  const idx = (tx: Transaction) => stageIndexOf(tx.stage);
  return {
    activeRfqs: rfqs.filter((r) => r.status === "open").length,
    activeCommitments: active.length,
    committedTonnes: active.reduce((s, tx) => s + tx.committedTonnes, 0),
    aggregatedTonnes: active.reduce((s, tx) => s + tx.aggregatedTonnes, 0),
    availableInventory: batches.filter((b) => b.stage === "stockpile").reduce((s, b) => s + b.tonnes, 0),
    inTransit: batches.filter((b) => b.stage === "in_transit").reduce((s, b) => s + b.tonnes, 0),
    inProcessing: batches.filter((b) => b.stage === "processing").reduce((s, b) => s + b.tonnes, 0),
    exportReady: batches.filter((b) => b.stage === "export_ready").reduce((s, b) => s + b.tonnes, 0),
    activeTransactions: active.length,
    outstandingPayments: transactions
      .filter((tx) => tx.payment.status !== "paid")
      .reduce((s, tx) => s + tx.payment.amountUsd, 0),
    awaitingQuality: active.filter((tx) => idx(tx) >= stageIndexOf("sample_requested") && idx(tx) < stageIndexOf("buyer_quality_acceptance")).length,
    awaitingBuyer: active.filter((tx) => tx.stage === "results_published").length,
    demandReceivedTonnes: rfqs.filter((r) => r.status === "open").reduce((s, r) => s + r.quantityRequested, 0),
  };
}

export function actionItems(slice: EcosystemSlice): ActionItem[] {
  const items: ActionItem[] = [];
  slice.rfqs
    .filter((r) => r.status === "open")
    .forEach((r) =>
      items.push({
        id: `act-rfq-${r.id}`,
        title: `Respond to ${r.reference}`,
        detail: `${r.buyer} requests ${tonnes(r.quantityRequested)} of ${r.mineral}. Respond by ${r.respondBy}.`,
        domain: "marketplace",
        severity: "high",
        dueAt: r.respondBy,
        to: "/portal/rfqs",
      }),
    );
  slice.transactions.forEach((tx) => {
    const i = stageIndexOf(tx.stage);
    if (tx.aggregatedTonnes < tx.committedTonnes) {
      items.push({
        id: `act-agg-${tx.id}`,
        title: `Aggregate ${tonnes(tx.committedTonnes - tx.aggregatedTonnes)} for ${tx.reference}`,
        detail: `${tx.buyer} commitment is ${Math.round((tx.aggregatedTonnes / tx.committedTonnes) * 100)}% aggregated.`,
        domain: "marketplace",
        severity: "medium",
        dueAt: null,
        to: "/portal/commitments",
        transactionId: tx.id,
      });
    }
    if (tx.sample.status === "in_transit" || tx.sample.status === "at_lab" || tx.sample.status === "testing") {
      items.push({
        id: `act-lab-${tx.id}`,
        title: `Awaiting laboratory result for ${tx.sample.reference}`,
        detail: `${tx.sample.laboratory} — dependency blocking buyer quality acceptance on ${tx.reference}.`,
        domain: "quality",
        severity: "medium",
        dueAt: null,
        to: "/portal/quality",
        transactionId: tx.id,
      });
    }
    if (i === stageIndexOf("in_transit")) {
      items.push({
        id: `act-tr-${tx.id}`,
        title: `Confirm warehouse receipt for ${tx.reference}`,
        detail: `Bulk convoy en route to ${tx.warehouse?.facility ?? "destination"}.`,
        domain: "logistics",
        severity: "medium",
        dueAt: null,
        to: "/portal/logistics",
        transactionId: tx.id,
      });
    }
    if (tx.payment.status === "overdue") {
      items.push({
        id: `act-pay-${tx.id}`,
        title: `Chase settlement for ${tx.payment.invoiceRef}`,
        detail: `${usd(tx.payment.amountUsd)} overdue since ${tx.payment.dueAt}.`,
        domain: "finance",
        severity: "high",
        dueAt: tx.payment.dueAt,
        to: "/portal/finance",
        transactionId: tx.id,
      });
    }
  });
  return items;
}

export const domainLabel: Record<EcosystemDomain, string> = {
  marketplace: "Marketplace",
  quality: "Quality",
  logistics: "Logistics",
  warehousing: "Warehousing",
  processing: "Processing",
  export: "Export",
  finance: "Finance",
};
