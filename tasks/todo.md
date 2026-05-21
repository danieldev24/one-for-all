# Todo: one-for-all v1.1 — Skill Quality Pass

Implementation task list for [SPEC.md](../SPEC.md) and [tasks/plan.md](plan.md).
Tasks are ordered by dependency. Each is sized to fit in one focused session.
Mark the box when complete; do not skip verification.

---

## Phase 1 — Tooling

### Task 1: Extend `validate-skills.js` with the six new structural checks

**Description:** Add six new structural checks to the existing validator, gated by a `--strict` flag (off by default → soft mode for the rollout window). Soft mode prints `WARN:` for new checks; strict mode promotes them to `ERROR:` and exits 1.

**Acceptance criteria:**
- [ ] `--strict` flag plumbed; soft is the default
- [ ] Check A: frontmatter `description` is ≥ 100 chars AND contains the substring `when` or `trigger` (case-insensitive)
- [ ] Check B: required H2 sections include `## Next` (added to existing `REQUIRED_SECTIONS`)
- [ ] Check C: `## Verification` contains ≥ 3 lines matching `^- \[ ?\]`
- [ ] Check D: `## Common Rationalizations` has a markdown table with ≥ 3 data rows (not counting header + separator)
- [ ] Check E: `## Next` contains a markdown table with ≥ 2 data rows
- [ ] Check F: SKILL.md is ≤ 500 lines
- [ ] Existing exemptions in `SECTION_EXEMPT_SKILLS` continue to bypass the section-presence checks (B), but still receive checks A, C, D, E, F
- [ ] Output is one line per (skill, check, status) so failures are individually grep-able

**Verification:**
- [ ] `node scripts/validate-skills.js` runs to completion
- [ ] `node scripts/validate-skills.js --strict` produces non-zero exit when any of A–F fail (manually break one skill to confirm, then revert)
- [ ] Manually inspect output for one passing and one failing skill — counts match the file content

**Dependencies:** None

**Files likely touched:**
- `scripts/validate-skills.js`

**Estimated scope:** M (1 file, ~150 new lines)

---

### Task 2: Author `scripts/scan-duplication.js`

**Description:** Cross-skill duplicate-content detector. Reads all `skills/*/SKILL.md`, normalizes lines, and flags any block of ≥ 5 consecutive non-trivial lines that appears in two or more files. Output: ranked list, longest blocks first, with file paths and line ranges.

**Acceptance criteria:**
- [ ] Excludes from comparison: empty/whitespace lines, markdown table separators (`|---`), section headers (`^## `, `^### `), YAML frontmatter delimiters and keys
- [ ] Threshold: ≥ 5 consecutive eligible lines duplicated verbatim across ≥ 2 SKILL.md files
- [ ] Output format per duplicate block: `[N lines, M files] skills/X/SKILL.md:L1-L2 ↔ skills/Y/SKILL.md:L3-L4` followed by the block content (truncated to first 3 lines + `...`)
- [ ] Sorted by block length descending, then by file count descending
- [ ] `--json` flag emits machine-readable output for CI

**Verification:**
- [ ] `node scripts/scan-duplication.js` runs cleanly
- [ ] Run produces output (we know from the audit there are duplicates today)
- [ ] Manually verify one reported duplicate by opening both files at the cited line ranges

**Dependencies:** None

**Files likely touched:**
- `scripts/scan-duplication.js` (new)

**Estimated scope:** M (1 new file, ~120 lines)

---

### Task 3: Author `scripts/check-lifecycle-chain.js`

**Description:** Static analyzer for the `## Next` lifecycle handoff sections. Parses every skill's `## Next` table, resolves referenced skill names and slash commands, and reports broken references plus structural orphans / dead-ends.

