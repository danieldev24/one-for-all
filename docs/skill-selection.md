# Skill Selection

Use this guide to choose the smallest sufficient skill path. Start narrow,
verify, and escalate only when the task shows real risk or ambiguity. For mode
definitions, see [`references/token-efficiency.md`](../references/token-efficiency.md).

## Selection Rules

1. Pick one primary skill for the current phase.
2. Add a companion skill only when the request has a specific trigger.
3. Use `lite` for small, low-risk changes with obvious acceptance criteria.
4. Use `standard` for multi-file work, moderate ambiguity, or normal feature
   implementation.
5. Use `strict` for security, privacy, auth, deployment, migration,
   performance, data-loss, public-contract, or unfamiliar-domain work.

## Common Scenarios

| Scenario | Mode | Minimal skill path |
|---|---|---|
| Fix a typo or wording issue in one skill | `lite` | `incremental-implementation` |
| Add a small rule to one existing skill | `lite` | `incremental-implementation` |
| Break an approved spec into tasks | `standard` | `planning-and-task-breakdown` |
| Implement the next task from `tasks/todo.md` | `standard` | `incremental-implementation` |
| Fix a bug with observable behavior | `standard` | `test-driven-development` -> `incremental-implementation` |
| Debug a failing test or broken build | `standard` | `debugging-and-error-recovery` -> `test-driven-development` |
| Modify browser UI | `standard` | `frontend-ui-engineering` -> `browser-testing-with-devtools` |
| Modify mobile UI | `standard` | `mobile-ui-engineering` -> `mobile-simulator-testing` |
| Change an API, module boundary, or public contract | `strict` | `api-and-interface-design` -> `incremental-implementation` |
| Touch auth, secrets, input validation, or permissions | `strict` | `security-and-hardening` -> `test-driven-development` |
| Prepare a release or deployment | `strict` | `shipping-and-launch` |
| Review code before merge | `standard` | `code-review-and-quality` |
| Simplify working code without behavior changes | `standard` | `code-simplification` -> `code-review-and-quality` |

## Escalation Triggers

Escalate from `lite` to `standard` when:

- The change touches more than two files.
- The acceptance criteria need more than three bullets.
- Verification fails and the cause is not obvious.
- You need to compare multiple implementation paths.

Escalate from `standard` to `strict` when:

- The task affects security, privacy, auth, billing, deployment, migration, or
  data integrity.
- The task changes a public contract or lifecycle handoff.
- The implementation depends on unfamiliar technology or authoritative docs.
- Review surfaces unresolved correctness, safety, or performance risk.

## Companion Skill Triggers

| Add this skill | Only when |
|---|---|
| `context-engineering` | The agent lacks enough local context or quality is dropping. |
| `source-driven-development` | A framework, API, or library decision needs official-source grounding. |
| `doubt-driven-development` | Stakes are high and a confident answer would be expensive to debug later. |
| `performance-optimization` | There is a measured or suspected performance target or regression. |
| `documentation-and-adrs` | The work makes an architectural decision or changes public usage. |

## Red Flags

- Loading multiple phase skills before choosing the primary task.
- Reading broad references before searching for the specific question.
- Using `strict` because the task feels important, not because risk triggers are
  present.
- Skipping verification in `lite` mode.
- Expanding scope after verification passes without creating a new task.
