# QC Pack Audit: Beldium IT Build Pack (BLD-QC-DOC-VIS-021)

Prepared for: Mr Imala, Q&C Partner.
Audit date: 2026-10-06.
Method: code read only. README files, docs, comments and commit messages were not used as proof. One local test run was done on a throwaway copy of the backend, with no real database and no secrets.

## How to read this file

- FE means this repo, `beldium-new-frontend`. BE means the sibling Django repo, `beldium-backend`. The build pack needs both, because this repo is only the screens.
- Evidence is written as `path:line`. A bare path with no prefix is in FE.
- Status words used: BUILT AND WORKING, BUILT BUT NOT WIRED, PARTLY BUILT, NOT STARTED, CANNOT TELL.
- I used BUILT AND WORKING only when I could trace the code path from screen to API to table, or a passing test covers it.
- No scores and no percentages. Counts per status are at the end.
- No secrets are printed. Where one exists the value is written as [REDACTED].

---

## STEP 1. REPO MAP

| Item | Finding | Evidence |
|---|---|---|
| Apps in FE | Three separate front ends in one git repo: the main compliance app (7 dashboards under one router), the Miner Portal (`Beldium-Miner-Hub`) and the Logistics portal (`llogisticsportal`). | package.json:2, Beldium-Miner-Hub/package.json:2, llogisticsportal/package.json:2 |
| Front end framework | React 19, TanStack Start and Router, TanStack Query, Tailwind 4, Vite, built for Cloudflare through the Lovable config. | package.json:48, vite.config.ts:13 |
| Backend | One Django 5 style project, Django REST Framework, 14 apps (accounts, careers, common, compliance, ecosystem, export, finance, logistics, marketplace, mining, organisations, processing, quality, warehousing). | BE manage.py, BE core/settings.py:294 |
| Database models location | One `models.py` per app. Quality models are in one file. | BE quality/models.py:98 |
| Database | PostgreSQL when `DATABASE_URL` or `DB_ENGINE=postgresql` is set. SQLite otherwise. | BE core/settings.py:158 |
| Auth method | Email and password. JWT access and refresh tokens (SimpleJWT). Refresh rotation and blacklist on. Tokens kept in browser localStorage. Google and Microsoft sign in exists. | BE core/settings.py:327, BE accounts/views.py:98, src/lib/api/tokens.ts:12 |
| Deployment target | BE: Docker image to AWS ECS through GitHub Actions, with a staging branch and a main branch. FE: Cloudflare Workers style build output, no CI. | BE .github/workflows/deploy.yml:3, vite.config.ts:6 |
| Background work | Celery with Redis. One scheduled job only (logistics expiry check, hourly). | BE core/settings.py:453 |
| File storage | Local disk, or S3 when a bucket is set. Overwrite protection is on for S3. | BE core/settings.py:427 |
| How modules are organised | Each vertical has its own Django app, its own API client file in FE (`src/lib/api/<vertical>.ts`), its own query hooks and its own route group (`src/routes/<vertical>.*`). Quality is `quality`. | src/lib/verticals.ts:34, src/lib/api/quality.ts:10 |
| Mining module | Built and wired. Sites, licences, documents, inspections, samples, non conformities, production, inventory. | BE mining/models.py:104, src/routes/mining.sites.index.tsx |
| Processing module | Built and wired. Processor applications and monitoring. | BE processing/models.py, src/lib/api/processing.ts |
| Export module | Built and wired. Exporters, shipments, evidence, documents. | BE export/models.py:132, src/lib/api/export.ts |
| Quality module | Built and wired, but it models partner admission, samples and certificates only. It is not the Q&C system in the build pack. | BE quality/models.py:98, src/routes/quality.tsx:17 |
| Warehousing module | Built and wired. Facilities, lots, releases, versioned documents, certificates. | BE warehousing/models.py:127, BE warehousing/models.py:297 |
| Shared compliance layer | Yes. `compliance` app holds a generic application, documents, personnel, messages and activity. Reused by several verticals. | BE compliance/models.py:88, src/lib/api/compliance.ts:26 |
| Other modules found | Logistics, Marketplace, Ecosystem (RFQs, transactions, material batches), Finance, Careers. | BE ecosystem/models.py:224 |
| Tests | FE: none. BE: 434 tests across the apps. | see J |
| Important scope fact | FE holds no business rules. Every rule in the build pack must live in BE. This repo only holds screens, so most "NOT STARTED" rows below are NOT STARTED in BE and in FE. | src/lib/api/README.md:3 |

---

## STEP 2. CHECKLIST

### A. Foundation

