---
description: Break work into small verifiable tasks with acceptance criteria and dependency ordering
---

Invoke the one-for-all:planning-and-task-breakdown skill.

Token discipline: default to concise `standard` output. Use `lite` only when the scope is small, low-risk, obvious to verify, and needs no deeper analysis. Escalate to `strict` when risk, ambiguity, failing verification, or the user explicitly asks for deeper analysis.

Read the existing spec from `specs/` (or an equivalent project-approved spec path) and the relevant codebase sections. Then:

1. Enter plan mode — read only, no code changes
2. Identify the dependency graph between components
3. Slice work vertically (one complete path per task, not horizontal layers)
4. Write tasks with acceptance criteria and verification steps
5. Add checkpoints between phases
6. Present the plan for human review

Keep the response concise: summarize the phase order, key risks, and verification. Save the plan to tasks/plan.md and task list to tasks/todo.md.
