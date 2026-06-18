---
name: api-and-interface-design
description: Designs stable, hard-to-misuse APIs and module interfaces —
  contract first, validation at the boundary, additive evolution, consistent
  error semantics. Use when designing new REST or GraphQL endpoints,
  defining type contracts between modules or teams, creating component
  prop interfaces, or changing any *public* interface. Triggers on phrases
  like "design this API", "what should the contract look like", "let's
  define the interface", or any change that adds/modifies an endpoint or
  exported type. Skip for purely internal helpers with one caller, code
  refactors that don't alter the public surface, and changes confined to
  a single module's private functions — interface-design discipline is for
  *contracts*, not for every function call.
workflow_mode: strict
max_context_files: 8
default_output: evidence-heavy
---

# API and Interface Design

## Overview

Design stable, well-documented interfaces that are hard to misuse. Good interfaces make the right thing easy and the wrong thing hard. This applies to REST APIs, GraphQL schemas, module boundaries, component props, and any surface where one piece of code talks to another.

## When to Use

- Designing new API endpoints (REST, GraphQL, RPC)
- Defining module boundaries or contracts between teams
- Creating component prop interfaces
- Establishing database schema that informs API shape
- Changing existing public interfaces (extend, deprecate, version)

**When NOT to use:**

- Purely internal helpers with a single caller — design discipline
  applies to *contracts*, not every function
- Refactors that don't alter the public surface (signatures, response
  shapes, status codes, exported types all unchanged)
- Bug fixes that restore the documented behavior of an existing
  contract — the contract didn't change, the implementation did

## Core Principles

### Hyrum's Law

> With a sufficient number of users of an API, all observable behaviors of your system will be depended on by somebody, regardless of what you promise in the contract.

This means: every public behavior — including undocumented quirks, error message text, timing, and ordering — becomes a de facto contract once users depend on it. Design implications:

- **Be intentional about what you expose.** Every observable behavior is a potential commitment.
- **Don't leak implementation details.** If users can observe it, they will depend on it.
- **Plan for deprecation at design time.** See `deprecation-and-migration` for how to safely remove things users depend on.
- **Tests are not enough.** Even with perfect contract tests, Hyrum's Law means "safe" changes can break real users who depend on undocumented behavior.

### The One-Version Rule

Avoid forcing consumers to choose between multiple versions of the same dependency or API. Diamond dependency problems arise when different consumers need different versions of the same thing. Design for a world where only one version exists at a time — extend rather than fork.

### 1. Contract First

Define the interface before implementing it. The contract is the spec — implementation follows.

```typescript
// Define the contract first
interface TaskAPI {
  // Creates a task and returns the created task with server-generated fields
  createTask(input: CreateTaskInput): Promise<Task>;

  // Returns paginated tasks matching filters
  listTasks(params: ListTasksParams): Promise<PaginatedResult<Task>>;

  // Returns a single task or throws NotFoundError
  getTask(id: string): Promise<Task>;

  // Partial update — only provided fields change
  updateTask(id: string, input: UpdateTaskInput): Promise<Task>;

  // Idempotent delete — succeeds even if already deleted
  deleteTask(id: string): Promise<void>;
}
```

### 2. Consistent Error Semantics

Pick one error strategy and use it everywhere:

```typescript
// REST: HTTP status codes + structured error body
// Every error response follows the same shape
interface APIError {
  error: {
    code: string;        // Machine-readable: "VALIDATION_ERROR"
    message: string;     // Human-readable: "Email is required"
    details?: unknown;   // Additional context when helpful
  };
}

// Status code mapping
// 400 → Client sent invalid data
// 401 → Not authenticated
// 403 → Authenticated but not authorized
// 404 → Resource not found
// 409 → Conflict (duplicate, version mismatch)
// 422 → Validation failed (semantically invalid)
// 500 → Server error (never expose internal details)
```

**Don't mix patterns.** If some endpoints throw, others return null, and others return `{ error }` — the consumer can't predict behavior.

### 3. Validate at Boundaries

Trust internal code; validate where external input enters. The canonical
patterns (where the boundary is, what the schema looks like, what error
shape to return, file-upload specifics, third-party-data treatment) live
in [`references/input-validation.md`](../../references/input-validation.md)
so this skill and `security-and-hardening` share one source of truth.

