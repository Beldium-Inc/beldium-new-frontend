/**
 * Beldium Logistics demo state, the single shared record chain used by every
 * logistics screen: RFQ → Transaction → Mine → Batch → Sample/Quality →
 * Transport Request → Movement → Destination → Invoice. Persisted to localStorage.
 */
import { useSyncExternalStore } from "react";

/* ---------------------------------------------------------------- types */

export type SiteKind = "Mine" | "Laboratory" | "Warehouse" | "Processor" | "Port";
export type Site = { id: string; name: string; kind: SiteKind; state: string; x: number; y: number; gps: string; ownerId?: string | undefined };
export type Party = { id: string; name: string; kind: "Miner" | "Buyer" | "Logistics" | "Exporter"; state: string };

export type TxnStage =
  | "RFQ Accepted"
  | "Aggregation Complete"
  | "Sampling"
  | "Quality Testing"
  | "Result Published"
  | "Buyer Accepted"
  | "Bulk Movement"
  | "At Warehouse"
  | "At Processor"
  | "Processing Complete"
  | "Export Movement"
  | "At Port"
  | "Logistics Completed";

export type ChainEvent = { at: string; sector: string; event: string; ref?: string | undefined };

export type RFQ = { id: string; buyerId: string; mineral: string; quantity: number; grade: string; createdAt: string; status: string };
export type Transaction = {
  id: string;
  rfqId: string;
  buyerId: string;
  minerId: string;
  mineId: string;
  batchId: string;
  commitmentId: string;
  mineral: string;
  quantity: number;
  unitPrice: number;
  destinationId: string; // warehouse or processor
  portId: string;
  stage: TxnStage;
  qualityRequired: boolean;
  quality: string; // Not sampled | Sample requested | Sample collected | At laboratory | Result published | Buyer accepted
  qualityResult?: string | undefined;
  timeline: ChainEvent[];
};

export type MovementKind = "Sample" | "Bulk";
export type RequestStatus = "New" | "Awaiting Decision" | "Accepted" | "Scheduled" | "Active" | "Completed" | "Declined";
export type TransportRequest = {
  id: string;
  txnId: string;
  kind: MovementKind;
  movementType: string;
  source: string;
  requestedBy: string;
  originId: string;
  destinationId: string;
  quantity: number;
  unit: string;
  pickupBy: string;
  deliverBy: string;
  handling: string;
  paymentTerms: string;
  status: "New" | "Awaiting Decision" | "Accepted" | "Declined";
  declineReason?: string | undefined;
  movementId?: string | undefined;
  createdAt: string;
};

export type TimelineEvent = { at: string; event: string; actor: string; location?: string | undefined; gps?: string | undefined; quantity?: string | undefined; evidence?: string | undefined; source: string };

export type Movement = {
  id: string;
  requestId: string;
  txnId: string;
  kind: MovementKind;
  movementType: string;
  originId: string;
  destinationId: string;
  quantity: number;
  unit: string;
  stage: string;
  vehicleId?: string | undefined;
  driverId?: string | undefined;
  pickupAt?: string | undefined;
  deliverBy: string;
  progress: number;
  delayed: boolean;
  deviated: boolean;
  stopped: boolean;
  exception: boolean;
  etaMin?: number | undefined;
  loaded?: number | undefined;
  received?: number | undefined;
  sampleId?: string | undefined;
  custodyId?: string | undefined;
  podId?: string | undefined;
  createdAt: string;
  completedAt?: string | undefined;
  rate: number; // NGN per unit
  timeline: TimelineEvent[];
};

export type Compliance = "Cleared" | "Restricted" | "Hold";
export type Vehicle = {
  id: string;
  registration: string;
  type: "Tipper" | "Flatbed" | "Container Truck" | "Sample Van";
  make: string;
  capacity: number;
  year: number;
  tracker: string;
  maintenance: boolean;
  compliance: Compliance;
  reason?: string | undefined;
  movementId?: string | undefined;
  lastService: string;
  nextService: string;
  maintenanceLog: { at: string; note: string }[];
};
export type Driver = {
  id: string;
  name: string;
  phone: string;
  licence: string;
  licenceClass: string;
  licenceExpiry: string;
  training: string[];
  onDuty: boolean;
  compliance: Compliance;
  reason?: string | undefined;
  movementId?: string | undefined;
  safetyScore: number;
};

export type DocStatus = "Verified" | "Under Review" | "Rejected" | "Action Required";
export type RelatedKind = "Organisation" | "Vehicle" | "Driver" | "Movement";
export type Doc = {
  id: string;
  name: string;
  type: string;
  relatedKind: RelatedKind;
  relatedId: string;
  number: string;
  authority: string;
  issueDate: string;
  expiryDate?: string | undefined;
  verification: DocStatus;
  uploadedAt: string;
};

export type Severity = "Low" | "Medium" | "High" | "Critical";
export type Incident = {
  id: string;
  movementId: string;
  type: string;
  severity: Severity;
  description: string;
  location: string;
  material: string;
  quantityAffected: string;
  evidence: string;
  immediateAction: string;
  status: "Open" | "Resolved";
  reportedAt: string;
  resolvedAt?: string | undefined;
  resolution?: string | undefined;
};

export type InvoiceStatus = "Not Invoiced" | "Invoice Generated" | "Submitted" | "Pending" | "Partially Paid" | "Paid";
export type Invoice = { id: string; movementId: string; txnId: string; amount: number; paid: number; status: InvoiceStatus; updatedAt: string };

export type NonConformity = { id: string; area: string; relatedKind: RelatedKind; relatedId: string; detail: string; action?: string | undefined; status: "Open" | "Corrective Action Submitted" | "Closed"; raisedAt: string };

export type Target =
  | { kind: "movement"; id: string }
  | { kind: "request"; id: string }
  | { kind: "vehicle"; id: string }
  | { kind: "driver"; id: string }
  | { kind: "transaction"; id: string }
  | { kind: "queue"; path: QueuePath; tab?: string | undefined };
export type QueuePath =
  | "/portal/transport-requests"
  | "/portal/active-movements"
  | "/portal/sample-logistics"
  | "/portal/bulk-logistics"
  | "/portal/fleet"
  | "/portal/drivers"
  | "/portal/documents"
  | "/portal/incidents"
  | "/portal/deliveries"
  | "/portal/payments"
  | "/portal/compliance"
  | "/portal/notifications";

export type Notification = { id: string; at: string; category: string; title: string; body: string; target: Target; read: boolean };
export type Activity = { id: string; at: string; text: string; sector: string; target: Target };

export type OpsState = {
  version: number;
  seq: number;
  parties: Party[];
  sites: Site[];
  rfqs: RFQ[];
  transactions: Transaction[];
  requests: TransportRequest[];
  movements: Movement[];
  vehicles: Vehicle[];
  drivers: Driver[];
  documents: Doc[];
  incidents: Incident[];
  invoices: Invoice[];
  nonConformities: NonConformity[];
  notifications: Notification[];
  activity: Activity[];
  prefs: Record<string, boolean>;
};

/* ---------------------------------------------------------------- constants */

export const BULK_FLOW = ["Awaiting Assignment", "Scheduled", "Driver En Route", "At Origin", "Loading", "Loaded", "In Transit", "At Destination", "Unloading", "Delivered", "Completed"];
export const SAMPLE_FLOW = ["Awaiting Assignment", "Scheduled", "Driver En Route", "At Origin", "Collected", "In Transit", "At Destination", "Delivered", "Completed"];
export const incidentTypes = [
  "Vehicle Breakdown",
  "Road Accident",
  "Route Deviation",
  "Delay",
  "Cargo Loss",
  "Cargo Damage",
  "Theft / Security",
  "Quantity Variance",
  "Seal Tampering",
  "Checkpoint Hold",
  "Driver Health",
  "Weather / Road Closure",
  "Other",
];
export const severities: Severity[] = ["Low", "Medium", "High", "Critical"];
export const invoiceStatuses: InvoiceStatus[] = ["Not Invoiced", "Invoice Generated", "Submitted", "Pending", "Partially Paid", "Paid"];

/* ---------------------------------------------------------------- time helpers */

const MIN = 60_000;
const DAY = 24 * 60 * MIN;
const iso = (offsetMin = 0) => new Date(Date.now() + offsetMin * MIN).toISOString();
const dateOnly = (offsetDays: number) => new Date(Date.now() + offsetDays * DAY).toISOString().slice(0, 10);
export const nowIso = () => new Date().toISOString();

export function fmt(at?: string) {
  if (!at) return "-";
  const d = new Date(at);
  return d.toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}
