# Phase 3 Audit Progress (5-axis re-score, after fixes)

Re-scored 2026-05-21, after Tasks 8–15 landed. Same rubric as
[`baseline-audit.md`](baseline-audit.md): 0–3 per axis, 0 = fine,
3 = critical weakness. Phase 3 target: every row ≤ 4/12 on the four
non-handoff axes (handoff stays at 3 until Phase 3.5 closes it).

## Before → After

| Skill | Before | After | Δ | 4-axis sub-total |
|---|---|---|---|---|
| spec-driven-development     | 5/15 | 5/15 | 0  | 2/12 ✓ |
| incremental-implementation  | 6/15 | 6/15 | 0  | 3/12 ✓ |
| test-driven-development     | 6/15 | 6/15 | 0  | 3/12 ✓ |
| planning-and-task-breakdown | 7/15 | 6/15 | -1 | 3/12 ✓ |
| code-review-and-quality     | 7/15 | 7/15 | 0  | 4/12 ✓ |
| context-engineering         | 7/15 | 6/15 | -1 | 3/12 ✓ |
| security-and-hardening      | 8/15 | 6/15 | -2 | 3/12 ✓ |
| api-and-interface-design    | 8/15 | 6/15 | -2 | 3/12 ✓ |

**Mean total:** 6.75/15 → 6.00/15. **All 8 skills meet the ≤ 4/12
four-axis target.** Worst residual: code-review-and-quality at 4/12
(structurally already deduped via `references/five-axis-review.md`;
remaining axis-1s reflect normal review-skill nuance, not blockers).

## Scoring rationale (per skill, after fixes)

### spec-driven-development → 5/15 (4-axis 2/12)

- **Triggers (0):** `skills/spec-driven-development/SKILL.md:13` description now opens with skip cases ("Skip for single-line fixes...") plus trigger phrases. "When NOT to use" expanded to 4 bullets at line 24.
- **Verify (1):** lines 247–259, 6 commandable checks (`test -f SPEC.md`, `grep -E '^## ...' | wc -l`). One subjective bullet remains ("human approved").
- **Overlap (0):** Phase 4 explicitly hands off to `planning-and-task-breakdown`, `incremental-implementation`, `test-driven-development`, `context-engineering` (lines 175–178).
- **Rationalize (1):** rationalizations at lines 218–227 carry concrete cost stats (9 engineer-weeks rework, 30% wrong-thing-shipped rate). One row remains principle-restatement.
- **Handoff (3):** `## Next` deferred to Phase 3.5.

### incremental-implementation → 6/15 (4-axis 3/12)

- **Triggers (1):** description names vertical-slice mechanic and demarcation against TDD. "When NOT to use" still terse at line 14.
- **Verify (1):** lines 268–278, 7 git-based checks (`git log --format=%s` generic-message detector, per-commit file delta).
- **Overlap (0):** "Upstream and downstream" section at line 30 names planning, TDD, code-review, debugging.
- **Rationalize (1):** rationalizations at lines 246–256 with stories (5-slice / Slice-1 root cause / 3 days bisecting; 30% follow-up-test merge rate).
- **Handoff (3):** deferred.

### test-driven-development → 6/15 (4-axis 3/12)

- **Triggers (1):** description carve-out names behavioral config (feature flags, env-driven branches, schema migrations) as still test-required. Skip cases at line 14.
- **Verify (1):** lines 388–406, 6 grep-able checks (test-file diff count, fix-commit ordering, `.skip`/`.todo` detector).
- **Overlap (0):** browser-testing 30-line section collapsed to 6-line pointer to `browser-testing-with-devtools`. "Sibling and downstream" section names `incremental-implementation`.
- **Rationalize (1):** lines 351–365 with stories (1-of-6 follow-up-PR merge rate, 10× return-on-tests, 11/100 AI-PR integration bugs).
- **Handoff (3):** deferred.

### planning-and-task-breakdown → 6/15 (4-axis 3/12)

- **Triggers (1):** description tightened with "When NOT to use" at line 17.
- **Verify (1):** lines 244–259, 7 grep-able checks (title-contains-"and" merged-task detector, ≤ 5 files per task spot-check).
- **Overlap (0):** "Upstream and downstream" section names `spec-driven-development` as input, `incremental-implementation` / `test-driven-development` as consumers.
- **Rationalize (1):** lines 222–230 with billing-refactor failure story (3000-line revert, ~1 week effort) plus 5th rationalization on spec-vs-task distinction.
- **Handoff (3):** deferred.

