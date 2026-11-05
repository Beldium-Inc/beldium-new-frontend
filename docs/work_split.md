# Work split for Release 1: Gbemileke and Emmanuel

Written 2026-10-10. Read only task: nothing was changed except this file.

FE means this repo (`beldium-new-frontend`). BE means the sibling Django repo (`beldium-backend`).

## Read this first

1. **Sources.** `docs/audit_frontend.md` (FE), `docs/audit_backend.md` (it lives in BE, not here), and for the Release 1 plan: Figure 10 of the Build Pack guide, step 5 of `QC_PACK_AUDIT.md`, list b "R1. Foundation" in the backend audit, and the ground rules in BE `CLAUDE.md`. **There is no file called "Release 1 plan" in either repo or in the pack folder.** If one exists elsewhere, check section 1 against it.
2. **Q&C promised dates.** None is written down in either repo, in the pack, or in the ground rules summary of the 6 October reply. Section 6 says "not on record" for every item. I did not invent dates.
3. **Week dates are my proposal.** W1 starts Monday 12 October 2026. Sizes are developer days as a range, estimated from the audits, not measured.
4. **Release 1 is the Foundation release**: 12 roles and access grid, second factor, one append only audit log, settings with rule versions, ID counters, document vault with scan and fingerprint, legacy marking, SMS, CI, backup and restore proof. It builds no batch and no gate. Those are Releases 2 to 4, still inside the pilot.
5. **The quality app grows in place.** `QC_PACK_AUDIT.md` step 4 proposed a new `qc` app. The ground rules overrule that. All new tables go in `quality`.

State of the branches today, which section 4 has to fix on Day 0:

| Repo | Finding |
|---|---|
| BE | `origin/staging` is 25 commits behind `origin/main` (last commit 1 October). |
| BE | Working tree on `fix/deploy-wait-timeout` has uncommitted edits in `compliance/` and `logistics/`, and an untracked migration `compliance/migrations/0005_application_sector.py`. |
| BE | Tests run only on push to `main` and `staging` (`.github/workflows/deploy.yml:8`). A pull request gets no check. |
| FE | There is no `staging` branch. `feat/processing-compliance-frontend` is 6 ahead of and 10 behind `main`, with 10 modified files uncommitted. |
| FE | `AGENTS.md` forbids rewriting pushed history because of Lovable. This changes the daily rule for FE (section 4). |

---

## 1. Task lists for Release 1

### Person 1: Gbemileke (backend only)

He is the only person who edits `quality/` and the only person who creates migrations in Release 1. New module names below are proposals, chosen so new work does not all pile into `quality/views.py`.

