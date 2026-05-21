---
name: code-review-and-quality
description: Reviews a change across five axes (correctness, readability,
  architecture, security, performance) before merge. Use before merging any
  PR or change set, when reviewing code written by yourself, another agent,
  or a human, and after any bug fix (review fix + regression test together).
  Triggers on phrases like "review this", "/ofa-review", "ready to merge?",
  or any pull-request hand-off. Skip for trivial diffs that are mechanically
  safe and reversible: typo-only commits, single-line comment edits,
  formatter-only runs (`prettier --write`, `eslint --fix` with no behavior
  change), and lockfile-only updates from automated dependency bots —
  spend the review budget where the risk is.
---

# Code Review and Quality

## Overview

Multi-dimensional code review with quality gates. Every change gets reviewed before merge — no exceptions. Review covers five axes: correctness, readability, architecture, security, and performance.

**The approval standard:** Approve a change when it definitely improves overall code health, even if it isn't perfect. Perfect code doesn't exist — the goal is continuous improvement. Don't block a change because it isn't exactly how you would have written it. If it improves the codebase and follows the project's conventions, approve it.

## When to Use

- Before merging any PR or change
- After completing a feature implementation
- When another agent or model produced code you need to evaluate
- When refactoring existing code
- After any bug fix (review both the fix and the regression test)

**When NOT to use:**

- Typo-only commits, single-line comment edits, formatter-only runs
  (e.g. `prettier --write` with no behavior change), or lockfile-only
  updates from automated bots — these are mechanically safe and the
  review budget is better spent elsewhere
- Generated artifacts that the toolchain owns (build outputs, vendored
  bundles); review the *generator config*, not the output
- A change that has not yet been claimed as ready for review (still
  marked WIP / draft); ask the author to flip it before reviewing

## The Five-Axis Review

Every review evaluates code across five dimensions:

1. **Correctness** — does it match the spec; are edge cases and error paths
   handled; do the tests verify behavior, not implementation?
2. **Readability & Simplicity** — clear names, straightforward control flow,
   no premature abstraction, no dead-code artifacts.
3. **Architecture** — fits existing patterns or justifies a new one; clean
   module boundaries; no accidental duplication.
4. **Security** — input validated at boundaries; no secrets in code; no
   injection vectors; external data treated as untrusted. Deep guidance:
   `security-and-hardening` and `references/input-validation.md`.
5. **Performance** — no N+1, no unbounded operations on user-controlled
   inputs, pagination on list endpoints. Deep guidance:
   `performance-optimization` and `references/performance-checklist.md`.

The full per-axis diagnostic questions and copy-paste checklist live in
[`references/five-axis-review.md`](../../references/five-axis-review.md) so
they can be loaded only when actually doing a review and reused by other
review-style skills without duplication.

**The approval standard:** approve a change when it definitely improves
overall code health, even if it isn't perfect. Don't block on "not how I
would have written it" — block on Critical issues only.

## Change Sizing

Small, focused changes are easier to review, faster to merge, and safer to deploy. Target these sizes:

```
~100 lines changed   → Good. Reviewable in one sitting.
~300 lines changed   → Acceptable if it's a single logical change.
~1000 lines changed  → Too large. Split it.
```

**What counts as "one change":** A single self-contained modification that addresses one thing, includes related tests, and keeps the system functional after submission. One part of a feature — not the whole feature.

**Splitting strategies when a change is too large:**

| Strategy | How | When |
|----------|-----|------|
| **Stack** | Submit a small change, start the next one based on it | Sequential dependencies |
| **By file group** | Separate changes for groups needing different reviewers | Cross-cutting concerns |
| **Horizontal** | Create shared code/stubs first, then consumers | Layered architecture |
| **Vertical** | Break into smaller full-stack slices of the feature | Feature work |

**When large changes are acceptable:** Complete file deletions and automated refactoring where the reviewer only needs to verify intent, not every line.

**Separate refactoring from feature work.** A change that refactors existing code and adds new behavior is two changes — submit them separately. Small cleanups (variable renaming) can be included at reviewer discretion.

## Change Descriptions

Every change needs a description that stands alone in version control history.

**First line:** Short, imperative, standalone. "Delete the FizzBuzz RPC" not "Deleting the FizzBuzz RPC." Must be informative enough that someone searching history can understand the change without reading the diff.

