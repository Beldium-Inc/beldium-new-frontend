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
export const COMPLIANCE_HOST = "compliance.beldium.com";
// Warehouse operators run their facilities on their own front-facing site.
// The compliance partners and regulators who review them stay on compliance.
export const WAREHOUSE_HOST = "warehouse.beldium.com";

const QC_PREFIXES = ["qualitycontrol.", "qac."];
const WAREHOUSE_PREFIXES = ["warehouse.", "warehousing."];

function hostname(): string | null {
  return typeof window === "undefined" ? null : window.location.hostname;
}

/** True when the given hostname is the Quality & Control site. */
export function isQcHostname(host: string): boolean {
  return QC_PREFIXES.some((p) => host.startsWith(p));
}

/** True on qualitycontrol.beldium.com, qac.beldium.com and their staging hosts. */
export function isQcHost(): boolean {
  const host = hostname();
  return host !== null && isQcHostname(host);
}

/** True when the given hostname is the warehouse operators' site. */
export function isWarehouseHostname(host: string): boolean {
  return WAREHOUSE_PREFIXES.some((p) => host.startsWith(p));
}

/** True on warehouse.beldium.com, warehouse.localhost and their staging hosts. */
export function isWarehouseHost(): boolean {
  const host = hostname();
  return host !== null && isWarehouseHostname(host);
}

/**
 * True on a deployed Beldium host other than the Quality & Control and
 * warehouse operator ones. False on
 * localhost and preview URLs, so local work and previews never bounce away.
 */
export function isOtherBeldiumHost(): boolean {
  const host = hostname();
  if (!host || isQcHost() || isWarehouseHost()) return false;
  return host === "beldium.com" || host.endsWith(".beldium.com");
}

/**
 * True on the compliance site: a deployed Beldium host other than Q&C, or
 * plain localhost in development. False on preview URLs, so they never bounce.
 */
export function isComplianceHost(): boolean {
  const host = hostname();
  return isOtherBeldiumHost() || host === "localhost" || host === "127.0.0.1";
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

/**
 * Full URL of a path on the compliance site, where regulators above Quality &
 * Control sign in. Locally that is plain localhost on the same port.
 */
export function complianceUrl(path: string): string {
  const configured = import.meta.env["VITE_COMPLIANCE_SITE_URL"] as string | undefined;
  if (configured) return `${configured.replace(/\/$/, "")}${path}`;
  if (typeof window !== "undefined") {
    const { protocol, hostname, port } = window.location;
    if (hostname.endsWith(".localhost")) {
      return `${protocol}//localhost${port ? `:${port}` : ""}${path}`;
    }
  }
  return `https://${COMPLIANCE_HOST}${path}`;
}

/**
 * Full URL of a path on the warehouse operators' site. Locally that is
 * warehouse.localhost on the same port.
 */
export function warehouseUrl(path: string): string {
  const configured = import.meta.env["VITE_WAREHOUSE_SITE_URL"] as string | undefined;
  if (configured) return `${configured.replace(/\/$/, "")}${path}`;
  if (typeof window !== "undefined") {
    const { protocol, hostname, port } = window.location;
    if (hostname === "localhost" || hostname === "127.0.0.1" || hostname.endsWith(".localhost")) {
      return `${protocol}//warehouse.localhost${port ? `:${port}` : ""}${path}`;
    }
  }
  return `https://${WAREHOUSE_HOST}${path}`;
}

/** Sends the browser to the warehouse operators' site, keeping the given path. */
export function goToWarehouseHost(path: string): void {
  window.location.replace(warehouseUrl(path));
}

/** Sends the browser to the compliance site, keeping the given path. */
export function goToComplianceHost(path: string): void {
  window.location.replace(complianceUrl(path));
}

/** Sends the browser to the Quality & Control host, keeping the given path. */
export function goToQcHost(path: string): void {
  window.location.replace(qcUrl(path));
}
