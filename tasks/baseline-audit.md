# Baseline Audit (5-axis, before v1.1 fixes)

Captured 2026-05-21 by re-scoring the 8 audit-targeted skills against the
five-axis rubric defined in [SPEC.md](../SPEC.md). Scores are 0–3 per axis
(0 = fine, 3 = critical weakness). Phase 3 must drive each row to ≤ 4/15
on the four non-handoff axes; Phase 3.5 then closes the handoff axis.

## Scores

| Skill | Triggers | Verify | Overlap | Rationalize | Handoff | TOTAL |
|---|---|---|---|---|---|---|
| spec-driven-development     | 0 | 1 | 0 | 1 | 3 | 5/15 |
| incremental-implementation  | 1 | 1 | 0 | 1 | 3 | 6/15 |
| test-driven-development     | 1 | 1 | 0 | 1 | 3 | 6/15 |
| planning-and-task-breakdown | 1 | 1 | 1 | 1 | 3 | 7/15 |
| code-review-and-quality     | 1 | 1 | 1 | 1 | 3 | 7/15 |
| context-engineering         | 1 | 1 | 1 | 1 | 3 | 7/15 |
| security-and-hardening      | 1 | 1 | 2 | 1 | 3 | 8/15 |
| api-and-interface-design    | 1 | 1 | 2 | 1 | 3 | 8/15 |

**Mean total:** 6.75/15. **Worst:** security-and-hardening, api-and-interface-design (8/15). **Best:** spec-driven-development (5/15).

Note: the original (pre-Phase-0-ingest) audit recorded `spec-driven-development` at 8/12 across 4 axes. Two improvements landed in commit `b1b0e8a` (Phase 0 ingest) before this baseline was captured — that's why this re-audit places it lowest among the 8.

## Justifications

### spec-driven-development (5/15)

- **Triggers (0):** `skills/spec-driven-development/SKILL.md:12-19` — clear positive triggers; missing the negative "don't re-spec when a current spec exists." Phase 0 added ticket-ingestion triggers but not skip conditions.
- **Verify (1):** `skills/spec-driven-development/SKILL.md:242-249` — six concrete checks; "human approved" is non-machine-testable.
- **Overlap (0):** No reference to `planning-and-task-breakdown` or `incremental-implementation` despite Phase 3/4 explicitly handing off to them. Talks about "planning phase" without naming the planning skill.
- **Rationalize (1):** `skills/spec-driven-development/SKILL.md:220-228` — addresses common objections; lacks failure story or quantified rework cost.
- **Handoff (3):** No `## Next` section.

### incremental-implementation (6/15)

- **Triggers (1):** `skills/incremental-implementation/SKILL.md:14-19` — names "multi-file change" and "100+ lines"; no skip conditions, no demarcation against `test-driven-development` or `planning-and-task-breakdown`.
- **Verify (1):** `skills/incremental-implementation/SKILL.md:199-210` — concrete commands (`npm test`, `npm run build`, `npx tsc`) but no observable behavior targets.
- **Overlap (0):** Cross-references `git-workflow-and-versioning` at line 41; missing links to TDD and planning.
- **Rationalize (1):** `skills/incremental-implementation/SKILL.md:215-222` — "Test each slice" is principle-restatement; no incident or cost.
- **Handoff (3):** No `## Next` section.

### test-driven-development (6/15)

- **Triggers (1):** `skills/test-driven-development/SKILL.md:12-20` — "When NOT to use" only mentions pure config; doesn't address behavioral config changes.
- **Verify (1):** `skills/test-driven-development/SKILL.md:372-384` — actionable; line 383 ("don't repeat command") contradicts the run-after-each-change guidance just above.
- **Overlap (0):** Browser-testing content (`SKILL.md:298-327`) treads on `browser-testing-with-devtools` without linking; no link to `incremental-implementation` despite per-slice testing being core.
- **Rationalize (1):** `skills/test-driven-development/SKILL.md:351-359` — strongest of the 8 skills here ("Tests slow you down now. They speed you up every time after"); still no quantified cost or incident link.
- **Handoff (3):** No `## Next` section.

### planning-and-task-breakdown (7/15)

