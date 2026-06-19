# Lean Senior SDLC Enhancement Tasks

## Task 1: Write Lean Senior SDLC reference

**Description:** Create the canonical one-for-all reference for "senior dev lười
nhưng đúng": smallest correct slice, existing capability before new code,
deletion before abstraction, and safety boundaries that must not be cut.

- Acceptance: `references/lean-senior-sdlc.md` exists with a short minimality
  gate, safety boundaries, examples, and links to token efficiency.
- Verify: file inspection plus targeted `rg` checks.

**Acceptance criteria:**
- [x] The reference defines the Lean Senior SDLC principle in one paragraph.
- [x] The reference includes a 4-6 question minimality gate.
- [x] The reference explicitly protects validation, data safety, security,
      accessibility, and explicit user requirements.
- [x] The reference explains when to leave a `lean:` comment for intentional
      simplifications with a known ceiling.

**Verification:**
- [x] `test -f references/lean-senior-sdlc.md`
- [x] `rg 'minimality|stdlib|native|security|accessibility|lean:' references/lean-senior-sdlc.md`
- [x] Manual check: the reference is short enough to load alongside
      `references/token-efficiency.md`.

**Dependencies:** None

**Files likely touched:**
- `references/lean-senior-sdlc.md`

**Estimated scope:** S

## Task 2: Update contributor anatomy

**Description:** Teach contributors how to apply Lean Senior SDLC in skills
without duplicating shared guidance or weakening skill-specific examples.

- Acceptance: `docs/skill-anatomy.md` explains where lean guidance belongs.
- Verify: strict skill validation plus targeted reference checks.

**Acceptance criteria:**
- [x] `docs/skill-anatomy.md` says reusable lean rules belong in `references/`.
- [x] The anatomy guide explains that skills should include only local examples
      and links to the shared reference.
- [x] The guide states that token savings cannot remove verification evidence.

**Verification:**
- [x] `rg 'Lean Senior|lean|token|verification' docs/skill-anatomy.md`
- [x] Manual check: the new guidance does not conflict with token metadata rules.
- [x] Manual check: no long Ponytail-style ladder is duplicated in anatomy docs.

**Dependencies:** Task 1

**Files likely touched:**
- `docs/skill-anatomy.md`

**Estimated scope:** S

## Task 3: Map lifecycle gates

**Description:** Add the lean gate to the lifecycle map as a cross-cutting
discipline that appears at Define, Plan, Build, Verify, Review, and Ship.

- Acceptance: `docs/lifecycle-map.md` names where the lean gate applies without
  adding a new lifecycle phase.
- Verify: lifecycle-chain check plus manual map review.

**Acceptance criteria:**
- [x] The lifecycle map describes Lean Senior SDLC as cross-cutting.
- [x] Each SDLC phase has one concise lean question.
- [x] No new skill edge is introduced unless it resolves to an existing skill or
      planned command.

**Verification:**
- [x] `node scripts/check-lifecycle-chain.js`
- [x] `rg 'Lean Senior|smallest|minimal|cross-cutting' docs/lifecycle-map.md`
- [x] Manual check: the canonical spine remains unchanged.

**Dependencies:** Task 1

**Files likely touched:**
- `docs/lifecycle-map.md`

**Estimated scope:** S

## Checkpoint: Foundation

- [x] `references/lean-senior-sdlc.md` is the single source of truth.
- [x] `docs/skill-anatomy.md` tells contributors how to use the reference.
- [x] `docs/lifecycle-map.md` shows lean gates without changing the SDLC spine.

## Task 4: Update router behavior

**Description:** Teach `using-one-for-all` to apply the lean gate before loading
extra skills, so the router chooses the smallest safe path by default.

- Acceptance: router links to Lean Senior SDLC and token-efficiency guidance.
- Verify: strict skill validation plus dedup scan.

**Acceptance criteria:**
- [x] `skills/using-one-for-all/SKILL.md` references the lean gate before skill
      expansion.
- [x] Routing still chooses one primary skill plus trigger-backed companions.
- [x] Red flags include loading a full SDLC path for a tiny or obvious task.

**Verification:**
- [x] `node scripts/validate-skills.js --strict`
- [x] `node scripts/scan-duplication.js`
- [x] Manual check: `using-one-for-all` remains a router, not a policy dump.

**Dependencies:** Tasks 1, 2, 3

**Files likely touched:**
- `skills/using-one-for-all/SKILL.md`

**Estimated scope:** S

## Task 5: Pilot build path

**Description:** Apply the lean gate to planning, incremental implementation,
and TDD so agents build the smallest verified slice with existing capabilities
before adding code or dependencies.

- Acceptance: build-path skills apply the lean gate in task-specific language.
- Verify: strict validation plus dedup scan.

