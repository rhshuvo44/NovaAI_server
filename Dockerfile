# syntax=docker/dockerfile:1

# ---- Base ----
FROM node:22-alpine AS base
WORKDIR /usr/src/app
RUN apk add --no-cache dumb-init

# ---- Dependencies (full, for build) ----
FROM base AS deps
COPY package*.json ./
RUN npm ci

# ---- Build ----
FROM base AS build
COPY package*.json ./
COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ---- Production dependencies only ----
FROM base AS prod-deps
COPY package*.json ./
RUN npm ci --omit=dev

# ---- Runtime ----
FROM base AS runtime
ENV NODE_ENV=production

# Run as a non-root user
RUN addgroup -g 1001 nodejs && adduser -S nodejs -u 1001

COPY --from=prod-deps /usr/src/app/node_modules ./node_modules
COPY --from=build /usr/src/app/dist ./dist
COPY package*.json ./
COPY tsconfig.json ./

RUN mkdir -p logs && chown -R nodejs:nodejs /usr/src/app

USER nodejs

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "-r", "tsconfig-paths/register", "dist/server.js"]
