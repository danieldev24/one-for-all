# Skill Anatomy

This document describes the structure and format of one-for-all skill files. Use this as a guide when contributing new skills or understanding existing ones.

## File Location

Every skill lives in its own directory under `skills/`:

```
skills/
  skill-name/
    SKILL.md           # Required: The skill definition
    scripts/           # Optional: Runnable helpers used by the skill workflow
    supporting-file.md # Optional: Reference material loaded on demand
```

`SKILL.md` is the only required file. Add `scripts/` only when the skill actually ships runnable helpers, and omit the directory entirely for markdown-only skills.

## SKILL.md Format

### Frontmatter (Required)

```yaml
---
name: skill-name-with-hyphens
description: Guides agents through [task/workflow]. Use when [specific trigger conditions].
---
```

**Rules:**
- `name`: Lowercase, hyphen-separated. Must match the directory name.
- `description`: Start with what the skill does in third person, then include one or more clear "Use when" trigger conditions. Include both *what* and *when*. Maximum 1024 characters.

**Why this matters:** Agents discover skills by reading descriptions. The description is injected into the system prompt, so it must tell the agent both what the skill provides and when to activate it. Do not summarize the workflow — if the description contains process steps, the agent may follow the summary instead of reading the full skill.

### Standard Sections (Recommended Pattern)

The frontmatter contract above is required. The section layout below is a recommended pattern, not a rigid template: equivalent headings are acceptable when they serve the same purpose clearly.

```markdown
# Skill Title

## Overview
One-two sentences explaining what this skill does and why it matters.

## When to Use
- Bullet list of triggering conditions (symptoms, task types)
- When NOT to use (exclusions)

## [Core Process / The Workflow / Steps]
The main workflow, broken into numbered steps or phases.
Include code examples where they help.
Use flowcharts (ASCII) where decision points exist.

## [Specific Techniques / Patterns]
Detailed guidance for specific scenarios.
Code examples, templates, configuration.

## Common Rationalizations
| Rationalization | Reality |
|---|---|
| Excuse agents use to skip steps | Why the excuse is wrong |

## Red Flags
- Behavioral patterns indicating the skill is being violated
- Things to watch for during review

## Verification
After completing the skill's process, confirm:
- [ ] Checklist of exit criteria
- [ ] Evidence requirements

## Next
| If the situation is... | Suggest invoking |
|---|---|
| Happy-path next step | `next-skill` or /ofa-command |
| Branch or step-back   | `alternate-skill` |
```

## Section Purposes

### Overview
The "elevator pitch" for the skill. Should answer: What does this skill do, and why should an agent follow it?

### When to Use
Helps agents and humans decide if this skill applies to the current task. Include both positive triggers ("Use when X") and negative exclusions ("NOT for Y").

### Core Process
The heart of the skill. This is the step-by-step workflow the agent follows. Must be specific and actionable — not vague advice.

**Good:** "Run `npm test` and verify all tests pass"
**Bad:** "Make sure the tests work"

### Common Rationalizations
The most distinctive feature of well-crafted skills. These are excuses agents use to skip important steps, paired with rebuttals. They prevent the agent from rationalizing its way out of following the process.

Think of every time an agent has said "I'll add tests later" or "This is simple enough to skip the spec" — those go here with a factual counter-argument.

### Red Flags
Observable signs that the skill is being violated. Useful during code review and self-monitoring.

### Verification
The exit criteria. A checklist the agent uses to confirm the skill's process is complete. Every checkbox should be verifiable with evidence (test output, build result, screenshot, etc.).

### Next
The lifecycle handoff. Tells the agent which skill or command to recommend after this one exits. Pulled from [`docs/lifecycle-map.md`](lifecycle-map.md), which is the source of truth for the workflow graph. Every skill must end with the standard footer line:

> End the conversation turn with: `Next: I recommend <skill-or-command> because <one-line reason>.`

The `## Next` section is structurally enforced by `scripts/check-lifecycle-chain.js`: every name in the right-hand column must resolve to a real skill (a directory under `skills/`) or slash command (a file under `.claude/commands/`).

## v1.1 Quality Bar

These are the rules `scripts/validate-skills.js --strict` enforces. Run that command before committing.

### Trigger sharpness

The frontmatter `description` is the only thing the agent sees when *deciding* whether to load a skill. Make it count.

**Good** — names skip conditions and trigger phrases:
```yaml
description: Write a structured PRD before code when the change touches
  multiple files, takes >30 minutes, or has ambiguous requirements. Triggers
  on phrases like "let's build", "I want to add", "design a feature for".
  Skip for typo fixes, single-line bug fixes, or unambiguous mechanical
  refactors.
```

**Bad** — vague, no skip conditions:
```yaml
description: Helps with planning new features.
```

Rules: ≥ 100 chars, contains the word "when" or "trigger", ≤ 1024 chars.