| ID | Requirement | Status | Evidence | Note |
|---|---|---|---|---|
| A1 | Users and exactly 12 roles | PARTLY BUILT | BE accounts/models.py:27, BE quality/services.py:40, BE organisations/models.py:15, BE organisations/models.py:72 | A User table exists. It has no role field. Quality derives only 5 roles (operator, partner, miner, buyer, regulator) from staff flag and organisation type. None of the 12 named roles exist as such. |
| A2 | Role based access with record level scoping | PARTLY BUILT | BE quality/views.py:263, BE quality/views.py:440 | Reads are scoped by organisation: miner sees own, partner sees own, buyer sees own. But writes are not scoped (see J1). Regulator is not read only (BE quality/views.py:506, BE quality/views.py:559). No Legal or Export Agent role. Buyers can see samples, not only certificates (BE quality/views.py:275). |
| A3 | Multi factor sign in | NOT STARTED | BE accounts/views.py:98, BE accounts/services.py:14 | Sign in is email and password only. The email and phone codes are used once, at sign up. No authenticator app code or second step at login. |
| A4 | Append only audit log, every action, denied attempts, closed to Admin | PARTLY BUILT | BE quality/models.py:113, BE quality/models.py:170, BE quality/services.py:99, BE accounts/audit.py:9, BE accounts/admin.py:8 | Quality audit is a JSON list inside each application or sample, rewritten with each save. It is not a separate append only table. Rows are written by real code (BE quality/views.py:161, 228, 298, 310, 335, 358, 385, 408, 427). Not written for: certificate revoke (BE quality/views.py:454), CAPA, close and raise NCR (BE quality/views.py:505, 521, 557), downloads (BE quality/views.py:192), denied attempts (BE quality/services.py:136). A separate `AccountAuditEvent` table exists for sign in events, but it is registered in Django admin with full edit and delete (BE accounts/admin.py:8). |
| A5 | Settings in a table, dated and logged | NOT STARTED | BE quality/views.py:423, BE quality/views.py:66 | No settings table. Certificate validity is hard coded at 365 days, not 90. The 500 m, custody gap and 90, 60, 30 day alert values do not exist anywhere. |
| A6 | Notifications by email and SMS | PARTLY BUILT | BE quality/views.py:44, BE quality/models.py:239, BE core/settings.py:222, BE accounts/tasks.py:150 | Q&C notifications are in app only (database rows, bell icon in FE src/verticals/quality/bell.tsx:1). Email is configured for account codes only. SMS sending is switched off in code. |
| A7 | Workflow engine: 15 batch statuses, 3 overlays, change log with reason, 11 gates | PARTLY BUILT | BE quality/models.py:51, BE quality/services.py:115 | A small state machine exists for samples with 7 statuses. No S01 to S15, no ON HOLD, REJECTED or EXPIRED overlays as overlays, no status change log with reason, no gates G-01 to G-11. A test proves the 7 state rule (BE quality/tests.py:216). |
| A8 | Rules engine for automatic checks | NOT STARTED | BE quality/services.py:152 | One hard coded function compares a value with a min and max. There is no rules engine and nothing configurable. |

### B. Record types

IDs below use the model name in the build pack. "Where" gives the closest thing in the code.

| ID | Record | Status | Evidence | Note |
|---|---|---|---|---|
| B01 | SUPPLIER | PARTLY BUILT | BE organisations/models.py:24, BE mining/models.py:88 | Held as an Organisation of type mining company plus a mining profile. No ASM id. |
| B02 | MINE_SITE | BUILT AND WORKING | BE mining/models.py:104, BE mining/views.py:153, src/routes/mining.sites.index.tsx | Has latitude and longitude. Covered by mining tests. |
| B03 | SUPPLIER_LICENCE | BUILT AND WORKING | BE mining/models.py:236, BE mining/views.py:995 | Licence with expiry date and status. Lives in mining, not tied to a Q&C check. |
| B04 | MCO_CHECK | NOT STARTED | none | No record. |
| B05 | ONBOARDING_DECISION | PARTLY BUILT | src/lib/api/compliance.ts:79, BE quality/views.py:214 | Generic application decision exists in compliance and for Q&C partner applications. Not a supplier onboarding decision for Q&C. |
| B06 | BATCH | BUILT BUT NOT WIRED | BE ecosystem/models.py:224, Beldium-Miner-Hub/src/lib/api/ecosystem.ts:107 | A material batch table and API exist (tonnes, grade, stage). No screen in the main app uses it (no route in src/routes). Miner Hub has the client call but I found no batch screen. No declaration, no lock. |
| B07 | BATCH_PARAMETER | NOT STARTED | none | No record. |
| B08 | SITE_VERIFICATION | PARTLY BUILT | BE mining/models.py:366, src/routes/mining.inspections.tsx | Generic mining inspection. No GPS check against the site. |
| B09 | SAMPLING_ASSIGNMENT | NOT STARTED | none | No record. Partner takes a sample by creating a test request (BE quality/views.py:359). |
| B10 | SAMPLING_RECORD | PARTLY BUILT | BE quality/models.py:141, BE mining/models.py:410 | Quality `Sample` is created by a typed form (src/routes/quality.samples.index.tsx:44). No GPS, photos, seal or sampler. |
| B11 | COC_RECORD | PARTLY BUILT | BE quality/models.py:166 | Custody is a JSON list on the sample, not a header record. |
| B12 | COC_ENTRY | PARTLY BUILT | BE quality/views.py:314 | Each entry is one JSON item with one actor, a location, a seal intact flag and a hash. |
| B13 | LAB_RECEIPT | NOT STARTED | BE quality/views.py:333 | Receipt is only a status move when a partner adds a custody event. No form or record. |
| B14 | TEST_REQUEST | PARTLY BUILT | BE quality/models.py:167 | JSON object on the sample. Created by the lab partner, not by Q&C. |
| B15 | BUYER_SPEC | BUILT AND WORKING | BE quality/models.py:125, BE quality/views.py:468, BE quality/migrations/0003_seed_reference_buyer_specs.py | API and table work. Limits are a JSON list. No screen to create one (see I). |
| B16 | ASSAY_REPORT | NOT STARTED | none | No report file or record. Only result rows. |
| B17 | ASSAY_RESULT | PARTLY BUILT | BE quality/services.py:165 | JSON rows with analyte, value, unit, method, uncertainty. Uncertainty is optional. |
| B18 | QUALITY_DECISION | PARTLY BUILT | BE quality/views.py:401 | JSON object with reviewer, time, verdict, note. |
| B19 | HOLD | NOT STARTED | none | No record. |
| B20 | NCR | BUILT AND WORKING | BE quality/models.py:218, BE quality/tests.py:231 | Table, API, corrective actions and close rule work. Not linked to a sample or batch. Never created automatically. |
| B21 | EVIDENCE_ITEM | NOT STARTED | none | No record. |
| B22 | CERTIFICATE | PARTLY BUILT | BE quality/models.py:179 | Exists with hash, status and scan count. No quantity, seal, signature or QR. |
| B23 | DISPUTE | NOT STARTED | none | No record. |
| B24 | EVIDENCE_FILE | PARTLY BUILT | BE quality/models.py:196, BE warehousing/models.py:284 | File tables exist in several apps. No hash, no channel flag. Quality one is overwritten on re upload (see H3). |
| B25 | USER | BUILT AND WORKING | BE accounts/models.py:27 | Email login, UUID id. |
| B26 | AUDIT_LOG | PARTLY BUILT | BE accounts/models.py:124, BE marketplace/models.py:241 | Two small audit tables exist, for accounts and marketplace. Quality has none (see A4). |
| B27 | PARTNER | PARTLY BUILT | BE quality/models.py:98, BE organisations/models.py:15 | A partner is an application plus an Organisation of type laboratory, inspection body or compliance partner. |
| B28 | PARTNER_ACCREDITATION | PARTLY BUILT | BE quality/models.py:110, src/routes/quality.applications.$id.tsx:1 | Accreditation number and valid until sit in a JSON block on the application. No separate record, no history, no expiry job. |
| B29 | Platform made ID formats (ASM, BD-LI, BD-SMP, BLD-TR, NCR, BD-CERT, BD-SPEC-BYR, GS seal) | NOT STARTED | BE quality/models.py:16, BE quality/models.py:20, BE quality/models.py:24, BE quality/models.py:28, BE organisations/models.py:11, BE ecosystem/models.py:36 | Existing formats are `BLD-QA-SMP-YYYY-` plus 8 random hex characters, `BLD-QA-CERT-...`, `BLD-QA-NCR-...`, `BLD-ORG-...` and `BATCH-YYYY-` plus 6 hex. None match the pack. They are random, not running numbers. No seal numbers exist. |
| B30 | Every record carries a Batch ID | NOT STARTED | BE quality/models.py:141 | Quality samples carry a lot text field only. No Batch ID link on NCR, certificate, documents or audit. |

