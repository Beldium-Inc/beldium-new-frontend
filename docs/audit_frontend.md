# Frontend audit against the Q&C Build Pack

Audit date: 2026-10-10. Branch: `feat/processing-compliance-frontend`.

Method: I read the code. Nothing was changed except this file. Evidence is written as `path:line`. Paths are inside this repo unless they start with BE, which means the sibling Django repo `beldium-backend`.

Three things to know before reading:

1. The pack folder (`~/Downloads/qac`) holds a Word guide and a zip of 18 pictures. There is no `guide.md` in it. I used the text of the Word guide and the picture `S0_Screen_map.png`.
2. The pack does not number screens S1 to S30. It numbers eight wireframe pages S0 to S7, and page S0 lists 30 screens in four groups (13, 5, 7 and 5). I numbered those 30 screens S1 to S30 in the order they appear on page S0. Where the pack has its own wireframe for a screen I say so in the table.
3. Four logistics files in the working tree changed at 18:03 while the audit was running (`src/lib/api/logistics.ts`, `src/lib/api/logistics-queries.ts`, `src/verticals/logistics/store.tsx`, `src/routes/logistics.operator.applications.$companyId.tsx`). I did not make those edits. The build result below includes them.

---

## 1. Project facts

| Item | Finding | Evidence |
|---|---|---|
| Framework | React 19 with TanStack Start (server rendering) on Vite 8. The Vite setup comes from the Lovable preset, which adds the router plugin, Tailwind, the path alias and Nitro. | `package.json:57`, `vite.config.ts:7` |
| Routing | TanStack Router, file based. Flat file names such as `quality.samples.$id.tsx`. The route tree is generated into `src/routeTree.gen.ts`. One router serves seven dashboards under `/mining`, `/processing`, `/quality`, `/warehousing`, `/logistics`, `/export`, `/marketplace`, plus `/signin`, `/onboarding`, `/staff` and the public `/verify/$hash`. | `src/router.tsx:5`, `src/lib/verticals.ts:32` |
| Route guards | None at router level. No Q&C route uses `beforeLoad` to check sign in. Each layout checks inside a React effect after the page has rendered and then redirects. | `src/routes/quality.tsx:32` |
| Data fetching | TanStack Query 5. One `QueryClient` made with default options. Each module has a client file (`src/lib/api/<module>.ts`) and a hooks file (`src/lib/api/<module>-queries.ts`). | `src/router.tsx:6`, `src/lib/api/quality-queries.ts:1` |
| State | No Redux or Zustand. Each dashboard has a React context "store" that calls every list query and exposes plain functions to pages. Q&C uses `BeldiumProvider`. | `src/verticals/quality/store.tsx:284` |
| Lists | Every Q&C list asks for one page of 100 rows and then filters and counts in the browser. There is no paging. | `src/lib/api/quality-queries.ts:71` |
| UI library | shadcn components (new york style) on Radix, Tailwind 4, lucide icons, sonner toasts, recharts. 46 files in `src/components/ui`. | `components.json:3` |
| Form library | `react-hook-form` and `zod` are installed. Only one route uses them (`src/routes/processing.applications.$id.tsx`). Every Q&C form is hand written with `useState` and has almost no validation. | `package.json:60`, `src/routes/quality.samples.index.tsx:164` |
| API base URL | `VITE_API_URL` holds the origin only. The client adds `/api/v1`. If the variable is missing the app silently uses `http://localhost:8000`. | `src/lib/api/config.ts:3` |
| HTTP client | One `apiFetch` wrapper over `fetch`. Adds the bearer token, retries once after a 401, turns errors into `ApiError`. A second helper downloads protected files as blobs. | `src/lib/api/client.ts:123`, `src/lib/api/client.ts:176` |
| Environment files | `.env` exists locally and holds `VITE_API_URL` only. `.env.example` exists on disk but is listed in `.gitignore`, so it is not in the repo and a new developer gets no example. Variables read by code: `VITE_API_URL`, `VITE_MINER_PORTAL_URL`, `VITE_SESSION_IDLE_MINUTES`. | `.gitignore` (lines for `.env`, `.env.*`, `.env.example`), `src/env.d.ts:8` |
| Build | `bun run build` runs `vite build`. Nitro writes a Cloudflare Workers bundle to `.output`. | `package.json:8`, `.output/nitro.json` |
| Deploy | No script and no pipeline in this repo. The built bundle is deployed with `npx wrangler deploy` (worker name `beldium-inc-beldium-new-frontend`). The repo is also connected to Lovable, which syncs pushed commits. The only response header set is a cache rule for `/assets/*`. There is no Content Security Policy and no frame or sniffing header. | `.output/server/wrangler.json`, `.output/public/_headers`, `AGENTS.md` |
| Other apps in the repo | `Beldium-Miner-Hub` and `llogisticsportal` are two separate apps with their own `package.json`. They are not part of the main build. | `Beldium-Miner-Hub/package.json` |
| Tests | None. No test files, no test runner in `package.json`. | `package.json:6` |
| CI | None in this repo. No `.github` folder. (The backend repo has a deploy workflow.) | repo root |

