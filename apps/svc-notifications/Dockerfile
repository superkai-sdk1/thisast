# ── Build stage ──────────────────────────────────────────────────────────────
FROM node:20-slim AS builder

WORKDIR /app

RUN npm install -g pnpm

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* ./
COPY packages/shared-types ./packages/shared-types
COPY packages/shared-core ./packages/shared-core
COPY apps/svc-notifications ./apps/svc-notifications

RUN pnpm install --frozen-lockfile
RUN pnpm --filter @crm/svc-notifications build

# ── Runner stage ──────────────────────────────────────────────────────────────
FROM node:20-slim AS runner

ENV NODE_ENV=production

WORKDIR /app

RUN npm install -g pnpm

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* ./
COPY packages/shared-types ./packages/shared-types
COPY packages/shared-core ./packages/shared-core
COPY apps/svc-notifications/package.json ./apps/svc-notifications/package.json

RUN pnpm install --frozen-lockfile --prod

COPY --from=builder /app/apps/svc-notifications/dist ./apps/svc-notifications/dist

WORKDIR /app/apps/svc-notifications

CMD ["node", "dist/main"]
