# Beldium Miner Portal — standalone build

A fresh, self-contained portal for miners and mining organisations. Nothing is shared with or read from any other Beldium project; this project gets its own backend, its own accounts, and its own visual identity.

## Visual identity

- Logo: the supplied navy ribbon "B" mark, used in the auth screens, sidebar, and page headers.
- Palette: deep navy primary (from the logo), slate neutrals, a copper/ore accent for status and highlights, plus semantic states (approved green, review amber, action red).
- Type: geometric sans headings, clean grotesque body. Dense, industrial-console feel — data tables, status chips, timeline rails; not soft SaaS pastel.
- All colours as semantic tokens in the design system, light and dark.

## Backend (Lovable Cloud)

Enabled in this project only. Tables (all RLS-protected, role checks in a separate roles table):

- `profiles` — name, phone, verification flags
- `user_roles` — miner_owner, miner_staff, org_admin, reviewer
- `organisations` — name, registration details, status (draft / submitted / under_review / verified / rejected)
- `org_members` + `org_join_requests` — join-by-invite/request flow with approve/decline
- `applications` — the 8-step application payload per step, submission timestamp
- `sites`, `equipment`, `documents` (file storage), `declarations`
- `activity_events`, `review_timeline`, `information_requests`, `evidence_responses`
- `production_records`, `inventory_items`, `compliance_items`, `corrective_actions`

Real email/password auth plus Google sign-in, email verification, and a phone-verification UI.

## Flow

1. `/` — Beldium Miner Portal landing with sign-in / get-started.
2. `/auth` — universal sign-in (all roles land here after submitting).
3. `/signup` — role-based options: register a new mining organisation, join an existing organisation (request access), or individual miner.
4. `/verify` — email and phone verification screens with resend and status.
5. `/onboarding/application` — 8-step wizard with saved drafts and step validation:
   organisation details → ownership & contacts → licences & permits → mining sites (repeatable) → equipment (repeatable) → environmental & safety → supporting documents (uploads) → review & final declaration.
6. Submit result screen → routes to universal sign-in.

## Dashboards

Shared miner shell: logo sidebar, org switcher, status banner, top bar.

- Under review: application status card, review timeline, activity feed, open information requests, evidence upload/response forms, read-only submitted data.
- Verified miner: overview KPIs plus sidebar areas — Dashboard, Mining Sites, Production, Inventory, Equipment, Compliance, Corrective Actions, Documents, Organisation & Members, Notifications, Settings.
- Mining site detail with tabs: Overview, Production, Equipment, Workforce, Compliance, Documents.
- Production: entries by period, tonnage/grade, charts. Inventory: stock items, movements, thresholds. Compliance status: obligation list with due dates and states. Corrective actions: assignment, due date, evidence, closure.

## Technical notes

Routes are file-based; the whole authenticated area sits under a protected layout. Reads and writes go through server functions with auth middleware, so RLS applies per user and per organisation. Draft applications and uploads persist server-side.

## Build order

1. Cloud enable + schema/migrations, design system, logo asset.
2. Auth, signup role options, verification, join requests.
3. 8-step application wizard + submit result.
4. Under-review dashboard (timeline, activity, information requests, evidence).
5. Verified dashboard, sites and tabs, production, inventory, compliance, corrective actions.
