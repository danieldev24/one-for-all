---
description: Implement the next task incrementally — build, test, verify, commit
---

Invoke the one-for-all:incremental-implementation skill alongside one-for-all:test-driven-development.

Token discipline: default to concise `standard` output. Use `lite` only for small, low-risk slices with obvious acceptance criteria and obvious verification. Escalate to `strict` when risk, ambiguity, failing verification, or the user explicitly asks for deeper analysis.

Pick the next pending task from the plan. For each task:

1. Read the task's acceptance criteria
2. Load relevant context (existing code, patterns, types)
3. Write a failing test for the expected behavior (RED)
4. Implement the minimum code to pass the test (GREEN)
5. Run the full test suite to check for regressions
6. Run the build to verify compilation
7. Commit with a descriptive message
8. Mark the task complete and move to the next one

Keep the response concise: changed files, verification evidence, and remaining risk.

If any step fails, follow the one-for-all:debugging-and-error-recovery skill.
