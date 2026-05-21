---
name: test-driven-development
description: Writes a failing test before the code that satisfies it; for bug
  fixes, reproduces the bug with a test before attempting a fix (the
  Prove-It Pattern). Use when implementing new logic, fixing a bug, or
  changing existing behavior. Triggers on phrases like "let's test this",
  "reproduce this bug", "/ofa-test", or any time you're about to modify
  code with observable behavior. Skip for pure-text content updates,
  configuration changes with no behavioral impact, or code with no
  observable behavior. For *behavioral* config (feature flags, env-driven
  branches, schema changes), still write a test — config that changes
  behavior is behavior.
---

# Test-Driven Development

## Overview

Write a failing test before writing the code that makes it pass. For bug fixes, reproduce the bug with a test before attempting a fix. Tests are proof — "seems right" is not done. A codebase with good tests is an AI agent's superpower; a codebase without tests is a liability.

## When to Use

- Implementing any new logic or behavior
- Fixing any bug (the Prove-It Pattern)
- Modifying existing functionality
- Adding edge case handling
- Any change that could break existing behavior

**When NOT to use:**

- Pure documentation or static-content edits with no code path change
- Formatter or whitespace-only commits (no behavior changed)
- Code that has no observable output (logging-only debug helpers)

**Behavioral config still counts.** A change to a feature flag default,
an env-var-driven branch, or a schema migration *is* a behavior change —
write a test. The "config" exemption only covers content with no
observable runtime effect (e.g., README, build-tool comments).

## Sibling and downstream skills

This skill runs *inside* a slice from `incremental-implementation` — the
per-slice "Test" step is this skill's red→green→refactor loop. Use them
together, not as alternatives:

- **Sibling:** `incremental-implementation` (`/ofa-build`) — TDD owns the
  cycle inside one slice; incremental-implementation owns the slicing,
  commit cadence, and per-slice handoffs.
- **Browser flows:** `browser-testing-with-devtools` is the canonical
  reference for runtime verification in a browser. The "Browser Testing
  with DevTools" section below is a quick pointer; read that skill for
  the full DevTools workflow rather than expanding it here.
- **When the test reveals an unexpected failure mode:**
  `debugging-and-error-recovery`.

## The TDD Cycle

```
    RED                GREEN              REFACTOR
 Write a test    Write minimal code    Clean up the
 that fails  ──→  to make it pass  ──→  implementation  ──→  (repeat)
      │                  │                    │
      ▼                  ▼                    ▼
   Test FAILS        Test PASSES         Tests still PASS
```

### Step 1: RED — Write a Failing Test

Write the test first. It must fail. A test that passes immediately proves nothing.

```typescript
// RED: This test fails because createTask doesn't exist yet
describe('TaskService', () => {
  it('creates a task with title and default status', async () => {
    const task = await taskService.createTask({ title: 'Buy groceries' });

    expect(task.id).toBeDefined();
    expect(task.title).toBe('Buy groceries');
    expect(task.status).toBe('pending');
    expect(task.createdAt).toBeInstanceOf(Date);
  });
});
```

### Step 2: GREEN — Make It Pass

Write the minimum code to make the test pass. Don't over-engineer:

```typescript
// GREEN: Minimal implementation
export async function createTask(input: { title: string }): Promise<Task> {
  const task = {
    id: generateId(),
    title: input.title,
    status: 'pending' as const,
    createdAt: new Date(),
  };
  await db.tasks.insert(task);
  return task;
}
```

### Step 3: REFACTOR — Clean Up

With tests green, improve the code without changing behavior:

- Extract shared logic
- Improve naming
- Remove duplication
- Optimize if necessary

Run tests after every refactor step to confirm nothing broke.

## The Prove-It Pattern (Bug Fixes)

When a bug is reported, **do not start by trying to fix it.** Start by writing a test that reproduces it.

```
Bug report arrives
       │
       ▼
  Write a test that demonstrates the bug
       │
       ▼
  Test FAILS (confirming the bug exists)
       │
       ▼
  Implement the fix
       │
       ▼
  Test PASSES (proving the fix works)
       │
       ▼
  Run full test suite (no regressions)
```

**Example:**

```typescript
// Bug: "Completing a task doesn't update the completedAt timestamp"

// Step 1: Write the reproduction test (it should FAIL)
it('sets completedAt when task is completed', async () => {
  const task = await taskService.createTask({ title: 'Test' });
  const completed = await taskService.completeTask(task.id);

  expect(completed.status).toBe('completed');
  expect(completed.completedAt).toBeInstanceOf(Date);  // This fails → bug confirmed
});

// Step 2: Fix the bug
export async function completeTask(id: string): Promise<Task> {
  return db.tasks.update(id, {
    status: 'completed',
    completedAt: new Date(),  // This was missing
  });
}

// Step 3: Test passes → bug fixed, regression guarded
```

## The Test Pyramid

Invest testing effort according to the pyramid — most tests should be small and fast, with progressively fewer tests at higher levels:

