// Beldium serves several dashboards from one deployment. Quality & Control also
// answers on its own subdomain (qac.beldium.com): same app, same server, so
// attaching the domain in Vercel is all the hosting it needs.
//
// These checks read `window.location`, so they only mean something in the
// browser. Callers run them from effects and loaders that are client-only
// (routes marked `ssr: false`, `useEffect`).

export const QAC_HOST = "qac.beldium.com";

function hostname(): string | null {
  return typeof window === "undefined" ? null : window.location.hostname;
}

/** True on qac.beldium.com (and any `qac.` staging host). */
export function isQacHost(): boolean {
  return hostname()?.startsWith("qac.") ?? false;
}

/**
 * True on a deployed Beldium host other than the Quality & Control one. False on
 * localhost and preview URLs, so local work and previews never bounce away.
 */
export function isOtherBeldiumHost(): boolean {
  const host = hostname();
  if (!host || host.startsWith("qac.")) return false;
  return host === "beldium.com" || host.endsWith(".beldium.com");
}
