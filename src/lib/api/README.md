# API layer

Everything here talks to the Django backend in `../../../beldium-backend`.

## Layout

| File               | Responsibility                                                                      |
| ------------------ | ----------------------------------------------------------------------------------- |
| `config.ts`        | Resolves the API origin from `VITE_API_URL` and owns the `/api/v1` prefix           |
| `errors.ts`        | `ApiError` — the backend's `{ status, message, error: { code, details } }` envelope |
| `tokens.ts`        | The JWT pair in `localStorage`, mirrored in memory, synced across tabs              |
| `client.ts`        | `apiFetch` — bearer header, one refresh-and-retry on 401, JSON in and out           |
| `types.ts`         | The DRF serialiser shapes, field-for-field                                          |
| `auth.ts`          | register / verify-email / resend / token / me                                       |
| `organisations.ts` | Organisations, members, invitations, join requests                                  |
| `queries.ts`       | TanStack Query keys and hooks over the two modules above                            |

`lib/auth.tsx` sits on top of this and provides `useAuth()` — the signed-in user plus
`signIn`, `signUp`, `confirmEmail`, `resendCode` and `signOut`. It is a different thing from
`lib/session.tsx`, which records which of the seven dashboards you are working in and in what
role.

That stored role is a **view preference, not a permission**. The processing API decides what
a caller may actually do from their organisation memberships, and returns it from
`/processing/me/`. Render controls against `capabilities.can_decide`, never against the
session's role — a value in `localStorage` must not be able to unlock a review action.

## Using it

```ts
import { ApiError, useMyOrganisations } from "@/lib/api";
import { useAuth } from "@/lib/auth";

const { user, isAuthenticated } = useAuth();
const { data, isPending, error } = useMyOrganisations();
```

Failures are always an `ApiError`:

```ts
try {
  await signIn({ email, password });
} catch (error) {
  if (error instanceof ApiError && error.code === "email_not_verified") {
    /* … */
  }
  // error.message is written for a person; error.fieldErrors() maps a validation
  // failure to one message per field; error.isNetworkError means the API is unreachable.
}
```

## Configuration

`.env` (copy from `.env.example`):

```
VITE_API_URL=http://localhost:8000
```

Origin only — no trailing slash and no `/api/v1`. The backend must list this app's origin in
`CORS_ALLOWED_ORIGINS`; `http://localhost:8080` is there by default.

## What is connected

Sign-in, registration, the six-digit email code and its resend, the current user, the
organisation register and join requests.

**Processing Compliance is fully wired, on both sides of the desk.** Every screen under
`/processing` reads this API and every action writes to it; `verticals/processing` holds no
fixture data any more.

**Logistics Compliance is wired too.** `verticals/logistics/store.tsx` reads and writes
through `lib/api/logistics.ts` / `lib/api/logistics-queries.ts` rather than
`verticals/logistics/mock-data.ts`; the mock module now only supplies the `Company`,
`Vehicle`, `Driver`, `ComplianceDocument`, `CheckSection`, `InfoRequest`, `Notification`,
`AuditEntry` and `Role` types the store builds real objects against (its seed arrays are
unused).

**Marketplace is wired too.** `verticals/marketplace/store.tsx` reads and writes through
`lib/api/marketplace.ts` / `lib/api/marketplace-queries.ts` rather than
`verticals/marketplace/demo-data.ts`; that module now only supplies the `Application`,
`Miner`, `Rfq`, `OrderRow`, `Notification` and `Role` view types the store builds real
objects against (its seed arrays are gone).

**Mining is wired too, and is the last vertical converted.** `verticals/mining/store.tsx`
reads and writes through `lib/api/mining.ts` / `lib/api/mining-queries.ts` rather than a
local `data.ts` (deleted); `verticals/mining/types.ts` now only supplies the camelCase view
types the store's `mappers.ts` adapters build real objects against.

Oversight reports are compiled server-side and downloaded as PDFs; the composer on the
reports page posts to `/processing/reports/generate/` and the library lists what has been
published.

The vertical has three roles. `operator` reviews and decides, `regulator` reads, and
`processor` is the applicant: it starts an application, answers each section, uploads
evidence, submits, and responds to findings. The applicant's form is built from the server's
checklist (`/processing/checklist/`), so it asks for exactly what the server will judge, and
the gap list it shows is the one the API computes.

Seed the backend before opening the processing dashboard, or it renders empty states:

```bash
python manage.py seed_processing --flush   # in ../../../beldium-backend
```

