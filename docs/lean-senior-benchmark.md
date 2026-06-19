# Lean Senior SDLC Benchmark

This benchmark design measures whether Lean Senior SDLC improves one-for-all
without weakening the production-grade workflow. It is inspired by agentic
benchmarks that compare real coding sessions, but the score here is not "least
code wins." A lean run wins only when completeness, verification, and safety
stay intact.

## Question

Does one-for-all with Lean Senior SDLC choose smaller skill paths, load less
context, produce smaller diffs, and preserve verification evidence compared with
baseline or pre-lean workflows?

## Arms

| Arm | Description | Expected use |
|---|---|---|
| `baseline` | Agent runs without one-for-all guidance. | Measures default agent behavior. |
| `ofa-current` | Current OFA before Lean Senior SDLC hooks. | Compares against the existing token-efficient SDLC. |
| `ofa-lean` | OFA lean with Lean Senior SDLC reference, pilot skills, commands, and validator checks. | Primary candidate. |
| `ofa-strict` | OFA strict mode on high-risk tasks. | Confirms lean does not under-scope security, migration, deployment, or public-contract work. |

## Task Set

| Task type | Prompt shape | Expected signal |
|---|---|---|
| Tiny docs edit | Fix one typo or stale link in one `SKILL.md`. | Uses `lite`; does not load full SDLC. |
| Small code fix | Implement one narrow bug fix with a regression test. | Uses TDD plus a small implementation slice. |
| Security guidance change | Update validation/auth guidance. | Escalates to `strict`; keeps safety checks. |
| Frontend behavior change | Modify a small UI path and verify runtime behavior. | Uses UI skill plus browser verification only when triggered. |
| Review/simplify pass | Review a diff with an unnecessary abstraction. | Produces delete/inline/defer/keep guidance. |

## Metrics

Collect these from logs, git diff, and validation output:

| Metric | Source | Why it matters |
|---|---|---|
| `skill_path_len` | Agent transcript or harness events | Detects over-routing through unnecessary phases. |
| `context_files_loaded` | Tool-call log | Measures progressive disclosure. |
| `source_loc_changed` | `git diff --numstat` | Catches implementation bloat. |
| `test_loc_changed` | `git diff --numstat '*test*'` | Ensures lean runs do not merely skip tests. |
| `files_changed` | `git diff --name-only` | Detects scope creep. |
| `verification_passed` | Command output | Required for a passing run. |
| `safety_passed` | Task-specific scorer | Prevents under-scoped security/data/accessibility behavior. |
| `completeness_score` | Task-specific scorer | Ensures the requested behavior exists. |
| `cost_usd` | CLI usage JSON when available | Measures operating cost. |
| `tokens_in_out` | CLI usage JSON when available | Measures token savings. |
| `elapsed_seconds` | Harness timer | Measures wall-clock impact. |
| `turns` | Transcript count | Measures interaction overhead. |

## Pass/Fail Rules

A run passes a task only when:

- `completeness_score` passes the task scorer.
- `verification_passed` is true.
- `safety_passed` is true for any task with security, data-loss,
  accessibility, privacy, auth, migration, deployment, or public-contract risk.
- No validator required by the task exits non-zero.

After those gates pass, compare cost, tokens, turns, context files, files
changed, and LOC. Fewer lines only count as a win after completeness and safety
are proven.

## Harness Shape

Each run should:

1. Create a fresh workspace from the same fixture.
2. Apply only the arm-specific guidance.
3. Run the same prompt.
4. Capture transcript, tool calls, command results, timing, and usage JSON.
5. Score the final workspace with deterministic scripts where possible.
6. Store raw artifacts separately from the summary table.

## Self-Test

Before spending model time, run a self-test that scores known good and known bad
fixtures:

- Good fixture: minimal implementation with tests and safety intact.
- Bad fixture: fewer LOC but missing validation or required verification.
- Bloated fixture: complete and safe but unnecessary framework/dependency work.

The scorer must fail the bad fixture and flag the bloated fixture even if it has
more apparent "architecture."

## Reporting

Report medians across repeated runs, not single best cases:

| Arm | Tasks passed | Median tokens | Median cost | Median turns | Median files | Median LOC | Safety failures |
|---|---:|---:|---:|---:|---:|---:|---:|
| `baseline` | TBD | TBD | TBD | TBD | TBD | TBD | TBD |
| `ofa-current` | TBD | TBD | TBD | TBD | TBD | TBD | TBD |
| `ofa-lean` | TBD | TBD | TBD | TBD | TBD | TBD | TBD |
| `ofa-strict` | TBD | TBD | TBD | TBD | TBD | TBD | TBD |

Do not claim token savings until the harness has raw run artifacts and a scorer
that can make Lean Senior SDLC lose.
