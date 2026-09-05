import type { VerticalSlug } from "../verticals";

export type OnboardingRole =
  | "compliance-org"
  | "compliance-officer"
  | "regulator-org"
  | "regulator-officer"
  | "independent";

export type OrgPath = "new" | "existing";

export type VerificationState =
  | "Draft"
  | "Under Review"
  | "Information Required"
  | "Conditionally Verified"
  | "Verified"
  | "Rejected";

export interface OnboardingDocument {
  id: string;
  category: string;
  name: string;
  reference: string;
  issued: string;
  expiry: string;
  status: "Uploaded" | "Verified" | "Rejected" | "Pending";
}

export interface Personnel {
  id: string;
  name: string;
  position: string;
  email: string;
  phone: string;
  certification: string;
  qualification: string;
  registration: string;
  yearsExperience: string;
  cvAttached: boolean;
  certificatesAttached: boolean;
  isSignatory: boolean;
  department?: string;
  staffId?: string;
  authorisationLevel?: string;
  appointmentDocAttached?: boolean;
}

export interface RegulatorApplication {
  ref: string;
  legalName: string;
  institutionType: string;
  established: string;
  headOffice: string;
  country: string;
  state: string;
  officialEmail: string;
  officialPhone: string;
  website: string;
  primaryRepresentative: string;
  mandate: string;
  ministry: string;
  responsibilities: string[];
  oversightFunctions: string[];
  jurisdiction: string[];
  mineralsCovered: string[];
  canInspect: boolean;
  canReviewLicences: boolean;
  canIssueDecisions: boolean;
  oversightCapabilities: string[];
}



export interface InspectionCapability {
  offersInspection: boolean;
  accreditation: string;
  accreditationNumber: string;
  disciplines: string[];
  regionsCovered: string[];
  inspectorCount: string;
  equipment: string;
  professionalCount: string;
  engineerCount: string;
  geologistCount: string;
  environmentalCount: string;
  hseCount: string;
  fieldInspection: boolean;
  gpsEvidence: boolean;
  photoVideoEvidence: boolean;
  digitalReports: boolean;
  samplingCapability: boolean;
  maxMonthlyReviews: string;
  maxMonthlySiteInspections: string;
  averageTurnaround: string;
}

export interface ProfessionalApplication {
  ref: string;
  fullName: string;
  phone: string;
  email: string;
  address: string;
  state: string;
  country: string;
  idType: string;
  idNumber: string;
  jobTitle: string;
  profession: string;
  employmentStatus: string;
  yearsMining: string;
  yearsCompliance: string;
  summary: string;
  highestQualification: string;
  institution: string;
  fieldOfStudy: string;
  certifications: string;
  memberships: string;
  registrationNumber: string;
  issueDate: string;
  expiryDate: string;
  reviewCapabilities: string[];
  lithiumYears: string;
  lithiumReviewExperience: string;
  lithiumInspectionExperience: string;
  lithiumProjects: string;
  statesCovered: string[];
  availableForInspection: boolean;
  mobilisationTime: string;
  canCaptureGps: boolean;
  canCapturePhotos: boolean;
  canCaptureVideo: boolean;
  canVerifyCoordinates: boolean;
  canReviewSiteDocuments: boolean;
  samplingExperience: boolean;
  canSubmitDigitalReports: boolean;
  independence: Record<string, boolean | null>;
  independenceDisclosure: string;
  declarations: Record<string, boolean>;
}


export interface ConflictDeclaration {
  hasConflict: boolean | null;
  relationship: string;
  affectedParties: string;
  mitigation: string;
  declaredBy: string;
  declaredAt?: string;
  attested: boolean;
}

export interface OrgApplication {
  ref: string;
  legalName: string;
  tradingName: string;
  rcNumber: string;
  tin: string;
  entityType: string;
  incorporated: string;
  hqAddress: string;
  operatingAddress: string;
  officialEmail: string;
  officialPhone: string;
  primaryContact: string;
  yearsInOperation: string;
  state: string;
  lga: string;
  website: string;
  primaryMineral: string;
  services: string[];
  otherService: string;
  coverage: string;
  statesCovered: string[];
  mineralsExperience: string[];
  siteInspectionAvailable: boolean;
  mobilisationTime: string;
  monthlyInspectionCapacity: string;
  licenceNumber: string;
  licenceType: string;
  licenceExpiry: string;
  siteName: string;
  siteState: string;
  siteLga: string;
  siteCoordinates: string;
  siteAreaHa: string;
  workforce: string;
  annualCapacity: string;
}


export interface JoinRequest {
  id: string;
  organisationName: string;
  requesterName: string;
  requesterEmail: string;
  role: string;
  justification: string;
  submittedAt: string;
  status: "Pending" | "Approved" | "Declined";
  decisionNote?: string;
}

export interface OnboardingAccount {
  fullName: string;
  jobTitle: string;
  email: string;
  phone: string;
  password: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  acceptedTerms: boolean;
}

export interface OnboardingTimelineEntry {
  id: string;
  at: string;
  actor: string;
  title: string;
  detail: string;
  tone: "neutral" | "positive" | "warning" | "negative";
}

export interface ReviewFinding {
  id: string;
  area: string;
  requirement: string;
  status: "Outstanding" | "Resolved";
  raisedAt: string;
}

export interface OnboardingState {
  /** Which of the seven compliance sectors this application is for. */
  sector: VerticalSlug | null;
  role: OnboardingRole | null;
  orgPath: OrgPath | null;
  account: OnboardingAccount;
  application: OrgApplication;
  professional: ProfessionalApplication;
  regulator: RegulatorApplication;

  documents: OnboardingDocument[];
  personnel: Personnel[];
  capability: InspectionCapability;
  conflict: ConflictDeclaration;
  declarations: Record<string, boolean>;
  joinRequests: JoinRequest[];
  verification: VerificationState;
  conditions: string[];
  findings: ReviewFinding[];
  timeline: OnboardingTimelineEntry[];
  submittedAt: string | null;
  welcomeSeen: boolean;
  partnerId: string | null;
  approvedCapabilities: string[];
  infoRequests: InfoRequest[];
  messages: ReviewMessage[];
}

export interface InfoRequest {
  id: string;
  subject: string;
  detail: string;
  raisedAt: string;
  status: "Open" | "Responded";
  response?: string;
}

export interface ReviewMessage {
  id: string;
  from: string;
  body: string;
  at: string;
}