| Order | Task | Days | Depends on | Files he owns |
|---|---|---|---|---|
| G1 | Close the open doors in today's quality endpoints. Scope writes to the owner (`get_queryset` returns all rows on writes). Make role derivation read `verification_status` and suspension. Refuse a certificate when any result is fail, pending or missing, or the review is not pass. Make `test-request` and `review` refuse a repeat call. Lock quality admin classes: no add, change or delete. Wrong role and wrong owner test for each endpoint touched. No migration. | 3 to 5 | Nothing | `quality/views.py`, `quality/services.py`, `quality/admin.py`, `quality/tests.py`, new `quality/test_access.py` |
| G2 | Legacy marking. `is_legacy` on `Sample`, `Certificate`, `QualityNonConformity`, true for every existing row (data migration). `Certificate.sample` to PROTECT. `verification_hash` unique, after a check for duplicates. Public verify answers "legacy, not verified" and compares `valid_until` with the server date. Migration `quality 0005`. | 2 to 3 | G1 merged | `quality/models.py`, `quality/migrations/0005_*`, `quality/serializers.py`, `quality/views.py` |
| G3 | Roles. Tables for the 12 roles, role assignment and the access grid as data. One permission function used by every view. `GET /quality/me/` returns roles and per action rights. Admin and Q&C operator become different roles. Migration `quality 0006`. | 5 to 7 | G2 merged. The role grid from Q&C (section 6, row 7) | `quality/models.py`, `quality/migrations/0006_*`, new `quality/roles.py`, new `quality/permissions.py`, `quality/views.py`, `quality/serializers.py`, new `quality/test_roles.py` |
| G4 | Audit log. One append only table: actor id and role at the time, action, record, before and after, address, outcome including refused. No update or delete in the model, the admin or the database (a PostgreSQL trigger). One write function. A paged read endpoint closed to the Admin role. Migration `quality 0007`. | 4 to 6 | G3 merged. E3 (PostgreSQL in CI) to test the trigger | `quality/models.py`, `quality/migrations/0007_*`, new `quality/audit_log.py`, `quality/views.py`, `quality/urls.py`, new `quality/test_audit_log.py` |
| G5 | Settings. Setting, change log and rule version tables. Seed the decided values: validity 90 days, distance 500 m, alerts 90, 60, 30, laboratory sees names off. Seed every undefined rule as a named placeholder with owner and a TODO. Replace the hardcoded 365 days. Migration `quality 0008`. | 3 to 4 | G4 merged | `quality/models.py`, `quality/migrations/0008_*`, new `quality/rules.py`, `quality/views.py`, new `quality/test_rules.py` |
| G6 | ID counter. A locked counter row per prefix and year, with retry. Formats read from settings. Final formats are blocked (section 6, rows 1 and 2). Migration `quality 0009`. | 2 to 3 | G5 merged | `quality/models.py`, `quality/migrations/0009_*`, new `quality/ids.py`, new `quality/test_ids.py` |
| G7 | Document vault. Vault document (version, replaces, SHA 256, size, sniffed type, scan status, on behalf of, channel) and second approval. A replacement is a new version. No delete. Calls Emmanuel's `inspect_upload` (E5). Migration `quality 0010`. | 5 to 7 | G6 merged. E5 interface agreed (Day 2), real scanner not needed to start | `quality/models.py`, `quality/migrations/0010_*`, new `quality/vault.py`, `quality/views.py`, `quality/serializers.py`, new `quality/test_vault.py` |
| G8 | Second factor at sign in for internal and partner users, enforced before tokens are issued. Migration `accounts 0009`. | 4 to 6 | E3 and E6 merged (Emmanuel is out of `accounts/`). Decision: TOTP app or SMS code | `accounts/models.py`, `accounts/migrations/0009_*`, `accounts/views.py`, `accounts/serializers.py`, `accounts/urls.py`, new `accounts/test_second_factor.py` |
| G9 | Refresh token in an HttpOnly cookie, and refresh that works after the access token has lapsed for partner field roles. First to drop if Release 1 runs long. | 2 to 3 | G8 merged | `accounts/views.py`, `accounts/serializers.py` |
| G10 | Harden the shared audit table. `AccountAuditEvent` keeps a text copy of the actor (migration `accounts 0010`). Admin classes for audit rows in accounts and marketplace lose add, change and delete. `/mining/audit/` and `/processing/audit/` closed to the Admin role. | 2 to 4 | G3 and G9 merged. E3 merged (the user delete commands change there) | `accounts/models.py`, `accounts/migrations/0010_*`, `accounts/admin.py`, `marketplace/admin.py`, `mining/views.py`, `processing/views.py` |

Total: 32 to 48 days. That is about 7 to 10 weeks for one person. The pack audit guessed 5 backend weeks plus 2 CTO weeks for this release.

### Person 2: Emmanuel (frontend, deployment, CI, outside services, Q&C)

