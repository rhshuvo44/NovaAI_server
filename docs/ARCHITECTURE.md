# Architecture

## Layering

```
Request -> Middleware chain -> Router -> Controller -> Service -> Repository -> Mongoose -> MongoDB
                                              |
                                      (Redis cache / queue side-effects)
```

- **Controllers** (`modules/*/controllers/`) only parse the request and call a service. They never touch Mongoose directly and never contain conditional business logic beyond "which service method to call."
- **Services** (`modules/*/services/`) hold all business rules: ownership checks, cache invalidation, cross-module orchestration (e.g. `DashboardService` reads from five different repositories), and side effects (queuing emails/notifications).
- **Repositories** (`modules/*/repositories/`) are the only place Mongoose queries are written. Every repository extends `BaseRepository<T>` (`shared/models/base.repository.ts`), which provides `create`, `findById`, `findOne`, `findMany`, `paginate`, `updateById`, `bulkUpdate`, `deleteById` (soft by default), `bulkDelete`, `count`, `exists` -- all with consistent soft-delete filtering and error wrapping into `DatabaseError`.
- **Validators** (`modules/*/validators/`) are `express-validator` chains, fed into the shared `handleValidationErrors` middleware which throws a typed `ValidationError` with field-level details.

## Error Handling

All errors extend `BaseError` (`shared/errors/index.ts`), which carries `statusCode`, `errorCode`, `isOperational`, and optional field-level `details`. The `globalErrorHandler` middleware (registered last in `app.ts`) is the single place that converts any thrown error into the standardized `ApiResponse.error(...)` envelope. Errors that are not `BaseError` instances are treated as unexpected 500s and logged with full stack traces (suppressed in production responses, but always logged server-side).

A small number of framework-level exceptions (e.g. body-parser's payload-too-large) are explicitly recognized and mapped to the correct status code rather than falling through to 500 -- see `mapKnownHttpError` in `error-handler.middleware.ts`.

## Authentication & RBAC

Two token systems coexist intentionally:
1. **Clerk session tokens** -- issued by Clerk on the frontend, verified server-side via `verifyClerkSessionToken` (uses Clerk's backend SDK, which validates against Clerk's JWKS).
2. **Internal access/refresh tokens** -- issued by this backend after Clerk verification succeeds (`AuthService.bootstrapSession`). These exist so the backend isn't coupled to Clerk's token lifetime/rotation semantics, supports refresh token rotation with replay detection, and allows session revocation (`logout`, `logoutAllSessions`) independent of Clerk.

`requireAuth` middleware verifies the **Clerk** token on the `Authorization` header (this is what the frontend sends on every request, consistent with Clerk's recommended integration pattern), loads the local `User`, resolves their `Permission[]` from their `Role` document (cached in Redis under `session:permissions:<userId>`, invalidated on role change), and attaches `req.user`.

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
  2. checks Redis cache (unless cache: false, e.g. for live chat turns)
  3. on miss, calls provider.complete(request)
  4. records usage (tokens, latency, provider, cache hit/miss, success) to AIUsage collection -- failures here never break the caller
  5. returns the result
```

Feature services (`ContentGeneratorService`, `SummarizerService`, etc.) are thin wrappers around `AICoreService` with feature-specific system prompts and response parsing (e.g. `TagsGeneratorService` parses a JSON array from the model's text output).

## Redis Architecture

A single `RedisManager` singleton (`config/database/redis.ts`) holds four separate `ioredis` connections:
- `client` -- general purpose (cache, locks, idempotency, rate limiting)
- `publisher` / `subscriber` -- dedicated connections for Pub/Sub (required because a subscribing connection can't issue other commands)
- `bullClient` -- dedicated connection options for BullMQ (BullMQ manages its own connections per queue/worker, but shares the same connection config)

Key prefixes (`constants/index.ts` -> `REDIS_KEY_PREFIX`) keep different concerns namespaced: `session:`, `cache:`, `rl:` (rate limit), `otp:`, `email_verify:`, `password_reset:`, `ai_response:`, `search:`, `lock:`, `idempotency:`, `dashboard:`, `analytics:`.

## Queue System

BullMQ queues (`queues/queue.factory.ts`) with shared retry/backoff defaults (3 attempts, exponential backoff, dead-letter routing on final failure):
- `email-queue` -- all outbound email sends
- `notification-queue` -- creates the `Notification` document and broadcasts via Pub/Sub for real-time delivery
- `ai-processing-queue` -- background AI jobs (currently summarizer/tags-generator can run here for bulk operations)
- `scheduled-queue` -- recurring cron-style jobs (token cleanup, health snapshots) via BullMQ's `repeat` option
- `dead-letter-queue` -- final resting place for jobs that exhausted all retries, for manual inspection

Workers (`jobs/*.worker.ts`) are started together in `jobs/index.ts -> startWorkers()`, called once at server bootstrap.

## Soft Deletes & Pagination

Every model except `RefreshToken`, `Message`, `AnalyticsEvent`, `AuditLog`, and `AIUsage` (append-only / TTL-bounded collections) supports soft delete via a `deletedAt: Date | null` field added uniformly by `applyBasePlugin`. `BaseRepository` filters `deletedAt: null` into every read query automatically; `deleteById(id, soft = true)` sets the timestamp rather than removing the document, with an explicit `soft = false` escape hatch for hard deletes where needed (e.g. revoking API keys' underlying secret).

Pagination is offset-based by default (`page`/`limit`/`sort`/`order` query params, validated by `paginationValidator`), returning a `PaginationMeta` envelope (`page`, `limit`, `totalItems`, `totalPages`, `hasNextPage`, `hasPrevPage`). Cursor-based pagination types exist in `types/index.ts` (`CursorPaginationQuery`) for future use on high-volume collections (e.g. `Message`) where offset pagination would degrade.

## Security Layers

1. **Helmet** -- standard security headers
2. **CORS** -- locked to `CLIENT_URL`, credentialed
3. **Custom sanitization** (`sanitizeInput`) -- strips `$`-prefixed keys and dotted keys from body/query/params to prevent NoSQL operator injection. Written in-house rather than using `express-mongo-sanitize`, because that package mutates `req.query` in a way that's incompatible with Express 5's stricter property descriptors.
4. **Custom XSS escaping** (`xssProtection`) -- HTML-escapes string fields in the request body. Written in-house rather than using the unmaintained `xss-clean` package.
5. **Rate limiting** -- Redis-backed (`rate-limit-redis`), tiered: global (100/15min), auth (20/15min), AI (20/min, keyed by user), uploads (50/hour, keyed by user).
6. **RBAC** -- see above.
7. **Audit logging** -- `AuditLogService.record(...)` and the `auditAction(...)` middleware factory record mutating actions with actor, action type, resource, and request metadata.
