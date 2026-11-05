# API contract for Release 1

Written 2026-10-10. Read only task: the only files written are this one and `docs/mock_r1.json`. No backend code was written.

BE means the sibling Django repo `beldium-backend`. Every example response is in `docs/mock_r1.json` under the same number as the endpoint here.

## Read this first

1. **The Data Dictionary is not available to me.** PDD-015 (695 fields) is not in either repo and not in the pack folder, which holds only the Word guide and 18 pictures. What the pack does give is the record names (Figure 4), the role grid (Figure 5), the statuses (Figures 3 and 8) and the labels on the wireframes (S2, S4). So every field below carries one of three marks, and **none is confirmed against the dictionary**:
   - **EXISTING**: the name is in the BE code today and is kept.
   - **PACK LABEL**: the pack shows this field as a label on a wireframe or figure. The name is that label in snake case.
   - **PROPOSED**: my name. Check it against PDD-015 before the migration is written.
2. **Scope.** You asked for supplier, partner, batch and sample contracts here. In the pack and in `docs/work_split.md` those tables are built in Releases 2 and 3. They are contracted now so the frontend can start. Sections D to G are therefore "contract now, build later".
3. **A correction to `docs/work_split.md`.** Section 6 row 7 there says the 12 role grid is blocked on Q&C. The grid is in the pack as Figure 5 (`05_Access_by_role.png`). Only the footnotes and field level rules (PRS-014 section 5, PDD-015 sheet Role Access) are still owed. I did not edit that file because this task allows two new files only.
4. Values Q&C has not defined are never invented. They appear as `null` with `is_placeholder: true`.

## Conventions

| Item | Rule | Source |
|---|---|---|
| Base path | `/api/v1`. Auth is under `/api/v1/auth/`, Q&C under `/api/v1/quality/`. | BE `core/urls.py:7`, `:16` |
| Sign in header | `Authorization: Bearer <access>` on every call except 1, 2 and 44. | EXISTING |
| Ids | `id` is a UUID. Human numbers (`supplier_id`, `batch_id`, `sample_id`) are issued by the platform and never accepted from the client. | Ground rules |
| Times | ISO 8601 in UTC. Dates are `YYYY-MM-DD`. | EXISTING |
| Lists | `?page=1&page_size=20`, maximum 100. Answer: `{count, next, previous, results}`. | BE `common/pagination.py` |
| Errors | One shape for every error: `{"status": "failed", "message": "<plain message>", "error": {"code": "<code>", "details": <object or null>}}`. For `validation_error`, `details` maps each field name to a list of messages. | BE `common/exception_handler.py:50` |
| Wrong owner | A record the caller may not see answers 404 `not_found`, not 403, so ids cannot be probed. | Ground rules |
| Refused calls | Every 403 and every wrong owner 404 on a Q&C endpoint writes an audit entry with `outcome: "refused"`. | Pack Figure 5 |
| Legacy fields | `is_legacy` and `legacy_label` are on every sample, certificate and nonconformity answer (section I). | Decision 6 |

Common errors. Every endpoint can return these. They are not repeated below.

| Ref | HTTP | Code | Message |
|---|---|---|---|
| C1 | 400 | `validation_error` | "<field>: <first problem>" with all problems in `details` |
| C2 | 401 | `not_authenticated` | "Authentication credentials were not provided." |
| C3 | 401 | `authentication_failed` | "Given token not valid for any token type" (access token lapsed or bad) |
| C4 | 403 | `permission_denied` | "You do not have permission to perform this action." |
| C5 | 404 | `not_found` | "Not found." |
| C6 | 429 | `throttled` | "Request was throttled. Expected available in N seconds." |
| C7 | 409 | `conflict` | "The request conflicts with an existing resource." |
| C8 | 500 | `internal_server_error` | "An unexpected error occurred." |

Role codes, from Figure 5. The codes are the pack's. The long names are my reading of the guide and are PROPOSED.

| Code | Name | Code | Name |
|---|---|---|---|
| `QC` | Q&C Partner | `LAB` | Laboratory |
| `CEO` | CEO | `LOG` | Logistics (custody transport) |
| `TL` | Technical Lead | `EXP` | Export agent |
| `SUP` | Supplier | `BYR` | Buyer |
| `SMP` | Sampler | `ADM` | Beldium Admin |
| `INS` | Inspector | `LGL` | Legal Counsel |

In "Who" below, **own** means only records of the caller's own organisation, and **assigned** means only records assigned to the caller.

---

## A. Sign in and refresh

### 1. POST `/auth/token/` (EXISTING, changes)

Who: public. Throttled 10 per 15 minutes per address and 20 per hour per email.

Request:

| Field | Type | Mark |
|---|---|---|
| `email` | string, required | EXISTING |
| `password` | string, required | EXISTING |

