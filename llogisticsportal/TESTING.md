# Manual testing: Logistics Hub

About 20 minutes end to end. Test against a local backend on `main` (1c04f36 or later).

## 1. Start the backend (terminal 1)

```bash
cd /Volumes/Stark/Beldium-New/beldium-backend
git switch main && git pull
.venv/bin/python manage.py migrate
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend .venv/bin/python manage.py runserver 127.0.0.1:8000
```

The `EMAIL_BACKEND` override prints verification codes in this terminal instead of emailing them.
Use a local database only; check your backend `.env` does not point at staging or production.

## 2. Load test data (terminal 2, once)

```bash
cd /Volumes/Stark/Beldium-New/beldium-backend
LOGISTICS_SEED_PASSWORD='pick-a-test-password' .venv/bin/python manage.py shell < ../beldium-new-frontend/llogisticsportal/scripts/seed_local_backend.py
```

Accounts (all use that password): `ops@logistics.test` (approved operator), `staff@logistics.test`
(same company), `applicant@logistics.test` (no company yet).

## 3. Start the frontend (terminal 2)

```bash
cd /Volumes/Stark/Beldium-New/beldium-new-frontend/llogisticsportal
bun run dev
```

Open http://localhost:5175. Keep the browser console open (F12); any red error there is a failure.

## 4. Checklist

Sign in as **ops@logistics.test** unless a step says otherwise.

| # | Page | Do | Expect |
|---|------|----|--------|
| 1 | Sign in | Sign in | Command Centre loads; header shows VERIFIED |
| 2 | Command Centre | Look at the tiles | New requests 3, open incidents 0, one action item |
| 3 | Transport Requests | Open a Tin request, click **Accept request** | Opens a new MOV-... movement with route, mineral, buyer copied |
| 4 | Transport Requests | Open another, **Decline** with a reason | Badge shows Declined and your reason |
| 5 | Movement | **Assign**: pick KD-BUSY | Error: vehicle already on an active movement |
| 6 | Movement | Expired vehicles/drivers in the list | Shown as "credentials expired", cannot be picked |
| 7 | Movement | Assign KD-OK-1 + Driver OK | Status Assigned |
| 8 | Movement | **Update status** | Only Loading / In transit / Cancelled offered |
| 9 | Movement | In transit + an ETA, then reopen the dialog | ETA shows the same time you entered (no hour shift) |
| 10 | Movement | **Report incident** | Saved with an INC-... reference, listed on the movement |
| 11 | Movement | Status Arrived | Delivery appears with status Arrived, no received quantity |
| 12 | Deliveries | **Confirm handover** with a smaller quantity | Warning "Variance flagged for review"; row shows the variance |
| 13 | Incidents | **Resolve** the incident | Status Resolved; Command Centre open incidents goes back down |
| 14 | Compliance | **Record action** on the finding | Status Corrective action submitted |
| 15 | Documents | Operations register, **Upload document** (a PDF) then **Download** | Same file downloads with its name |
| 16 | Transactions | Open TXN-T0 | Payment PAY-... listed, part paid |
| 17 | Vehicles / Drivers | Look | Read-only with the "register is locked" note (approved operator) |
| 18 | Reports | **Generate report**, **Download CSV** | CSV downloads |
| 19 | Notifications | Tabs | Counts on Compliance and Operations activity; Mark read lowers them |
| 20 | Sign out, sign in as **staff@logistics.test** | Notifications | Your own note is still unread (reading as ops did not change it) |
| 21 | Sign in as **applicant@logistics.test** | Start application | Wizard opens; blocked at Documents until every required section has a file |
| 22 | Sign up a new account | Use the 6-digit code printed in terminal 1 | Verified, then the application wizard |

Stop at the first failure and note the step number, what you saw, and the console error.

## Known backend gaps (not frontend bugs)

- Mining approve/reject still return 500 on PostgreSQL (`mining/views.py:728`).
- Fleet changes after approval, payment actions and upstream record creation are not built yet.
