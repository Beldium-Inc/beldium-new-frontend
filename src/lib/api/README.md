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
fixture data any more. The other six dashboards still run on their own local prototype
stores.

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

Two identifiers travel together on every row. `id` is the human reference (`BPC-APP-2026-4D62`)
— what people quote and what the URLs carry — and `uuid` is the API's primary key, which every
write is addressed by. The store owns the map between them.

Only the application **detail** response carries the ten evidence sections, so the review
screen reads through `useApplicationDetail(reference)` rather than picking its row out of the
queue.
