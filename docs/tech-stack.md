# Technology stack

## Confirmed constraints

The founder selected Next.js and Vercel as the initial hosting platform. Prioritize familiar syntax, established libraries, and low maintenance. This supersedes statements in the preserved specification and ticket drafts that no framework or hosting provider has been selected.

## Implementation defaults

During the temporary local prototype phase, ordinary development and browser checks use the isolated dummy-data adapter described in [local prototype policy](agents/local-prototype.md). Supabase remains the hosted database/authentication choice; this local convenience does not replace that decision.

| Concern | Choice | Reason |
| --- | --- | --- |
| Application | Next.js App Router, React, TypeScript with strict checking | One application for UI and server operations, with typed inputs and standard framework conventions. |
| Hosting | Vercel | Founder's choice; native Next.js deployment support. |
| Styling | Tailwind CSS | Supported by the standard Next.js scaffold; small reusable components keep repeated markup manageable. |
| Database and authentication | Supabase managed Postgres and Supabase Auth | One managed service for durable relational data and authentication, with an official Next.js integration. |
| Database access | Supabase SDK, generated database types, SQL migrations | Keep one database-access approach; a second ORM is unnecessary for the current scope. |
| Input validation | Zod | Readable runtime validation with inferred TypeScript types. |
| Acceptance tests | Playwright | Exercise the approved mobile-browser workflows. |
| Focused calculation tests | Vitest, only where useful | Verify exact financial behavior without duplicating the entire UI test suite. |
| Package management and checks | npm lockfile, ESLint, TypeScript | Familiar tooling and reproducible dependency resolution. |

Use stable releases compatible with the installed Next.js release; record exact resolved versions in the lockfile when scaffolding is authorized. Do not use canary packages merely to follow a tutorial.

Use Server Components for reads and Server Actions for form mutations where suitable. Keep interactive state local to the small parts of the UI that need it. Introduce further libraries only for a demonstrated need; the prototype does not need a separate backend service or a general state-management framework.

Keep monetary values exact using integer minor units within a validated safe range. This is a representation choice, not a decision about allocation remainders or other unresolved financial rules. Store the assigned rental month separately from the actual receipt/expense date.

Supabase project creation, credentials, authentication setup, schema, migrations, deployment, and rental features are not performed by this documentation decision. Database access must enforce the single owner's access; selecting Supabase does not by itself fulfill privacy, backup, or recovery requirements. Confirm available backup/restore arrangements before real use rather than assuming a plan includes them.

## Official references

- [Next.js installation and standard defaults](https://nextjs.org/docs/app/getting-started/installation)
- [Next.js on Vercel](https://vercel.com/docs/frameworks/full-stack/nextjs)
- [Supabase database](https://supabase.com/docs/guides/database/overview)
- [Supabase Auth with Next.js](https://supabase.com/docs/guides/auth/quickstarts/nextjs)
- [Zod](https://zod.dev/)
- [Playwright with Next.js](https://nextjs.org/docs/app/guides/testing/playwright)
- [Vitest with Next.js](https://nextjs.org/docs/app/guides/testing/vitest)

## Authorization boundary

The founder approved publishing the specification and six tickets. Code scaffolding remains subject to clarification of the later phrase "initiate the tech stack"; rental-feature implementation is not authorized by publication or this stack selection.