| Order | Task | Days | Depends on | Files he owns |
|---|---|---|---|---|
| E1 | Day 0 landing. Commit and merge the uncommitted work in both repos, including `compliance 0005`. Bring BE `staging` level with `main`. Create FE `staging`. Protect `main` and `staging` in both repos. | 0.5 to 1 | Nothing | BE `compliance/`, `logistics/` (this once). FE the 10 modified files |
| E2 | FE gate. Ignore `.claude`, `Beldium-Miner-Hub`, `llogisticsportal` in lint. One formatting commit, alone. Workflow for lint, type check and build on every pull request. Deploy `staging` to a staging worker. Track `.env.example`. Fail the build when `VITE_API_URL` is missing. | 2 to 4 | E1 | FE `eslint.config.js`, `.gitignore`, `.env.example`, new `.github/`, `src/lib/api/config.ts` |
| E3 | BE gate and deploy safety. New workflow that tests every pull request on PostgreSQL and runs `makemigrations --check`. `CODEOWNERS` from section 2. Delete the `Procfile`. Environment guard on every destructive or account creating command. Fast password hasher in tests. Upload tests write to a temporary folder. | 3 to 5 | E1 | BE new `.github/workflows/test.yml`, new `.github/CODEOWNERS`, `.github/workflows/deploy.yml`, `Procfile`, `deploy/`, `core/settings.py`, `common/management/`, `accounts/management/commands/`, `mining/tests.py`, `processing/tests.py`, `logistics/tests.py` |
| E4 | Start every outside service on Day 1, because the waiting is not ours to control. Apply for the Termii sender ID. Choose the virus scanner. Book the penetration test. Shortlist the e signature method (needed in Release 4, chosen now). Ask who can run the AWS backup checks. | 2 to 4 of work, then waiting | Nothing | No code |
| E5 | Upload inspection. One function, `inspect_upload(file)`, that returns SHA 256, size, sniffed type and scan status. Agree the signature with Gbemileke on Day 2, ship a version that reads the bytes first and the scanner second. `nosniff` on served files. | 3 to 5 | E4 scanner choice | BE new `common/scanning.py`, `common/files.py`, `common/tests.py`, `requirements.txt`, `Dockerfile`, `deploy/ecs/` |
| E6 | SMS path. A general send function with a delivery record, behind an on and off setting so no code change is needed when the sender ID is approved. Pass the Termii values to the containers. | 2 to 3 | E3 merged. Live sending waits for sender ID approval | BE new `common/sms.py`, `accounts/tasks.py`, `core/settings.py`, `deploy/ecs/config.json` |
| E7 | Safety fixes in today's Q&C pages. Success shown only after the server answers. Buttons disabled while saving. Reason and confirmation on revoke and close. Remove the partner's verdict and issue certificate controls. Use `apiFetchBlob` for the one raw download. | 2 to 3 | E2 | FE `src/routes/quality.*.tsx`, `src/verticals/quality/store.tsx` |
| E8 | Shared parts 2, 3, 4, 5 and 8 from the frontend audit: request helpers, data table with server paging, form kit, status map, shared confirm with reason dialog. | 9 to 14 | E2 | FE new `src/components/shared/`, `src/lib/api/client.ts`, `src/lib/api/queries.ts`, `src/verticals/quality/ui.tsx`, `src/verticals/processing/bpc.tsx` |
| E9 | Permissions from the server. `useCan`, menu and guards from `/quality/me/`. Remove the role picker and both stored role fallbacks. | 4 to 6 | G3 contract on Day 1, G3 on staging to finish | FE `src/routes/signin.tsx`, `src/lib/session.tsx`, `src/lib/auth.tsx`, `src/routes/quality.tsx`, `src/verticals/quality/shell.tsx`, `src/verticals/quality/store.tsx`, `src/verticals/export/store.tsx` |
| E10 | Legacy marking on certificates, the miner's certificate list and the public check. Status from the server, not the device clock. | 1 to 2 | G2 on staging | FE `src/routes/quality.certificates.*.tsx`, `src/routes/verify.$hash.tsx` |
| E11 | Screens S12 Users and roles, S13 Audit log on the real endpoint, S11 settings page with change history. | 6 to 9 | G3, G4, G5 on staging. E8 | FE new `src/routes/quality.users.tsx`, `src/routes/quality.audit.tsx`, new `src/routes/quality.settings.tsx`, `src/lib/api/quality.ts`, `src/lib/api/quality-queries.ts`, `src/lib/api/types.ts` |
| E12 | Document upload component and versioned document list for the vault. | 3 to 5 | G7 on staging. E8 | FE new `src/components/shared/document-upload.tsx`, `src/components/file-preview.tsx` |
| E13 | Second factor step at sign in. Access token in memory only. Content Security Policy and security headers at Cloudflare. | 4 to 6 | G8, G9 on staging | FE `src/routes/signin.tsx`, `src/lib/api/tokens.ts`, `src/lib/api/auth.ts`, `src/components/session-timeout.tsx`, `public/_headers` |
| E14 | Backup proof. Confirm RDS backups and S3 versioning. Restore a backup into a throwaway database once and write down the time it took. | 1 to 2 | AWS access | No code. Commands are in BE `QC_FAULT_PROBE_REPORT.md` part C |
| E15 | Penetration test on staging once G1 to G4 are there. Triage the findings into the two task lists. | 2 to 5, plus the tester's time | G4 on staging, E13 | No code of his own |
| E16 | Q&C coordination. Chase section 6 every week. Get PRS-014 and PDD-015 into BE `docs/`. Get every promised date in writing. | 0.5 a week | Nothing | BE `docs/` |

Total: 44 to 69 days, against 32 to 48 for Gbemileke. Emmanuel is the overloaded one. See risk 4.

---

## 2. File ownership

Rule: one owner per row per week. The other person does not edit it, not even a one line fix. He asks the owner in the team chat and the owner makes the change.