**Acceptance criteria:**
- [ ] Parses the markdown table under `## Next` in every SKILL.md
- [ ] Extracts referenced names from the right-hand column: matches inline-code spans (`` `name` ``) and slash-command syntax (`/ofa-name`)
- [ ] Reports as ERROR: any referenced skill that doesn't have a directory in `skills/`, any `/ofa-X` command that doesn't have a file in `.claude/commands/ofa-X.md`
- [ ] Reports as WARN: orphan skills (no other skill points to them), except `using-one-for-all` (intentional entry point)
- [ ] Reports as WARN: dead-end skills (no outgoing edges in their `## Next` table) — should be zero after Phase 3.5
- [ ] Exit 1 on ERROR; exit 0 on WARN-only

**Verification:**
- [ ] Runs cleanly against a hand-crafted fixture skill with both valid and broken refs (commit fixture under `scripts/__fixtures__/`, or test inline)
- [ ] Today's repo (no `## Next` sections yet) produces a known-shape error report listing all 23 skills as missing the section — used as Phase 2 baseline

**Dependencies:** None (independent of Tasks 1 & 2; can be authored in parallel)

**Files likely touched:**
- `scripts/check-lifecycle-chain.js` (new)

**Estimated scope:** M (1 new file, ~120 lines)

---

### Task 4: Draft `docs/lifecycle-map.md`

**Description:** Single source of truth for which skill follows which. Used by Phase 3.5 authors to write each `## Next` table consistently. Covers all 23 skills + 7 slash commands. Format: a phase-by-phase graph with forward edges (canonical happy path) and branch edges (alternate paths and step-backs).

**Acceptance criteria:**
- [ ] Every skill in `skills/` is named in the document at least once (as source or destination)
- [ ] Every slash command in `.claude/commands/` is named in the document at least once
- [ ] Each skill has at least one outgoing edge (forward path or branch)
- [ ] Document is grouped by lifecycle phase: Define → Plan → Build → Verify → Review → Ship, plus Meta
- [ ] Includes a brief "How to read this map" header explaining edges and branches
- [ ] An ASCII diagram shows the canonical happy-path spine (Define → Plan → Build → Verify → Review → Ship)

**Verification:**
- [ ] Manual cross-check: every skill directory under `skills/` appears
- [ ] Manual cross-check: every command file under `.claude/commands/` appears
- [ ] Read the doc cold and confirm it answers "after `/ofa-spec`, what do I run?" for every skill

**Dependencies:** None

**Files likely touched:**
- `docs/lifecycle-map.md` (new)

**Estimated scope:** M (1 new file, ~150 lines)

---

### Task 5: Update `docs/skill-anatomy.md` with the v1.1 bar

**Description:** Document the new authoring rules so contributors hit the bar without reading validator source. Add subsections for trigger sharpness, verification rigor, anti-rationalization rebuttals, dedup via cross-references, and lifecycle handoff.

**Acceptance criteria:**
- [ ] New subsection: "Trigger sharpness" — shows good and bad examples of `description:` frontmatter, names the 100-char + "when/trigger" requirement
- [ ] New subsection: "Verification rigor" — shows checklist items as testable conditions, names the ≥ 3 items requirement
- [ ] New subsection: "Anti-rationalization rebuttals" — shows how to write rebuttals that have failure stories or quantified cost, names the ≥ 3 rows requirement
- [ ] New subsection: "Dedup via cross-references" — shows the rule: if content appears in two skills, extract to `references/` and link
- [ ] New subsection: "Lifecycle handoff (`## Next` section)" — full canonical example table + the standard footer line about ending the conversation turn
- [ ] Updates the "Standard Sections" list at the top to include `## Next`
- [ ] Mentions `node scripts/validate-skills.js --strict` as the gate

**Verification:**
- [ ] Read the doc cold and confirm a new contributor could write a SKILL.md that passes strict validation using only this doc

**Dependencies:** Tasks 1, 4 (so the rules and lifecycle map exist to point at)

**Files likely touched:**
- `docs/skill-anatomy.md`

**Estimated scope:** S (1 file, ~100 lines added)

