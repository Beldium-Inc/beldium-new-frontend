// What someone can choose on the "How will you use Beldium?" screen.
//
// Backend plan, section 1: every sector, on both the applicant side and the
// compliance-partner side, offers three standard options (register a new
// company, join an existing company, regulatory access) plus sector-specific
// items. The list belongs to the server (BE-O1: GET /onboarding/options/
// ?sector=), so a new item is a data change. Until that endpoint exists the
// screen uses FALLBACK below, which is also the shape the endpoint returns.

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../api/client";
import { useHasTokens } from "../api/queries";
import type { VerticalSlug } from "../verticals";
import type { OnboardingRole, OrgPath } from "./types";

export type OptionKind = "register" | "join" | "regulatory" | "specific";
export type DashboardKey = "applicant" | "partner";

export interface OnboardingOption {
  key: string;
  kind: OptionKind;
  label: string;
  description: string;
  /** The onboarding role this option sets, which picks the application flow. */
  role: OnboardingRole;
  /** Register a new company, or join one that is already on Beldium. */
  org_path?: OrgPath;
  /** Some sides register on their own portal (Miner Portal, Logistics Portal). */
  external_url?: string;
  external_label?: string;
  note?: string;
}

export interface OnboardingDashboard {
  key: DashboardKey;
  label: string;
  description: string;
  options: OnboardingOption[];
}

export interface OnboardingOptions {
  sector: VerticalSlug;
  dashboards: OnboardingDashboard[];
}

const env = import.meta.env as Record<string, string | undefined>;
export const MINER_PORTAL_URL = env["VITE_MINER_PORTAL_URL"] ?? "http://localhost:5174";
export const LOGISTICS_PORTAL_URL = env["VITE_LOGISTICS_PORTAL_URL"] ?? "http://localhost:5175";

const REGULATORY: OnboardingOption = {
  key: "regulatory",
  kind: "regulatory",
  label: "Regulatory access",
  description:
    "For a government regulator or oversight agency. Ask for read-only access to one or more sectors. A Beldium operator checks your official email or agency letter and approves it.",
  role: "regulator-org",
  note: "Read only · approved by Beldium",
};

const REGULATOR_OFFICER: OnboardingOption = {
  key: "regulator-officer",
  kind: "specific",
  label: "Join your agency's regulator account",
  description:
    "Your agency already has approved access. Enter the join code your agency administrator shared.",
  role: "regulator-officer",
  org_path: "existing",
  note: "Join code from your agency",
};

/** The compliance-partner side is the same in every sector except Quality & Control. */
function partnerSide(sectorName: string, extra: OnboardingOption[] = []): OnboardingDashboard {
  return {
    key: "partner",
    label: "Compliance partner",
    description: `Firms and professionals that review ${sectorName.toLowerCase()} applicants for Beldium.`,
    options: [
      {
        key: "register",
        kind: "register",
        label: "Register a new compliance firm",
        description:
          "Your firm is not on Beldium yet. You become its administrator and complete its application.",
        role: "compliance-org",
        org_path: "new",
        note: "You become the admin",
      },
      {
        key: "join",
        kind: "join",
        label: "Join an existing compliance firm",
        description:
          "Your firm is already on Beldium. Use the join code from your administrator, or the link in your invitation email.",
        role: "compliance-officer",
        org_path: "existing",
        note: "Staff until your admin changes your role",
      },
      REGULATORY,
      {
        key: "independent",
        kind: "specific",
        label: "Independent compliance professional",
        description: "An individual who takes review assignments without belonging to a firm.",
        role: "independent",
        note: "Individual",
      },
      REGULATOR_OFFICER,
      ...extra,
    ],
  };
}

/** The sector's own companies: the ones the compliance partners review. */
function applicantSide(input: {
  label: string;
  description: string;
  register: Pick<OnboardingOption, "label" | "description"> &
    Partial<Pick<OnboardingOption, "external_url" | "external_label" | "note">>;
  joinLabel: string;
  extra?: OnboardingOption[];
}): OnboardingDashboard {
  return {
    key: "applicant",
    label: input.label,
    description: input.description,
    options: [
      {
        key: "register",
        kind: "register",
        role: "participant",
        org_path: "new",
        note: input.register.note ?? "You become the admin",
        ...input.register,
      },
      {
        key: "join",
        kind: "join",
        label: input.joinLabel,
        description:
          "Your company is already on Beldium. Use the join code from your administrator, or the link in your invitation email.",
        role: "participant-member",
        org_path: "existing",
        note: "Staff until your admin changes your role",
      },
      REGULATORY,
      ...(input.extra ?? []),
    ],
  };
}