| Area | W1 (12 Oct) | W2 | W3 | W4 | W5 | W6 | W7 and after |
|---|---|---|---|---|---|---|---|
| BE `quality/` (all files, all migrations) | G | G | G | G | G | G | G |
| BE `accounts/` | E | E | nobody | nobody | G | G | G |
| BE `common/` | E | E | E | E | E | E | E |
| BE `core/` (`settings.py`, `urls.py`, `celery.py`) | E | E | E | E | E | E | E |
| BE `deploy/`, `.github/`, `Dockerfile`, `Procfile`, `requirements.txt` | E | E | E | E | E | E | E |
| BE `mining/`, `processing/` | E (tests only) | E (tests only) | nobody | nobody | nobody | nobody | G (audit views) |
| BE `logistics/`, `compliance/` | E (Day 0 landing, tests) | nobody | nobody | nobody | nobody | nobody | nobody |
| BE `marketplace/admin.py` | nobody | nobody | nobody | nobody | nobody | nobody | G |
| BE `organisations/`, `ecosystem/`, `finance/`, `export/`, `warehousing/`, `careers/` | nobody in Release 1 | | | | | | |
| FE, the whole repo | E | E | E | E | E | E | E |

Where both need the same app:

| App | Who goes first | Who waits | The handover |
|---|---|---|---|
| `accounts` | Emmanuel: command guards (E3) and `accounts/tasks.py` (E6), W1 and W2 | Gbemileke waits for G8 | Emmanuel says "accounts is yours" in chat when both pull requests are merged. Gbemileke does not open an accounts branch before that. If Emmanuel is not done by Friday of W2, E6 moves to `common/sms.py` only and the `accounts/tasks.py` edit is handed to Gbemileke. |
| `mining`, `processing` | Emmanuel: test files only, W1 and W2 | Gbemileke waits for G10 | Different files, but same app, so the same rule applies. |
| `quality` and `compliance` | Emmanuel lands `compliance 0005` on Day 0 | Gbemileke owns `quality/bridge.py`, which reads compliance | Emmanuel does not touch compliance again in Release 1. |
| `core/settings.py` | Emmanuel always | Gbemileke | Gbemileke sends the exact lines he needs. Emmanuel merges them the same day. |
| `requirements.txt` | Emmanuel always | Gbemileke | Gbemileke lists the packages he will need by Day 2. Emmanuel adds them in one pull request. |
| `common/scanning.py` | Emmanuel writes it | Gbemileke calls it from `quality/vault.py` | The function signature is fixed on Day 2 and does not change without both agreeing. |

---

## 3. Migration rule

1. Only one person creates migrations in an app at a time. In Release 1 that person is Gbemileke for `quality` and `accounts`. Emmanuel creates none after the Day 0 landing of `compliance 0005`.
2. Only one migration branch per app is open at a time. The next one is not created until the last one is merged into `staging`.
3. Create the migration last: rebase on `staging` first, then run `makemigrations`. Never hand number a file.
4. Never edit a migration that is already on `staging`. A fix is a new migration.
5. If your number is taken after a rebase: delete your own unmerged migration file, rebase, run `makemigrations` again.
6. Every migration must work with the old code still running, because the deploy runs `migrate` before the new code is live (`deploy.yml:99`). Add columns as nullable or with a default. Do not drop or rename a column in Release 1. The JSON fields on `Sample` stay.
7. A data migration and a schema change go in separate files in the same pull request.

Merge order for Release 1:

| Order | Migration | Task | Author |
|---|---|---|---|
| 0 | `compliance 0005_application_sector` (exists, uncommitted) | E1 | Emmanuel, Day 0 |
| 1 | `quality 0005` legacy flag, PROTECT, unique hash, with data migration | G2 | Gbemileke |
| 2 | `quality 0006` roles, assignments, access grid, seed of the 12 roles | G3 | Gbemileke |
| 3 | `quality 0007` audit entry and its trigger | G4 | Gbemileke |
| 4 | `quality 0008` settings, change log, rule version, seed | G5 | Gbemileke |
| 5 | `quality 0009` ID counter | G6 | Gbemileke |
| 6 | `quality 0010` vault document, second approval | G7 | Gbemileke |
| 7 | `accounts 0009` second factor | G8 | Gbemileke |
| 8 | `accounts 0010` audit actor copy | G10 | Gbemileke |

