// Where "Get help" points (OR-013). The support tool is not chosen yet, so
// this one value is the only thing to change later: set VITE_SUPPORT_URL in the
// Vercel project (an https:// help desk page or a mailto: address) and redeploy.
// Until it is set, the link opens an email to the placeholder address below.
export const SUPPORT_URL_PLACEHOLDER =
  "mailto:support@beldium.com?subject=Beldium%20help%20request";

export function supportUrl(): string {
  const configured = import.meta.env["VITE_SUPPORT_URL"] as string | undefined;
  const value = configured?.trim();
  // Only web and email links: anything else (a typo, a javascript: URL) falls back.
  if (value && /^(https?:|mailto:)/i.test(value)) return value;
  return SUPPORT_URL_PLACEHOLDER;
}
