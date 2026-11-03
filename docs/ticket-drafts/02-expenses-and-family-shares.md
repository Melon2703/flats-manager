# 02: Record expenses and see family shares

**What to build:** Record an apartment expense from its monthly row and see that month's expenses, net income, and equal family shares in monthly details. Extend the working monthly workflow through saved entries, visible calculations, and behavior-level tests.

**Blocked by:** 01 — Record rent and see monthly debt.

**Status:** Approved breakdown; unpublished draft.

- [ ] Expense entry inherits apartment/month and today's date. Only the amount must be typed; date remains editable and notes are optional.
- [ ] Neither receipts nor expenses require a payment method, category, document, or allocation-review step.
- [ ] Expenses and individual dated entries appear in the selected apartment's monthly details.
- [ ] With 1,200 received and 60 spent, show 60 expenses, 1,140 net income, and three shares of 380.
- [ ] With 1,200 due, 600 received, and 60 spent, show 600 tenant debt and shares of 180 each. Expenses never reduce tenant debt.
- [ ] Family shares are secondary information and are not labeled as payouts or money already transferred.
- [ ] With 1,200.03 received and 60.00 spent, show 1,140.03 net and 380.01 per person without floating-point artifacts.
- [ ] Saved expenses and their effect on monthly totals are verified through the mobile-browser workflow.

Equal shares apply to the owner, her husband, and her daughter. Allocation remainder handling and negative family shares are unresolved: this slice must not invent financial rules or claim those cases are validated. Ordinary synthetic test cases must not be mistaken for complete operational coverage.