Order 1 goes before everything else in quality on purpose: every existing row must be marked legacy before any code can create a new style certificate. No Release 2 branch creates a migration until order 6 is on `staging`, because Release 2 tables point at the Release 1 tables.

---

## 4. Merge order and the daily rule

### Day 0, once (Emmanuel)

BE, bring `staging` level with `main`:

```bash
git fetch origin
git checkout staging
git merge --ff-only origin/main
git push origin staging
```

FE, create `staging`:

```bash
git fetch origin
git checkout -b staging origin/main
git push -u origin staging
```

Then land the uncommitted work in each repo through a pull request into `staging`.

### Starting a task

```bash
git fetch origin
git checkout -b feat/g2-legacy-flags origin/staging
```

### Every morning, BE (both people, own branch only)

```bash
git fetch origin
git rebase origin/staging
python manage.py makemigrations --check --dry-run
python manage.py test quality
git push --force-with-lease
```

Change `quality` to the app you are working in. `--force-with-lease` is for your own task branch only. Never force push `staging` or `main`.

### Every morning, FE (Emmanuel)

FE must not rewrite pushed history (`AGENTS.md`), so FE merges and never rebases a pushed branch:

```bash
git fetch origin
git merge origin/staging
bun run lint && bunx tsc --noEmit && bun run build
git push
```

### Merging

1. Every change reaches `staging` through a pull request with green checks and a review by the other person.
2. A branch lives two working days at most before its pull request is opened. Small pull requests, one task or part of a task each.
3. Pull requests with a migration merge one at a time, in the section 3 order. The author says "merging quality 0006" in chat, merges, and the other person rebases before his next push.
4. Backend first, frontend second: a frontend change that needs a new endpoint merges only after that endpoint is on staging. The other way round for removals: the frontend stops calling an endpoint before the backend removes it.
5. `staging` to `main` is Emmanuel's job, once a week, after a walk through on the staging site:

```bash
git fetch origin
git checkout main
git merge --ff-only origin/staging
git push origin main
```

Order of the first merges into `staging`: E1, then E3 and E2 (so every later pull request runs under the new checks), then G1, then the migrations in the section 3 order with E5, E6 and the frontend tasks fitted around them.

---

## 5. The first three days, with no waiting on each other

| Day | Gbemileke | Emmanuel |
|---|---|---|
| Mon 12 Oct | Start G1 on a branch from `staging` as soon as E1 is pushed (a morning). Post the planned shape of the `/quality/me/` answer in chat so E9 can start against it. | E1 in the morning. Then send the four outside requests of E4. Send Q&C the section 6 list and ask for a date on each line. |
| Tue 13 Oct | G1: write scoping and the wrong owner tests. Send Emmanuel the package list. Agree the `inspect_upload` signature. | E3: pull request workflow on PostgreSQL, `CODEOWNERS`, delete the `Procfile`. Agree the `inspect_upload` signature. |
| Wed 14 Oct | G1: certificate block, repeat call refusals, admin lock. Open the pull request. | E2: lint ignore list, the one formatting commit, FE workflow. Start E7. |

Nothing in these three days needs the other person's code. The only shared moments are E1 on Monday morning and two short agreements on Tuesday.

---

## 6. Looks like backend work, but blocked on Q&C

"Promised date: not on record" means no date exists in any file I could read. Emmanuel gets each date in writing (E16) and fills this table in. The Q&C owner is the Q&C Partner, Mr Imala, unless he names someone else. David owns the two items marked with his name in the ground rules.

