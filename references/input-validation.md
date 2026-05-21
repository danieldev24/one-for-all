# Input Validation at System Boundaries

The canonical reference for "where to validate, what to validate, and how
to fail" when external data crosses into your system. Linked from
`security-and-hardening` (the security framing — input is hostile until
proven otherwise) and `api-and-interface-design` (the interface framing —
the contract is enforced at the edge).

Each skill keeps its own *worked example* inline so it stands alone; this
file holds the reusable patterns and decision rules.

## Core rule

Validate where untrusted data enters your system. Trust the types after
that boundary; don't re-validate the same data three function calls deep.

```
                ┌── boundary ──┐
external data ──→│   VALIDATE   │──→ trusted, typed values
                 │   (here)     │      flow internally
                └─────────────┘
```

The boundary is the *narrowest* layer the data must pass through to reach
your business logic. For a web app that's typically the route handler;
for a worker it's the message decoder; for a CLI it's the argument
parser; for a library it's the public function signature.

## Where validation BELONGS

- API route handlers (HTTP request bodies, query params, path params,
  headers used in logic)
- Form submission handlers (browser-side and server-side both — the
  browser-side one is UX, the server-side one is the security boundary)
- External-service response parsers — third-party APIs are
  **untrusted**, even if reputable. Validate shape and content before
  using their output in logic, rendering, or persistence.
- Webhook payload handlers (signed and unsigned both — signature checks
  authenticity, schema check enforces shape)
- Environment-variable loading at startup (fail fast on missing or
  malformed values rather than crashing on first use)
- File uploads (mime type, size, magic-byte sniff if the type matters
  for security)
- Anything coming from a queue, message bus, or persistent log

## Where validation does NOT belong

- Between internal functions that share a type contract — the boundary
  has already validated; re-validating wastes cycles and creates two
  sources of truth that drift
- Utility functions called by already-validated code paths
- Data that came from your own database in a row your own code wrote —
  the schema is the contract
- "Just in case" defensive checks deep in business logic — if you can't
  trust your own internals, the architecture is the bug

## Schema validation pattern (TypeScript / Zod)

```typescript
import { z } from 'zod';

const CreateTaskSchema = z.object({
  title: z.string().min(1).max(200).trim(),
  description: z.string().max(2000).optional(),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  dueDate: z.string().datetime().optional(),
});

app.post('/api/tasks', async (req, res) => {
  const result = CreateTaskSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(422).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid input',
        details: result.error.flatten(),
      },
    });
  }
  // result.data is now typed and validated; downstream code trusts it
  const task = await taskService.create(result.data);
  return res.status(201).json(task);
});
```

The same pattern applies in any language with a schema library — Pydantic
in Python, JSON Schema + Ajv in JS without TS, struct tags + a validator
in Go.

## Failure mode: structured errors

A validation failure should produce a machine-readable error, not a
generic 400 with a stack trace.

```jsonc
// 422 Unprocessable Entity
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "details": {
      "fieldErrors": {
        "title":    ["String must contain at least 1 character"],
        "priority": ["Invalid enum value. Expected 'low' | 'medium' | 'high'"]
      }
    }
  }
}
```

Status code map:

| Status | When |
|---|---|
| 400 | Cannot parse the request at all (malformed JSON, missing body) |
| 401 | Not authenticated |
| 403 | Authenticated but not authorized for this resource |
| 404 | Resource not found |
| 409 | Conflict (duplicate, version mismatch, optimistic-lock failure) |
| 422 | Parsed fine but semantically invalid (failed validation rules) |
| 500 | Server error — never expose internal details to the caller |

## File-upload validation

Uploads need extra care because the *content* is the threat surface.

```typescript
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

function validateUpload(file: UploadedFile) {
  if (!ALLOWED_TYPES.includes(file.mimetype)) {
    throw new ValidationError('File type not allowed');
  }
  if (file.size > MAX_SIZE) {
    throw new ValidationError('File too large (max 5 MB)');
  }
  // For security-relevant uploads, also verify magic bytes —
  // mimetype is sender-controlled and can lie.
}
```

If the upload could be executed, indexed, or rendered later (avatars,
PDFs, archives), assume the file is hostile and apply the same logic to
*content* as to *type*: scan, sandbox, or reject.

## Output encoding is not validation

Validation enforces *what came in*; output encoding enforces *what goes
out*. Both are required:

- Validation rejects `<script>` if the field is supposed to be a name.
- Output encoding ensures a *legitimate* string containing `<` is shown
  as `&lt;`, not interpreted as HTML.

Treating them as the same control is a common cause of XSS that survives
"we validate everything."

## Third-party data — the silent boundary

Internal teams often forget that responses from a partner API are
external input. The same validation rules apply: shape-check the
response, treat fields as optional unless your contract explicitly says
otherwise, and fail closed rather than fail open if the response shape
shifts. A compromised or misconfigured upstream is one of the more common
incident vectors and is invisible if you skip this step.

## Quick checklist

- [ ] Every external entry point has a schema (route, form, webhook,
      message handler, env loader)
- [ ] The schema is enforced *at the boundary*, not deeper
- [ ] Validation errors return a structured 422 (or 400/409 where
      appropriate), never a stack trace
- [ ] Internal code trusts the validated types — no re-validation deep
      in the call graph
- [ ] Third-party API responses are validated like user input
- [ ] File uploads check type, size, and (when security-relevant) magic
      bytes
- [ ] Output encoding is in place separately from input validation
