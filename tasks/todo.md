# Token-Efficient Enhancement Tasks

## Task 1: Define token policy reference

**Description:** Create a concise reference that defines `lite`, `standard`, and `strict`, including context-loading rules, escalation triggers, output-size expectations, and verification that must never be skipped.

- Acceptance: token policy reference exists with concrete mode rules.
- Verify: file inspection plus targeted `rg` checks.

**Acceptance criteria:**
- [x] `references/token-efficiency.md` defines all three modes with concrete examples.
- [x] The reference explains progressive disclosure: start with the entry skill, read supporting files only when risk or ambiguity justifies it.
- [x] The reference states which verification gates remain mandatory in every mode.

**Verification:**
- [x] `test -f references/token-efficiency.md`
- [x] `rg 'lite|standard|strict|progressive disclosure' references/token-efficiency.md`
- [x] Manual check: the file is short enough to be loaded as reusable guidance without becoming a large context burden.

**Dependencies:** None

**Files likely touched:**
- `references/token-efficiency.md`

**Estimated scope:** S

## Task 2: Add skill selection guide

**Description:** Add a routing guide that helps agents choose the smallest sufficient skill set, including mode selection rules for task size, ambiguity, and risk.

- Acceptance: guide maps common requests to minimal skill paths.
- Verify: file inspection plus README link check.

**Acceptance criteria:**
- [x] `docs/skill-selection.md` maps common requests to the minimal recommended skill path.
- [x] The guide includes explicit escalation rules from `lite` to `standard` or `strict`.
- [x] README links to the guide instead of duplicating the routing details.

**Verification:**
- [x] `test -f docs/skill-selection.md`
- [x] `rg 'skill-selection|lite|standard|strict' README.md docs/skill-selection.md`
- [x] Manual check: at least five common scenarios have minimal skill paths.

**Dependencies:** Task 1

**Files likely touched:**
- `docs/skill-selection.md`
- `README.md`

**Estimated scope:** S

## Task 3: Extend skill anatomy schema

**Description:** Update contribution guidance so token-aware metadata is an accepted part of skill design without making the first implementation too noisy.

- Acceptance: anatomy docs define optional token metadata.
- Verify: targeted `rg` plus manual consistency check.

**Acceptance criteria:**
- [x] `docs/skill-anatomy.md` documents optional metadata such as `workflow_mode`, `max_context_files`, and `default_output`.
- [x] The anatomy guide explains when metadata should be required for new or changed skills.
- [x] Examples show how to keep long reusable material in `references/`.

**Verification:**
- [x] `rg 'workflow_mode|max_context_files|default_output' docs/skill-anatomy.md`
- [x] Manual check: the metadata guidance does not conflict with existing required frontmatter rules.
- [x] Manual check: the supporting-files section still preserves progressive disclosure.

**Dependencies:** Task 1

**Files likely touched:**
- `docs/skill-anatomy.md`

**Estimated scope:** S

## Checkpoint: Foundation

- [x] `references/token-efficiency.md` exists and defines all workflow modes.
- [x] `docs/skill-selection.md` exists and README links to it.
- [x] `docs/skill-anatomy.md` documents token metadata without changing validator behavior yet.

## Task 4: Update meta-skill routing

**Description:** Teach `using-one-for-all` to route by minimal sufficient context, including when to stay in `lite` mode and when to escalate to deeper workflows.

- Acceptance: meta-skill routes by minimal sufficient context.
- Verify: strict validation plus lifecycle-chain check.

**Acceptance criteria:**
- [x] `skills/using-one-for-all/SKILL.md` references the token policy and skill selection guide.
- [x] The routing process prefers one primary skill plus only necessary companion skills.
- [x] Red flags include over-loading unrelated skills or broad references.

**Verification:**
- [x] `node scripts/validate-skills.js --strict`
- [x] `node scripts/check-lifecycle-chain.js`
- [x] Manual check: `using-one-for-all` remains a router, not a duplicate of every skill.

**Dependencies:** Tasks 1, 2

**Files likely touched:**
- `skills/using-one-for-all/SKILL.md`

**Estimated scope:** S

## Task 5: Pilot token-aware skill edits

**Description:** Apply the new token-saving style to a small set of high-traffic skills before touching the whole pack.

- Acceptance: pilot skills use concise, progressive-disclosure guidance.
- Verify: strict validation plus dedup scan.

**Acceptance criteria:**
- [x] `planning-and-task-breakdown` explains how to produce a concise plan when scope is small.
- [x] `incremental-implementation` explains how to inspect only directly relevant files before expanding context.
- [x] Any reusable guidance over roughly 100 lines is linked from `references/`, not copied into both skills.

**Verification:**
- [x] `node scripts/validate-skills.js --strict`
- [x] `node scripts/scan-duplication.js`
- [x] Manual check: each pilot skill keeps at least one concrete worked example.

**Dependencies:** Tasks 1, 3, 4

**Files likely touched:**
- `skills/planning-and-task-breakdown/SKILL.md`
- `skills/incremental-implementation/SKILL.md`
- `references/token-efficiency.md`

**Estimated scope:** M

## Task 6: Add semantic validation

**Description:** Extend the validator to detect token-costly or vague skill text patterns, backed by fixture tests so the rule is reliable before pack-wide enforcement.

