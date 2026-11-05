// Client for the Beldium API's logistics desk endpoint. The server decides whether a
// caller holds the compliance-desk audience (staff, or a verified compliance-partner
// membership), so the prototype asks rather than trusting seed data.
//
// Not configured by default: with no VITE_BELDIUM_API_URL the prototype stays a
// self-contained demo and nothing is sent anywhere.

export type DeskAudience = "operator" | "regulator" | "member" | null;

const API_BASE = import.meta.env["VITE_BELDIUM_API_URL"]?.replace(/\/$/, "");

export const beldiumApiConfigured = Boolean(API_BASE);

/** Returns the caller's logistics audience, or null when no API is configured or access is refused. */
export async function fetchDeskAudience(accessToken: string): Promise<DeskAudience> {
  if (!API_BASE) return null;
  const response = await fetch(`${API_BASE}/api/v1/logistics/desk/`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) return null;
  const body = (await response.json()) as { audience: DeskAudience };
  return body.audience ?? null;
}

/** Only the desk audience may review partners. A plain company member is not the desk. */
export function isDeskOperator(audience: DeskAudience): boolean {
  return audience === "operator";
}
