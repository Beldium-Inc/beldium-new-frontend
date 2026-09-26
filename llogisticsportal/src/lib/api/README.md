# Beldium API layer (Logistics Hub)

`config`, `client`, `errors`, `tokens`, `auth`, `types`, `organisations` and
`queries` are copied from Miner Hub unchanged (apart from the added
`logistics_company` organisation type), so both portals authenticate and
fail the same way. Keep them in sync if Miner Hub's copy changes.

| File | Backend status |
| --- | --- |
| `auth.ts`, `organisations.ts` | Exist. Blocked for this portal by the Origin check below. |
| `logistics.ts`, `logistics-queries.ts` | Exist (`beldium-backend/logistics`). Onboarding, review, vehicles, drivers. |
| `onboarding.ts` | Submits the wizard draft through `logistics.ts`. |
| `operations.ts`, `operations-queries.ts` | **Proposed**. No backend yet; hooks stay disabled in demo mode. |

## Data modes

`VITE_DATA_MODE` (see `src/lib/data-mode.ts`):

- unset / `demo`: everything in the browser. Default; works in Lovable with no backend.
- `api`: auth, verification, the onboarding application and the review screens use the API.
  Set `VITE_API_URL` to the API origin (defaults to `http://localhost:8000`).

## Backend checklist before switching to `api`

1. **Portal origin.** `accounts/portal.py` only maps compliance and miner origins, so
   register/login from this portal fails with `portal_undetermined`. Add a
   `User.Portal.LOGISTICS`, a `LOGISTICS_PORTAL_ORIGINS` setting (e.g.
   `https://logistics.beldium.com`, `http://localhost:5175`) and add the origin to
   `CORS_ALLOWED_ORIGINS`.
2. **Organisation type.** `organisations.models.OrganisationType` has no logistics
   value; `onboarding.ts` creates the organisation with `logistics_company`.
3. **Operations endpoints.** Implement `/logistics/ops/...` per `operations.ts`
   (or change that file to match what gets built).

## Migrating a page off the demo store

Operational pages read `useOps()` from `src/lib/ops-store.ts`. Move one page at a
time onto the hooks here, like Miner Hub did with `MinerProvider`. Vehicles and
drivers can go first: their endpoints already exist in `logistics.ts`.
