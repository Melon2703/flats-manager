# Requirements interview

The Product Brief is starting context, not a finalized specification. User-reported practice, founder decisions, and unvalidated hypotheses are recorded separately.

## User-reported practice

- Family-share entries in the notebook record allocations. Money is physically distributed afterward based on those entries. Source: founder's interview answer, 2026-11-03; no direct observation recorded.
- The founder confirmed that the baseline allocation is three equal shares for the owner, her husband, and her daughter, totaling 100%; "33% each" was informal shorthand. Treatment of indivisible minor units remains unresolved.
- Confirmed by the founder: all expenses related to an apartment are borne equally by the three family members. For 1,000 received and a 55 apartment expense, the combined net result is 945, or 315 per person. When deductions are applied across separate receipts, and how expenses without sufficient receipts are handled, remain unresolved.
- In response to which currencies are used for rent and apartment expenses, the founder answered dollars. Use USD as the working v0.1 currency; no other currency or conversion workflow has been established.
- The owner sometimes receives rent in advance. The specific arrangements, including whether the covered rental months are always known, have not yet been established.

## Unvalidated hypotheses and proposals

- The founder suspects the 945 → 290 / 290 / 365 entry reflects rounding. This remains unvalidated and does not explain the difference from equal thirds (315 each). The earlier 30% / 30% / 40% interpretation was superseded and must not be used as the baseline.
- Configurable allocation percentages were proposed for future users. They are deferred from the prototype; equal thirds are the working baseline for the initial owner, subject to checking apartment-specific exceptions.

## Founder decisions

- Primary priority: financial information must be easy to understand and enter, with every record linked to a specific month. Allocation is secondary; detailed allocation edge cases must not drive the initial scope or interview.
- Primary screen: a selected-month overview of all apartments, showing expected rent, receipts, expenses, and remaining tenant debt per apartment. Receipt and expense entry starts from the apartment row with apartment and month preselected. Family allocation is available within the apartment's monthly details.
- Initial use starts with current rental terms, the current month's receipts and expenses, and any older unpaid rent linked to its original month. Copying closed historical months from the notebook is not required. This startup scope was approved by the founder; the owner's ability to switch with this data remains to be validated.
- Document uploads are deferred beyond the first usable iteration, overriding their P0 placement in the Product Brief. Keep essential apartment and rental information in scope; physical document folders can remain the source for documents initially.
- Limit the first iteration to the reported dollar currency; multi-currency workflows from the Product Brief are not currently justified by reported use.
- Advance rent remains in P0 because it occurs in actual use. It must not be collected or counted again when the covered month arrives.
- Establish the allocation rule when rent is set; entering apartment maintenance costs updates allocation amounts. Do not require the owner to choose which receipt bears an expense. This replaces mandatory receipt-by-receipt allocation review in the proposed core workflow.
- Prioritize a clear month-end view of money received, maintenance spending, and outstanding tenant rent. Whether outstanding family payouts also need tracking remains unresolved.
- Family shares use actual rent receipts minus apartment expenses, excluding unpaid contractual rent. Show outstanding tenant rent separately. Accepted example: rent due 1,200, received 600, maintenance 60 → 180 per family member and 600 outstanding tenant rent. This is a founder-approved product decision, not an observed user practice.
- Keep monthly finances separate by rental month, not receipt date. Accepted example: October rent 1,200, with 600 received in October and 600 in November → October eventually shows 1,200 received, zero tenant debt, and updated family shares; November rent figures are unaffected. Preserve the actual November receipt date. Past monthly summaries can change when late receipts are recorded and must not be labeled as cash received during that calendar month.
- The founder delegated remaining interaction details to the agent, prioritizing minimal fields and screens. The choices below are prototype product decisions under that delegation, not claims about observed owner behavior.

## Minimal prototype P0

- A Russian-language mobile-first monthly overview of all apartments, with a month selector and per-apartment expected rent, received rent, expenses, remaining tenant debt, and due date. Outstanding rent past its due date must be distinguishable from rent not yet due.
- Minimal apartment setup: recognizable name, monthly rent in dollars, and regular due date. Tenant name/contact and notes are secondary details; full lease administration is not required to try the prototype.
- Expected rent is prefilled from rental terms. A change for one month must not silently change other months. Apartments with no rent due must not accumulate automatic tenant debt.
- Record full or partial receipts; preserve separate entries and dates. Record apartment expenses separately. Both belong to an apartment and a selected rental month.
- Show monthly detail and receipt/expense history by expanding an apartment or opening one detail view. Show equal-share allocation here, not as a required payment-entry step.
- Permit correction of mistakes and retain meaningful financial change history. A correction updates that month's totals; it must not silently rewrite unrelated months.
- Support advance rent for known future months without double-counting. Undated final-month advances remain an unresolved real-use requirement, not an assumed behavior.