---

### Checkpoint A — End of Phase 1 (Tooling)

- [ ] All four scripts and updated anatomy doc are committed
- [ ] `node scripts/validate-skills.js` runs without error in soft mode
- [ ] `node scripts/scan-duplication.js` runs and produces output
- [ ] `node scripts/check-lifecycle-chain.js` runs and produces a report
- [ ] Human reviews and approves before proceeding

---

## Phase 2 — Measure

### Task 6: Capture baseline reports

**Description:** Run all three scripts against the current state and check in their output. This is the "before" snapshot; Phase 4 dogfood compares against it.

**Acceptance criteria:**
- [ ] `tasks/baseline-validator.txt` contains full output of `node scripts/validate-skills.js --strict` (which will fail today — that's expected, this is the baseline)
- [ ] `tasks/baseline-duplication.txt` contains full output of `node scripts/scan-duplication.js`
- [ ] `tasks/baseline-lifecycle.txt` contains full output of `node scripts/check-lifecycle-chain.js`

**Verification:**
- [ ] All three files exist and are non-empty
- [ ] Files are checked into git

**Dependencies:** Tasks 1, 2, 3

**Files likely touched:**
- `tasks/baseline-validator.txt` (new)
- `tasks/baseline-duplication.txt` (new)
- `tasks/baseline-lifecycle.txt` (new)

**Estimated scope:** XS (3 files, all generated)

---

### Task 7: Re-audit the 8 targeted skills against the five-axis rubric

**Description:** Score each of the 8 audit-targeted skills 0–3 on each of the 5 quality axes (triggers, verification, dedup, rationalizations, lifecycle handoff) using the same method as the original audit. This is the number Phase 3 has to beat (≤ 4/15 per skill at exit, given the rubric grew from 12 to 15).

**Acceptance criteria:**
- [ ] `tasks/baseline-audit.md` contains a row per audit-targeted skill: `<name> | triggers/3 | verify/3 | dedup/3 | rationalize/3 | handoff/3 | TOTAL/15`
- [ ] Each score has a one-sentence justification with a file:line citation
- [ ] Total score per skill is documented; cross-reference matches the original audit's 12-point totals plus a 0/3 for handoff (no skill has `## Next` today)

**Verification:**
- [ ] All 8 skills present in the table
- [ ] Every cell has a justification
- [ ] Sum of cells matches the TOTAL column

**Dependencies:** None (pure analysis, can run in parallel with Phase 1)

**Files likely touched:**
- `tasks/baseline-audit.md` (new)

**Estimated scope:** S (1 file, ~80 lines)

---

### Checkpoint B — End of Phase 2 (Measure)

- [ ] Baseline reports + audit committed
- [ ] Numbers, not prose: every score has a digit
- [ ] Confirm with human that the baseline matches expectation before any skill edits

---

## Phase 3 — Fix the 8 audit-targeted skills

For each skill below, the workflow is the same:

1. Sharpen `description:` frontmatter (triggers + skip conditions)
2. Sharpen "When to Use" with concrete user-phrase signals
3. Rewrite "Common Rationalizations" rows with concrete rebuttals (failure story or quantified cost)
4. Replace generic verification items with measurable ones
5. Extract duplicated content to a new `references/<topic>.md` if applicable; replace in-skill content with one-paragraph summary + link
6. Run `node scripts/validate-skills.js --strict` for that skill (still soft globally; flip strict in Task 16)
7. Re-score the skill against the 5-axis rubric; commit a `tasks/audit-progress.md` line showing before → after

`## Next` section is **not** added in Phase 3 — that's Phase 3.5. Phase 3 focuses on the four original axes.

### Task 8: Fix `spec-driven-development`

**Acceptance criteria:**
- [ ] All 6 fix-skill workflow steps complete
- [ ] Validator passes 5 checks for this skill (Next is still empty — added in Task 17)
- [ ] Re-score: triggers ≤ 1, verification ≤ 1, dedup ≤ 1, rationalizations ≤ 1; subtotal ≤ 4/12
- [ ] Phase 3 references file extracted: none expected here unless audit revealed surprises

**Verification:**
- [ ] `node scripts/validate-skills.js --strict skills/spec-driven-development/SKILL.md` exits 0 for the relevant checks (or use grep on the global run)
- [ ] `tasks/audit-progress.md` shows before/after row for this skill

**Dependencies:** Phase 1 + Phase 2 done

**Files likely touched:**
- `skills/spec-driven-development/SKILL.md`
- `tasks/audit-progress.md` (append)

**Estimated scope:** M

---

### Task 9: Fix `planning-and-task-breakdown`

Same workflow as Task 8.

**Acceptance criteria:** subtotal ≤ 4/12, validator passes, audit-progress updated.

**Dependencies:** Task 8 (so `spec-driven-development` is the canonical handoff target it cross-references)

**Files likely touched:**
- `skills/planning-and-task-breakdown/SKILL.md`
- `tasks/audit-progress.md` (append)

**Estimated scope:** M

---

### Task 10: Fix `incremental-implementation`

Same workflow.

**Acceptance criteria:** subtotal ≤ 4/12, validator passes, audit-progress updated.

**Dependencies:** Task 9

**Files likely touched:**
- `skills/incremental-implementation/SKILL.md`
- `tasks/audit-progress.md`

**Estimated scope:** M

---

### Task 11: Fix `test-driven-development`

Same workflow. Move browser-testing content out of this skill if it's load-bearing for `browser-testing-with-devtools` (audit flagged this overlap).

**Acceptance criteria:** subtotal ≤ 4/12, validator passes, audit-progress updated, browser-testing content lives in only one place.

**Dependencies:** Task 10

**Files likely touched:**
- `skills/test-driven-development/SKILL.md`
- `skills/browser-testing-with-devtools/SKILL.md` (only if content moved in)
- `tasks/audit-progress.md`

**Estimated scope:** M

---

### Checkpoint C — Mid-Phase 3

- [ ] First 4 skills (Tasks 8–11) re-scored at ≤ 4/12 each
- [ ] No new duplicates introduced (run `scan-duplication.js`; output should not grow)
- [ ] Confirm with human before continuing

---

### Task 12: Fix `code-review-and-quality` and extract `references/five-axis-review.md`

**Description:** Audit found this skill replicates the 5-axis review framing across `using-one-for-all`, `ofa-review` command, and the agent personas. Extract the canonical 5-axis description to a single reference file.

**Acceptance criteria:**
- [ ] `references/five-axis-review.md` exists with the canonical 5-axis description (correctness, readability, architecture, security, performance) including one example finding per axis
- [ ] `code-review-and-quality` SKILL.md replaces inline 5-axis content with a one-paragraph summary + link
- [ ] `using-one-for-all` skill is **not** edited (deferred per spec); but a check confirms the 5-axis content there will need follow-up — note in `tasks/v1.2-followups.md`
- [ ] subtotal ≤ 4/12, validator passes, audit-progress updated

**Dependencies:** Task 11

**Files likely touched:**
- `references/five-axis-review.md` (new)
- `skills/code-review-and-quality/SKILL.md`
- `tasks/v1.2-followups.md` (new)
- `tasks/audit-progress.md`

**Estimated scope:** M

---

### Task 13: Fix `security-and-hardening` and extract two references

**Description:** Audit found heavy overlap with `api-and-interface-design` (input validation) and `git-workflow-and-versioning` (secrets). Extract both shared bodies of content.

**Acceptance criteria:**
- [ ] `references/input-validation.md` exists with canonical patterns (boundary validation, allowlists vs blocklists, sanitization examples)
- [ ] `references/secrets-management.md` exists with canonical patterns (never commit, env vars, secret scanning)
- [ ] `security-and-hardening` SKILL.md replaces both inline sections with summaries + links
- [ ] Triaging decision tree (audit flagged the mismatch with the verification checklist) is reconciled — either move to the reference or update the checklist to match it
- [ ] subtotal ≤ 4/12, validator passes, audit-progress updated

**Dependencies:** Task 12

**Files likely touched:**
- `references/input-validation.md` (new)
- `references/secrets-management.md` (new)
- `skills/security-and-hardening/SKILL.md`
- `tasks/audit-progress.md`

**Estimated scope:** L (3 files, but mechanical extraction)

---

### Task 14: Fix `api-and-interface-design`

**Description:** Replace duplicated input-validation content with a link to the reference created in Task 13. Reconcile Hyrum's Law content with `deprecation-and-migration` (which is **not** in the audit-targeted 8 — leave its copy alone, but make the API skill's version the canonical reference and have it cross-link to the deprecation skill).