export const FALLBACK: Record<VerticalSlug, OnboardingDashboard[]> = {
  mining: [
    applicantSide({
      label: "Mining company",
      description: "Miners and producers registering their organisation, sites and licences.",
      register: {
        label: "Register a mining company",
        description:
          "Mining companies register on the Miner Portal, which takes your sites, licences and production records.",
        external_url: MINER_PORTAL_URL,
        external_label: "Continue on the Miner Portal",
        note: "Opens the Miner Portal",
      },
      joinLabel: "Join an existing mining company",
    }),
    partnerSide("Mining"),
  ],
  processing: [
    applicantSide({
      label: "Processing company",
      description:
        "Processors, concentrators, smelters and refiners applying for compliance verification.",
      register: {
        label: "Register a processing company",
        description:
          "Register your company and plants, then complete the processing compliance application.",
      },
      joinLabel: "Join an existing processing company",
    }),
    partnerSide("Processing"),
  ],
  warehousing: [
    applicantSide({
      label: "Warehouse operator",
      description:
        "Operators of mineral warehouses, depots and bonded stores applying for accreditation.",
      register: {
        label: "Register a warehouse operator",
        description:
          "Register your company and facilities, then complete the warehouse accreditation application.",
      },
      joinLabel: "Join an existing warehouse operator",
    }),
    partnerSide("Warehousing"),
  ],
  export: [
    applicantSide({
      label: "Exporter",
      description: "Licensed mineral exporters submitting consignments for verification.",
      register: {
        label: "Register an exporting company",
        description:
          "Register your company and export authorisations, then complete the exporter admission application.",
      },
      joinLabel: "Join an existing exporter",
    }),
    partnerSide("Export"),
  ],
  marketplace: [
    applicantSide({
      label: "Buyer, offtaker or OEM",
      description:
        "Companies buying verified material, contracting supply or tracing it into manufacturing.",
      register: {
        label: "Register a buying company",
        description:
          "Register as a buyer, offtaker or OEM, then complete the participant verification (KYC).",
      },
      joinLabel: "Join an existing buying company",
    }),
    partnerSide("Marketplace"),
  ],
  logistics: [
    applicantSide({
      label: "Logistics company",
      description:
        "Haulage companies, carriers and fleet owners registering their fleet and drivers.",
      register: {
        label: "Register a logistics company",
        description:
          "Logistics companies register on the Logistics Portal, which takes your fleet, drivers and trips.",
        external_url: LOGISTICS_PORTAL_URL,
        external_label: "Continue on the Logistics Portal",
        note: "Opens the Logistics Portal",
      },
      joinLabel: "Join an existing logistics company",
      extra: [
        {
          key: "driver",
          kind: "specific",
          label: "Driver",
          description:
            "Drivers are added by their company on the Logistics Portal and sign in there.",
          role: "participant-member",
          external_url: LOGISTICS_PORTAL_URL,
          external_label: "Open the Logistics Portal",
          note: "Added by your company",
        },
      ],
    }),
    partnerSide("Logistics"),
  ],
  quality: [
    {
      key: "partner",
      label: "Quality & Control partner",
      description:
        "Laboratories, assay, inspection and conformity assessment organisations and their staff.",
      options: [
        {
          key: "register",
          kind: "register",
          label: "Register a laboratory or Q&C organisation",
          description:
            "Your organisation is not on Beldium yet. You become its administrator and complete the 11-step application.",
          role: "compliance-org",
          org_path: "new",
          note: "Organisation · you become the admin",
        },
        {
          key: "join",
          kind: "join",
          label: "Join an existing Q&C organisation as an officer or inspector",
          description:
            "Individual inspectors and sampling officers working for a registered Q&C organisation.",
          role: "compliance-officer",
          org_path: "existing",
          note: "Individual · 8 application steps",
        },
        REGULATORY,
        {
          key: "analyst",
          kind: "specific",
          label: "Laboratory analyst",
          description: "Bench analysts running accredited methods inside a registered laboratory.",
          role: "laboratory-analyst",
          org_path: "existing",
          note: "Individual",
        },
        {
          key: "independent",
          kind: "specific",
          label: "Independent quality professional",
          description:
            "An individual providing eligible quality and control services independently.",
          role: "independent",
          note: "Individual",
        },
        REGULATOR_OFFICER,
      ],
    },
  ],
};

/**
 * The options for a sector: the server's list when BE-O1 is live, otherwise
 * the fallback. A failed request is not an error for the person signing up.
 */
export function useOnboardingOptions(sector: VerticalSlug | null): {
  dashboards: OnboardingDashboard[];
  fromServer: boolean;
} {
  const hasTokens = useHasTokens();
  void hasTokens;
  const query = useQuery({
    queryKey: ["onboarding", "options", sector],
    queryFn: () =>
      apiFetch<OnboardingOptions>("/onboarding/options/", { query: { sector: sector ?? "" } }),
    enabled: Boolean(sector),
    retry: false,
    staleTime: 5 * 60_000,
  });
  const server = query.data?.dashboards;
  if (server && server.length) return { dashboards: server, fromServer: true };
  return { dashboards: sector ? FALLBACK[sector] : [], fromServer: false };
}
