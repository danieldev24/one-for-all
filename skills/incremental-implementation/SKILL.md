---
name: incremental-implementation
description: Delivers changes in thin vertical slices — implement one piece,
  test it, verify it, commit, repeat. Use when implementing a multi-file change,
  building a new feature from a task list, or any time you're about to write
  more than ~100 lines before testing. Triggers on phrases like "let's
  implement", "build this out", "code this up", or as the natural follow-on to
  `planning-and-task-breakdown`. Skip for single-file, single-function changes
  where the scope is already minimal, or when `test-driven-development` is the
  better fit (bug-driven work where a regression test must land first).
---

# Incremental Implementation

## Overview

Build in thin vertical slices — implement one piece, test it, verify it, then expand. Avoid implementing an entire feature in one pass. Each increment should leave the system in a working, testable state. This is the execution discipline that makes large features manageable.

## When to Use

- Implementing any multi-file change
- Building a new feature from a task breakdown
- Refactoring existing code
- Any time you're tempted to write more than ~100 lines before testing

**When NOT to use:**

- Single-file, single-function changes where the scope is already minimal
- Pure mechanical edits (rename, formatter, dependency bump) that touch
  many files but carry no behavioral risk per file
- Bug-driven work where a regression test must land first — go to
  `test-driven-development` (`/ofa-test`), then come back here for the fix
- The change is exploratory ("let me see if this even works") — spike in a
  scratch branch first, then come back here when committing real work

## Upstream and downstream

- **Upstream:** `planning-and-task-breakdown` (`/ofa-plan`) produces the
  task list this skill executes one slice at a time. If you don't have a
  task list, go back there first or you'll re-derive the dependency order
  under time pressure.
- **Sibling:** `test-driven-development` (`/ofa-test`) runs *inside* each
  slice — the per-slice "Test" step in the cycle below is its red→green→
  refactor loop. Use TDD for any non-trivial behavioral change in a slice.
- **Downstream:** `code-review-and-quality` (`/ofa-review`) once the slice
  is done; `debugging-and-error-recovery` if a slice breaks.

## The Increment Cycle

```
┌──────────────────────────────────────┐
│                                      │
│   Implement ──→ Test ──→ Verify ──┐  │
│       ▲                           │  │
│       └───── Commit ◄─────────────┘  │
│              │                       │
│              ▼                       │
│          Next slice                  │
│                                      │
└──────────────────────────────────────┘
```

For each slice:

1. **Implement** the smallest complete piece of functionality
2. **Test** — run the test suite (or write a test if none exists)
3. **Verify** — confirm the slice works as expected (tests pass, build succeeds, manual check)
4. **Commit** -- save your progress with a descriptive message (see `git-workflow-and-versioning` for atomic commit guidance)
5. **Move to the next slice** — carry forward, don't restart

## Slicing Strategies

### Vertical Slices (Preferred)

Build one complete path through the stack:

```
Slice 1: Create a task (DB + API + basic UI)
    → Tests pass, user can create a task via the UI

Slice 2: List tasks (query + API + UI)
    → Tests pass, user can see their tasks

Slice 3: Edit a task (update + API + UI)
    → Tests pass, user can modify tasks

Slice 4: Delete a task (delete + API + UI + confirmation)
    → Tests pass, full CRUD complete
```

Each slice delivers working end-to-end functionality.

### Contract-First Slicing

When backend and frontend need to develop in parallel:

```
Slice 0: Define the API contract (types, interfaces, OpenAPI spec)
Slice 1a: Implement backend against the contract + API tests
Slice 1b: Implement frontend against mock data matching the contract
Slice 2: Integrate and test end-to-end
```

### Risk-First Slicing

Tackle the riskiest or most uncertain piece first:

```
Slice 1: Prove the WebSocket connection works (highest risk)
Slice 2: Build real-time task updates on the proven connection
Slice 3: Add offline support and reconnection
```

If Slice 1 fails, you discover it before investing in Slices 2 and 3.

## Implementation Rules

### Rule 0: Simplicity First

Before writing any code, ask: "What is the simplest thing that could work?"

After writing code, review it against these checks:
- Can this be done in fewer lines?
- Are these abstractions earning their complexity?
- Would a staff engineer look at this and say "why didn't you just..."?
- Am I building for hypothetical future requirements, or the current task?

```
SIMPLICITY CHECK:
✗ Generic EventBus with middleware pipeline for one notification
✓ Simple function call

✗ Abstract factory pattern for two similar components
✓ Two straightforward components with shared utilities

✗ Config-driven form builder for three forms
✓ Three form components
```

Three similar lines of code is better than a premature abstraction. Implement the naive, obviously-correct version first. Optimize only after correctness is proven with tests.

### Rule 0.5: Scope Discipline

Touch only what the task requires.

Do NOT:
- "Clean up" code adjacent to your change
- Refactor imports in files you're not modifying
- Remove comments you don't fully understand
- Add features not in the spec because they "seem useful"
- Modernize syntax in files you're only reading

If you notice something worth improving outside your task scope, note it — don't fix it:

```
NOTICED BUT NOT TOUCHING:
- src/utils/format.ts has an unused import (unrelated to this task)
- The auth middleware could use better error messages (separate task)
→ Want me to create tasks for these?
```

### Rule 1: One Thing at a Time

Each increment changes one logical thing. Don't mix concerns:

**Bad:** One commit that adds a new component, refactors an existing one, and updates the build config.

**Good:** Three separate commits — one for each change.

