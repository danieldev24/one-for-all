---
name: spec-driven-development
description: Creates specs before coding. Use when starting a new project, feature, or significant change and no specification exists yet. Use when requirements are unclear, ambiguous, or only exist as a vague idea. Also use when the user references a ticket (Jira ID like ABC-123, Jira/Confluence URL) or a Figma design URL — Phase 0 will fetch those as the requirement source instead of asking the user to retype them.
---

# Spec-Driven Development

## Overview

Write a structured specification before writing any code. The spec is the shared source of truth between you and the human engineer — it defines what we're building, why, and how we'll know it's done. Code without a spec is guessing.

## When to Use

- Starting a new project or feature
- Requirements are ambiguous or incomplete
- The change touches multiple files or modules
- You're about to make an architectural decision
- The task would take more than 30 minutes to implement
- The user pasted a ticket ID, Jira/Confluence URL, or Figma URL as the brief — run Phase 0 to ingest it

**When NOT to use:** Single-line fixes, typo corrections, or changes where requirements are unambiguous and self-contained.

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

With the validated spec, generate a technical implementation plan:

1. Identify the major components and their dependencies
2. Determine the implementation order (what must be built first)
3. Note risks and mitigation strategies
4. Identify what can be built in parallel vs. what must be sequential
5. Define verification checkpoints between phases

The plan should be reviewable: the human should be able to read it and say "yes, that's the right approach" or "no, change X."

### Phase 3: Tasks

Break the plan into discrete, implementable tasks:

- Each task should be completable in a single focused session
- Each task has explicit acceptance criteria
- Each task includes a verification step (test, build, manual check)
- Tasks are ordered by dependency, not by perceived importance
- No task should require changing more than ~5 files

**Task template:**
```markdown
- [ ] Task: [Description]
  - Acceptance: [What must be true when done]
  - Verify: [How to confirm — test command, build, manual check]
  - Files: [Which files will be touched]
```

### Phase 4: Implement

Execute tasks one at a time following `skills/incremental-implementation/SKILL.md` (`incremental-implementation`) and `skills/test-driven-development/SKILL.md` (`test-driven-development`). Use `skills/context-engineering/SKILL.md` (`context-engineering`) to load the right spec sections and source files at each step rather than flooding the agent with the entire spec.

## Keeping the Spec Alive

The spec is a living document, not a one-time artifact:

- **Update when decisions change** — If you discover the data model needs to change, update the spec first, then implement.
- **Update when scope changes** — Features added or cut should be reflected in the spec.
- **Commit the spec** — The spec belongs in version control alongside the code.
- **Reference the spec in PRs** — Link back to the spec section that each PR implements.

## Common Rationalizations

| Rationalization | Reality |
|---|---|
| "This is simple, I don't need a spec" | Simple tasks don't need *long* specs, but they still need acceptance criteria. A two-line spec is fine. |
| "I'll write the spec after I code it" | That's documentation, not specification. The spec's value is in forcing clarity *before* code. |
| "The spec will slow us down" | A 15-minute spec prevents hours of rework. Waterfall in 15 minutes beats debugging in 15 hours. |
| "Requirements will change anyway" | That's why the spec is a living document. An outdated spec is still better than no spec. |
| "The user knows what they want" | Even clear requests have implicit assumptions. The spec surfaces those assumptions. |
| "The ticket says everything I need" | Tickets describe the *what* and rarely the *how*, the *boundaries*, or the *test strategy*. Phase 0 ingests the ticket; Phase 1 still has to fill the gaps. |
| "I'll just retype the ticket into the spec" | If a Jira/Confluence/Figma URL was given, fetch it. Retyping introduces drift between the spec and the source of truth. |

## Red Flags

- Starting to write code without any written requirements
- Asking "should I just start building?" before clarifying what "done" means
- Implementing features not mentioned in any spec or task list
- Making architectural decisions without documenting them
- Skipping the spec because "it's obvious what to build"
- A ticket / Figma URL was provided but you asked the user to retype its contents instead of fetching it
- Phase 0 fetch failed silently — you proceeded as if you had the source content

## Verification

Before proceeding to implementation, confirm:

- [ ] The spec covers all six core areas
- [ ] The human has reviewed and approved the spec
- [ ] Success criteria are specific and testable
- [ ] Boundaries (Always/Ask First/Never) are defined
- [ ] The spec is saved to a file in the repository
- [ ] If a ticket / Figma URL was provided, the spec links back to it and the Extraction Summary is preserved (in the spec or its Open Questions section) so reviewers can audit what came from the source vs. what was added later

