---
name: planning-and-task-breakdown
description: Breaks a spec into ordered, vertically-sliced tasks with explicit
  acceptance criteria. Use when an approved spec exists (from
  `spec-driven-development`) and the next step is task breakdown. Triggers on
  phrases like "break this down", "what's the order", "let's plan this out",
  or any time a task feels too large to start (>5 files, >2 hours of agent
  work, or you can't describe acceptance in 3 bullets). Skip for single-file
  changes with obvious scope, when the spec already contains a well-formed
  task list, or for typo/comment-cleanup work where planning is overhead.
workflow_mode: standard
max_context_files: 5
default_output: concise
---

# Planning and Task Breakdown

## Overview

Decompose work into small, verifiable tasks with explicit acceptance criteria. Good task breakdown is the difference between an agent that completes work reliably and one that produces a tangled mess. Every task should be small enough to implement, test, and verify in a single focused session.

## When to Use

- You have a spec and need to break it into implementable units
- A task feels too large or vague to start
- Work needs to be parallelized across multiple agents or sessions
- You need to communicate scope to a human
- The implementation order isn't obvious

**When NOT to use:**

- Single-file changes with obvious scope (≤2 files, one logical concern)
- The spec already contains a well-formed task list with acceptance criteria
- Pure mechanical work (formatter run, dead-code removal, dependency bump)
- A `tasks/plan.md` (or equivalent) already exists for this scope — *update*
  it instead of starting over

## Upstream and downstream

This skill sits between two others; lean on them rather than re-deriving:

- **Upstream:** `spec-driven-development` (`/ofa-spec`) produces a spec under
  `specs/` that becomes this skill's input. If you don't have a spec, go back
  there first — task breakdown without a spec is fiction.
- **Downstream:** `incremental-implementation` (`/ofa-build`) consumes the
  task list one slice at a time. The task shape below is tuned to its
  per-slice cycle (one logical change, runnable verification, commit). If
  the first task is bug-driven, hand to `test-driven-development`
  (`/ofa-test`) so a regression test lands first.

## The Planning Process

### Step 1: Enter Plan Mode

Before writing any code, operate in read-only mode:

- Read the spec and relevant codebase sections
- Identify existing patterns and conventions
- Map dependencies between components
- Note risks and unknowns

**Do NOT write code during planning.** The output is a plan document, not implementation.

### Concise Plans for Small Scope

When the spec is narrow and low-risk, use `lite` guidance from
[`references/token-efficiency.md`](../../references/token-efficiency.md) to
avoid over-loading context. Read the spec, existing task files if present, and
only directly relevant source files found by targeted search. Keep the plan to
the smallest structure that still preserves dependency order, acceptance
criteria, verification, and checkpoints.

Use the full template below for ambiguous, risky, multi-system, or parallelized
work. For small changes, a short overview plus ordered tasks and verification is
enough.

### Step 2: Identify the Dependency Graph

Map what depends on what:

```
Database schema
    │
    ├── API models/types
    │       │
    │       ├── API endpoints
    │       │       │
    │       │       └── Frontend API client
    │       │               │
    │       │               └── UI components
    │       │
    │       └── Validation logic
    │
    └── Seed data / migrations
```

Implementation order follows the dependency graph bottom-up: build foundations first.

### Step 3: Slice Vertically

Instead of building all the database, then all the API, then all the UI — build one complete feature path at a time:

**Bad (horizontal slicing):**
```
Task 1: Build entire database schema
Task 2: Build all API endpoints
Task 3: Build all UI components
Task 4: Connect everything
```

**Good (vertical slicing):**
```
Task 1: User can create an account (schema + API + UI for registration)
Task 2: User can log in (auth schema + API + UI for login)
Task 3: User can create a task (task schema + API + UI for creation)
Task 4: User can view task list (query + API + UI for list view)
```

Each vertical slice delivers working, testable functionality.

### Step 4: Write Tasks

Each task follows this structure:

```markdown
## Task [N]: [Short descriptive title]

**Description:** One paragraph explaining what this task accomplishes.

**Acceptance criteria:**
- [ ] [Specific, testable condition]
- [ ] [Specific, testable condition]

**Verification:**
- [ ] Tests pass: `npm test -- --grep "feature-name"`
- [ ] Build succeeds: `npm run build`
- [ ] Manual check: [description of what to verify]

**Dependencies:** [Task numbers this depends on, or "None"]

**Files likely touched:**
- `src/path/to/file.ts`
- `tests/path/to/test.ts`

**Estimated scope:** [Small: 1-2 files | Medium: 3-5 files | Large: 5+ files]
```

### Step 5: Order and Checkpoint

Arrange tasks so that:

1. Dependencies are satisfied (build foundation first)
2. Each task leaves the system in a working state
3. Verification checkpoints occur after every 2-3 tasks
4. High-risk tasks are early (fail fast)

Add explicit checkpoints:

```markdown
## Checkpoint: After Tasks 1-3
- [ ] All tests pass
- [ ] Application builds without errors
- [ ] Core user flow works end-to-end
- [ ] Review with human before proceeding
```

## Task Sizing Guidelines

| Size | Files | Scope | Example |
|------|-------|-------|---------|
| **XS** | 1 | Single function or config change | Add a validation rule |
| **S** | 1-2 | One component or endpoint | Add a new API endpoint |
| **M** | 3-5 | One feature slice | User registration flow |
| **L** | 5-8 | Multi-component feature | Search with filtering and pagination |
| **XL** | 8+ | **Too large — break it down further** | — |

If a task is L or larger, it should be broken into smaller tasks. An agent performs best on S and M tasks.

**When to break a task down further:**
- It would take more than one focused session (roughly 2+ hours of agent work)
- You cannot describe the acceptance criteria in 3 or fewer bullet points
- It touches two or more independent subsystems (e.g., auth and billing)
- You find yourself writing "and" in the task title (a sign it is two tasks)

## Plan Document Template

```markdown
# Implementation Plan: [Feature/Project Name]

## Overview
[One paragraph summary of what we're building]

## Architecture Decisions
- [Key decision 1 and rationale]
- [Key decision 2 and rationale]

## Task List

### Phase 1: Foundation
- [ ] Task 1: ...
- [ ] Task 2: ...

### Checkpoint: Foundation
- [ ] Tests pass, builds clean

### Phase 2: Core Features
- [ ] Task 3: ...
- [ ] Task 4: ...

### Checkpoint: Core Features
- [ ] End-to-end flow works

### Phase 3: Polish
- [ ] Task 5: ...
- [ ] Task 6: ...

### Checkpoint: Complete
- [ ] All acceptance criteria met
- [ ] Ready for review

## Risks and Mitigations
| Risk | Impact | Mitigation |
|------|--------|------------|
| [Risk] | [High/Med/Low] | [Strategy] |

## Open Questions
- [Question needing human input]
```

## Parallelization Opportunities

When multiple agents or sessions are available:

- **Safe to parallelize:** Independent feature slices, tests for already-implemented features, documentation
- **Must be sequential:** Database migrations, shared state changes, dependency chains
- **Needs coordination:** Features that share an API contract (define the contract first, then parallelize)

## Common Rationalizations

| Rationalization | Reality |
|---|---|
| "I'll figure it out as I go" | "As I go" usually means "after I've already coded the wrong abstraction." A team I worked with kicked off a billing refactor without a written plan; halfway through they discovered the tax module depended on the old invoice IDs and had to revert ~3,000 lines of work — about a week of effort. A 30-minute dependency-graph pass would have caught it. |
| "The tasks are obvious" | If they're obvious, writing them takes 5 minutes — no harm done. If they're not, you discover that *while writing*, which is the whole point. The expensive failure mode is "I thought it was obvious and I was wrong, four hours in." |
| "Planning is overhead" | Planning *is* the task; coding is the implementation of the plan. Skipping planning is like skipping the architectural drawings and starting with bricks — possible, but the building is now load-bearing on whatever the bricklayer assumed at the time. |
| "I can hold it all in my head" | Context windows are finite, sessions get compacted, and humans get pinged off the keyboard. A written plan is the only artifact that survives all three. The cost of writing it is one paragraph; the cost of *not* writing it is re-deriving the dependency order from the codebase under time pressure. |
| "The spec already lists the work" | Specs describe *what* and *why*. Task breakdown is about *order, slicing, and verification* — different artifact, different shape. Treating the spec's bullet list as a task list is how you end up with horizontal slices and a 5-day integration phase at the end. |

## Red Flags

- Starting implementation without a written task list
- Tasks that say "implement the feature" without acceptance criteria
- No verification steps in the plan
- All tasks are XL-sized
- No checkpoints between tasks
- Dependency order isn't considered
- Loading broad references before the plan shows they are needed

## Verification

Before starting implementation, confirm — each item is checkable with a
command, file inspection, or numeric count:

- [ ] `test -f tasks/plan.md` (or equivalent) succeeds
- [ ] `grep -c '^- \[ \] ' tasks/todo.md` returns ≥ 1 — at least one task exists
- [ ] Every task block contains both an `Acceptance` line and a `Verify` line
      (`grep -E '^\s*-\s*(Acceptance|Verify):' tasks/todo.md` — count should
      equal 2× the number of tasks, or close to it)
- [ ] No task touches more than ~5 files. Spot-check by looking at the
      `Files likely touched` lists; any list with > 5 entries is a re-split
      candidate
- [ ] Checkpoints appear between major phases — `grep -c 'Checkpoint' tasks/todo.md`
      returns ≥ 2 (most plans have ≥ 1 mid-build checkpoint and 1 final review)
- [ ] No task title contains " and " (a sign two tasks were merged) —
      `grep -E '^\s*###?\s+Task.*\band\b' tasks/todo.md` returns nothing
- [ ] Human acknowledged the plan in chat before any code edit (record the
      message turn so the approval is auditable)

## Next

After this skill exits, advise the user on what to do next. Pick the row
that matches the situation:

| If the situation is... | Suggest invoking |
|---|---|
| Plan is approved — start executing the task list | `/ofa-build` (`incremental-implementation`) |
| Planning surfaced gaps in the spec | `/ofa-spec` (`spec-driven-development`) |
| First task is bug-driven — land a regression test first | `/ofa-test` (`test-driven-development`) |

End the conversation turn with: `Next: I recommend <skill-or-command> because <one-line reason>.`
