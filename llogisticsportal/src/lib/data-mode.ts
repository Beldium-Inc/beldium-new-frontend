// Where the portal's data comes from.
//
//   demo  Everything lives in the browser (onboarding-store + ops-store). The
//         default, so the Lovable preview and local dev work with no backend.
//   api   Sign-in, sign-up, verification and the onboarding application go to
//         the Beldium Django API, the same way Miner Hub does.
//
// The backend can't serve this portal yet: accounts/portal.py only maps the
// compliance and miner origins, so register/login from a logistics origin fails
// with `portal_undetermined`. Flip VITE_DATA_MODE=api once it has a logistics
// portal (see src/lib/api/README.md for the full checklist).
//
// Operational screens (requests, movements, fleet, payments…) still read the
// demo ops-store in both modes; they move onto `lib/api/operations-queries`
// one page at a time as those endpoints ship, like Miner Hub's MinerProvider.

export type DataMode = "demo" | "api";

export const DATA_MODE: DataMode = import.meta.env["VITE_DATA_MODE"] === "api" ? "api" : "demo";

export const isDemoMode = DATA_MODE === "demo";