### Rule 2: Keep It Compilable

After each increment, the project must build and existing tests must pass. Don't leave the codebase in a broken state between slices.

### Rule 3: Feature Flags for Incomplete Features

If a feature isn't ready for users but you need to merge increments:

```typescript
// Feature flag for work-in-progress
const ENABLE_TASK_SHARING = process.env.FEATURE_TASK_SHARING === 'true';

if (ENABLE_TASK_SHARING) {
  // New sharing UI
}
```

This lets you merge small increments to the main branch without exposing incomplete work.

### Rule 4: Safe Defaults

New code should default to safe, conservative behavior:

```typescript
// Safe: disabled by default, opt-in
export function createTask(data: TaskInput, options?: { notify?: boolean }) {
  const shouldNotify = options?.notify ?? false;
  // ...
}
```

### Rule 5: Rollback-Friendly

Each increment should be independently revertable:

- Additive changes (new files, new functions) are easy to revert
- Modifications to existing code should be minimal and focused
- Database migrations should have corresponding rollback migrations
- Avoid deleting something in one commit and replacing it in the same commit — separate them

## Working with Agents

When directing an agent to implement incrementally:

```
"Let's implement Task 3 from the plan.

Start with just the database schema change and the API endpoint.
Don't touch the UI yet — we'll do that in the next increment.

After implementing, run `npm test` and `npm run build` to verify
nothing is broken."
```

Be explicit about what's in scope and what's NOT in scope for each increment.

## Increment Checklist

After each increment, verify:

- [ ] The change does one thing and does it completely
- [ ] All existing tests still pass (`npm test`)
- [ ] The build succeeds (`npm run build`)
- [ ] Type checking passes (`npx tsc --noEmit`)
- [ ] Linting passes (`npm run lint`)
- [ ] The new functionality works as expected
- [ ] The change is committed with a descriptive message

**Note:** Run each verification command after a change that could affect it. After a successful run, don't repeat the same command unless the code has changed since — re-running on unchanged code adds no information.

## Common Rationalizations

| Rationalization | Reality |
|---|---|
| "I'll test it all at the end" | Bugs compound. A team I worked with implemented a five-slice feature without per-slice testing; when the integration test failed at the end, the failure mode pointed at Slice 4 but the *root cause* was a wrong assumption in Slice 1 — three days of bisecting before they found it. Per-slice tests would have caught it inside the original Slice 1 hour. |
| "It's faster to do it all at once" | It feels faster for ~60 minutes, then breaks and stays broken. Bisecting a 500-line uncommitted change against a green baseline takes 2-4 hours on average; bisecting six 80-line commits takes ~10 minutes via `git bisect`. The speed delta is in the debugging, not the typing. |
| "These changes are too small to commit separately" | Small commits are free; large commits charge interest. The cost shows up at revert time: reverting "fix the auth bug AND clean up imports AND update the README" forces you to manually pick out the auth fix, which is exactly the moment you don't want to be reading code carefully. |
| "I'll add the feature flag later" | "Later" usually means "after a user finds the half-built feature in production." If the feature isn't complete, it must not be reachable. Add the flag in the same slice that introduces the feature path — it's two lines. |
| "This refactor is small enough to include" | Refactors mixed with features double the review surface and triple the bisect cost. A reviewer now has to mentally separate "is this refactor sound?" from "does this feature do the right thing?" — they often miss one of the two. Land the refactor first as its own commit, then the feature, then the cleanup. |
| "Let me run the build command again just to be sure" | After a successful run on unchanged code, the second run produces no information — it's a comfort behavior. The cost is small per occurrence but compounds: in long sessions it's the difference between 40 minutes of useful work and 40 minutes of mostly waiting on CI. Run again *after* an edit that could affect the result, not as reassurance. |
| "I'll add the test in a follow-up PR" | Follow-up PRs that "add tests later" merge ~30% of the time in real teams; the rest get deprioritized. Tests written alongside the slice are tests that exist; tests written "later" are tests that don't. |

## Red Flags

- More than 100 lines of code written without running tests
- Multiple unrelated changes in a single increment
- "Let me just quickly add this too" scope expansion
- Skipping the test/verify step to move faster
- Build or tests broken between increments
- Large uncommitted changes accumulating
- Building abstractions before the third use case demands it
- Touching files outside the task scope "while I'm here"
- Creating new utility files for one-time operations
- Running the same build/test command twice in a row without any intervening code change

## Verification

After completing all increments for a task — each item is verifiable with a
command, file check, or numeric output:

- [ ] `git log --oneline <start-sha>..HEAD | wc -l` returns ≥ 2 — at least
      one commit per slice, not a single bulk commit
- [ ] `git diff --stat <start-sha>..HEAD | tail -1` shows roughly the
      expected file count; no commit individually changed > ~5 files (use
      `git log --shortstat` to spot-check)
- [ ] `git status` shows a clean working tree (no uncommitted changes left
      over from the last slice)
- [ ] The full test suite passes (`npm test` or the project's command from
      SPEC.md `## Commands` returns exit 0)
- [ ] The build is clean (`npm run build` returns exit 0; for TypeScript
      projects also `npx tsc --noEmit`)
- [ ] An end-to-end check covering the user-visible behavior of the feature
      passes — either an automated e2e test or a recorded manual walk-through
      against the SPEC.md success criteria
- [ ] No commit message in the slice range contains generic strings like
      "wip", "fix stuff", or "more changes" (`git log --format=%s` to scan)