**Acceptance criteria:**
- [ ] Input-validation section replaced with summary + link to `references/input-validation.md`
- [ ] Hyrum's Law text appears in only one place; the other location cross-references it
- [ ] subtotal ≤ 4/12, validator passes, audit-progress updated

**Dependencies:** Task 13 (needs the reference file to exist)

**Files likely touched:**
- `skills/api-and-interface-design/SKILL.md`
- `tasks/audit-progress.md`

**Estimated scope:** M

---

### Task 15: Fix `context-engineering`

**Description:** The most isolated of the 8. Sharpen triggers (current "when output quality degrades" is too vague — name specific signals like hallucinated APIs, wrong patterns, repeated mistakes). Disentangle from `source-driven-development`.

**Acceptance criteria:**
- [ ] Triggers name 3+ specific degradation signals
- [ ] Demarcation paragraph explaining when to use this vs `source-driven-development`
- [ ] subtotal ≤ 4/12, validator passes, audit-progress updated

**Dependencies:** Task 14

**Files likely touched:**
- `skills/context-engineering/SKILL.md`
- `tasks/audit-progress.md`

**Estimated scope:** M

---

### Task 16: Flip validator to strict for the 5 original checks

**Description:** With all 8 audit-targeted skills fixed, the 5 original new checks (description length, sections, verification items, rationalizations, line count) should pass on all 23 skills. The `## Next` check stays soft until Phase 3.5 closes.

