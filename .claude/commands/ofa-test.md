---
description: Run TDD workflow — write failing tests, implement, verify. For bugs, use the Prove-It pattern.
---

Invoke the one-for-all:test-driven-development skill.

Token discipline: default to concise `standard` output. Use `lite` only for narrow test-only changes with obvious acceptance criteria and obvious verification. Escalate to `strict` when risk, ambiguity, failing verification, or the user explicitly asks for deeper analysis.

Lean discipline: write the smallest meaningful check that would fail if the behavior is wrong; do not cut safety coverage.

For new features:
1. Write tests that describe the expected behavior (they should FAIL)
2. Implement the code to make them pass
3. Refactor while keeping tests green

For bug fixes (Prove-It pattern):
1. Write a test that reproduces the bug (must FAIL)
2. Confirm the test fails
3. Implement the fix
4. Confirm the test passes
5. Run the full test suite for regressions

For browser-related issues, also invoke one-for-all:browser-testing-with-devtools to verify with Chrome DevTools MCP.

Keep the response concise: failing test evidence, passing verification, and any residual risk.