### C. Supplier and batch

| ID | Requirement | Status | Evidence | Note |
|---|---|---|---|---|
| C1 | Onboarding queue and approval decision | PARTLY BUILT | src/routes/quality.applications.index.tsx, BE quality/views.py:214, src/routes/mining.applications.index.tsx | Queue and decision work for Q&C lab partner applications and for mining applications. No supplier queue under Q&C. Decision does not need all documents verified. |
| C2 | MCO licence check | PARTLY BUILT | BE mining/models.py:236, BE mining/views.py:995 | Licence documents can be reviewed. No MCO specific check record. |
| C3 | Company file: required documents, status, number, expiry, version | PARTLY BUILT | src/lib/api/compliance.ts:229, BE compliance/models.py:88, BE mining/models.py:250 | Required document list per application exists, with status. Expiry is on mining licences. No version history (one document per type, BE compliance/models.py:111). |
| C4 | Batch declaration form with five point declaration | NOT STARTED | src/routes/quality.samples.index.tsx:44 | The only form registers a sample. No batch form, no five point declaration. |
| C5 | Grade and quantity lock on submit | NOT STARTED | BE ecosystem/views.py:86 | Material batches use a normal read write API (editable by anyone allowed). |
| C6 | Supplier cannot declare unless approved and licence valid | NOT STARTED | BE quality/views.py:280 | A miner role can register a sample with no check of approval or licence. |
| C7 | Declared GPS compared with mine site | NOT STARTED | BE quality/models.py:145 | Sample has a typed mine site text and no coordinates. |

### D. Field and chain of custody

| ID | Requirement | Status | Evidence | Note |
|---|---|---|---|---|
| D1 | Site inspection report by an inspector | PARTLY BUILT | BE mining/models.py:366, src/routes/mining.inspections.tsx | A mining inspection exists. It is not the Q&C inspector flow and has no GPS. |
| D2 | Sampling GPS from device, cannot be typed | NOT STARTED | src/routes/quality.samples.index.tsx:44 | No location read anywhere in FE (no geolocation call found). No coordinates in BE sample. |
| D3 | Sampling over 500 m raises a HOLD | NOT STARTED | none | No distance check, no HOLD. |
| D4 | At least 4 in app photos with GPS and time | NOT STARTED | BE quality/models.py:141 | No photo field and no camera code. |
| D5 | Seal number format and unique check | NOT STARTED | BE quality/views.py:327 | Only a seal intact yes or no flag. No seal number. |
| D6 | Conflict of interest tick | NOT STARTED | none | No such field. |
| D7 | Offline work and later send, original time kept | NOT STARTED | BE quality/views.py:323 | No service worker and no local store in FE. The server sets the time itself with `timezone.now()`, so an offline time could not be kept or checked. |
| D8 | Submit locks record and opens custody entry 1, named sampler only | NOT STARTED | BE quality/views.py:314 | No submit lock. Any miner, partner or operator can add custody events. |
| D9 | Two signatures per handover, giver not receiver, seal question, time gap HOLD | NOT STARTED | BE quality/views.py:321, BE quality/views.py:324 | One actor only, taken from the logged in user. No second signature, no gap check. Seal intact is asked (src/routes/quality.samples.$id.tsx:169) but a broken seal raises nothing. |
| D10 | Seal and sample ID compared across records, mismatch raises HOLD | NOT STARTED | none | No comparison code. |

