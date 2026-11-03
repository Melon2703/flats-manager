# Rental Manager

A minimal mobile application shell with Russian and English interfaces. Rental workflows and database integration follow in later issues.

## Local setup

Use Node.js **24.x** (see `.nvmrc`) and npm **11.x**. With nvm installed:

```sh
nvm install
nvm use
npm ci
npm run dev
```

Open <http://localhost:3000>. No environment variables or external services are required for this shell. Run commands from this repository root, not the separate nested `flats-manager/` Git repository.

`next.config.ts` disables automatic agent-rule generation to preserve the existing `AGENTS.md`. Generated Next.js TypeScript declarations are ignored and recreated by development, type checking, and builds.

## Checks and production

```sh
npm run lint
npm run typecheck
npm run build
npx playwright install chromium
npm test
```

On Linux, use `npx playwright install --with-deps chromium` to install browser system dependencies too. Playwright runs the production build on port 3100 with a mobile Chromium viewport; build before testing and keep that port free. `npm run test:e2e` is an alias for `npm test`. Traces for failed tests are saved in `test-results/`.

To serve the production build manually:

```sh
npm run build
npm start
```

`typecheck` generates Next.js route types before running strict TypeScript checking, so it works on a fresh checkout. ESLint and TypeScript checks are separate from the production build.

Tooling limitation: Next.js's bundled lint plugins currently declare support through ESLint 9, so this project uses that compatible major despite its upstream end-of-support notice. At initialization, `npm audit` reports moderate advisories in the development lint dependency tree (including minimatch); `npm audit --omit=dev` reports none. Recheck when updating the framework and lint stack together.

## Interface language

Russian is the default, regardless of browser language. The visible `Русский` and `English` buttons switch the interface on the current page. A browser cookie remembers the choice for one year, across reloads and return visits. Clearing cookies resets the preference; it is not synchronized across devices. The server renders the selected language, including the document title and HTML `lang`.

Keep application-owned interface text, validation messages, and accessible labels in `src/i18n/dictionaries.ts`. Both dictionaries share a checked shape. Server Components can read `getLocale()` from `src/i18n/locale.ts` and select `dictionaries[locale]`; pass the required translated strings to interactive Client Components. Add matching keys in both languages when adding screens. Language endonyms remain `Русский` and `English` in either interface.

Translate interface text only. Preserve user-entered apartment names and notes verbatim. Locale changes must not mutate USD currency, stored financial values, actual dates, or assigned rental months. No business data exists in this foundation.

## Environment conventions

`.env.example` contains placeholders for the future Supabase integration. When that integration is implemented, copy it to `.env.local` and provide the project's `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, following the [Supabase SSR guide](https://supabase.com/docs/guides/auth/server-side/creating-a-client?queryGroups=framework&framework=nextjs). These public values may be exposed to the browser; database authorization must be enforced by row-level security when data access is introduced.

Keep real `.env*` files out of source control. Any future privileged Supabase secret must be server-only (never prefixed `NEXT_PUBLIC_` or passed to client code). No privileged key is needed now. Supabase provisioning, SDK clients, schema, authentication, migrations, and live credentials are deferred to the first applicable feature.

Zod will be introduced with input validation. Focused calculation tests (using Vitest where useful) will be introduced when calculations exist. Neither is installed in advance.

## Deployment prerequisites

Use the standard **Next.js** framework preset on Vercel, the repository root as the Root Directory, Node.js **24.x**, `npm ci` for installation, and `npm run build` for builds. Leave the output directory at its framework default. See [Vercel's supported Node.js versions](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions) and [Next.js installation](https://nextjs.org/docs/app/getting-started/installation).

This is a server-rendered App Router application with a cookie-writing Server Action, so it requires a Next.js server runtime, not static-file hosting. No custom backend or Vercel-specific configuration is needed. The shell needs no Supabase variables at deployment time. Actual Vercel provisioning and deployment are outside this issue.