| No. | Item owed by Q&C | Backend task it blocks | What we build meanwhile | Status | Q&C owner | Promised date | Our chaser |
|---|---|---|---|---|---|---|---|
| 1 | Mineral codes, and the ID sequence rules | G6 final formats for sample, batch and certificate numbers. Release 2 batch ID | The counter and a format setting with a placeholder | BLOCKED | Q&C Partner | Not on record | Emmanuel |
| 2 | Seal prefix and assignment prefix | G6 seal and assignment number lists. Release 3 seal comparison | Placeholder setting, no numbers issued | BLOCKED | Q&C Partner | Not on record | Emmanuel |
| 3 | Custody time gap | Release 3 custody transfer check | Placeholder setting row in G5 | BLOCKED | Q&C Partner | Not on record | Emmanuel |
| 4 | HOLD deadline | Release 3 HOLD record and its deadline job | Placeholder setting row in G5 | BLOCKED | Q&C Partner | Not on record | Emmanuel |
| 5 | BORDERLINE rule for each parameter | Release 4 quality decision. Until then the only safe rule is the one in G1: no certificate unless every result is a plain pass | Placeholder setting row in G5. No comparison logic | BLOCKED | Q&C Partner | Not on record | Emmanuel |
| 6 | FAIL dispute step (window, one retest at a second laboratory) | Nothing. **Not planned and not to be built** until the rule arrives. FAIL stays final | Nothing | BLOCKED, not planned | Q&C Partner | Not on record | Emmanuel |
| 7 | The 12 role names and the access grid (PRS-014 section 5, PDD-015 sheet Role Access, with the DQ-14 correction) | G3 seed data. This one blocks Release 1 itself | The tables and the permission function, with the grid empty | BLOCKED. Asked for by Fri 16 Oct, hard stop Fri 23 Oct | Q&C Partner | Not on record | Emmanuel |
| 8 | Two other GPS tolerances, and the phone clock against server clock gap | Release 3 site verification and sampling record | Placeholder setting rows in G5 | BLOCKED | Q&C Partner | Not on record | Emmanuel |
| 9 | Who the second approver is (David proposed), and whether the laboratory names switch stays hidden | G7 second approval, G5 switch default | Build both as decided so far | Open, not blocking | David | Not on record | Emmanuel |

Rule for all of them, from the ground rules: a named placeholder setting and a TODO with the owner. No invented value and no invented logic.

---

## 7. Five ways this split can go wrong

| No. | What goes wrong | How we catch it early |
|---|---|---|
| 1 | Both people edit the same file or app in the same week. Most likely places: `accounts/` around the W2 handover, `core/settings.py`, `requirements.txt`, and a "quick fix" by Emmanuel in `quality/serializers.py` when a frontend screen needs one more field. | `CODEOWNERS` (E3) makes GitHub ask the owner for review on any pull request that touches his paths. A pull request that touches the other person's rows in section 2 is not merged, it is handed over. |
| 2 | Migrations clash or break the running code: two files with the same number, a migration built on a stale `staging`, or a change the old code cannot run against. | `makemigrations --check --dry-run` on every pull request and every morning. Tests on PostgreSQL in CI. The one at a time rule in section 3. Any branch older than two days without a pull request is raised at the morning check. |
| 3 | The frontend is built against an answer shape the backend does not ship. The risk is highest for `/quality/me/` (E9), the audit endpoint (E11) and the vault (E12). | The shape is posted before the backend work starts and copied into the pull request. `src/lib/api/types.ts` is updated the day the endpoint reaches staging. Every Friday both walk the staging site together through what merged that week. |
| 4 | Emmanuel runs out of time. He has 44 to 69 days of work against 32 to 48, and the outside services have waiting times nobody here controls. The sender ID, the scanner and the penetration test can each hold Release 1 open. | E4 goes out on Day 1. A one line status for each outside service every Friday. Trigger: if E3 and E2 are not merged by Friday of W2, hand E5 and E6 to Gbemileke (Emmanuel then stays out of `common/` for those weeks) and move S11 to Release 2. |
| 5 | Q&C answers come late, and someone fills the gap with a guessed value or builds the FAIL dispute step "to save time". Row 7 of section 6 can stop G3 in the first week. | Section 6 is reviewed every Monday with the dates Q&C gave. Review rule: a pull request that adds a rule value with no setting row and no owner is rejected. G3 can run two weeks on an empty grid, so the hard stop for row 7 is Friday of W2. |

---

## Later (after stage 10, not in this plan)

- Marketplace release gate G-11 and the link from a listing to a certificate.
- Buyer view with dispute (S27), export agent view (S28), CEO sign off screen (S29, on paper for the first batch), Legal read only view (S30).
- Reports and monthly review (S10), document vault exports (S9), export job, document view log, notification delivery log.
- Batch stages S11 to S15.
- Offline outbox for the field app (decision 2: online first for batch one).
- The FAIL dispute and second laboratory retest. Not built until Q&C sends the rule.
- Faults outside the pilot found by the audits: the marketplace payment route, ecosystem and finance with no tests, mining reference numbers that will clash, the three buyer records with no master.

Still inside the pilot but after Release 1, so not listed above: the batch, supplier and partner records (Release 2), field sampling, custody, laboratory and HOLD (Release 3), decision, evidence package and certificate (Release 4). Gbemileke stays the single owner of `quality/models.py` through all of them, which settles the `Certificate`, `Sample` and `QualityNonConformity` clashes the backend audit warns about.
