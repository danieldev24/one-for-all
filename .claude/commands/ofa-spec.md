---
description: Start spec-driven development — write a structured specification before writing code
---

Invoke the one-for-all:spec-driven-development skill.

Begin by understanding what the user wants to build. Ask clarifying questions about:
1. The objective and target users
2. Core features and acceptance criteria
3. Tech stack preferences and constraints
4. Known boundaries (what to always do, ask first about, and never do)

Before writing a new spec, create `specs/` if needed and ensure the target project's `.gitignore` contains `specs/`. Preserve existing `.gitignore` content.

Then generate a structured spec covering all six core areas: objective, commands, project structure, code style, testing strategy, and boundaries.

Save the spec as `specs/<feature-slug>.md` using a short kebab-case slug from the feature, ticket, or change name. Confirm the spec path with the user before proceeding.
