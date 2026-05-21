# Changelog

All notable changes to **one-for-all** are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and the project adheres to [Semantic Versioning](https://semver.org/).

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
