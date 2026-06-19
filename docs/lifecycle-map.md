# Lifecycle Map

This document is the **single source of truth** for which skill follows which in the `one-for-all` workflow. Every skill's `## Next` section pulls its handoff suggestions from this map. When the workflow changes, change this file first, then propagate.

## How to read this map

- A **forward edge** is the canonical happy-path next step. After finishing skill A, the most common next action invokes skill B.
- A **branch edge** is an alternate path: a step-back when context is missing, a parallel concern that came up, or a more specialized skill for the specific situation.
- **Slash commands** (`/ofa-spec`, `/ofa-plan`, …) are entry points wired to skills. They appear as suggestions in `## Next` tables when invoking the command is more natural than naming the skill.
- Every skill must have at least one outgoing edge — a dead-end is a bug.

## The canonical spine

```
                         ┌──────────────────────┐
                         │  using-one-for-all   │  (meta — entry point)
                         └──────────┬───────────┘
                                    │
              ┌─────────────────────┴─────────────────────┐
              │                                           │
              ▼                                           ▼
        DEFINE phase                              direct skill load
   ┌──────────────────┐
   │   interview-me   │ ◄─── (when requirements vague)
   └────────┬─────────┘
            │
            ▼
   ┌──────────────────┐
   │   idea-refine    │ ◄─── (when concept needs exploration)
   └────────┬─────────┘
            │
            ▼
   ┌──────────────────────────┐
   │ spec-driven-development  │ ◄── /ofa-spec
   └────────────┬─────────────┘
                │
                ▼  PLAN phase
   ┌─────────────────────────────────┐
   │  planning-and-task-breakdown    │ ◄── /ofa-plan
   └────────────┬────────────────────┘
                │
                ▼  BUILD phase
   ┌─────────────────────────────────┐
   │  incremental-implementation     │ ◄── /ofa-build
   │  + test-driven-development      │ ◄── /ofa-test
   └────────────┬────────────────────┘
                │
                ▼  VERIFY phase
   ┌─────────────────────────────────┐
   │  browser-testing-with-devtools  │
   │  debugging-and-error-recovery   │
   └────────────┬────────────────────┘
                │
                ▼  REVIEW phase
   ┌─────────────────────────────────┐
   │  code-review-and-quality        │ ◄── /ofa-review
   │  code-simplification            │ ◄── /ofa-code-simplify
   │  security-and-hardening         │
   │  performance-optimization       │
   └────────────┬────────────────────┘
                │
                ▼  SHIP phase
   ┌─────────────────────────────────┐
   │  git-workflow-and-versioning    │
   │  ci-cd-and-automation           │
   │  deprecation-and-migration      │
   │  documentation-and-adrs         │
   │  shipping-and-launch            │ ◄── /ofa-ship
   └─────────────────────────────────┘
```

Cross-cutting skills (loaded as needed at any phase):

```
   context-engineering          (when agent quality degrades)
   source-driven-development    (when grounding decisions in authoritative sources)
   doubt-driven-development     (when uncertainty is high)
   frontend-ui-engineering      (when building web UI)
   mobile-ui-engineering        (when building mobile UI — RN/Expo, Flutter, iOS, Android, KMP)
   api-and-interface-design     (when designing contracts)
```

## Lean Senior SDLC Gate

Lean Senior SDLC is a cross-cutting discipline, not a new phase or skill edge.
Use [`references/lean-senior-sdlc.md`](../references/lean-senior-sdlc.md) to
keep each phase focused on the smallest correct, verified path:

| Phase | Lean question |
|---|---|
| Define | What is the smallest user problem worth solving now? |
| Plan | What is the smallest vertical slice with clear acceptance criteria? |
| Build | What can existing code, stdlib, native behavior, or installed packages cover? |
| Verify | What is the minimal check that would fail if this is wrong? |
| Review | What can be deleted, inlined, or deferred without losing correctness? |
| Ship | What is the simplest release path with clear rollback evidence? |

These gates do not change the canonical spine below. They constrain how much
scope each existing phase is allowed to create.

Mobile pair (Build → Verify) mirrors the web pair:

```
   ┌────────────────────────────┐         ┌────────────────────────────┐
   │   frontend-ui-engineering  │   →     │  browser-testing-with-     │
   │     (web UI)               │         │    devtools                │
   └────────────────────────────┘         └────────────────────────────┘

   ┌────────────────────────────┐         ┌────────────────────────────┐
   │   mobile-ui-engineering    │   →     │  mobile-simulator-testing  │
   │     (native + cross-       │         │    (Xcode Sim, Android     │
   │      platform mobile)      │         │     Emulator, Expo,        │
   │                            │         │     Flutter DevTools, KMP) │
   └────────────────────────────┘         └────────────────────────────┘
```

---

## Edges by skill

For each skill: the canonical forward edge plus 1–2 branch edges that are most likely to apply. `## Next` tables are built from these.

### Meta

#### `using-one-for-all`
- **Forward:** depends on the situation — this is a router, not a step. Each row in its `## Next` maps a phase to the appropriate entry skill.
- Branches: `spec-driven-development`, `planning-and-task-breakdown`, `incremental-implementation`, `frontend-ui-engineering`, `doubt-driven-development`, `code-review-and-quality`, `shipping-and-launch`.

### Define

#### `interview-me`
- **Forward:** `spec-driven-development` (`/ofa-spec`) — once requirements are clear, write the spec.
- **Branches:**
  - `idea-refine` — if the concept itself is vague, not just the requirements.

#### `idea-refine`
- **Forward:** `spec-driven-development` (`/ofa-spec`) — once the concept is concrete, write a spec.
- **Branches:**
  - `interview-me` — if user preferences are still unclear.

#### `spec-driven-development`
- **Forward:** `planning-and-task-breakdown` (`/ofa-plan`) — break the spec into ordered tasks.
- **Branches:**
  - `interview-me` — if the spec exposed unresolved requirements.
  - `incremental-implementation` (`/ofa-build`) — small/obvious changes can skip planning.

### Plan

#### `planning-and-task-breakdown`
- **Forward:** `incremental-implementation` (`/ofa-build`) — execute the task list.
- **Branches:**
  - `spec-driven-development` (`/ofa-spec`) — if planning surfaced gaps in the spec.
  - `test-driven-development` (`/ofa-test`) — if the first task is bug-driven and a regression test should land first.

### Build

#### `incremental-implementation`
- **Forward:** `code-review-and-quality` (`/ofa-review`) — review the slice before merging.
- **Branches:**
  - `test-driven-development` (`/ofa-test`) — if the slice needs more test coverage.
  - `debugging-and-error-recovery` — if the slice is broken.

#### `test-driven-development`
- **Forward:** `incremental-implementation` (`/ofa-build`) — implement against the failing test.
- **Branches:**
  - `debugging-and-error-recovery` — if the test reveals an unexpected failure mode.
  - `browser-testing-with-devtools` — if the behavior is in the browser.

#### `context-engineering`
- **Forward:** return to whichever skill the agent was working on (no fixed forward edge).
- **Branches:**
  - `source-driven-development` — if the missing context is in authoritative sources.
  - `incremental-implementation` (`/ofa-build`) — once context is loaded, resume implementation.

#### `source-driven-development`
- **Forward:** return to the originating skill (often `incremental-implementation` or `code-review-and-quality`).
- **Branches:**
  - `context-engineering` — if more general context (not just sources) is missing.

#### `doubt-driven-development`
- **Forward:** return to the originating skill once uncertainty is named.
- **Branches:**
  - `interview-me` — if the doubt is a stakeholder question.
  - `source-driven-development` — if the doubt can be resolved by reading authoritative sources.

#### `frontend-ui-engineering`
- **Forward:** `browser-testing-with-devtools` — verify the UI in a real browser.
- **Branches:**
  - `code-review-and-quality` (`/ofa-review`) — if the UI is ready for review.
  - `performance-optimization` — if Core Web Vitals or render perf is the concern.

#### `mobile-ui-engineering`
- **Forward:** `mobile-simulator-testing` — verify the UI on a real simulator/emulator.
- **Branches:**
  - `code-review-and-quality` (`/ofa-review`) — if the UI is ready for review.
  - `performance-optimization` — if frame rate, list-scroll perf, or startup time is the concern.
  - `security-and-hardening` — when handling permissions, deep links, or platform-specific input boundaries.

