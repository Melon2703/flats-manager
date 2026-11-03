# GitHub publication plan

Status: awaiting approval. No specification or ticket issues have been published. Implementation is not authorized.

## Verified state

- GitHub Issues is enabled in `Melon2703/flats-manager`.
- The open-and-closed issue list is empty at preparation time. Recheck immediately before publication.
- Setup uses `AGENTS.md`, GitHub tracker conventions, the five default triage labels, and single-context domain documentation. All five labels exist; the original `wontfix` label was reused.
- The existing specification and six ticket drafts are preserved byte-for-byte. This plan does not regenerate or expand their requirements.

## Proposed publication

1. Confirm approval of this plan, including the mobile-browser UI as the primary acceptance-test boundary.
2. Recheck all open and closed issues. Reuse any matching spec or ticket rather than creating a duplicate. Inspect a potential match's full body before deciding it is the same work.
3. Publish the existing specification as the parent issue titled **Rental Manager — monthly financial workflow prototype**, labeled `ready-for-agent`. Update only stale publication-status text and the now-approved test-seam wording in the GitHub body; retain the local source unchanged. A prepared issue body is available for review separately.
4. Publish the six existing tickets in numeric order as sub-issues of the specification, each labeled `ready-for-agent`. Use existing acceptance criteria and scope. Adapt only issue formatting, unpublished-status text, parent references, and draft dependency numbers to real GitHub identifiers.
5. Add native blocking relationships according to the table below. The installed CLI supports parent and blocking flags. If a repository feature rejects native relationships, use explicit parent/blocker references in issue bodies; report that fallback rather than omitting relationships.
6. Verify issue bodies, labels, parent links, and blocking relationships. Record returned issue URLs in a separate publication record; preserve existing drafts. If publication partially fails, record successes and resume by reusing those issues, never blindly recreating them.

## Existing ticket breakdown

These numbers identify local drafts, not GitHub issue numbers.

| Draft | Existing title | Blocked by drafts | Delivered behavior |
| --- | --- | --- | --- |
| 01 | Record rent and see monthly debt | None | Apartment setup, monthly overview, full/partial receipts, saved records, and visible debt. |
| 02 | Record expenses and see family shares | 01 | Monthly expense entry, net income, and equal family shares for agreed ordinary cases. |
| 03 | Handle monthly rent exceptions | 01 | One-month rent changes, no-rent months, and older unpaid obligations without full historical migration. |
| 04 | Record late receipts and known-month advances | 01 | Receipts retain actual dates while settling earlier or known future rental months without double-counting. |
| 05 | Correct financial entries with history | 02, 04 | Correct or remove receipts/expenses and fix wrong-month entries with recalculated totals and meaningful history. |
| 06 | Validate the complete mobile workflow | 03, 05 | Observed owner trial with ten synthetic apartments and fixes to demonstrated interaction friction. |

The dependency graph is acyclic. Drafts 02, 03, and 04 can proceed independently after 01. Draft 05 needs both entry types and cross-month receipt behavior; 06 needs monthly exceptions and correction behavior, including their transitive prerequisites. No extra edges are proposed.

## Boundaries carried forward

- Publication is not implementation authorization. A ready-for-agent label does not override blockers or the instruction to avoid starting implementation.
- Unknown advance/deposit arrangements, allocation remainders, negative family shares, and exceptional allocation rules remain unresolved; publication does not validate them.
- Trial data is synthetic. Operational privacy, authentication, recovery, complete rental arrangements, and owner validation are still prerequisites to real use.
- Draft 06 requires owner participation; automated checks cannot substitute for observing independent use.