export function fmtTime(at: string) {
  return new Date(at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}
export function fmtDate(d?: string) {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}
export const naira = (n: number) => `₦${Math.round(n).toLocaleString("en-NG")}`;

export function docState(d: Doc): string {
  if (d.expiryDate) {
    const days = (new Date(d.expiryDate).getTime() - Date.now()) / DAY;
    if (days < 0) return "Expired";
    if (days <= 30 && d.verification === "Verified") return "Expiring";
  }
  return d.verification;
}

/* ---------------------------------------------------------------- seed */

function seed(): OpsState {
  const parties: Party[] = [
    { id: "MIN-101", name: "Plateau Tin Cooperative", kind: "Miner", state: "Plateau" },
    { id: "MIN-102", name: "Wamba Lithium Miners Ltd", kind: "Miner", state: "Nasarawa" },
    { id: "MIN-103", name: "Kafanchan Columbite Ventures", kind: "Miner", state: "Kaduna" },
    { id: "MIN-104", name: "Niger Artisanal Gold Association", kind: "Miner", state: "Niger" },
    { id: "BUY-201", name: "Afrimet Resources UK", kind: "Buyer", state: "London" },
    { id: "BUY-202", name: "Guangzhou New Energy Materials", kind: "Buyer", state: "Guangzhou" },
    { id: "BUY-203", name: "Lagos Metals Trading Ltd", kind: "Buyer", state: "Lagos" },
    { id: "LOG-00412", name: "Trans Sahel Haulage Ltd", kind: "Logistics", state: "Kaduna" },
    { id: "EXP-301", name: "Beldium Export Services", kind: "Exporter", state: "Lagos" },
  ];
  const sites: Site[] = [
    { id: "MINE-JOS-01", name: "Bisichi Tin Field, Jos South", kind: "Mine", state: "Plateau", x: 60, y: 44, gps: "9.7981, 8.8592", ownerId: "MIN-101" },
    { id: "MINE-NAS-02", name: "Wamba Lithium Pegmatite", kind: "Mine", state: "Nasarawa", x: 63, y: 52, gps: "8.9412, 8.6013", ownerId: "MIN-102" },
    { id: "MINE-KAD-03", name: "Kafanchan Columbite Site", kind: "Mine", state: "Kaduna", x: 54, y: 41, gps: "9.5833, 8.2921", ownerId: "MIN-103" },
    { id: "MINE-NIG-04", name: "Minna Gold Lease 17", kind: "Mine", state: "Niger", x: 35, y: 40, gps: "9.6139, 6.5569", ownerId: "MIN-104" },
    { id: "LAB-KAD", name: "Kaduna Minerals Laboratory", kind: "Laboratory", state: "Kaduna", x: 46, y: 31, gps: "10.5105, 7.4165" },
    { id: "LAB-ABJ", name: "NGSA Abuja Assay Laboratory", kind: "Laboratory", state: "FCT", x: 44, y: 50, gps: "9.0765, 7.3986" },
    { id: "WH-JOS", name: "Beldium Jos Bonded Warehouse", kind: "Warehouse", state: "Plateau", x: 58, y: 40, gps: "9.8965, 8.8583" },
    { id: "WH-KAN", name: "Kano Dry Port Warehouse", kind: "Warehouse", state: "Kano", x: 48, y: 17, gps: "12.0022, 8.5920" },
    { id: "PRC-KAD", name: "Kaduna Tin Smelting & Processing", kind: "Processor", state: "Kaduna", x: 47, y: 34, gps: "10.4806, 7.4219" },
    { id: "PRC-ABJ", name: "Abuja Lithium Concentrator", kind: "Processor", state: "FCT", x: 41, y: 53, gps: "8.9480, 7.2840" },
    { id: "PORT-APP", name: "Apapa Port, Lagos", kind: "Port", state: "Lagos", x: 12, y: 82, gps: "6.4474, 3.3603" },
    { id: "PORT-ONN", name: "Onne Port, Rivers", kind: "Port", state: "Rivers", x: 55, y: 90, gps: "4.7238, 7.1518" },
  ];

  const rfqs: RFQ[] = [
    { id: "RFQ-1188", buyerId: "BUY-202", mineral: "Lithium (spodumene)", quantity: 60, grade: "Li2O ≥ 5.5%", createdAt: iso(-9 * 1440), status: "Accepted" },
    { id: "RFQ-1172", buyerId: "BUY-201", mineral: "Tin (cassiterite)", quantity: 40, grade: "Sn ≥ 65%", createdAt: iso(-20 * 1440), status: "Accepted" },
    { id: "RFQ-1180", buyerId: "BUY-203", mineral: "Columbite", quantity: 25, grade: "Nb2O5 ≥ 30%", createdAt: iso(-14 * 1440), status: "Accepted" },
    { id: "RFQ-1165", buyerId: "BUY-201", mineral: "Tin (cassiterite)", quantity: 30, grade: "Sn ≥ 65%", createdAt: iso(-35 * 1440), status: "Accepted" },
    { id: "RFQ-1184", buyerId: "BUY-203", mineral: "Gold dore", quantity: 0.05, grade: "Au ≥ 85%", createdAt: iso(-6 * 1440), status: "Accepted" },
    { id: "RFQ-1176", buyerId: "BUY-202", mineral: "Lithium (lepidolite)", quantity: 35, grade: "Li2O ≥ 3%", createdAt: iso(-16 * 1440), status: "Accepted" },
    { id: "RFQ-1182", buyerId: "BUY-201", mineral: "Tin (cassiterite)", quantity: 20, grade: "Sn ≥ 65%", createdAt: iso(-10 * 1440), status: "Accepted" },
    { id: "RFQ-1178", buyerId: "BUY-203", mineral: "Columbite", quantity: 18, grade: "Nb2O5 ≥ 30%", createdAt: iso(-15 * 1440), status: "Accepted" },
  ];

  const tl = (offset: number, sector: string, event: string, ref?: string): ChainEvent => ({ at: iso(offset), sector, event, ref });

  const transactions: Transaction[] = [
    {
      id: "TXN-2041", rfqId: "RFQ-1188", buyerId: "BUY-202", minerId: "MIN-102", mineId: "MINE-NAS-02", batchId: "BATCH-LI-0417", commitmentId: "SC-7741",
      mineral: "Lithium (spodumene)", quantity: 60, unitPrice: 1_150_000, destinationId: "PRC-ABJ", portId: "PORT-ONN", stage: "Sampling", qualityRequired: true, quality: "Sample requested",
      timeline: [
        tl(-9 * 1440, "Marketplace", "RFQ RFQ-1188 published by Guangzhou New Energy Materials"),
        tl(-8 * 1440, "Mining", "Wamba Lithium Miners Ltd accepted RFQ: supply commitment SC-7741"),
        tl(-2 * 1440, "Mining", "Aggregation completed: BATCH-LI-0417, 60 t"),
        tl(-40, "Quality", "Sample pickup requested for BATCH-LI-0417", "TR-3101"),
      ],
    },
    {
      id: "TXN-2036", rfqId: "RFQ-1172", buyerId: "BUY-201", minerId: "MIN-101", mineId: "MINE-JOS-01", batchId: "BATCH-SN-0392", commitmentId: "SC-7702",
      mineral: "Tin (cassiterite)", quantity: 40, unitPrice: 14_800_000, destinationId: "PRC-KAD", portId: "PORT-APP", stage: "Bulk Movement", qualityRequired: true, quality: "Buyer accepted", qualityResult: "Sn 68.2%",
      timeline: [tl(-20 * 1440, "Marketplace", "RFQ RFQ-1172 published"), tl(-12 * 1440, "Quality", "Result published: Sn 68.2%"), tl(-11 * 1440, "Marketplace", "Buyer accepted quality result"), tl(-300, "Logistics", "Bulk movement MOV-5012 dispatched", "MOV-5012")],
    },
    {
      id: "TXN-2038", rfqId: "RFQ-1180", buyerId: "BUY-203", minerId: "MIN-103", mineId: "MINE-KAD-03", batchId: "BATCH-CB-0401", commitmentId: "SC-7719",
      mineral: "Columbite", quantity: 25, unitPrice: 9_200_000, destinationId: "WH-JOS", portId: "PORT-APP", stage: "Bulk Movement", qualityRequired: true, quality: "Buyer accepted", qualityResult: "Nb2O5 31.4%",
      timeline: [tl(-14 * 1440, "Marketplace", "RFQ RFQ-1180 published"), tl(-6 * 1440, "Marketplace", "Buyer accepted quality result"), tl(-50, "Logistics", "Loading started at Kafanchan Columbite Site", "MOV-5014")],
    },
    {
      id: "TXN-2029", rfqId: "RFQ-1165", buyerId: "BUY-201", minerId: "MIN-101", mineId: "MINE-JOS-01", batchId: "BATCH-SN-0355", commitmentId: "SC-7650",
      mineral: "Tin (cassiterite)", quantity: 30, unitPrice: 14_500_000, destinationId: "PRC-KAD", portId: "PORT-APP", stage: "At Processor", qualityRequired: true, quality: "Buyer accepted", qualityResult: "Sn 66.9%",
      timeline: [tl(-35 * 1440, "Marketplace", "RFQ RFQ-1165 published"), tl(-5 * 1440, "Processing", "Kaduna Tin Smelting confirmed receipt of 29.8 t", "MOV-5003")],
    },
    {
      id: "TXN-2040", rfqId: "RFQ-1184", buyerId: "BUY-203", minerId: "MIN-104", mineId: "MINE-NIG-04", batchId: "BATCH-AU-0409", commitmentId: "SC-7733",
      mineral: "Gold dore", quantity: 0.05, unitPrice: 0, destinationId: "WH-KAN", portId: "PORT-APP", stage: "Sampling", qualityRequired: true, quality: "Sample collected",
      timeline: [tl(-6 * 1440, "Marketplace", "RFQ RFQ-1184 published"), tl(-90, "Logistics", "Sample SAM-281 collected at Minna Gold Lease 17", "MOV-5015")],
    },
    {
      id: "TXN-2039", rfqId: "RFQ-1176", buyerId: "BUY-202", minerId: "MIN-102", mineId: "MINE-NAS-02", batchId: "BATCH-LI-0398", commitmentId: "SC-7725",
      mineral: "Lithium (lepidolite)", quantity: 35, unitPrice: 780_000, destinationId: "WH-JOS", portId: "PORT-ONN", stage: "Bulk Movement", qualityRequired: true, quality: "Buyer accepted", qualityResult: "Li2O 3.4%",
      timeline: [tl(-16 * 1440, "Marketplace", "RFQ RFQ-1176 published"), tl(-3 * 1440, "Marketplace", "Buyer accepted quality result"), tl(-120, "Logistics", "Bulk transport request TR-3098 received", "TR-3098")],
    },
    {
      id: "TXN-2042", rfqId: "RFQ-1182", buyerId: "BUY-201", minerId: "MIN-101", mineId: "MINE-JOS-01", batchId: "BATCH-SN-0420", commitmentId: "SC-7748",
      mineral: "Tin (cassiterite)", quantity: 20, unitPrice: 14_900_000, destinationId: "WH-JOS", portId: "PORT-APP", stage: "Result Published", qualityRequired: true, quality: "Result published", qualityResult: "Sn 64.1%",
      timeline: [tl(-10 * 1440, "Marketplace", "RFQ RFQ-1182 published"), tl(-1440, "Quality", "Result published: Sn 64.1%: awaiting buyer decision"), tl(-200, "Mining", "Bulk transport requested ahead of buyer acceptance", "TR-3097")],
    },
    {
      id: "TXN-2037", rfqId: "RFQ-1178", buyerId: "BUY-203", minerId: "MIN-103", mineId: "MINE-KAD-03", batchId: "BATCH-CB-0386", commitmentId: "SC-7710",
      mineral: "Columbite", quantity: 18, unitPrice: 9_100_000, destinationId: "PRC-KAD", portId: "PORT-APP", stage: "Bulk Movement", qualityRequired: true, quality: "Buyer accepted", qualityResult: "Nb2O5 30.8%",
      timeline: [tl(-15 * 1440, "Marketplace", "RFQ RFQ-1178 published"), tl(-240, "Logistics", "Bulk movement MOV-5010 dispatched", "MOV-5010"), tl(-70, "Logistics", "Incident INC-701 reported on MOV-5010", "INC-701")],
    },
  ];

  const ev = (offset: number, event: string, extra: Partial<TimelineEvent> = {}): TimelineEvent => ({ at: iso(offset), event, actor: "Trans Sahel Haulage Ltd", source: "Logistics", ...extra });

  const requests: TransportRequest[] = [
    { id: "TR-3101", txnId: "TXN-2041", kind: "Sample", movementType: "Sample Pickup", source: "Quality", requestedBy: "Beldium Quality & Control", originId: "MINE-NAS-02", destinationId: "LAB-KAD", quantity: 12, unit: "kg", pickupBy: iso(6 * 60), deliverBy: iso(30 * 60), handling: "Sealed sample bags, chain of custody", paymentTerms: "Flat fee on lab receipt", status: "New", createdAt: iso(-40) },
    { id: "TR-3098", txnId: "TXN-2039", kind: "Bulk", movementType: "Mine to Warehouse", source: "Buyer transaction", requestedBy: "Wamba Lithium Miners Ltd", originId: "MINE-NAS-02", destinationId: "WH-JOS", quantity: 35, unit: "t", pickupBy: iso(20 * 60), deliverBy: iso(48 * 60), handling: "Bagged ore, tarpaulin cover", paymentTerms: "Net 14 on POD", status: "Awaiting Decision", createdAt: iso(-120) },
    { id: "TR-3097", txnId: "TXN-2042", kind: "Bulk", movementType: "Mine to Warehouse", source: "Completed miner aggregation", requestedBy: "Plateau Tin Cooperative", originId: "MINE-JOS-01", destinationId: "WH-JOS", quantity: 20, unit: "t", pickupBy: iso(24 * 60), deliverBy: iso(40 * 60), handling: "Bulk bags, sealed", paymentTerms: "Net 14 on POD", status: "Awaiting Decision", createdAt: iso(-200) },
    { id: "TR-3099", txnId: "TXN-2029", kind: "Bulk", movementType: "Processor to Warehouse", source: "Processor material request", requestedBy: "Kaduna Tin Smelting & Processing", originId: "PRC-KAD", destinationId: "WH-KAN", quantity: 12, unit: "t", pickupBy: iso(30 * 60), deliverBy: iso(60 * 60), handling: "Ingots on pallets", paymentTerms: "Net 30", status: "New", createdAt: iso(-25) },
    { id: "TR-3090", txnId: "TXN-2036", kind: "Bulk", movementType: "Mine to Processor", source: "Buyer transaction", requestedBy: "Plateau Tin Cooperative", originId: "MINE-JOS-01", destinationId: "PRC-KAD", quantity: 40, unit: "t", pickupBy: iso(-420), deliverBy: iso(300), handling: "Bulk bags", paymentTerms: "Net 14 on POD", status: "Accepted", movementId: "MOV-5012", createdAt: iso(-1440) },
    { id: "TR-3092", txnId: "TXN-2038", kind: "Bulk", movementType: "Mine to Warehouse", source: "Buyer transaction", requestedBy: "Kafanchan Columbite Ventures", originId: "MINE-KAD-03", destinationId: "WH-JOS", quantity: 25, unit: "t", pickupBy: iso(-60), deliverBy: iso(600), handling: "Bagged concentrate", paymentTerms: "Net 14 on POD", status: "Accepted", movementId: "MOV-5014", createdAt: iso(-1300) },
    { id: "TR-3080", txnId: "TXN-2029", kind: "Bulk", movementType: "Mine to Processor", source: "Buyer transaction", requestedBy: "Plateau Tin Cooperative", originId: "MINE-JOS-01", destinationId: "PRC-KAD", quantity: 30, unit: "t", pickupBy: iso(-6 * 1440), deliverBy: iso(-5 * 1440), handling: "Bulk bags", paymentTerms: "Net 14 on POD", status: "Accepted", movementId: "MOV-5003", createdAt: iso(-7 * 1440) },
    { id: "TR-3094", txnId: "TXN-2040", kind: "Sample", movementType: "Mine to Laboratory", source: "Quality", requestedBy: "Beldium Quality & Control", originId: "MINE-NIG-04", destinationId: "LAB-ABJ", quantity: 2, unit: "kg", pickupBy: iso(-150), deliverBy: iso(240), handling: "Tamper-evident pouch, armed escort", paymentTerms: "Flat fee on lab receipt", status: "Accepted", movementId: "MOV-5015", createdAt: iso(-600) },
    { id: "TR-3088", txnId: "TXN-2037", kind: "Bulk", movementType: "Mine to Processor", source: "Buyer transaction", requestedBy: "Kafanchan Columbite Ventures", originId: "MINE-KAD-03", destinationId: "PRC-KAD", quantity: 18, unit: "t", pickupBy: iso(-300), deliverBy: iso(120), handling: "Bagged concentrate", paymentTerms: "Net 14 on POD", status: "Accepted", movementId: "MOV-5010", createdAt: iso(-1500) },
    { id: "TR-3085", txnId: "TXN-2036", kind: "Bulk", movementType: "Warehouse to Export", source: "Export port movement", requestedBy: "Beldium Export Services", originId: "WH-KAN", destinationId: "PORT-APP", quantity: 15, unit: "t", pickupBy: iso(-2 * 1440), deliverBy: iso(-1440), handling: "Containerised", paymentTerms: "Net 30", status: "Declined", declineReason: "No container truck available in window", createdAt: iso(-3 * 1440) },
  ];

  const movements: Movement[] = [
    {
      id: "MOV-5012", requestId: "TR-3090", txnId: "TXN-2036", kind: "Bulk", movementType: "Mine to Processor", originId: "MINE-JOS-01", destinationId: "PRC-KAD", quantity: 40, unit: "t", stage: "In Transit",
      vehicleId: "TRK-002", driverId: "DRV-01", pickupAt: iso(-420), deliverBy: iso(300), progress: 45, delayed: false, deviated: false, stopped: false, exception: false, etaMin: 170, loaded: 40, createdAt: iso(-1440), rate: 42_000,
      timeline: [ev(-1440, "Request accepted"), ev(-1400, "Vehicle TRK-002 and driver Musa Abdullahi assigned"), ev(-480, "Driver dispatched"), ev(-420, "Arrived at Bisichi Tin Field", { gps: "9.7981, 8.8592" }), ev(-360, "Loaded tonnage confirmed", { quantity: "40 t" }), ev(-300, "Journey started", { gps: "9.7981, 8.8592" }), ev(-120, "Checkpoint recorded: Kaduna–Jos road, Manchok", { gps: "9.6700, 8.5200", source: "GPS tracker" })],
    },
    {
      id: "MOV-5014", requestId: "TR-3092", txnId: "TXN-2038", kind: "Bulk", movementType: "Mine to Warehouse", originId: "MINE-KAD-03", destinationId: "WH-JOS", quantity: 25, unit: "t", stage: "Loading",
      vehicleId: "TRK-003", driverId: "DRV-03", pickupAt: iso(-60), deliverBy: iso(600), progress: 0, delayed: false, deviated: false, stopped: false, exception: false, createdAt: iso(-1300), rate: 38_000,
      timeline: [ev(-1300, "Request accepted"), ev(-1250, "Vehicle TRK-003 and driver Ibrahim Danjuma assigned"), ev(-130, "Driver dispatched"), ev(-70, "Arrived at Kafanchan Columbite Site", { gps: "9.5833, 8.2921" }), ev(-50, "Loading started")],
    },
    {
      id: "MOV-5010", requestId: "TR-3088", txnId: "TXN-2037", kind: "Bulk", movementType: "Mine to Processor", originId: "MINE-KAD-03", destinationId: "PRC-KAD", quantity: 18, unit: "t", stage: "In Transit",
      vehicleId: "TRK-006", driverId: "DRV-06", pickupAt: iso(-300), deliverBy: iso(120), progress: 60, delayed: true, deviated: false, stopped: true, exception: true, etaMin: 210, loaded: 18, createdAt: iso(-1500), rate: 36_000,
      timeline: [ev(-1500, "Request accepted"), ev(-330, "Loaded tonnage confirmed", { quantity: "18 t" }), ev(-240, "Journey started"), ev(-70, "Incident INC-701 reported: Vehicle Breakdown (High)", { location: "Kachia junction", gps: "9.8740, 7.9550" }), ev(-65, "Movement placed in Exception")],
    },
    {
      id: "MOV-5015", requestId: "TR-3094", txnId: "TXN-2040", kind: "Sample", movementType: "Mine to Laboratory", originId: "MINE-NIG-04", destinationId: "LAB-ABJ", quantity: 2, unit: "kg", stage: "In Transit",
      vehicleId: "VAN-012", driverId: "DRV-08", pickupAt: iso(-150), deliverBy: iso(240), progress: 35, delayed: false, deviated: false, stopped: false, exception: false, etaMin: 95, sampleId: "SAM-281", custodyId: "COC-281", createdAt: iso(-600), rate: 85_000,
      timeline: [ev(-600, "Request accepted"), ev(-200, "Driver dispatched"), ev(-150, "Arrived at Minna Gold Lease 17", { gps: "9.6139, 6.5569" }), ev(-90, "Sample SAM-281 collected: chain of custody COC-281 opened", { gps: "9.6139, 6.5569", quantity: "2 kg", evidence: "Seal NG-SL-88213" }), ev(-80, "Journey started")],
    },
    {
      id: "MOV-5003", requestId: "TR-3080", txnId: "TXN-2029", kind: "Bulk", movementType: "Mine to Processor", originId: "MINE-JOS-01", destinationId: "PRC-KAD", quantity: 30, unit: "t", stage: "Completed",
      vehicleId: "TRK-007", driverId: "DRV-02", pickupAt: iso(-6 * 1440), deliverBy: iso(-5 * 1440), progress: 100, delayed: false, deviated: false, stopped: false, exception: false, loaded: 30, received: 29.8, podId: "POD-5003", createdAt: iso(-7 * 1440), completedAt: iso(-5 * 1440), rate: 42_000,
      timeline: [ev(-7 * 1440, "Request accepted"), ev(-6 * 1440, "Loaded tonnage confirmed", { quantity: "30 t" }), ev(-5 * 1440 - 60, "Weighbridge quantity recorded", { quantity: "29.8 t" }), ev(-5 * 1440, "Proof of delivery POD-5003 generated"), ev(-5 * 1440, "Movement completed")],
    },
  ];

  const vehicles: Vehicle[] = [
    { id: "TRK-001", registration: "KDU-481-XA", type: "Tipper", make: "Sinotruk Howo", capacity: 30, year: 2021, tracker: "Online", maintenance: false, compliance: "Cleared", lastService: dateOnly(-40), nextService: dateOnly(50), maintenanceLog: [{ at: iso(-40 * 1440), note: "Full service, brake pads replaced" }] },
    { id: "TRK-002", registration: "PLT-224-JS", type: "Flatbed", make: "MAN TGS", capacity: 40, year: 2020, tracker: "Online", maintenance: false, compliance: "Cleared", movementId: "MOV-5012", lastService: dateOnly(-20), nextService: dateOnly(70), maintenanceLog: [] },
    { id: "TRK-003", registration: "KDU-902-KF", type: "Tipper", make: "Sinotruk Howo", capacity: 30, year: 2022, tracker: "Online", maintenance: false, compliance: "Cleared", movementId: "MOV-5014", lastService: dateOnly(-15), nextService: dateOnly(75), maintenanceLog: [] },
    { id: "TRK-004", registration: "ABJ-118-GW", type: "Tipper", make: "Mercedes Actros", capacity: 30, year: 2018, tracker: "Online", maintenance: true, compliance: "Cleared", lastService: dateOnly(-1), nextService: dateOnly(2), maintenanceLog: [{ at: iso(-1440), note: "Gearbox overhaul in progress: Kaduna workshop" }] },
    { id: "TRK-005", registration: "JOS-551-BK", type: "Flatbed", make: "DAF CF", capacity: 40, year: 2017, tracker: "Online", maintenance: false, compliance: "Restricted", reason: "Roadworthiness certificate expired", lastService: dateOnly(-60), nextService: dateOnly(30), maintenanceLog: [] },
    { id: "TRK-006", registration: "KDU-337-KC", type: "Tipper", make: "Sinotruk Howo", capacity: 30, year: 2019, tracker: "Online", maintenance: false, compliance: "Cleared", movementId: "MOV-5010", lastService: dateOnly(-80), nextService: dateOnly(10), maintenanceLog: [] },
    { id: "TRK-007", registration: "KAN-760-DP", type: "Flatbed", make: "MAN TGS", capacity: 45, year: 2022, tracker: "Online", maintenance: false, compliance: "Cleared", lastService: dateOnly(-10), nextService: dateOnly(80), maintenanceLog: [] },
    { id: "TRK-008", registration: "LAG-904-AP", type: "Container Truck", make: "Mack Granite", capacity: 30, year: 2021, tracker: "Online", maintenance: false, compliance: "Cleared", lastService: dateOnly(-30), nextService: dateOnly(60), maintenanceLog: [] },
    { id: "VAN-011", registration: "KDU-120-SV", type: "Sample Van", make: "Toyota Hiace", capacity: 1, year: 2023, tracker: "Online", maintenance: false, compliance: "Cleared", lastService: dateOnly(-12), nextService: dateOnly(78), maintenanceLog: [] },
    { id: "VAN-012", registration: "ABJ-443-SV", type: "Sample Van", make: "Toyota Hiace", capacity: 1, year: 2022, tracker: "Online", maintenance: false, compliance: "Cleared", movementId: "MOV-5015", lastService: dateOnly(-25), nextService: dateOnly(65), maintenanceLog: [] },
    { id: "VAN-013", registration: "PLT-771-SV", type: "Sample Van", make: "Ford Transit", capacity: 1, year: 2020, tracker: "Offline", maintenance: false, compliance: "Cleared", lastService: dateOnly(-33), nextService: dateOnly(57), maintenanceLog: [] },
  ];

  const drivers: Driver[] = [
    { id: "DRV-01", name: "Musa Abdullahi", phone: "+234 803 412 7781", licence: "KDU-DL-44812", licenceClass: "Class E (HGV)", licenceExpiry: dateOnly(400), training: ["Defensive driving", "Mineral cargo handling"], onDuty: true, compliance: "Cleared", movementId: "MOV-5012", safetyScore: 94 },
    { id: "DRV-02", name: "Chinedu Okafor", phone: "+234 806 220 1947", licence: "LAG-DL-99102", licenceClass: "Class E (HGV)", licenceExpiry: dateOnly(210), training: ["Defensive driving", "Journey management"], onDuty: true, compliance: "Cleared", safetyScore: 91 },
    { id: "DRV-03", name: "Ibrahim Danjuma", phone: "+234 802 781 3350", licence: "KDU-DL-38821", licenceClass: "Class E (HGV)", licenceExpiry: dateOnly(150), training: ["Defensive driving"], onDuty: true, compliance: "Cleared", movementId: "MOV-5014", safetyScore: 88 },
    { id: "DRV-04", name: "Emeka Nwosu", phone: "+234 809 552 6120", licence: "ENU-DL-20931", licenceClass: "Class E (HGV)", licenceExpiry: dateOnly(320), training: ["Defensive driving", "Mineral cargo handling"], onDuty: false, compliance: "Cleared", safetyScore: 90 },
    { id: "DRV-05", name: "Yakubu Garba", phone: "+234 805 118 4402", licence: "BAU-DL-11873", licenceClass: "Class E (HGV)", licenceExpiry: dateOnly(-12), training: ["Defensive driving"], onDuty: true, compliance: "Restricted", reason: "Driving licence expired", safetyScore: 76 },
    { id: "DRV-06", name: "Tunde Adeyemi", phone: "+234 807 663 9014", licence: "OYO-DL-55021", licenceClass: "Class E (HGV)", licenceExpiry: dateOnly(500), training: ["Defensive driving", "Journey management"], onDuty: true, compliance: "Cleared", movementId: "MOV-5010", safetyScore: 85 },
    { id: "DRV-07", name: "Aisha Bello", phone: "+234 813 902 4471", licence: "KAN-DL-70219", licenceClass: "Class B", licenceExpiry: dateOnly(600), training: ["Sample chain of custody", "Defensive driving"], onDuty: true, compliance: "Cleared", safetyScore: 97 },
    { id: "DRV-08", name: "Samuel Pam", phone: "+234 816 330 5528", licence: "PLT-DL-61190", licenceClass: "Class B", licenceExpiry: dateOnly(280), training: ["Sample chain of custody"], onDuty: true, compliance: "Cleared", movementId: "MOV-5015", safetyScore: 93 },
    { id: "DRV-09", name: "Halima Yusuf", phone: "+234 818 207 6613", licence: "NIG-DL-40277", licenceClass: "Class E (HGV)", licenceExpiry: dateOnly(190), training: ["Defensive driving", "Mineral cargo handling"], onDuty: true, compliance: "Cleared", safetyScore: 92 },
  ];

  let d = 0;
  const doc = (name: string, type: string, relatedKind: RelatedKind, relatedId: string, authority: string, issue: number, expiry: number | undefined, verification: DocStatus = "Verified"): Doc => ({
    id: `DOC-${String(++d + 800).padStart(4, "0")}`,
    name, type, relatedKind, relatedId, number: `${type.slice(0, 3).toUpperCase()}-${relatedId}-${d}`, authority,
    issueDate: dateOnly(issue), expiryDate: expiry === undefined ? undefined : dateOnly(expiry), verification, uploadedAt: iso(issue * 1440),
  });
  const documents: Doc[] = [
    doc("CAC Certificate of Incorporation", "Registration", "Organisation", "LOG-00412", "Corporate Affairs Commission", -1400, undefined),
    doc("Tax Identification Certificate", "Tax", "Organisation", "LOG-00412", "FIRS", -900, undefined),
    doc("Goods in Transit Insurance", "Insurance", "Organisation", "LOG-00412", "Leadway Assurance", -200, 165),
    doc("HSE Policy", "Safety", "Organisation", "LOG-00412", "Trans Sahel Haulage Ltd", -300, undefined),
    doc("Journey Management Plan", "Safety", "Organisation", "LOG-00412", "Trans Sahel Haulage Ltd", -120, undefined, "Under Review"),
    ...vehicles.flatMap((v) => [
      doc(`Vehicle Insurance: ${v.registration}`, "Insurance", "Vehicle", v.id, "AIICO Insurance", -300, v.id === "TRK-007" ? 12 : 65 + v.capacity),
      doc(`Roadworthiness: ${v.registration}`, "Roadworthiness", "Vehicle", v.id, "FRSC / VIO", -330, v.id === "TRK-005" ? -10 : 90 + v.year % 10 * 10),
    ]),
    ...drivers.map((dr) => doc(`Driving Licence: ${dr.name}`, "Licence", "Driver", dr.id, "FRSC", -700, Math.round((new Date(dr.licenceExpiry).getTime() - Date.now()) / DAY))),
    doc("Medical Fitness: Halima Yusuf", "Medical", "Driver", "DRV-09", "Barau Dikko Hospital", -340, 20),
    doc("Proof of Delivery POD-5003", "Proof of Delivery", "Movement", "MOV-5003", "Kaduna Tin Smelting & Processing", -5, undefined),
  ];

  const incidents: Incident[] = [
    { id: "INC-701", movementId: "MOV-5010", type: "Vehicle Breakdown", severity: "High", description: "Air brake line failure, vehicle stopped on shoulder", location: "Kachia junction, Kaduna", material: "Columbite", quantityAffected: "18 t (secured)", evidence: "Driver photo set, tracker stop log", immediateAction: "Hazard triangles placed, mechanic dispatched from Kaduna", status: "Open", reportedAt: iso(-70) },
    { id: "INC-688", movementId: "MOV-5003", type: "Quantity Variance", severity: "Low", description: "0.2 t variance between loaded and weighbridge quantity", location: "Kaduna Tin Smelting weighbridge", material: "Tin (cassiterite)", quantityAffected: "0.2 t", evidence: "Weighbridge ticket WB-88120", immediateAction: "Variance acknowledged by processor", status: "Resolved", reportedAt: iso(-5 * 1440), resolvedAt: iso(-5 * 1440 + 90), resolution: "Within 1% tolerance: accepted" },
  ];

  const invoices: Invoice[] = [{ id: "INV-9003", movementId: "MOV-5003", txnId: "TXN-2029", amount: 30 * 42_000, paid: 30 * 42_000, status: "Paid", updatedAt: iso(-2 * 1440) }];

  const nonConformities: NonConformity[] = [
    { id: "NC-114", area: "Vehicle", relatedKind: "Vehicle", relatedId: "TRK-005", detail: "Roadworthiness certificate expired", status: "Open", raisedAt: iso(-10 * 1440) },
    { id: "NC-117", area: "Driver", relatedKind: "Driver", relatedId: "DRV-05", detail: "Driving licence expired: driver suspended from assignment", status: "Open", raisedAt: iso(-12 * 1440) },
    { id: "NC-109", area: "Safety", relatedKind: "Organisation", relatedId: "LOG-00412", detail: "Journey management plan missing night-driving rules", action: "Revised JMP uploaded", status: "Corrective Action Submitted", raisedAt: iso(-20 * 1440) },
  ];

  const q = (path: QueuePath, tab?: string): Target => ({ kind: "queue", path, tab });
  const notifications: Notification[] = [
    { id: "N-1", at: iso(-40), category: "Request", title: "New transport request TR-3101", body: "Sample pickup · Wamba Lithium Pegmatite → Kaduna Minerals Laboratory", target: { kind: "request", id: "TR-3101" }, read: false },
    { id: "N-2", at: iso(-25), category: "Request", title: "New transport request TR-3099", body: "Processor to Warehouse · 12 t", target: { kind: "request", id: "TR-3099" }, read: false },
    { id: "N-3", at: iso(-70), category: "Incident", title: "Incident INC-701 reported", body: "Vehicle Breakdown (High) on MOV-5010", target: { kind: "movement", id: "MOV-5010" }, read: false },
    { id: "N-4", at: iso(-90), category: "Sample", title: "Sample SAM-281 collected", body: "Minna Gold Lease 17 · chain of custody COC-281", target: { kind: "movement", id: "MOV-5015" }, read: true },
    { id: "N-5", at: iso(-10 * 1440), category: "Compliance", title: "Vehicle JOS-551-BK restricted", body: "Roadworthiness certificate expired", target: { kind: "vehicle", id: "TRK-005" }, read: true },
    { id: "N-6", at: iso(-2 * 1440), category: "Payment", title: "Payment received INV-9003", body: "₦1,260,000 from Afrimet Resources UK", target: q("/portal/payments", "Paid"), read: true },
  ];

  const activity: Activity[] = [
    { id: "A-1", at: iso(-25), sector: "Processing", text: "Transport request TR-3099 received from Kaduna Tin Smelting", target: { kind: "request", id: "TR-3099" } },
    { id: "A-2", at: iso(-40), sector: "Quality", text: "Sample pickup requested for BATCH-LI-0417", target: { kind: "request", id: "TR-3101" } },
    { id: "A-3", at: iso(-50), sector: "Logistics", text: "Loading started: MOV-5014 at Kafanchan Columbite Site", target: { kind: "movement", id: "MOV-5014" } },
    { id: "A-4", at: iso(-70), sector: "Logistics", text: "Incident INC-701 reported on MOV-5010", target: { kind: "movement", id: "MOV-5010" } },
    { id: "A-5", at: iso(-90), sector: "Logistics", text: "Sample SAM-281 collected", target: { kind: "movement", id: "MOV-5015" } },
    { id: "A-6", at: iso(-120), sector: "Logistics", text: "MOV-5012 checkpoint recorded at Manchok", target: { kind: "movement", id: "MOV-5012" } },
  ];

  return {
    version: 1, seq: 100, parties, sites, rfqs, transactions, requests, movements, vehicles, drivers, documents, incidents, invoices, nonConformities, notifications, activity,
    prefs: { "Transport requests": true, "Compliance alerts": true, "Incident alerts": true, "Payment updates": true, "Document expiry": true },
  };
}

/* ---------------------------------------------------------------- store */

// v2: queue targets moved under /portal; older saved state would link to dead paths.
const KEY = "beldium-ops-demo-v2";
let state: OpsState | null = null;
const listeners = new Set<() => void>();

function load(): OpsState {
  if (state) return state;
  if (typeof window !== "undefined") {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) {
        state = JSON.parse(raw) as OpsState;
        return state;
      }
    } catch {
      /* fall through */
    }
  }
  state = seed();
  return state;
}