**Acceptance criteria:**
- [x] `planning-and-task-breakdown` asks for the smallest verified slice.
- [x] `incremental-implementation` prefers stdlib, platform/native features,
      and existing utilities before new code or dependencies.
- [x] `test-driven-development` calls for the smallest meaningful check without
      skipping non-trivial behavior coverage.

**Verification:**
- [x] `node scripts/validate-skills.js --strict`
- [x] `node scripts/scan-duplication.js`
- [x] Manual check: each skill keeps a local example and links to the reference.

**Dependencies:** Task 4

**Files likely touched:**
- `skills/planning-and-task-breakdown/SKILL.md`
- `skills/incremental-implementation/SKILL.md`
- `skills/test-driven-development/SKILL.md`

**Estimated scope:** M

## Task 6: Pilot review path

**Description:** Apply the lean gate to review and simplification so reviewers
produce a delete-list, flag speculative abstractions, and preserve behavior.

- Acceptance: review-path skills expose over-engineering findings cleanly.
- Verify: strict validation plus dedup scan.

**Acceptance criteria:**
- [x] `code-review-and-quality` includes over-engineering findings as a review
      lens, not just style feedback.
- [x] `code-simplification` links to Lean Senior SDLC while preserving its
      exact-behavior contract.
- [x] Review guidance distinguishes "less code" from "less correctness".

**Verification:**
- [x] `node scripts/validate-skills.js --strict`
- [x] `node scripts/scan-duplication.js`
- [x] Manual check: simplification still forbids behavior drift.

**Dependencies:** Task 4

**Files likely touched:**
- `skills/code-review-and-quality/SKILL.md`
- `skills/code-simplification/SKILL.md`

**Estimated scope:** M

## Task 7: Tune command entries

**Description:** Update slash command entry points so `/ofa-plan`,
`/ofa-build`, `/ofa-test`, `/ofa-review`, and `/ofa-code-simplify` invoke lean
behavior without expanding command text into a second policy reference.

- Acceptance: command files mention lean defaults and escalation triggers.
- Verify: command validator plus manual command review.

**Acceptance criteria:**
- [x] Command files mention concise lean defaults.
- [x] Commands preserve existing verification language.
- [x] Commands link to the canonical skill rather than duplicating the reference.

**Verification:**
- [x] `node scripts/validate-commands.js`
- [x] `rg 'lean|smallest|verification|escalate' .claude/commands`
- [x] Manual check: command wording remains short.

**Dependencies:** Tasks 4, 5, 6

**Files likely touched:**
- `.claude/commands/ofa-plan.md`
- `.claude/commands/ofa-build.md`
- `.claude/commands/ofa-test.md`
- `.claude/commands/ofa-review.md`
- `.claude/commands/ofa-code-simplify.md`

**Estimated scope:** M

## Checkpoint: Pilot

- [x] `node scripts/validate-skills.js --strict`
- [x] `node scripts/validate-commands.js`
- [x] `node scripts/scan-duplication.js`
- [x] Manual review confirms pilot skills changed behavior without copying the
      full reference into each file.

## Task 8: Add lean validation checks

**Description:** Extend validator coverage to catch vague or over-engineering
patterns once pilot wording stabilizes.

- Acceptance: validator reports actionable lean-guidance issues with fixtures.
- Verify: validator tests plus strict validation.

**Acceptance criteria:**
- [x] `scripts/validate-skills.js` warns when changed skills lack lean reference
      hooks where expected.
- [x] Validator flags vague expansion phrases such as "build a robust framework"
      when no evidence or trigger is provided.
- [x] Fixture tests cover passing and failing lean examples.

**Verification:**
- [x] `node scripts/test-validator.js`
- [x] `node scripts/validate-skills.js --strict`
- [x] Manual check: messages identify the skill and the concrete issue.

**Dependencies:** Tasks 5, 6

**Files likely touched:**
- `scripts/validate-skills.js`
- `scripts/test-validator.js`
- `scripts/__fixtures__/skills/all-passing/SKILL.md`
- `scripts/__fixtures__/skills/all-failing/SKILL.md`

**Estimated scope:** M

## Task 9: Add benchmark specification

**Description:** Design an OFA benchmark inspired by Ponytail's agentic
benchmark, adapted to measure workflow quality, context loading, verification,
safety, LOC, files changed, cost, time, turns, and completeness.

- Acceptance: benchmark spec exists before harness implementation.
- Verify: file inspection plus metric coverage review.

**Acceptance criteria:**
- [x] `docs/lean-senior-benchmark.md` defines arms: baseline, current OFA,
      OFA lean, and OFA strict where relevant.
