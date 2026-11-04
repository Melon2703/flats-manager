# Rental Manager

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

The initial user is a woman independently managing approximately ten long-term rental apartments that she owns. She tracks rent, tenants, expenses, and income allocation among herself, her husband, and her daughter. She is managing her personal portfolio, not properties for external owners.

Her paper notebook already works. Each apartment has its own section with dated amounts and family allocations; physical documents stay in folders and tenant communications happen through messaging apps. The application must make ordinary financial entry and monthly review easier than this existing process, without requiring accounting expertise.

## Product Purpose

Help the owner understand which apartments owe rent, record money actually received and apartment expenses, review a rental month's finances, and understand the resulting family shares without repeatedly reviewing individual notebook sections or retyping known information.

Success means independent use for core financial tasks with less manual effort. The agreed owner trial covers identifying unpaid rent, recording full and partial receipts and an expense, correcting a mistake, and finding an older month without coaching. Compare ordinary entry with the notebook; no numerical speed target has been established. The broader brief calls for evaluating consistent use over two complete rent-collection cycles. Owner validation has not yet been demonstrated.

## Positioning

A small, personal rental-finance tool shaped around this owner's monthly records and internal family allocation. The established approach combines apartment-level rent obligations, actual receipts, expenses, and equal family shares in a simple monthly workflow. It is intended to replace notebook work for this user; broader property-management and business ideas do not define prototype scope.

## Operating Context

The current development phase uses temporary local dummy data until hosting. [Local prototype policy](docs/agents/local-prototype.md) governs each implementation/test iteration and the later Supabase cutover; synthetic demonstrations do not establish real owner validation.

- Mobile-first use in a browser. Russian is the initial default; Russian and English must both be supported throughout the interface, including validation and accessible labels. A visible, accessible language switch remembers the same browser's preference.
- The primary workflow is one selected-month overview of all apartments. Expected rent, received rent, expenses, outstanding rent, and due dates are visible without opening every apartment. Unpaid rent past its due date is distinguishable from rent not yet due.
- Entry begins from an apartment's monthly row, inheriting the apartment and rental month. A compact form handles receipts and expenses. Monthly details or an expansion show individual entries and family shares; allocation review is not a required receipt-entry step.
- Initial entry covers current rental terms, current-month receipts and expenses, and older unpaid rent assigned to its original month. Closed notebook history need not be transcribed. Document folders can remain in use while uploads are deferred.
- Financial summaries describe records assigned to the selected rental month. They are neither verified bank balances nor statements of cash received during that calendar month.

## Capabilities and Constraints

### Agreed prototype scope

- Minimal apartment setup: a recognizable name, monthly rent in USD, and regular due date. Tenant name/contact and notes are secondary; full lease administration is not required to test the prototype.
- Record full or partial rent receipts, retaining separate entries and their actual dates. Receipt entry suggests outstanding rent and today's date, permits editing amount/date and an optional note, and requires confirmation to save. A normal full receipt needs no typing when defaults are correct. Opening the form never records money.
- Record apartment expenses separately, with apartment/month and today's date preselected. Only the amount must be typed; the date remains editable and notes are optional. No required category, payment method, attachment, or allocation-review fields.
- Keep the assigned rental month visible alongside the actual transaction date. Expenses use the explicitly selected month, not a month inferred from the work or payment date.
- Permit one-month rent exceptions without silently changing other months. Months with no rent due must not acquire automatic tenant debt.
- Support late receipts and advances assigned to known future rental months without double-counting. Different months do not automatically offset one another.
- Correct or remove erroneous receipts and expenses while retaining meaningful financial change history. A wrong-month correction updates both affected months; unrelated months remain unchanged.
- Records must survive reopening. Repeated confirmation of the same submission must not create duplicate receipts.