function commit(next: OpsState) {
  state = next;
  if (typeof window !== "undefined") window.localStorage.setItem(KEY, JSON.stringify(next));
  listeners.forEach((l) => l());
}

export function getOps() {
  return load();
}
export function useOps(): OpsState {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    load,
    load,
  );
}
export function resetOps() {
  commit(seed());
}

/** Mutate a draft copy of state. */
function mutate(fn: (s: OpsState) => void) {
  const draft = structuredClone(load());
  fn(draft);
  commit(draft);
}

const nextId = (s: OpsState, prefix: string) => `${prefix}-${++s.seq + 5000}`;

/* ---------------------------------------------------------------- lookups */

export const site = (s: OpsState, id?: string) => s.sites.find((x) => x.id === id);
export const party = (s: OpsState, id?: string) => s.parties.find((x) => x.id === id);
export const siteName = (s: OpsState, id?: string) => site(s, id)?.name ?? "-";
export const partyName = (s: OpsState, id?: string) => party(s, id)?.name ?? "-";
export const txnOf = (s: OpsState, id?: string) => s.transactions.find((t) => t.id === id);
export const vehicleOf = (s: OpsState, id?: string) => s.vehicles.find((v) => v.id === id);
export const driverOf = (s: OpsState, id?: string) => s.drivers.find((d) => d.id === id);
export const movementOf = (s: OpsState, id?: string) => s.movements.find((m) => m.id === id);