## Interaction choices

- Use one main monthly screen and a shared compact entry form for receipts and expenses; avoid separate dashboard and finance sections for the same information.
- Receipt entry inherits apartment/month, prefills the remaining rent and today's date, and saves after confirmation. Amount/date remain editable; a prefilled amount never creates a receipt automatically.
- Expense entry inherits apartment/month and today's date; only the amount must be typed. Notes are optional. No required category, payment method, document, or allocation-review fields.
- Keep the assigned rental month visible alongside the actual transaction date. Expenses are assigned to the selected month by the user rather than inferred from work/payment dates. Allow changing the month to correct attribution.
- Show tenant debt separately from net income and family shares. Expenses never reduce the amount the tenant owes in rent.

## Outside the prototype

- Document uploads, configurable family percentages, family payout tracking, full historical migration, multi-currency conversion, and separate analytics/calendar screens.
- B2B, AI, bank integrations, notifications, and speculative future-user requirements remain excluded as in the brief.
- No new tech stack is selected by this interview. Production code, implementation planning, and tickets remain outside this session.

## Open questions

- Requires owner validation: are advances always for named rental months, or can they cover an undated final month? The founder does not know. Do not assume all advances can be assigned immediately or finalize advance-rent behavior without this fact.
- Validate whether she can use the app without family payout tracking; it is excluded from the prototype and calculated shares must not be labeled as paid.
- Is the equal-share baseline used for all apartments or are there property-specific arrangements?
- How are deductions and exceptional allocations calculated, particularly the notebook's 945 income / 55 cleaning example?
- Validate whether assigning expenses to the selected month matches her practice. Receipt-specific expense attribution is not required by the proposed workflow.
- Confirm security-deposit arrangements before real use; deposits must not be entered as rental income merely to fit the prototype.

These unknowns do not prevent testing the ordinary monthly workflow with sample data. They must not be presented as resolved requirements for a complete replacement of her notebook. Authentication, durable storage, recovery, and protection of real personal/financial data from the brief remain necessary before actual use; simplifying the UI does not remove them.

## Core acceptance criteria

- For a selected month, the owner can identify which apartments have unpaid rent and see expected rent, receipts, expenses, and remaining tenant debt without opening each apartment.
- Starting from an apartment's monthly row, the owner can record a receipt or expense without re-entering the apartment or month. Independent completion by the owner remains to be validated in use.
- October rent of 1,200 with two receipts of 600, one received in November, shows 1,200 received and zero debt in October; each receipt retains its actual date and November's rent figures are unaffected.
- For 1,200 expected rent, recording 600 shows 600 received and 600 outstanding. A second 600 receipt clears the debt while both entries remain visible.
- Recording an expense of 60 against that month shows 60 expenses and 1,140 net income, with three shares of 380; tenant debt remains zero.
- A regular full receipt requires no typing when the suggested amount/date are correct. An expense requires typing only its amount; optional fields do not prevent saving.
- Changing or removing an erroneous entry corrects totals and leaves a meaningful history of the correction. Saving must not create accidental duplicate receipts.
- A receipt assigned to a known future month remains recorded once when that month arrives and reduces that month's outstanding rent.
- In an observed trial, the owner can identify unpaid rent, record a full receipt, record a partial receipt and an expense, correct a mistake, and find an older month without coaching. Compare the ordinary entry task with her notebook; the app must avoid retyping known information and adding allocation steps.

## Deferred allocation details

- No decision was made on the proposed display or handling of expenses exceeding receipts. Do not treat the interviewer's negative-share example as an accepted requirement.
- Rounding, exceptional shares, and payout tracking remain open; revisit only as needed for the agreed first usable workflow.
- The prototype can test ordinary equal-share examples, but rules for indivisible cents and negative family shares must not be silently invented or represented as validated financial behavior.
