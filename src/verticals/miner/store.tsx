import { createContext, useCallback, useContext, useMemo, type ReactNode } from "react";

import { ApiError } from "@/lib/api/errors";
import {
  useAddActionEvidence,
  useAnswerInfoRequest,
  useCreateApplication,
  useCreateInventoryItem,
  useCreateProductionRecord,
  useInventoryItems,
  useMinerApplications,
  useMinerCapabilities,
  useMinerDashboard,
  useMinerDocuments,
  useMinerEquipment,
  useMinerInfoRequests,
  useMinerNonConformities,
  useMinerOrganisationProfiles,
  useMineSites,
  useOrgMembers,
  useProductionRecords,
  useRaiseNonConformity,
  useSubmitApplication,
  useUploadMinerDocument,
} from "@/lib/api/miner-queries";
import { useCurrentUser, useOrganisationDirectory } from "@/lib/api/queries";
import {
  toApplication,
  toDocumentRecord,
  toEquipment,
  toInfoRequest,
  toInventoryItem,
  toMineSite,
  toNonConformity,
  toOrgMember,
  toProductionRecord,
} from "./mappers";
import type {
  Application,
  DocumentRecord,
  Equipment,
  InfoRequest,
  InventoryItem,
  MineSite,
  NonConformity,
  Notification,
  OrgMember,
  ProductionRecord,
} from "./types";

interface Ctx {
  user: { name: string; initials: string; title: string } | null;
  orgName: string;
  hydrated: boolean;
  isLoading: boolean;
  error: ApiError | null;

  sites: MineSite[];
  primarySite: MineSite | null;
  equipment: Equipment[];
  production: ProductionRecord[];
  inventory: InventoryItem[];
  applications: Application[];
  nonConformities: NonConformity[];
  infoRequests: InfoRequest[];
  documents: DocumentRecord[];
  orgMembers: OrgMember[];
  notifications: Notification[];

  logout: () => void;
  markNotificationsRead: () => void;
  submitApplication: (id: string) => Promise<void>;
  createApplication: (input: { organisation: string; type: string; mineral: string; site?: string }) => Promise<void>;
  answerInfoRequest: (id: string, message: string) => Promise<void>;
  addActionEvidence: (id: string, message: string, file?: File | null) => Promise<void>;
  updateAction: (id: string, message: string, file?: File | null) => Promise<void>;
  raiseNonConformity: (input: {
    site: string;
    title: string;
    category?: string;
    severity: "minor" | "major" | "critical";
    required_action?: string;
    responsible_person?: string;
    deadline: string;
  }) => Promise<void>;
  uploadDocument: (input: { site: string; name: string; category?: string; file: File }) => Promise<void>;
  createProductionRecord: (input: {
    site: string;
    period_start: string;
    period_end: string;
    commodity: string;
    tonnage: number;
    grade?: number;
    notes?: string;
  }) => Promise<void>;
  createInventoryItem: (input: {
    site: string;
    category: string;
    name: string;
    quantity: number;
    unit: string;
    threshold?: number;
  }) => Promise<void>;
}

const StoreContext = createContext<Ctx | null>(null);

const EMPTY_LIST = { results: [] };

function initialsOf(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "??";
  return (parts[0]![0]! + (parts[1]?.[0] ?? "")).toUpperCase();
}

