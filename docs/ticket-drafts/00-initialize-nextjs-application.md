# Initialize the Next.js application foundation

**What to build:** A minimal, runnable Rental Manager application shell using the selected Next.js stack. A developer can install dependencies, open the application locally, switch its interface between Russian and English, run the project's checks, and produce a production build suitable for Vercel. This is one demonstrable path from the Next.js server to a mobile browser, not separate configuration-only tickets.

**Blocked by:** None (can start immediately).

**Blocks:** GitHub issue #2 — Record rent and see monthly debt. Existing downstream dependencies remain unchanged.

**Proposed parent:** GitHub issue #1 — Rental Manager monthly financial workflow prototype.

**Status:** Awaiting approval; unpublished draft.

- [ ] Initialize a single Next.js App Router application with React, strict TypeScript, Tailwind CSS, ESLint, npm, and a committed lockfile. Use compatible stable releases.
- [ ] Preserve existing product documentation, glossary, agent configuration, and original specification and ticket drafts. Leave the separate nested Git repository untouched.
- [ ] A minimal application shell renders successfully on a mobile viewport, with Russian as its initial language. It has no rental forms, financial calculations, fake financial totals, or business data.
- [ ] A visible, accessible language switch offers `Русский` and `English` without requiring a settings screen or login. Switching updates all application-owned text in the shell and keeps the user on the equivalent page.
- [ ] The selected language persists in the same browser across reloads and return visits. Browser-local preference storage is sufficient; account-level synchronization is not required.
- [ ] Application-owned interface text is kept in shared Russian and English translation dictionaries rather than embedded in components. Subsequent feature screens, validation messages, and accessible labels must support both languages using the same approach.
- [ ] User-entered apartment names and notes remain unchanged when switching languages. Changing interface language does not change USD currency, financial values, actual dates, or assigned rental months.
- [ ] Standard documented commands install dependencies, start development, check lint and TypeScript, build for production, and start the production build.
- [ ] Playwright verifies that the shell loads on mobile, switches between Russian and English, and restores the selected language after reload. Check visible behavior rather than translation-dictionary or configuration internals.
- [ ] Lint, type checking, production build, and the browser smoke test pass from the documented setup.
- [ ] The project uses Vercel-compatible standard Next.js build behavior. Document the runtime and deployment prerequisites; actual Vercel project provisioning or deployment is not required to complete this ticket.
- [ ] Document the selected Supabase environment-variable conventions using placeholders, keeping secrets out of source control. Supabase project provisioning, live credentials, database schema, authentication flows, and data-access integration remain with the first applicable feature or a separately authorized task.
- [ ] Document that Zod is introduced with input validation and focused calculation tests are introduced when calculations exist. Avoid installing unused libraries merely to populate the package manifest.

## Scope boundaries

This foundation precedes the first financial workflow. Do not implement apartments, rent obligations, receipts, expenses, allocations, or login screens in this ticket. Do not introduce another backend, ORM, general state manager, component framework, or cloud service without a concrete requirement. No real personal or financial data is needed.

Publishing this ticket does not authorize starting its implementation. On approval, publish it once with `ready-for-agent`, link it under #1, and add it as a native blocker of #2. Do not rewrite the six existing tickets or change their other dependencies.
