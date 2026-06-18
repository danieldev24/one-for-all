---
name: security-and-hardening
description: Applies security controls (input validation, authn/authz,
  output encoding, secret hygiene) at system boundaries. Use proactively
  when building any feature that accepts user input, manages auth or
  sessions, stores PII or payment data, integrates with external services,
  or accepts file uploads / webhooks. Also use as the Security axis of
  `code-review-and-quality` — load this skill on any review touching
  inputs, auth, data, or external I/O. Triggers on phrases like "is this
  safe", "validate this input", "auth flow", "storing secrets". Skip for
  changes that have no security boundary (formatter runs, comment edits,
  pure UI styling on already-validated data).
workflow_mode: strict
max_context_files: 8
default_output: evidence-heavy
---

# Security and Hardening

## Overview

Security-first development practices for web applications. Treat every external input as hostile, every secret as sacred, and every authorization check as mandatory. Security isn't a phase — it's a constraint on every line of code that touches user data, authentication, or external systems.

## When to Use

- Building anything that accepts user input
- Implementing authentication or authorization
- Storing or transmitting sensitive data
- Integrating with external APIs or services
- Adding file uploads, webhooks, or callbacks
- Handling payment or PII data
- **Reviewing code** — this skill is the deep-dive for the Security axis
  of `code-review-and-quality`; load it on any review touching the items
  above

**When NOT to use:**

- Pure UI styling, copy edits, or comment-only changes on data that is
  already validated upstream
- Formatter runs, lockfile-only commits, or generated-artifact updates
  with no behavior change
- Internal-helper refactors that don't touch a system boundary (the
  validation has already happened upstream)

## The Three-Tier Boundary System

### Always Do (No Exceptions)