### E. Laboratory and decision

| ID | Requirement | Status | Evidence | Note |
|---|---|---|---|---|
| E1 | Lab sees test request without supplier or buyer name | NOT STARTED | src/lib/api/quality.ts:168, src/lib/api/quality.ts:170 | The sample sent to the lab includes `miner_org` and `buyer_org`. |
| E2 | Sample receipt form: accept, hold, reject | NOT STARTED | BE quality/views.py:333 | No form. Receipt is a side effect of a custody event. |
| E3 | Assay upload with results table, no uncertainty goes to HOLD, assigned lab only | PARTLY BUILT | BE quality/views.py:370, BE quality/views.py:379, src/routes/quality.samples.$id.tsx:455 | Results table with value, unit, method, uncertainty exists, typed by hand. No file upload. Uncertainty may be empty and nothing happens. Any partner can edit any sample's results (see J1). |
| E4 | Parameter comparison with buyer spec, uncertainty considered, BORDERLINE rule | PARTLY BUILT | BE quality/services.py:152 | Exact rule in code: fail if value is below the minimum or above the maximum, otherwise pass; blank or non number gives pending. Uncertainty is ignored. No BORDERLINE outcome. |
| E5 | BORDERLINE goes to HOLD with reason, owner, deadline, G-06 | NOT STARTED | none | No HOLD record, no G-06. |
| E6 | FAIL is final: REJECTED, NCR auto created, supplier notified, CEO consulted, no reversal | PARTLY BUILT | BE quality/views.py:407, BE quality/services.py:121 | A review verdict of fail moves the sample to REJECTED and no status can follow it. No NCR is created, no supplier notice is sent (the review code has no notify call), no CEO step. |
| E7 | PASS leads to evidence checking, never straight to certificate | NOT STARTED | BE quality/views.py:418 | A reviewed sample can be certified at once. There is no evidence stage. |
| E8 | No user approves a record they submitted | NOT STARTED | BE quality/services.py:75, BE quality/views.py:392 | A partner may create the test request and also review it. Staff may review and issue. No same person check exists. Also the reviewer's verdict is typed, not checked against the result rows. |

### F. Evidence and certificate

| ID | Requirement | Status | Evidence | Note |
|---|---|---|---|---|
| F1 | Evidence package of 12 items | NOT STARTED | none | No record. |
| F2 | Platform checks, PROCEED at G-07 disabled on failure | NOT STARTED | none | No checks, no gate. |
| F3 | Certificate from verified data, quantity cap | PARTLY BUILT | BE quality/views.py:420 | Certificate is built from the sample by code, with nothing typed. There is no quantity on it, so no cap. It does not check that result rows pass. |
| F4 | E signature and QR code, issued certificate cannot be edited | PARTLY BUILT | BE quality/views.py:437, BE quality/views.py:424, BE quality/admin.py:27, src/routes/quality.certificates.$id.tsx:114 | No e signature. No QR image is made (FE shows the link only). The API has no edit route, only revoke. But Django admin allows editing and deleting any certificate. The hash is random, not a signature (BE quality/services.py:110). |
| F5 | Public check page, no sign in, status and limited facts | PARTLY BUILT | src/routes/verify.$hash.tsx:19, BE quality/views.py:571, BE quality/views.py:64 | Works without sign in, rate limited to 10 a minute. Shows reference, sample reference, material, dates, status. Statuses are active, revoked, draft only. No SUSPENDED. EXPIRED is worked out in the browser, not stored (src/routes/verify.$hash.tsx:37). Scan count rises on every call. |
| F6 | Automatic EXPIRED, expired blocks listing | NOT STARTED | BE quality/models.py:68, BE core/settings.py:453 | No EXPIRED status and no job for quality. No link to marketplace listing. |
| F7 | G-11 marketplace release enforced by system | NOT STARTED | BE marketplace/models.py:241 | A search of marketplace code found no reference to quality certificates. No link between quality certificates and marketplace listings was found. |
| F8 | Buyer certificate and dispute screen | PARTLY BUILT | BE quality/views.py:450, src/routes/quality.certificates.index.tsx | Buyer sees own certificates. No dispute record or screen. |

### G. Partners

| ID | Requirement | Status | Evidence | Note |
|---|---|---|---|---|
| G1 | Six partner statuses with controlled moves | PARTLY BUILT | BE quality/models.py:36, BE quality/views.py:220 | Five application statuses (submitted, in review, info requested, approved, rejected). Not the six in the pack. Only final states are guarded. |
| G2 | Qualification checklist, G-09 approval needs all checks, signed agreement, CEO sign off | PARTLY BUILT | BE quality/views.py:151, BE quality/views.py:214 | Document status review exists. The decision does not require all documents verified. No agreement, no CEO step. |
| G3 | Accreditation records with expiry | PARTLY BUILT | BE quality/models.py:110 | Only in JSON on the application. |
| G4 | Pick lists show only status 3 or 4 with current accreditation | NOT STARTED | BE quality/views.py:359 | No pick list. A partner assigns itself to a sample by creating a test request. |
| G5 | Alerts at 90, 60, 30 days, expiry blocks assignments | NOT STARTED | BE logistics/tasks.py:2, BE core/settings.py:453 | Nothing for quality. An hourly expiry job exists for logistics and could be reused. |
| G6 | Suspension removes access at once, history kept | NOT STARTED | none | No suspend status. |

