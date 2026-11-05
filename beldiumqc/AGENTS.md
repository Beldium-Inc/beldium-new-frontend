<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Demo auth/onboarding lives in src/lib/beldium/accounts.tsx (local accounts + session) and onboarding.ts (role step configs rendered generically by step-fields.tsx); add roles/steps as config, not new screens — keeps every role branch consistent.
- Shared frontend access policy lives in the Beldium compliance module; explicit scoped memberships separate sector operations from delegated verification and oversight, so role titles alone never grant privileged access.
- Reuse the shared verification record form for partner, account, and assignment review; evidence provenance and append-only audit belong to the record, not individual sector screens.