### Verification rigor

Verification items must be **testable**, not aspirational. A future reader should be able to verify each item with a command, file check, or observable behavior.

**Good:**
```markdown
- [ ] `node scripts/validate-skills.js --strict` exits 0
- [ ] SPEC.md exists at repo root with all six sections
- [ ] Each item in Success Criteria has a measurable threshold
```

**Bad:**
```markdown
- [ ] The work is complete
- [ ] Tests are good
- [ ] Code is clean
```

Rule: ≥ 3 checklist items per skill.

### Anti-rationalization rebuttals

Every row in `## Common Rationalizations` must rebut with a **failure story** or **quantified cost**, not a restated principle.

**Good:**
```
| "I'll write the spec after I code it" | That's documentation, not specification.
  The spec's job is to surface misunderstandings *before* they become rework.
  A team I worked with shipped 3 features without specs; 2 needed full
  rewrites after launch when stakeholders saw what "done" looked like. |
```

**Bad:**
```
| "I'll write the spec after I code it" | You should write the spec first. |
```

Rule: ≥ 3 data rows per table (header and separator excluded).

### Dedup via cross-references

If a body of content (validation patterns, secrets handling, review framing) lives in two skills, extract it to `references/<topic>.md` and have both skills link to the canonical reference instead of duplicating it.

The dedup scanner (`scripts/scan-duplication.js`) flags any block of ≥ 5 verbatim consecutive eligible lines that appears in two or more SKILL.md files. The `## Next`-time exit gate is **zero** blocks of that size.

Rule: each skill keeps at least one full worked example so it stands alone — references hold reusable patterns and checklists, not the entire skill content.

### Lifecycle handoff (`## Next` section)

Every skill ends with a `## Next` section telling the agent what to recommend when this skill exits. Format is consistent across all skills:

```markdown
## Next

After this skill exits, advise the user on what to do next. Pick the row
that matches the situation:

| If the situation is... | Suggest invoking |
|---|---|
| Spec is approved and ready to break into tasks | `/ofa-plan` (`planning-and-task-breakdown`) |
| Spec needs more clarification first | `interview-me` skill |
| Small change with obvious tasks | Skip planning, go straight to `/ofa-build` |

End the conversation turn with: `Next: I recommend <skill-or-command> because <one-line reason>.`
```

Rules:
- Section heading must be exactly `## Next`
- Table must have ≥ 2 data rows
- Each right-hand cell must reference either a skill name (matching a directory in `skills/`) or a slash command (matching a file in `.claude/commands/`)
- The standard footer line is mandatory — agents read it as their handoff cue

Pull rows from [`docs/lifecycle-map.md`](lifecycle-map.md) — that file is the canonical workflow graph. Edit the map first when adding edges, then propagate to the skill.

## Supporting Files

Create supporting files only when:
- Reference material exceeds 100 lines (keep the main SKILL.md focused)
- Code tools or scripts are needed
- Checklists are long enough to justify separate files

Keep patterns and principles inline when under 50 lines.

If a skill does not need runnable helpers, do not create an empty `scripts/` directory just to mirror other skills. Empty directories add noise without changing how the skill works.

## Writing Principles

1. **Process over knowledge.** Skills are workflows, not reference docs. Steps, not facts.
2. **Specific over general.** "Run `npm test`" beats "verify the tests".
3. **Evidence over assumption.** Every verification checkbox requires proof.
4. **Anti-rationalization.** Every skip-worthy step needs a counter-argument in the rationalizations table.
5. **Progressive disclosure.** Main SKILL.md is the entry point. Supporting files are loaded only when needed.
6. **Token-conscious.** Every section must justify its inclusion. If removing it wouldn't change agent behavior, remove it.

## Naming Conventions

- Skill directories: `lowercase-hyphen-separated`
- Skill files: `SKILL.md` (always uppercase)
- Supporting files: `lowercase-hyphen-separated.md`
- References: stored in `references/` at the project root, not inside skill directories

## Cross-Skill References

Reference other skills by name:

```markdown
Follow the `test-driven-development` skill for writing tests.
If the build breaks, use the `debugging-and-error-recovery` skill.
```

Don't duplicate content between skills — reference and link instead.

## Required vs Recommended

Required:

- A `skills/<skill-name>/SKILL.md` file
- Valid YAML frontmatter with `name` and `description`
- A description that includes both what the skill does and when to use it
- All six standard sections: `## Overview`, `## When to Use`, `## Common Rationalizations`, `## Red Flags`, `## Verification`, `## Next`
- Passes `node scripts/validate-skills.js --strict` (see "v1.1 Quality Bar" above)

Recommended:

- The standard section flow shown above
- Equivalent headings such as `How It Works`, `Core Process`, or `Workflow` when they read more naturally for the skill
- Supporting files only when they keep the main `SKILL.md` focused
