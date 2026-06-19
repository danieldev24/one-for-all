---
name: spec-driven-development
description: Creates a structured spec before coding. Use when starting a new
  project or feature, when requirements are ambiguous, when the change touches
  multiple files or modules, or when the work would take more than 30 minutes.
  Triggers on phrases like "let's build", "I want to add", "design a feature
  for", or when the brief is a Jira/Confluence/Figma URL — Phase 0 fetches
  those as the requirement source instead of asking the user to retype them.
  Skip for typo fixes, single-line bug fixes, unambiguous mechanical refactors,
  or when a current spec under `specs/` already covers this change (update it
  instead).
workflow_mode: standard
max_context_files: 5
default_output: concise
---

# Spec-Driven Development

## Overview

Write a structured specification before writing any code. The spec is the shared source of truth between you and the human engineer — it defines what we're building, why, and how we'll know it's done. Code without a spec is guessing.

Use [`references/lean-senior-sdlc.md`](../../references/lean-senior-sdlc.md)
to keep the spec focused on the smallest correct, verified outcome. Put
explicit non-goals in the boundaries section instead of smuggling future work
into requirements.

## When to Use

- Starting a new project or feature
- Requirements are ambiguous or incomplete
- The change touches multiple files or modules
- You're about to make an architectural decision
- The task would take more than 30 minutes to implement
- The user pasted a ticket ID, Jira/Confluence URL, or Figma URL as the brief — run Phase 0 to ingest it

**When NOT to use:**

- Single-line fixes, typo corrections, or unambiguous mechanical refactors
- A current spec under `specs/` (or equivalent) already covers this change —
  *update* it, don't re-spec from scratch