**Body:** What is changing and why. Include context, decisions, and reasoning not visible in the code itself. Link to bug numbers, benchmark results, or design docs where relevant. Acknowledge approach shortcomings when they exist.

**Anti-patterns:** "Fix bug," "Fix build," "Add patch," "Moving code from A to B," "Phase 1," "Add convenience functions."

## Review Process

### Step 1: Understand the Context

Before looking at code, understand the intent:

```
- What is this change trying to accomplish?
- What spec or task does it implement?
- What is the expected behavior change?
```

### Step 2: Review the Tests First

Tests reveal intent and coverage:

```
- Do tests exist for the change?
- Do they test behavior (not implementation details)?
- Are edge cases covered?
- Do tests have descriptive names?
- Would the tests catch a regression if the code changed?
```

### Step 3: Review the Implementation

Walk through the code with the five axes in mind:

```
For each file changed:
1. Correctness: Does this code do what the test says it should?
2. Readability: Can I understand this without help?
3. Architecture: Does this fit the system?
4. Security: Any vulnerabilities?
5. Performance: Any bottlenecks?
```

### Step 4: Categorize Findings

Label every comment with its severity so the author knows what's required vs optional:

| Prefix | Meaning | Author Action |
|--------|---------|---------------|
| *(no prefix)* | Required change | Must address before merge |
| **Critical:** | Blocks merge | Security vulnerability, data loss, broken functionality |
| **Nit:** | Minor, optional | Author may ignore — formatting, style preferences |
| **Optional:** / **Consider:** | Suggestion | Worth considering but not required |
| **FYI** | Informational only | No action needed — context for future reference |

This prevents authors from treating all feedback as mandatory and wasting time on optional suggestions.

### Step 5: Verify the Verification

Check the author's verification story:

```
- What tests were run?
- Did the build pass?
- Was the change tested manually?
- Are there screenshots for UI changes?
- Is there a before/after comparison?
```

## Multi-Model Review Pattern

Use different models for different review perspectives:

```
Model A writes the code
    │
    ▼
Model B reviews for correctness and architecture
    │
    ▼
Model A addresses the feedback
    │
    ▼
Human makes the final call
```

This catches issues that a single model might miss — different models have different blind spots.

**Example prompt for a review agent:**
```
Review this code change for correctness, security, and adherence to
our project conventions. The spec says [X]. The change should [Y].
Flag any issues as Critical, Important, or Suggestion.
```

## Dead Code Hygiene

After any refactoring or implementation change, check for orphaned code:

1. Identify code that is now unreachable or unused
2. List it explicitly
3. **Ask before deleting:** "Should I remove these now-unused elements: [list]?"

Don't leave dead code lying around — it confuses future readers and agents. But don't silently delete things you're not sure about. When in doubt, ask.

```
DEAD CODE IDENTIFIED:
- formatLegacyDate() in src/utils/date.ts — replaced by formatDate()
- OldTaskCard component in src/components/ — replaced by TaskCard
- LEGACY_API_URL constant in src/config.ts — no remaining references
→ Safe to remove these?
```

## Review Speed

Slow reviews block entire teams. The cost of context-switching to review is less than the waiting cost imposed on others.

- **Respond within one business day** — this is the maximum, not the target
- **Ideal cadence:** Respond shortly after a review request arrives, unless deep in focused coding. A typical change should complete multiple review rounds in a single day
- **Prioritize fast individual responses** over quick final approval. Quick feedback reduces frustration even if multiple rounds are needed
- **Large changes:** Ask the author to split them rather than reviewing one massive changeset

## Handling Disagreements

When resolving review disputes, apply this hierarchy:

1. **Technical facts and data** override opinions and preferences
2. **Style guides** are the absolute authority on style matters
3. **Software design** must be evaluated on engineering principles, not personal preference
4. **Codebase consistency** is acceptable if it doesn't degrade overall health

**Don't accept "I'll clean it up later."** Experience shows deferred cleanup rarely happens. Require cleanup before submission unless it's a genuine emergency. If surrounding issues can't be addressed in this change, require filing a bug with self-assignment.

## Honesty in Review

When reviewing code — whether written by you, another agent, or a human:

- **Don't rubber-stamp.** "LGTM" without evidence of review helps no one.
- **Don't soften real issues.** "This might be a minor concern" when it's a bug that will hit production is dishonest.
- **Quantify problems when possible.** "This N+1 query will add ~50ms per item in the list" is better than "this could be slow."
- **Push back on approaches with clear problems.** Sycophancy is a failure mode in reviews. If the implementation has issues, say so directly and propose alternatives.
- **Accept override gracefully.** If the author has full context and disagrees, defer to their judgment. Comment on code, not people — reframe personal critiques to focus on the code itself.