### H. Document vault

| ID | Requirement | Status | Evidence | Note |
|---|---|---|---|---|
| H1 | Upload by web, phone camera, and by Q&C on behalf, with date and channel | PARTLY BUILT | src/routes/quality.applications.$id.tsx:341, BE quality/views.py:167 | Web upload works. Operator may upload (BE quality/views.py:170) but nothing records "on behalf" or channel. No multi photo phone upload. |
| H2 | Arrival checks: type, size, malware scan, hash | PARTLY BUILT | BE quality/models.py:201, BE mining/serializers.py:52, BE quality/serializers.py:202 | Extension list, 10 MB limit and a content type check exist. Content type comes from the client header, so it can be faked. No malware scan, no hash. |
| H3 | Versioned storage, nothing deleted | PARTLY BUILT | BE quality/views.py:176, BE warehousing/models.py:297, BE compliance/views.py:239 | Quality re upload overwrites the earlier file record (`update_or_create`). Personnel records are hard deleted. Warehousing has a version number per document, which could be reused. No delete route found for quality documents. |
| H4 | Restricted files masked, every view logged | NOT STARTED | BE quality/views.py:192, BE common/files.py:4 | Any permitted viewer gets the full file. Nothing is logged on view. |
| H5 | Lab and inspection reports cannot be uploaded on behalf | NOT STARTED | BE quality/views.py:170 | No rule. |
| H6 | Export of one company file and of a date range | NOT STARTED | none for Q&C | Mining has a PDF report builder that could be a pattern (BE mining/views.py:1397). |
| H7 | Backup, restore tested, second location copy | CANNOT TELL | BE docs/aws-deployment.md:207 | The code cannot show it. I would need the AWS console: backup schedule, last restore test date, and any copy in a second region. |

### I. Screens

Screen state wording: real route wired to a real API, route with mock data, or missing.

#### Q&C Workspace

| ID | Screen | Status | Screen state | Evidence | Note |
|---|---|---|---|---|---|
| I01 | Home | PARTLY BUILT | real route wired to a real API | src/routes/quality.dashboard.tsx, BE quality/views.py:73 | Shows counts of applications, samples, certificates, NCRs. No HOLDs or gates. |
| I02 | Onboarding queue | PARTLY BUILT | real route wired to a real API | src/routes/quality.applications.index.tsx | Lists lab partner applications, not suppliers. |
| I03 | Company File and documents | PARTLY BUILT | real route wired to a real API | src/routes/quality.applications.$id.tsx:341 | Document list and review per partner application. |
| I04 | Partners and qualification | PARTLY BUILT | real route wired to a real API | src/routes/quality.applications.$id.tsx | Same screen as I03. No qualification checklist or approval gate. |
| I05 | Batch workspace and gates | PARTLY BUILT | real route wired to a real API | src/routes/quality.samples.$id.tsx | Sample dossier, not a batch. No gates. |
| I06 | Assignments | NOT STARTED | missing | none | |
| I07 | HOLDs and NCRs | PARTLY BUILT | real route wired to a real API | src/routes/quality.nonconformities.tsx | NCRs only. No HOLDs. |
| I08 | Certificates | PARTLY BUILT | real route wired to a real API | src/routes/quality.certificates.index.tsx, src/routes/quality.certificates.$id.tsx | Issue and revoke work. |
| I09 | Document vault and exports | NOT STARTED | missing | none | |
| I10 | Reports and monthly review | NOT STARTED | missing | none for quality | Other verticals have report screens. |
| I11 | Buyer specifications and settings | NOT STARTED | missing | src/lib/api/quality.ts:397 | Hooks and API calls exist. No screen uses them. |
| I12 | Users and roles | NOT STARTED | missing | src/lib/api/organisations.ts:117 | Member API exists. No Q&C screen. |
| I13 | Audit log | PARTLY BUILT | real route wired to a real API | src/routes/quality.audit.tsx:36 | Merges the JSON audit lists of applications and samples. Not a log of every action. |

#### Supplier portal

| ID | Screen | Status | Screen state | Evidence | Note |
|---|---|---|---|---|---|
| I14 | My profile and documents | PARTLY BUILT | real route wired to a real API | Beldium-Miner-Hub/src/routes/portal.documents.tsx:10 | Miner portal documents are wired to mining documents. Not a Q&C company file. |
| I15 | Declare a batch | NOT STARTED | missing | none | |
| I16 | My batches and status | NOT STARTED | missing | none | Miner sees samples in the main app (src/routes/quality.samples.index.tsx). |
| I17 | My certificates | PARTLY BUILT | real route wired to a real API | src/verticals/quality/shell.tsx:59 | Miner nav includes certificates. |
| I18 | Messages and notices | PARTLY BUILT | real route wired to a real API | Beldium-Miner-Hub/src/routes/portal.notifications.tsx, src/verticals/quality/bell.tsx | |

#### Partner portal and field app