### Build and linter results

| Check | Result |
|---|---|
| `bun run build` | Passes. Exit code 0. Three build stages completed (6.9 s, 5.4 s, 1.7 s). No errors and no warnings in the log. |
| `bunx tsc --noEmit` | Passes. 0 type errors. |
| `bun run lint` | Fails. 12,275 problems: 12,009 errors and 266 warnings. |

Linter detail:

- Every one of the 12,009 errors is a Prettier formatting error. None is a logic error. All can be fixed with `eslint --fix`.
- The 266 warnings are 260 "fast refresh" warnings (files that export both components and constants) and 6 React hook dependency warnings.
- The linter scans folders it should not. 689 of the 901 files with problems are inside `.claude/worktrees` (old agent working copies). 50 are in `Beldium-Miner-Hub` and 14 in `llogisticsportal`. Only 148 are in `src`. The ignore list in `eslint.config.js:9` covers only `dist`, `.output` and `.vinxi`.
- Inside `src`: 1,379 formatting errors and 49 warnings. One hook warning is in `src/verticals/logistics/store.tsx:397`.

Because lint fails on formatting alone, it cannot be used as a gate today. Fix: add `.claude`, `Beldium-Miner-Hub` and `llogisticsportal` to the ignore list, run the formatter once in its own commit, then add a CI job that runs lint, type check and build.

---

## 2. Auth

### How it works today

| Step | What happens | Evidence |
|---|---|---|
| Sign in | The user first picks a sector, then picks a role from a list, then types email and password. The app posts to `/auth/token/` and gets an access token and a refresh token (JWT). | `src/routes/signin.tsx:117`, `src/lib/api/auth.ts:70` |
| Who am I | After the tokens arrive the app calls `/auth/me/` and keeps the user in the query cache. | `src/lib/auth.tsx:46` |
| Role | The role the user clicked on the sign in page is saved in the browser as the "session". The server is not asked whether the user holds that role. | `src/routes/signin.tsx:148`, `src/lib/session.tsx:56` |
| Token storage | Both tokens are stored in `localStorage` under the key `beldium.auth.v1`, and mirrored in memory. | `src/lib/api/tokens.ts:13`, `src/lib/api/tokens.ts:57` |
| Role storage | Sector and role are stored in `localStorage` under `beldium.session.v1`. | `src/lib/session.tsx:12` |
| Refresh | While the user is active, a timer refreshes the access token two minutes before it expires. The refresh call needs the old access token to still be valid, so once it lapses the session is over. Concurrent calls share one refresh. | `src/components/session-timeout.tsx:181`, `src/lib/api/client.ts:43` |
| Token expires during a call | A 401 triggers one refresh and one retry. If refresh is refused the tokens are cleared, the user sees "Your session has expired" and is sent to `/signin`. If the network is down the tokens are kept. | `src/lib/api/client.ts:158`, `src/lib/api/client.ts:72`, `src/components/session-timeout.tsx:140` |
| Idle timeout | 15 minutes without input (maximum 25). A one minute warning dialog, then sign out. Activity is shared between tabs. | `src/components/session-timeout.tsx:34` |
| Logout | Posts the refresh token to `/auth/logout/` so the server can blacklist it, clears the tokens whether or not that worked, clears the query cache, clears the stored role. | `src/lib/api/auth.ts:118`, `src/lib/auth.tsx:85`, `src/lib/sign-out.ts:15` |
| Roles on the Q&C client | The Q&C store calls `/quality/me/` and uses the role the server returns. If the server returns no role it falls back to the role the user picked. Two flags, `can_review` and `can_decide`, also come from the server. | `src/verticals/quality/store.tsx:318`, `src/verticals/quality/store.tsx:368` |
| Multi factor | None at sign in. Codes by email and phone are used once at sign up only. | `src/lib/api/auth.ts:44` |
| Password reset | Not built. The link shows a toast. | `src/routes/signin.tsx:334` |

### What is unsafe and what to change

