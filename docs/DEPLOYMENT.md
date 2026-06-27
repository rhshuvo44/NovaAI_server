# Deployment Guide

## Option A: Docker Compose (recommended for getting started)

```bash
cp .env.example .env   # fill in real credentials
docker-compose up -d --build
```

This starts the API, MongoDB, and Redis as a connected stack. The app container waits for MongoDB and Redis healthchecks before starting (`depends_on: condition: service_healthy`).

Run the seed script once against the running stack:

```bash
docker-compose exec app node -r tsconfig-paths/register dist/database/seeds/run-seed.js
```

Optional admin UI for MongoDB:

```bash
docker-compose --profile tools up -d mongo-express   # http://localhost:8081
```

## Option B: Standalone Docker image

```bash
docker build -t ai-workspace-backend .
docker run -d \
  --name ai-workspace-api \
  -p 5000:5000 \
  --env-file .env \
  -e MONGODB_URI="mongodb+srv://..." \
  -e REDIS_HOST="your-redis-host" \
  ai-workspace-backend
```

The image is a multi-stage build: dependencies are installed and the app is compiled in a `build` stage, then only production dependencies + compiled `dist/` are copied into the final `runtime` stage, which runs as a non-root user (`nodejs`, uid 1001) under `dumb-init` for correct signal forwarding. A `HEALTHCHECK` hits `/health` every 30s.

## Option C: PM2 (bare-metal / VM deployment, no containers)

```bash
npm ci --omit=dev
npm run build
npm run seed:prod
npm run pm2:start       # pm2 start ecosystem.config.js
```

`ecosystem.config.js` runs in **cluster mode** across all available CPU cores (`instances: 'max'`), with:
- 512MB memory-restart threshold per worker
- 10s restart backoff, max 10 restarts before PM2 gives up on a worker
- `kill_timeout: 16000ms` -- slightly longer than the app's own 15s graceful shutdown window, so PM2 doesn't SIGKILL before the app finishes draining

```bash
npm run pm2:logs        # tail logs
npm run pm2:restart     # zero-downtime reload (cluster mode)
npm run pm2:stop
```

## Environment Variables

See `.env.example` for the full annotated list. Critical ones to set correctly per environment:

| Variable | Notes |
|---|---|
| `MONGODB_URI` | Use a `mongodb+srv://` Atlas URI in production; enable IP allowlisting or VPC peering |
| `REDIS_TLS` | Set to `true` if your Redis provider requires TLS (e.g. managed Redis on most clouds) |
| `CLERK_SECRET_KEY` / `CLERK_WEBHOOK_SECRET` | From the Clerk dashboard; webhook secret is per-endpoint |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | Generate with `openssl rand -hex 32`; rotate periodically; rotating invalidates all existing sessions |
| `AI_PROVIDER` | `openai` or `gemini` -- switch without code changes |
| `NODE_ENV` | Must be `production` for production deploys (disables stack traces in API error responses, tightens CSP) |

## Database Seeding

The RBAC system depends on seeded `Role` + `Permission` documents existing in MongoDB. Run once per environment (idempotent -- safe to re-run):

```bash
npm run seed        # ts-node, for local/dev
npm run seed:prod    # compiled JS, for CI/production after npm run build
```

## CI/CD

`.github/workflows/ci.yml` runs on every push/PR to `main`/`develop`:
1. **lint-and-typecheck** -- ESLint, Prettier check, `tsc --noEmit`
2. **test** -- full Jest suite against a Redis service container (coverage uploaded as an artifact)
3. **build** -- `tsc` compile, `dist/` uploaded as an artifact
4. **docker** (main branch only) -- builds the production image (push step is present but disabled by default; wire up registry credentials and set `push: true` to enable)

## Scaling Notes

- The app is stateless aside from in-process BullMQ worker state; horizontal scaling (more app instances/containers) is safe as long as all instances point at the same MongoDB and Redis.
- BullMQ workers run in the same process as the HTTP server by default (`startWorkers()` in `server.ts`). For higher throughput, split workers into a separate deployment (`node -r tsconfig-paths/register dist/jobs/index.js` as its own entrypoint) so HTTP traffic and background job processing scale independently.
- Redis is a single point of dependency for caching, rate limiting, locks, and queues. Use a managed Redis with persistence (AOF, as configured in `docker-compose.yml`) and consider Redis Sentinel/Cluster for high availability in production.
