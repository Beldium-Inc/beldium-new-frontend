# Logistics workflows: backend endpoints still missing

The Lovable logistics prototype's workflows are now in this repo (independent
operator journey, membership join requests, trip lifecycle, officer
verification records). Where `beldium-backend` already had an endpoint the
frontend uses it; where it did not, the frontend keeps the prototype's
browser-only demo state. This lists what the backend needs so those parts can
move onto the API.

## What uses the real API today

| Workflow | Where | Endpoints |
| --- | --- | --- |
| Account signup, email verification, sign-in (all journeys) | `llogisticsportal` `/signup`, `/verify`, `/auth` | `auth/register`, `auth/verify-email`, `auth/login`, `auth/me` |
| Join request, pending, withdraw | `llogisticsportal` `/join-organization` | `GET/POST /join-requests/`, `POST /join-requests/{id}/cancel/`, `GET /organisations/directory/` |
| Approve / decline from Team, members list | `llogisticsportal` `/portal/team` | `GET /organisations/{id}/join-requests/`, `POST /join-requests/{id}/decide/`, `GET /organisations/{id}/members/`, `GET /logistics/drivers/?company=` |
| Organisation movement lifecycle view | `llogisticsportal` `/portal/movements/$movementId` | existing movement, delivery and status endpoints |
| Officer verification records | main app `/logistics/operator/applications/$companyId` (Documents tab) | `POST /logistics/documents/{id}/review/` (record written into `notes`) |
| Regulator view of verification records | main app `/logistics/regulator/verifications` | `GET /logistics/documents/` via the existing store |

## Missing endpoints

### 1. Independent transport operators (highest priority)

Today: the 8-step application, its review record and its trips live in
`localStorage` per signed-in account (`llogisticsportal/src/lib/independent/store.tsx`).
Officers cannot see them, so an independent's own record never gets past
"Submitted". The workspace offers a clearly labelled seeded demo operator so
assignments and trips can be shown in demos.

Needed:

- `independent-operators` resource (one per user): personal identity, operator
  profile (type, experience, services, optional registered business name and BN
  number; no TIN), driver-only flag, licence (number, class, expiry,
  competence, certifications), scope (states, corridors, cargo, minerals,
  monthly capacity, safety arrangements), per-requirement authorization flags,
  evidence (real files, not filenames), declarations, `status`
  (draft/submitted), server-generated `BLC-IND-…` reference, `submitted_at`.
  - `GET/PATCH /logistics/independent-operators/me/`, `POST …/me/submit/`.
  - Submit must validate the same rules as `indMissing` /
    `indSubmissionMissing` in `llogisticsportal/src/lib/independent/model.ts`.
  - A PATCH that changes submitted operational declarations must reset the
    review to pending (see `materiallyChanged`).
- `independent-operators/{id}/vehicles/` (registration, type, payload in
  tonnes, ownership owned/leased/contracted, insurance and roadworthiness
  expiry, owner authorization).
- Conditional requirement list computed server-side (identity, licence,
  business only if claimed, FRSC/RTSSS and vehicle docs only with a vehicle,
  owner authorization for non-owned vehicles, mineral, hazardous, interstate).
- Officer review on the same model as companies: review status
  (pending → under review → awaiting information → approved / conditionally
  approved / rejected), separate driver and per-vehicle readiness, per-requirement
  verification records (see 4), information requests and responses. Officers
  need these in the main app's `logistics.operator.*` register and the
  regulator's read-only views.

### 2. Membership roles and driver linkage

Today: `MembershipRole` has no logistics manager or driver role, and a join
request cannot reference a driver. The portal sends `requested_role: "member"`
and writes `Requested role: …` as the first line of `justification`, and the
approver's linked driver as `Linked driver: Name [uuid]` on the first line of
the decision `notes` (`llogisticsportal/src/lib/membership.ts`).

Needed:

- Logistics roles on memberships and join requests: `fleet_manager` (or
  `operations_manager`) and `driver`.
- `driver` field on `JoinRequestDecision` / `OrganisationMembership`
  (FK to `logistics.Driver`), required when approving a driver, and validated to
  belong to the deciding organisation's company.
- Driver users should then only see and write movements assigned to their
  linked driver.

### 3. Trip lifecycle, milestones, exceptions and proof of delivery

Today: independent trips run fully in the browser
(`llogisticsportal/src/lib/trips/model.ts`). Organisation movements use the
real API, but the movement statuses are a subset of the ten stages, so the
movement page infers Mobilized (`assigned`) and Closed (`delivered` + delivery
completed) and has no Arrived at Pickup.

Needed:

- Movement statuses for the full lifecycle: Requested → Accepted → Scheduled →
  Mobilized → Arrived at Pickup → Loaded → In Transit → Arrived at Destination →
  Delivered → Closed, plus Exception / Disputed with a stored `resume_status`,
  and Cancelled.
- `movements/{id}/milestones/` — append-only, timestamped (actor, location,
  evidence file, notes), with `Correction` entries instead of edits, and an
  idempotency key. Loaded must record loaded quantity, weighbridge reference and
  seal reference.
- Proof of delivery on the delivery: file upload, receiving organisation and
  representative, arrival time, condition, weighbridge reference, discrepancy
  declaration (required when quantity differs), and the receiving-party
  acknowledgment flagged as declared by the submitter.
- Officer delivery-evidence review (`reviewed` / `accepted`) that gates Closed;
  drivers cannot close or cancel.
- Assignment for independents: an openings / marketplace feed and
  `POST …/accept/` that applies the same gating as `openingRestrictions`
  (operator approved, driver and vehicle ready, licence/insurance/roadworthiness
  in date, payload, verified mineral and hazardous scope, no active trip),
  atomically.

### 4. Structured verification records

Today: verifying a document requires source, method and findings in the UI,
and the record is written into `review_notes` in a fixed labelled format
(`src/verticals/logistics/verification.tsx`) and parsed back for display.

Needed:

- A `verification` object on document review (and on independent requirements):
  `source`, `method`, `findings` (all required to verify), `decision`, `scope`,
  `next_review` (date), with officer and timestamp set server-side.
- Expose it on `LogisticsDocument` so the frontend can stop parsing notes, and
  allow filtering by `next_review` for re-verification queues.

### 5. Notifications for independents

Independent notifications and read markers are derived in the browser. They
need per-account notifications with durable read state once 1 and 3 exist.

## Local testing notes

- The local backend's `.env` limits `CORS_ALLOWED_ORIGINS` to ports 8080, 3000,
  5173 and 5174, so the portal on 5175 cannot reach it. Run the backend with
  `CORS_ALLOWED_ORIGINS` including `http://localhost:5175`, or add it to the
  `.env`.
- The local backend sends real email through Resend when a Resend key is set.
  Use reserved `.test` addresses for test accounts.