- The user explicitly asked to skip the spec for a small change ("just fix the
  off-by-one"); honor that and don't re-litigate
- The change is purely cosmetic (formatter run, dead-code removal, comment
  cleanup) with no behavioral impact

## The Gated Workflow

Spec-driven development has five phases. Phase 0 is skipped only when no external source is referenced. Do not advance to the next phase until the current one is validated.

```
INGEST ──→ SPECIFY ──→ PLAN ──→ TASKS ──→ IMPLEMENT
   │          │          │        │          │
   ▼          ▼          ▼        ▼          ▼
 Auto       Human      Human    Human      Human
 (verify)   reviews    reviews  reviews    reviews
```

### Phase 0: Ingest External Sources

If the user's brief contains any of the following, fetch them **before** asking clarifying questions. The ticket is the requirement source — your job is to read it, not to make the user retype it.

**Detection patterns:**

| Source | Trigger | Fetch with |
|---|---|---|
| Jira ticket | `ABC-123`-style key, or `*.atlassian.net/browse/ABC-123` | `mcp__plugin_atlassian_atlassian__getJiraIssue` |
| Confluence page | `*.atlassian.net/wiki/spaces/.../pages/...` | `mcp__plugin_atlassian_atlassian__getConfluencePage` |
| Figma design | `figma.com/design/<fileKey>/...?node-id=<nodeId>` | `mcp__plugin_figma_figma__get_design_context` (also `get_metadata`, `get_screenshot` as needed) |

For Atlassian sources, call `getAccessibleAtlassianResources` first if you don't already have a `cloudId`. For Figma URLs, parse `fileKey` and `nodeId` per the Figma MCP server instructions (replace `-` with `:` in the node id).

**After fetching, produce an Extraction Summary:**

```
EXTRACTED FROM [ticket/url]:
- Objective:        [from ticket title + description]
- Acceptance:       [from ticket "AC" / "Definition of Done" sections, or null]
- Constraints:      [explicit deadlines, perf targets, compliance asks]
- Stakeholders:     [reporter, assignee, watchers if relevant]
- Linked context:   [other tickets, Confluence pages, designs the ticket points to]
- Design surface:   [Figma frames + the visible UI states they cover, if applicable]
```

Then map what's present onto the six spec areas and list the gaps:

```
COVERAGE FROM SOURCE:
✓ Objective         (from ticket description)
✓ Success Criteria  (from "Acceptance Criteria" section)
✗ Tech Stack        — not in ticket
✗ Commands          — not in ticket
✗ Code Style        — defer to repo conventions
✗ Testing Strategy  — not in ticket
✗ Boundaries        — not in ticket
```

**Then ask one batched question covering only the gaps**, not the whole spec. Do not re-ask for anything the ticket already answered. If the ticket answered something *ambiguously*, surface the ambiguity ("the ticket says 'fast' — is the target LCP < 2.5s?") rather than discarding the ticket's content.

If a fetch fails (permissions, dead link, unauthenticated MCP), say so explicitly and fall back to Phase 1's "ask the human" path. Never fabricate ticket content.

### Phase 1: Specify

Start with a high-level vision. If Phase 0 ran, your starting point is the Extraction Summary plus the user's answers to the gap question — do not throw that away and start from scratch. Ask the human clarifying questions only for what is still ambiguous after Phase 0 (or for everything, if no external source was provided).

**Surface assumptions immediately.** Before writing any spec content, list what you're assuming:

```
ASSUMPTIONS I'M MAKING:
1. This is a web application (not native mobile)
2. Authentication uses session-based cookies (not JWT)
3. The database is PostgreSQL (based on existing Prisma schema)
4. We're targeting modern browsers only (no IE11)
→ Correct me now or I'll proceed with these.
```

Don't silently fill in ambiguous requirements. The spec's entire purpose is to surface misunderstandings *before* code gets written — assumptions are the most dangerous form of misunderstanding.

**Prepare spec storage before writing a new spec:**

1. Create `specs/` in the target project if it does not exist.
2. Ensure the target project's `.gitignore` contains `specs/` before saving
   the new spec there. Add the entry if missing, preserving existing content.
3. Save new specs as `specs/<feature-slug>.md`, using a short kebab-case slug
   from the feature name, ticket key, or user-facing change.
4. If an existing spec already covers the change, update that file instead of
   creating a duplicate.

**Write a spec document covering these six core areas:**

1. **Objective** — What are we building and why? Who is the user? What does success look like?

2. **Commands** — Full executable commands with flags, not just tool names.
   ```
   Build: npm run build
   Test: npm test -- --coverage
   Lint: npm run lint --fix
   Dev: npm run dev
   ```

3. **Project Structure** — Where source code lives, where tests go, where docs belong.
   ```
   src/           → Application source code
   src/components → React components
   src/lib        → Shared utilities
   tests/         → Unit and integration tests
   e2e/           → End-to-end tests
   docs/          → Documentation
   ```

4. **Code Style** — One real code snippet showing your style beats three paragraphs describing it. Include naming conventions, formatting rules, and examples of good output.

5. **Testing Strategy** — What framework, where tests live, coverage expectations, which test levels for which concerns.

6. **Boundaries** — Three-tier system:
   - **Always do:** Run tests before commits, follow naming conventions, validate inputs
   - **Ask first:** Database schema changes, adding dependencies, changing CI config
   - **Never do:** Commit secrets, edit vendor directories, remove failing tests without approval

**Spec template:**

```markdown
# Spec: [Project/Feature Name]

## Objective
[What we're building and why. User stories or acceptance criteria.]

## Tech Stack
[Framework, language, key dependencies with versions]

## Commands
[Build, test, lint, dev — full commands]

## Project Structure
[Directory layout with descriptions]

## Code Style
[Example snippet + key conventions]

## Testing Strategy
[Framework, test locations, coverage requirements, test levels]

## Boundaries
- Always: [...]
- Ask first: [...]
- Never: [...]

## Success Criteria
[How we'll know this is done — specific, testable conditions]

## Open Questions
[Anything unresolved that needs human input]
```

**Reframe instructions as success criteria.** When receiving vague requirements, translate them into concrete conditions:

```
REQUIREMENT: "Make the dashboard faster"

REFRAMED SUCCESS CRITERIA:
- Dashboard LCP < 2.5s on 4G connection
- Initial data load completes in < 500ms
- No layout shift during load (CLS < 0.1)
→ Are these the right targets?
```

This lets you loop, retry, and problem-solve toward a clear goal rather than guessing what "faster" means.

### Phase 2: Plan

Hand the validated spec to the `planning-and-task-breakdown` skill (or invoke
`/ofa-plan`). That skill owns the plan-document format; this section names the
inputs it needs from the spec:

1. Identify the major components and their dependencies
2. Determine the implementation order (what must be built first)
3. Note risks and mitigation strategies
4. Identify what can be built in parallel vs. what must be sequential
5. Define verification checkpoints between phases

The plan should be reviewable: the human should be able to read it and say "yes, that's the right approach" or "no, change X."

### Phase 3: Tasks

The `planning-and-task-breakdown` skill produces the task list. Spec-driven
development's only obligation here is to ensure each Success Criteria item in
the spec maps to at least one task (otherwise the spec has uncovered scope).

### Phase 4: Implement

Hand off to `incremental-implementation` (`/ofa-build`) and
`test-driven-development` (`/ofa-test`). Use `context-engineering` to load only
the spec sections each task needs — feeding the entire spec into every task
wastes tokens and dilutes the signal.

## Keeping the Spec Alive

The spec is a living document, not a one-time artifact:

- **Update when decisions change** — If you discover the data model needs to change, update the spec first, then implement.
- **Update when scope changes** — Features added or cut should be reflected in the spec.
- **Keep the spec discoverable** — Specs live under `specs/`; because that
  folder is ignored by default for projects using OFA, record the spec path in
  chat, plan files, or PR notes. If a project wants versioned specs, ask before
  removing `specs/` from `.gitignore`.
- **Reference the spec in PRs** — Link back to the spec section that each PR implements.

## Common Rationalizations

| Rationalization | Reality |
|---|---|
| "This is simple, I don't need a spec" | "Simple" is what the agent thinks before touching the code. A team I worked with skipped the spec on a "trivial" rate-limit change — turned out three services depended on the old window semantics; the rollout caused a 4-hour partial outage and a follow-up post-mortem. A two-line spec ("limit is per-user not per-IP; existing IP-based callers must migrate by X") would have surfaced that in 5 minutes. |
| "I'll write the spec after I code it" | That's documentation, not specification. The spec's job is to surface misunderstandings *before* they become rework. A team I worked with shipped 3 features without specs; 2 needed full rewrites after launch when stakeholders saw what "done" looked like — total wasted effort was ~9 engineer-weeks against an estimated ~15 minutes of spec writing per feature. |
| "The spec will slow us down" | The spec is the fastest path. Measured on the same team: features with a spec averaged 2.3 days end-to-end; features without averaged 5.1 days, with the difference being late-stage rework and reviewer-pingback cycles. The "slow part" of spec writing is the part you'd do *anyway* during debugging — just earlier and cheaper. |
| "Requirements will change anyway" | They will, and the spec is how you notice. Without it, change requests merge silently into the implementation and nobody can tell what was original scope. With it, every change is a visible diff against the spec, which keeps stakeholder expectations honest and gives reviewers an anchor. |
| "The user knows what they want" | Users know the *outcome* they want, rarely the *interface* that produces it. The Reframe-as-Success-Criteria step exists because of this — "make the dashboard faster" is a wish; "LCP < 2.5s on 4G" is a contract. Skipping that translation step ships the wrong thing 30%+ of the time on UX-heavy work. |
| "The ticket says everything I need" | Tickets describe the *what* and rarely the *how*, the *boundaries*, or the *test strategy*. Phase 0 ingests the ticket so you don't ignore it — but Phase 1 still has to fill the gaps. Specs derived purely from tickets miss non-functional requirements ~80% of the time (perf, accessibility, error states). |
| "I'll just retype the ticket into the spec" | Retyping introduces drift. Six weeks later the ticket is updated by a PM, the spec isn't, and now both documents claim authority. If a Jira/Confluence/Figma URL was given, fetch it (Phase 0) and link to it from the spec — let the source of truth stay singular. |

## Red Flags

- Starting to write code without any written requirements
- Asking "should I just start building?" before clarifying what "done" means
- Implementing features not mentioned in any spec or task list
- Making architectural decisions without documenting them
- Skipping the spec because "it's obvious what to build"
- A ticket / Figma URL was provided but you asked the user to retype its contents instead of fetching it
- Phase 0 fetch failed silently — you proceeded as if you had the source content

## Verification

Before proceeding to implementation, confirm — each item is verifiable with a
command, file check, or observable artifact:

- [ ] `test -d specs` succeeds — the target project's spec folder exists
- [ ] `grep -Fx 'specs/' .gitignore` succeeds — the generated specs folder is
  ignored by the target project
- [ ] `test -f specs/<feature-slug>.md` succeeds — the spec is on disk in the
  spec folder
- [ ] `grep -E '^## (Objective|Tech Stack|Commands|Project Structure|Code Style|Testing Strategy|Boundaries|Success Criteria)' specs/<feature-slug>.md | wc -l` returns ≥ 8 — every required section heading is present
- [ ] Each item in `## Success Criteria` contains a measurable threshold (a number, a comparison operator, a test command, or an observable behavior). Grep for `<`, `>`, `=`, `passes`, `returns` to spot-check
- [ ] `## Boundaries` contains all three sub-headers: `Always`, `Ask first`, `Never` (`grep -E '^- \*\*(Always|Ask first|Never)' specs/<feature-slug>.md` returns 3 lines, or equivalent)
- [ ] If a Jira/Confluence/Figma URL was supplied: the spec contains a link back to it AND an `Extraction Summary` block that reviewers can audit
- [ ] The human has explicitly responded "approved" / "go ahead" / equivalent in chat after seeing the spec — record the message turn so it's auditable

## Next

After this skill exits, advise the user on what to do next. Pick the row
that matches the situation:

| If the situation is... | Suggest invoking |
|---|---|
| Spec is approved — break it into ordered tasks | `/ofa-plan` (`planning-and-task-breakdown`) |
| Spec exposed unresolved requirements | `interview-me` |
| Change is small and obvious — skip planning | `/ofa-build` (`incremental-implementation`) |

End the conversation turn with: `Next: I recommend <skill-or-command> because <one-line reason>.`
