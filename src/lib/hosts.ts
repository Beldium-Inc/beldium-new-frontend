// Beldium serves several dashboards from one deployment. Quality & Control is a
// sector of its own, so labs and Q&C operators use it on its own subdomain
// (qualitycontrol.beldium.com): same app, same server, so attaching the domain
// to the deployment is all the hosting it needs. The older qac.beldium.com
// address is treated the same way so existing links keep working.
//
// These checks read `window.location`, so they only mean something in the
// browser. Callers run them from effects, event handlers and client-only
// routes (`ssr: false`).

export const QC_HOST = "qualitycontrol.beldium.com";

const QC_PREFIXES = ["qualitycontrol.", "qac."];

function hostname(): string | null {
  return typeof window === "undefined" ? null : window.location.hostname;
}

/** True on qualitycontrol.beldium.com, qac.beldium.com and their staging hosts. */
export function isQcHost(): boolean {
  const host = hostname();
  return host !== null && QC_PREFIXES.some((p) => host.startsWith(p));
}

/**
 * True on a deployed Beldium host other than the Quality & Control one. False on
 * localhost and preview URLs, so local work and previews never bounce away.
 */
export function isOtherBeldiumHost(): boolean {
  const host = hostname();
  if (!host || isQcHost()) return false;
  return host === "beldium.com" || host.endsWith(".beldium.com");
}

/**
 * Full URL of a path on the Quality & Control host. Locally the Q&C site is
 * qualitycontrol.localhost on the same port, which browsers resolve to this
 * machine, so links between the two sites also work in development.
 */
export function qcUrl(path: string): string {
  const configured = import.meta.env["VITE_QC_SITE_URL"] as string | undefined;
  if (configured) return `${configured.replace(/\/$/, "")}${path}`;
  if (typeof window !== "undefined") {
    const { protocol, hostname, port } = window.location;
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return `${protocol}//qualitycontrol.localhost${port ? `:${port}` : ""}${path}`;
    }
  }
  return `https://${QC_HOST}${path}`;
}

/** Sends the browser to the Quality & Control host, keeping the given path. */
export function goToQcHost(path: string): void {
  window.location.replace(qcUrl(path));
}
