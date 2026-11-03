# Rental Manager — monthly financial workflow prototype

Status: local review draft; not published to an issue tracker. Proposed testing seam awaits confirmation. This specifies the minimal prototype agreed during the requirements interview, not a complete production replacement for the notebook.

## Problem Statement

A single property owner manages approximately ten long-term rental apartments using a paper notebook. She must review individual apartment records to understand expected rent, receipts, expenses, and outstanding rent. She also records how income is allocated among herself, her husband, and her daughter.

Her notebook already works. The application must make ordinary financial entry and monthly review easier, with fewer repeated inputs and no mandatory allocation calculations during receipt entry. Document management and speculative features for other users must not distract from that goal.

## Solution

A Russian-language, mobile-first monthly overview shows every apartment's expected rent, received rent, apartment expenses, outstanding rent, and due date. The owner selects a rental month, identifies unpaid rent, and records a receipt or expense directly from the relevant apartment.

Apartment and rental month are already selected when entering money. A normal receipt prefills the outstanding amount and today's date; an expense requires typing only its amount. Both allow editing the date and adding an optional note. Monthly details retain individual records and show family allocation as secondary information.

Every financial entry belongs to a specific rental month. A late receipt settles that original month's rent while retaining its actual receipt date. It does not become the following month's rent merely because it arrived later. Monthly figures describe the selected rental month, not cash movement during a calendar month.

## User Stories

1. As the property owner, I want a Russian-language mobile interface, so that I can work comfortably on my phone.
2. As the property owner, I want to recognize each apartment by a familiar name, so that I can select it without interpreting internal identifiers.
3. As the property owner, I want to set monthly rent and a regular due date, so that I do not re-enter ordinary rental terms each month.
4. As the property owner, I want to select a rental month, so that I can review its finances separately from other months.
5. As the property owner, I want to see all apartments together, so that I do not open ten separate records to find unpaid rent.
6. As the property owner, I want expected and received rent shown separately, so that I do not mistake an obligation for money received.
7. As the property owner, I want to see remaining tenant debt, so that I know who still owes rent.
8. As the property owner, I want unpaid rent past its due date distinguished from rent not yet due, so that I can identify what needs attention.
9. As the property owner, I want to record a receipt from an apartment's monthly row, so that I do not repeat the apartment or month.
10. As the property owner, I want a regular receipt's amount and date prefilled, so that I can confirm it without typing known information.
11. As the property owner, I want to change the amount or date before saving, so that partial and late receipts use the same simple flow.
12. As the property owner, I want multiple receipts against one month's rent, so that installments remain individually visible.
13. As the property owner, I want a late receipt to update the month it settles, so that debts remain attached to their original months.
14. As the property owner, I want advance rent assigned to a known future month, so that I do not collect or count it again later.
15. As the property owner, I want to record an apartment expense by entering its amount, so that ordinary cost tracking is quick.
16. As the property owner, I want an expense linked to the rental month I selected, so that its effect is understandable and explicit.
17. As the property owner, I want optional notes, so that I can explain an unusual entry without extra fields on every entry.
18. As the property owner, I want to review the month's individual receipts and expenses, so that I can understand its totals.
19. As the property owner, I want to correct an entry and retain meaningful change history, so that mistakes do not leave unexplained totals.
20. As the property owner, I want to correct an entry's assigned month, so that a mistaken selection does not distort two months permanently.
21. As the property owner, I want to adjust one month's expected rent without rewriting other months, so that a one-time exception remains local.
22. As the property owner, I want months with no rent due to avoid generating debt, so that vacant periods do not create false arrears.
23. As the property owner, I want expenses separated from tenant debt, so that maintenance costs do not appear to change the tenant's rent obligation.
24. As the property owner, I want family shares calculated from received rent less apartment expenses, so that unpaid rent is not treated as distributable income.
25. As the property owner, I want family shares in monthly details rather than a required receipt-entry step, so that allocation does not slow recording money.
26. As the property owner, I want calculated shares distinguished from actual payouts, so that the app does not claim money has been distributed.
27. As the property owner, I want to start with the current month and older unpaid rent, so that I can try the app without transcribing the whole notebook.
28. As the property owner, I want to revisit earlier rental months, so that I can check their records and remaining debt.