- Acceptance: validator reports vague or token-costly phrasing.
- Verify: validator tests plus strict validation.

**Acceptance criteria:**
- [x] `scripts/validate-skills.js` reports vague phrases such as "as needed", "ensure quality", or "best practice" when they lack concrete evidence.
- [x] Fixture tests cover passing and failing examples for the new semantic checks.
- [x] The rule starts with a warning unless the team chooses to make it strict immediately.

**Verification:**
- [x] `node scripts/test-validator.js`
- [x] `node scripts/validate-skills.js --strict`
- [x] Manual check: failures include actionable messages with the skill name and check name.

**Dependencies:** Task 3

**Files likely touched:**
- `scripts/validate-skills.js`
- `scripts/test-validator.js`
- `scripts/__fixtures__/skills/all-passing/SKILL.md`
- `scripts/__fixtures__/skills/all-failing/SKILL.md`

**Estimated scope:** M

## Task 7: Update slash command defaults

**Description:** Make the command entry points token-conscious by default while preserving the expected lifecycle handoff behavior.

- Acceptance: command defaults mention concise output and escalation.
- Verify: targeted `rg` plus manual command review.

**Acceptance criteria:**
- [x] `/ofa-plan`, `/ofa-build`, `/ofa-test`, and `/ofa-review` mention concise output expectations.
- [x] Commands say to escalate from `lite` only when risk, ambiguity, failing verification, or user request warrants it.
- [x] Commands still call the same canonical skills as before.

**Verification:**
- [x] `rg 'lite|standard|strict|concise|escalate' .claude/commands .codex .Codex 2>/dev/null`
- [x] Manual check: no command removes required verification language.
- [x] Manual check: command wording stays short enough to avoid becoming a context sink.

**Dependencies:** Tasks 1, 4, 5

**Files likely touched:**
- `.claude/commands/ofa-plan.md`
- `.claude/commands/ofa-build.md`
- `.claude/commands/ofa-test.md`
- `.claude/commands/ofa-review.md`

**Estimated scope:** M

## Checkpoint: Core Behavior

- [x] `node scripts/validate-skills.js --strict` passes after pilot edits.
- [x] `node scripts/scan-duplication.js` passes after shared guidance extraction.
- [x] Slash commands still point to the same canonical lifecycle skills.

## Task 8: Roll out metadata pack-wide

**Description:** Add stable token-related metadata to all skills after the pilot confirms the schema, keeping changes mechanical and easy to review.

- Acceptance: all relevant skills carry agreed token metadata.
- Verify: strict validation plus metadata search.

**Acceptance criteria:**
- [x] Every non-exempt skill has the agreed metadata fields.
- [x] Metadata values match the skill's actual risk and context needs.
- [x] The rollout avoids changing process prose unless necessary for consistency.

**Verification:**
- [x] `node scripts/validate-skills.js --strict`
- [x] `rg '^workflow_mode:|^max_context_files:|^default_output:' skills`
- [x] Manual spot-check: at least five skills from different phases have sensible values.

**Dependencies:** Tasks 3, 5, 6

**Files likely touched:**
- `skills/*/SKILL.md`

**Estimated scope:** M

## Task 9: Extract reusable repeated guidance

**Description:** Remove duplicated token-saving language from individual skills by linking to shared references where appropriate.

- Acceptance: shared token guidance is referenced instead of duplicated.
- Verify: dedup scan plus strict validation.

**Acceptance criteria:**
- [x] Repeated progressive-disclosure guidance lives in `references/token-efficiency.md`.
- [x] Skills keep only task-specific rules and short references to shared guidance.
- [x] Dedup scan reports zero duplicated blocks at the configured threshold.

**Verification:**
- [x] `node scripts/scan-duplication.js`
- [x] `node scripts/validate-skills.js --strict`
- [x] Manual check: skill files remain understandable when read alone.

**Dependencies:** Tasks 5, 8

**Files likely touched:**
- `references/token-efficiency.md`
- `skills/*/SKILL.md`

**Estimated scope:** M

## Task 10: Final validation plus dogfood review

**Description:** Run the complete quality gate and test the new workflow against representative prompts to confirm it saves context without weakening results.

- Acceptance: complete validation passes and dogfood notes capture outcomes.
- Verify: all quality scripts plus manual dogfood review.

**Acceptance criteria:**
- [x] All existing validation scripts pass.
- [x] A dogfood note records at least three representative prompts and the selected mode/skill path.
- [x] The final review calls out remaining tradeoffs or follow-up work.

**Verification:**
- [x] `node scripts/validate-skills.js --strict`
- [x] `node scripts/validate-commands.js`
- [x] `node scripts/scan-duplication.js`
- [x] `node scripts/check-lifecycle-chain.js`
- [x] Manual check: dogfood examples demonstrate smaller context paths than the previous all-purpose flow.

**Dependencies:** Tasks 1-9

**Files likely touched:**
- `docs/dogfood-token-efficiency.md`
- `tasks/todo.md`

**Estimated scope:** S

## Checkpoint: Complete

- [x] `node scripts/validate-skills.js --strict` passes.
- [x] `node scripts/validate-commands.js` passes.
- [x] `node scripts/scan-duplication.js` passes.
- [x] `node scripts/check-lifecycle-chain.js` passes.
- [x] Human approves the final dogfood notes before implementation is considered complete.