export function flowOf(m: Movement) {
  return m.kind === "Sample" ? SAMPLE_FLOW : BULK_FLOW;
}

export function movementStatus(m: Movement) {
  if (m.exception) return "Exception";
  if (m.stage === "In Transit" && m.delayed) return "Delayed";
  if (m.kind === "Sample" && m.stage === "At Destination") return "At Laboratory";
  if (m.kind === "Sample" && m.stage === "At Origin") return "At Mine";
  return m.stage;
}

export function requestStatus(s: OpsState, r: TransportRequest): RequestStatus {
  if (r.status !== "Accepted") return r.status;
  const m = movementOf(s, r.movementId);
  if (!m) return "Accepted";
  if (m.stage === "Completed") return "Completed";
  if (m.stage === "Awaiting Assignment") return "Accepted";
  if (m.stage === "Scheduled") return "Scheduled";
  return "Active";
}

export function distanceKm(s: OpsState, m: Pick<Movement, "originId" | "destinationId">) {
  const a = site(s, m.originId);
  const b = site(s, m.destinationId);
  if (!a || !b) return 0;
  return Math.round(Math.hypot(a.x - b.x, a.y - b.y) * 11.5);
}

export function positionOf(s: OpsState, m: Movement) {
  const a = site(s, m.originId);
  const b = site(s, m.destinationId);
  if (!a || !b) return { x: 50, y: 50 };
  const onOrigin = ["Awaiting Assignment", "Scheduled", "Driver En Route", "At Origin", "Loading", "Loaded", "Collected"].includes(m.stage);
  const p = onOrigin ? 0 : m.stage === "In Transit" ? m.progress / 100 : 1;
  const bend = m.deviated ? 6 : 3;
  return { x: a.x + (b.x - a.x) * p + Math.sin(p * Math.PI) * bend, y: a.y + (b.y - a.y) * p - Math.sin(p * Math.PI) * bend };
}