## Implementation Decisions

- No application code, selected stack, existing test suite, or established module interfaces are present. This spec chooses no framework, database, hosting provider, API contract, or architectural pattern.
- The interaction boundary is one main monthly overview, a compact receipt/expense entry form, and an apartment monthly detail view or expansion. Separate dashboard, finance, and allocation workflows are unnecessary for this prototype.
- Minimal apartment setup collects a recognizable name, monthly rent, and regular due date. Tenant contact and notes are secondary information; full lease administration is not a prerequisite for trying the prototype.
- Every rent obligation, receipt, and expense is associated with an apartment and rental month. Receipt and expense dates remain distinct from the assigned rental month.
- Monthly receipts are amounts actually received and assigned to that rental month. Outstanding rent is the unpaid obligation; apartment expenses do not reduce it. Different rental months do not automatically offset one another.
- The default receipt amount is the remaining rent, not the original rent when partial receipts already exist. Opening the form or accepting a default does not itself record money; saving requires confirmation.
- Receipt and expense forms inherit the apartment and month. Date defaults to today and remains editable; notes are optional. Payment method, expense category, attachment, and allocation review are not required fields.
- Expense attribution uses the explicitly selected rental month rather than inferring a month from payment or work dates. The selected month stays visible during entry.
- A month's expected rent can be corrected independently. Changes must not silently recalculate unrelated historical months or create rent debt for months with no rent due.
- Known-month advance rent is recorded once against its future obligation. Reaching that month must not create another receipt or restore already-paid debt. Undated advances require further owner validation.
- Dollars, interpreted as USD, are the working prototype currency. Different currencies and conversions are not part of this scope.
- Allocation uses three equal shares for the owner, her husband, and her daughter. Apartment expenses are shared equally. Use actual receipts assigned to the month, excluding unpaid rent. Allocation is not evidence of a payout.
- Exact monetary arithmetic is required. No percentage-based 33% approximation is permitted. Allocation remainder handling, negative family shares, and special arrangements are unresolved; this spec does not select hidden financial rules for them.
- Corrections update affected totals and retain meaningful financial history. Moving a record corrects both affected rental months. The user must be able to understand what changed without navigating an accounting system.
- Initial data entry covers current rental terms, current-month receipts and expenses, and outstanding older rent assigned to its original month. Closed notebook history need not be imported.

## Testing Decisions

Proposed seam, pending founder confirmation: use the mobile browser UI as the primary acceptance boundary. Exercise apartment setup, monthly review, entry, correction, and visible totals through owner-facing interactions. There is no prior test suite or analogous implementation to reuse. Do not invent separate test interfaces merely to mirror internal modules.

Good tests verify visible behavior and financial results, not component structure, internal function calls, or storage schema. Prefer a small set of end-to-end scenarios over duplicate tests at multiple internal layers. Exact-arithmetic checks below this seam are warranted only if the eventual implementation exposes a financial boundary that cannot be adequately checked through visible results.

Acceptance scenarios:

| Scenario | Expected observable behavior |
| --- | --- |
| Monthly review | All ten apartments can be reviewed for a selected month; expected rent, receipts, expenses, debt, and due dates are understandable without opening each apartment. |
| Normal receipt | With 1,200 due and none received, the form prefills 1,200 and today. Confirming requires no typing; saving shows 1,200 received and zero debt. |
| Partial receipts | Against 1,200, a receipt of 600 leaves 600 debt; a second 600 clears it. Both dated entries remain visible. |
| Late receipt | October rent of 1,200 receives 600 in October and 600 in November. October shows 1,200 received and zero debt; actual dates remain visible and November rent figures are unaffected. |
| Expense | With 1,200 received, a 60 expense shows 60 spent and 1,140 net, with 380 per family member. Tenant debt remains zero. Only the expense amount requires typing. |
| Partly received rent plus expense | With 1,200 expected, 600 received, and 60 spent, tenant debt is 600 and family shares are 180 each. |
| Fractional monetary values | A receipt of 1,200.03 less an expense of 60.00 shows 1,140.03 net and 380.01 per person, without floating-point artifacts. This does not establish an indivisible-cent rule. |
| Known-month advance | A receipt assigned to a future month remains a single entry and reduces that month's outstanding rent when reviewed later. |
| Record correction | Correcting an erroneous amount updates totals and exposes meaningful history. Other months remain unchanged unless the assigned month is explicitly corrected. |
| Wrong-month correction | Moving a receipt to its correct rental month removes its effect from the wrong month and applies it once to the correct month. |
| Duplicate save | An accidental repeated confirmation does not create two receipts for one submission. |
| One-time rent change | Changing one month's expected amount changes that month's debt without rewriting other months. |
| No rent due | A month with no rent obligation does not show generated tenant debt. |
| Due versus overdue | An unpaid obligation can be distinguished before and after its due date without treating an expense as rent debt. |

Observed owner trial: ask her to identify unpaid rent, record a full receipt, a partial receipt, and an expense, correct a mistake, and find an older month without coaching. Compare the ordinary receipt-entry task with her notebook. She should not retype known information or perform an allocation step to save a receipt. No unsupported time target is imposed; independent completion and observed friction are the evidence.

## Out of Scope

- Document uploads, full lease administration, historical notebook migration, configurable allocation percentages, and recording or reconciling family payouts.
- Separate analytics dashboards, full calendar UI, notifications, export, and detailed utility administration.
- Other currencies, exchange-rate rules, bank integrations, payment processing, and automatic money transfers.
- AI, B2B features, tenant portals, employee permissions, subscriptions, and requirements for hypothetical future users.
- Invented rules for security deposits, undated final-month prepayments, exceptional family allocations, expense deficits, or allocation rounding remainders.
- Implementation tasks, production code, and redesigning or selecting a tech stack.

## Further Notes

Confirmed practices are reported by the founder, not directly observed in this session: allocations precede physical payouts; the baseline is equal thirds; apartment expenses are shared equally; dollars are used; advances sometimes occur. Month-based reporting, streamlined entry, and deferring documents are product decisions, not independent observations of the owner's behavior.

The notebook example 945 → 290 / 290 / 365 is unexplained. It is not equal thirds and must not become an inferred calculation rule. The earlier 30% assumption was explicitly corrected.

Remaining validation:

- Whether advances always cover named months or can cover an undated final month.
- Whether security deposits are held and what arrangements must be represented separately from rent.
- Whether any apartment uses a different sharing arrangement and what explains the exceptional notebook entry.
- Whether the owner can use the workflow without payout tracking and accepts explicit selected-month expense attribution.
- Allocation remainder and deficit behavior before presenting such cases as complete financial calculations.
- Actual independent mobile use, including the simplicity and comprehensibility of the monthly overview.

These unknowns allow testing ordinary cases with synthetic data; they do not establish readiness to replace the notebook for every arrangement. Before real financial or personal data is used, the brief's private authentication, durable storage, recovery, and data protection requirements still apply. Tenant-change history and complete current rental arrangements also need coverage before a full operational handover; this prototype does not claim to resolve them.

Publishing prerequisites: configure the project's issue tracker and triage vocabulary through `/setup-matt-pocock-skills`, and confirm the proposed testing seam. Once those prerequisites are satisfied, publish this spec using the configured tracker and its `ready-for-agent` role mapping. Do not label this unpublished draft as a tracker issue.