#### `api-and-interface-design`
- **Forward:** `incremental-implementation` (`/ofa-build`) — implement against the contract.
- **Branches:**
  - `security-and-hardening` — for input validation and authz patterns.
  - `deprecation-and-migration` — when changing an existing public contract.

### Verify

#### `browser-testing-with-devtools`
- **Forward:** `code-review-and-quality` (`/ofa-review`) — once verified, send for review.
- **Branches:**
  - `debugging-and-error-recovery` — if verification surfaced a bug.
  - `performance-optimization` — if rendering is slow.

#### `mobile-simulator-testing`
- **Forward:** `code-review-and-quality` (`/ofa-review`) — once verified on simulator/emulator, send for review.
- **Branches:**
  - `debugging-and-error-recovery` — if simulator surfaced a crash or unexpected behavior.
  - `performance-optimization` — if frame rate, jank, or startup time is the concern.
  - `mobile-ui-engineering` — if verification surfaced a UI architecture issue, not a runtime bug.

#### `debugging-and-error-recovery`
- **Forward:** `test-driven-development` (`/ofa-test`) — write a regression test that captures the bug, then fix.
- **Branches:**
  - `incremental-implementation` (`/ofa-build`) — once the fix lands, continue the task list.
  - `source-driven-development` — when the bug stems from misreading authoritative sources.

### Review

#### `code-review-and-quality`
- **Forward:** `shipping-and-launch` (`/ofa-ship`) — once review passes, run the pre-launch checklist.
- **Branches:**
  - `code-simplification` (`/ofa-code-simplify`) — if review surfaced complexity issues.
  - `security-and-hardening` — if review surfaced security concerns.
  - `performance-optimization` — if review surfaced perf concerns.

#### `code-simplification`
- **Forward:** `code-review-and-quality` (`/ofa-review`) — re-review after simplification.
- **Branches:**
  - `test-driven-development` (`/ofa-test`) — verify simplification didn't change behavior.

#### `security-and-hardening`
- **Forward:** `code-review-and-quality` (`/ofa-review`) — security findings feed back into review.
- **Branches:**
  - `api-and-interface-design` — for input-validation work at API boundaries.
  - `git-workflow-and-versioning` — for secrets-management workflow.

#### `performance-optimization`
- **Forward:** `code-review-and-quality` (`/ofa-review`) — perf changes get re-reviewed.
- **Branches:**
  - `browser-testing-with-devtools` — if measuring frontend perf.
  - `test-driven-development` (`/ofa-test`) — add perf-regression tests where possible.

### Ship

#### `git-workflow-and-versioning`
- **Forward:** `ci-cd-and-automation` — once branches and commits are clean, the pipeline takes over.
- **Branches:**
  - `documentation-and-adrs` — for changelog or ADR updates.

#### `ci-cd-and-automation`
- **Forward:** `shipping-and-launch` (`/ofa-ship`) — pipeline green is a precondition for ship.
- **Branches:**
  - `deprecation-and-migration` — when shipping breaking changes.

#### `deprecation-and-migration`
- **Forward:** `documentation-and-adrs` — record the migration plan.
- **Branches:**
  - `api-and-interface-design` — when designing the replacement contract.
  - `shipping-and-launch` (`/ofa-ship`) — when migration is ready to ship.

#### `documentation-and-adrs`
- **Forward:** `shipping-and-launch` (`/ofa-ship`) — docs and ADRs typically land alongside the ship.
- **Branches:**
  - `code-review-and-quality` (`/ofa-review`) — if docs need review.

#### `shipping-and-launch`
- **Forward:** none — this is the terminal phase. After ship, the next change starts a new lifecycle at `spec-driven-development`.
- **Branches:**
  - `debugging-and-error-recovery` — if the launch surfaced an incident.
  - `documentation-and-adrs` — for post-mortems and runbooks.

---

## Updating this map

1. Decide whether a new edge is **forward** (canonical) or **branch** (situational).
2. Edit this file.
3. Update the `## Next` table in the source skill so the new edge appears in the suggestions.
4. Run `node scripts/check-lifecycle-chain.js` to confirm no broken references.
5. Commit map + skill edits in the same commit so the source-of-truth and the skill stay in lockstep.
