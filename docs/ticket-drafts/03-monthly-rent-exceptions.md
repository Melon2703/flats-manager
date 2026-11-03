# 03: Handle monthly rent exceptions

**What to build:** Change one rental month's expected rent, record months with no rent due, and enter older unpaid rent without transcribing closed notebook history. Changes are saved, reflected in the monthly overview, and independently verifiable.

**Blocked by:** 01 — Record rent and see monthly debt.

**Status:** Approved breakdown; unpublished draft.

- [ ] A one-time change to expected rent updates only the selected apartment and month, including its outstanding rent.
- [ ] The original expected amount and its correction remain understandable through meaningful financial change history.
- [ ] Other months and already-recorded receipts are not silently rewritten.
- [ ] A month with no rent due does not accumulate automatic tenant debt or appear as overdue rent.
- [ ] The owner can enter an older unpaid obligation under its original rental month without importing every closed notebook month.
- [ ] Initial use can start with current rental terms, current-month entries, and outstanding older rent.
- [ ] Mobile-browser acceptance checks cover a one-time rent change, a no-rent month, and an older unpaid obligation, including persistence and isolation between months.

This is not full lease administration, tenant-history migration, automatic proration, or a bulk notebook import. Do not invent rules for changing contractual terms or applying excess receipts.
