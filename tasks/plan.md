# Implementation Plan: Lean Senior SDLC Enhancement

## Overview

Enhance one-for-all with a project-native version of the Ponytail philosophy:
"senior dev lười nhưng đúng" — build the smallest correct, verified, secure,
accessible, and shippable thing. This should become a cross-cutting SDLC
discipline, not a copied Ponytail skill. The outcome is a leaner workflow that
reduces token use, code bloat, dependency sprawl, and over-planning while
preserving one-for-all's production-grade verification gates.

## Assumptions

- No approved `specs/` document exists for this enhancement; this plan is based
  on the current discussion and the existing token-efficiency work.
- `one-for-all` already has the SDLC spine; the enhancement should tune routing,
  skill behavior, review criteria, and measurement rather than replace them.
- Shared principles belong in `references/`; individual skills should link to
  them to avoid duplication.
- Benchmarking must measure workflow quality, context discipline, and safety, not
  just fewer lines of code.
- The rollout should be incremental: reference first, pilot skills second,
  validators third, benchmark harness last.

## Dependency Graph

```text
Lean SDLC reference
    |
    +-- Skill anatomy guidance
    |       |
    |       +-- Lifecycle map wording
    |       +-- Router updates
    |
    +-- Pilot skill updates
    |       |
    |       +-- Build/test/review/simplify behavior
    |       +-- Slash command wording
    |
    +-- Validator rules
    |       |
    |       +-- Fixture tests
    |
    +-- Benchmark design
            |
            +-- Dogfood tasks
            +-- Reproducible harness
            +-- Results writeup
```

## Architecture Decisions

- Treat Ponytail as an inspiration source, not a dependency. Reuse the ladder,
  safety boundaries, mode concept, and benchmark shape in one-for-all language.
- Name the project-native pattern **Lean Senior SDLC** so it does not inherit
  Ponytail's branding or persona.
- Add one canonical reference such as `references/lean-senior-sdlc.md` with the
  minimality gate and non-negotiable safety boundaries.
- Keep `references/token-efficiency.md` focused on context budgets; cross-link it
  instead of merging everything into one long policy.
- Update high-traffic skills first: `using-one-for-all`,
  `planning-and-task-breakdown`, `incremental-implementation`,
  `test-driven-development`, `code-review-and-quality`, and
  `code-simplification`.
- Extend validation only after the prose pattern is stable, so the lint rules
  enforce real behavior rather than early wording guesses.
- Build a benchmark inspired by Ponytail's agentic harness, but score one-for-all
  on skill-path minimality, context loaded, verification preserved, safety, LOC,
  files changed, cost, time, and turns.

## Task List

### Phase 1: Foundation

- [x] Task 1: Write Lean Senior SDLC reference
- [x] Task 2: Update contributor anatomy
- [x] Task 3: Map lifecycle gates

### Checkpoint: Foundation

- [x] The lean principle has one source of truth under `references/`.
- [x] Existing token-efficiency docs remain short and focused.
- [x] No production skill has duplicated the full reference text.

### Phase 2: Workflow Behavior

- [x] Task 4: Update router behavior
- [x] Task 5: Pilot build path
- [x] Task 6: Pilot review path
- [x] Task 7: Tune command entries

### Checkpoint: Pilot

- [x] Pilot skills pass strict validation.
- [x] Dedup scan reports no copied Lean SDLC blocks.
- [x] Slash commands still preserve explicit verification language.

### Phase 3: Enforcement

- [x] Task 8: Add lean validation checks
- [x] Task 9: Add benchmark specification
- [x] Task 10: Create dogfood scenarios

### Checkpoint: Measurement

- [x] Validator catches obvious over-engineering language without noisy failures.
- [x] Benchmark spec can be reviewed before harness code exists.
- [x] Dogfood scenarios cover tiny, normal, strict, UI, and review workflows.

### Phase 4: Rollout

- [x] Task 11: Roll out pack-wide references
- [x] Task 12: Run full verification
- [x] Task 13: Publish results note

### Checkpoint: Complete

- [x] All validators pass.
- [x] The workflow has a measurable before/after story.
- [x] A new contributor can understand the Lean Senior SDLC from README, the
      reference, and one pilot skill without reading this chat.

## Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Lean guidance becomes another ceremony layer | High | Keep the gate to 4-6 questions and wire it into existing skills instead of adding a new phase. |
| Agents cut verification to save tokens | High | State the safety boundary in the reference and enforce it in review/test skills. |
| Content duplicates across skills | Medium | Put reusable wording in `references/lean-senior-sdlc.md`; skills link to it with local examples only. |
| Benchmark rewards doing less work | High | Include completeness, verification, and safety gates alongside LOC/token metrics. |
| Validator rules become noisy | Medium | Start with warnings and fixture tests; promote only stable checks to strict errors. |
| Ponytail branding leaks into one-for-all | Low | Use one-for-all naming and cite Ponytail only in benchmark/design notes if needed. |

## Open Questions

- Should the public name be `Lean Senior SDLC`, `Lazy-Correct SDLC`, or another
  one-for-all-native phrase?
- Should `lite/full/ultra/off` be reused as visible modes, or should
  one-for-all keep `lite/standard/strict` and treat lean as a gate inside each?
- Should the first benchmark use local simulated dogfood only, or a real
  headless Codex/Claude harness from the start?
- Should lean validation look for banned patterns, required checklist mentions,
  or both?

## Suggested Implementation Order

1. Land Tasks 1-3 first so the principle has a stable home.
2. Pilot Tasks 4-7 on the high-traffic path before touching the full pack.
3. Add validator and benchmark design after the pilot wording is proven.
4. Roll out references pack-wide only after dedup and strict validation stay
   clean.