export function vehicleAvailability(v: Vehicle, s: OpsState) {
  if (v.maintenance) return "Maintenance";
  if (v.compliance !== "Cleared" || vehicleBlock(s, v)) return "Compliance Hold";
  if (v.movementId) {
    const m = movementOf(s, v.movementId);
    return m && m.stage === "In Transit" ? "In Transit" : "Assigned";
  }
  return "Available";
}
export function driverAvailability(d: Driver, s: OpsState) {
  if (d.compliance !== "Cleared" || driverBlock(s, d)) return "Compliance Hold";
  if (d.movementId) {
    const m = movementOf(s, d.movementId);
    return m && ["Driver En Route", "In Transit"].includes(m.stage) ? "On Journey" : "Assigned";
  }
  if (!d.onDuty) return "Off Duty";
  return "Available";
}

/** Return the reason a vehicle cannot be assigned, or null if eligible compliance-wise. */
export function vehicleBlock(s: OpsState, v: Vehicle): string | null {
  if (v.compliance !== "Cleared") return v.reason ?? `Compliance ${v.compliance}`;
  const expired = s.documents.find((d) => d.relatedKind === "Vehicle" && d.relatedId === v.id && docState(d) === "Expired");
  if (expired) return `${expired.type} document expired`;
  const rejected = s.documents.find((d) => d.relatedKind === "Vehicle" && d.relatedId === v.id && d.verification === "Rejected");
  if (rejected) return `${rejected.type} document rejected`;
  return null;
}
export function driverBlock(s: OpsState, d: Driver): string | null {
  if (d.compliance !== "Cleared") return d.reason ?? `Compliance ${d.compliance}`;
  if (new Date(d.licenceExpiry).getTime() < Date.now()) return "Driving licence expired";
  const expired = s.documents.find((x) => x.relatedKind === "Driver" && x.relatedId === d.id && docState(x) === "Expired");
  if (expired) return `${expired.type} document expired`;
  return null;
}

export function vehicleCandidates(s: OpsState, m: Movement) {
  return s.vehicles
    .filter((v) => (m.kind === "Sample" ? v.type === "Sample Van" : v.type !== "Sample Van"))
    .map((v) => {
      let reason: string | null = null;
      if (v.maintenance) reason = "In maintenance";
      else if (v.movementId && v.movementId !== m.id) reason = `Assigned to ${v.movementId}`;
      else reason = vehicleBlock(s, v);
      return { v, reason };
    });
}
export function driverCandidates(s: OpsState, m: Movement) {
  return s.drivers
    .filter((d) => (m.kind === "Sample" ? d.training.includes("Sample chain of custody") : d.licenceClass.startsWith("Class E")))
    .map((d) => {
      let reason: string | null = null;
      if (!d.onDuty) reason = "Off duty";
      else if (d.movementId && d.movementId !== m.id) reason = `Assigned to ${d.movementId}`;
      else reason = driverBlock(s, d);
      return { d, reason };
    });
}

/** Quality gate for bulk pickup. */
export function qualityGate(s: OpsState, m: Movement): string | null {
  if (m.kind !== "Bulk") return null;
  const t = txnOf(s, m.txnId);
  if (!t || !t.qualityRequired) return null;
  if (m.movementType.startsWith("Mine") && t.quality !== "Buyer accepted") return `Buyer quality acceptance pending (${t.quality})`;
  return null;
}

/* ---------------------------------------------------------------- side-effect helpers */

function notify(s: OpsState, category: string, title: string, body: string, target: Target) {
  s.notifications.unshift({ id: nextId(s, "N"), at: nowIso(), category, title, body, target, read: false });
}
function log(s: OpsState, sector: string, text: string, target: Target) {
  s.activity.unshift({ id: nextId(s, "A"), at: nowIso(), sector, text, target });
  s.activity = s.activity.slice(0, 200);
}
function chain(s: OpsState, txnId: string, sector: string, event: string, ref?: string) {
  const t = txnOf(s, txnId);
  if (t) t.timeline.push({ at: nowIso(), sector, event, ref });
}
function mev(m: Movement, event: string, extra: Partial<TimelineEvent> = {}) {
  m.timeline.push({ at: nowIso(), event, actor: "Trans Sahel Haulage Ltd", source: "Logistics", ...extra });
}
function refreshEta(s: OpsState, m: Movement) {
  const km = distanceKm(s, m);
  m.etaMin = Math.max(5, Math.round((km * (1 - m.progress / 100)) / 45 * 60) + (m.delayed ? 60 : 0));
}

/* ---------------------------------------------------------------- request actions */

export function viewRequest(id: string) {
  const r = load().requests.find((x) => x.id === id);
  if (r?.status === "New") mutate((s) => {
    const x = s.requests.find((y) => y.id === id)!;
    x.status = "Awaiting Decision";
  });
}

export function acceptRequest(id: string): string | undefined {
  let movementId: string | undefined;
  mutate((s) => {
    const r = s.requests.find((x) => x.id === id);
    if (!r || r.status === "Accepted" || r.status === "Declined") return;
    movementId = nextId(s, "MOV");
    r.status = "Accepted";
    r.movementId = movementId;
    const m: Movement = {
      id: movementId, requestId: r.id, txnId: r.txnId, kind: r.kind, movementType: r.movementType, originId: r.originId, destinationId: r.destinationId,
      quantity: r.quantity, unit: r.unit, stage: "Awaiting Assignment", deliverBy: r.deliverBy, progress: 0, delayed: false, deviated: false, stopped: false, exception: false,
      createdAt: nowIso(), rate: r.kind === "Sample" ? 85_000 : 40_000, timeline: [],
    };
    mev(m, `Transport request ${r.id} accepted`);
    s.movements.unshift(m);
    chain(s, r.txnId, "Logistics", `Logistics accepted ${r.id}: movement ${movementId} created`, movementId);
    notify(s, "Assignment", `Assignment required for ${movementId}`, `${r.movementType} · ${siteName(s, r.originId)} → ${siteName(s, r.destinationId)}`, { kind: "movement", id: movementId });
    log(s, "Logistics", `Request ${r.id} accepted: ${movementId} created`, { kind: "movement", id: movementId });
  });
  return movementId;
}

export function declineRequest(id: string, reason: string) {
  mutate((s) => {
    const r = s.requests.find((x) => x.id === id);
    if (!r) return;
    r.status = "Declined";
    r.declineReason = reason;
    chain(s, r.txnId, "Logistics", `Logistics declined ${r.id}: ${reason}`, r.id);
    log(s, "Logistics", `Request ${r.id} declined`, { kind: "request", id: r.id });
  });
}

/* ---------------------------------------------------------------- assignment */

export function assignResources(movementId: string, vehicleId: string, driverId: string, pickupAt: string): string | null {
  const s0 = load();
  const m0 = movementOf(s0, movementId);
  if (!m0) return "Movement not found";
  const vc = vehicleCandidates(s0, m0).find((c) => c.v.id === vehicleId);
  const dc = driverCandidates(s0, m0).find((c) => c.d.id === driverId);
  if (!vc || vc.reason) return vc?.reason ?? "Vehicle not eligible";
  if (!dc || dc.reason) return dc?.reason ?? "Driver not eligible";
  mutate((s) => {
    const m = movementOf(s, movementId)!;
    const prevV = vehicleOf(s, m.vehicleId);
    const prevD = driverOf(s, m.driverId);
    if (prevV && prevV.id !== vehicleId) prevV.movementId = undefined;
    if (prevD && prevD.id !== driverId) prevD.movementId = undefined;
    const v = vehicleOf(s, vehicleId)!;
    const d = driverOf(s, driverId)!;
    v.movementId = m.id;
    d.movementId = m.id;
    m.vehicleId = v.id;
    m.driverId = d.id;
    m.pickupAt = pickupAt;
    mev(m, `Vehicle ${v.id} (${v.registration}) assigned: compliance validated`);
    mev(m, `Driver ${d.name} assigned: licence and compliance validated`);
    mev(m, `Pickup scheduled for ${fmt(pickupAt)}`);
    if (m.stage === "Awaiting Assignment") m.stage = "Scheduled";
    chain(s, m.txnId, "Logistics", `${m.id} scheduled: ${v.registration} / ${d.name}, pickup ${fmt(pickupAt)}`, m.id);
    notify(s, "Pickup", `Pickup scheduled ${m.id}`, `${v.registration} · ${d.name} · ${fmt(pickupAt)}`, { kind: "movement", id: m.id });
    log(s, "Logistics", `${v.id} and ${d.name} assigned to ${m.id}`, { kind: "movement", id: m.id });
  });
  return null;
}

/* ---------------------------------------------------------------- stage transitions */

export type StageAction = { id: string; label: string; input?: "tonnage" | "weighbridge" | "assign" | undefined };

export function primaryAction(s: OpsState, m: Movement): StageAction | null {
  if (m.exception || m.stage === "Completed") return null;
  const sample = m.kind === "Sample";
  switch (m.stage) {
    case "Awaiting Assignment":
      return { id: "assign", label: "Assign Resources", input: "assign" };
    case "Scheduled":
      return { id: "dispatch", label: "Dispatch Driver" };
    case "Driver En Route":
      return { id: "arrive", label: "Confirm Arrival" };
    case "At Origin":
      return sample ? { id: "collect", label: "Record Sample Collection" } : { id: "load", label: "Start Loading" };
    case "Loading":
      return { id: "pickup", label: "Confirm Pickup", input: "tonnage" };
    case "Loaded":
    case "Collected":
      return { id: "journey", label: "Start Journey" };
    case "In Transit":
      return { id: "arriveDest", label: "Confirm Destination Arrival" };
    case "At Destination":
      return sample ? { id: "labReceipt", label: "Confirm Laboratory Receipt" } : { id: "weigh", label: "Record Weighbridge Quantity", input: "weighbridge" };
    case "Unloading":
      return { id: "deliver", label: "Confirm Delivery" };
    case "Delivered":
      return { id: "complete", label: "Complete Job" };
  }
  void s;
  return null;
}

