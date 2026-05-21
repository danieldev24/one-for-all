# Plan: one-for-all v1.1 — Skill Quality Pass

Implementation plan for the [SPEC.md](../SPEC.md) at repo root. This document is the technical approach; `tasks/todo.md` (created by `/ofa-plan` next) holds the executable task list.

## Approach in one sentence

Build the measurement infrastructure first (extended validator + duplication scanner), use it to surface every concrete defect, fix the 8 audit-targeted skills one at a time with the validator as the gate, **add a `## Next` lifecycle-handoff section to all 23 skills**, then prove the result with a dogfood session.

## Why this order

The temptation is to dive into editing skills. That's the wrong order: without the validator extensions in place, "improvement" is subjective and you'll be re-reading every diff manually. With the validator in place, each fix has an automated yes/no signal and the cross-skill dedup scan tells you which content blocks to consolidate first. Tooling-before-content also matches the boundary "Always run validator after every edit batch" — that requires the validator to exist in its v1.1 form.

## Phases

```
Phase 1: Tooling      ─→ Phase 2: Measure   ─→ Phase 3: Fix       ─→ Phase 3.5: Handoff   ─→ Phase 4: Prove
(validator + scanner,    (run, capture        (8 skills, 1 at a     (## Next section          (dogfood + close
 lifecycle map)           baseline report)     time, validator       across all 23)            open questions)
                                               soft → strict)
```

### Phase 1 — Tooling (sequential, ~½ day)

Build the automated measurement so Phase 3 isn't subjective.

**1.1 Extend `scripts/validate-skills.js`** with six new structural checks:
   - Frontmatter `description` ≥ 100 chars and contains "when" or "trigger"
   - Required H2 sections present and non-empty: Overview, When to Use, Process (or equivalent — accept Core Process / The Workflow), Common Rationalizations, Red Flags, Verification, **Next**
   - Verification section has ≥ 3 `- [ ]` items
   - Common Rationalizations table has ≥ 3 data rows (excluding header/separator)
   - **`## Next` section contains a markdown table with ≥ 2 data rows, each row referencing either another skill name (matching a directory in `skills/`) or a slash command (matching a file in `.claude/commands/`)**
   - SKILL.md ≤ 500 lines

   Each check emits one line per skill: `PASS|WARN|FAIL  <skill-name>  <check>  <detail>`. **Run mode is soft** (warnings, exit 0) until Phase 3 closes — flipped to strict (exit 1 on FAIL) at the end of Phase 3.

**1.2 Add `scripts/scan-duplication.js`** — flags any 5+ consecutive non-trivial lines that appear verbatim in two or more SKILL.md files. Excludes:
   - YAML frontmatter keys (`name:`, `description:`, `metadata:`)
   - Section headers (`## ...`)
   - Empty/whitespace-only lines
   - Standard markdown table separators

   Output: ranked list of duplicate blocks with file paths and line ranges, longest first.

**1.3 Update `docs/skill-anatomy.md`** to document the v1.1 bar so future contributors hit it without having to read the validator source. New subsections: "Trigger sharpness", "Verification rigor", "Anti-rationalization rebuttals", "Dedup via cross-references", **"Lifecycle handoff (`## Next` section)"**.

**1.4 Draft a lifecycle map** at `docs/lifecycle-map.md` — a single source of truth for which skill follows which, by phase. Used by Phase 3.5 to author each `## Next` table consistently. The map covers all 23 skills + 7 slash commands and shows the canonical forward edges (e.g., `spec-driven-development → planning-and-task-breakdown → incremental-implementation`) plus the common branches (e.g., from `spec` you can also branch to `interview-me` if requirements are still unclear).

**Phase 1 verification gate:** Both scripts run cleanly on the current state of the repo. Their output captured to `tasks/baseline-report.md` (Phase 2 artifact).

### Phase 2 — Measure (sequential, ~1 hour)

Capture the baseline before any skill edits so the "before/after" delta is concrete.