**Acceptance criteria:**
- [ ] `node scripts/validate-skills.js --strict --skip=next` (or equivalent flag) exits 0 across all 23 skills
- [ ] Default invocation (no `--strict`) still exits 0 with warnings about missing `## Next`

**Verification:**
- [ ] CI run on a feature branch confirms strict exit 0

**Dependencies:** Tasks 8–15

**Files likely touched:**
- `scripts/validate-skills.js` (small flag tweak only)

**Estimated scope:** XS

---

### Checkpoint D — End of Phase 3 (Fix)

- [ ] All 8 audit-targeted skills at ≤ 4/12 (4-axis re-audit)
- [ ] Validator strict on 5 of 6 checks across all 23 skills
- [ ] `scan-duplication.js` shows reduction vs Phase 2 baseline (target: zero blocks > 4 lines is the Phase 3.5 exit, not here)
- [ ] Confirm with human before Phase 3.5

---

## Phase 3.5 — Lifecycle Handoff

### Tasks 17–39: Add `## Next` to each of the 23 skills

**Description:** One task per skill. Each adds a `## Next` section after `## Verification` containing:
- 1-sentence intro: "After this skill exits, advise the user on what to do next. Pick the row that matches the situation."
- Markdown table with ≥ 2 rows: `| If the situation is... | Suggest invoking |`
- Standard footer: "End the conversation turn with: `Next: I recommend \`<skill or command>\` because <reason>`."

Table rows are pulled from `docs/lifecycle-map.md`. Minimum: one happy-path row, one branch row.