The interface-design framing: **the schema is the contract.** A typed
input schema at the boundary doesn't just stop bad data — it documents
exactly what the endpoint accepts, in a form the consumer can read,
generate clients from, and test against. Skipping the schema means the
contract becomes "whatever the implementation happens to accept today,"
which is exactly the Hyrum's Law trap.

**Worked example for the contract context** — the schema *is* the
endpoint's documentation:

```typescript
// This schema simultaneously: (1) validates input, (2) generates the
// TypeScript type for downstream code, and (3) is the OpenAPI/JSON
// Schema contract a consumer team can integrate against.
const CreateTaskSchema = z.object({
  title:       z.string().min(1).max(200).trim(),
  description: z.string().max(2000).optional(),
  priority:    z.enum(['low', 'medium', 'high']).default('medium'),
  dueDate:     z.string().datetime().optional(),
});
type CreateTaskInput = z.infer<typeof CreateTaskSchema>;
```

### 4. Prefer Addition Over Modification

Extend interfaces without breaking existing consumers:

```typescript
// Good: Add optional fields
interface CreateTaskInput {
  title: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high';  // Added later, optional
  labels?: string[];                       // Added later, optional
}

// Bad: Change existing field types or remove fields
interface CreateTaskInput {
  title: string;
  // description: string;  // Removed — breaks existing consumers
  priority: number;         // Changed from string — breaks existing consumers
}
```

### 5. Predictable Naming

| Pattern | Convention | Example |
|---------|-----------|---------|
| REST endpoints | Plural nouns, no verbs | `GET /api/tasks`, `POST /api/tasks` |
| Query params | camelCase | `?sortBy=createdAt&pageSize=20` |
| Response fields | camelCase | `{ createdAt, updatedAt, taskId }` |
| Boolean fields | is/has/can prefix | `isComplete`, `hasAttachments` |
| Enum values | UPPER_SNAKE | `"IN_PROGRESS"`, `"COMPLETED"` |

## REST API Patterns

### Resource Design

```
GET    /api/tasks              → List tasks (with query params for filtering)
POST   /api/tasks              → Create a task
GET    /api/tasks/:id          → Get a single task
PATCH  /api/tasks/:id          → Update a task (partial)
DELETE /api/tasks/:id          → Delete a task

GET    /api/tasks/:id/comments → List comments for a task (sub-resource)
POST   /api/tasks/:id/comments → Add a comment to a task
```

### Pagination

Paginate list endpoints:

```typescript
// Request
GET /api/tasks?page=1&pageSize=20&sortBy=createdAt&sortOrder=desc

// Response
{
  "data": [...],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "totalItems": 142,
    "totalPages": 8
  }
}
```

### Filtering

Use query parameters for filters:

```
GET /api/tasks?status=in_progress&assignee=user123&createdAfter=2025-01-01
```

### Partial Updates (PATCH)

Accept partial objects — only update what's provided:

```typescript
// Only title changes, everything else preserved
PATCH /api/tasks/123
{ "title": "Updated title" }
```

## TypeScript Interface Patterns

### Use Discriminated Unions for Variants

```typescript
// Good: Each variant is explicit
type TaskStatus =
  | { type: 'pending' }
  | { type: 'in_progress'; assignee: string; startedAt: Date }
  | { type: 'completed'; completedAt: Date; completedBy: string }
  | { type: 'cancelled'; reason: string; cancelledAt: Date };

// Consumer gets type narrowing
function getStatusLabel(status: TaskStatus): string {
  switch (status.type) {
    case 'pending': return 'Pending';
    case 'in_progress': return `In progress (${status.assignee})`;
    case 'completed': return `Done on ${status.completedAt}`;
    case 'cancelled': return `Cancelled: ${status.reason}`;
  }
}
```

### Input/Output Separation

```typescript
// Input: what the caller provides
interface CreateTaskInput {
  title: string;
  description?: string;
}

// Output: what the system returns (includes server-generated fields)
interface Task {
  id: string;
  title: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}
```

### Use Branded Types for IDs

```typescript
type TaskId = string & { readonly __brand: 'TaskId' };
type UserId = string & { readonly __brand: 'UserId' };

// Prevents accidentally passing a UserId where a TaskId is expected
function getTask(id: TaskId): Promise<Task> { ... }
```

## Common Rationalizations

