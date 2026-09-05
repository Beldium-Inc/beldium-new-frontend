import { VERTICAL_BY_SLUG, type VerticalSlug } from "../verticals";
import type { OnboardingRole } from "./types";

/**
 * Maps an approved onboarding account onto the seat it gets inside a sector.
 *
 * Onboarding describes *what kind of entity you are* (a compliance organisation,
 * an officer within one, a regulator body, an independent professional). Each
 * vertical instead defines *seats* in its own registry, and the two taxonomies
 * do not line up one to one, so this is where the translation lives.
 *
 * Every vertical lists its primary seat first (see src/lib/verticals.ts), which
 * is the sensible default for anyone who is not joining as a regulator.
 */
export function seatFor(sector: VerticalSlug, role: OnboardingRole | null): string {
  const vertical = VERTICAL_BY_SLUG[sector];
  const primary = vertical.roles[0]!.id;

  if (role === "regulator-org" || role === "regulator-officer") {
    // Marketplace has no oversight seat, so regulators fall back to the primary.
    return vertical.roles.find((r) => r.id === "regulator")?.id ?? primary;
  }

  return primary;
}
