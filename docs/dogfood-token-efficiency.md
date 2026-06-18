# Dogfood: Token Efficiency

This note tests the token-efficient workflow against representative prompts.
The goal is smaller context paths without weakening verification.

## Summary

The new routing model reduces context by choosing one primary skill, one mode,
and only trigger-backed companion skills. Verification stays mandatory in every
mode.

| Prompt | Mode | Minimal skill path | Smaller context path |
|---|---|---|---|
| "Fix a typo in one SKILL.md" | `lite` | `incremental-implementation` | Read the target skill and run the relevant validator. Do not load spec, plan, review, or ship skills. |
| "Implement Task 5 from tasks/todo.md" | `standard` | `incremental-implementation` | Read the task block, likely touched files, and the entry skill. Add `test-driven-development` only when behavior changes. |
| "Change auth input validation guidance" | `strict` | `security-and-hardening` -> `test-driven-development` | Read security guidance and authoritative references; skip unrelated lifecycle skills until implementation or review requires them. |
| "Modify browser UI and verify runtime behavior" | `standard` | `frontend-ui-engineering` -> `browser-testing-with-devtools` | Read UI files and browser verification workflow; skip mobile, API, deploy, and migration skills. |
| "Review current changes before merge" | `standard` | `code-review-and-quality` | Read diff, tests, and changed files. Add security or performance skills only when their review triggers are present. |

## Observations

- `lite` mode is useful for tiny documentation edits because it preserves the
  validator check while avoiding full spec/plan/review context.
- `standard` mode fits most planned implementation work: task list plus local
  source context, then targeted verification.
- `strict` mode is reserved for areas where being wrong is expensive: security,
  public contracts, migrations, deployments, performance, and unfamiliar code.
- The router skill now links to shared policy instead of duplicating mode and
  companion-skill tables.
- Slash commands now ask for concise output and explicit escalation instead of
  expanding into broad lifecycle context by default.

## Remaining Tradeoffs

- `semantic-vague-phrase` starts as a warning even under `--strict`; this avoids
  noisy failures while the team tunes phrase coverage.
- `lite` mode now has an entry gate, but still relies on agents applying the
  gate honestly. Reviewers should watch for skipped verification and
  unnecessary scope expansion.
- Command defaults are validated for the four `/ofa-*` entry points, but other
  command files are outside that validator's scope.

## Follow-Up Work

- Tune `semantic-vague-phrase` as real false positives and false negatives show
  up.
- Consider extending command validation beyond the four `/ofa-*` lifecycle
  entry points.
- Expand dogfood examples after the first real implementation session using the
  new router.
