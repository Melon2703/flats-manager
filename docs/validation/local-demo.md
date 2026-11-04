# Temporary local demo validation

Baseline: `727959b2f55406cafd138f3b6ac8fcd0875e2082`. The founder requested local dummy data until hosting, with persistent guidance for every implementation iteration. The active policy is [local-prototype.md](../agents/local-prototype.md), reached from root `AGENTS.md` before implementation, testing, or review.

The default development path opens ten fictional apartments without a Supabase project, Docker, credentials, or login. The temporary file adapter retains per-browser edits, uses exact integer cents and rental-month attribution, and reconciles identical submission retries. Reset restores that browser's samples. Hosted Supabase and its migrations remain available through an explicit mode; local files never become production seeds.

## Verification

- Type checking and production build pass. Lint has zero errors; the 94 warnings remain in existing vendored Impeccable scripts.
- Twelve default browser cases pass across mobile and desktop: four demo scenarios and two foundation/localization scenarios per viewport. Two initial host-isolation cases encountered Chromium's prohibition on overriding Host directly; forwarding the real HTTP request before rendering its response fixed that test setup, and both reruns pass.
- The browser tests verify seeded rows, full/partial receipts, persistence across reload, exact cents, a lost-response retry without duplicate receipts, apartment setup, reset, browser isolation, language persistence, and rejection of demo mode on a non-loopback host.
- Reviewed rendered mobile/desktop captures for the demo notice and the retained ledger layout. The notice uses existing visual tokens.
- After stopping this project's local Supabase containers with data backup preserved, the seeded-ledger browser cases passed again in both viewports. The opt-in Supabase test selector still discovers its 22 cases; they were not executed during this change.
- The previous Supabase integration suite remains opt-in. It was not rerun for this file-adapter change; demo tests do not establish SQL, RLS, Auth, or hosted correctness.

## Standards

Independent review found no documented-rule violations or actionable baseline code smells. The implementation isolates synthetic browser datasets and preserves integer-cent arithmetic, month attribution, payload-matched retry IDs, and the Supabase path.

## Spec

Independent review found no gaps or scope creep relative to the local dummy-data request. Agent discoverability, the temporary hosting cutover, backend-free default development/tests, and explicit Supabase mode are documented. Demo verification is distinguished from database/hosted verification.

Final review counts: **Standards 0; Spec 0.** The adapter is a disposable single-process development convenience. No real financial records or hosted resources were created or migrated.