export function runAction(movementId: string, action: string, value?: number): string | null {
  const s0 = load();
  const m0 = movementOf(s0, movementId);
  if (!m0) return "Movement not found";
  if (action === "load") {
    const gate = qualityGate(s0, m0);
    if (gate) return gate;
  }
  mutate((s) => {
    const m = movementOf(s, movementId)!;
    const t = txnOf(s, m.txnId);
    const org = site(s, m.originId)!;
    const dst = site(s, m.destinationId)!;
    const drv = driverOf(s, m.driverId);
    const veh = vehicleOf(s, m.vehicleId);
    const tgt: Target = { kind: "movement", id: m.id };
    switch (action) {
      case "dispatch":
        m.stage = "Driver En Route";
        mev(m, `Driver ${drv?.name} dispatched in ${veh?.registration}`);
        log(s, "Logistics", `${veh?.id} dispatched for ${m.id}`, tgt);
        break;
      case "arrive":
        m.stage = "At Origin";
        mev(m, `Driver arrived at ${org.name}`, { location: org.name, gps: org.gps, source: "Driver app" });
        notify(s, "Pickup", `Driver arrived: ${m.id}`, `${drv?.name} at ${org.name}`, tgt);
        log(s, "Logistics", `Driver arrived at ${org.name} for ${m.id}`, tgt);
        break;
      case "load":
        m.stage = "Loading";
        mev(m, "Loading started", { location: org.name, gps: org.gps });
        chain(s, m.txnId, "Logistics", `Loading started at ${org.name}`, m.id);
        log(s, "Logistics", `Loading started: ${m.id}`, tgt);
        break;
      case "pickup": {
        const tonnes = value ?? m.quantity;
        m.loaded = tonnes;
        m.stage = "Loaded";
        mev(m, "Loaded tonnage confirmed: pickup timestamp recorded", { quantity: `${tonnes} ${m.unit}`, location: org.name, gps: org.gps, evidence: `Loading ticket LT-${m.id.slice(4)}` });
        chain(s, m.txnId, "Logistics", `Pickup confirmed: ${tonnes} ${m.unit} loaded at ${org.name}`, m.id);
        notify(s, "Pickup", `Pickup confirmed ${m.id}`, `${tonnes} ${m.unit} loaded`, tgt);
        log(s, "Logistics", `${tonnes} ${m.unit} loaded on ${veh?.id}: ${m.id}`, tgt);
        break;
      }
      case "collect": {
        const n = s.seq + 180;
        m.sampleId = `SAM-${n}`;
        m.custodyId = `COC-${n}`;
        m.loaded = m.quantity;
        m.stage = "Collected";
        mev(m, `Sample ${m.sampleId} collected: collection timestamp generated`, { location: org.name, gps: org.gps, quantity: `${m.quantity} ${m.unit}`, evidence: `Seal NG-SL-${88000 + n}` });
        mev(m, `Chain of custody ${m.custodyId} opened`, { source: "Beldium custody ledger" });
        if (t) t.quality = "Sample collected";
        chain(s, m.txnId, "Logistics", `Sample ${m.sampleId} collected at ${org.name} (GPS ${org.gps})`, m.id);
        notify(s, "Sample", `Sample ${m.sampleId} collected`, `${org.name} · custody ${m.custodyId}`, tgt);
        log(s, "Logistics", `Sample ${m.sampleId} collected`, tgt);
        break;
      }
      case "journey":
        m.stage = "In Transit";
        m.progress = 0;
        refreshEta(s, m);
        mev(m, "Journey started: live tracking active", { gps: org.gps, source: "GPS tracker" });
        chain(s, m.txnId, "Logistics", `${m.id} in transit to ${dst.name}`, m.id);
        log(s, "Logistics", `${veh?.id} departed ${org.name}: ${m.id}`, tgt);
        break;
      case "advance": {
        m.progress = Math.min(95, m.progress + 20);
        m.stopped = false;
        refreshEta(s, m);
        const p = positionOf(s, m);
        const [oa = 0, ob = 0] = org.gps.split(",").map(Number);
        const [da = 0, db = 0] = dst.gps.split(",").map(Number);
        const gps = `${(oa + ((da - oa) * m.progress) / 100).toFixed(4)}, ${(ob + ((db - ob) * m.progress) / 100).toFixed(4)}`;
        void p;
        mev(m, `Tracking update: ${m.progress}% of route, ETA ${m.etaMin} min`, { gps, source: "GPS tracker" });
        log(s, "Logistics", `${m.id} checkpoint recorded (${m.progress}%)`, tgt);
        break;
      }
      case "stop":
        m.stopped = true;
        mev(m, "Unscheduled stop detected", { source: "GPS tracker" });
        notify(s, "Tracking", `Vehicle stopped: ${m.id}`, `${veh?.registration} stationary`, tgt);
        log(s, "Logistics", `${veh?.id} stopped: ${m.id}`, tgt);
        break;
      case "delay":
        m.delayed = true;
        refreshEta(s, m);
        mev(m, `Delay recorded: ETA revised to ${m.etaMin} min`, { source: "Operator" });
        chain(s, m.txnId, "Logistics", `${m.id} delayed: revised ETA ${m.etaMin} min`, m.id);
        notify(s, "Tracking", `Movement delayed: ${m.id}`, `Revised ETA ${m.etaMin} min`, tgt);
        log(s, "Logistics", `${m.id} delayed`, tgt);
        break;
      case "clearDelay":
        m.delayed = false;
        m.stopped = false;
        refreshEta(s, m);
        mev(m, "Delay cleared: movement back on schedule");
        log(s, "Logistics", `${m.id} back on schedule`, tgt);
        break;
      case "deviate":
        m.deviated = true;
        mev(m, "Route deviation detected: vehicle off approved corridor", { source: "GPS tracker" });
        notify(s, "Tracking", `Route deviation: ${m.id}`, `${veh?.registration} left the approved route`, tgt);
        log(s, "Logistics", `Route deviation on ${m.id}`, tgt);
        break;
      case "rejoin":
        m.deviated = false;
        mev(m, "Vehicle returned to approved route", { source: "GPS tracker" });
        break;
      case "arriveDest":
        m.stage = "At Destination";
        m.progress = 100;
        m.etaMin = 0;
        m.stopped = false;
        mev(m, `Arrived at ${dst.name}: gate entry recorded`, { location: dst.name, gps: dst.gps, source: "GPS tracker" });
        chain(s, m.txnId, "Logistics", `${m.id} arrived at ${dst.name}`, m.id);
        notify(s, "Delivery", `Arrived at destination: ${m.id}`, `${dst.name} · confirmation required`, tgt);
        log(s, "Logistics", `${m.id} arrived at ${dst.name}`, tgt);
        break;
      case "weigh": {
        const q = value ?? m.loaded ?? m.quantity;
        m.received = q;
        m.stage = "Unloading";
        const variance = +((m.loaded ?? m.quantity) - q).toFixed(2);
        mev(m, "Weighbridge quantity recorded", { quantity: `${q} ${m.unit}`, location: dst.name, evidence: `Weighbridge ticket WB-${m.id.slice(4)}` });
        if (Math.abs(variance) > 0) mev(m, `Quantity variance ${variance} ${m.unit} against loaded tonnage`);
        log(s, dst.kind, `${dst.name} weighed ${q} ${m.unit}: ${m.id}`, tgt);
        break;
      }
      case "labReceipt":
        m.received = m.quantity;
        m.stage = "Delivered";
        mev(m, `Laboratory receipt confirmed: receipt timestamp generated`, { actor: dst.name, location: dst.name, gps: dst.gps, source: "Laboratory", evidence: `Receipt LR-${m.id.slice(4)}` });
        mev(m, `Chain of custody ${m.custodyId} transferred to ${dst.name}`, { source: "Beldium custody ledger" });
        if (t) {
          t.quality = "At laboratory";
          if (t.stage === "Sampling") t.stage = "Quality Testing";
        }
        chain(s, m.txnId, "Quality", `${dst.name} confirmed receipt of sample ${m.sampleId}`, m.id);
        notify(s, "Sample", `Laboratory confirmed receipt: ${m.sampleId}`, dst.name, tgt);
        log(s, "Quality", `${dst.name} confirmed receipt of ${m.sampleId}`, tgt);
        break;
      case "deliver": {
        m.podId = `POD-${m.id.slice(4)}`;
        m.stage = "Delivered";
        const label = dst.kind === "Processor" ? "DELIVERED TO PROCESSOR" : dst.kind === "Warehouse" ? "Warehouse receipt issued" : dst.kind === "Port" ? "Cargo handed over at port: export clearance pending" : "Delivered";
        mev(m, `Handover confirmed: ${label}`, { actor: dst.name, quantity: `${m.received ?? m.quantity} ${m.unit}`, location: dst.name, source: dst.kind });
        mev(m, `Proof of delivery ${m.podId} generated`, { evidence: m.podId });
        s.documents.unshift({ id: nextId(s, "DOC"), name: `Proof of Delivery ${m.podId}`, type: "Proof of Delivery", relatedKind: "Movement", relatedId: m.id, number: m.podId, authority: dst.name, issueDate: nowIso().slice(0, 10), verification: "Verified", uploadedAt: nowIso() });
        if (t) {
          if (dst.kind === "Processor") t.stage = "At Processor";
          else if (dst.kind === "Warehouse") t.stage = "At Warehouse";
          else if (dst.kind === "Port") t.stage = "At Port";
        }
        chain(s, m.txnId, dst.kind, `${dst.name}: ${label} (${m.received ?? m.quantity} ${m.unit})`, m.id);
        notify(s, "Delivery", `Delivery completed: ${m.id}`, `${label} · ${m.podId}`, tgt);
        log(s, dst.kind, `${label}: ${m.id}`, tgt);
        break;
      }
      case "complete": {
        m.stage = "Completed";
        m.completedAt = nowIso();
        const v = vehicleOf(s, m.vehicleId);
        const d = driverOf(s, m.driverId);
        if (v && v.movementId === m.id) v.movementId = undefined;
        if (d && d.movementId === m.id) d.movementId = undefined;
        mev(m, "Movement completed: vehicle and driver released");
        if (!s.invoices.some((i) => i.movementId === m.id)) {
          s.invoices.unshift({ id: nextId(s, "INV"), movementId: m.id, txnId: m.txnId, amount: (m.received ?? m.quantity) * m.rate * (m.kind === "Sample" ? 1 / m.quantity : 1), paid: 0, status: "Not Invoiced", updatedAt: nowIso() });
        }
        chain(s, m.txnId, "Logistics", `${m.id} completed`, m.id);
        notify(s, "Payment", `Ready to invoice: ${m.id}`, "Delivery complete, invoice can be generated", { kind: "queue", path: "/portal/payments", tab: "Not Invoiced" });
        log(s, "Logistics", `${m.id} completed`, tgt);
        break;
      }
    }
  });
  return null;
}

/* ---------------------------------------------------------------- incidents */

export function reportIncident(input: Omit<Incident, "id" | "status" | "reportedAt">): string {
  let id = "";
  mutate((s) => {
    id = nextId(s, "INC");
    s.incidents.unshift({ ...input, id, status: "Open", reportedAt: nowIso() });
    const m = movementOf(s, input.movementId);
    if (m) {
      mev(m, `Incident ${id} reported: ${input.type} (${input.severity})`, { location: input.location, quantity: input.quantityAffected || undefined, evidence: input.evidence || undefined, source: "Operator" });
      if (input.severity === "High" || input.severity === "Critical") {
        m.exception = true;
        mev(m, "Movement placed in Exception");
      }
      if (input.type === "Delay") m.delayed = true;
      chain(s, m.txnId, "Logistics", `Incident ${id} on ${m.id}: ${input.type} (${input.severity})`, id);
    }
    notify(s, "Incident", `Incident ${id} reported`, `${input.type} (${input.severity}) on ${input.movementId}`, { kind: "movement", id: input.movementId });
    log(s, "Logistics", `Incident ${id} reported on ${input.movementId}`, { kind: "movement", id: input.movementId });
  });
  return id;
}
export function resolveIncident(id: string, resolution: string) {
  mutate((s) => {
    const i = s.incidents.find((x) => x.id === id);
    if (!i) return;
    i.status = "Resolved";
    i.resolvedAt = nowIso();
    i.resolution = resolution;
    const m = movementOf(s, i.movementId);
    if (m) {
      mev(m, `Incident ${id} resolved: ${resolution}`);
      const stillOpen = s.incidents.some((x) => x.movementId === m.id && x.status === "Open" && (x.severity === "High" || x.severity === "Critical"));
      if (!stillOpen && m.exception) {
        m.exception = false;
        m.stopped = false;
        mev(m, "Exception cleared: movement resumed");
      }
    }
    log(s, "Logistics", `Incident ${id} resolved`, { kind: "movement", id: i.movementId });
  });
}

/* ---------------------------------------------------------------- invoices */