| No. | Problem | Why it matters | Change |
|---|---|---|---|
| 1 | The user chooses their own role. | Anyone with an account can pick "Compliance Operator" on the sign in page. In Q&C the server role replaces it when one exists, but the fallback at `store.tsx:318` uses the picked role when the server says null, and the Export dashboard uses the picked role with no server check at all (`src/verticals/export/store.tsx:217`). The pack needs twelve fixed roles. | Remove the role picker. After sign in, read roles from the server (`/auth/me/` or a capabilities call) and route the user to the screens that role allows. Never fall back to a stored role. |
| 2 | Tokens live in `localStorage`. | Any script that runs on the page (an injected script, a bad dependency) can read both tokens. The refresh token lasts seven days (BE `core/settings.py:329`). There is no Content Security Policy to limit this. | Move the refresh token to a cookie the script cannot read (HttpOnly, Secure, SameSite). Keep the access token in memory only. Add a Content Security Policy and the usual security headers at the Cloudflare layer. |
| 3 | No second factor. | The pack requires multi factor sign in for internal and partner users. | Add a second step after the password, enforced by the server before tokens are issued. |
| 4 | The role in `localStorage` is trusted for navigation. | Editing `beldium.session.v1` in the browser opens any dashboard shell. Data still needs the token, so the damage is limited to seeing menus and empty pages, but it proves the client decides. | Route guards should use server capabilities, loaded before the route renders. |
| 5 | Guards run after render. | Protected layouts render first and redirect in an effect. There is no `beforeLoad` guard and the server side render cannot see `localStorage`. | Add a guard in the route definition once the session can be read before render (the cookie change in row 2 makes this possible). |
| 6 | The refresh rule logs out field users. | Refresh only works while the access token is alive (30 minutes). A phone that sleeps or loses signal for longer is signed out and anything typed is lost. That is the normal case for the sampler in the pack. | Let the refresh token work alone for partner field roles, or give the field app a longer server side session bound to the device. Keep drafts on the device so sign in again does not lose work. |
| 7 | "Keep me signed in" does nothing. | The checkbox state is never read. | Remove it or build it. `src/routes/signin.tsx:98`, `src/routes/signin.tsx:329` |
| 8 | One file download skips the refresh path. | `openApplicationDocument` calls `fetch` directly with the stored token. If the token has just expired the download fails with a vague message. | Use `apiFetchBlob`, which already retries. `src/lib/api/quality.ts:503` |
| 9 | The token is decoded on the client to read its expiry. | This is only used for timing and is safe as written. Do not start reading roles from the token the same way. | Keep it as it is. `src/lib/api/tokens.ts:105` |

What is already done well: logout blacklists the refresh token on the server, the cache is cleared on logout, refresh calls are shared so tokens are not burned, a network failure does not log the user out, and tabs stay in step with each other.

---

## 3. The 30 screens

Summary: 9 screens have a page that partly covers them, all wired to a real API. 5 have a small piece inside another page. 16 are missing. No Q&C page uses mock data. The pages that exist were built for a smaller idea (laboratory partner admission, samples, certificates), not for the batch and gate system in the pack. There is no Batch anywhere in this frontend.

All endpoints below are under `/api/v1/quality`. All exist in BE `quality/urls.py`.

A note that applies to every row: pages do not fetch their own record. They read from the four big lists loaded by the store and look the record up by id in memory (for example `src/routes/quality.samples.$id.tsx:65`). So every page depends on the first 100 rows.

### Q&C Workspace (web)

| No. | Screen in the pack | Page exists | Data | Endpoints called | What is missing |
|---|---|---|---|---|---|
| S1 | Home: work queue, counts, alerts (pack wireframe S1) | Partly. `/quality/dashboard`, `src/routes/quality.dashboard.tsx` | Real API | GET `/applications/`, `/samples/`, `/certificates/`, `/non-conformities/`. Counts are worked out in the browser. The server `/dashboard/` call has a hook but no page uses it (`src/lib/api/quality-queries.ts:88`). | The six tiles in the pack, batches by stage, a "My work today" queue with an Open button on each row and oldest first, the Expiring soon panel, one search box across companies, batches and documents. |
| S2 | Onboarding queue | Partly. `/quality/applications`, `src/routes/quality.applications.index.tsx` | Real API | GET `/applications/`, GET `/professional-applications/` | It lists laboratory partner applications only. No supplier queue, no licence check, no oldest first order. |
| S3 | Company File and documents (pack wireframe S2) | Partly. Documents tab in `src/routes/quality.applications.$id.tsx:321` | Real API | PATCH `/applications/{id}/documents/{doc}/`, POST `.../upload/`, GET `.../download/` | One file per supplier as well as per partner, version history, expiry dates and alerts, restricted and masked documents, the "on behalf of" flag with date and channel, drag and drop, phone photo, export of the whole file. The Replace button shows no old versions. |
| S4 | Partners and qualification | Partly. Same page as S3 | Real API | POST `/applications/{id}/assign/`, POST `.../decide/`, POST `.../risk-flags/{flag}/resolve/` | The six partner statuses, the qualification checklist, accreditation records with expiry, gate G-09 with signed agreement and CEO sign off, suspension. |
| S5 | Batch workspace and gates (pack wireframe S3) | Partly. Nearest is the sample dossier, `src/routes/quality.samples.$id.tsx` | Real API | POST `/samples/{id}/custody/`, POST `.../test-request/`, PATCH `.../results/{result}/`, POST `.../review/`, POST `.../certificate/` | Everything specific to the pack: the Batch, the stage progress bar, the twelve item evidence checklist, the list of automatic checks, PROCEED or HOLD with reason, owner and deadline, the history panel. Today the laboratory partner records the verdict and issues the certificate, which is the opposite of the pack rule. |
| S6 | Assignments (inspector, sampler, lab) | No | None | None | Whole screen. No client call exists. |
| S7 | HOLDs and NCRs | Partly. `/quality/nonconformities` | Real API | GET and POST `/non-conformities/`, POST `.../capa/`, POST `.../capa/{action}/advance/`, POST `.../close/` | HOLDs do not exist. Close has no reason and no confirmation. An NCR raised from the sample page has fixed text and fixed severity (`src/routes/quality.samples.$id.tsx:405`). |
| S8 | Certificates (pack wireframe S7) | Partly. `/quality/certificates` and `/quality/certificates/$id` | Real API | GET `/certificates/`, POST `/samples/{id}/certificate/`, POST `/certificates/{id}/revoke/` | A printable certificate with QR code and electronic signature, the statuses EXPIRED and SUSPENDED, issue by Q&C only, a reason and a confirmation on revoke (`src/routes/quality.certificates.$id.tsx:75`). |
| S9 | Document vault and exports | No | None | None | Whole screen. |
| S10 | Reports and monthly review | No | None | None | Whole screen. Other dashboards have report pages that could serve as a pattern. |
| S11 | Buyer specifications and settings | No page | Client code only | `listBuyerSpecs`, `createBuyerSpec`, `updateBuyerSpec` exist (`src/lib/api/quality.ts:412`). Only the list is used, as a drop down when registering a sample. | A page to create and edit specifications. A settings page (500 m limit, time gap, 90, 60 and 30 day alerts, certificate validity). No settings call exists. |
| S12 | Users and roles (Admin) | No | Client code only | Member and invitation calls exist in `src/lib/api/organisations.ts` | Whole screen. The twelve roles do not exist on the client. |
| S13 | Audit log (Q&C, CEO, TL, Legal) | Partly. `/quality/audit`, `src/routes/quality.audit.tsx` | Real API, but indirect | No audit endpoint. The page joins the `audit` arrays that come inside the first 100 applications and samples (`src/routes/quality.audit.tsx:35`). | A real audit endpoint with paging and filters, certificate and NCR events, denied attempts, export. The menu hides it by role on the client only. |