- **Triggers (1):** `skills/planning-and-task-breakdown/SKILL.md:14-19` — vague "obvious scope" exclusion.
- **Verify (1):** `skills/planning-and-task-breakdown/SKILL.md:216-223` — concrete shape ("≤ 5 files per task") but no command to verify.
- **Overlap (1):** No cross-references to upstream `spec-driven-development` or downstream `incremental-implementation`.
- **Rationalize (1):** `skills/planning-and-task-breakdown/SKILL.md:198-203` — "10 minutes saves hours" is hand-waved.
- **Handoff (3):** No `## Next` section.

### code-review-and-quality (7/15)

- **Triggers (1):** `skills/code-review-and-quality/SKILL.md:14-20` — no skip path for trivial diffs.
- **Verify (1):** `skills/code-review-and-quality/SKILL.md:270-311` — five-axis checklist; verdict ("Ready to merge") is subjective.
- **Overlap (1):** Cross-references `security-and-hardening` and `performance-optimization` at lines 61, 74 — but the conceptual gap (security validation duplicated at both skill boundaries) is not noted.
- **Rationalize (1):** `skills/code-review-and-quality/SKILL.md:320-326` — restated principles, no production-bug cost data.
- **Handoff (3):** No `## Next` section.

### context-engineering (7/15)

- **Triggers (1):** `skills/context-engineering/SKILL.md:14-18` — "starting a new session" is too broad.
- **Verify (1):** `skills/context-engineering/SKILL.md:278-283` — "agent output follows patterns" is subjective; no automated check.
- **Overlap (1):** No reference to `spec-driven-development` (defines context to load) or `incremental-implementation` (consumes context per task).
- **Rationalize (1):** `skills/context-engineering/SKILL.md:260-265` — "agent invents APIs" is vague; no quantified hallucination rate or example.
- **Handoff (3):** No `## Next` section.

### security-and-hardening (8/15)

- **Triggers (1):** `skills/security-and-hardening/SKILL.md:12-19` — reactive "when to use"; doesn't trigger during code review.
- **Verify (1):** `skills/security-and-hardening/SKILL.md:341-349` — `npm audit` is automatable; "validation at boundaries" requires manual inspection.
- **Overlap (2):** **Heaviest overlap in the audit.** Input-validation patterns at `SKILL.md:166-196` parallel `api-and-interface-design/SKILL.md:88-109` with no cross-reference. Phase 3 will extract to `references/input-validation.md`.
- **Rationalize (1):** `skills/security-and-hardening/SKILL.md:321-327` — "10x harder" is unsourced.
- **Handoff (3):** No `## Next` section.

### api-and-interface-design (8/15)

- **Triggers (1):** `skills/api-and-interface-design/SKILL.md:13-18` — no negative case (when *not* to design formally).
- **Verify (1):** `skills/api-and-interface-design/SKILL.md:286-293` — testable shape; no harness command (e.g. "OpenAPI lint", "tsc compile").
- **Overlap (2):** Mirror of security-and-hardening above. Same extraction will fix both.
- **Rationalize (1):** `skills/api-and-interface-design/SKILL.md:264-272` — Hyrum's Law restated, not costed. No "versioning mistake cost X weeks" data.
- **Handoff (3):** No `## Next` section.

## Phase 3 priorities (in order)

1. **Overlap on `security-and-hardening` + `api-and-interface-design` (the 2/3 entries):** extract `references/input-validation.md`; both skills cross-link instead of duplicating. Single edit reduces both totals by 2.
2. **Rationalize across all 8 skills:** rewrite tables with failure stories or quantified costs (this axis is uniformly 1/3).
3. **Triggers on `spec-driven-development` + `incremental-implementation`:** add "When NOT to use" with concrete skip criteria.
4. **Verify across all 8 skills:** add at least one executable command per skill so the checklist isn't subjective.
5. **Handoff (deferred to Phase 3.5):** `## Next` section across all 23 skills.

## Target after Phase 3 (before Phase 3.5)

Each row's first four columns ≤ 4 sub-total (handoff still 3). Predicted shape:

| Skill | Triggers | Verify | Overlap | Rationalize | Handoff | TOTAL |
|---|---|---|---|---|---|---|
| (any of the 8)  | ≤1 | ≤1 | ≤1 | ≤1 | 3 | ≤7/15 |

After Phase 3.5 closes the handoff axis to 0, every skill should land at ≤ 4/15.
