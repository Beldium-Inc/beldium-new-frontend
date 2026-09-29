# Beldium API layer (Logistics Hub)

The portal runs entirely on the Beldium Django API. There is no demo or mock
data path. Set `VITE_API_URL` to the API origin (see `.env.example`; defaults to
`http://localhost:8000`).

`config`, `client`, `errors`, `tokens`, `auth`, `types`, `organisations` and
`queries` are Miner Hub's copies (plus the `logistics_company` organisation
type and `apiDownload`), so both portals authenticate and fail the same way.
Keep them in sync if Miner Hub's copy changes.

| File                                     | Backend (`beldium-backend/logistics`)                                                                                                                                       |
| ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `logistics.ts`, `logistics-queries.ts`   | Onboarding: companies, applications, sections, vehicles, drivers, evidence, information requests, conditions, restrictions, notifications, reports.                         |
| `onboarding.ts`                          | Submits the application wizard draft, resumably.                                                                                                                            |
| `operations.ts`, `operations-queries.ts` | Operations (commit f0ba53b): transport requests, movements, deliveries, transactions, payments, incidents, findings, quality, events, action items, `operations_dashboard`. |

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
- **Incident references are client-generated** (`INC-YYYYMMDD-XXXXXX`): the
  model requires a unique `reference` and has no generator.
- Movements can't be filtered by `request`, and payments can't be filtered by
  `transaction`, so detail pages filter those lists client-side.

See the handoff list for the backend work still open.
