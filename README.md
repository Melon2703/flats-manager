# Rental Manager

A mobile-first monthly rent ledger with Russian and English interfaces, built on the Issue #8 Next.js foundation. Issue #2 adds apartment setup, monthly obligations, full and partial receipts, dated history, and persistent owner-scoped records. The approved interaction and visual direction is in [the design brief](docs/design/monthly-workflow.md).

## Local setup

Use Node.js **24.x** (`.nvmrc`), npm **11.x**, and Docker Desktop for local Supabase. Run commands from this repository root, leaving the separate nested `flats-manager/` Git repository untouched.

```sh
nvm install
nvm use
npm ci
npm run db:start
npm run db:migrate
npm run test:configure
```

`test:configure` writes the running local stack's URL and **public publishable key only** to ignored `.env.test.local`. It never saves privileged keys and refuses a non-local endpoint. For development, copy those two local values into ignored `.env.local`, then run `npm run dev` and open <http://localhost:3000>.

The app does not create sample apartments or silently fall back to browser storage. Without configuration it displays a connection-setup message. With configuration it requires sign-in. For a local manual trial, create a synthetic email/password user using the local Supabase Auth API or dashboard; there is no public signup screen. The browser tests create isolated synthetic users automatically.

`next.config.ts` preserves the existing `AGENTS.md`. Generated Next.js declarations remain ignored and are recreated by development, type checking, and builds.

## Checks and browser tests

With the local Supabase stack running and `.env.test.local` configured:

```sh
npm run lint
npm run typecheck
npm run build
npx playwright install chromium
npm test
```

On Linux, use `npx playwright install --with-deps chromium`. Tests run the production application on port **3100** in mobile Pixel 7 and desktop Chromium viewports. Build before testing and keep that port free. `npm run test:e2e` is an alias. A focused run is `npm test -- tests/e2e/monthly-workflow.spec.ts --project=mobile-chromium`.

Acceptance tests exercise the real local Auth/Postgres path through the browser. They cover setup, full/partial receipts, dated history, reload persistence, month separation, due status, bilingual drafts, and retry after a committed save's response is deliberately lost. Assertions observe the interface; Auth API calls only prepare synthetic accounts. Workflow tests refuse remote Supabase endpoints. Traces for failures are in `test-results/`; visual-review captures are written to the OS temporary directory under `flats-review/`.

Migrations can be tested from scratch with `npx supabase db reset --local` **only against disposable local data**. This deletes local records and Auth accounts. Never use a linked/hosted database for the test reset. No reset is part of normal application startup or test execution.

`typecheck` generates route types before strict TypeScript checking. Lint and type checking remain separate from production builds. ESLint 9 is retained for compatibility with Next.js's bundled lint plugins. Existing vendored Impeccable scripts can emit lint warnings; application lint must have no errors. `npm audit --omit=dev` checks runtime dependencies separately from the development-tool advisories.

## Financial behavior and boundaries

Amounts are exact integer USD cents, with inputs accepting a dot or comma decimal separator and at most two fractional digits. The supported per-entry range is USD 0.01–999,999,999.99; dates and rental months are limited to 2000–2100. There are no floating-point financial calculations or allocation approximations.

Apartments start in the month selected during setup. Earlier months do not acquire retroactive debt. Each reviewed month snapshots its expected rent and due date once; reading another month never rewrites an existing snapshot. Ordinary due days **1–28** are supported. Handling days 29–31 in short months needs a product decision and is deliberately unsupported.

Expected rent, actual receipts, and outstanding tenant rent are distinct. Each receipt retains its actual date separately from its assigned rental month. Partial receipts stay separate. The inline receipt form suggests the remaining amount and today's local date, requires confirmation, and does not focus the amount field automatically. Family allocation, expenses, advances, rent exceptions, corrections, and payout tracking are outside Issue #2.

This form supports settlement up to the remaining rent. It rejects excess amounts explicitly; it does not invent overpayment or cross-month allocation rules. A locked monthly obligation serializes concurrent saves. Client-generated submission IDs and payload matching make exact retries idempotent, including when the first response is lost. An uncertain receipt submission retains its original payload, locks editing, and offers a safe retry. Records are never treated as verified bank balances.

## Interface language and accessibility

Russian is the initial default regardless of browser language. Visible `Русский` and `English` controls switch application-owned text on the current page. An HTTP-only browser cookie remembers the preference for one year; clearing cookies resets it. Preference is not synchronized across devices. Metadata and HTML `lang` follow the selected language.

Shared dictionaries in `src/i18n/dictionaries.ts` include interface text, validation messages, and accessible labels with a checked common shape. Language switching preserves apartment names, notes, entered amounts, actual dates, assigned rental months, and USD currency. Dates displayed in records and number formatting follow the interface locale; native date/month inputs also follow browser/OS conventions.

The ledger uses labeled amounts, explicit payment/overdue text, keyboard focus indicators, 44px minimum touch targets, and inline receipt feedback. Drafts require explicit discard when switching apartments or months; leaving the page triggers the browser's unsaved-entry warning.

## Hosted configuration and data protection

Copy `.env.example` to `.env.local` (or configure equivalent Vercel environment variables) and provide `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. These are public connection values, not privileged credentials. See the [official Supabase SSR guide](https://supabase.com/docs/guides/auth/server-side/creating-a-client).

Apply both SQL migrations under `supabase/migrations/` to the intended project before using the app. Provision the owner's email/password account through Supabase Auth, verify access, and disable public signups for this single-owner deployment. The local development configuration allows test account creation; it is not a production Auth policy. Do not copy local test credentials into a hosted deployment.

The server validates authentication on reads and mutations. Row-level security scopes reads to `auth.uid()`; authenticated clients cannot write tables directly. Narrow database functions enforce ownership, amount constraints, obligation locking, and retry identity. Session refresh uses the standard Next.js proxy and Supabase SSR cookie flow. No service-role or privileged key is used by the application.

Database types are generated from the SQL schema in `src/lib/supabase/database.types.ts`. After schema changes, regenerate with `npx supabase gen types typescript --local > src/lib/supabase/database.types.ts`. Zod validates server inputs and receipt responses. Browser tests cover the approved acceptance seam; no unused calculation-test framework is installed.

Hosted Supabase provisioning, credentials, Vercel provisioning, and deployment have not been performed by this implementation. Before real personal or financial data is used, verify private access, backup/restore arrangements, recovery, and complete rental arrangements. Use synthetic data for trials; no real user data belongs in public repositories or fixtures.

## Deployment prerequisites

Use Vercel's standard **Next.js** preset, the repository root as Root Directory, Node.js **24.x**, `npm ci`, and `npm run build`. Leave the output directory at its framework default. This App Router application uses server actions and cookies and requires a Next.js server runtime, not static-file hosting. No separate backend or Vercel-specific service is required.

To serve a configured production build locally:

```sh
npm run build
npm start
```
