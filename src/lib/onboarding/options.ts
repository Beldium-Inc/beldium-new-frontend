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
import { isQcHost, isWarehouseHost } from "../hosts";

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
// Production builds without the variable fall back to the live Miner Hub, never
// to a localhost address that only works on a developer's machine.
export const MINER_PORTAL_URL =
  env["VITE_MINER_PORTAL_URL"] ??
  (import.meta.env.DEV ? "http://localhost:5174" : "https://miners.beldium.com");
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

export const FALLBACK: Record<VerticalSlug, OnboardingDashboard[]> = {
  // The compliance app's onboarding is for compliance partners and regulators.
  // Each sector's own companies (miners, hauliers, processors, exporters,
  // buyers) do not sign up here, so only the partner side is offered.
  mining: [partnerSide("Mining")],
  processing: [partnerSide("Processing")],
  warehousing: [partnerSide("Warehousing")],
  export: [partnerSide("Export")],
  marketplace: [partnerSide("Marketplace")],
  logistics: [partnerSide("Logistics")],
  // Governance is joined by invitation or an access request on its own
  // pages, never through sector onboarding.
  governance: [],
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
  if (server && server.length) return { dashboards: forThisSite(server, sector), fromServer: true };
  return {
    dashboards: forThisSite(sector ? FALLBACK[sector] : [], sector),
    fromServer: false,
  };
}

const REGULATOR_ROLES: OnboardingRole[] = ["regulator-org", "regulator-officer"];

/**
 * What warehouse.beldium.com offers: the warehouse operators themselves. They
 * register their company and facilities (the participant application, BE-O3)
 * or join a company already on Beldium. Compliance firms and regulators who
 * review warehouses sign up on the compliance site.
 */
export const WAREHOUSE_OPERATOR_SIDE: OnboardingDashboard = {
  key: "applicant",
  label: "Warehouse operator",
  description: "Operators of mineral warehouses, depots and bonded stores.",
  options: [
    {
      key: "register",
      kind: "register",
      label: "Register a warehouse operator",
      description:
        "Your company is not on Beldium yet. Register it and its warehouses, then complete the accreditation application. You become its administrator.",
      role: "participant",
      org_path: "new",
      note: "Company · you become the admin",
    },
    {
      key: "join",
      kind: "join",
      label: "Join your company's warehouse team",
      description:
        "Your company is already on Beldium. Use the join code from your administrator, or the link in your invitation email.",
      role: "participant-member",
      org_path: "existing",
      note: "Staff until your admin changes your role",
    },
  ],
};

/**
 * Regulators sit above Quality & Control. Labs and Q&C staff sign up on
 * qualitycontrol.beldium.com, which offers no regulator options; regulators
 * sign up on the compliance site, where the Quality & Control oversight entry
 * offers only the two regulator options (agency access, join your agency).
 */
function forThisSite(
  dashboards: OnboardingDashboard[],
  sector: VerticalSlug | null,
): OnboardingDashboard[] {
  if (isWarehouseHost()) return sector === "warehousing" ? [WAREHOUSE_OPERATOR_SIDE] : [];
  if (isQcHost()) {
    return dashboards.map((d) => ({
      ...d,
      options: d.options.filter((o) => !REGULATOR_ROLES.includes(o.role)),
    }));
  }
  if (sector !== "quality") return dashboards;
  const options = dashboards
    .flatMap((d) => d.options)
    .filter((o) => REGULATOR_ROLES.includes(o.role));
  return [
    {
      key: "partner",
      label: "Quality & Control oversight",
      description: "Government regulators and oversight agencies with read-only access to Q&C.",
      options: options.length ? options : [REGULATORY, REGULATOR_OFFICER],
    },
  ];
}