### Supplier portal (web)

| No. | Screen in the pack | Page exists | Data | Endpoints called | What is missing |
|---|---|---|---|---|---|
| S14 | My profile and documents | No Q&C page. The general onboarding dashboard (`/onboarding/dashboard`) shows the organisation application and its documents. | Real API (compliance module, not Q&C) | `/compliance/...` | A supplier view of the Company File with status, expiry and version for each document. |
| S15 | Declare a batch (pack wireframe S4) | No. Nearest is the "Register a new sample" form in `src/routes/quality.samples.index.tsx:101` | Real API | POST `/samples/` | Whole screen: profile and licence filled in and read only, mine site with GPS confirmation, quantity and parameters, royalty reference upload, the five point declaration, lock on submit, the block when the supplier is not approved or the licence is not valid. The current form is free text and turns a bad mass into 0 (`src/routes/quality.samples.index.tsx:177`). |
| S16 | My batches and status | Partly. A miner sees `/quality/samples` | Real API | GET `/samples/` | Batches and their fifteen statuses. The sample page shows the laboratory name and the results to every role (`src/routes/quality.samples.$id.tsx:126`, `:264`). The pack says a supplier must not see the laboratory or the assay before the decision. |
| S17 | My certificates | Partly. A miner sees `/quality/certificates` | Real API | GET `/certificates/` | Download of the certificate. |
| S18 | Messages and notices | Partly. Bell in the header only, `src/verticals/quality/bell.tsx` | Real API | GET `/notifications/` every 60 seconds, POST `/notifications/{id}/read/` | A messages page, replies, email and SMS notices. |

### Partner portal and field app

| No. | Screen in the pack | Page exists | Data | Endpoints called | What is missing |
|---|---|---|---|---|---|
| S19 | My assignments | Partly. A partner sees `/quality/samples` | Real API | GET `/samples/` | Assignments as a record. Accept or decline. Only the named person may open the work. |
| S20 | Site inspection report (inspector) | No Q&C page. `/mining/inspections` belongs to another module. | None for Q&C | None | Whole screen. |
| S21 | Sampling record on a phone (pack wireframe S5) | No | None | None | Whole screen: device GPS, increments and weight, four photos taken in the app, seal number, conflict of interest tick, offline with later send. No camera, GPS or offline code exists anywhere in `src`. |
| S22 | Custody handover on a phone | A small piece. Two buttons on the sample page, `src/routes/quality.samples.$id.tsx:137` | Real API | POST `/samples/{id}/custody/` | The button sends fixed text: action "Handover to transporter", location "Regional depot", seal intact always true. No seal number, no two signatures, no photo, no time or GPS. |
| S23 | Sample receipt (lab) | A small piece. The "Receive" button, `src/routes/quality.samples.$id.tsx:152` | Real API | POST `/samples/{id}/custody/` | A receipt form: seal number, condition, accept, hold or reject. Seal intact is always sent as true. |
| S24 | Test request and assay upload (pack wireframe S6) | Partly. On the sample page, `src/routes/quality.samples.$id.tsx:197` and `:259` | Real API | POST `/samples/{id}/test-request/`, PATCH `/samples/{id}/results/{result}/` | Upload of the assay report file, required uncertainty (the Save button only needs a value, `src/routes/quality.samples.$id.tsx:501`), method per result, a restricted view. The laboratory sees the producer and buyer names (`src/routes/quality.samples.$id.tsx:125`, `:127`). The miner can create the test request, which the pack gives to Q&C. |
| S25 | My accreditation and documents | A small piece. Upload happens once, in the onboarding flow (`src/components/onboarding/QualityOrgApplicationFlow.tsx:712`). The partner menu has no page for it afterwards. | Real API | POST `/applications/{id}/documents/{doc}/upload/` | A standing page for accreditation records, expiry and renewals. |

