# Spec: one-for-all v1.1 — Skill Quality Pass

## Objective

Tighten the 23 existing skills in `one-for-all` along **five** quality axes: trigger sharpness, verification rigor, overlap deduplication, anti-rationalization depth, and **lifecycle handoff** (every skill ends by recommending the next skill in the workflow). The goal is that an AI agent loading these skills auto-activates the right one, can't claim "done" without proving it, doesn't see the same content repeated across files, can't talk itself out of the workflow, and is told where to go next when the current skill exits.

**User:** AI coding agents (primary) and the engineers who supervise them (secondary). The skills are the user interface; agents are the reader.

**Why now:** A separate audit (recorded in this conversation) scored every skill 0–3 on each axis and identified 8 skills where total weakness is ≥8/12. Cross-cutting issues — formulaic rationalization tables, aspirational verification checklists, and missing trigger phrases — compound across the pack.

**Non-goals:** No new skills. No restructuring of the skill taxonomy. No changes to the slash-command surface (`/ofa-*`). No changes to agents or hooks.

## Tech Stack

- **Format:** Markdown with YAML frontmatter (no runtime code in skills)
- **Validator:** Node.js script at `scripts/validate-skills.js` (already present)
- **Distribution:** Claude Code plugin via `.claude-plugin/plugin.json`
- **Authoring conventions:** `docs/skill-anatomy.md`

## Commands

```
Validate skills:    node scripts/validate-skills.js
List skills:        ls skills/*/SKILL.md
Reload in CC:       /reload-plugins
Dogfood a skill:    /ofa-spec, /ofa-plan, /ofa-build, /ofa-test, /ofa-review,
                    /ofa-code-simplify, /ofa-ship
```

There is no `npm test`, no build step, no lint. The validator is the only automated check.

## Project Structure

Touched directories only:

```
skills/<name>/SKILL.md       → The 23 skill files (edits go here)
scripts/validate-skills.js   → Extend with new structural checks
docs/skill-anatomy.md        → Update the canonical authoring spec
references/                  → Move duplicated content here when dedup'ing
SPEC.md                      → This file (delete before merge or .gitignore)
tasks/plan.md, tasks/todo.md → Will be created by /ofa-plan in Phase 2
```

No new top-level directories.

## Code Style (for skill markdown)

Every skill conforms to the structure already defined in `docs/skill-anatomy.md`. The quality pass enforces a sharper version of each section. Example of the new bar for triggers:

```markdown
---
name: spec-driven-development
description: Write a structured PRD before code when the change touches multiple
  files, takes >30 minutes, or has ambiguous requirements. Triggers on phrases
  like "let's build", "I want to add", "design a feature for". Skip for typo
  fixes, single-line bug fixes, or unambiguous mechanical refactors.
---
```

Every "Common Rationalizations" row must have a concrete rebuttal, not a restated principle:

```markdown
| Rationalization | Reality |
|---|---|
| "I'll write the spec after I code it" | That's documentation, not specification.
  The spec's job is to surface misunderstandings *before* they become rework. A
  team I worked with shipped 3 features without specs; 2 needed full rewrites
  after launch when stakeholders saw what "done" looked like. |
```

Verification checklists must be testable, not aspirational:

```markdown
## Verification
- [ ] SPEC.md exists at repo root and contains all six sections (Objective,
      Commands, Project Structure, Code Style, Testing Strategy, Boundaries)
- [ ] Human has replied "approved" or equivalent in the conversation
- [ ] Each item in Success Criteria has a measurable threshold (number, command
      output, or observable behavior)
```

Every skill ends with a "Next" section that recommends the follow-on skill(s)
based on the most likely next action. Format is consistent across all 23 skills:

```markdown
## Next

After this skill exits, the agent should advise the user on what to do next.
Pick the row that matches the situation:

| If the situation is... | Suggest invoking |
|---|---|
| Spec is approved and you're ready to break it into tasks | `/ofa-plan` (planning-and-task-breakdown) |
| Spec needs more clarification first | `interview-me` skill |
| Spec is approved AND tasks are obvious for a small change | Skip planning, go straight to `/ofa-build` |

End the conversation turn with: "Next: I recommend `<skill or command>` because <one-line reason>."
```

The recommendation is **always** spoken to the user as the last sentence of the
agent's turn, even if the user didn't ask. The agent doesn't auto-invoke — the
human chooses.

## Testing Strategy

This is a documentation project. "Testing" means three things:

1. **Validator (automated, mandatory):** `scripts/validate-skills.js` runs in CI and locally. The pass extends it with these new checks:
   - Frontmatter `description` ≥ 100 chars and contains the word "when" or "trigger"
   - Required H2 sections exist and are non-empty: Overview, When to Use, Process (or equivalent), Common Rationalizations, Red Flags, Verification, **Next**
   - Verification section contains at least 3 checklist items (`- [ ]`)
   - Common Rationalizations table has ≥ 3 rows
   - **`## Next` section exists and contains a markdown table with ≥ 2 rows mapping situations to recommended skills/commands**
   - No SKILL.md exceeds 500 lines (forces extraction to `references/`)

