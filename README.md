# NovaAI Backend

Enterprise-grade, production-ready Express.js + TypeScript backend for **NovaAI**, an AI-powered SaaS platform. Built with a feature-based MVC architecture with dual AI provider support (OpenAI/Gemini), JWT authentication with RBAC.

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 22+, TypeScript (strict mode) |
| Framework | Express.js 5 |
| Database | MongoDB (Mongoose) |
| Auth | JWT access/refresh tokens with rotation and replay detection |
| AI | OpenAI & Google Gemini, behind a swappable provider interface |
| Storage | Cloudinary (via Multer) |
| Email | Resend (primary) with Nodemailer/SMTP fallback |
| Docs | Swagger / OpenAPI 3.0 |
| Testing | Jest, Supertest, mongodb-memory-server |
| DevOps | Docker, Docker Compose, PM2, GitHub Actions |

## Architecture

```
src/
  config/          # env, database (Mongo), Swagger
  constants/       # roles, permissions, cache TTLs
  middlewares/      # auth, RBAC, validation, rate-limit, sanitize, errors, upload
  modules/<feature>/
    controllers/    # HTTP layer only - no business logic
    services/       # business logic
    repositories/   # all Mongoose queries
    validators/     # express-validator chains
    routes/         # route wiring + OpenAPI annotations
    models/         # Mongoose schemas
  shared/
    errors/         # typed error hierarchy (BaseError -> ValidationError, etc.)
    responses/      # standardized ApiResponse envelope
    models/         # BaseRepository, base schema plugin
    services/       # in-memory cache, MongoDB-backed lock/idempotency, EventEmitter pub/sub
  emails/           # email service + HTML templates
  database/seeds/   # Role/Permission seed data + runner
  app.ts, server.ts # Express app assembly + process bootstrap
```

19 feature modules: auth, users, roles, permissions, documents, categories, tags, favorites, notifications, chat, prompts, ai, uploads, analytics, dashboard, settings, audit-logs, api-keys, system-logs.

Every module follows: **Controller -> Service -> Repository**, with validation and error handling as cross-cutting concerns. Business logic never lives in controllers; all Mongoose queries are isolated in repositories extending `BaseRepository<T>` (pagination, soft delete, bulk ops included for free).

## Getting Started

### Prerequisites
- Node.js 22+
- MongoDB (Atlas or local)
- Accounts/API keys for: OpenAI and/or Gemini, Cloudinary, Resend (optional - SMTP fallback exists)

### Setup

```bash
npm install
cp .env.example .env   # fill in real credentials
npm run seed            # seeds default Roles + Permissions (required for RBAC to work)
npm run dev             # starts the dev server with hot reload
```

The app **boots without real credentials** (every env var has a safe placeholder default), but auth, AI features, uploads, and email sending will fail until real keys are provided.

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
docker-compose up -d          # app + MongoDB
docker-compose --profile tools up -d   # also starts mongo-express admin UI on :8081
```

## Seed Data

The `npm run seed` command seeds default system roles, permissions, and test users into the database using `upsert` — it is safe to re-run at any time.

### Permissions (11 total)

| Key | Display Name | Description | Category |
|-----|-------------|-------------|----------|
| `user:read` | View Users | View user accounts and profiles | users |
| `user:write` | Manage Users | Edit user accounts, roles, and status | users |
| `user:delete` | Delete Users | Permanently remove user accounts | users |
| `document:read` | View Documents | View documents | documents |
| `document:write` | Manage Documents | Create and edit documents | documents |
| `document:delete` | Delete Documents | Delete documents | documents |
| `role:manage` | Manage Roles | Create, edit, and delete roles | rbac |
| `permission:manage` | Manage Permissions | Assign permissions to roles | rbac |
| `settings:manage` | Manage Settings | Modify system-wide settings | settings |
| `analytics:read` | View Analytics | View usage analytics and reports | analytics |
| `audit:read` | View Audit Logs | View the audit trail | audit |
| `ai:use` | Use AI Features | Use AI chat, generation, and other features | ai |
| `ai:manage` | Manage AI Settings | Configure AI provider settings and view usage | ai |

### Roles (4 system roles)

| Role | Description | Permissions |
|------|-------------|-------------|
| `user` | Standard user with access to their own content and AI features | `document:read`, `document:write`, `document:delete`, `ai:use` |
| `manager` | Can view team analytics and manage documents across the workspace | `document:read`, `document:write`, `document:delete`, `ai:use`, `analytics:read`, `user:read` |
| `admin` | Full administrative access except RBAC management | All except `role:manage`, `permission:manage` |
| `super_admin` | Unrestricted access, including RBAC role and permission management | All 13 permissions |

### Default users (3)

| Email | Role | Password Source |
|-------|------|-----------------|
| `admin@novaai.com` | Super Admin | `ADMIN_PASSWORD` env var |
| `manager@novaai.com` | Manager | `MANAGER_PASSWORD` env var |
| `user@novaai.com` | User | `USER_PASSWORD` env var |

All seed users have `isEmailVerified: true`.

## Authentication Flow

1. User registers via `POST /api/v1/auth/register` with email + password.
2. Backend hashes the password (bcrypt, 12 rounds), creates a `User` record, and returns an **access token** (15m) + **refresh token** (7d).
3. User logs in via `POST /api/v1/auth/login` with email + password — backend verifies the hash and returns a new token pair.
4. Subsequent requests use `Authorization: Bearer <accessToken>`.
5. `POST /api/v1/auth/refresh` rotates the refresh token (old one is revoked on use — replay resistant).
6. `POST /api/v1/auth/logout` revokes the refresh token.
7. `POST /api/v1/auth/logout-all` revokes all refresh tokens for the user.

RBAC is enforced via `requireAuth` + `requirePermissions(...)` / `requireRole(...)` / `requireOwnershipOrPermission(...)` middleware, checking against permissions resolved from the user's `Role` document.

## AI Provider Abstraction

All AI features (`chat`, `content-generator`, `prompt-optimizer`, `summarizer`, `tags-generator`, `recommendations`) call through `AICoreService`, which:
- Delegates to whichever provider implements `AIProvider` (`OpenAIProvider` or `GeminiProvider`), selected by `AI_PROVIDER` env var.
- Caches identical prompts in-memory (TTL-based, default 6h).
- Records every call (tokens, latency, cache hit/miss, success/failure) to the `AIUsage` collection for billing/analytics.

To add a new provider: implement `AIProvider` in `src/modules/ai/providers/`, register it in `provider.factory.ts`. No other code changes needed.

## Testing

```bash
npm test                 # full suite
npm run test:unit        # unit tests only
npm run test:integration # integration (Supertest) tests only
npm run test:coverage    # with coverage report
```

Tests use `mongodb-memory-server` (downloads a real MongoDB binary on first run -- requires outbound network access to `fastdl.mongodb.org`).

## Deployment

See `docs/DEPLOYMENT.md` for Docker, PM2, and environment configuration details, and `docs/ARCHITECTURE.md` for a deeper architectural walkthrough.

## API Documentation

Once running, Swagger UI is available at `GET /api-docs` and the raw OpenAPI spec at `GET /api-docs.json`. A Postman collection is included at `docs/postman/AI-Workspace-API.postman_collection.json`.

## Health Checks

- `GET /health` -- basic liveness/info
- `GET /health/live` -- Kubernetes liveness probe target
- `GET /health/ready` -- Kubernetes readiness probe target (checks MongoDB connectivity)
