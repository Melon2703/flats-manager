# Issue tracker: GitHub

Issues and specs live in GitHub Issues in `Melon2703/flats-manager`. Use `gh` with `--repo Melon2703/flats-manager` for issue and label operations.

## Operations

- Verify the target with `gh repo view Melon2703/flats-manager --json nameWithOwner,url` before publishing.
- Read an issue with `gh issue view <number> --repo Melon2703/flats-manager --json number,title,body,labels,comments`.
- Before creating an issue, check open and closed issues for the same specification or ticket. Reuse an existing matching issue rather than publishing a duplicate. Record verified issue URLs after publication.
- Create an issue with `gh issue create --repo Melon2703/flats-manager --title <title> --body-file <file> --label <label>`. Use body files for multiline content.
- List issues with `gh issue list --repo Melon2703/flats-manager --state all --limit 1000 --json number,title,body,labels,url`; paginate through the API if the list reaches the limit.
- Link tickets to the specification using `--parent <spec-number>` when creating each child. If sub-issues are unavailable, include `Part of #<spec-number>` in the child body.
- Express blocking edges using native GitHub dependencies: `--blocked-by <numbers>` at creation or `gh issue edit <child> --repo Melon2703/flats-manager --add-blocked-by <blocker>`. Use real issue numbers, not draft ticket numbers. If native dependencies are unavailable, put `Blocked by: #<number>, #<number>` in the child body.
- Publish blockers before dependent tickets. A ticket can start when all its blockers are closed; a ready-for-agent label alone does not make it unblocked.
- Read the role mapping in `triage-labels.md` before applying labels. Use `gh issue edit <number> --repo Melon2703/flats-manager --add-label <label>` for label updates.
- Posting comments and closing issues use the corresponding `gh issue comment` and `gh issue close` commands. Follow the user's authorization for these writes. Publishing a child does not authorize modifying or closing its parent.

## Current publication boundaries

The existing local specification and six ticket drafts are publication sources. Preserve them; generate only the formatting needed for GitHub issue bodies. Present the existing breakdown and publication plan for approval before publishing. Creating issues does not authorize implementation.

## Pull requests as a triage surface

**PRs as a request surface: no.**