export function invoiceAction(id: string, action: "generate" | "submit" | "buyerAck" | "partPay" | "pay") {
  mutate((s) => {
    const inv = s.invoices.find((x) => x.id === id);
    if (!inv) return;
    inv.updatedAt = nowIso();
    const buyer = partyName(s, txnOf(s, inv.txnId)?.buyerId);
    if (action === "generate") inv.status = "Invoice Generated";
    if (action === "submit") inv.status = "Submitted";
    if (action === "buyerAck") inv.status = "Pending";
    if (action === "partPay") {
      inv.paid = Math.round(inv.amount / 2);
      inv.status = "Partially Paid";
      notify(s, "Payment", `Part payment received ${inv.id}`, `${naira(inv.paid)} from ${buyer}`, { kind: "queue", path: "/portal/payments", tab: "Partially Paid" });
    }
    if (action === "pay") {
      inv.paid = inv.amount;
      inv.status = "Paid";
      notify(s, "Payment", `Payment received ${inv.id}`, `${naira(inv.amount)} from ${buyer}`, { kind: "queue", path: "/portal/payments", tab: "Paid" });
      chain(s, inv.txnId, "Finance", `Logistics invoice ${inv.id} settled`, inv.id);
    }
    if (action !== "pay") chain(s, inv.txnId, "Finance", `Invoice ${inv.id} ${inv.status.toLowerCase()}`, inv.id);
    log(s, "Finance", `Invoice ${inv.id}: ${inv.status}`, { kind: "queue", path: "/portal/payments", tab: inv.status });
  });
}

/* ---------------------------------------------------------------- documents & compliance */

export function uploadDocument(input: Pick<Doc, "name" | "type" | "relatedKind" | "relatedId" | "number" | "authority" | "issueDate" | "expiryDate">) {
  mutate((s) => {
    const id = nextId(s, "DOC");
    s.documents.unshift({ ...input, id, verification: "Under Review", uploadedAt: nowIso() });
    log(s, "Logistics", `Document ${input.name} uploaded for review`, { kind: "queue", path: "/portal/documents", tab: "Under Review" });
  });
}
export function renewDocument(id: string, expiryDate: string, number: string) {
  mutate((s) => {
    const d = s.documents.find((x) => x.id === id);
    if (!d) return;
    d.expiryDate = expiryDate;
    d.issueDate = nowIso().slice(0, 10);
    d.number = number || d.number;
    d.verification = "Under Review";
    d.uploadedAt = nowIso();
    log(s, "Logistics", `Renewed ${d.name} submitted to Compliance`, { kind: "queue", path: "/portal/documents", tab: "Under Review" });
  });
}
export function reviewDocument(id: string, decision: "Verified" | "Rejected" | "Action Required") {
  mutate((s) => {
    const d = s.documents.find((x) => x.id === id);
    if (!d) return;
    d.verification = decision;
    const tgt: Target = d.relatedKind === "Vehicle" ? { kind: "vehicle", id: d.relatedId } : d.relatedKind === "Driver" ? { kind: "driver", id: d.relatedId } : { kind: "queue", path: "/portal/documents", tab: decision };
    notify(s, "Compliance", `Document ${decision.toLowerCase()}: ${d.name}`, "Beldium Logistics Compliance", tgt);
    log(s, "Compliance", `${d.name}: ${decision}`, tgt);
    // Verified renewals lift linked auto-restrictions
    if (decision === "Verified") {
      const v = d.relatedKind === "Vehicle" ? vehicleOf(s, d.relatedId) : undefined;
      if (v && v.compliance === "Restricted" && v.reason?.toLowerCase().includes(d.type.toLowerCase())) {
        v.compliance = "Cleared";
        v.reason = undefined;
        s.nonConformities.filter((n) => n.relatedId === v.id && n.status !== "Closed").forEach((n) => (n.status = "Closed"));
      }
      const dr = d.relatedKind === "Driver" ? driverOf(s, d.relatedId) : undefined;
      if (dr && d.type === "Licence" && d.expiryDate) {
        dr.licenceExpiry = d.expiryDate;
        if (dr.compliance === "Restricted" && dr.reason?.toLowerCase().includes("licence")) {
          dr.compliance = "Cleared";
          dr.reason = undefined;
          s.nonConformities.filter((n) => n.relatedId === dr.id && n.status !== "Closed").forEach((n) => (n.status = "Closed"));
        }
      }
    }
  });
}

export function setCompliance(kind: "Vehicle" | "Driver", id: string, compliance: Compliance, reason?: string) {
  mutate((s) => {
    const rec = kind === "Vehicle" ? vehicleOf(s, id) : driverOf(s, id);
    if (!rec) return;
    rec.compliance = compliance;
    rec.reason = compliance === "Cleared" ? undefined : reason;
    const label = kind === "Vehicle" ? (rec as Vehicle).registration : (rec as Driver).name;
    const tgt: Target = kind === "Vehicle" ? { kind: "vehicle", id } : { kind: "driver", id };
    if (compliance !== "Cleared") {
      s.nonConformities.unshift({ id: nextId(s, "NC"), area: kind, relatedKind: kind, relatedId: id, detail: reason ?? "Compliance restriction", status: "Open", raisedAt: nowIso() });
      notify(s, "Compliance", `${kind} ${label} ${compliance.toLowerCase()}`, reason ?? "", tgt);
    } else {
      s.nonConformities.filter((n) => n.relatedId === id && n.status !== "Closed").forEach((n) => (n.status = "Closed"));
      notify(s, "Compliance", `${kind} ${label} cleared`, "Restriction lifted by Beldium Logistics Compliance", tgt);
    }
    log(s, "Compliance", `${kind} ${label}: ${compliance}`, tgt);
  });
}
export function submitCorrectiveAction(id: string, action: string) {
  mutate((s) => {
    const n = s.nonConformities.find((x) => x.id === id);
    if (!n) return;
    n.action = action;
    n.status = "Corrective Action Submitted";
    log(s, "Logistics", `Corrective action submitted for ${n.id}`, { kind: "queue", path: "/portal/compliance" });
  });
}
export function closeNonConformity(id: string) {
  mutate((s) => {
    const n = s.nonConformities.find((x) => x.id === id);
    if (!n) return;
    n.status = "Closed";
    if (n.relatedKind === "Vehicle" || n.relatedKind === "Driver") {
      const rec = n.relatedKind === "Vehicle" ? vehicleOf(s, n.relatedId) : driverOf(s, n.relatedId);
      if (rec && !s.nonConformities.some((x) => x.relatedId === n.relatedId && x.status !== "Closed")) {
        rec.compliance = "Cleared";
        rec.reason = undefined;
      }
    }
    notify(s, "Compliance", `Non conformity ${n.id} closed`, n.detail, { kind: "queue", path: "/portal/compliance" });
    log(s, "Compliance", `${n.id} closed by Beldium Logistics Compliance`, { kind: "queue", path: "/portal/compliance" });
  });
}

/* ---------------------------------------------------------------- fleet & drivers */

export function setMaintenance(id: string, on: boolean, note: string) {
  mutate((s) => {
    const v = vehicleOf(s, id);
    if (!v || (on && v.movementId)) return;
    v.maintenance = on;
    v.maintenanceLog.unshift({ at: nowIso(), note });
    if (!on) {
      v.lastService = nowIso().slice(0, 10);
      v.nextService = dateOnly(90);
    }
    log(s, "Logistics", `${v.id} ${on ? "sent to maintenance" : "returned to service"}`, { kind: "vehicle", id });
  });
}
export function setDuty(id: string, onDuty: boolean) {
  mutate((s) => {
    const d = driverOf(s, id);
    if (!d || (!onDuty && d.movementId)) return;
    d.onDuty = onDuty;
    log(s, "Logistics", `${d.name} ${onDuty ? "on duty" : "off duty"}`, { kind: "driver", id });
  });
}
export function addVehicle(v: Pick<Vehicle, "registration" | "type" | "make" | "capacity" | "year">) {
  let id = "";
  mutate((s) => {
    id = `${v.type === "Sample Van" ? "VAN" : "TRK"}-${String(s.vehicles.length + 1).padStart(3, "0")}`;
    s.vehicles.push({ ...v, id, tracker: "Online", maintenance: false, compliance: "Hold", reason: "Awaiting Vehicle Compliance Review", lastService: nowIso().slice(0, 10), nextService: dateOnly(90), maintenanceLog: [] });
    s.nonConformities.unshift({ id: nextId(s, "NC"), area: "Vehicle", relatedKind: "Vehicle", relatedId: id, detail: "New vehicle awaiting compliance review", status: "Open", raisedAt: nowIso() });
    log(s, "Logistics", `Vehicle ${v.registration} added: sent to Vehicle Compliance Review`, { kind: "vehicle", id });
  });
  return id;
}
export function addDriver(d: Pick<Driver, "name" | "phone" | "licence" | "licenceClass" | "licenceExpiry">) {
  let id = "";
  mutate((s) => {
    id = `DRV-${String(s.drivers.length + 1).padStart(2, "0")}`;
    s.drivers.push({ ...d, id, training: [], onDuty: true, compliance: "Hold", reason: "Awaiting Driver Compliance Review", safetyScore: 80 });
    s.nonConformities.unshift({ id: nextId(s, "NC"), area: "Driver", relatedKind: "Driver", relatedId: id, detail: "New driver awaiting compliance review", status: "Open", raisedAt: nowIso() });
    log(s, "Logistics", `Driver ${d.name} added: sent to Driver Compliance Review`, { kind: "driver", id });
  });
  return id;
}

/* ---------------------------------------------------------------- notifications */

export function markRead(id: string) {
  mutate((s) => {
    const n = s.notifications.find((x) => x.id === id);
    if (n) n.read = true;
  });
}
export function markAllRead() {
  mutate((s) => s.notifications.forEach((n) => (n.read = true)));
}
export function setPref(key: string, on: boolean) {
  mutate((s) => {
    s.prefs[key] = on;
  });
}

/* ---------------------------------------------------------------- action required */

export type ActionItem = { id: string; label: string; count: number; tone: "danger" | "warning" | "primary"; target: Target };

export function actionItems(s: OpsState): ActionItem[] {
  const items: ActionItem[] = [];
  const one = <T,>(list: T[], toTarget: (x: T) => Target, queue: Target) => (list.length === 1 && list[0] !== undefined ? toTarget(list[0]) : queue);
  const pending = s.requests.filter((r) => r.status === "New" || r.status === "Awaiting Decision");
  if (pending.length) items.push({ id: "req", label: `${pending.length} request${pending.length > 1 ? "s" : ""} need acceptance`, count: pending.length, tone: "primary", target: one(pending, (r) => ({ kind: "request", id: r.id }), { kind: "queue", path: "/portal/transport-requests", tab: "Awaiting Decision" }) });
  const assign = s.movements.filter((m) => m.stage === "Awaiting Assignment");
  if (assign.length) items.push({ id: "assign", label: `${assign.length} movement${assign.length > 1 ? "s" : ""} need vehicle assignment`, count: assign.length, tone: "warning", target: one(assign, (m) => ({ kind: "movement", id: m.id }), { kind: "queue", path: "/portal/active-movements", tab: "Awaiting Assignment" }) });
  const overdue = s.movements.filter((m) => m.stage === "Scheduled" && m.pickupAt && new Date(m.pickupAt).getTime() < Date.now());
  if (overdue.length) items.push({ id: "overdue", label: `${overdue.length} pickup${overdue.length > 1 ? "s are" : " is"} overdue`, count: overdue.length, tone: "danger", target: one(overdue, (m) => ({ kind: "movement", id: m.id }), { kind: "queue", path: "/portal/active-movements", tab: "Scheduled" }) });
  const confirm = s.movements.filter((m) => ["At Destination", "Unloading", "Delivered"].includes(m.stage) && !m.exception);
  if (confirm.length) items.push({ id: "deliv", label: `${confirm.length} deliver${confirm.length > 1 ? "ies need" : "y needs"} confirmation`, count: confirm.length, tone: "warning", target: one(confirm, (m) => ({ kind: "movement", id: m.id }), { kind: "queue", path: "/portal/deliveries", tab: "Awaiting Confirmation" }) });
  const inc = s.incidents.filter((i) => i.status === "Open");
  if (inc.length) items.push({ id: "inc", label: `${inc.length} incident${inc.length > 1 ? "s need" : " needs"} resolution`, count: inc.length, tone: "danger", target: { kind: "queue", path: "/portal/incidents", tab: "Open" } });
  const expired = s.documents.filter((d) => docState(d) === "Expired");
  if (expired.length) items.push({ id: "exp", label: `${expired.length} document${expired.length > 1 ? "s" : ""} expired`, count: expired.length, tone: "danger", target: { kind: "queue", path: "/portal/documents", tab: "Expired" } });
  const expiring = s.documents.filter((d) => docState(d) === "Expiring");
  if (expiring.length) items.push({ id: "expg", label: `${expiring.length} document${expiring.length > 1 ? "s" : ""} expiring within 30 days`, count: expiring.length, tone: "warning", target: { kind: "queue", path: "/portal/documents", tab: "Expiring" } });
  const ncs = s.nonConformities.filter((n) => n.status === "Open");
  if (ncs.length) items.push({ id: "nc", label: `${ncs.length} compliance restriction${ncs.length > 1 ? "s" : ""} to resolve`, count: ncs.length, tone: "danger", target: { kind: "queue", path: "/portal/compliance" } });
  const inv = s.invoices.filter((i) => i.status === "Not Invoiced");
  if (inv.length) items.push({ id: "inv", label: `${inv.length} completed deliver${inv.length > 1 ? "ies" : "y"} ready to invoice`, count: inv.length, tone: "primary", target: { kind: "queue", path: "/portal/payments", tab: "Not Invoiced" } });
  return items;
}