### Open to others

| No. | Screen in the pack | Page exists | Data | Endpoints called | What is missing |
|---|---|---|---|---|---|
| S26 | Public certificate check, no sign in (pack wireframe S7) | Yes. `/verify/$hash`, `src/routes/verify.$hash.tsx` | Real API, no token | GET `/certificates/verify/{hash}/` | Statuses EXPIRED and SUSPENDED. Validity is decided in the browser from the device clock (`src/routes/verify.$hash.tsx:37`). The page shows the scan count, which decision OD-11 may not allow. No QR code is drawn anywhere to lead to this page. |
| S27 | Buyer: certificate and dispute | Partly. A buyer sees `/quality/certificates` | Real API | GET `/certificates/` | Disputes. The buyer menu also shows samples and NCRs (`src/verticals/quality/shell.tsx:60`). The pack says buyers see certificates only. |
| S28 | Export agent: certificate and batch status | No | None | None | Whole screen and the role. |
| S29 | CEO sign offs (proposed) | No | None | None | Whole screen and the role. |
| S30 | Legal: read only view | No. The "regulator" role is the nearest thing. | None | None | The role and its view. |

---

## 4. Reusable parts that already exist

| Part | Where | Can Q&C reuse it as it is |
|---|---|---|
| Basic UI set (button, input, select, dialog, sheet, drawer, tabs, popover, calendar, table, form, pagination, skeleton, sidebar, alert dialog) | `src/components/ui/` | Yes. Standard shadcn parts. |
| Q&C page parts: `Surface`, `SectionTitle`, `PageHeader`, `Stat`, `Field`, `EmptyState`, `Pill`, `StatusPill` | `src/verticals/quality/ui.tsx` | Yes for layout. `StatusPill` needs the pack statuses added. |
| Tables | `src/components/ui/table.tsx` (used by mining, warehousing, staff). Q&C pages write raw `<table>` tags. | Markup only. There is no table with server paging, sorting or filters. Build one (see the end of this file). |
| Forms | `src/components/ui/form.tsx` wraps `react-hook-form`. `src/components/onboarding/fields.tsx` has `TextField`, `SelectField`, `PhoneField`, `AreaField`, `YesNoField`, `ChipToggleGroup` with a shared error provider. `ApiError.fieldErrors()` flattens server errors per field (`src/lib/api/errors.ts:31`). | The onboarding fields can be reused today. They are not tied to `react-hook-form`. Pick one approach before building 30 screens. |
| File upload | Plain `<input type="file">` in each page with a size check typed in place. Multipart is handled by `apiFetch` (`src/lib/api/client.ts:134`). | No shared component. No progress, no retry, no drag and drop, no camera. Build one. |
| File viewing | `useProtectedFile` and `Preview` fetch a protected file with the token and show images and PDFs (`src/components/file-preview.tsx:36`). `DocumentViewer` adds a checklist with verify and reject (`src/components/staff/document-viewer.tsx:102`). | `useProtectedFile` and `Preview`: yes, as they are. `DocumentViewer` is tied to the compliance application type and needs a small change to take a generic document. |
| Signature capture | None. The onboarding declaration takes a typed full name (`src/components/onboarding/quality-parts.tsx:148`). | No. Build one. |
| Camera access | None. | No. Build one. |
| Location access | None. `GeoPanel` draws a fixed picture and does not read the device (`src/verticals/mining/components/GeoPanel.tsx:8`). | No. Build one. |
| Status badges | Seven versions, one per dashboard: quality `StatusPill`, mining `StatusChip`, export `Pill`, logistics `StatusBadge`, warehousing `StatusPill`, marketplace `StatusBadge`, processing `Pill`. | Use the quality one and extend it. Do not add an eighth. |
| Role based menus | `navByRole` maps a role to menu items (`src/verticals/quality/shell.tsx:49`). The shell has a mobile drawer and a collapsible side bar. | The pattern is fine. The role list must become the twelve pack roles and come from the server. |
| Header | `DashboardHeader`, shared by all dashboards, stacks on narrow screens (`src/components/dashboard-header.tsx:11`). | Yes. |
| Notification bell | `QualityNotificationBell` (`src/verticals/quality/bell.tsx:23`). | Yes. |
| Confirm with reason dialog | `ActionDialog` in the processing module (`src/verticals/processing/bpc.tsx:168`). | Yes after moving it to a shared folder. Q&C needs it for HOLD, reject, revoke and close. |
| Session timeout and token handling | `src/components/session-timeout.tsx`, `src/lib/api/client.ts` | Yes for web users. Not suitable for the field app (see section 2 row 6). |
| Error type | `ApiError` with code, status and field errors (`src/lib/api/errors.ts:9`). | Yes. |