### code-review-and-quality → 7/15 (4-axis 4/12)

- **Triggers (1):** description at line 11 with skip cases (typo-only, formatter-only, bot-only lockfiles, draft PRs).
- **Verify (1):** lines 297–312, 6 commandable checks (`gh pr view <n> --comments | grep -i critical`, severity-labeled-comments-per-200-lines).
- **Overlap (1):** five-axis content extracted to `references/five-axis-review.md`; SKILL.md retains 5-bullet summary. The skill still semantically owns the multi-axis structure (residual 1/3 reflects this rather than verbatim duplication).
- **Rationalize (1):** lines 273–281 with stories (rate-limit middleware → 3-service choke point / 2 engineer-weeks; 3.2× revert rate on self-reviewed PRs; 18% cleanup-ticket resolution; 11/100 AI-PR subtle-bug rate).
- **Handoff (3):** deferred.

### context-engineering → 6/15 (4-axis 3/12)

- **Triggers (1):** description replaced "starting a new session" with concrete triggers (systematic drift, new-project setup, materially different codebase areas) plus 3 skip cases at line 38.
- **Verify (1):** lines 308–334, 7 grep-able checks (`test -f CLAUDE.md`, `wc -l` for ~2000-line per-task budget, hallucinated-import probe, CONFUSION-block surfacing audit).
- **Overlap (0):** referenced from `spec-driven-development` Phase 4 handoff and `planning-and-task-breakdown` per-task discipline. Internal pointer to `references/input-validation.md` not needed (different concern).
- **Rationalize (1):** lines 287–295 with stories (200-file-repo two-week class-component regression, ~5k-line attention-budget threshold, ~10× drop in hallucinated-import rate with one canonical example) plus 2 new rationalizations.
- **Handoff (3):** deferred.

### security-and-hardening → 6/15 (4-axis 3/12) — fell from 8/15

- **Triggers (1):** description includes explicit code-review trigger ("Security axis of `code-review-and-quality`"). Three-tier skip cases unchanged.
- **Verify (1):** lines 350–374, 9 grep-able / commandable checks (`npm audit --audit-level=high`, git-diff secret grep, schema-validator grep, `curl -sI` for CSP/HSTS, 429 probe on auth endpoints).
- **Overlap (0):** input-validation patterns extracted to `references/input-validation.md`; SKILL.md retains 12-line summary + worked example (SQL-injection rejection at boundary). Was 2/3 in baseline.
- **Rationalize (1):** lines 327–334 with stories (Twitter 2020 internal admin panel, Target 2013 HVAC contractor, IBM $3.86M average breach, 10-min honeypot scan delta, 30% incidents from "just a prototype") plus 6th row on frontend-validation-as-UX-not-security.
- **Handoff (3):** deferred.

### api-and-interface-design → 6/15 (4-axis 3/12) — fell from 8/15

- **Triggers (1):** description with internal-helper / no-surface-refactor / bug-fix-restoration skip cases at line 13.
- **Verify (1):** lines 297–322, 8 commandable checks (`grep -E "z\.object\(" <new-routes>`, `npx @redocly/cli lint`, `tsc --noEmit`, REST-verb-in-URL detector).
- **Overlap (0):** "Validate at Boundaries" 40-line section collapsed to 12-line summary + schema-as-contract worked example. Both skills now reference `references/input-validation.md` instead of duplicating. Was 2/3 in baseline.
- **Rationalize (1):** lines 277–285 with stories (12k-orders pagination outage, email-lowercase Hyrum's Law breaking 3 consumers, PUT-vs-PATCH race condition, "two versions = three versions" maintenance compounding).
- **Handoff (3):** deferred.

## Phase 3 outcome

- ✓ All 8 audit-targeted skills at ≤ 4/12 four-axis (Checkpoint D acceptance criterion).
- ✓ Mean total dropped 6.75 → 6.00.
- ✓ Two reference extractions (`input-validation.md`, `five-axis-review.md`) closed the 2/3 overlap entries on security-and-hardening and api-and-interface-design.
- ✓ `node scripts/scan-duplication.js` reports 0 blocks ≥ 5 eligible lines (same as baseline — extractions preserved this).
- ✓ `node scripts/validate-skills.js --strict` passes 5 of 6 checks; only `## Next` missing (Phase 3.5 closes this).

## Next gate: Checkpoint D

`tasks/todo.md:404`. Confirm with human before opening Phase 3.5
(23-skill `## Next` rollout).
