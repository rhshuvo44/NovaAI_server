# AI Workspace Backend

Enterprise-grade, production-ready Express.js + TypeScript backend for **AI Workspace**, an AI-powered SaaS platform. Built with a feature-based MVC architecture, full Redis integration, dual AI provider support (OpenAI/Gemini), Clerk authentication with RBAC, and a complete background job system.

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 22+, TypeScript (strict mode) |
| Framework | Express.js 5 |
| Database | MongoDB (Mongoose) |
| Cache / Queues / Pub-Sub | Redis (ioredis), BullMQ |
| Auth | Clerk (session verification) + internal JWT refresh tokens |
| AI | OpenAI & Google Gemini, behind a swappable provider interface |
| Storage | Cloudinary (via Multer) |
| Email | Resend (primary) with Nodemailer/SMTP fallback |
| Docs | Swagger / OpenAPI 3.0 |
| Testing | Jest, Supertest, mongodb-memory-server |
| DevOps | Docker, Docker Compose, PM2, GitHub Actions |

## Architecture

```
src/
  config/          # env, database (Mongo/Redis), Clerk, Cloudinary, Swagger
  constants/        # roles, permissions, cache TTLs, queue names
  middlewares/       # auth, RBAC, validation, rate-limit, sanitize, errors, upload
  modules/<feature>/
    controllers/     # HTTP layer only - no business logic
    services/        # business logic
    repositories/    # all Mongoose queries
    validators/      # express-validator chains
    routes/          # route wiring + OpenAPI annotations
    models/          # Mongoose schemas
  shared/
    errors/          # typed error hierarchy (BaseError -> ValidationError, etc.)
    responses/       # standardized ApiResponse envelope
    models/          # BaseRepository, base schema plugin
    services/        # CacheService, locks, idempotency, pub/sub
  queues/, jobs/      # BullMQ queue factory + workers (email, notifications, AI, scheduled)
  emails/             # email service + HTML templates
  database/seeds/     # Role/Permission seed data + runner
  app.ts, server.ts   # Express app assembly + process bootstrap
```

19 feature modules: auth, users, roles, permissions, documents, categories, tags, favorites, notifications, chat, prompts, ai, uploads, analytics, dashboard, settings, audit-logs, api-keys, system-logs.

Every module follows: **Controller -> Service -> Repository**, with validation and error handling as cross-cutting concerns. Business logic never lives in controllers; all Mongoose queries are isolated in repositories extending `BaseRepository<T>` (pagination, soft delete, bulk ops included for free).

## Getting Started

### Prerequisites
- Node.js 22+
- MongoDB (Atlas or local)
- Redis 7+
- Accounts/API keys for: Clerk, OpenAI and/or Gemini, Cloudinary, Resend (optional - SMTP fallback exists)

### Setup

```bash
npm install
cp .env.example .env   # fill in real credentials
npm run seed            # seeds default Roles + Permissions (required for RBAC to work)
npm run dev              # starts the dev server with hot reload
```

The app **boots without real credentials** (every env var has a safe placeholder default), but Clerk auth, AI features, uploads, and email sending will fail until real keys are provided.

### Available Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Hot-reload dev server |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run the compiled production build |
| `npm run seed` | Seed Roles + Permissions |
| `npm run lint` / `lint:fix` | ESLint |
| `npm run format` / `format:check` | Prettier |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` / `test:coverage` | Jest test suite |
| `npm run docker:up` / `docker:down` | Full local stack via Docker Compose |
| `npm run pm2:start` | Start under PM2 (cluster mode, all cores) |

### Docker Compose (full local stack)

```bash
docker-compose up -d          # app + MongoDB + Redis
docker-compose --profile tools up -d   # also starts mongo-express admin UI on :8081
```

## Authentication Flow

1. Frontend authenticates the user with Clerk directly (sign-up/sign-in widgets).
2. Frontend calls `POST /api/v1/auth/session` with the Clerk session token.
3. Backend verifies the token against Clerk, provisions/loads the local `User` record, and returns an internal **access token** (15m) + **refresh token** (7d).
4. Subsequent requests use `Authorization: Bearer <accessToken>`.
5. `POST /api/v1/auth/refresh` rotates the refresh token (old one is revoked on use).
6. Clerk webhooks (`POST /api/v1/webhooks/clerk`) keep the local `User` record in sync with `user.created` / `user.updated` / `user.deleted` events -- configure this URL in the Clerk dashboard.

RBAC is enforced via `requireAuth` + `requirePermissions(...)` / `requireRole(...)` / `requireOwnershipOrPermission(...)` middleware, checking against permissions resolved from the user's `Role` document (cached in Redis, invalidated on role change).

## AI Provider Abstraction

All AI features (`chat`, `content-generator`, `prompt-optimizer`, `summarizer`, `tags-generator`, `recommendations`) call through `AICoreService`, which:
- Delegates to whichever provider implements `AIProvider` (`OpenAIProvider` or `GeminiProvider`), selected by `AI_PROVIDER` env var.
- Caches identical prompts in Redis (`CACHE_TTL.AI_RESPONSE`, default 6h).
- Records every call (tokens, latency, cache hit/miss, success/failure) to the `AIUsage` collection for billing/analytics.

To add a new provider: implement `AIProvider` in `src/modules/ai/providers/`, register it in `provider.factory.ts`. No other code changes needed.

## Redis Usage Map

| Purpose | Service |
|---|---|
| General caching, getOrSet | `CacheService` |
| OTP / email verification / password reset tokens | `TokenCacheService` |
| Distributed locks | `DistributedLockService` |
| Idempotency keys | `IdempotencyService` |
| Pub/Sub (real-time notification delivery) | `PubSubService` |
| Rate limiting | `rate-limit-redis` store, per-route limiters |
| Job queues | BullMQ (email, notifications, AI processing, scheduled, dead-letter) |

## Testing

```bash
npm test                 # full suite
npm run test:unit        # unit tests only
npm run test:integration # integration (Supertest) tests only
npm run test:coverage    # with coverage report
```

Tests use `mongodb-memory-server` (downloads a real MongoDB binary on first run -- requires outbound network access to `fastdl.mongodb.org`) and connect to a real local/CI Redis instance. **This was verified in development**: all Redis-backed unit tests (cache, distributed locks, idempotency, pub/sub) and the BullMQ queue integration tests were run against a live Redis instance and pass. MongoDB-backed tests are written and type-check cleanly but could not be executed in the sandbox used to build this project, since that sandbox's network policy blocks the MongoDB binary CDN -- they will run normally in any standard dev machine or CI runner (this is one of the most common Node.js testing setups and does not require Docker or a real MongoDB server to be installed).

One real bug was caught by this test suite during development and fixed: the global error handler didn't recognize body-parser's `PayloadTooLargeError`, causing oversized requests to return 500 instead of 413. Covered now by `tests/integration/security.test.ts`.

## Deployment

See `docs/DEPLOYMENT.md` for Docker, PM2, and environment configuration details, and `docs/ARCHITECTURE.md` for a deeper architectural walkthrough.

## API Documentation

Once running, Swagger UI is available at `GET /api-docs` and the raw OpenAPI spec at `GET /api-docs.json`. A Postman collection is included at `docs/postman/AI-Workspace-API.postman_collection.json`.

## Health Checks

- `GET /health` -- basic liveness/info
- `GET /health/live` -- Kubernetes liveness probe target
- `GET /health/ready` -- Kubernetes readiness probe target (checks Mongo + Redis connectivity)