/* ---------------------------------------------------------------- cross-sector simulator */

export type SimEvent = { id: string; label: string; sector: string; available: (s: OpsState, t?: Transaction) => string | null };

export const simEvents: SimEvent[] = [
  { id: "rfq", label: "Marketplace RFQ accepted", sector: "Marketplace", available: () => null },
  { id: "aggregate", label: "Miner aggregation completed", sector: "Mining", available: (_s, t) => (t?.stage === "RFQ Accepted" ? null : "Needs an accepted RFQ") },
  { id: "sample", label: "Quality requests sample pickup", sector: "Quality", available: (_s, t) => (t?.stage === "Aggregation Complete" ? null : "Needs completed aggregation") },
  { id: "labReceive", label: "Lab receives sample", sector: "Quality", available: (s, t) => (s.movements.some((m) => m.txnId === t?.id && m.kind === "Sample" && m.stage === "At Destination") ? null : "Needs sample at laboratory") },
  { id: "result", label: "Quality publishes result", sector: "Quality", available: (_s, t) => (t?.stage === "Quality Testing" ? null : "Needs lab-received sample") },
  { id: "buyerAccept", label: "Buyer accepts quality", sector: "Marketplace", available: (_s, t) => (t?.stage === "Result Published" ? null : "Needs published result") },
  { id: "bulk", label: "Bulk logistics requested", sector: "Mining", available: (s, t) => (t?.stage === "Buyer Accepted" && !s.requests.some((r) => r.txnId === t.id && r.kind === "Bulk" && r.originId === t.mineId) ? null : "Needs buyer acceptance") },
  { id: "whReceive", label: "Warehouse receives material", sector: "Warehousing", available: (s, t) => (s.movements.some((m) => m.txnId === t?.id && site(s, m.destinationId)?.kind === "Warehouse" && m.stage === "At Destination") ? null : "Needs truck at warehouse") },
  { id: "prcReceive", label: "Processor receives material", sector: "Processing", available: (s, t) => (s.movements.some((m) => m.txnId === t?.id && site(s, m.destinationId)?.kind === "Processor" && m.stage === "At Destination") ? null : "Needs truck at processor") },
  { id: "processed", label: "Processing completed", sector: "Processing", available: (_s, t) => (t?.stage === "At Processor" ? null : "Needs material at processor") },
  { id: "export", label: "Export requests movement", sector: "Export", available: (_s, t) => (t?.stage === "Processing Complete" || t?.stage === "At Warehouse" ? null : "Needs processed or stored material") },
  { id: "buyerReceive", label: "Buyer receives shipment", sector: "Marketplace", available: (_s, t) => (t?.stage === "At Port" ? null : "Needs cargo delivered to port") },
];

const rfqTemplates = [
  { buyerId: "BUY-201", minerId: "MIN-101", mineId: "MINE-JOS-01", mineral: "Tin (cassiterite)", qty: 25, price: 14_700_000, grade: "Sn ≥ 65%", dest: "PRC-KAD", port: "PORT-APP" },
  { buyerId: "BUY-202", minerId: "MIN-102", mineId: "MINE-NAS-02", mineral: "Lithium (spodumene)", qty: 45, price: 1_120_000, grade: "Li2O ≥ 5.5%", dest: "PRC-ABJ", port: "PORT-ONN" },
  { buyerId: "BUY-203", minerId: "MIN-103", mineId: "MINE-KAD-03", mineral: "Columbite", qty: 15, price: 9_300_000, grade: "Nb2O5 ≥ 30%", dest: "WH-JOS", port: "PORT-APP" },
];

function newRequest(s: OpsState, t: Transaction, kind: MovementKind, movementType: string, source: string, requestedBy: string, originId: string, destinationId: string, quantity: number, unit: string) {
  const id = nextId(s, "TR");
  s.requests.unshift({
    id, txnId: t.id, kind, movementType, source, requestedBy, originId, destinationId, quantity, unit, pickupBy: iso(kind === "Sample" ? 6 * 60 : 24 * 60), deliverBy: iso(kind === "Sample" ? 30 * 60 : 60 * 60),
    handling: kind === "Sample" ? "Sealed sample bags, chain of custody" : "Bulk bags, sealed and tarpaulin covered", paymentTerms: kind === "Sample" ? "Flat fee on lab receipt" : "Net 14 on POD", status: "New", createdAt: nowIso(),
  });
  chain(s, t.id, (source.split(" ")[0] ?? source), `${movementType} request ${id} sent to Logistics`, id);
  notify(s, "Request", `New transport request ${id}`, `${movementType} · ${siteName(s, originId)} → ${siteName(s, destinationId)}`, { kind: "request", id });
  log(s, (source.split(" ")[0] ?? source), `Transport request ${id} received: ${movementType}`, { kind: "request", id });
  return id;
}

export function runSim(eventId: string, txnId?: string): string | null {
  const s0 = load();
  const t0 = txnOf(s0, txnId);
  const ev = simEvents.find((e) => e.id === eventId);
  if (!ev) return "Unknown event";
  const block = ev.available(s0, t0);
  if (block) return block;
  let result: string | null = null;
  if (eventId === "labReceive") {
    const m = s0.movements.find((x) => x.txnId === t0?.id && x.kind === "Sample" && x.stage === "At Destination")!;
    return runAction(m.id, "labReceipt");
  }
  if (eventId === "whReceive" || eventId === "prcReceive") {
    const kind = eventId === "whReceive" ? "Warehouse" : "Processor";
    const m = s0.movements.find((x) => x.txnId === t0?.id && site(s0, x.destinationId)?.kind === kind && x.stage === "At Destination")!;
    runAction(m.id, "weigh", +((m.loaded ?? m.quantity) - 0.1).toFixed(1));
    return runAction(m.id, "deliver");
  }
  mutate((s) => {
    const t = txnOf(s, txnId);
    switch (eventId) {
      case "rfq": {
        const tpl = rfqTemplates[s.seq % rfqTemplates.length]!;
        const n = s.seq + 1190;
        const rfq: RFQ = { id: `RFQ-${n}`, buyerId: tpl.buyerId, mineral: tpl.mineral, quantity: tpl.qty, grade: tpl.grade, createdAt: nowIso(), status: "Accepted" };
        s.rfqs.unshift(rfq);
        const tid = `TXN-${n + 860}`;
        s.transactions.unshift({
          id: tid, rfqId: rfq.id, buyerId: tpl.buyerId, minerId: tpl.minerId, mineId: tpl.mineId, batchId: `BATCH-${tpl.mineral.slice(0, 2).toUpperCase()}-${n}`, commitmentId: `SC-${n + 6600}`,
          mineral: tpl.mineral, quantity: tpl.qty, unitPrice: tpl.price, destinationId: tpl.dest, portId: tpl.port, stage: "RFQ Accepted", qualityRequired: true, quality: "Not sampled",
          timeline: [{ at: nowIso(), sector: "Marketplace", event: `RFQ ${rfq.id} accepted by ${partyName(s, tpl.minerId)}` }],
        });
        s.seq++;
        log(s, "Marketplace", `RFQ ${rfq.id} accepted: ${tid} opened`, { kind: "transaction", id: tid });
        result = tid;
        break;
      }
      case "aggregate":
        t!.stage = "Aggregation Complete";
        chain(s, t!.id, "Mining", `Aggregation completed: ${t!.batchId}, ${t!.quantity} t`);
        log(s, "Mining", `${partyName(s, t!.minerId)} completed aggregation of ${t!.batchId}`, { kind: "transaction", id: t!.id });
        break;
      case "sample": {
        t!.stage = "Sampling";
        t!.quality = "Sample requested";
        const lab = t!.mineId === "MINE-NIG-04" || t!.mineId === "MINE-NAS-02" ? "LAB-KAD" : "LAB-ABJ";
        newRequest(s, t!, "Sample", "Sample Pickup", "Quality", "Beldium Quality & Control", t!.mineId, lab, 12, "kg");
        break;
      }
      case "result": {
        t!.stage = "Result Published";
        t!.quality = "Result published";
        t!.qualityResult = t!.mineral.startsWith("Lithium") ? "Li2O 5.8%" : t!.mineral.startsWith("Tin") ? "Sn 67.5%" : "Nb2O5 31.1%";
        chain(s, t!.id, "Quality", `Result published: ${t!.qualityResult}`);
        log(s, "Quality", `Quality result published for ${t!.batchId}`, { kind: "transaction", id: t!.id });
        break;
      }
      case "buyerAccept":
        t!.stage = "Buyer Accepted";
        t!.quality = "Buyer accepted";
        chain(s, t!.id, "Marketplace", `${partyName(s, t!.buyerId)} accepted quality result`);
        log(s, "Marketplace", `Buyer accepted quality for ${t!.batchId}`, { kind: "transaction", id: t!.id });
        break;
      case "bulk": {
        t!.stage = "Bulk Movement";
        const dk = site(s, t!.destinationId)?.kind;
        newRequest(s, t!, "Bulk", dk === "Processor" ? "Mine to Processor" : "Mine to Warehouse", "Buyer transaction", partyName(s, t!.minerId), t!.mineId, t!.destinationId, t!.quantity, "t");
        break;
      }
      case "processed":
        t!.stage = "Processing Complete";
        chain(s, t!.id, "Processing", `Processing completed at ${siteName(s, t!.destinationId)}: output batch ${t!.batchId}-P`);
        log(s, "Processing", `Processing completed for ${t!.batchId}`, { kind: "transaction", id: t!.id });
        break;
      case "export": {
        t!.stage = "Export Movement";
        const origin = t!.destinationId;
        const outQty = Math.round(t!.quantity * (site(s, origin)?.kind === "Processor" ? 0.9 : 1));
        newRequest(s, t!, "Bulk", site(s, origin)?.kind === "Processor" ? "Processor to Export" : "Warehouse to Export", "Export port movement", "Beldium Export Services", origin, t!.portId, outQty, "t");
        break;
      }
      case "buyerReceive":
        t!.stage = "Logistics Completed";
        chain(s, t!.id, "Export", `Export clearance granted and shipment departed ${siteName(s, t!.portId)}`);
        chain(s, t!.id, "Marketplace", `${partyName(s, t!.buyerId)} confirmed receipt of shipment: logistics lifecycle completed`);
        notify(s, "Delivery", `Buyer received shipment: ${t!.id}`, partyName(s, t!.buyerId), { kind: "transaction", id: t!.id });
        log(s, "Marketplace", `${partyName(s, t!.buyerId)} received shipment for ${t!.id}`, { kind: "transaction", id: t!.id });
        break;
    }
  });
  return result;
}