### How the processing vertical is wired

```
lib/api/processing.ts            fetchers + the DRF shapes, field-for-field
lib/api/processing-queries.ts    TanStack hooks; every write invalidates ["processing"]
verticals/processing/domain.ts   the vocabulary the screens read, plus API → view adapters
verticals/processing/store.tsx   one provider that runs the reads and exposes the writes
```

The API speaks snake_case and machine values (`in_review`); the screens read camelCase and
display labels (`In Review`). All of that translation lives in `domain.ts`, so no component
touches a raw API row.

### How the logistics vertical is wired

```
lib/api/logistics.ts             fetchers + the DRF shapes, field-for-field
lib/api/logistics-queries.ts     TanStack hooks; every write invalidates ["logistics"]
verticals/logistics/domain.ts    entity-level API → view adapters (Company, Vehicle, Driver, …)
verticals/logistics/store.tsx    one provider that runs the reads, exposes the writes, and
                                  shapes rows into the legacy `Company`/`InfoRequest`/
                                  `Notification`/`AuditEntry` view models the screens expect
```

A few fields the old mock carried have no backend equivalent (a document's uploader name, a
notification's severity `tone`, an audit event's human-readable target/outcome, per-domain
checklist `items`) — the store fills these with sensible defaults rather than inventing data
the API doesn't return.

Two identifiers travel together on every row. `id` is the human reference (`BPC-APP-2026-4D62`)
— what people quote and what the URLs carry — and `uuid` is the API's primary key, which every
write is addressed by. The store owns the map between them.

Only the application **detail** response carries the ten evidence sections, so the review
screen reads through `useApplicationDetail(reference)` rather than picking its row out of the
queue.

### How the marketplace vertical is wired

```
lib/api/marketplace.ts             fetchers + the DRF shapes, field-for-field
lib/api/marketplace-queries.ts     TanStack hooks; every write invalidates ["marketplace"]
verticals/marketplace/demo-data.ts the camelCase view types the screens read
verticals/marketplace/store.tsx    one provider that runs the reads, exposes the writes, and
                                    adapts API rows into those view types inline
```

The register is close enough to the wire format that a separate `domain.ts` adapter file
wasn't needed — the conversions (applicant type, risk band, non-conformity severity, order
stage) live at the top of `store.tsx`, the same way `verticals/processing/store.tsx` folds
its own translation in rather than splitting it out.

`createRfq` is the one action the screens call for its return value (the new RFQ's id, to
navigate straight to its aggregation page), so it returns a `Promise<string>` rather than
firing and forgetting like every other action here; the one call site awaits it.

### How the mining vertical is wired

```
lib/api/mining.ts             fetchers + the DRF shapes, field-for-field
lib/api/mining-queries.ts     TanStack hooks; every write invalidates ["mining"]
verticals/mining/mappers.ts   snake_case/machine-value ↔ camelCase/display-label maps, plus
                               the row adapters (API shape → verticals/mining/types.ts shape)
verticals/mining/store.tsx    one provider that runs the reads, exposes the writes, and
                               composes the register's read-side view from them
```

Mining's register is entity-heavy — sites, licences, applications, inspections, samples,
non-conformities, environmental records, safety incidents, equipment, info requests and
organisation KYC profiles all live under `/mining/*` — so, unlike marketplace, the adapters
get their own file (`mappers.ts`) rather than living inline in `store.tsx`.

A handful of API names collide with an identically-named export already in a sibling
vertical's module (`processing.ts` chiefly, since both registers use the same evidence-review
shape): `Inspection`, `NonConformity`, `Sample`, `ListQuery`, `Checklist`, `SectionField`,
`ApplicationStatus` and their sibling functions/hooks are exported from `mining.ts` /
`mining-queries.ts` with a `Mining` prefix (`MiningInspection`, `MiningNonConformity`,
`useCreateMiningApplication`, …) so the barrel file's `export *` stays unambiguous — the same
convention `quality.ts` (`QualityApplicationStatus`) and `export.ts` established.

Only the site **detail** response (`GET /mining/sites/:id/`) carries the ten review sections;
the list read used by `useStore().sites` omits them. The review screen instead reads through
`useSiteDetail(siteId)`, mirroring `useApplicationDetail` in processing.

A site's licence isn't addressed by a `licenceId` foreign key on the mining side — licences
point at their site (`LicenceDoc.siteId`), not the other way round — so screens look one up
with `licences.find(l => l.siteId === site.id)` rather than through the site row.
