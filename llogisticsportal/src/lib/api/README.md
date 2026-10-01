# Beldium API layer (Logistics Hub)

The portal runs entirely on the Beldium Django API. There is no demo or mock
data path. Set `VITE_API_URL` to the API origin (see `.env.example`; defaults to
`http://localhost:8000`).

`config`, `client`, `errors`, `tokens`, `auth`, `types`, `organisations` and
`queries` are Miner Hub's copies (plus the `logistics_company` organisation
type and `apiDownload`), so both portals authenticate and fail the same way.
Keep them in sync if Miner Hub's copy changes.

| File                                     | Backend (`beldium-backend/logistics`)                                                                                                                                                 |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `logistics.ts`, `logistics-queries.ts`   | Onboarding: companies, applications, sections, vehicles, drivers, evidence, information requests, conditions, restrictions, notifications, reports.                                   |
| `onboarding.ts`                          | Submits the application wizard draft, resumably.                                                                                                                                      |
| `operations.ts`, `operations-queries.ts` | Operations (verified against 1c04f36): transport requests, movements, deliveries, transactions, payments, incidents, findings, quality, events, action items, `operations_dashboard`. |

## Rules the frontend works around

- **Document identity is `document_type` per application.** A second upload with
  the same type is a new version and must keep the same domain and links. Per
  vehicle/driver evidence therefore uses `"<type> (<registration or name>)"`, and
  condition / information-request evidence uses a type suffixed with its id.
- **Fleet changes lock after approval.** Vehicles and drivers can only be created or
  edited while the application is draft, awaiting information or rejected, so the
  registers are read-only for verified operators.
- **Submission needs every applicable domain** (9, or 8 without mineral services)
  to have section data and a current, unexpired document. The wizard enforces this
  before calling `submit`.
- **References are server-generated** (`PREFIX-YYYYMMDD-XXXXXX`) and read-only on every
  operations model; the frontend never sends one.
- **Statuses are fixed choices** (lowercase, e.g. `open`, `resolved`,
  `corrective_action_submitted`); anything else returns 400. Movement status changes follow
  `MOVEMENT_TRANSITIONS` in `operations.ts`, and the status dialog only offers those.
- **Operations document uploads are multipart** (`uploadOperationsDocument`); JSON works for metadata edits.
- The dashboard returns `unread_notifications` (per user) and `unread_events` (company-wide) separately.
- **Arrival before delivery.** Movements go in transit (or delayed) → `arrived` →
  `delivered`; both create the Delivery as `arrived`. Only `deliveries/{id}/complete/` with
  the received quantity finishes custody (`completed`, or `variance_flagged` outside
  `metadata.quantity_tolerance`).
- Movements filter by `?request=` and payments by `?transaction=` on the server.

See the handoff list for the backend work still open.
