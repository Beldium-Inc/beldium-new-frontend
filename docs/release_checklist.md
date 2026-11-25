# Release checklist (OR-012)

Fill in and sign this before every production deploy of any Beldium frontend
(main app, Miner Portal, Logistics portal). Copy it into the pull request or
release note that goes to production. If any box cannot be ticked, do not deploy.

**Release:** PR / commit `__________`  **App(s):** `__________`  **Date:** `__________`

## Before deploy

- [ ] **CI is green on the PR.** `bun run lint` and `bun run build` pass for every app the PR touches.
- [ ] **Checked on staging.** The same commit ran on the staging deployment
      (`staging` branch, `VITE_API_URL=https://api-staging.beldium.com`). The changed
      screens were opened and used, with no new errors in the browser console.
- [ ] **Backend migration reviewed.** If this release needs a backend change, the
      Django migration was reviewed by the backend owner and has run on staging first.
      Write "none" if there is no backend change: `__________`
- [ ] **Environment values checked.** Any new or changed `VITE_*` value is set in the
      Vercel production environment (not only in `.env`).
- [ ] **Rollback step known.** Written down before deploying, for example
      "Promote previous deployment `<url>` in Vercel" or "Revert PR `#___`":
      `________________________________________`

## Sign-off

| Role                | Name | Date and time (WAT) |
| ------------------- | ---- | ------------------- |
| Author              |      |                     |
| Reviewer / approver |      |                     |

## After deploy

- [ ] Production opened and the changed screens checked within 15 minutes.
- [ ] If anything is wrong, the rollback step above was run and the team told.
