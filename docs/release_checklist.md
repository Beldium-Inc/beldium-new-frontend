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

---

## Appendix: the `staging` branch and Vercel (OR-003)

Not set up yet. Creating the branch and the Vercel settings needs the owner's
Vercel account. Do this once per Vercel project (main app, Miner Portal,
Logistics portal):

1. **Branch.** Create `staging` from `main` in this repo. Changes reach
   production only through `staging` → checked → `main`.
2. **Domain.** In the Vercel project, *Settings → Domains*, add a staging domain
   and set its *Git branch* to `staging`, for example
   `compliance.staging.beldium.com`, `qualitycontrol.staging.beldium.com`,
   `miners.staging.beldium.com`, `logistics.staging.beldium.com`. Keep the
   `qualitycontrol.` and `warehouse.` prefixes: `src/lib/hosts.ts` picks the site
   from the first label.
3. **Environment values.** In *Settings → Environment Variables*, add these to
   *Preview* and limit them to the `staging` branch:
   - `VITE_API_URL=https://api-staging.beldium.com`. **Required.** Without it a
     Vercel build falls back to the production API (`vite.config.ts`). The
     content security policy takes its `connect-src` from this value at build
     time, so nothing else needs changing for the policy.
   - Main app only: `VITE_QC_SITE_URL`, `VITE_COMPLIANCE_SITE_URL`,
     `VITE_WAREHOUSE_SITE_URL`, `VITE_MINER_PORTAL_URL`, `VITE_LOGISTICS_PORTAL_URL`
     set to the staging domains, so links between sites stay on staging.
   - Logistics portal only: `VITE_DATA_MODE=api`.
   - Optional: `VITE_SUPPORT_URL` (the "Get help" link).
4. **Backend.** The staging API must allow the staging domains: add them to
   `CORS_ALLOWED_ORIGINS`, `CSRF_TRUSTED_ORIGINS` and the matching
   `COMPLIANCE_PORTAL_ORIGINS`, `MINER_PORTAL_ORIGINS` or
   `LOGISTICS_PORTAL_ORIGINS`. Without the portal entry, sign-in fails with
   "This account belongs to a different Beldium portal". Backend owner's task.

Checked on 25 Nov 2026: all three apps build with
`VITE_API_URL=https://api-staging.beldium.com`, and the built policy reads
`connect-src 'self' https://api-staging.beldium.com`.
