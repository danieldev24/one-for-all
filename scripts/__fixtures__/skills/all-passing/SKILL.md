---
name: all-passing
description: Fixture skill that passes every v1.1 validator check. Use when you want to confirm the validator emits a clean PASS for a well-formed skill, including the trigger keyword, populated rationalization table, three verification items, and a Next handoff table.
workflow_mode: standard
max_context_files: 4
default_output: concise
---

# All Passing Fixture

## Overview
A minimal fixture exercising every required v1.1 section so the validator can confirm a clean pass.

## When to Use
- Validator regression test
- Reference for how a fully-conforming skill looks

## Process
1. Read this file
2. Run the validator against the fixtures directory
3. Confirm zero errors

## Common Rationalizations

| Rationalization | Reality |
|---|---|
| "Fixtures are throwaway" | They are tests; they live forever once they catch a regression. |
| "I'll test the validator manually" | Manual testing rots; fixtures are a contract. |
| "One row is enough" | Minimum is three; one row hides table-parsing bugs. |

## Red Flags
- Validator passes a fixture that should fail
- Fixture relies on real skill content

## Verification
- [ ] Validator exits 0 against this fixture
- [ ] No warnings emitted for this fixture
- [ ] All six required sections present
- [ ] Confirm best practice language with `node scripts/validate-skills.js --strict`
- [ ] Make robust checks measurable with `node scripts/test-validator.js`

## Next

After validating, advise the user on the next step:

| If the situation is... | Suggest invoking |
|---|---|
| All fixtures pass and you're ready to extend the validator | `incremental-implementation` skill |
| A fixture failed unexpectedly | `debugging-and-error-recovery` skill |