- [x] The spec defines metrics for skill path length, context files, source LOC,
      test LOC, verification, safety, cost, time, and turns.
- [x] The spec explains why fewer lines only count when completeness and safety
      remain intact.

**Verification:**
- [x] `test -f docs/lean-senior-benchmark.md`
- [x] `rg 'baseline|OFA lean|context|verification|safety|turns' docs/lean-senior-benchmark.md`
- [x] Manual check: the benchmark can disprove the lean workflow, not only
      flatter it.

**Dependencies:** Tasks 1, 4

**Files likely touched:**
- `docs/lean-senior-benchmark.md`

**Estimated scope:** S

## Task 10: Create dogfood scenarios

**Description:** Add representative scenarios that test whether OFA chooses the
smallest safe workflow across tiny, normal, strict, UI, and review tasks.

- Acceptance: dogfood scenarios exist with expected skill paths and checks.
- Verify: file inspection plus scenario count.

**Acceptance criteria:**
- [x] Dogfood notes cover at least five task types.
- [x] Each scenario names the expected mode, skill path, lean gate decision, and
      verification evidence.
- [x] At least one scenario proves the workflow refuses to cut a safety guard.

**Verification:**
- [x] `test -f docs/dogfood-lean-senior-sdlc.md`
- [x] `grep -c '^## Scenario' docs/dogfood-lean-senior-sdlc.md` returns at
      least 5.
- [x] Manual check: scenarios include one case where doing less is rejected.

**Dependencies:** Task 9

**Files likely touched:**
- `docs/dogfood-lean-senior-sdlc.md`

**Estimated scope:** S

## Checkpoint: Measurement

- [x] Benchmark spec exists and has reviewable metrics.
- [x] Dogfood scenarios cover the high-risk failure modes.
- [x] Validator changes have tests before pack-wide rollout.

## Task 11: Roll out pack-wide references

**Description:** Add concise Lean Senior SDLC hooks to the remaining relevant
skills without copying the full reference text.

- Acceptance: all appropriate skills point to the lean reference where behavior
changes.
- Verify: strict validation, dedup scan, lifecycle chain.

**Acceptance criteria:**
- [x] Relevant skills in Define, Verify, Ship, API, UI, mobile, security,
      performance, and migration phases reference lean behavior where useful.
- [x] No skill duplicates five or more consecutive reference lines.
- [x] Skills that should not change remain untouched.

**Verification:**
- [x] `node scripts/validate-skills.js --strict`
- [x] `node scripts/scan-duplication.js`
- [x] `node scripts/check-lifecycle-chain.js`
- [x] Manual spot-check: at least six skills from different phases have
      appropriate lean hooks.

**Dependencies:** Tasks 8, 10

**Files likely touched:**
- `skills/*/SKILL.md`
- `references/lean-senior-sdlc.md`

**Estimated scope:** M

## Task 12: Run full verification

**Description:** Run the complete project validation suite after rollout and
record any remaining risk.

- Acceptance: existing validation scripts pass.
- Verify: command outputs.

**Acceptance criteria:**
- [x] Strict skill validation passes.
- [x] Command validation passes.
- [x] Dedup scan passes.
- [x] Lifecycle chain passes.

**Verification:**
- [x] `node scripts/validate-skills.js --strict`
- [x] `node scripts/validate-commands.js`
- [x] `node scripts/scan-duplication.js`
- [x] `node scripts/check-lifecycle-chain.js`

**Dependencies:** Task 11

**Files likely touched:**
- None unless verification surfaces fixes.

**Estimated scope:** S

## Task 13: Publish results note

**Description:** Summarize the enhancement, dogfood outcomes, benchmark design,
and known limitations so future contributors understand the why.

- Acceptance: docs or changelog captures the result and tradeoffs.
- Verify: file inspection plus README link check.

**Acceptance criteria:**
- [x] `CHANGELOG.md` or a dedicated docs note summarizes the Lean Senior SDLC
      enhancement.
- [x] README links to the lean reference or benchmark note.
- [x] The writeup names limitations and follow-up work.

**Verification:**
- [x] `rg 'Lean Senior|lean-senior|smallest correct' README.md CHANGELOG.md docs`
- [x] Manual check: the note does not claim benchmark results before they exist.
- [x] Manual check: limitations mention safety and completeness metrics.

**Dependencies:** Task 12

**Files likely touched:**
- `README.md`
- `CHANGELOG.md`
- `docs/lean-senior-benchmark.md`

**Estimated scope:** S

## Checkpoint: Complete

- [x] All project validation scripts pass.
- [x] README exposes the Lean Senior SDLC entry point.
- [x] Dogfood and benchmark docs explain how token savings are measured.
- [x] Human approves moving from plan to `/ofa-build`.
