# Lean Senior SDLC

Lean Senior SDLC is the one-for-all discipline of building the smallest thing
that is correct, verified, secure, accessible, and shippable. It reduces code,
context, dependencies, and ceremony by asking whether existing capability covers
the need before creating new work, while treating validation and safety evidence
as non-negotiable.

Use this reference with [`token-efficiency.md`](token-efficiency.md): token
efficiency controls how much context to load; Lean Senior SDLC controls how much
work to create.

## Minimality Gate

Before expanding scope, loading extra skills, or writing new code, ask:

1. **Can we skip this?** If the request is speculative, defer it or name the
   smaller version that satisfies the current goal.
2. **Can existing code do it?** Reuse project utilities, patterns, validators,
   and established workflow before adding a new abstraction.
3. **Can the platform do it?** Prefer stdlib, native browser/mobile/platform
   features, database constraints, and built-in framework behavior over custom
   code.
4. **Can an installed dependency do it?** Use what the project already owns
   before adding a new package.
5. **What is the smallest verified slice?** Ship one complete path with the
   smallest meaningful check, then expand only when evidence or the user asks.
6. **What must not be cut?** Keep validation, data-loss handling, security,
   accessibility, explicit requirements, and rollback or recovery paths.

Stop at the first answer that safely satisfies the task. Do not run the ladder
as a ceremony after the answer is already clear.

## Phase Gates

| Phase | Lean question |
|---|---|
| Define | What is the smallest user problem worth solving now? |
| Plan | What is the smallest vertical slice with clear acceptance criteria? |
| Build | What can existing code, stdlib, native behavior, or installed packages cover? |
| Verify | What is the smallest check that would fail if this is wrong? |
| Review | What can be deleted, inlined, or deferred without losing correctness? |
| Ship | What is the simplest release path with clear rollback evidence? |

## Safety Boundary

Lean is not careless. Never simplify away:

- Input validation at trust boundaries
- Data-loss prevention, rollback, and recovery behavior
- Security controls, authz/authn checks, secret handling, and privacy guards
- Accessibility basics for user-facing UI
- Explicit user requirements
- Tests or checks for non-trivial behavior
- Calibration or environment knobs needed by real hardware or production systems

If the lean version would remove one of these, it is not lean. It is incomplete.

## Intentional Simplifications

Use a `lean:` comment only when a deliberate shortcut has a known ceiling and a
clear upgrade path. Do not label ordinary simple code.

```python
# lean: global lock is enough for this CLI; use per-project locks if parallel
# writes become a measured bottleneck.
```

Good `lean:` comments name:

- The chosen simplification
- The condition where it stops being enough
- The next upgrade path

Bad `lean:` comments excuse missing safety:

```python
# lean: skip path traversal checks for now
```

## Review Signals

During review, look for:

- New dependencies where stdlib, native behavior, or existing code would work
- Abstractions with one implementation or no current caller
- Config, factories, adapters, or frameworks added for hypothetical futures
- Horizontal task slices that delay a working, verifiable path
- Verification skipped in the name of speed
- Long explanations defending a smaller implementation instead of clear evidence

The goal is not fewer lines at any cost. The goal is less owned surface area for
the same verified behavior.
