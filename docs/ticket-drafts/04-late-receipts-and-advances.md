# 04: Record late receipts and known-month advances

**What to build:** Assign receipts to earlier or known future rental months while retaining the actual receipt date. The owner can revisit the correct month and see its debt settled without transferring figures into a different rental month or counting advance money again.

**Blocked by:** 01 — Record rent and see monthly debt.

**Status:** Approved breakdown; unpublished draft.

- [ ] The receipt's assigned rental month and actual receipt date remain visible and distinct.
- [ ] October rent of 1,200 with 600 received in October and 600 received in November shows 1,200 received and zero debt in October.
- [ ] The late receipt retains its November date, and November's own rent totals remain unaffected.
- [ ] A receipt assigned to a known future rental month is recorded once against that month's expected rent.
- [ ] Reaching or reopening the future month does not create another receipt, count the money twice, or restore already-paid debt.
- [ ] Month-specific received totals reflect assigned rental months and are not labeled as cash received during the calendar month.
- [ ] Mobile-browser acceptance checks cover late receipt assignment, future-month advance rent, persistence, and isolation between rental months.

Undated final-month advances, security deposits, and automatic splitting of one receipt across multiple months have no agreed financial rules. Do not silently treat them as named-month advances or ordinary rental income.