| ID | Screen | Status | Screen state | Evidence | Note |
|---|---|---|---|---|---|
| I19 | My assignments | PARTLY BUILT | real route wired to a real API | src/routes/quality.samples.index.tsx | Partner sees samples tied to its organisation. |
| I20 | Site inspection report | PARTLY BUILT | real route wired to a real API | src/routes/mining.inspections.tsx | Mining inspection screen, not Q&C. |
| I21 | Sampling record | NOT STARTED | missing | none | No phone or field app exists. |
| I22 | Custody handover | PARTLY BUILT | real route wired to a real API | src/routes/quality.samples.$id.tsx:134 | One person adds an event. No two signatures. |
| I23 | Sample receipt | NOT STARTED | missing | none | |
| I24 | Test request and assay upload | PARTLY BUILT | real route wired to a real API | src/routes/quality.samples.$id.tsx:259 | Typed results. No file upload. |
| I25 | My accreditation and documents | NOT STARTED | missing | src/verticals/quality/shell.tsx:58 | Partner nav has no applications page. |

#### Others

| ID | Screen | Status | Screen state | Evidence | Note |
|---|---|---|---|---|---|
| I26 | Public certificate check | PARTLY BUILT | real route wired to a real API | src/routes/verify.$hash.tsx | See F5. |
| I27 | Buyer certificate and dispute | PARTLY BUILT | real route wired to a real API | src/routes/quality.certificates.index.tsx | No dispute. |
| I28 | Export agent certificate and batch status | NOT STARTED | missing | none | Export vertical has shipments but no link to Q&C certificates. |
| I29 | CEO sign offs | NOT STARTED | missing | none | |
| I30 | Legal read only view | NOT STARTED | missing | none | |

### J. Cross cutting risks

Finding words used: Gap found, No gap found, Cannot tell. Risk rows are not counted in the status counts.

| ID | Risk | Severity | Finding | Evidence | Note |
|---|---|---|---|---|---|
| J1 | Write calls on samples and applications are not limited to the caller's own records. The list is scoped only for GET. For POST and PATCH the full table is returned, so a partner or miner can act on any sample. A partner who creates a test request on another lab's sample also becomes that sample's lab. | critical | Gap found | BE quality/views.py:265, BE quality/views.py:123, BE quality/views.py:359 | I read this from the code. I did not call a running server. |
| J2 | Certificate can be issued from a typed reviewer verdict, even when result rows fail. | critical | Gap found | BE quality/views.py:401, BE quality/views.py:418 | Integrity gap for the whole purpose of Q&C. |
| J3 | Audit and certificate rows can be edited or deleted in Django admin. | high | Gap found | BE quality/admin.py:27, BE accounts/admin.py:8 | |
| J4 | Endpoints with no sign in: sign up, verify, resend, login, reset flows, careers form, one organisation view, certificate verify. | low | No gap found | BE accounts/views.py:63, BE careers/views.py:54, BE organisations/views.py:364, BE quality/views.py:572 | All look intended. The organisation one (BE organisations/views.py:364) returns public headline counts only. |
| J5 | Default permission class | low | No gap found | BE core/settings.py:295 | Set to IsAuthenticated. Good. |
| J6 | Debug flags | low | No gap found | BE core/settings.py:46 | App refuses to start with DEBUG on in staging or production. The local `.env` has DEBUG true, and that file is not in git. |
| J7 | Secrets in repo | medium | Gap found | BE core/settings.py:44 | A development default for SECRET_KEY is in code: [REDACTED]. Deployed settings require a real one (BE core/settings.py:22). `.env` files are git ignored in both repos (FE .gitignore, BE .gitignore). No other keys were found in tracked files. |
| J8 | CORS | low | No gap found | BE core/settings.py:63 | Allow list from settings, with localhost entries as default. No allow all flag found. |
| J9 | Rate limits | medium | Gap found | BE core/settings.py:309, BE quality/views.py:64 | Throttles exist for sign in, sign up, codes, careers and certificate verify. None on other quality calls. In memory cache warns it will not hold across workers when no shared cache is set (system check W002, run output). |
| J10 | File upload handling | high | Gap found | BE quality/models.py:201, BE mining/serializers.py:52 | Extension and size checks, client supplied content type, no malware scan, no hash. Zip and Excel files are allowed. |
| J11 | Staging environment | low | No gap found | BE .github/workflows/deploy.yml:3 | Staging branch deploys to a staging ECS environment. |
| J12 | CI | medium | Gap found | BE .github/workflows/deploy.yml:23, no FE .github folder | BE runs all tests before deploy. FE has no CI at all. |
| J13 | Tests and result | medium | Gap found | BE quality/tests.py:53 | BE: 434 tests, all passed in my local run (about 79 seconds, in memory test database). Quality has only 8 tests. FE: no test runner installed and no test files. FE type check (`tsc --noEmit`) reported no errors. |
| J14 | Migration state | low | No gap found | BE quality/migrations/ | `makemigrations --check` reported no changes. |
| J15 | Token storage in browser | medium | Gap found | src/lib/api/tokens.ts:12 | Access and refresh tokens sit in localStorage, readable by any script on the page. No inline HTML injection was found in FE source. |
| J16 | Media file exposure in production | medium | Cannot tell | BE core/settings.py:211 | I would need to see how media is served in the deployed setup. |

---

## STEP 3. OVERLAP WITH EXISTING MODULES

