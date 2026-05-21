# Five-Axis Review Checklist

The canonical multi-axis review checklist used by `code-review-and-quality`.
Other skills (e.g. `security-and-hardening`, `performance-optimization`)
contribute deeper guidance on individual axes; this is the integration
point that puts them all on one page so a reviewer can run a single pass.

Use this file as a copy-paste template at the bottom of a PR review or as
the structure for an internal review note. Each axis has both the
diagnostic questions to ask and the checklist items to mark off.

## 1. Correctness

Does the code do what it claims to do?

**Diagnostic questions:**

- Does it match the spec or task requirements?
- Are edge cases handled (null, empty, boundary values, off-by-one)?
- Are error paths handled, not just the happy path?
- Do tests test the *behavior*, or only the implementation?
- Are there race conditions, state inconsistencies, or unhandled
  concurrent-modification cases?

**Checklist:**

- [ ] Change matches spec/task requirements
- [ ] Edge cases handled (empty, null, boundary, max/min, unicode)
- [ ] Error paths handled (not just happy path)
- [ ] Tests exist and cover the change adequately (see
      `test-driven-development` for what "adequately" means)
- [ ] No off-by-one, no race condition, no order-dependent assumption

## 2. Readability and Simplicity

Can another engineer (or agent) understand this code without the author
explaining it?

**Diagnostic questions:**

- Are names descriptive and consistent with project conventions? (No
  `temp`, `data`, `result` without context.)
- Is the control flow straightforward (no nested ternaries, no deep
  callback chains)?
- Is the code organized logically (related code grouped, clear module
  boundaries)?
- Could this be done in fewer lines? (1000 lines where 100 suffice is a
  failure.)
- Are abstractions earning their complexity? (Don't generalize until the
  third use case.)
- Are there dead-code artifacts (no-op `_unused` vars, backwards-compat
  shims, `// removed` comments)?

**Checklist:**

- [ ] Names clear and consistent with project conventions
- [ ] Control flow is straightforward
- [ ] No "clever" tricks that obscure intent
- [ ] No premature abstraction (extract on third use, not first)
- [ ] No dead-code artifacts

## 3. Architecture

Does the change fit the system's design?

**Diagnostic questions:**

- Does it follow existing patterns or introduce a new one? If new, is
  the new pattern justified and documented?
- Does it maintain clean module boundaries?
- Is there code duplication that should be shared?
- Are dependencies flowing in the right direction (no circular
  dependencies)?
- Is the abstraction level appropriate (not over-engineered, not too
  coupled)?

**Checklist:**

- [ ] Follows existing patterns, or introduces a justified new one
- [ ] Clean module boundaries; no leakage of internals
- [ ] No circular dependencies
- [ ] No accidental code duplication that should be shared

## 4. Security

For depth on each control, see `security-and-hardening`. The review-pass
view:

**Diagnostic questions:**

- Is user input validated and sanitized at the boundary?
- Are secrets kept out of code, logs, and version control?
- Is authentication/authorization checked where needed?
- Are SQL queries parameterized (no string concatenation into SQL)?
- Are outputs encoded to prevent XSS?
- Are dependencies from trusted sources with no known vulnerabilities?
- Is data from external sources (APIs, logs, user content, config files)
  treated as untrusted?

**Checklist:**

- [ ] No secrets in code
- [ ] Input validated at boundaries (see
      `references/input-validation.md` for the canonical patterns)
- [ ] No injection vulnerabilities (SQL, command, prompt)
- [ ] Auth checks in place where required
- [ ] External data treated as untrusted until validated

## 5. Performance

For depth on profiling and optimization, see `performance-optimization`.
The review-pass view:

**Diagnostic questions:**

- Any N+1 query patterns?
- Any unbounded loops or unconstrained data fetching?
- Any synchronous operations that should be async?
- Any unnecessary re-renders in UI components?
- Any missing pagination on list endpoints?
- Any large objects created in hot paths?

**Checklist:**

- [ ] No N+1 patterns
- [ ] No unbounded operations on user-controlled inputs
- [ ] Pagination on list endpoints
- [ ] No obvious hot-path allocations

## Severity labels

Label every comment so the author knows what's required vs optional:

| Prefix | Meaning | Author action |
|---|---|---|
| *(no prefix)* | Required change | Address before merge |
| **Critical:** | Blocks merge | Security vuln, data loss, broken core |
| **Nit:** | Minor, optional | Author may ignore (style, formatting) |
| **Optional:** / **Consider:** | Suggestion | Worth considering, not required |
| **FYI:** | Informational | No action — context for the future |

Without labels, authors treat every comment as mandatory and waste time.

## Verdict

The exit step. Choose one:

- [ ] **Approve** — change definitely improves overall code health, even
      if not perfect. Approve and let the author merge.
- [ ] **Approve with nits** — same as Approve; nits left for the author's
      discretion.
- [ ] **Request changes** — at least one Critical or required issue must
      be fixed before merge.

The standard for approval is "definitely improves overall code health,"
not "exactly how I would have written it." Holding code to a perfection
bar slows everyone down without proportional quality gain.
