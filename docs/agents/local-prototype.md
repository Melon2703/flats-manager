# Local prototype phase

Status: active. The founder is developing and testing locally with dummy data until the prototype is hosted. This supersedes the previous requirement to start local Supabase for ordinary development and acceptance testing.

## Every implementation iteration

- Keep `npm run dev` usable with synthetic data, without Supabase credentials, Docker, or an account. The interface clearly labels this mode as local test data.
- Extend the demo fixtures and adapter alongside new workflows. Preserve the approved UX, localization, exact integer-cent arithmetic, month attribution, and retry behavior. Dummy data is not permission to change financial rules or mark unresolved rules as validated.
- Run the default browser acceptance suite against demo data. Record which checks use the demo adapter and which use real Supabase; passing demo tests does not verify database policies or hosted behavior.
- Keep the Supabase implementation and migrations usable for the hosting transition. Select it explicitly for integration checks; a connection failure must remain an error, never an automatic fallback to demo data.
- Treat all local demo records as disposable and synthetic. Keep `.local-demo/` out of Git. Sample records and local edits are never migration seeds or production data.

## Implementation boundary

`src/lib/data-mode.ts` selects the mode. Development defaults to demo on loopback hosts. A built local preview can explicitly select `RENTAL_MANAGER_DATA_MODE=demo`. Vercel and non-loopback hosts cannot activate demo mode. An explicit `supabase` mode retains authentication and database access.

`src/lib/demo-store.ts` is the temporary server-side adapter. It seeds ten fictional apartments, stores each browser's edits in a separate local JSON file, serializes operations within the local server, and atomically replaces files. This is a single-process prototype convenience, not production storage. The browser's HTTP-only demo cookie selects its dataset; clearing cookies starts a new dataset. A reset restores sample records for that browser.

The default browser suite uses an isolated `.local-demo/playwright/` directory. Supabase-backed tests remain available as a separate opt-in suite. Read current commands in `package.json` and usage in `README.md`.

## Hosting transition

When the founder requests hosting, configure hosted Supabase, apply versioned migrations, provision the owner's account, and verify the deployed service with synthetic records. Hosted execution must retain authentication and use Supabase. Never upload local demo files into the real ledger. Review removal or continued opt-in use of this temporary adapter as part of that cutover, and update this phase document and its AGENTS.md pointer when the phase changes.