export function MinerStoreProvider({
  children,
  onSignOut,
}: {
  children: ReactNode;
  onSignOut: () => void;
}) {
  const currentUser = useCurrentUser();
  const capabilities = useMinerCapabilities();
  const dashboard = useMinerDashboard();
  const sitesQuery = useMineSites();
  const equipmentQuery = useMinerEquipment();
  const applicationsQuery = useMinerApplications();
  const nonConformitiesQuery = useMinerNonConformities();
  const infoRequestsQuery = useMinerInfoRequests();
  const documentsQuery = useMinerDocuments();
  const orgProfilesQuery = useMinerOrganisationProfiles();
  const orgDirectory = useOrganisationDirectory();

  const sites = useMemo(() => (sitesQuery.data ?? EMPTY_LIST).results.map(toMineSite), [sitesQuery.data]);
  const primarySite = sites[0] ?? null;

  const productionQuery = useProductionRecords(primarySite?.id);
  const inventoryQuery = useInventoryItems(primarySite?.id);
  const orgId = primarySite?.orgId || orgDirectory.data?.results[0]?.id || null;
  const membersQuery = useOrgMembers(orgId);

  const equipment = useMemo(() => (equipmentQuery.data ?? EMPTY_LIST).results.map(toEquipment), [equipmentQuery.data]);
  const applications = useMemo(
    () => (applicationsQuery.data ?? EMPTY_LIST).results.map(toApplication),
    [applicationsQuery.data],
  );
  const nonConformities = useMemo(
    () => (nonConformitiesQuery.data ?? EMPTY_LIST).results.map(toNonConformity),
    [nonConformitiesQuery.data],
  );
  const infoRequests = useMemo(
    () => (infoRequestsQuery.data ?? EMPTY_LIST).results.map(toInfoRequest),
    [infoRequestsQuery.data],
  );
  const documents = useMemo(
    () => (documentsQuery.data ?? EMPTY_LIST).results.map(toDocumentRecord),
    [documentsQuery.data],
  );
  const production = useMemo(
    () => (productionQuery.data ?? EMPTY_LIST).results.map(toProductionRecord),
    [productionQuery.data],
  );
  const inventory = useMemo(
    () => (inventoryQuery.data ?? EMPTY_LIST).results.map(toInventoryItem),
    [inventoryQuery.data],
  );
  const orgMembers = useMemo(() => (membersQuery.data ?? []).map(toOrgMember), [membersQuery.data]);

  void orgProfilesQuery;

  const notifications: Notification[] = useMemo(
    () =>
      (dashboard.data?.notifications ?? []).map((raw, i) => {
        const n = raw as Record<string, unknown>;
        return {
          id: String(n["id"] ?? i),
          at: String(n["at"] ?? ""),
          title: String(n["title"] ?? ""),
          body: String(n["body"] ?? ""),
          tone: (["neutral", "positive", "warning", "negative"] as const).includes(n["tone"] as never)
            ? (n["tone"] as Notification["tone"])
            : "neutral",
          read: Boolean(n["read"]),
        };
      }),
    [dashboard.data],
  );

  const user = useMemo(() => {
    const account = currentUser.data;
    if (!account) return null;
    const name = [account.first_name, account.last_name].filter(Boolean).join(" ") || account.email;
    return { name, initials: initialsOf(name), title: "Miner / Producer" };
  }, [currentUser.data]);

  const orgName = orgDirectory.data?.results.find((o) => o.id === orgId)?.name ?? "Miner workspace";

  const queries = [
    currentUser,
    capabilities,
    dashboard,
    sitesQuery,
    equipmentQuery,
    applicationsQuery,
    nonConformitiesQuery,
    infoRequestsQuery,
    documentsQuery,
    orgDirectory,
    productionQuery,
    inventoryQuery,
  ];
  const isLoading = queries.some((q) => q.isPending);
  const firstError = queries.map((q) => q.error).find(Boolean) ?? null;

  const createApplicationFor = useCreateApplication();
  const submitApplicationFor = useSubmitApplication();
  const answerInfoRequestFor = useAnswerInfoRequest();
  const addEvidenceFor = useAddActionEvidence();
  const raiseNonConformityFor = useRaiseNonConformity();
  const uploadDocumentFor = useUploadMinerDocument();
  const createProductionFor = useCreateProductionRecord();
  const createInventoryFor = useCreateInventoryItem();

  const markNotificationsRead = useCallback(() => {}, []);

  const submitApplication = useCallback<Ctx["submitApplication"]>(
    async (id) => {
      await submitApplicationFor.mutateAsync(id);
    },
    [submitApplicationFor],
  );

  const createApplication = useCallback<Ctx["createApplication"]>(
    async (input) => {
      await createApplicationFor.mutateAsync(input);
    },
    [createApplicationFor],
  );

  const answerInfoRequest = useCallback<Ctx["answerInfoRequest"]>(
    async (id, message) => {
      await answerInfoRequestFor.mutateAsync({ id, message });
    },
    [answerInfoRequestFor],
  );

  const addActionEvidence = useCallback<Ctx["addActionEvidence"]>(
    async (id, message, file) => {
      await addEvidenceFor.mutateAsync({ id, message, file });
    },
    [addEvidenceFor],
  );

  const raiseNonConformity = useCallback<Ctx["raiseNonConformity"]>(
    async (input) => {
      await raiseNonConformityFor.mutateAsync(input);
    },
    [raiseNonConformityFor],
  );

  const uploadDocument = useCallback<Ctx["uploadDocument"]>(
    async (input) => {
      await uploadDocumentFor.mutateAsync(input);
    },
    [uploadDocumentFor],
  );

  const createProductionRecordFn = useCallback<Ctx["createProductionRecord"]>(
    async (input) => {
      await createProductionFor.mutateAsync(input);
    },
    [createProductionFor],
  );

  const createInventoryItemFn = useCallback<Ctx["createInventoryItem"]>(
    async (input) => {
      await createInventoryFor.mutateAsync(input);
    },
    [createInventoryFor],
  );

  const value: Ctx = {
    user,
    orgName,
    hydrated: !isLoading,
    isLoading,
    error: firstError instanceof ApiError ? firstError : null,

    sites,
    primarySite,
    equipment,
    production,
    inventory,
    applications,
    nonConformities,
    infoRequests,
    documents,
    orgMembers,
    notifications,

    logout: onSignOut,
    markNotificationsRead,
    submitApplication,
    createApplication,
    answerInfoRequest,
    addActionEvidence,
    updateAction: addActionEvidence,
    raiseNonConformity,
    uploadDocument,
    createProductionRecord: createProductionRecordFn,
    createInventoryItem: createInventoryItemFn,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useMiner() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useMiner must be used inside MinerStoreProvider");
  return ctx;
}
