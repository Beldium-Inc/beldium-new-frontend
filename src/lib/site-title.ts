import { createIsomorphicFn } from "@tanstack/react-start";
import { getRequestHost } from "@tanstack/react-start/server";

import { isQcHostname, isWarehouseHostname } from "@/lib/hosts";

// Route `head()` runs on the server for the first page load and in the browser
// after that, so the host has to be read from wherever it is running. Reading
// it on the server is what keeps the first tab title right, before any script.
const currentHostname = createIsomorphicFn()
  .server(() => getRequestHost({ xForwardedHost: true }).split(":")[0] ?? "")
  .client(() => window.location.hostname);

const Q_AND_C = "Beldium Quality & Control";
const WAREHOUSE = "Beldium Warehouse Operators";

/**
 * A page title for the site the person is on. The pages shared by both sites
 * (home, sign-in, onboarding) are titled for the compliance site; on the
 * Quality & Control and warehouse operator sites they carry that site's name.
 */
export function siteTitle(title: string): string {
  const host = currentHostname();
  if (isQcHostname(host)) return title.replace(/Beldium Compliance( Platform)?/, Q_AND_C);
  if (isWarehouseHostname(host)) return title.replace(/Beldium Compliance( Platform)?/, WAREHOUSE);
  return title;
}
