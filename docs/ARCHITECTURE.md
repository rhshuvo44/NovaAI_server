# Architecture

## Layering

```
Request -> Middleware chain -> Router -> Controller -> Service -> Repository -> Mongoose -> MongoDB
```

- **Controllers** (`modules/*/controllers/`) only parse the request and call a service. They never touch Mongoose directly and never contain conditional business logic beyond "which service method to call."
- **Services** (`modules/*/services/`) hold all business rules: ownership checks, cache invalidation, cross-module orchestration (e.g. `DashboardService` reads from five different repositories), and side effects (queuing emails/notifications).
- **Repositories** (`modules/*/repositories/`) are the only place Mongoose queries are written. Every repository extends `BaseRepository<T>` (`shared/models/base.repository.ts`), which provides `create`, `findById`, `findOne`, `findMany`, `paginate`, `updateById`, `bulkUpdate`, `deleteById` (soft by default), `bulkDelete`, `count`, `exists` -- all with consistent soft-delete filtering and error wrapping into `DatabaseError`.
- **Validators** (`modules/*/validators/`) are `express-validator` chains, fed into the shared `handleValidationErrors` middleware which throws a typed `ValidationError` with field-level details.

## Error Handling

All errors extend `BaseError` (`shared/errors/index.ts`), which carries `statusCode`, `errorCode`, `isOperational`, and optional field-level `details`. The `globalErrorHandler` middleware (registered last in `app.ts`) is the single place that converts any thrown error into the standardized `ApiResponse.error(...)` envelope. Errors that are not `BaseError` instances are treated as unexpected 500s and logged with full stack traces (suppressed in production responses, but always logged server-side).

A small number of framework-level exceptions (e.g. body-parser's payload-too-large) are explicitly recognized and mapped to the correct status code rather than falling through to 500 -- see `mapKnownHttpError` in `error-handler.middleware.ts`.

## Authentication & RBAC

`requireAuth` middleware verifies the internal JWT access token from the `Authorization: Bearer <token>` header, loads the `User`, resolves their `Permission[]` from their `Role` document, and attaches `req.user`.

The auth service issues an **access token** (15m) + **refresh token** (7d) on login/register. Refresh tokens use rotation with replay detection — each refresh call issues a new pair and revokes the old one. Logout revokes the refresh token; logout-all revokes all tokens for the user.

RBAC middleware (`middlewares/rbac.middleware.ts`) then composes on top:
- `requireRole(minRole)` -- hierarchy check (`USER < MANAGER < ADMIN < SUPER_ADMIN`)
- `requirePermissions(...)` -- must have ALL listed permissions
- `requireAnyPermission(...)` -- must have AT LEAST ONE
- `requireOwnershipOrPermission(idParam, permission)` -- self-service OR admin override

## AI Provider Abstraction

```
AIProvider (interface)
  |-- OpenAIProvider
  |-- GeminiProvider

provider.factory.ts -> getAIProvider() reads AI_PROVIDER env var, returns the right implementation (singleton)

AICoreService.completeTracked(request, { userId, feature, cache })
   1. builds a cache key from a hash of the message array + feature
   2. checks in-memory cache (unless cache: false, e.g. for live chat turns)
   3. on miss, calls provider.complete(request)
   4. records usage (tokens, latency, provider, cache hit/miss, success) to AIUsage collection -- failures here never break the caller
   5. returns the result
```

Feature services (`ContentGeneratorService`, `SummarizerService`, etc.) are thin wrappers around `AICoreService` with feature-specific system prompts and response parsing (e.g. `TagsGeneratorService` parses a JSON array from the model's text output).

## In-Memory Cache

AI prompt responses are cached in-memory using a `Map` with TTL-based eviction (default 6h, configured per-feature). Cache keys are hashes of the message array + feature name. The cache service also provides `getOrSet` and `invalidatePattern` for prefix-based invalidation.

Locks, idempotency records, and token blacklists are stored in MongoDB with TTL indexes — no Redis dependency.

## Soft Deletes & Pagination

Every model except `RefreshToken`, `Message`, `AnalyticsEvent`, `AuditLog`, and `AIUsage` (append-only / TTL-bounded collections) supports soft delete via a `deletedAt: Date | null` field added uniformly by `applyBasePlugin`. `BaseRepository` filters `deletedAt: null` into every read query automatically; `deleteById(id, soft = true)` sets the timestamp rather than removing the document, with an explicit `soft = false` escape hatch for hard deletes where needed (e.g. revoking API keys' underlying secret).

Pagination is offset-based by default (`page`/`limit`/`sort`/`order` query params, validated by `paginationValidator`), returning a `PaginationMeta` envelope (`page`, `limit`, `totalItems`, `totalPages`, `hasNextPage`, `hasPrevPage`). Cursor-based pagination types exist in `types/index.ts` (`CursorPaginationQuery`) for future use on high-volume collections (e.g. `Message`) where offset pagination would degrade.

## Security Layers

1. **Helmet** -- standard security headers
2. **CORS** -- locked to `CLIENT_URL`, credentialed
3. **Custom sanitization** (`sanitizeInput`) -- strips `$`-prefixed keys and dotted keys from body/query/params to prevent NoSQL operator injection. Written in-house rather than using `express-mongo-sanitize`, because that package mutates `req.query` in a way that's incompatible with Express 5's stricter property descriptors.
4. **Custom XSS escaping** (`xssProtection`) -- HTML-escapes string fields in the request body. Written in-house rather than using the unmaintained `xss-clean` package.
5. **Rate limiting** -- in-memory (`express-rate-limit` default `MemoryStore`), tiered: global (100/15min), auth (20/15min), AI (20/min, keyed by user), uploads (50/hour, keyed by user).
6. **RBAC** -- see above.
7. **Audit logging** -- `AuditLogService.record(...)` and the `auditAction(...)` middleware factory record mutating actions with actor, action type, resource, and request metadata.