2. **Cross-skill duplication scan (automated):** Custom script flags any 5+ consecutive lines that appear verbatim in two or more SKILL.md files. Threshold: zero duplicate blocks longer than the minimum (frontmatter, section headers).

3. **Real-world dogfooding (manual, the success bar):** After each batch of edits, run the improved skill against a real coding task in a separate sandbox repo and compare against pre-edit behavior. The pass succeeds when:
   - The agent loads the right skill from a vague natural-language prompt without being told its name (improvement on triggers)
   - The agent refuses to claim "done" until verification items are satisfied (improvement on gates)
   - The agent doesn't repeat duplicate guidance from two skills loaded simultaneously (improvement on dedup)
   - The agent rebuts at least one of the documented rationalizations during the session (improvement on tables)
   - **The agent ends each skill turn with an explicit "Next: I recommend `<skill>` because <reason>" handoff (improvement on lifecycle handoff)**

The dogfood repo and tasks are picked in Phase 2.

## Boundaries

**Always:**
- Run `node scripts/validate-skills.js` after every edit batch and before commit
- Use cross-references (`See [code-review-and-quality](../code-review-and-quality/SKILL.md)`) instead of duplicating content
- Update `docs/skill-anatomy.md` whenever a structural rule changes — it's the canonical doc
- Preserve every skill's existing `name:` frontmatter slug (renaming breaks marketplace installs)
- Commit changes one skill at a time so each diff is reviewable

**Ask first:**
- Before deleting a section from a SKILL.md (might be load-bearing for an agent prompt elsewhere)
- Before adding a new check to `validate-skills.js` that would fail any existing skill (need a migration plan)
- Before moving content into `references/` (changes the loading model)
- Before editing `using-one-for-all` (it's the meta-skill; changes ripple)

**Never:**
- Rename skill directories or `name:` slugs
- Delete a skill (this is a pure quality pass, not a culling)
- Add new skills (out of scope — separate enhancement)
- Edit slash-command files in `.claude/commands/ofa-*.md` (out of scope)
- Skip validation to "just commit the obvious wins"

## Success Criteria

The enhancement is done when **all** of the following hold:

1. **Audit-targeted skills fixed.** All 8 skills flagged in the audit (`incremental-implementation`, `planning-and-task-breakdown`, `code-review-and-quality`, `context-engineering`, `spec-driven-development`, `test-driven-development`, `security-and-hardening`, `api-and-interface-design`) score ≤4/12 on a re-audit using the same (now five-axis) rubric.

2. **Validator extended and green.** `scripts/validate-skills.js` enforces the six new checks (frontmatter length, required sections including `## Next`, ≥3 checklist items, ≥3 rationalization rows, `## Next` table with ≥2 rows, ≤500 lines). All 23 skills pass.

3. **Lifecycle handoff complete across all 23 skills.** Every SKILL.md in the pack has a `## Next` section with a situations→suggestion table. This applies to all 23 skills, not just the 8 audit-targeted ones, because a broken chain anywhere defeats the navigability goal.

4. **Duplication scan clean.** No 5+ consecutive lines duplicated across SKILL.md files (excluding section headers and standard frontmatter keys).

5. **Dogfood proof.** A documented dogfooding session in another repo shows the agent: (a) selecting the right skill from a vague prompt, (b) refusing premature "done", (c) rebutting at least one rationalization, (d) emitting an explicit "Next: I recommend X" handoff at the end of each skill turn. Captured as a transcript or commit log in `docs/dogfood-v1.1.md`.

6. **`docs/skill-anatomy.md` updated** to reflect the new bar (including the `## Next` section requirement) so future contributors hit the same standard.

## Open Questions

1. **Dogfood target repo.** Use a synthetic sandbox repo created for this purpose, an existing personal project, or a fresh fork of an open-source codebase? Affects how reproducible the proof is.
2. **Validator failure mode.** When the new checks fail, should CI block commits (strict) or just warn (soft launch)? Strict is the eventual state; soft might be needed for the rollout window.
3. **`references/` extraction policy.** When dedup'ing content, the natural home is `references/` — but the audit found content currently inlined in skills (e.g., input-validation patterns in both `security-and-hardening` and `api-and-interface-design`). Move to a new `references/input-validation.md`? Confirm before Phase 2 plan.
4. **Scope of `using-one-for-all` edits.** The meta-skill mirrors content from many others. If we tighten the others, the meta-skill drifts. Does this pass also touch the meta-skill, or is that explicitly deferred?

---

**Ready for review.** Once you sign off, I'll move to `/ofa-plan` to break this into ordered tasks with verification per task.
