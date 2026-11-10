# Onboarding and roles: live test guide

Production test of register, join, team rights, regulator access and `me/`.
- App: https://compliance.beldium.com
- API: https://api.beldium.com
- Time: about 45 minutes.

## Before you start

- **Accounts.** You need five, all on real inboxes, since signup codes are emailed. One inbox with plus addressing is enough, for example `you+admin@gmail.com`:
  - **OP**: your Beldium staff account (`is_staff`), the operator.
  - **A**: company admin.
  - **B**: staff member.
  - **C**: regulator.
  - **D**: outsider.
- **Naming.** Start every test company and agency name with `TEST`, so you can find and clean them up later.
- **Sessions.** Use one private window per person, or sign out between them.
- **One company per sector.** Each account may own one company per sector, so for a second run use new accounts or a different sector.
- **Confirm the deploy:** https://api.beldium.com/api/v1/onboarding/options/?sector=processing should return JSON that starts with `{"sector":"processing","dashboards":[`.

## 1. Options (BE-O1)

1. Open `/onboarding/sector` and pick **Processing**.
   Expect: Register, Join and Regulatory access, plus the compliance partner side.
2. Pick **Mining**.
   Expect: Register opens the Miner Portal (`miners.beldium.com`).
3. Pick **Logistics**.
   Expect: Register opens the Logistics Portal, and there is also a "Driver" option.
4. Pick **Quality**.
   Expect: only the Q&C partner side.

## 2. Register a company (BE-O3)

As **A**: Processing > Register a processing company. Sign up and enter the emailed code.

1. Fill the Company step (name `TEST Jos Processing`) and press Next.
   Expect: it moves on. In `api.beldium.com/admin/` > Organisations, the company exists as "Processing company", with A as owner.
2. Fill Operations, then add one plant, then Representative.
   Expect: each Next saves without error.
3. On Documents, attach each required file (any PDF).
   Expect: "Selected: …" under each. A `.txt` file is refused.
4. Reload the page.
   Expect: your answers are still there, and no duplicate company appears in admin.
5. Tick the declarations, sign with your exact full name and press Submit.
   Expect: the Submitted screen. Admin shows the company "Under review".

## 3. Join by code (BE-O4, D8)

1. As **A**, open the Team page.
   Expect: the join code is visible.
2. As **B**: Processing > Join an existing processing company, then enter the code.
   Expect: "Your request to join TEST Jos Processing is waiting for approval".
3. As **B**, press **Withdraw request**, then join again.
   Expect: withdrawing works, and so does the second request.
4. As **B**, sign in while still pending.
   Expect: the pending screen only, with no company data.
5. As **A**, approve B on the Team page.
   Expect: B can now sign in and see the workspace.

## 4. Admin versus staff (section 2)

As **B** (staff):

1. Open the Team page.
   Expect: names and roles only, with no emails, no invite and no join code.
2. Try to approve, invite or change a role.
   Expect: "Only your company admin can do this", or a 403.

As **A** (admin):

3. See emails, then promote B to admin and demote B again.
   Expect: both work.
4. Try to demote or remove the last remaining admin (yourself, if A is the only one).
   Expect: refused with "last administrator". The owner row is protected anyway.

## 5. Operator verifies the company

As **OP**:

1. Open `/staff/compliance-vetting`, tab **Processing**, then **Company applications**.
   Expect: TEST Jos Processing is listed.
2. Press **Verify**.
   Expect: it leaves the queue, and admin shows it "Verified".

## 6. Regulator access (BE-O5, D9)

As **C**: any sector > Regulatory access (agency name `TEST Mines Inspectorate`).

1. Use a gmail address with no letter.
   Expect: "Attach a letter from your agency".
2. Attach a PDF letter. Ask for Mining, Export and Processing, then Send.
   Expect: the Submitted screen.
3. Sign in as C to Mining.
   Expect: "waiting for a Beldium operator", and no access.
4. As **OP**, open `/staff/compliance-vetting` > Regulator access requests > Review. Untick Processing and approve.
   Expect: "Access approved".
5. Sign in as C to Mining.
   Expect: the register can be read. Any create or edit is refused.
6. Sign in as C to Export.
   Expect: it can be read but not edited.
7. Sign in as C to Processing.
   Expect: "read-only access to Mining, Export only".
8. Make a second request with account **D** and reject it with a reason. Then sign in as D.
   Expect: "declined: <your reason>".

## 7. Outsider and suspension

1. As **D**, open A's team or application page by URL.
   Expect: nothing is shown (404).
2. As **A**, suspend B. Then sign in as B.
   Expect: "Your access to TEST Jos Processing is suspended. Ask … to restore it."

## 8. Clean up

In `api.beldium.com/admin/`:
- Set every `TEST` organisation to rejected, or delete it.
- Delete the `TEST` regulator access requests.
- Delete or deactivate the test users.
- Use the search box and filter by `TEST`.

## If something fails

Note the step number and the screen text. From DevTools > Network, note the failing request's URL, status and response body. API errors look like `{"message": …, "error": {"code": …}}`, and the `code` usually names the rule that refused it.