[Issue #2 — Record rent and see monthly debt](https://github.com/Melon2703/flats-manager/issues/2) is the first rental-workflow slice: apartment setup, month selection, expected/received/outstanding rent and due status, full and partial receipts, saved records, duplicate-submission protection, and mobile-browser acceptance checks with synthetic data. Expenses, allocation, monthly exceptions, cross-month scenarios, and correction history belong to the broader approved prototype; they must not all be folded into Issue #2.

### Financial rules to preserve

Use the terms in [GLOSSARY.md](GLOSSARY.md).

- A rent obligation is expected money; a receipt records money actually received. Outstanding rent is the unpaid portion owed by the tenant. Apartment expenses do not reduce tenant rent debt.
- Every obligation, receipt, and expense belongs to an apartment and a rental month. Preserve actual transaction dates separately. A late receipt updates the month it settles, including its family allocation, without becoming rent for the receipt month.
- The working prototype currency is USD. Switching interface language does not change currency, stored amounts, actual dates, assigned rental months, or user-entered apartment names and notes.
- The distributable amount is actual rent received less apartment expenses included in the same monthly summary; exclude unpaid rent. The baseline divides this amount into three equal shares for the owner, her husband, and her daughter. Apartment expenses are borne equally by all three. Equal thirds are not literal 33% shares and must not be approximated as such.
- Allocation is the intended division of money. It does not establish that a payout occurred. Do not label calculated shares as paid or transferred.
- Monetary arithmetic must be exact. The selected technical representation is integer minor units within a validated safe range; this does not resolve indivisible-cent allocation rules.
- Security deposits must not be entered as rental income to fit the prototype. Known-month advance rent is recorded once and remains credited when that month arrives.

Confirmed examples, all in USD:

| Scenario | Established result |
| --- | --- |
| Rent due 1,200; received 600; apartment expense 60 | Outstanding rent 600; distributable amount 540; three shares of 180. |
| Rent received 1,200; apartment expense 60 | Distributable amount 1,140; three shares of 380; a settled tenant obligation remains settled. |
| October rent due 1,200; receipt of 600 in October and 600 in November | October eventually shows 1,200 received and zero debt; both actual dates remain visible. November's rent figures are unaffected. |
| Rent received 1,000; apartment expense 55 | Distributable amount 945; three shares of 315. This does not explain the notebook's separate 945 → 290 / 290 / 365 entry. |

### Technical and operational constraints

The founder selected Next.js and initial hosting on Vercel; [ADR 0001](docs/adr/0001-nextjs-on-vercel.md) records the decision. Keep UI and server operations in one application without a separate backend or infrastructure for hypothetical scale. The existing foundation uses Next.js App Router, React, strict TypeScript, Tailwind CSS, npm, and Playwright.

[Technology stack](docs/tech-stack.md) records Supabase Postgres/Auth with its typed SDK and SQL migrations, Zod for input validation, and Vitest only where focused calculation checks are useful. The Issue #2 implementation builds on the Issue #8 bilingual foundation with authenticated apartment setup, monthly rent records, and full/partial receipts. [README.md](README.md) documents local setup and the hosted configuration still required; a local test integration does not establish deployment or readiness for real data.

Private authentication, durable storage, recovery, and personal/financial data protection remain prerequisites before real use. Confirm backup/restore arrangements rather than assuming a hosting or database plan supplies them. Use synthetic trial data; keep real personal and financial information out of public repositories and demo fixtures. Do not send private documents to external AI services unnecessarily. Complete rental arrangements and tenant-change history still need coverage before full operational handover.

### Outside the prototype

Document uploads, full lease administration, closed-history migration, configurable allocation percentages, family payout tracking/reconciliation, multiple currencies or conversion, separate analytics/calendar screens, notifications, exports, and detailed utility administration are deferred. Bank integrations, payment processing/transfers, full accounting, automatic tax calculation, AI, tenant portals, contractor/employee workflows, B2B tenancy, subscriptions, and speculative future-user requirements are outside scope.

### Open decisions and validation

- Whether advances always cover named months or can cover an undated final month; handling the latter remains unresolved.
- Security-deposit arrangements and their separate representation.
- Whether individual apartments have exceptional sharing arrangements, and what explains the notebook's 945 → 290 / 290 / 365 entry. The suggestion that it is rounding is unvalidated; 30% / 30% / 40% is not the baseline.
- Indivisible-cent remainders, expenses exceeding receipts, and negative family-share handling. No hidden rounding, deficit, or exceptional-allocation rules are approved.
- Whether selected-month expense attribution matches the owner's practice and whether she can use the app without family payout tracking.
- Independent mobile use and whether starting with current terms, current-month records, and older debt is sufficient to switch from the notebook.
- Short-month behavior for regular due days 29–31. These due days are unsupported in the implementation until the rule is confirmed; days 1–28 work without an invented rollover rule.

These gaps permit testing agreed ordinary cases with synthetic data. They do not establish readiness for every real rental arrangement and must not be silently resolved through interface or calculation choices.

## Brand Commitments

The established product name is Rental Manager; the current Russian interface uses «Управление арендой». Preserve the confirmed bilingual requirement. No additional visual identity or aesthetic direction is established by this product record.

## Evidence on Hand

This file captures established context; it does not replace the source specification or create new requirements. Later explicit decisions below supersede conflicting wording in preserved earlier documents.

- [Product Brief.md](Product%20Brief.md): original context, owner workflow, notebook examples, broader vision, privacy requirements, and long-term success criteria. Its initial scope and unresolved questions were subsequently narrowed or answered.
- [Requirements decisions](docs/requirements-decisions.md): distinguishes founder-reported owner practice, founder product decisions, hypotheses, and remaining validation. The bilingual requirement supersedes Russian-only wording in the brief/specification/drafts; document uploads, configurable percentages, and mandatory allocation review were deferred.
- [Approved specification — Issue #1](https://github.com/Melon2703/flats-manager/issues/1): published monthly-workflow prototype and acceptance scenarios. [Local specification](docs/prototype-spec.md) is preserved with older publication/testing/stack wording; publication and stack decisions are recorded in [publication plan](docs/publication-plan.md), [publication record](docs/publication-record.json), and [technology stack](docs/tech-stack.md).
- [Issue #2](https://github.com/Melon2703/flats-manager/issues/2): first rental-workflow slice and its acceptance criteria, read alongside the later bilingual decision.
- [GLOSSARY.md](GLOSSARY.md) and [ADR 0001](docs/adr/0001-nextjs-on-vercel.md): established terminology and architecture constraint.
- [README.md](README.md), [application entry](src/app/page.tsx), and [translation dictionaries](src/i18n/dictionaries.ts): current Issue #2 implementation evidence, distinct from the broader planned prototype.

Reported owner practices come through the founder; they are not direct observation. Notebook amounts are examples, not validated general calculation rules. No completed owner trial or measured usability improvement is evidenced in these sources. Issue publication and this context capture do not authorize feature implementation.

## Product Principles

1. Make ordinary entry easier than the notebook: inherit known context, prefill safe suggestions, and require explicit confirmation of received money.
2. Make financial meaning clear: distinguish expected rent, actual receipts, expenses, tenant debt, allocation, and payouts.
3. Preserve month attribution and traceability: retain actual dates, explain corrections, and avoid silent effects on unrelated months.
4. Serve the initial owner's real workflow: keep allocation secondary during entry and defer speculative scope.
5. Preserve confirmed rules and visible uncertainty: validate unresolved arrangements rather than inventing financial behavior or claiming readiness from synthetic examples.

## Accessibility & Inclusion

The application must be comfortable on a phone and understandable without accounting expertise. Provide a visible, accessible Russian/English switch with a remembered browser preference. Translate application-owned text, validation messages, and accessible labels in both languages while preserving user-entered text and financial facts. No specific accessibility conformance level or additional user accommodation has been established in the source requirements.
