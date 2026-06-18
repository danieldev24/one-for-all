---
description: Conduct a five-axis code review — correctness, readability, architecture, security, performance
---

Invoke the one-for-all:code-review-and-quality skill.

Token discipline: default to concise `standard` output. Use `lite` only for tiny, low-risk diffs with obvious verification. Escalate to `strict` when risk, ambiguity, failing verification, or the user explicitly asks for deeper analysis.

Review the current changes (staged or recent commits) across all five axes:

1. **Correctness** — Does it match the spec? Edge cases handled? Tests adequate?
2. **Readability** — Clear names? Straightforward logic? Well-organized?
3. **Architecture** — Follows existing patterns? Clean boundaries? Right abstraction level?
4. **Security** — Input validated? Secrets safe? Auth checked? (Use security-and-hardening skill)
5. **Performance** — No N+1 queries? No unbounded ops? (Use performance-optimization skill)

Categorize findings as Critical, Important, or Suggestion.
Output a concise structured review with specific file:line references, fix recommendations, and verification gaps.