```
          ╱╲
         ╱  ╲         E2E Tests (~5%)
        ╱    ╲        Full user flows, real browser
       ╱──────╲
      ╱        ╲      Integration Tests (~15%)
     ╱          ╲     Component interactions, API boundaries
    ╱────────────╲
   ╱              ╲   Unit Tests (~80%)
  ╱                ╲  Pure logic, isolated, milliseconds each
 ╱──────────────────╲
```

**The Beyonce Rule:** If you liked it, you should have put a test on it. Infrastructure changes, refactoring, and migrations are not responsible for catching your bugs — your tests are. If a change breaks your code and you didn't have a test for it, that's on you.

### Test Sizes (Resource Model)

Beyond the pyramid levels, classify tests by what resources they consume:

| Size | Constraints | Speed | Example |
|------|------------|-------|---------|
| **Small** | Single process, no I/O, no network, no database | Milliseconds | Pure function tests, data transforms |
| **Medium** | Multi-process OK, localhost only, no external services | Seconds | API tests with test DB, component tests |
| **Large** | Multi-machine OK, external services allowed | Minutes | E2E tests, performance benchmarks, staging integration |

Small tests should make up the vast majority of your suite. They're fast, reliable, and easy to debug when they fail.

### Decision Guide

```
Is it pure logic with no side effects?
  → Unit test (small)

Does it cross a boundary (API, database, file system)?
  → Integration test (medium)

Is it a critical user flow that must work end-to-end?
  → E2E test (large) — limit these to critical paths
```

## Writing Good Tests

### Test State, Not Interactions

Assert on the *outcome* of an operation, not on which methods were called internally. Tests that verify method call sequences break when you refactor, even if the behavior is unchanged.

```typescript
// Good: Tests what the function does (state-based)
it('returns tasks sorted by creation date, newest first', async () => {
  const tasks = await listTasks({ sortBy: 'createdAt', sortOrder: 'desc' });
  expect(tasks[0].createdAt.getTime())
    .toBeGreaterThan(tasks[1].createdAt.getTime());
});

// Bad: Tests how the function works internally (interaction-based)
it('calls db.query with ORDER BY created_at DESC', async () => {
  await listTasks({ sortBy: 'createdAt', sortOrder: 'desc' });
  expect(db.query).toHaveBeenCalledWith(
    expect.stringContaining('ORDER BY created_at DESC')
  );
});
```

### DAMP Over DRY in Tests

