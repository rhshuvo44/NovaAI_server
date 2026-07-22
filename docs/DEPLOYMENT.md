# Deployment Guide

## Option A: Full Stack via Docker Compose (recommended)

The root `docker-compose.yml` orchestrates the entire stack: nginx (reverse proxy), frontend (Next.js), backend (Express), and MongoDB.

### Prerequisites

- Docker & Docker Compose v2
- Git

### Setup

```bash
# 1. Clone and enter the project
git clone <repo-url> novaai
cd novaai

# 2. Configure environment
cp backend/.env.example backend/.env
# Edit backend/.env with real credentials (see "Environment Variables" below)

# 3. Start the full stack
docker compose up -d --build
```

This builds and starts:
- **nginx** on port 80 — reverse proxy distributing traffic to frontend and backend
- **frontend** (Next.js) — not directly exposed, accessed through nginx
- **backend** (Express) — not directly exposed, accessed through nginx
- **mongodb** (MongoDB 7) — internal, with healthcheck

### First-run seeding

```bash
docker compose exec backend node -r tsconfig-paths/register dist/database/seeds/run-seed.js
```

### Administration

```bash
# MongoDB admin UI (optional)
docker compose --profile tools up -d   # http://localhost:8081

# View logs
docker compose logs -f
docker compose logs -f backend

# Stop everything
docker compose down

# Stop and remove volumes (!! destroys data)
docker compose down -v
```

### Environment variables

Edit `backend/.env` with real credentials before starting:

| Variable | Notes |
|---|---|
| `MONGODB_URI` | Overridden to `mongodb://mongodb:27017/ai-workspace` inside Docker |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | Generate with `openssl rand -hex 32` |
| `AI_PROVIDER` | `openai` or `gemini` |
| `OPENAI_API_KEY` / `GEMINI_API_KEY` | Your AI provider API key |
| `CLOUDINARY_*` | Required for file uploads |
| `ADMIN_PASSWORD` / `MANAGER_PASSWORD` / `USER_PASSWORD` | Seed user passwords |

Variables can also be set via a `.env` file in the project root (alongside `docker-compose.yml`):

```
NGINX_PORT=8080
MONGO_EXPRESS_PORT=8081
MONGO_EXPRESS_AUTH=true
```

## Option B: Standalone Backend Docker Image

```bash
cd backend
docker build -t novaai-backend .
docker run -d \
  --name novaai-backend \
  -p 5000:5000 \
  --env-file .env \
  -e MONGODB_URI="mongodb+srv://..." \
  novaai-backend
```

The image is a multi-stage build: dependencies are installed and compiled in `build` and `prod-deps` stages; the final `runtime` stage contains only production dependencies + compiled `dist/`, running under `dumb-init` for correct signal forwarding. A `HEALTHCHECK` hits `/health` every 30s.

## Option C: Standalone Frontend Docker Image

```bash
cd NovaAI-frontend
docker build -t novaai-frontend .
docker run -d \
  --name novaai-frontend \
  -p 3000:3000 \
  -e NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api/v1 \
  -e NEXT_PUBLIC_SITE_URL=https://yourdomain.com \
  -e NEXT_PUBLIC_SITE_NAME=NovaAI \
  novaai-frontend
```

The Next.js build uses `output: "standalone"` for minimal image size. The Dockerfile follows the same multi-stage pattern as the backend.

## Option D: PM2 (bare-metal / VM deployment)

```bash
cd backend
npm ci --omit=dev
npm run build
npm run seed:prod
npm run pm2:start       # pm2 start ecosystem.config.js
```

`ecosystem.config.js` runs in **cluster mode** across all available CPU cores (`instances: 'max'`), with:
- 512MB memory-restart threshold per worker
- 10s restart backoff, max 10 restarts before PM2 gives up on a worker
- `kill_timeout: 16000ms` — slightly longer than the app's own 15s graceful shutdown window

```bash
npm run pm2:logs        # tail logs
npm run pm2:restart     # zero-downtime reload (cluster mode)
npm run pm2:stop
```

## Production Architecture

```
                         ┌──────────────┐
                         │   nginx:80    │
                         │  (reverse     │
                         │   proxy)      │
                         └──┬───────┬────┘
                            │       │
                    /api/*  │       │  /*
                            │       │
                    ┌───────▼┐   ┌───▼────────┐
                    │ backend │   │  frontend   │
                    │ :5000   │   │  :3000      │
                    └───┬────┘   └─────────────┘
                        │
                ┌────────┼────────┐
                ▼        ▼        ▼
            MongoDB    Cloudinary    Redis
                       (external)   (optional)
```

## Git Workflow

```bash
git checkout -b feature/my-feature
# ... work ...
git push origin feature/my-feature

# Open PR on GitHub — CI runs lint, typecheck, test, build
# Merge to main — CI runs lint, typecheck, test, build, and Docker build
```

## CI/CD Pipeline

`.github/workflows/ci.yml` runs on every push/PR to `main`/`develop`:

1. **lint & typecheck** — ESLint + `tsc --noEmit` (backend); ESLint (frontend)
2. **format-check** — Prettier (backend)
3. **test** — Full Jest suite against `mongodb-memory-server`, coverage uploaded as artifact
4. **build** — TypeScript compilation + Next.js production build
5. **docker** (main branch only) — Builds all 3 images (backend, frontend, nginx) with Docker BuildKit caching, tags with commit SHA and `latest`

## Database Seeding

RBAC depends on seeded `Role` + `Permission` documents. Run once per environment (idempotent):

```bash
docker compose exec backend node -r tsconfig-paths/register dist/database/seeds/run-seed.js
```

## Resource Limits (Docker)

| Service | Memory Limit | Memory Reservation |
|---------|-------------|-------------------|
| backend | 512M | 256M |
| frontend | — | — |
| mongodb | 2G | 512M |


## Security

- All containers (except nginx) are internal — not directly exposed to the host
- nginx adds security headers (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`)
- Backend runs under `dumb-init` for proper signal forwarding
- Static assets get immutable cache headers (365 days)
- File upload limit: 50MB (configurable in nginx config)
- Logs are capped at 10MB per file, 3 rotated files per container

## Scaling Notes

- The app is stateless; horizontal scaling (more app instances/containers) is safe as long as all instances point at the same MongoDB.
- Rate limit counters and in-memory caches are per-instance. For strict rate limiting across instances, add an external store (e.g. a shared MongoDB collection or Redis).
- For multi-node deployments, replace Docker bridge networking with an overlay network or Kubernetes.