---

## 5. Mobile and field use

### Small phone screen

What works:

- The viewport tag is set (`src/routes/__root.tsx:84`).
- The side bar becomes a slide in drawer below the `lg` width and closes on navigation (`src/verticals/quality/shell.tsx:217`).
- The header stacks its actions under the title on narrow screens.
- Grids fall to one column on phones (`sm:grid-cols-2` and similar).
- Wide tables sit inside a sideways scroll box.

What does not work well on a 360 px phone:

- The three data tables have fixed minimum widths of 520, 560 and 640 px, so the user must scroll sideways to reach the action column (`src/routes/quality.certificates.$id.tsx:145`, `src/routes/quality.applications.$id.tsx:322`, `src/routes/quality.samples.$id.tsx:265`). The result entry row has three 80 px inputs and a Save button in the last column of the widest table, so entering results on a phone means scrolling sideways for every row.
- Many action buttons are small: `text-xs` with `py-1.5`, about 28 px tall (for example the custody buttons at `src/routes/quality.samples.$id.tsx:145`). The usual minimum for touch is 44 px.
- The audit filter box has a fixed width of 288 px (`w-72`) inside a header row (`src/routes/quality.audit.tsx:70`).
- Number fields are plain text inputs, so the phone shows the letter keyboard for mass and results.
- The sign in page asks the user to pick a sector and a role before the password. That is three screens of scrolling on a phone.

### Weak connection

- Every Q&C page waits for six requests before it shows anything: the user, capabilities and four lists of up to 100 rows each, with nested documents, custody events, results and audit entries (`src/verticals/quality/store.tsx:353` to `:365`). On a slow link the user sees "Loading workspace" for a long time, even to open one sample.
- There is no skeleton or partial display. It is all or nothing.
- After any change the app refetches everything under the `quality` key, which means all lists again (`src/lib/api/quality-queries.ts:73`).
- Success messages are shown before the server answers. The store functions return at once and report failure later (`src/verticals/quality/store.tsx:383` to `:458`), while the page shows the success toast on the next line (`src/routes/quality.samples.$id.tsx:142`). On a weak link the user sees "Custody event recorded", then seconds later an error, and may already have walked away.
- No request has a timeout. A stalled connection leaves a button with no feedback, because buttons are not disabled while a request is in flight. A second tap sends a second custody event.
- TanStack Query retries failed reads three times by default and pauses when the browser reports offline. Changes are not queued. A change made offline fails with "Cannot reach the Beldium API".
- Fonts load from Google at start (`src/routes/__root.tsx:107`). On a poor link this delays first paint. Host the fonts with the app.
- The notification bell polls every 60 seconds on every page (`src/lib/api/quality-queries.ts:403`).

### Camera, GPS, offline

I searched `src` for `geolocation`, `mediaDevices`, `getUserMedia`, `capture=`, `serviceWorker`, `indexedDB`, `onLine`, `manifest`, `canvas` and `exif`. There are no matches in application code.

- Camera: none. File inputs have no `capture` attribute. Nothing stops a gallery photo, which the pack forbids for sampling.
- GPS: none. No device location is read anywhere.
- Offline: none. No service worker, no web app manifest, no local draft storage, no outbox. `public` holds only the icon, the logo and `robots.txt`.
- Signature: none.

The field app in the pack (S21, S22) has to be built from nothing. The pack rules for it (GPS cannot be typed, photos cannot come from the gallery, works offline) cannot be fully enforced by a web page alone. The server must check photo metadata and timing as well. A plain browser page also cannot prevent a file from the gallery on all phones, so decide early whether the field app is an installed web app using the camera stream, or a native app.

---

## 6. Places where the client trusts something it should not

"Client only" below means the frontend hides or shows a control and I could see no matching check on the frontend side. Whether the server refuses the call must be confirmed in the backend audit. The existing `QC_PACK_AUDIT.md` (row A2 and J1) reports that several Q&C writes are not scoped on the server, so treat each of these as open until tested.

