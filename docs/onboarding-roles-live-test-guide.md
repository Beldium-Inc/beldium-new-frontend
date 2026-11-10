# Onboarding and roles: live test guide

Production test of the onboarding screen, compliance firm sign-up, join by code or invite, the sector lock, team rights, regulator access and `me/`.
- App: https://compliance.beldium.com
- API: https://api.beldium.com
- Time: about 45 minutes.

The compliance app's onboarding is for **compliance partners and regulators only**. Miners, hauliers, processors, exporters and buyers do not sign up here.

## Before you start

- **Accounts.** You need five, all on real inboxes, since signup codes are emailed. One inbox with plus addressing is enough, for example `you+admin@gmail.com`:
  - **OP**: your Beldium staff account (`is_staff`), the operator.
  - **A**: firm admin.
  - **B**: firm staff member.
  - **C**: regulator.
  - **D**: outsider.
- **Naming.** Start every test firm and agency name with `TEST`.
- **Sessions.** Use one private window per person, or sign out between them.
- **Confirm the deploy:** https://api.beldium.com/api/v1/onboarding/options/?sector=mining should return only `"key":"partner"` in `dashboards`.

## 1. Onboarding screen (BE-O1)

1. Open `/onboarding/sector` and pick each sector in turn.
   Expect: only the **Compliance partner** side appears, with no Mining company, Logistics company or other company card. The options are Register a new compliance firm, Join an existing compliance firm, Regulatory access, Independent compliance professional, and Join your agency's regulator account.
2. Pick **Quality**.
   Expect: the Q&C partner list (laboratory, officer, analyst and so on).

## 2. Register a compliance firm

As **A**: **Logistics** > Register a new compliance firm. Sign up and enter the emailed code.

1. Complete the firm application (name `TEST Logistics Reviewers`) and submit.
   Expect: the Submitted screen. In `api.beldium.com/admin/`, the organisation has A as owner.
2. Sign in as A under **Mining**.
   Expect: "This account is registered for Logistics Compliance".

## 3. Join by code, and the sector lock (BE-O4, D8)

1. As **A**, open the Team page and copy the join code.
   Expect: only admins can see the code.
2. As **B**: **Mining** > Join an existing compliance firm, then enter A's code.
   Expect: refused with "This belongs to a Logistics organisation. Choose Logistics on the sign-up screen to join it."
3. As **B**: go back, pick **Logistics** > Join an existing compliance firm, then enter the code.
   Expect: "Your request to join TEST Logistics Reviewers is waiting for approval".
4. As **B**, press **Withdraw request**, then ask again.
   Expect: both work.
5. As **B**, sign in while still pending.
   Expect: the pending screen only, with no firm data.
6. As **A**, approve B on the Team page.
   Expect: B signs in under Logistics and sees the workspace.

## 4. Invitations are sector locked too

1. As **A**, invite **D**'s email from the Team page.
   Expect: D receives the email.
2. As **D**, start on **Processing** (pick the sector, then open the invite link and sign up or sign in).
   Expect: "This belongs to a Logistics organisation…", and D is not added.
3. As **D**, pick **Logistics** and open the link again.
   Expect: "You have joined TEST Logistics Reviewers". No second approval is needed.

## 5. Admin versus staff (section 2)

As **B** (staff):

1. Open the Team page.
   Expect: names and roles only, with no emails, no invite and no join code.
2. Try to approve, invite, change a role or submit.
   Expect: "Only your company admin can do this", or a 403.

As **A** (admin):

3. See emails, then promote B to admin and demote B again.
   Expect: both work.
4. Try to demote or remove the last remaining admin.
   Expect: refused with "last administrator".

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
8. Make another request with a fresh account and reject it with a reason. Then sign in with that account.
   Expect: "declined: <your reason>".

## 7. Outsider and suspension

1. As an account outside the firm, open A's team page by URL.
   Expect: nothing is shown (404).
2. As **A**, suspend B. Then sign in as B.
   Expect: "Your access to TEST Logistics Reviewers is suspended. Ask … to restore it."

## 8. Clean up

In `api.beldium.com/admin/`:
- Reject or delete every `TEST` organisation.
- Delete the `TEST` regulator access requests.
- Delete or deactivate the test users.

## If something fails

Note the step number and the screen text. From DevTools > Network, note the failing request's URL, status and response body. API errors look like `{"message": …, "error": {"code": …}}`. The `code` names the rule, for example `join_code_wrong_sector`, `invitation_wrong_sector` or `last_admin`.