**2.1 Run validator and scanner**, save full output to `tasks/baseline-report.md`. Expected outputs:
   - List of every skill failing each new check
   - Ranked duplicate blocks (likely 5–15 substantial duplicates based on audit hints)

**2.2 Re-audit the 8 targeted skills** using the same 0–3-per-axis rubric the original audit used, save to `tasks/baseline-audit.md`. This is the number we have to beat (≤4/12 per skill at exit).

**Phase 2 verification gate:** `tasks/baseline-report.md` and `tasks/baseline-audit.md` exist, are checked in, and contain numbers (not prose).

### Phase 3 — Fix (8 parallel-eligible skill batches, ~2½ days)

Edit the 8 audit-targeted skills, one skill per batch. Within a batch the four axes are addressed together (so the diff per skill is one coherent unit).

**Order — by leverage and dependency, not severity:**
1. `spec-driven-development` (highest leverage — many other skills cross-reference it)
2. `planning-and-task-breakdown` (next in lifecycle, large overlap with spec)
3. `incremental-implementation` (overlaps with TDD; fix together)
4. `test-driven-development` (paired with above)
5. `code-review-and-quality` (pulls dedup from review-axis skills)
6. `security-and-hardening` (extracts shared input-validation content)
7. `api-and-interface-design` (consumes the extracted reference)
8. `context-engineering` (most isolated — last)

**For each skill, the workflow is:**
   - Sharpen `description:` frontmatter to include trigger phrases AND skip conditions
   - Sharpen "When to Use" with concrete user-phrase signals
   - Rewrite "Common Rationalizations" rows to have concrete rebuttals (failure stories or quantified costs, not restated principles)
   - Replace generic verification items with measurable ones (file exists, command output matches, count of items, etc.)
   - For dedup: extract shared content into `references/<topic>.md` and replace in-skill content with a one-paragraph summary + link

**Extractions to plan for (from the audit):**
   - `references/input-validation.md` — pulled from `security-and-hardening` + `api-and-interface-design`
   - `references/secrets-management.md` — pulled from `security-and-hardening` + `git-workflow-and-versioning`
   - `references/five-axis-review.md` — canonical version of the review framing referenced by `code-review-and-quality`, `using-one-for-all`, `ofa-review` command, and the agents

**Per-skill verification gate:**
   - Validator passes the 5 new checks for that skill
   - Re-audit score for that skill ≤ 4/12
   - Duplication scanner shows no new duplicates introduced
   - Commit message references the SPEC and audit before/after numbers

**Phase 3 exit gate:** Validator flipped to strict mode for the original 5 checks; the 8 audit-targeted skills pass strictly; remaining 15 skills still in soft mode for the `## Next` check (closed in Phase 3.5).

### Phase 3.5 — Lifecycle Handoff (parallel-eligible, ~1 day)

Add a `## Next` section to all 23 skills using the lifecycle map from Phase 1.4 as the source of truth. This is mostly mechanical authoring — every skill gets the same shape, varying only in the table content.

**3.5.1 For each of the 23 skills**, add a `## Next` section after `## Verification` containing:
   - A 1-sentence intro explaining the section's purpose to the agent
   - A markdown table with ≥ 2 rows: `| If the situation is... | Suggest invoking |`
   - Rows pulled from the lifecycle map; minimum: one "happy path forward" row + one "branch / step back" row
   - A standard footer line: `End the conversation turn with: "Next: I recommend \`<skill or command>\` because <one-line reason>."`