In production code, DRY (Don't Repeat Yourself) is usually right. In tests, **DAMP (Descriptive And Meaningful Phrases)** is better. A test should read like a specification — each test should tell a complete story without requiring the reader to trace through shared helpers.

```typescript
// DAMP: Each test is self-contained and readable
it('rejects tasks with empty titles', () => {
  const input = { title: '', assignee: 'user-1' };
  expect(() => createTask(input)).toThrow('Title is required');
});

it('trims whitespace from titles', () => {
  const input = { title: '  Buy groceries  ', assignee: 'user-1' };
  const task = createTask(input);
  expect(task.title).toBe('Buy groceries');
});

// Over-DRY: Shared setup obscures what each test actually verifies
// (Don't do this just to avoid repeating the input shape)
```

Duplication in tests is acceptable when it makes each test independently understandable.

### Prefer Real Implementations Over Mocks

Use the simplest test double that gets the job done. The more your tests use real code, the more confidence they provide.

```
Preference order (most to least preferred):
1. Real implementation  → Highest confidence, catches real bugs
2. Fake                 → In-memory version of a dependency (e.g., fake DB)
3. Stub                 → Returns canned data, no behavior
4. Mock (interaction)   → Verifies method calls — use sparingly
```

**Use mocks only when:** the real implementation is too slow, non-deterministic, or has side effects you can't control (external APIs, email sending). Over-mocking creates tests that pass while production breaks.

### Use the Arrange-Act-Assert Pattern

```typescript
it('marks overdue tasks when deadline has passed', () => {
  // Arrange: Set up the test scenario
  const task = createTask({
    title: 'Test',
    deadline: new Date('2025-01-01'),
  });

  // Act: Perform the action being tested
  const result = checkOverdue(task, new Date('2025-01-02'));

  // Assert: Verify the outcome
  expect(result.isOverdue).toBe(true);
});
```

### One Assertion Per Concept

```typescript
// Good: Each test verifies one behavior
it('rejects empty titles', () => { ... });
it('trims whitespace from titles', () => { ... });
it('enforces maximum title length', () => { ... });

// Bad: Everything in one test
it('validates titles correctly', () => {
  expect(() => createTask({ title: '' })).toThrow();
  expect(createTask({ title: '  hello  ' }).title).toBe('hello');
  expect(() => createTask({ title: 'a'.repeat(256) })).toThrow();
});
```

### Name Tests Descriptively

```typescript
// Good: Reads like a specification
describe('TaskService.completeTask', () => {
  it('sets status to completed and records timestamp', ...);
  it('throws NotFoundError for non-existent task', ...);
  it('is idempotent — completing an already-completed task is a no-op', ...);
  it('sends notification to task assignee', ...);
});

// Bad: Vague names
describe('TaskService', () => {
  it('works', ...);
  it('handles errors', ...);
  it('test 3', ...);
});
```

## Test Anti-Patterns to Avoid

| Anti-Pattern | Problem | Fix |
|---|---|---|
| Testing implementation details | Tests break when refactoring even if behavior is unchanged | Test inputs and outputs, not internal structure |
| Flaky tests (timing, order-dependent) | Erode trust in the test suite | Use deterministic assertions, isolate test state |
| Testing framework code | Wastes time testing third-party behavior | Only test YOUR code |
| Snapshot abuse | Large snapshots nobody reviews, break on any change | Use snapshots sparingly and review every change |
| No test isolation | Tests pass individually but fail together | Each test sets up and tears down its own state |
| Mocking everything | Tests pass but production breaks | Prefer real implementations > fakes > stubs > mocks. Mock only at boundaries where real deps are slow or non-deterministic |

## Browser Testing

For anything that runs in a browser, unit tests alone aren't enough — you
need runtime verification (DOM, console, network, screenshots). That
workflow lives in `browser-testing-with-devtools`; load it when a slice
touches the browser.

The TDD cycle wraps DevTools verification: write a failing test first,
then use DevTools to verify the runtime behavior matches the test
expectation, then refactor with both checks still green.

## When to Use Subagents for Testing

For complex bug fixes, spawn a subagent to write the reproduction test:

```
Main agent: "Spawn a subagent to write a test that reproduces this bug:
[bug description]. The test should fail with the current code."

Subagent: Writes the reproduction test

Main agent: Verifies the test fails, then implements the fix,
then verifies the test passes.
```

This separation ensures the test is written without knowledge of the fix, making it more robust.

## See Also

For detailed testing patterns, examples, and anti-patterns across frameworks, see `references/testing-patterns.md`.

## Common Rationalizations

| Rationalization | Reality |
|---|---|
| "I'll write tests after the code works" | You won't, and the tests you do write will be shaped by the code that already exists rather than the behavior it should have. A team I worked with promised follow-up test PRs on six features; one merged. The other five tests still don't exist 14 months later. The honest version of "after the code works" is "never." |
| "This is too simple to test" | "Simple" is a property of the code as it exists today, not the code as it will exist in 18 months. The 30-second test you skipped becomes the 4-hour debug when someone adds a special case to the same function next quarter. The test documents the contract; without it, the contract is whatever the implementation happens to do at any moment. |
| "Tests slow me down" | Tests slow you down for ~5 minutes per behavior. They speed you up every time you change the code later — typical 10x return inside 6 months on actively-edited code. The teams that "don't have time for tests" spend 3-5x longer in the test-and-fix phase than teams that wrote tests up front; the time isn't saved, it's deferred and inflated. |
| "I tested it manually" | Manual testing doesn't persist; the next change overwrites your verification. A team I worked with manually QA'd a payment flow; six weeks later a refactor broke the discount path. The bug shipped because nobody re-ran the manual flow — automated tests would have. |
| "The code is self-explanatory" | Self-explanatory code shows you *what* it does, not *what it should do*. Tests are the only artifact that captures the difference. When the two diverge — i.e., a bug — the test is what tells you which side is wrong. |
| "It's just a prototype" | Prototypes become production. Tests written on day one cost ~10 minutes per behavior; tests retrofitted onto a prototype-turned-production cost days because you no longer remember which assumptions were load-bearing. |
| "Let me run the tests again just to be extra sure" | After a green run on unchanged code, the second run adds zero information — it's a comfort behavior. Run again *after* an edit that could affect the result, not as reassurance. |

## Red Flags

- Writing code without any corresponding tests
- Tests that pass on the first run (they may not be testing what you think)
- "All tests pass" but no tests were actually run
- Bug fixes without reproduction tests
- Tests that test framework behavior instead of application behavior
- Test names that don't describe the expected behavior
- Skipping tests to make the suite pass
- Running the same test command twice in a row without any intervening code change

## Verification

After completing any implementation — each item is verifiable with a
command, file inspection, or runnable artifact:

- [ ] `npm test` (or the project's test command from SPEC.md `## Commands`)
      returns exit 0
- [ ] At least one new test was added in this change set:
      `git diff --stat <base-sha>..HEAD -- '*.test.*' '**/__tests__/**'`
      shows ≥ 1 new or modified test file
- [ ] For bug fixes: the commit that introduced the test is *before* the
      commit that introduced the fix, OR a single commit contains both with
      a comment explicitly identifying the lines that fail without the fix
      (use `git log --reverse --format="%H %s"` to verify)
- [ ] No `it.skip`, `xit`, `describe.skip`, `xdescribe`, `.todo`, or
      framework-equivalent: `grep -REn '\b(it|describe)\.skip\b|\bx(it|describe)\b|\.todo\b' src/ tests/ --include='*.ts' --include='*.js'`
      returns no matches (or only matches the agent has already justified)
- [ ] Test names contain a verb describing behavior — spot-check
      `grep -E "it\(|test\(" -A 0 -h tests/ | head -30`; names like "works",
      "test 1", "handles errors" are red flags
- [ ] If coverage is tracked: line coverage didn't drop. Compare
      `npm test -- --coverage` output against the baseline recorded in
      `tasks/` or CI