| No. | Where | What is trusted | Evidence |
|---|---|---|---|
| 1 | Sign in | The role the user clicks. It is saved and used to open a dashboard. | `src/routes/signin.tsx:148`, `src/lib/session.tsx:56` |
| 2 | Q&C layout | Access to `/quality/*` is decided from the stored role only. | `src/routes/quality.tsx:29` |
| 3 | Q&C store | Falls back to the stored role when the server returns none. | `src/verticals/quality/store.tsx:318` |
| 4 | Export dashboard | Uses the stored role and never asks the server. | `src/verticals/export/store.tsx:217` |
| 5 | Sample page: custody buttons | Shown when role is miner or partner. Hidden button, not a server rule as far as the client knows. | `src/routes/quality.samples.$id.tsx:137` |
| 6 | Sample page: test request | Shown to miner, partner and operator. | `src/routes/quality.samples.$id.tsx:197` |
| 7 | Sample page: record results | Shown to partner and operator. No check that this partner is the assigned laboratory. | `src/routes/quality.samples.$id.tsx:84` |
| 8 | Sample page: record verdict and issue certificate | Shown to any partner. The client sends only the sample id from the URL. | `src/routes/quality.samples.$id.tsx:324`, `:382` |
| 9 | Sample list: register | Shown to miner and operator. No check on approval or licence. | `src/routes/quality.samples.index.tsx:61` |
| 10 | NCR page | Raise is shown to operator. Respond is shown to partner and operator. Close is shown to operator. All by role name. | `src/routes/quality.nonconformities.tsx:45`, `:46`, `:227` |
| 11 | Application page: upload | Shown when role is partner or operator. The application id comes from the URL. | `src/routes/quality.applications.$id.tsx:410` |
| 12 | Menus | Audit and applications are hidden from some roles by the menu only. The routes still open if the address is typed. | `src/verticals/quality/shell.tsx:49` |
| 13 | Ids from the URL | Every detail page takes the id from the address and uses it in the write call. The page only finds records already in the user's list, which hides others in the screen, but a direct API call with another id is not stopped by the client. | `src/routes/quality.samples.$id.tsx:51`, `src/routes/quality.certificates.$id.tsx:40`, `src/routes/quality.applications.$id.tsx:62` |
| 14 | Confidential fields | The sample page prints producer, laboratory, buyer and all results for every role. It relies fully on the server to leave them out. | `src/routes/quality.samples.$id.tsx:125` to `:127`, `:264` |
| 15 | File checks | The 10 MB limit and the file type list exist only in the browser. | `src/routes/quality.applications.$id.tsx:416`, `:421` |
| 16 | Custody content | The client decides the action text, the location and that the seal is intact. | `src/routes/quality.samples.$id.tsx:142`, `:152` |
| 17 | Certificate validity on the public page | Worked out in the browser from the device clock. A wrong clock shows a wrong answer. | `src/routes/verify.$hash.tsx:37` |
| 18 | Counts and audit | Dashboard counts and the audit list are computed in the browser from the first 100 rows. They look complete when they are not. | `src/lib/api/quality-queries.ts:71`, `src/routes/quality.audit.tsx:35` |
| 19 | Staff page | `/staff/compliance-vetting` is gated on `user.is_staff` in the client. The value comes from the server, which is right, but the gate itself is only a hidden page. | `src/routes/staff.compliance-vetting.tsx:410` |

What is done right: approve, reject, verify document, clear flag and revoke are shown from `can.decide`, which comes from the server (`src/routes/quality.applications.$id.tsx:69`, `src/routes/quality.certificates.$id.tsx:53`). Use that pattern for everything, with one permission per action and per record.

---

## The ten riskiest problems