**Per-skill acceptance criteria:**
- [ ] `## Next` section added after `## Verification`
- [ ] Table has ≥ 2 rows; each right-cell references either a skill name or a slash command
- [ ] All references resolve (script in Task 3 confirms)
- [ ] Standard footer line present

**Per-skill verification:**
- [ ] `node scripts/validate-skills.js --strict` passes the `## Next` check for this skill
- [ ] `node scripts/check-lifecycle-chain.js` reports zero ERRORs from this skill

**Dependencies:** Tasks 4 (lifecycle map), 16 (validator strict on other checks)

**The 23 tasks (parallel-eligible):**
- [ ] Task 17: `using-one-for-all`
- [ ] Task 18: `interview-me`
- [ ] Task 19: `idea-refine`
- [ ] Task 20: `spec-driven-development`
- [ ] Task 21: `planning-and-task-breakdown`
- [ ] Task 22: `incremental-implementation`
- [ ] Task 23: `test-driven-development`
- [ ] Task 24: `context-engineering`
- [ ] Task 25: `source-driven-development`
- [ ] Task 26: `doubt-driven-development`
- [ ] Task 27: `frontend-ui-engineering`
- [ ] Task 28: `api-and-interface-design`
- [ ] Task 29: `browser-testing-with-devtools`
- [ ] Task 30: `debugging-and-error-recovery`
- [ ] Task 31: `code-review-and-quality`
- [ ] Task 32: `code-simplification`
- [ ] Task 33: `security-and-hardening`
- [ ] Task 34: `performance-optimization`
- [ ] Task 35: `git-workflow-and-versioning`
- [ ] Task 36: `ci-cd-and-automation`
- [ ] Task 37: `deprecation-and-migration`
- [ ] Task 38: `documentation-and-adrs`
- [ ] Task 39: `shipping-and-launch`

**Estimated scope:** XS each (1 file, ~15 lines added). Total: ~½ day if parallelized.

---

### Task 40: Flip validator to fully strict; close Phase 3.5

**Acceptance criteria:**
- [ ] `node scripts/validate-skills.js --strict` exits 0 across all 23 skills with no flag exemptions
- [ ] `node scripts/check-lifecycle-chain.js` reports zero ERRORs, only the intended `using-one-for-all` orphan WARN
- [ ] `node scripts/scan-duplication.js` reports zero blocks > 4 lines (Phase 3.5 exit gate from spec)

**Dependencies:** Tasks 17–39

**Files likely touched:**
- `scripts/validate-skills.js` (default-strict toggle, if applicable)

**Estimated scope:** XS

---

### Checkpoint E — End of Phase 3.5

- [ ] All 23 skills have `## Next`
- [ ] Validator strict on all 6 checks
- [ ] Lifecycle chain checker green
- [ ] Duplication scanner reports zero substantial duplicates
- [ ] Human review before Phase 4

---

## Phase 4 — Prove

### Task 41: Stand up sandbox repo for dogfooding

**Description:** Create a minimal Node/TS scaffold in a sibling directory with a vague feature request as the README brief. The vagueness is deliberate — it tests trigger sharpness.

**Acceptance criteria:**
- [ ] New repo at `~/Documents/My Project/one-for-all-dogfood-v1.1/` (or path agreed with user)
- [ ] Initial scaffold: `package.json`, `tsconfig.json`, `src/index.ts`, `README.md`
- [ ] README contains exactly one feature request, written in vague natural language (e.g., "I want users to be able to share a card with a public link")
- [ ] one-for-all v1.1 plugin loaded into Claude Code for the dogfood session

**Verification:**
- [ ] Repo opens in Claude Code
- [ ] `/ofa-spec`, `/ofa-plan`, `/ofa-build` all available

**Dependencies:** Task 40

**Files likely touched:**
- New repo (out of tree)

**Estimated scope:** S

---

### Task 42: Run dogfood session and capture transcript

