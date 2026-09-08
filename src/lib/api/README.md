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
role; the API has no concept of verticals yet.

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
organisation register and join requests. The seven dashboards still run on their own local
prototype stores — the backend has no endpoints for sites, applications, inspections or
reviews yet.
