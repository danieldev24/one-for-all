# Token Efficiency

Use the smallest context that can safely complete the task. Token savings should
come from sharper routing, progressive disclosure, and concise output, not from
skipping verification.

## Workflow Modes

| Mode | Use when | Context budget | Output shape |
|---|---|---|---|
| `lite` | The task is small, low-risk, and has obvious acceptance criteria. | Entry skill, task file, and directly relevant files only. | Short status plus changed files and verification. |
| `standard` | The task touches multiple files, has moderate ambiguity, or needs normal implementation discipline. | Entry skill, task plan, relevant source files, and one targeted reference if useful. | Brief plan, implementation notes, verification, and follow-up risks. |
| `strict` | The task is high-risk, user-facing, security-sensitive, performance-sensitive, irreversible, or unfamiliar. | Full relevant workflow, authoritative references, tests, and review material. | Explicit assumptions, evidence, tradeoffs, and review-ready summary. |

## Examples

- Typo fix in one `SKILL.md`: use `lite`; read the target file and run the
  relevant validator.
- Add a new workflow rule to two skills and one command: use `standard`; read
  the plan, affected skills, command files, and shared reference.
- Change security, deployment, migration, or public API guidance: use `strict`;
  read the specialized skill, authoritative references, tests, and review
  checklist.

## Progressive Disclosure

Start with the narrowest useful context:

1. Read the user's request and the current task entry.
2. Read the entry skill or command that governs the work.
3. Read only directly relevant files found by `rg` or the task's file list.
4. Read supporting references only when risk, ambiguity, failing verification,
   or the user explicitly asks for deeper analysis.
5. Escalate mode before expanding context broadly.

Avoid loading broad docs, unrelated skills, full directories, or large reference
files just because they might be useful. Search first, then open the smallest
file ranges that answer the question.

## Escalation Rules

Escalate from `lite` to `standard` when:

- The change touches more than two files.
- Acceptance criteria cannot be stated in three bullets.
- Verification fails once and the cause is not obvious.
- The task requires choosing between multiple implementation paths.

Escalate from `standard` to `strict` when:

- Security, privacy, data loss, billing, auth, deployment, or migration risk is
  involved.
- The work changes a public contract or lifecycle handoff.
- The code or process area is unfamiliar and authoritative sources are needed.
- A review finds unresolved correctness, safety, or performance concerns.

## Mandatory Verification

Every mode keeps evidence requirements. The mode changes how much context is
loaded, not whether proof is required.

- For documentation-only changes, run targeted file checks and the relevant
  repository validators.
- For skill changes, run `node scripts/validate-skills.js --strict`.
- For duplicated workflow guidance, run `node scripts/scan-duplication.js`.
- For lifecycle handoff edits, run `node scripts/check-lifecycle-chain.js`.
- For code behavior changes, run the smallest meaningful test first, then the
  broader suite required by the task risk.

## Output Discipline

- Lead with what changed and the verification evidence.
- Keep summaries concise in `lite` mode: changed file, command result, and any
  remaining risk.
- In `standard` and `strict`, include assumptions and tradeoffs only when they
  affect the next decision.
- Do not paste large command output when a short result summary is enough.