**3.5.2 Cross-validate the chain** — run a script (`scripts/check-lifecycle-chain.js`, ~30 lines) that:
   - Parses every `## Next` table
   - Verifies every referenced skill name exists in `skills/` and every slash command exists in `.claude/commands/`
   - Reports orphans (skills nobody points to) and dead-ends (skills that don't reference any forward edge)

**Phase 3.5 exit gate:** All 23 skills have `## Next` sections; chain checker reports zero orphans (except the deliberate entry point `using-one-for-all`) and zero dead-ends; validator now strict on all 6 checks for all 23 skills.

### Phase 4 — Prove (sequential, ~½ day)

The dogfood session is the only check that confirms agent behavior actually changed.

**4.1 Stand up a sandbox repo** — minimal Node/TS scaffold in a sibling directory or temp path. Pre-populate with a vague feature request the agent will need to interpret (e.g., "I want users to be able to share a card with a public link"). The vagueness is the point — it tests trigger sharpness.

**4.2 Run a session** with the v1.1 plugin loaded. Record:
   - Did the agent invoke `/ofa-spec` (or load `spec-driven-development`) without being told?
   - Did the agent refuse to mark `done` when verification items were unsatisfied?
   - Did the agent verbatim rebut at least one rationalization from the table?
   - Did two simultaneously-loaded skills (e.g., spec + plan) emit duplicate guidance?
   - **Did the agent end each skill turn with an explicit "Next: I recommend `<skill>` because <reason>" handoff that matched the `## Next` table?**

**4.3 Capture the transcript** and a written analysis to `docs/dogfood-v1.1.md`. If any of the four checks fail, loop back to Phase 3 for the relevant skill.

**Phase 4 exit gate:** All four dogfood checks pass and `docs/dogfood-v1.1.md` is committed.

## Risks and mitigations

| Risk | Likelihood | Mitigation |
|---|---|---|
| Validator extensions are too strict and reject content that's actually fine | Medium | Soft mode first (Phase 1–3), flip to strict only when 23/23 pass |
| Dedup extraction breaks reading flow — skill becomes a stub of links | Medium | Rule: skill always contains at least one full worked example; references hold reusable patterns and checklists |
| Re-audit is just my own bias re-reading the same files | High | Use the same 0–3 rubric and same axis names as original audit; document the score per axis, not just the total |
| Dogfood session is staged / agent succeeds because I'm watching | Medium | Use a vague prompt I haven't seen the agent answer before; record the full transcript including failures |
| Sandbox repo doesn't exercise enough skills to be representative | Medium | Pick a feature scope that touches at least: spec, plan, build, test, review (5 of the 7 commands) |
| The `using-one-for-all` meta-skill drifts as we tighten others | Low (deferred) | Out of scope per spec; track follow-up as `tasks/v1.2-followups.md` |
| `## Next` tables become wrong as workflows evolve, drifting silently | Medium | `scripts/check-lifecycle-chain.js` runs in CI; broken references = build fail. Lifecycle map at `docs/lifecycle-map.md` is the single source of truth — change it first, then propagate. |
| Agent over-recommends "Next" and becomes pushy | Low-medium | The `## Next` table is conditional (`If the situation is X`), not unconditional. Agent picks the matching row or stays silent if no row applies. |

## Parallelism opportunities

Phases 1, 2, and 4 are sequential. Within Phase 3, the 8 skill fixes are mostly independent — skills 5–8 could be fanned out to parallel agent sessions if the dedup extractions (Phase 3 prep step) land first. Default plan keeps them sequential to keep the diff stream reviewable.

## What success looks like at the end

- 23/23 skills pass `scripts/validate-skills.js` in strict mode (all 6 checks)
- `scripts/scan-duplication.js` reports zero substantial duplicates
- `scripts/check-lifecycle-chain.js` reports zero broken references, zero dead-ends, only the intended entry-point orphan
- 8 audit-targeted skills score ≤ 4/12 each on re-audit (now five-axis)
- All 23 skills have a populated `## Next` section
- A real dogfood transcript shows the agent doing the right thing without being told, including the explicit "Next" handoff at the end of each skill turn
- `docs/skill-anatomy.md` documents the new bar (including `## Next`)
- `docs/lifecycle-map.md` exists as the canonical workflow graph
- All artifacts (baseline + dogfood) committed in `tasks/` and `docs/`

---

**Ready for review.** Confirm or push back on the phasing, then I'll generate `tasks/todo.md` with discrete tasks per the template in `spec-driven-development` Phase 3.
