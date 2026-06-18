---
name: all-failing
description: too short
---

# All Failing Fixture

## Overview
A minimal fixture that fails every v1.1 validator check.

## When to Use
- Validator regression test for failure paths

## Common Rationalizations

| Rationalization | Reality |
|---|---|
| "Only one row" | Should fail; minimum is three. |

## Red Flags
- Validator misses any of the six failures

## Verification
- [ ] Validator emits a failure for description length
- [ ] Ensure quality as needed and make robust improvements