Success 200, user with no second factor duty (today's answer, unchanged): `{"refresh": string, "access": string}`.

Success 200, user who must use a second factor (**new**): `{"second_factor_required": true, "challenge_token": string, "methods": ["totp"], "enrolment_required": boolean, "expires_in": 300}`. No tokens are issued. All fields PROPOSED.

| HTTP | Code | Message |
|---|---|---|
| 401 | `authentication_failed` | "No active account found with the given credentials" |
| 403 | `email_not_verified` | "Please verify your email address before signing in." |
| 403 | `portal_undetermined` | "Could not determine which Beldium app this request is from." |
| 403 | `portal_mismatch` | "This account belongs to a different Beldium portal." |

Rule: every user who holds any role except `SUP`, `BYR` and `EXP` must pass a second factor before tokens are issued (pack: internal and partner users). The client no longer sends or stores a chosen role. Change: the second answer shape is new. Open: TOTP app or SMS code. `methods` lets the screen handle either.

### 2. POST `/auth/token/second-factor/` (NEW)

Who: public, holder of a `challenge_token`.

Request: `challenge_token` string, `code` string of 6 digits. Both PROPOSED.

Success 200: `{"refresh": string, "access": string}`.

| HTTP | Code | Message |
|---|---|---|
| 400 | `second_factor_invalid` | "That code is not correct." |
| 401 | `challenge_expired` | "Sign in again. The code step took too long." |
| 403 | `second_factor_not_enrolled` | "Set up your second factor first." |
| 429 | `second_factor_locked` | "Too many wrong codes. Try again in 15 minutes." |

Rule: five wrong codes lock the challenge. Each failure is audited.

### 3. POST `/auth/second-factor/enrol/` (NEW)

Who: holder of a `challenge_token` with `enrolment_required: true`, or any signed in user.

Request: `challenge_token` string, optional when signed in. `method` string, `"totp"`.

Success 200: `{"method": "totp", "secret": string, "otpauth_uri": string}`. Shown once.

| HTTP | Code | Message |
|---|---|---|
| 409 | `second_factor_already_enrolled` | "A second factor is already set up for this account." |
| 401 | `challenge_expired` | "Sign in again. The code step took too long." |

### 4. POST `/auth/second-factor/enrol/confirm/` (NEW)

Request: `challenge_token` string, optional when signed in. `code` string of 6 digits.

Success 200: `{"refresh": string, "access": string, "recovery_codes": [string]}`. Recovery codes are shown once.

Errors: `second_factor_invalid` (400), `challenge_expired` (401), as in 2.

### 5. POST `/auth/token/refresh/` (EXISTING, changes later in Release 1)

Who: signed in. Today the call needs a valid access token as well as the refresh token (BE `accounts/views.py:107`). 120 per hour.

Request: `refresh` string. EXISTING.

Success 200: `{"access": string}`. Today no new refresh token is returned, so a session ends 7 days after sign in.

| HTTP | Code | Message |
|---|---|---|
| 400 | `refresh_token_required` | "Refresh token is required." |
| 401 | `invalid_refresh_token` | "Invalid or expired refresh token." |

Change planned (task G9, first to slip): the refresh token moves to an HttpOnly cookie named `beldium_refresh` (PROPOSED), the body becomes empty, and the call works after the access token has lapsed. The answer stays `{"access": string}`. Build the client so the body is optional.

### 6. POST `/auth/logout/` (EXISTING, no change)

Who: signed in. Request: `refresh` string. Success 204, no body. Error 400 `invalid_refresh_token` "Invalid or expired refresh token."

### 7. GET `/auth/me/` (EXISTING, no change to the shape)

Who: signed in, own record. Success 200: `id`, `email`, `first_name`, `last_name`, `phone_number`, `country`, `onboarding_role`, `email_verified_at`, `phone_verified_at`, `is_staff`, `created_at`. All EXISTING.

Rule: the frontend stops using `is_staff` and `onboarding_role` for any Q&C decision. Roles come from endpoint 8 only.

---

## B. Roles

### 8. GET `/quality/me/` (EXISTING, changes)

Who: any signed in user.

Success 200:

| Field | Type | Mark |
|---|---|---|
| `user_id` | UUID | PROPOSED |
| `roles` | list of `{role_code, organisation_id, organisation_name, valid_from, valid_to}` | PROPOSED |
| `permissions` | object: record type to list of actions. Actions: `create`, `read`, `update`, `approve`. Record types are the 15 rows of Figure 5 in snake case. | PROPOSED |
| `second_factor_enrolled` | boolean | PROPOSED |
| `role`, `can_review`, `can_decide`, `is_staff` | as today | EXISTING, kept for one release, then removed |

Rule: a user with no approved, in date role assignment gets `roles: []` and an empty `permissions`. The client must never fall back to a stored role. `permissions` says what the role may try. The server still checks the record on every call.

### 9. GET `/quality/roles/` (NEW)

Who: `QC`, `CEO`, `TL`, `ADM`.

Success 200: list of `{role_code, role_name, is_internal, second_factor_required, grid}` where `grid` has the same shape as `permissions` in 8. All PROPOSED. Not paged: there are always 12.

### 10. GET `/quality/role-assignments/` (NEW)

Who: `QC`, `CEO`, `TL`, `ADM`. Filters: `user_id`, `role_code`, `status`, `organisation_id`.

Success 200, paged, each row:

| Field | Type | Mark |
|---|---|---|
| `id` | UUID | PROPOSED |
| `user_id`, `user_email`, `user_name` | UUID, string, string | PROPOSED |
| `role_code` | string, one of the 12 | PACK LABEL |
| `organisation_id`, `organisation_name` | UUID or null, string | PROPOSED |
| `valid_from`, `valid_to` | date, date or null | PROPOSED |
| `status` | `pending_approval`, `active`, `ended`, `rejected` | PROPOSED |
| `granted_by`, `approved_by` | user id or null | PROPOSED |
| `created_at` | time | EXISTING pattern |

### 11. POST `/quality/role-assignments/` (NEW)

Who: `ADM`.

Request: `user_id` UUID required, `role_code` string required, `organisation_id` UUID (required for `SUP`, `SMP`, `INS`, `LAB`, `LOG`, `EXP`, `BYR`), `valid_from` date required, `valid_to` date optional. All PROPOSED.

Success 201: the row from 10 with `status: "pending_approval"`.

| HTTP | Code | Message |
|---|---|---|
| 400 | `organisation_required` | "This role needs an organisation." |
| 403 | `self_assignment` | "You cannot give a role to yourself." |
| 409 | `assignment_exists` | "This user already holds this role for this organisation." |
| 409 | `organisation_not_verified` | "The organisation is not verified, or is suspended." |

Rule: Figure 5 row "Users and roles": `ADM` creates, `TL` updates, `QC` approves, `CEO` reads. An assignment gives no access until approved.

### 12. POST `/quality/role-assignments/{id}/approve/` (NEW)

Who: `QC`. Request: `decision` (`approve` or `reject`) required, `reason` string required for reject. PROPOSED.

Success 200: the row from 10.

| HTTP | Code | Message |
|---|---|---|
| 403 | `same_person` | "You cannot approve something you submitted, or your own role." |
| 409 | `already_decided` | "This assignment has already been decided." |

### 13. POST `/quality/role-assignments/{id}/end/` (NEW)

Who: `TL`, `ADM`. Request: `reason` string required. Success 200: the row with `status: "ended"` and `valid_to` set to today. Error 409 `already_ended` "This assignment has already ended." Rule: an assignment is never deleted. Ending it removes access at the next request.

---

## C. Rule settings

Figure 5 has no row for settings. Who may read and change them is PROPOSED here.

### 14. GET `/quality/settings/` (NEW)

Who: `QC`, `CEO`, `TL`.

Success 200: `{"rule_version": string, "rule_version_effective_from": time, "results": [setting]}`. Each setting:

| Field | Type | Mark |
|---|---|---|
| `setting_key` | string | PROPOSED |
| `label` | string | PROPOSED |
| `value` | number, boolean, list or null | PROPOSED |
| `unit` | string or null | PROPOSED |
| `effective_from` | time or null | PROPOSED |
| `is_placeholder` | boolean. True means Q&C has not given the value and any check that needs it refuses to run | PROPOSED |
| `owner` | string, who decides the value | PROPOSED |
| `pending_change` | `{value, effective_from}` or null | PROPOSED |

Keys in Release 1. The first four have decided values. The rest are placeholders.

| `setting_key` (all PROPOSED) | Value | Unit |
|---|---|---|
| `certificate_validity_days` | 90 | days |
| `sampling_distance_limit_m` | 500 | m |
| `expiry_alert_days` | [90, 60, 30] | days |
| `laboratory_sees_party_names` | false | |
| `custody_time_gap_minutes` | null | minutes |
| `hold_deadline_days` | null | days |
| `gps_tolerance_site_verification_m`, `gps_tolerance_custody_m` | null | m |
| `device_clock_gap_seconds` | null | seconds |
| `borderline_rule` | null | per parameter |
| `mineral_codes` | null | list |
| `seal_number_prefix`, `assignment_number_prefix` | null | |
| `id_sequence_rule` | null | |

### 15. GET `/quality/settings/{setting_key}/changes/` (NEW)

Who: `QC`, `CEO`, `TL`. Success 200, paged, newest first: `{id, setting_key, old_value, new_value, unit, effective_from, reason, changed_by, changed_by_name, changed_at, rule_version}`. All PROPOSED. Error: C5 for an unknown key.

### 16. POST `/quality/settings/{setting_key}/changes/` (NEW)

Who: `QC`.

Request: `value` (type of the setting) required, `effective_from` time required, `reason` string required. PROPOSED.

Success 201: the change row from 15.

| HTTP | Code | Message |
|---|---|---|
| 400 | `effective_date_in_past` | "The effective date cannot be in the past." |
| 400 | `value_out_of_range` | "That value is not allowed for this setting." |
| 409 | `change_already_pending` | "A change for this setting is already waiting to take effect." |

Rule: there is no PATCH and no DELETE. A setting changes only by a new change row. Each change that takes effect makes a new `rule_version`, and every later decision stores the version it used.

---

## D. Supplier records (contract now, build in Release 2)

Figure 5 row "Supplier profile and licence": `QC` reads and approves, `SUP` creates, reads and updates own, `ADM` reads and updates, `CEO`, `TL`, `LGL` read.

Supplier fields:

| Field | Type | Mark |
|---|---|---|
| `id` | UUID | EXISTING pattern |
| `supplier_id` | string, `ASM-nnn`, issued by the platform | PACK LABEL (S2, S4) |
| `organisation_id` | UUID | EXISTING |
| `company_name` | string | PACK LABEL |
| `phone` | string, E.164 | PACK LABEL |
| `status` | `draft`, `submitted`, `approved`, `rejected`, `suspended`. The pack shows only APPROVED | PROPOSED |
| `mco_licence` | `{id, licence_number, licence_type, authority, issue_date, expiry_date, is_valid, document_id}` or null | label PACK LABEL, inner names PROPOSED |
| `mco_check` | `{id, result, checked_by, checked_at, document_id}` or null. `result`: `confirmed`, `not_confirmed` | PROPOSED |
| `mine_sites` | list of `{mine_site_id, name, latitude, longitude}` from the mining module | `latitude`, `longitude` EXISTING |
| `onboarding_decision` | `{decision, reason, decided_by, decided_at, rule_version}` or null | PROPOSED |
| `documents_summary` | `{required, checked, submitted, missing, expiring_soon}` counts | PROPOSED |
| `created_at`, `updated_at` | time | EXISTING pattern |

### 17. GET `/quality/suppliers/` (NEW)

Who: `QC`, `CEO`, `TL`, `ADM`, `LGL` all. `SUP` own. Filters: `status`, `search`, `licence_expiring_within_days`. Success 200, paged, supplier rows without `mine_sites`.

### 18. GET `/quality/suppliers/{id}/` (NEW)

Who: as 17. Success 200: the full supplier. Rule: restricted values (director ID, bank details) are never in this answer. They live in documents and follow endpoint 38.

### 19. POST `/quality/suppliers/` (NEW)

Who: `SUP`, for the caller's own organisation. One supplier per organisation.

Request: `phone` string required, `mine_site_ids` list of UUID optional. The organisation comes from the caller's role assignment, never from the body.

Success 201: the supplier with `status: "draft"` and `supplier_id` set.

| HTTP | Code | Message |
|---|---|---|
| 409 | `supplier_exists` | "Your organisation already has a supplier record." |
| 404 | `not_found` | A mine site that is not the caller's |

### 20. PATCH `/quality/suppliers/{id}/` (NEW)

Who: `SUP` own, `ADM`. Request: `phone`, `mine_site_ids`, and `submit` boolean (true moves `draft` to `submitted`). PROPOSED.

Success 200: the supplier.

| HTTP | Code | Message |
|---|---|---|
| 409 | `supplier_locked` | "This record is under review or decided and cannot be changed." |
| 409 | `documents_missing` | "Upload every required document before you submit." `details.missing` lists the document types |

### 21. POST `/quality/suppliers/{id}/licences/` (NEW)

Who: `SUP` own, `ADM`. Request: `licence_number` string, `licence_type` string, `authority` string, `issue_date` date, `expiry_date` date, `document_id` UUID (a vault document from 36). PROPOSED.

Success 201: the licence object.

| HTTP | Code | Message |
|---|---|---|
| 400 | `licence_expired` | "The expiry date is in the past." |
| 409 | `licence_number_in_use` | "This licence number is already on another supplier." |
| 409 | `document_not_usable` | "That document has not passed its checks." |

Rule: a new licence does not replace the old one. The newest in date licence is the current one.

### 22. POST `/quality/suppliers/{id}/mco-checks/` (NEW)

Who: `QC`. Request: `result` (`confirmed` or `not_confirmed`) required, `note` string, `document_id` UUID optional. Success 201: the check. Rule: manual in Release 1, as the pack audit allows. It is still a record with a person and a time.

### 23. POST `/quality/suppliers/{id}/decide/` (NEW)

Who: `QC`. Request: `decision` (`approved`, `rejected`, `suspended`) required, `reason` string required. PROPOSED.

Success 200: the supplier.

| HTTP | Code | Message |
|---|---|---|
| 409 | `licence_not_valid` | "The supplier has no MCO licence that is in date." |
| 409 | `mco_check_missing` | "Record the MCO licence check first." |
| 409 | `documents_not_checked` | "Every required document must be checked first." |
| 403 | `same_person` | "You cannot decide on a record you submitted." |
| 409 | `second_approval_pending` | "A document uploaded on behalf of this company still needs its second approver." |

Rule: gates G-01 and G-02. The decision stores the rule version.

---

## E. Partner records (contract now, build in Release 2)

Figure 5 row "Partner register": `QC` creates, reads, updates, approves. `CEO` reads and approves. `ADM` reads and updates. `TL`, `SMP`, `INS`, `LAB`, `LOG`, `LGL` read (partner roles read their own record only).

The existing `/quality/applications/` endpoints stay. An approved application becomes the start of a partner record. They get the owner scoping fix (task G1) and no shape change.

Partner fields:

| Field | Type | Mark |
|---|---|---|
| `id` | UUID | EXISTING pattern |
| `partner_id` | string, issued by the platform. Format not known | PROPOSED |
| `organisation_id`, `company_name` | UUID, string | EXISTING, PACK LABEL |
| `partner_type` | `laboratory`, `inspection_body`, `sampler`, `logistics` | PROPOSED |
| `status_code` | 1 to 6 | PACK LABEL (Figure 8) |
| `status` | `research_verified`, `qualification_in_progress`, `verified_qc_partner`, `approved_active`, `suspended`, `removed` | PACK LABEL (Figure 8) |
| `is_eligible_for_assignment` | boolean. True only at status 3 or 4 with an in date accreditation that covers the work | PACK LABEL |
| `accreditations` | list of `{id, scope, accrediting_body, accreditation_number, issue_date, expiry_date, document_id, is_current}` | PROPOSED |
| `qualification` | `{questionnaire_document_id, checklist_complete, agreement_document_id, ceo_signoff_document_id}` | PROPOSED |
| `status_history` | list of `{from_status, to_status, reason, changed_by, changed_at}` | PROPOSED |
| `quality_application_id` | UUID or null, link to the existing application | PROPOSED |

### 24. GET `/quality/partners/` (NEW)

Who: `QC`, `CEO`, `TL`, `ADM`, `LGL` all. `SMP`, `INS`, `LAB`, `LOG` own. Filters: `status`, `partner_type`, `eligible` (boolean), `accreditation_expiring_within_days`. Success 200, paged, without `status_history`.

### 25. GET `/quality/partners/{id}/` (NEW)

Who: as 24. Success 200: the full partner.

### 26. POST `/quality/partners/` (NEW)

Who: `QC`. Request: `organisation_id` UUID required, `partner_type` required, `quality_application_id` UUID optional. Success 201: the partner at `status_code: 1`. Error 409 `partner_exists` "This organisation already has a partner record of this type."

### 27. POST `/quality/partners/{id}/status/` (NEW)

Who: `QC` for every move. The move 2 to 3 also needs `CEO` (see rule).

Request: `to_status` string required, `reason` string required, `agreement_document_id` and `ceo_signoff_document_id` UUID, both required for the move to `verified_qc_partner`. PROPOSED.

Success 200: the partner.

| HTTP | Code | Message |
|---|---|---|
| 409 | `status_move_not_allowed` | "A partner cannot move from <from> to <to>." |
| 409 | `mandatory_checks_incomplete` | "Every mandatory qualification item must pass first." |
| 409 | `agreement_not_signed` | "Attach the signed agreement." |
| 409 | `ceo_signoff_missing` | "Attach the CEO sign off." |
| 409 | `accreditation_not_current` | "The partner has no accreditation that is in date." |
| 409 | `partner_removed` | "A removed partner cannot be changed." |

Rule: gate G-09. Allowed moves, from Figure 8: 1 to 2, 2 to 3, 3 to 4, 3 or 4 to 5, 5 back to 3 or 4, 4 to 6. Whether 3 or 5 may go straight to 6 is not shown and is not allowed here until Q&C says. Suspension removes the partner's access to assignments at once. `removed` is final. History is never changed. For the pilot the CEO sign off is a scanned paper document in the vault.

### 28. POST `/quality/partners/{id}/accreditations/` (NEW)

Who: `QC`, `ADM`. Request: `scope`, `accrediting_body`, `accreditation_number` strings, `issue_date`, `expiry_date` dates, `document_id` UUID. PROPOSED. Success 201: the accreditation. Errors: `document_not_usable` (409) as in 21, `accreditation_expired` (400) "The expiry date is in the past." Rule: when the newest accreditation lapses the partner is flagged and new assignments are blocked.

---

## F. Batch create (contract now, build in Release 2)

Figure 5 row "Batch declaration": `SUP` creates and reads own, no update after submit. `QC` reads and approves. `CEO`, `TL`, `ADM` read. `SMP`, `INS` read assigned.

Batch fields. Section letters are from wireframe S4.

| Field | Type | Mark |
|---|---|---|
| `id` | UUID | EXISTING pattern |
| `batch_id` | string, issued on submit. Format waits for mineral codes | PACK LABEL, format blocked |
| `supplier_id`, `company_name`, `mco_licence_number`, `phone` | read only, copied from the approved supplier (A) | PACK LABEL |
| `mine_site_id` | UUID of a registered site (B) | PACK LABEL |
| `declared_gps_latitude`, `declared_gps_longitude` | decimal, 6 places (B) | PACK LABEL |
| `distance_from_site_m` | number, worked out by the server | PROPOSED |
| `mineral_type` | string from the server's list (C) | PACK LABEL |
| `quantity_mt` | decimal, 3 places, more than 0 (C) | PACK LABEL |
| `parameters` | list of `{parameter_code, declared_value, unit}`, optional, for example `Li2O` in `%` (C) | record BATCH_PARAMETER is the pack's, names PROPOSED |
| `available_from` | date (D) | PACK LABEL |
| `storage_type` | string from a list, for example `bagged` (D) | PACK LABEL |
| `royalty_clearance_reference` | string (D) | PACK LABEL |
| `royalty_clearance_document_id` | UUID of a vault document (D) | PROPOSED |
| `declaration_points` | list of 5 booleans, all must be true to submit (E) | PACK LABEL |
| `status` | `S01` to `S15` | PACK LABEL (Figure 3) |
| `status_name` | for example `BATCH DECLARED` | PACK LABEL |
| `overlay` | null, `ON_HOLD`, `REJECTED`, `EXPIRED` | PACK LABEL |
| `is_draft`, `locked_at`, `declared_by`, `supersedes_batch_id` | boolean, time, user id, UUID or null | PROPOSED |

### 29. POST `/quality/batches/` (NEW)

Who: `SUP`. Saves a draft. Nothing is locked and no `batch_id` is issued.

Request: any of `mine_site_id`, `declared_gps_latitude`, `declared_gps_longitude`, `mineral_type`, `quantity_mt`, `parameters`, `available_from`, `storage_type`, `royalty_clearance_reference`, `royalty_clearance_document_id`, `declaration_points`, `supersedes_batch_id`. The supplier is taken from the caller.

Success 201: the batch with `is_draft: true`, `batch_id: null`, `status: null`.

| HTTP | Code | Message |
|---|---|---|
| 403 | `supplier_not_approved` | "Your company must be approved before you can declare a batch." |
| 403 | `licence_not_valid` | "Your MCO licence is not in date." |
| 404 | `not_found` | A mine site that is not the supplier's |
| 400 | `mineral_type_unknown` | "Pick a mineral from the list." |

### 30. PATCH `/quality/batches/{id}/` (NEW)

Who: `SUP` own, draft only. Request: the same fields as 29. Success 200: the batch. Error 409 `batch_locked` "This declaration is locked. A correction needs a new declaration."

Open point: Figure 5 gives the supplier create and read only. The wireframe has a Save draft button. This contract reads that as: a draft may be edited, a submitted declaration never. Confirm with Q&C.

### 31. POST `/quality/batches/{id}/submit/` (NEW)

Who: `SUP` own. Request: empty.

Success 200: the batch with `is_draft: false`, `batch_id` set, `locked_at` set, `status: "S03"`.

| HTTP | Code | Message |
|---|---|---|
| 400 | `declaration_incomplete` | "Fill in every required field and tick all five points." `details` lists the fields |
| 403 | `supplier_not_approved` | as 29 |
| 403 | `licence_not_valid` | as 29 |
| 409 | `batch_locked` | "This declaration has already been submitted." |
| 409 | `document_not_usable` | "The royalty clearance letter has not passed its checks." |
| 503 | `rule_not_set` | "Batch numbers cannot be issued yet. A Q&C setting is missing." `details.setting_key` names it |

Rule: grade and quantity lock for everyone, Q&C included. A correction is a new batch with `supersedes_batch_id`. A declared point far from the registered site does not block the submit. It is flagged to Q&C. `rule_not_set` is what the server answers while `mineral_codes` or `id_sequence_rule` is still a placeholder. Open point: the status a new batch starts in (S01 or S03) is my reading of Figure 3.

### 32. GET `/quality/batches/` (NEW)

Who: `QC`, `CEO`, `TL`, `ADM` all. `SUP` own. `SMP`, `INS` assigned. Filters: `status`, `overlay`, `supplier_id`, `mineral_type`, `is_draft`. Success 200, paged, without `parameters`.

### 33. GET `/quality/batches/{id}/` (NEW)

Who: as 32. Success 200: the full batch. Rule: the supplier's answer never holds the laboratory, the assay or any partner before the Q&C decision. Those fields are left out by the server, not hidden by the screen.

---

## G. Sample create

### 34. POST `/quality/batches/{id}/samples/` (NEW, contract now, build in Release 3)

Who: `SMP`, only the sampler named on the batch's sampling assignment. Figure 5 row "Sampling record".

Request (the Release 1 part only. Device GPS, increments, weight and the four photos belong to the Release 3 sampling record contract):

| Field | Type | Mark |
|---|---|---|
| `sample_type` | string from a list | PACK LABEL (S5) |
| `seal_number` | string | PACK LABEL |
| `conflict_of_interest_declared` | boolean, must be true | PACK LABEL |

Success 201: `{id, sample_id, batch_id, sample_type, seal_number, status, sampled_by, created_at, is_legacy: false}`. `sample_id` has the form `BD-SMP-2026-nnnnnn`.

| HTTP | Code | Message |
|---|---|---|
| 404 | `not_found` | The batch is not assigned to the caller |
| 409 | `batch_not_at_sampling` | "This batch is not at the sampling stage." |
| 409 | `batch_on_hold` | "This batch is on hold." |
| 409 | `seal_number_in_use` | "This seal number is already on another sample." |
| 400 | `conflict_of_interest_required` | "Confirm you have no conflict of interest." |
| 503 | `rule_not_set` | as 31, for `seal_number_prefix` or `id_sequence_rule` |

Rule: the Sample ID is issued by the platform from a locked counter. A seal number is used once on the whole platform.

### 35. POST `/quality/samples/` (EXISTING, changes)

Who today: miner or operator. Request today: `material` required, `lot`, `mine_site`, `origin`, `mass_kg`, `buyer_spec`. All EXISTING.

Change in Release 1: every row made here is saved with `is_legacy: true` and can never receive a Beldium verification certificate. New error on the existing certificate call `POST /quality/samples/{id}/certificate/`: 409 `legacy_sample` "A legacy sample cannot receive a Beldium verification certificate."

Open point, needs a decision: decision 6 says old samples are read only. The strict reading closes this endpoint in Release 1 (410 `legacy_closed` "Samples are now created from a batch."). That would leave no working sample flow until Release 3. This contract keeps it open and marks the rows. Say which you want.

---

## H. Document upload

Document fields:

| Field | Type | Mark |
|---|---|---|
| `id` | UUID | EXISTING pattern |
| `owner_type`, `owner_id` | `supplier`, `partner`, `batch`, `sample`, `quality_application`; UUID | PROPOSED |
| `document_type` | string from the server's list | PACK LABEL (S2) |
| `document_number` | string or null. Masked as `**********` for restricted documents unless the caller is `QC` | PACK LABEL |
| `issue_date`, `expiry_date` | date or null | PACK LABEL |
| `status` | `missing`, `submitted`, `checked` from S2, plus `rejected`, `expired` | first three PACK LABEL, rest PROPOSED |
| `version` | integer from 1 | PACK LABEL |
| `replaces_document_id`, `replacement_reason` | UUID or null, string or null | PROPOSED |
| `is_restricted` | boolean, set by the server from the type | PACK LABEL |
| `original_name` | string | EXISTING |
| `size_bytes`, `sha256`, `sniffed_type` | integer, string, string | PROPOSED |
| `scan_status` | `pending`, `clean`, `infected` | PROPOSED |
| `on_behalf_of_company` | boolean | PACK LABEL |
| `received_from` | `email`, `whatsapp`, `in_person`, or null | PACK LABEL |
| `received_date` | date or null | PACK LABEL |
| `second_approval` | `{status, approved_by, approved_at}` or null. `status`: `pending`, `approved`, `rejected` | PROPOSED |
| `uploaded_by`, `uploaded_at` | user id, time | EXISTING pattern |

### 36. POST `/quality/documents/` (NEW)

Who: `SUP` and partner roles for their own records. `QC` for any record, and only `QC` may set `on_behalf_of_company`. `ADM` for supplier and partner records.

Request, `multipart/form-data`: `file` required. `owner_type`, `owner_id`, `document_type` required. `document_number`, `issue_date`, `expiry_date` optional. `on_behalf_of_company` boolean. `received_from` and `received_date` required when `on_behalf_of_company` is true. `replaces_document_id` and `replacement_reason`, both or neither.

Success 201: the document with `scan_status: "pending"` and `status: "submitted"`.

| HTTP | Code | Message |
|---|---|---|
| 413 | `file_too_large` | "File too large; the maximum size is 10 MB." |
| 415 | `unsupported_file_type` | "Only PDF, Word, Excel, JPEG and PNG files are supported." |
| 422 | `file_type_mismatch` | "The file is not the type its name says it is." |
| 422 | `malware_detected` | "This file failed the safety scan and was not stored." |
| 409 | `duplicate_file` | "This exact file is already stored for this record." `details.document_id` |
| 403 | `on_behalf_not_allowed` | "Laboratory and inspection reports cannot be uploaded on behalf of the laboratory or inspector." |
| 400 | `received_from_required` | "Say how and when the document was received." |
| 400 | `replacement_reason_required` | "Give a reason for replacing the document." |
| 409 | `owner_locked` | "This record is locked and takes no new documents." |
| 404 | `not_found` | The owner record is not the caller's |

Rule: nothing is deleted. A replacement is a new version, and the old version stays readable. The type is read from the file's bytes, not from what the browser says. An upload on behalf of a company needs a second approver (40) before any decision can use it. ZIP files are no longer accepted, because they cannot be checked. The size limit and the type list are the server's. Change: this replaces the "one file per slot, overwritten" behaviour.

### 37. GET `/quality/documents/` (NEW)

Who: anyone who can read the owner record. Filters: `owner_type` and `owner_id` (both required unless `QC`), `document_type`, `status`, `current_only` (default true), `expiring_within_days`. Success 200, paged document rows. `GET /quality/documents/{id}/` returns one row with a `versions` list of `{id, version, uploaded_at, uploaded_by, replacement_reason}`.

### 38. GET `/quality/documents/{id}/download/` (NEW)

Who: anyone who can read the owner record. Restricted documents: `QC` only.

Success 200: the file bytes, with `Content-Disposition` and `X-Content-Type-Options: nosniff`.

| HTTP | Code | Message |
|---|---|---|
| 403 | `document_restricted` | "This document is restricted to Q&C." |
| 409 | `scan_pending` | "This file is still being checked. Try again shortly." |
| 410 | `file_quarantined` | "This file failed the safety scan and cannot be opened." |

Rule: every view and download is written to the audit log.

### 39. POST `/quality/documents/{id}/review/` (NEW)

Who: `QC`. Request: `status` (`checked` or `rejected`) required, `reason` string required for `rejected`. Success 200: the document. Errors: 409 `scan_pending` as 38. 403 `same_person` "You cannot check a document you uploaded." 409 `second_approval_pending` "The second approver has not confirmed this upload."

### 40. POST `/quality/documents/{id}/second-approval/` (NEW)

Who: the second approver. For the pilot that is the holder of `CEO` (David, proposed in decision 3, not confirmed).

Request: `decision` (`approved` or `rejected`) required, `reason` string required for `rejected`. Success 200: the document.

| HTTP | Code | Message |
|---|---|---|
| 403 | `same_person` | "The person who uploaded a document cannot be its second approver." |
| 409 | `second_approval_not_needed` | "This document was not uploaded on behalf of a company." |
| 409 | `already_decided` | "This upload has already been decided." |

### 41. POST `/quality/applications/{id}/documents/{doc}/upload/` (EXISTING, changes)

Request today: multipart `file`, with `name` and `category`. EXISTING. The path and the request stay, so the onboarding flow keeps working.

Changes: (a) only a member of the application's organisation, or `QC`, may call it. Others get 404. (b) A second upload to the same slot becomes a new version in the vault and no longer overwrites. (c) It runs the same checks and returns the same new errors as 36. (d) The answer gains `version`, `sha256`, `scan_status`.

---

## I. Audit log read

### 42. GET `/quality/audit-log/` (NEW)

Who: `QC`, `CEO`, `TL`, `LGL`. **`ADM` is refused with 403** (decision 8, pack rule AT-05).

Filters: `record_type`, `record_id`, `batch_id`, `actor_id`, `action`, `outcome`, `from`, `to`. Paged, newest first.

Each row, all PROPOSED:

| Field | Type |
|---|---|
| `id` | UUID |
| `occurred_at` | time, the server's |
| `actor_id`, `actor_name`, `actor_role_code` | user id or null for the system, string, role at the time |
| `action` | string, for example `document.uploaded`, `setting.changed`, `role_assignment.approved` |
| `record_type`, `record_id`, `record_label` | string, UUID, the human number |
| `batch_id` | string or null |
| `outcome` | `success` or `refused` |
| `reason` | string or null |
| `before`, `after` | object or null. Restricted values are masked |
| `ip_address` | string |
| `rule_version` | string or null |

| HTTP | Code | Message |
|---|---|---|
| 403 | `audit_log_closed` | "Your role does not have access to the audit log." |
| 400 | `date_range_too_wide` | "Ask for 366 days or fewer at a time." |

Rule: there is no create, update or delete endpoint. Reading the log is itself logged. `GET /quality/audit-log/{id}/` returns one row.

Existing endpoints that change with it:

| Endpoint | Change |
|---|---|
| `GET /quality/samples/`, `/quality/applications/` and their detail calls | The `audit` list inside each record stays for legacy rows but is returned empty to any role without audit log access. New records have no `audit` list. Use 42 with `record_id`. |
| `GET /mining/audit/`, `GET /processing/audit/` | Closed to the Admin role (task G10). Same 403 `audit_log_closed`. |

---

## J. Legacy flag display

Two fields are added to every answer that carries a sample, a certificate or a nonconformity:

| Field | Type | Mark |
|---|---|---|
| `is_legacy` | boolean. True for every row that exists before Release 1, and for every row made by endpoint 35 | PROPOSED (named in the backend audit) |
| `legacy_label` | `"Legacy, not verified"` or null. The screen prints this text as given | PROPOSED |

### 43. GET `/quality/samples/`, `/quality/certificates/`, `/quality/non-conformities/` and their detail calls (EXISTING, change)

Who and shape: as today, with the owner scoping fix. One further fix from the backend audit: nonconformities are no longer readable by every signed in user.

Certificates also gain `display_status` (PROPOSED), worked out by the server so the screen never uses the device clock: `legacy_not_verified`, `issued`, `expired`, `suspended`, `revoked`. The stored `status` (`active`, `revoked`, `draft`) is still returned.

Write calls on a legacy row answer 409 `legacy_read_only` "Legacy records are read only." This covers custody, test request, results, review and nonconformity actions on rows that existed before Release 1. Revoke stays allowed.

### 44. GET `/quality/certificates/verify/{verification_hash}/` (EXISTING, changes)

Who: public, no sign in. 10 per minute per address.

Success 200:

| Field | Type | Mark |
|---|---|---|
| `reference`, `sample_reference`, `material`, `issued_at`, `valid_until`, `status` | as today | EXISTING |
| `display_status` | as in 43 | PROPOSED |
| `is_legacy`, `legacy_label` | as above | PROPOSED |
| `is_beldium_verification` | boolean. False for every legacy certificate | PROPOSED |
| `checked_at` | time, the server's | PROPOSED |
| `scans` | integer, today's field. Whether the public may see it is open decision OD-11 | EXISTING, may be removed |

| HTTP | Code | Message |
|---|---|---|
| 404 | `not_found` | "Certificate not found." |
| 429 | `throttled` | C6 |

Rule: a legacy certificate is never shown as a Beldium verification certificate. The page shows `legacy_label` and `display_status: "legacy_not_verified"` whatever the stored status. A certificate past `valid_until` answers `expired` even before the expiry job exists, because the server compares the date on each call.

---

## Existing endpoints that change, in one place

| Endpoint | Change | Section |
|---|---|---|
| POST `/auth/token/` | Second answer shape when a second factor is due | 1 |
| POST `/auth/token/refresh/` | Cookie and no access token needed, when G9 lands | 5 |
| GET `/quality/me/` | Adds `roles`, `permissions`, `second_factor_enrolled` | 8 |
| POST `/quality/samples/` | Rows marked legacy | 35 |
| POST `/quality/samples/{id}/certificate/` | 409 `legacy_sample`, and refused unless every result is a pass (task G1) | 35 |
| POST `/quality/applications/{id}/documents/{doc}/upload/` | Scoped, versioned, checked | 41 |
| GET samples, certificates, nonconformities | `is_legacy`, `legacy_label`, `display_status`, `audit` emptied for some roles | 42, 43 |
| GET `/quality/certificates/verify/{hash}/` | Legacy and server side status | 44 |
| GET `/mining/audit/`, `/processing/audit/` | Closed to Admin | 42 |
| Every quality write call | Wrong owner now answers 404 | Conventions |

No change: POST `/auth/logout/`, GET `/auth/me/`, the notification endpoints, the buyer specification read calls.

## Questions this contract leaves open

1. Can PDD-015 be put in BE `docs/`? Every PACK LABEL and PROPOSED name should be checked against it before a migration is written.
2. Second factor: authenticator app or SMS code?
3. Who reads and changes settings? Figure 5 has no row for them.
4. Endpoint 35: keep the old sample endpoint open with legacy marking, or close it?
5. Endpoint 30: may a supplier edit a draft declaration?
6. Endpoint 31: does a new batch start at S01 or S03?
7. Endpoint 27: may a partner go straight from 3 or 5 to removed?
8. Supplier statuses other than APPROVED, and the partner ID format.
9. OD-11: what the public check page may show, including the scan count.