| Module | Could Q&C reuse | Where it would duplicate or conflict |
|---|---|---|
| Mining | Mine site with coordinates (BE mining/models.py:104), licences with expiry (BE mining/models.py:236), inspections (BE mining/models.py:366), documents, non conformities, PDF report builder (BE mining/views.py:1397). | A second `Sample` table with its own custody list (BE mining/models.py:410) next to the quality `Sample`. A second non conformity table (BE mining/models.py:295). |
| Processing | Application and review pattern, evidence verification flow. | Its own audit and document handling. |
| Export | Shipment and document checklist. A `quality` domain label already exists (BE export/models.py:35). | Another certificate and non conformity concept (BE export/models.py:169). |
| Quality (existing) | Partner admission, buyer specs with limits, sample state machine, public verify page and throttle, bell notifications. | Its `Sample` is not the build pack batch. Its `Certificate`, NCR and audit would be replaced or extended. |
| Warehousing | Versioned documents (BE warehousing/models.py:297), facility certificate with expiry, lot with batch number, release control. | Its own `Certificate` (BE warehousing/models.py:229) and `Notification` (BE warehousing/models.py:334). |
| Ecosystem | `MaterialBatch` (BE ecosystem/models.py:224): the nearest thing to a Batch. | Different status list (8 stages), different ID format, and it has no screen. Choosing the Batch model is the biggest decision. |
| Logistics | Hourly expiry job (BE logistics/tasks.py:2) to copy for 90, 60, 30 day alerts. | Its own `Notification` table (BE logistics/models.py:521). |
| Marketplace | Listings and orders, where G-11 would plug in. | Own audit table (BE marketplace/models.py:241). |
| Accounts and organisations | User table, organisation membership, sign in throttles, email and phone code flow. | Roles are guessed from organisation type, not stored (BE quality/services.py:40). 12 roles need a real model. |

Conflicts by topic:

| Topic | Conflict |
|---|---|
| Batch | Three candidates: ecosystem `MaterialBatch`, quality `Sample.lot` text, warehousing `batch_number` text. |
| Certificate | Quality, warehousing, and an export domain label each have one. |
| Document | Four separate file tables with different rules, one with versions. |
| Audit log | Three styles: JSON lists, account table, marketplace table. |
| Roles | Five quality roles, six organisation types, fifteen membership roles, and the pack's twelve. |
| Notifications | Five separate notification tables. |

---

## STEP 4. SUGGESTED STRUCTURE

Based only on what the code supports.

| Part | Proposal | Reason |
|---|---|---|
| Module | Grow the existing `quality` Django app and `quality` FE route group. Do not start a new app. | Routes, API client, role shell and public verify page already exist and pass tests. |
| Roles | Add a real role table linked to User and Organisation, holding the 12 roles. Replace `derive_role` with it. | The current guess from organisation type cannot express Legal, Field Sampler or CEO. |
| Audit | One shared append only audit table in `common`, written from one helper. Remove admin edit and delete. Log denied attempts in the permission check. | Three audit styles exist today. One writer is the only way to prove "every action". |
| Settings | One dated settings table with change history, read through one function. | No settings exist yet. The pack needs 500 m, time gap, alert days, validity. |
| Batch | Pick one batch model before building. The code supports extending `ecosystem.MaterialBatch` (it has site, tonnes, grade) or making a new `quality.Batch`. | Needs a decision (see Step 6). |
| Records | Turn the JSON lists on `Sample` (custody, results, review, audit) into real tables. | JSON lists cannot enforce append only, uniqueness of seals, or two signatures. |
| Workflow | A status table with allowed moves, reason, user and time, plus gate checks, in `quality/services.py` beside the current `SAMPLE_TRANSITIONS`. | The sample state machine at BE quality/services.py:115 is the right seed. |
| Fix first | Scope write calls to the caller's records, and make certificate issue depend on result rows. | These are J1 and J2 and affect every later release. |
| Documents | Make one vault service in `common` with hash, scan, version and view log, starting from the warehousing version scheme. | Four upload paths exist with different rules. |
| Field app | A separate installable web app (PWA) inside the FE repo, for sampling and custody. Needs camera, location and offline storage. | None of the three exist in FE today. |
| Notifications | One service that sends email and SMS and writes the in app row. Turn SMS back on once the sender ID is approved. | SMS is switched off in BE accounts/tasks.py:158. |
| Reuse | Public verify page and throttle, bell, buyer spec limits, application review screens, logistics expiry job pattern, PDF builder. | They work today. |
| Tests | Add tests with every feature. Add FE CI. | Quality has 8 tests and FE has no CI. |

---

## STEP 5. RELEASE MAPPING

Effort is an ESTIMATE only. Assumptions:

- Team: CTO (part time on code), one backend developer, one designer.
- Figures are developer weeks of build time, counting the CTO at half a week per week.
- Includes tests, but not UAT with partners, legal review or content from Beldium.
- Mobile field app is built as a web app (PWA), not a native app.
- No new payment, SMS or malware scan vendor choices are included, only wiring.
- Ranges are wide because the pack text beyond this brief was not available to me.

