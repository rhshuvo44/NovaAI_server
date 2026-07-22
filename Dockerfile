# syntax=docker/dockerfile:1

# ---- Base ----
FROM node:22-alpine3.18 AS base
WORKDIR /usr/src/app
# ensure up-to-date packages and required certs, install dumb-init
RUN apk update && apk upgrade --no-cache \
  && apk add --no-cache dumb-init ca-certificates \
  && update-ca-certificates

# ---- Dependencies (full, for build) ----
FROM base AS deps
COPY package*.json ./
RUN npm ci && npm audit fix --force || true

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
RUN npm ci --omit=dev && npm audit fix --force || true && npm cache clean --force

# ---- Runtime ----
FROM base AS runtime
ENV NODE_ENV=production

COPY --from=prod-deps /usr/src/app/node_modules ./node_modules
COPY --from=build /usr/src/app/dist ./dist
COPY package*.json ./
COPY tsconfig.json ./

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "const p=process.env.PORT||5000;require('http').get('http://localhost:'+p+'/health',(r)=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"

ENTRYPOINT ["dumb-init", "--"]
CMD ["node",  "dist/server.js"]
