---
description: Simplify code for clarity and maintainability — reduce complexity without changing behavior
---

Invoke the one-for-all:code-simplification skill.

Token discipline: default to concise `standard` output. Use `lite` only for tiny, low-risk simplifications with obvious verification. Escalate to `strict` when risk, ambiguity, failing verification, or the user explicitly asks for deeper analysis.

Lean discipline: reduce owned surface area without changing behavior or cutting validation, security, accessibility, or data-safety checks.

Simplify recently changed code (or the specified scope) while preserving exact behavior:

1. Read CLAUDE.md and study project conventions
2. Identify the target code — recent changes unless a broader scope is specified
3. Understand the code's purpose, callers, edge cases, and test coverage before touching it
4. Scan for simplification opportunities:
   - Deep nesting → guard clauses or extracted helpers
   - Long functions → split by responsibility
   - Nested ternaries → if/else or switch
   - Generic names → descriptive names
   - Duplicated logic → shared functions
   - Dead code → remove after confirming
5. Apply each simplification incrementally — run tests after each change
6. Verify all tests pass, the build succeeds, and the diff is clean

If tests fail after a simplification, revert that change and reconsider. Use `code-review-and-quality` to review the result.
