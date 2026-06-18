# Implementation Plan: Token-Efficient one-for-all Enhancement

## Overview

Improve one-for-all so agents spend fewer tokens while still following disciplined workflows. The enhancement adds explicit workflow modes, a skill-selection router, progressive-disclosure rules, token-aware metadata, semantic linting for vague guidance, and a phased rollout path across the skill pack.

## Assumptions

- The source of truth is the current enhancement conversation, because no `SPEC.md` exists for this scope.
- The first implementation should be conservative: prove the pattern on high-traffic entry points before changing every skill.
- Token savings should come from smaller context loads and shorter outputs, not from removing verification or safety gates.
- Existing validation commands remain the baseline: `node scripts/validate-skills.js --strict`, `node scripts/validate-commands.js`, `node scripts/scan-duplication.js`, and `node scripts/check-lifecycle-chain.js`.

## Dependency Graph

```text
Token policy vocabulary
    |
    +-- Skill selection guide
    |       |
    |       +-- using-one-for-all routing update
    |       +-- README quickstart update
    |
    +-- Skill anatomy metadata schema
            |
            +-- Validator semantic checks
            |       |
            |       +-- Validator fixture tests
            |
            +-- Pilot skill updates
                    |
                    +-- Slash command updates
                    |
                    +-- Full skill rollout
                            |
                            +-- Dedup and lifecycle validation
```

## Architecture Decisions

- Use `lite`, `standard`, and `strict` as workflow modes so small tasks avoid full process overhead while risky tasks keep strong gates.
- Put reusable token policy in `references/` and keep `SKILL.md` files focused on what agents must do immediately.
- Treat `using-one-for-all` as the router entry point because it already controls skill discovery.
- Add semantic linting to the existing validator first, rather than introducing a separate script, so contributors keep one primary quality gate.
- Roll out metadata and concise-process changes in two passes: pilot on core skills, then apply pack-wide after validation proves stable.

## Task List

### Phase 1: Foundation

- [x] Task 1: Define token policy reference
- [x] Task 2: Add skill selection guide
- [x] Task 3: Extend skill anatomy schema

### Checkpoint: Foundation

- [x] Human confirms the policy vocabulary is clear enough for contributors.
- [x] New docs explain when to use `lite`, `standard`, and `strict`.
- [x] No skill behavior has changed yet except documentation and routing guidance.

### Phase 2: Core Behavior

- [x] Task 4: Update meta-skill routing
- [x] Task 5: Pilot token-aware skill edits
- [x] Task 6: Add semantic validation
- [x] Task 7: Update slash command defaults

### Checkpoint: Core Behavior

- [x] Validator passes with pilot skills.
- [x] Token-saving behavior is visible in the highest-traffic entry points.
- [x] Commands still preserve verification gates.

### Phase 3: Rollout

- [x] Task 8: Roll out metadata pack-wide
- [x] Task 9: Extract reusable repeated guidance
- [x] Task 10: Final validation and dogfood review

### Checkpoint: Complete

- [x] All validation scripts pass.
- [x] Documentation points contributors to the new token-efficient workflow.
- [x] A reviewer can follow `tasks/todo.md` without needing the original chat context.

## Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| `lite` mode weakens quality gates | High | Define non-negotiable verification for every mode; only reduce context and output size. |
| Metadata churn touches too many files | Medium | Pilot first; roll out in a separate phase after schema is stable. |
| Semantic lint creates noisy failures | Medium | Start with warnings or scoped strict checks; add fixture tests before enforcing broadly. |
| Skill text becomes too terse to guide agents | Medium | Keep one worked example per skill and move only reusable details to references. |
| Routing guide duplicates README content | Low | README links to the guide; the guide holds decision logic. |

## Open Questions

- Should `lite` be the default for all slash commands, or only for small/obvious tasks?
- Should token metadata be required in strict validation immediately, or introduced as warnings first?
- Should the first rollout touch all skills, or only the command-backed lifecycle skills first?

## Suggested Implementation Order

1. Complete Phase 1 so the vocabulary and contributor contract are explicit.
2. Complete Tasks 4-7 as a pilot on the router, two core skills, commands, and validator.
3. Pause for review before pack-wide rollout.
4. Complete Tasks 8-10 after the pilot proves the rules are not noisy.