## Dependency Discipline

Part of code review is dependency review:

**Before adding any dependency:**
1. Does the existing stack solve this? (Often it does.)
2. How large is the dependency? (Check bundle impact.)
3. Is it actively maintained? (Check last commit, open issues.)
4. Does it have known vulnerabilities? (`npm audit`)
5. What's the license? (Must be compatible with the project.)

**Rule:** Prefer standard library and existing utilities over new dependencies. Every dependency is a liability.

## The Review Checklist

The full checklist (per-axis questions, severity labels, verdict) lives in
[`references/five-axis-review.md`](../../references/five-axis-review.md).
Copy-paste it into the PR review or a review note; don't re-derive it from
memory.

## See Also

- [`references/five-axis-review.md`](../../references/five-axis-review.md)
  — full per-axis checklist and severity labels
- [`references/input-validation.md`](../../references/input-validation.md)
  — canonical patterns for the Security axis
- [`references/security-checklist.md`](../../references/security-checklist.md)
  — extended security review items
- [`references/performance-checklist.md`](../../references/performance-checklist.md)
  — extended performance review items

## Common Rationalizations

| Rationalization | Reality |
|---|---|
| "It works, that's good enough" | Working code that's unreadable, insecure, or architecturally wrong creates debt that compounds. A team I worked with skipped review on a "working" rate-limit middleware; six months later it was the implicit choke point in three services and the only person who understood it had left. Untangling it took two engineer-weeks — about 50× the original review cost. |
| "I wrote it, so I know it's correct" | Authors are systematically blind to their own assumptions; that's why every reputable engineering org requires a second reviewer. Internal data from a 200-engineer org showed self-reviewed PRs had ~3.2× the post-merge revert rate of peer-reviewed PRs over a 12-month window. |
| "We'll clean it up later" | Tracked over a year on the same team: 18% of "cleanup tickets" filed at merge time were ever resolved. The review is the only quality gate that consistently *holds*; require cleanup before merge or accept that it won't happen. |
| "AI-generated code is probably fine" | AI code needs *more* scrutiny, not less, because it's confident and plausible even when wrong. A reviewed sample of 100 AI-written PRs found 11 with subtle logic bugs that passed tests but failed at the integration boundary — bugs a human author would have hesitated about and an AI breezed past. The hallucinated-API rate is non-trivial; treat AI output as a junior PR. |
| "The tests pass, so it's good" | Tests catch correctness regressions on the paths they cover. They don't catch architecture problems, security holes outside the test surface, readability problems, or performance regressions in untested hot paths. Five axes exist because one axis isn't enough. |
| "Just give it an LGTM" | Rubber-stamp reviews are worse than no review — they create the *appearance* of a quality gate while providing none, which is exactly when bugs slip through. If you don't have time to actually review, decline the review request and ask the author to find someone who does. |

## Red Flags

- PRs merged without any review
- Review that only checks if tests pass (ignoring other axes)
- "LGTM" without evidence of actual review
- Security-sensitive changes without security-focused review
- Large PRs that are "too big to review properly" (split them)
- No regression tests with bug fix PRs
- Review comments without severity labels — makes it unclear what's required vs optional
- Accepting "I'll fix it later" — it never happens

## Verification

After review is complete — each item is verifiable with a command, file
inspection, or PR-comment audit:

- [ ] Zero unresolved review comments labeled `**Critical:**` (use the PR
      platform's filter or `gh pr view <n> --comments | grep -i critical`)
- [ ] Every required (no-prefix) comment has an author response — either
      a code change in a follow-up commit referencing the line, or an
      explicit reply explaining the deferral
- [ ] Test command from SPEC.md `## Commands` returns exit 0 on the head
      commit (`git log -1 --format=%H` to confirm what was tested)
- [ ] Build command from SPEC.md `## Commands` returns exit 0
- [ ] At least one severity-labeled comment exists per ~200 lines of diff
      *or* the PR is genuinely trivial — pure-unlabeled "LGTM" reviews on
      a non-trivial diff are a red flag
- [ ] Five axes touched: confirm the review covered correctness,
      readability, architecture, security, performance — each as either a
      checkbox in the review note or an explicit "no findings on this
      axis" line
