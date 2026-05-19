# ── Build stage ──────────────────────────────────────────────────────────────
FROM node:20-slim AS builder

WORKDIR /app

RUN npm install -g pnpm

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* ./
COPY packages/shared-types ./packages/shared-types
COPY packages/shared-core ./packages/shared-core
COPY apps/svc-properties ./apps/svc-properties

RUN pnpm install --frozen-lockfile
RUN pnpm --filter @crm/svc-properties build

# ── Runner stage ──────────────────────────────────────────────────────────────
FROM node:20-slim AS runner

# Install Chromium for Puppeteer
RUN apt-get update && apt-get install -y chromium && rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV NODE_ENV=production

WORKDIR /app

RUN npm install -g pnpm

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* ./
COPY packages/shared-types ./packages/shared-types
COPY packages/shared-core ./packages/shared-core
COPY apps/svc-properties/package.json ./apps/svc-properties/package.json

RUN pnpm install --frozen-lockfile --prod

COPY --from=builder /app/apps/svc-properties/dist ./apps/svc-properties/dist
# Copy HBS templates into dist
COPY --from=builder /app/apps/svc-properties/src/pdf/templates ./apps/svc-properties/dist/pdf/templates

WORKDIR /app/apps/svc-properties

CMD ["node", "dist/main"]