- **Validate all external input** at the system boundary (API routes, form handlers)
- **Parameterize all database queries** — never concatenate user input into SQL
- **Encode output** to prevent XSS (use framework auto-escaping, don't bypass it)
- **Use HTTPS** for all external communication
- **Hash passwords** with bcrypt/scrypt/argon2 (never store plaintext)
- **Set security headers** (CSP, HSTS, X-Frame-Options, X-Content-Type-Options)
- **Use httpOnly, secure, sameSite cookies** for sessions
- **Run `npm audit`** (or equivalent) before every release

### Ask First (Requires Human Approval)

- Adding new authentication flows or changing auth logic
- Storing new categories of sensitive data (PII, payment info)
- Adding new external service integrations
- Changing CORS configuration
- Adding file upload handlers
- Modifying rate limiting or throttling
- Granting elevated permissions or roles

### Never Do

- **Never commit secrets** to version control (API keys, passwords, tokens)
- **Never log sensitive data** (passwords, tokens, full credit card numbers)
- **Never trust client-side validation** as a security boundary
- **Never disable security headers** for convenience
- **Never use `eval()` or `innerHTML`** with user-provided data
- **Never store sessions in client-accessible storage** (localStorage for auth tokens)
- **Never expose stack traces** or internal error details to users

## OWASP Top 10 Prevention

### 1. Injection (SQL, NoSQL, OS Command)

```typescript
// BAD: SQL injection via string concatenation
const query = `SELECT * FROM users WHERE id = '${userId}'`;

// GOOD: Parameterized query
const user = await db.query('SELECT * FROM users WHERE id = $1', [userId]);

// GOOD: ORM with parameterized input
const user = await prisma.user.findUnique({ where: { id: userId } });
```

### 2. Broken Authentication

```typescript
// Password hashing
import { hash, compare } from 'bcrypt';

const SALT_ROUNDS = 12;
const hashedPassword = await hash(plaintext, SALT_ROUNDS);
const isValid = await compare(plaintext, hashedPassword);

// Session management
app.use(session({
  secret: process.env.SESSION_SECRET,  // From environment, not code
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,     // Not accessible via JavaScript
    secure: true,       // HTTPS only
    sameSite: 'lax',    // CSRF protection
    maxAge: 24 * 60 * 60 * 1000,  // 24 hours
  },
}));
```

### 3. Cross-Site Scripting (XSS)

```typescript
// BAD: Rendering user input as HTML
element.innerHTML = userInput;

// GOOD: Use framework auto-escaping (React does this by default)
return <div>{userInput}</div>;

// If you MUST render HTML, sanitize first
import DOMPurify from 'dompurify';
const clean = DOMPurify.sanitize(userInput);
```

### 4. Broken Access Control

```typescript
// Always check authorization, not just authentication
app.patch('/api/tasks/:id', authenticate, async (req, res) => {
  const task = await taskService.findById(req.params.id);

  // Check that the authenticated user owns this resource
  if (task.ownerId !== req.user.id) {
    return res.status(403).json({
      error: { code: 'FORBIDDEN', message: 'Not authorized to modify this task' }
    });
  }

  // Proceed with update
  const updated = await taskService.update(req.params.id, req.body);
  return res.json(updated);
});
```

### 5. Security Misconfiguration

```typescript
// Security headers (use helmet for Express)
import helmet from 'helmet';
app.use(helmet());

// Content Security Policy
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'"],
    styleSrc: ["'self'", "'unsafe-inline'"],  // Tighten if possible
    imgSrc: ["'self'", 'data:', 'https:'],
    connectSrc: ["'self'"],
  },
}));

// CORS — restrict to known origins
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || 'http://localhost:3000',
  credentials: true,
}));
```

### 6. Sensitive Data Exposure

```typescript
// Never return sensitive fields in API responses
function sanitizeUser(user: UserRecord): PublicUser {
  const { passwordHash, resetToken, ...publicFields } = user;
  return publicFields;
}

// Use environment variables for secrets
const API_KEY = process.env.STRIPE_API_KEY;
if (!API_KEY) throw new Error('STRIPE_API_KEY not configured');
```

## Input Validation

The canonical patterns for *where* to validate (always at the boundary,
never deep in business logic), *what* a schema looks like, error-shape
conventions, and file-upload specifics live in
[`references/input-validation.md`](../../references/input-validation.md).
Both this skill and `api-and-interface-design` link to it instead of
duplicating the pattern.

The security framing is: **all external input is hostile until proven
otherwise.** Treat third-party API responses, webhook bodies, and even
your own database fields written by a different service as untrusted
sources that must be schema-checked at the boundary they enter.

**Worked example for the security context** — rejecting an SQL-injection
attempt at the boundary stops the attack before any query runs:

```typescript
// Boundary validation rejects the malicious input as a string-shape
// violation; it never reaches the database layer.
const UserLookupSchema = z.object({
  id: z.string().uuid(),  // 'or 1=1; --' fails uuid() and 422s out
});

app.get('/api/users/:id', async (req, res) => {
  const result = UserLookupSchema.safeParse(req.params);
  if (!result.success) return res.status(422).json({ error: result.error });
  // Below this line, id is a real UUID. Parameterize anyway as defense
  // in depth — never rely on a single layer.
  const user = await db.query('SELECT * FROM users WHERE id = $1', [result.data.id]);
  return res.json(user);
});
```

## Triaging npm audit Results

Not all audit findings require immediate action. Use this decision tree:

```
npm audit reports a vulnerability
├── Severity: critical or high
│   ├── Is the vulnerable code reachable in your app?
│   │   ├── YES --> Fix immediately (update, patch, or replace the dependency)
│   │   └── NO (dev-only dep, unused code path) --> Fix soon, but not a blocker
│   └── Is a fix available?
│       ├── YES --> Update to the patched version
│       └── NO --> Check for workarounds, consider replacing the dependency, or add to allowlist with a review date
├── Severity: moderate
│   ├── Reachable in production? --> Fix in the next release cycle
│   └── Dev-only? --> Fix when convenient, track in backlog
└── Severity: low
    └── Track and fix during regular dependency updates
```

**Key questions:**
- Is the vulnerable function actually called in your code path?
- Is the dependency a runtime dependency or dev-only?
- Is the vulnerability exploitable given your deployment context (e.g., a server-side vulnerability in a client-only app)?

When you defer a fix, document the reason and set a review date.

## Rate Limiting

```typescript
import rateLimit from 'express-rate-limit';

// General API rate limit
app.use('/api/', rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,                   // 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
}));

// Stricter limit for auth endpoints
app.use('/api/auth/', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,  // 10 attempts per 15 minutes
}));
```

## Secrets Management

```
.env files:
  ├── .env.example  → Committed (template with placeholder values)
  ├── .env          → NOT committed (contains real secrets)
  └── .env.local    → NOT committed (local overrides)

.gitignore must include:
  .env
  .env.local
  .env.*.local
  *.pem
  *.key
```

**Always check before committing:**
```bash
# Check for accidentally staged secrets
git diff --cached | grep -i "password\|secret\|api_key\|token"
```

## Security Review Checklist

```markdown
### Authentication
- [ ] Passwords hashed with bcrypt/scrypt/argon2 (salt rounds ≥ 12)
- [ ] Session tokens are httpOnly, secure, sameSite
- [ ] Login has rate limiting
- [ ] Password reset tokens expire

### Authorization
- [ ] Every endpoint checks user permissions
- [ ] Users can only access their own resources
- [ ] Admin actions require admin role verification

### Input
- [ ] All user input validated at the boundary
- [ ] SQL queries are parameterized
- [ ] HTML output is encoded/escaped

### Data
- [ ] No secrets in code or version control
- [ ] Sensitive fields excluded from API responses
- [ ] PII encrypted at rest (if applicable)

### Infrastructure
- [ ] Security headers configured (CSP, HSTS, etc.)
- [ ] CORS restricted to known origins
- [ ] Dependencies audited for vulnerabilities
- [ ] Error messages don't expose internals
```
## See Also

For detailed security checklists and pre-commit verification steps, see `references/security-checklist.md`.

## Common Rationalizations

| Rationalization | Reality |
|---|---|
| "This is an internal tool, security doesn't matter" | Internal tools are routinely the entry point for breaches — the 2020 Twitter incident started with an internal admin panel; the 2013 Target breach pivoted through an HVAC contractor's internal access. Attackers target the weakest link, and "internal" frequently *is* the weakest link because nobody invests review time there. |
| "We'll add security later" | Security retrofitting is consistently 5-10× more expensive than building it in: a 2020 IBM survey put the average cost of a breach at ~$3.86M, and root-cause analysis routinely traces to a missing control that would have taken < 1 day to add at design time. The skill's three-tier system exists because retrofits get scoped down to the bare minimum. |
| "No one would try to exploit this" | Public endpoints get scanned within minutes of going live — Honeypot data shows new IPs receive automated probes within ~10 minutes of first DNS resolution. "Nobody would try" is the assumption that makes you the easy target. |
| "The framework handles security" | Frameworks provide tools, not guarantees. Express ships `helmet`; if you don't `app.use(helmet())` it does nothing. React auto-escapes JSX; if you reach for `dangerouslySetInnerHTML` it doesn't. Every framework security feature has an opt-in or opt-out, and the wrong choice is silent. |
| "It's just a prototype" | Prototypes become production code on roughly the same timeline that "I'll add tests later" becomes never. Of the security incidents I've reviewed, ~30% trace to code that was originally "a quick prototype" and never got hardened before going live. Day-one habits are the only habits. |
| "We already validate on the frontend" | Frontend validation is UX, not a security boundary. Anyone with `curl` bypasses it in 10 seconds. The browser is the attacker; the server is the boundary. |

## Red Flags

- User input passed directly to database queries, shell commands, or HTML rendering
- Secrets in source code or commit history
- API endpoints without authentication or authorization checks
- Missing CORS configuration or wildcard (`*`) origins
- No rate limiting on authentication endpoints
- Stack traces or internal errors exposed to users
- Dependencies with known critical vulnerabilities

## Verification

After implementing security-relevant code — each item is checkable with a
command, file inspection, or runtime probe:

- [ ] `npm audit --audit-level=high` (or the project's package-manager
      equivalent) returns exit 0 — zero high or critical vulnerabilities
- [ ] No secrets in the change set: `git diff --cached | grep -iE
      'password|secret|api[_-]?key|token|bearer ' | grep -v -E
      '(example|placeholder|TODO)'` returns no real values
- [ ] No secrets in history for any modified file:
      `git log --all -p -- <changed-files> | grep -iE
      'password=|api_key=|secret_key='` returns no real values
- [ ] Every new route handler that accepts user input invokes a schema
      validator before reaching business logic — `grep -E
      "safeParse|parse\(|validate\(" <changed-route-files>` should be
      non-empty for each new endpoint (see
      [`references/input-validation.md`](../../references/input-validation.md))
- [ ] Auth checks present on every protected endpoint: spot-check the
      diff for an `authenticate` / `requireAuth` / `req.user` reference
      before the resource-access call
- [ ] If the change runs in a browser context: response headers include
      CSP / HSTS / X-Frame-Options. Verify with `curl -sI <url> | grep
      -iE 'content-security-policy|strict-transport-security|x-frame-options'`
- [ ] Error responses don't leak stack traces. Probe a known-bad input
      and confirm the body matches the structured 4xx shape from
      `references/input-validation.md`, not an internal error dump
- [ ] Rate limiting active on auth endpoints: hit `/login` or
      equivalent ≥ N+1 times in the limit window and confirm the
      (N+1)th returns 429

## Next

After this skill exits, advise the user on what to do next. Pick the row
that matches the situation:

| If the situation is... | Suggest invoking |
|---|---|
| Security findings addressed — feed them into the review | `/ofa-review` (`code-review-and-quality`) |
| Findings are at API boundaries (input validation, authz contracts) | `api-and-interface-design` |
| Findings touch secrets handling or commit hygiene | `git-workflow-and-versioning` |

End the conversation turn with: `Next: I recommend <skill-or-command> because <one-line reason>.`