| Release | Done | Partly done | Missing | ESTIMATE (dev weeks) |
|---|---|---|---|---|
| 1 Foundation | User table (A1 base), sign in with throttles, default sign in required, CI for BE, staging, 434 passing tests, migrations clean. | 12 roles (5 derived), audit log (JSON and two small tables), ID lists (random formats), document vault (4 upload paths, one with versions), notifications (in app only). | Real role model, scoped writes (J1), append only audit with denied attempts, settings table, ID generators in pack format, vault with hash and scan and view log, MFA, SMS, backup and restore proof, FE CI. | 12 to 16 |
| 2 Supplier and batch | Mine site registry, licences, onboarding queue for partners and miners, company documents, partner register, Q&C home. | Company File, onboarding decision, supplier licence check, buyer spec (no screen). | MCO check record, five point batch declaration, grade and quantity lock, approval and licence gate, GPS site compare, supplier portal screens, Batch ID on all records. | 14 to 18 |
| 3 Field to laboratory | Sample and custody basics, test request, typed results, lab role, mining inspections. | Site inspection, custody entries, test request. | Sampling assignment, phone sampling with device GPS and 4 photos, seal number rules, 500 m HOLD, offline send with time check, two signature handovers, time gap HOLD, cross record seal checks, lab receipt form, assay file upload, lab blind view, HOLD record. | 18 to 26 |
| 4 Decision and certificate | Pass or fail verdict, FAIL is final, NCR with CAPA, certificate record and public check page with rate limit, revoke. | Certificate build, public check, buyer view. | BORDERLINE rule with uncertainty, HOLD handling, auto NCR on FAIL, no self approval, 12 item evidence package and checks, gates G-01 to G-11, e signature, QR image, 90 day validity, EXPIRED job, marketplace block, dispute, CEO sign offs, Legal and Export Agent views. | 16 to 22 |
| 5 Reporting and refinement | Mining report builder pattern. | Audit screen. | Monthly review, reports, document exports, settings screens, alerts at 90, 60, 30 days, partner suspension, polish from user feedback. | 6 to 10 |
| Total | | | | 66 to 92 developer weeks. About 33 to 46 calendar weeks with two builders and the CTO helping. |

---

## STEP 6. OPEN QUESTIONS

| No | Question | Why the code cannot answer |
|---|---|---|
| 1 | Is the Q&C system a new product that replaces the current `quality` app, or an extension of it? | Both are possible in the code. |
| 2 | Which model is the Batch: `ecosystem.MaterialBatch`, a new table, or the quality sample? | Three candidates exist. |
| 3 | How exactly is BORDERLINE defined with measurement uncertainty? The code has no rule. | The pack text for the rule was not in the code. |
| 4 | Is the certificate valid 90 days (pack) or 365 days (code)? | Code says 365. |
| 5 | Who are the 12 role holders and which are Beldium staff or partners? How is a CEO or Legal user created? | No role data exists. |
| 6 | Which MFA method: authenticator app, SMS, or email code? | Nothing is built. SMS needs an approved sender ID. |
| 7 | Do Q&C users sign in on a separate address? A recent commit dropped the qac sub domain. | Hosting choice, not in code. |
| 8 | What backup schedule, restore test and second location copy exist? | Needs AWS console (H7). |
| 9 | How is media served in production, and who can open a file link? | Not visible in code (J16). |
| 10 | Is the stored audit data meant to be legal evidence? That decides whether to use a write once store. | Policy decision. |
| 11 | Which malware scanner is allowed? | Vendor choice. |
| 12 | Should the regulator role stay able to raise and close NCRs, or become read only? | Code allows writes today. |
| 13 | Can a lab see supplier and buyer names in any case? | Pack says no. Code shows both. |
| 14 | Is the field app online only at first, or must it work offline in release 3? | Large change in effort. |
| 15 | Is the Q&C flow to replace the mining sample screen and the quality sample screen, or live beside them? | Two sample tables already exist. |
| 16 | I did not run a live server. Can the team confirm J1 and J2 by calling the API on a test copy? | Read only rule for this run. |

---

## PLAIN SUMMARY

- The front end is only screens. All rules must be built in the Django backend.
- Beldium already has a working base: sign in, organisations, mine sites, licences, documents and a sample to certificate flow.
- That flow is a simpler version of the build pack. It has 7 sample states, not 15, and no gates, HOLDs or evidence package.
- Field work is not started: no GPS, photos, seals, offline mode, two signature handovers or phone app.
- Two serious gaps exist today: write calls are not limited to a user's own records, and a certificate can be issued even if the results fail.
- The audit log is not append only, no MFA exists and SMS is switched off.
- Backend tests pass (434), but quality has only 8 and the front end has none.
- A rough ESTIMATE for the missing work is 66 to 92 developer weeks.
- Four decisions come first: the Batch model, the BORDERLINE rule, the 12 role model, and the MFA method.
- Fix the two serious gaps before building anything on top.

### Count of items in each status

Total items counted: 114 (sections A to I; section J risks are not counted)

| Status | Count |
|---|---|
| BUILT AND WORKING | 5 |
| BUILT BUT NOT WIRED | 1 |
| PARTLY BUILT | 53 |
| NOT STARTED | 54 |
| CANNOT TELL | 1 |

By section:

| Section | BUILT AND WORKING | BUILT BUT NOT WIRED | PARTLY BUILT | NOT STARTED | CANNOT TELL |
|---|---|---|---|---|---|
| A | 0 | 0 | 5 | 3 | 0 |
| B | 5 | 1 | 14 | 10 | 0 |
| C | 0 | 0 | 3 | 4 | 0 |
| D | 0 | 0 | 1 | 9 | 0 |
| E | 0 | 0 | 3 | 5 | 0 |
| F | 0 | 0 | 4 | 4 | 0 |
| G | 0 | 0 | 3 | 3 | 0 |
| H | 0 | 0 | 3 | 3 | 1 |
| I | 0 | 0 | 17 | 13 | 0 |

Path of this file: /Volumes/Stark/Beldium-New/beldium-new-frontend/QC_PACK_AUDIT.md
