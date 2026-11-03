# 06: Validate the complete mobile workflow

**What to build:** Make the complete monthly workflow demonstrably usable with ten synthetic apartments on a mobile screen. Run an observed owner trial and fix concrete interaction friction within the approved scope, rather than adding speculative features or extra screens.

**Blocked by:** 03 — Handle monthly rent exceptions; 05 — Correct financial entries with history.

**Status:** Approved breakdown; unpublished draft.

- [ ] Ten synthetic apartments can be reviewed by rental month, with expected rent, receipts, expenses, outstanding rent, and due status understandable without opening each apartment.
- [ ] The Russian-language mobile workflow supports identifying unpaid rent, recording full and partial receipts, entering expenses, correcting mistakes, and finding earlier rental months.
- [ ] A normal receipt with correct defaults requires no typing; an ordinary expense requires typing only the amount. Neither requires an allocation step.
- [ ] The owner attempts these tasks without coaching. Record independent completion, points of confusion, and any reliance on the notebook.
- [ ] Compare ordinary payment entry with the notebook without inventing an unsupported completion-time target.
- [ ] Fix observed input, navigation, or presentation friction within the approved monthly workflow and repeat only the affected trial tasks or checks.
- [ ] Relevant browser acceptance checks remain passing after interaction changes.
- [ ] Record remaining owner-validation questions and real-use blockers; do not declare the prototype a complete notebook replacement while those remain unresolved.

This is not a substitute for testing in earlier slices. Both dependencies are required because this trial exercises monthly exceptions as well as receipt/expense corrections; the correction slice already depends on expenses and late/advance receipts.

Use synthetic data. Authentication, durable operational storage, recovery, privacy, complete rental arrangements, and unresolved advance/deposit/allocation cases must be addressed before a real operational handover. Owner availability is required for the observed trial; automated checks alone do not establish independent usability.
