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

## Prototype architecture
- Keep existing companies in AppState as the canonical organization, vehicle, driver and compliance records; LogisticsState stores only linked demo identities, drafts, application references and transport events to prevent disconnected review copies.
- Use browser-local storage exclusively for non-sensitive prototype records; passwords and document contents remain transient because this is not a production identity or evidence service.
- Authorize logistics actions by workspace role, organization association and assigned driver in the shared action layer as well as the UI to maintain demo separation.
- Append timestamped transport events and delivery records rather than overwriting custody history, preserving visible corrections and discrepancies.
- Keep three separated environments (sector operator, compliance verification, regulatory oversight); compliance officers get no transport/dispatch write actions, because reviewers must not execute the operations they verify.
- A document becomes verified only via an officer-recorded VerificationRecord (source, method, findings) using the shared VerificationWorkflow components, so uploads never auto-verify.
- Compliance operators are unvetted by default (`Session.vetted`, seeded per demo account). Only a vetted operator may review, verify documents, raise information requests or record decisions; the action layer in `app-state.tsx` enforces this via `reviewGuard`, and the UI reads `canReview`. Unvetted operators see a "Pending staff vetting" banner and a profile that shows no granted permissions.