| No. | Problem | File and line | Why it is a risk |
|---|---|---|---|
| 1 | Users choose their own role at sign in and the choice is stored in the browser. | `src/routes/signin.tsx:148`, `src/lib/session.tsx:56`, `src/verticals/quality/store.tsx:318`, `src/verticals/export/store.tsx:217` | The pack depends on twelve fixed roles. Any role check built on this is not a control. |
| 2 | Access and refresh tokens are in `localStorage`, with no Content Security Policy and no second factor. | `src/lib/api/tokens.ts:57`, `.output/public/_headers` | One injected script gives a seven day session for a Q&C decision maker. |
| 3 | The laboratory partner records the final verdict and issues the certificate. | `src/routes/quality.samples.$id.tsx:324`, `:382` to `:388` | The pack says only Q&C decides and a PASS never leads straight to a certificate. The current screen teaches the opposite flow. |
| 4 | Success is shown before the server has answered, and buttons stay active while saving. | `src/routes/quality.samples.$id.tsx:142` to `:143`, `:283` to `:284`, `:324` to `:326`, `src/routes/quality.applications.$id.tsx:82` to `:85`, `src/routes/quality.certificates.$id.tsx:75` to `:76`, `src/verticals/quality/store.tsx:383` | A user on a weak signal believes a custody event, a result or a revoke was saved when it was not, or sends it twice. |
| 5 | Custody events carry fixed text and "seal intact" is always true. | `src/routes/quality.samples.$id.tsx:142`, `:152` | The chain of custody record is the heart of the pack. Today it records nothing that was observed. |
| 6 | Lists stop at 100 rows with no paging, and detail pages, counts and the audit view all read from those lists. | `src/lib/api/quality-queries.ts:71`, `src/routes/quality.samples.$id.tsx:65`, `src/routes/quality.audit.tsx:35` | With more than 100 records, record 101 shows "Sample not found", counts are wrong and the audit trail is incomplete, with no warning. |
| 7 | The sample page shows producer, laboratory, buyer and results to every role. | `src/routes/quality.samples.$id.tsx:125` to `:127`, `:264` | The pack forbids the supplier seeing the laboratory or assay before the decision, and proposes hiding supplier and buyer from the laboratory. One serializer mistake on the server leaks it. |
| 8 | A session cannot be refreshed once the access token lapses, and nothing is saved on the device. | `src/lib/api/client.ts:49` to `:52`, `src/components/session-timeout.tsx:34` | A sampler whose phone sleeps or loses signal for 30 minutes is signed out and loses the record. |
| 9 | No tests, no CI, lint fails with 12,009 errors, and the API address falls back to `http://localhost:8000` without warning. | `package.json:6`, `eslint.config.js:9`, `src/lib/api/config.ts:3` | Nothing stops a broken or wrongly configured build reaching users. A build without `VITE_API_URL` deploys and calls localhost. |
| 10 | Revoke and close run on one click with no reason and no confirmation, and the audit screen is not a real audit log. | `src/routes/quality.certificates.$id.tsx:75`, `src/routes/quality.nonconformities.tsx:231`, `src/routes/quality.audit.tsx:35` | The pack needs a reason on every status change and a log of every action. A slip of the finger revokes a certificate. |

---

## Shared components to build first

Build these before the screens. Each one removes repeated work from many of the 30 screens. They are listed in build order.

1. **Permissions from the server.** One hook, for example `useCan("certificate.revoke", record)`, fed by a capabilities call that returns the pack roles and per action rights. A route guard that uses it before render. A menu built from it. Remove the role picker. Used by every screen.
2. **Request helpers.** A mutation wrapper that disables the button while saving, shows success only after the server answers, maps server field errors into the form, applies a timeout and blocks a double send. A paged list hook and a single record hook so pages stop reading from 100 row lists. Used by every screen.
3. **Data table.** Server paging, sorting, filters, search, loading and empty states, and a card layout on phones in place of sideways scrolling. Used by S1, S2, S6, S7, S8, S9, S12, S13, S16, S17, S19.
4. **Form kit.** Fields on `react-hook-form` with `zod` schemas: text, number with unit, date, select, yes or no, tick with declaration text, read only filled field. Large touch targets. Used by S4, S5, S11, S15, S20, S21, S22, S23, S24.
5. **Status badge and status map.** One component and one table of labels and colours for the 15 batch statuses, the three overlays, the six partner statuses, document statuses and certificate statuses. Used by almost every screen.
6. **Record header and stage progress bar.** Shows the platform ID, status, overlays and the 15 stages. Used by S5, S16, S28.
7. **Gate decision panel.** Lists the automatic checks and evidence items, disables PROCEED while any fails and says why, and takes HOLD with reason, owner and deadline. Used by S4, S5, S7, S29.
8. **Confirm with reason dialog.** Move `ActionDialog` from the processing module to a shared folder. Used for hold, reject, revoke, suspend and close.
9. **Document upload.** Drag and drop on web, camera on phone, type and size check, progress bar, retry, "on behalf of" flag. With it a document list that shows status, number, expiry and versions, using the existing `useProtectedFile` and `Preview`. Used by S3, S9, S14, S15, S24, S25.
10. **Expiry badge and "Expiring soon" list.** Used by S1, S3, S4, S25.
11. **Audit timeline.** A paged history panel that reads a real audit endpoint for one record or for all. Used by S5 and S13 and as the history tab on every record.
12. **Masked field.** Shows a restricted value as hidden, reveals on request for allowed roles, and calls the server so the view is logged. Used by S3 and S14.
13. **Camera capture.** Takes photos from the live camera only, counts them, attaches time and position, and keeps them on the device until sent. Used by S21, S22, S20.
14. **Location capture.** Reads the device position, shows accuracy and distance from the registered site, and has no typed entry. Used by S15, S20, S21, S22.
15. **Signature pad.** Draw with a finger, store with name and time, two per handover. Used by S22, S23, S29.
16. **Offline outbox.** A service worker, a web app manifest, drafts and a send queue kept in IndexedDB, and a banner that shows "saved on this phone" and "sent". Used by S21 and S22, and it is the largest single piece of work on this list.
17. **Certificate view.** A printable page built only from server data with a QR code that points to `/verify/$hash`. Used by S8, S17, S26, S27, S28.
18. **Work queue list and global search box.** Used by S1.

Items 1 to 5 unblock the web screens. Items 13 to 16 unblock the field app and should start early because they carry the most unknowns.
