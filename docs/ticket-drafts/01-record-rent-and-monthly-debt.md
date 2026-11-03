# 01: Record rent and see monthly debt

**What to build:** A Russian-language mobile monthly overview where the owner adds recognizable apartments with monthly rent and due dates, selects a rental month, and records full or partial rent receipts. Expected rent, received rent, outstanding rent, and due status are visible without opening every apartment. Complete the user-facing flow with saved records and behavior-level tests; this is not a separate UI or storage task.

**Blocked by:** None (can start immediately).

**Status:** Approved breakdown; unpublished draft.

- [ ] An apartment can be added with a recognizable name, rent in dollars, and regular due date.
- [ ] The owner can select a rental month and review expected rent, receipts, outstanding rent, and due date for each apartment.
- [ ] Unpaid rent past its due date is distinguishable from rent not yet due.
- [ ] Receipt entry inherits the apartment and month, prefills outstanding rent and today's date, and permits editing amount/date and adding an optional note.
- [ ] A normal full receipt requires no typing when defaults are correct. Opening the form never records money automatically.
- [ ] Against 1,200 due, a 600 receipt leaves 600 outstanding; a second 600 clears the debt. Both dated entries remain visible in monthly details.
- [ ] Data remains available after reopening; a repeated confirmation of the same submission does not create duplicate receipts.
- [ ] Mobile-browser acceptance checks verify setup, monthly review, full and partial receipts, saved records, and visible financial totals using synthetic data.

This slice is a prototype, not authorization to store real personal or financial data without the protection and recovery requirements needed for real use. No framework or storage provider has been selected by the requirements interview.
