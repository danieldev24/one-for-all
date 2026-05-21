# Changelog

All notable changes to **one-for-all** are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and the project adheres to [Semantic Versioning](https://semver.org/).

## [1.2.0] — 2026-05-21

Mobile engineering track. Adds two new skills (`mobile-ui-engineering`,
`mobile-simulator-testing`) and one reference (`references/mobile-checklist.md`)
covering React Native/Expo, Flutter, native iOS (Swift/SwiftUI), native
Android (Kotlin/Jetpack Compose), and Kotlin Multiplatform. All five
stacks are first-class. Auto-activation only — no new slash command.

### Added

- `skills/mobile-ui-engineering/SKILL.md` — Build-phase skill covering
  navigation, state ownership, mobile-runtime constraints (process kill,
  unreliable networks, permissions-as-UX), list performance per stack,
  and platform accessibility from screen one.
- `skills/mobile-simulator-testing/SKILL.md` — Verify-phase skill with
  workflows for cold-launch bugs, navigation + deep links, permission
  flows (grant / deny / permanent deny), list and animation perf on
  low-end profiles, and background → foreground lifecycle. Concrete
  targets: 60fps sustained scroll, no frames > 33ms, cold list mount
  < 500ms.
- `references/mobile-checklist.md` — permissions, app lifecycle, offline
  resilience, mobile-specific accessibility (VoiceOver, TalkBack,
  Dynamic Type, Reduce Motion), build/release identifiers, per-platform
  pitfalls. Cited by both new skills to avoid duplication.
- `docs/dogfood-v1.2.md` — simulated transcript against the brief
  *"I want users to scan a QR code from the home screen and have it
  open a profile"*. Five mobile-specific behavioral checks all pass.

### Changed

- `docs/lifecycle-map.md` — `mobile-ui-engineering` added to the
  cross-cutting list and the canonical-spine diagram now shows the
  mobile pair (Build → Verify) mirroring the web pair. Edges-by-skill
  entries added for both new skills.
- `README.md` — skill count 23 → 25; mobile rows added to Build and
  Verify tables; `mobile-checklist.md` row added to references table;
  project-structure tree updated; latest-release blurb refreshed.
- `CLAUDE.md` — Build phase list adds `mobile-ui-engineering`; Verify
  phase list adds `mobile-simulator-testing`; references list mentions
  mobile.
- `docs/getting-started.md` — references table gains
  `mobile-checklist.md`.
- `.claude-plugin/plugin.json` — version 1.1.0 → 1.2.0.

### Verification gates (all green at release)

- `node scripts/validate-skills.js --strict` — **25 skills checked,
  0 errors, 0 warnings, PASSED**.
- `node scripts/scan-duplication.js` — 0 blocks ≥ 5 eligible lines.
- `node scripts/check-lifecycle-chain.js` — 0 errors (2 expected
  pre-existing orphan warnings on `doubt-driven-development` and
  `frontend-ui-engineering`, unchanged from v1.1).

### Migration notes

No breaking changes. Existing skill names, slash commands, and
plugin surface are unchanged. The two new skills auto-activate only
on mobile signals (`react-native` / `expo` in `package.json`,
`pubspec.yaml` with `flutter`, `*.xcodeproj` / `Package.swift`,
`build.gradle` with the android plugin, or kotlin sources under
`shared/commonMain`) — no existing project's behavior changes.

### Known follow-ups for v1.3

- **Hybrid-repo dogfood.** v1.2's sandbox was mobile-only; the
  question of whether `frontend-ui-engineering` and
  `mobile-ui-engineering` should both fire on a Next.js + RN
  monorepo is unresolved. v1.3 should add a hybrid sandbox.
- **Stress-test the navigation recommendation table** with a brief
  where Expo Router or `go_router` is the *wrong* choice (e.g., a
  chat app that needs imperative push/pop), to harden Check 2 of
  the dogfood gate.
- **App-store shipping.** A `mobile-app-store-shipping` skill (or
  appendix in `shipping-and-launch`) was scoped out of v1.2 and is
  the natural next addition.
- **Validator hardening.** `getSectionBody` in
  `scripts/validate-skills.js` uses `indexOf` for section lookup,
  which substring-matches longer sections. Encountered during v1.2
  authoring (a `## Verification Workflows` heading shadowed
  `## Verification`). Worked around by renaming; the validator
  itself should anchor on heading boundaries.

## [1.1.0] — 2026-05-21

Quality pass across the 23 skills. No breaking changes — every skill
keeps its name, surface, and intent. The pass tightens triggers,
deduplicates overlap, replaces hand-waved rationalizations with costed
failure stories, and adds a lifecycle handoff section so agents
recommend the next step explicitly.

### Added

- `## Next` section on every skill — markdown table of canonical and
  branch handoffs plus the standard footer line `Next: I recommend
  <skill-or-command> because <reason>`.
- `docs/lifecycle-map.md` — single source of truth for which skill
  follows which. Edit this first when adding edges.
- `references/input-validation.md` — canonical boundary-validation
  patterns shared by `security-and-hardening` and
  `api-and-interface-design`.
- `references/five-axis-review.md` — canonical multi-axis review
  checklist used by `code-review-and-quality`.
- `scripts/validate-skills.js --strict` — six structural checks
  (frontmatter, sections including `## Next`, verification items,
  rationalization rows, line count).
- `scripts/scan-duplication.js` — fails on any block of ≥ 5
  consecutive eligible lines duplicated across SKILL.md files.
- `scripts/check-lifecycle-chain.js` — every `## Next` reference must
  resolve to a real skill directory or `.claude/commands/` file.
- `docs/dogfood-v1.1.md` — Phase 4 dogfood transcript with the five
  behavioral checks evaluated.

### Changed

- 8 audit-targeted skills tightened: `spec-driven-development`,
  `planning-and-task-breakdown`, `incremental-implementation`,
  `test-driven-development`, `code-review-and-quality`,
  `security-and-hardening`, `api-and-interface-design`,
  `context-engineering`.
- Skill descriptions now lead with skip cases as well as triggers, so
  agents stop firing on edits that don't warrant the workflow.
- `## Verification` blocks across the 8 audit skills replaced
  subjective bullets ("looks right") with executable checks
  (`grep`, `wc -l`, `git diff`, `npm audit`, `curl -sI`).
- `## Common Rationalizations` rows replaced with concrete failure
  stories or quantified costs (revert rates, hours of rework, OWASP
  data, hallucinated-import drop rate).
- `docs/skill-anatomy.md` documents the v1.1 quality bar.
- Slash commands prefixed with `ofa-` (`/ofa-spec`, `/ofa-plan`,
  `/ofa-build`, `/ofa-test`, `/ofa-review`, `/ofa-code-simplify`,
  `/ofa-ship`) to avoid collisions with other plugins. Pre-existing
  `/spec` etc. references in `README.md`, `CLAUDE.md`, and
  `docs/getting-started.md` were updated.
- `spec-driven-development` Phase 0 ingests Jira / Confluence / Figma
  URLs as the requirement source instead of asking the user to
  retype them.

### Verification gates (all green at release)

- `node scripts/validate-skills.js --strict` — PASSED across all 23.
- `node scripts/scan-duplication.js` — 0 blocks ≥ 5 eligible lines.
- `node scripts/check-lifecycle-chain.js` — 0 errors (2 expected
  orphan warnings on cross-cutting skills).

### Migration notes

If you previously typed `/spec`, `/plan`, etc., the commands are now
`/ofa-spec`, `/ofa-plan`, etc. Skill names are unchanged, so any
direct skill load (`Skill: spec-driven-development`) keeps working.

## [1.0.0] — Initial release

22 lifecycle skills plus the `using-one-for-all` meta-skill, 7 slash
commands (originally `/spec`, `/plan`, …; renamed in v1.1.0), 3 agent
personas, and 4 reference checklists.