| Rationalization | Reality |
|---|---|
| "We'll document the API later" | "Later" arrives after consumers have already integrated against the implementation; at that point the docs you write are *describing* what's there, not *constraining* it. The result is docs that drift on the first non-obvious change. The types ARE the documentation — generate them from the schema and they can't drift. |
| "We don't need pagination for now" | A list endpoint without pagination is a future incident waiting for the day someone has 200 rows. A team I worked with shipped `/api/orders` unpaginated; six months later one customer hit ~12k orders, the dashboard request started timing out, and the fix required a coordinated client+server change with versioning headaches. Adding `?page` and `?pageSize` on day one would have cost ~10 minutes. |
| "PATCH is complicated, let's just use PUT" | PUT forces clients to fetch-then-modify-then-send the full object; that's a race condition every time two clients are open. PATCH with a partial body is what clients actually want, and the "complexity" is one extra null-vs-undefined rule. The cost of choosing PUT shows up as "why do my changes get clobbered" tickets in three months. |
| "We'll version the API when we need to" | Breaking changes without a versioning story break consumers silently — the partner team's CI starts failing on a Tuesday and they can't figure out why. Design for additive evolution from day one (optional fields, new endpoints over modified ones); reach for `/v2` only when additive evolution is genuinely impossible, and even then with a deprecation window for `/v1`. |
| "Nobody uses that undocumented behavior" | Hyrum's Law in action: a team I worked with normalized email addresses to lowercase as an undocumented side-effect of their auth code. Two years later they fixed a separate bug that disabled the lowercasing — three downstream consumers had hardcoded the lowercase assumption and shipped broken login flows. The "undocumented" behavior was a load-bearing contract; nobody knew until it broke. |
| "We can just maintain two versions" | Multiple live versions multiply maintenance cost and create diamond-dependency problems (lib X needs API v1, lib Y needs API v2, app pulls in both). The One-Version Rule says: extend the one version with optional fields, never fork. Once you have two versions, you have three: v1, v2, and the bug-fix divergence between them. |
| "Internal APIs don't need contracts" | Internal consumers are still consumers, and the cost of a missing contract shows up as cross-team coupling: every change requires a four-team meeting because nobody knows what's safe. A typed contract is what enables parallel work. The "internal vs. external" distinction is a permission boundary, not a rigor boundary. |

## Red Flags

- Endpoints that return different shapes depending on conditions
- Inconsistent error formats across endpoints
- Validation scattered throughout internal code instead of at boundaries
- Breaking changes to existing fields (type changes, removals)
- List endpoints without pagination
- Verbs in REST URLs (`/api/createTask`, `/api/getUsers`)
- Third-party API responses used without validation or sanitization

## Verification

After designing an API — each item is verifiable with a command, file
inspection, or static-analysis tool:

- [ ] Every new endpoint has a typed input schema *and* a typed output
      type. For Zod-style projects: `grep -E "z\.object\(|z\.discriminatedUnion\("
      <changed-route-files>` returns ≥ 1 match per new endpoint
- [ ] If using OpenAPI: `npx @redocly/cli lint openapi.yaml` (or
      `spectral lint`) returns exit 0 — the spec validates clean
- [ ] If using TypeScript: `npx tsc --noEmit` returns exit 0 — types
      compile against the new contract without `any` escape hatches
- [ ] Error responses across new endpoints share a single shape. Spot
      check: `grep -A 2 "res\.status\([45]" <changed-route-files>` —
      every error block returns the same `{ error: { code, message } }`
      structure
- [ ] List endpoints accept pagination params: `grep -E "page|pageSize|cursor|limit"
      <new-list-endpoint-files>` returns matches
- [ ] No pre-existing fields had their type or required-ness changed
      (additive-only). Diff the IDL/schema file: `git diff <base-sha> --
      <schema-file>` should show only adds (`+ field?: ...`), not
      modifications to existing lines
- [ ] Naming consistent: REST URLs are plural nouns with no verbs
      (`grep -E "(create|get|update|delete)[A-Z]" <route-files>` returns
      no matches for path strings); query/response fields are camelCase
- [ ] Schema and route file are committed together — no "API change
      lands now, types follow next sprint"

## Next

After this skill exits, advise the user on what to do next. Pick the row
that matches the situation:

| If the situation is... | Suggest invoking |
|---|---|
| Contract is defined and ready to implement against | `/ofa-build` (`incremental-implementation`) |
| Contract handles user input or auth — needs validation/authz patterns | `security-and-hardening` |
| Contract changes break an existing public surface | `deprecation-and-migration` |

End the conversation turn with: `Next: I recommend <skill-or-command> because <one-line reason>.`