**Description:** Open the sandbox repo, paste the README brief as the prompt, and run the agent through a full Define → Plan → Build → Verify loop without naming any skill or command. Record observations against the five dogfood checks.

**Acceptance criteria:**
- [ ] Full transcript saved (copy-paste, screenshot, or git commits) to `docs/dogfood-v1.1.md`
- [ ] Five dogfood checks evaluated and answered yes/no with evidence:
  1. Did the agent invoke `/ofa-spec` (or load `spec-driven-development`) without being told?
  2. Did the agent refuse to mark `done` when verification items were unsatisfied?
  3. Did the agent rebut at least one rationalization from the table?
  4. Did simultaneously-loaded skills emit duplicate guidance?
  5. Did the agent end each skill turn with an explicit "Next: I recommend X" handoff?

**Verification:**
- [ ] `docs/dogfood-v1.1.md` exists with transcript + analysis
- [ ] All five checks have explicit yes/no with quoted evidence
- [ ] If any check fails, file a follow-up task and loop back to Phase 3 / 3.5 for the relevant skill

**Dependencies:** Task 41

**Files likely touched:**
- `docs/dogfood-v1.1.md` (new)

**Estimated scope:** M

---

### Task 43: Wire validation scripts into CI

**Description:** Run validator, dedup scan, and lifecycle chain check on every PR. Until this lands, the strict-mode signal is local-only.

**Acceptance criteria:**
- [ ] `.github/workflows/validate-skills.yml` runs the three scripts on PR
- [ ] Failure of any script blocks the merge (status check required)
- [ ] Workflow runs in < 30 seconds (these are tiny scripts)

**Verification:**
- [ ] Open a PR, confirm status check appears and passes
- [ ] Manually break a skill in a test branch, confirm CI blocks the PR

**Dependencies:** Task 40

**Files likely touched:**
- `.github/workflows/validate-skills.yml` (new or modified)

**Estimated scope:** S

---

### Checkpoint F — Done

- [ ] All Success Criteria from SPEC.md hold:
  - [ ] 8 skills at ≤ 4/15 on five-axis re-audit
  - [ ] Validator strict on all 6 checks for all 23 skills
  - [ ] All 23 skills have `## Next` section
  - [ ] Duplication scan clean (zero substantial duplicates)
  - [ ] Dogfood transcript demonstrates all 5 behaviors
  - [ ] `docs/skill-anatomy.md` documents the new bar
- [ ] Human approves
- [ ] SPEC.md and tasks/*.md cleaned up or .gitignored per spec instructions

---

## Risks (active during execution)

| Risk | Mitigation |
|---|---|
| New validator checks reject legitimate variation | Soft-mode rollout (Tasks 1, 16, 40 phase the strictness) |
| Dedup extraction strips skills of standalone value | Rule: every skill keeps at least one full worked example; references hold reusable patterns only |
| Phase 3.5 mechanical work creates 23 superficially-identical `## Next` tables | Each table must have at least one row pulled from a *branch* edge (alternate path or step-back), not just the happy-path forward edge |
| `using-one-for-all` drifts as other skills tighten | Out of scope per spec; tracked in `tasks/v1.2-followups.md` (created in Task 12) |
| Sandbox dogfood task too easy to be a real test | Vague natural-language brief picked by the human, not me; fails as data if the agent gets it right too easily |

---

## Open Questions

(Resolved in previous turns — recording for traceability:)
1. ✅ Dogfood target: synthetic sandbox repo
2. ✅ Validator rollout: soft → strict
3. ✅ References extraction: yes
4. ✅ `using-one-for-all`: deferred to v1.2

(Newly raised by this task list:)
5. Path for sandbox dogfood repo — confirm before Task 41
6. CI provider — `.github/workflows/` assumes GitHub Actions; confirm before Task 43

---

**Total tasks:** 43
**Estimated effort:** ~3 days for one focused agent
**Total checkpoints:** 6
