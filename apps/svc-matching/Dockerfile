# ── Build stage ──────────────────────────────────────────────────────────────
FROM node:20-slim AS builder

WORKDIR /app

RUN npm install -g pnpm

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* ./
COPY packages/shared-types ./packages/shared-types
COPY packages/shared-core ./packages/shared-core
COPY apps/svc-matching ./apps/svc-matching

RUN pnpm install --frozen-lockfile
RUN pnpm --filter @crm/svc-matching build

# ── Runner stage ──────────────────────────────────────────────────────────────
FROM node:20-slim AS runner

ENV NODE_ENV=production

WORKDIR /app

RUN npm install -g pnpm

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* ./
COPY packages/shared-types ./packages/shared-types
COPY packages/shared-core ./packages/shared-core
COPY apps/svc-matching/package.json ./apps/svc-matching/package.json

RUN pnpm install --frozen-lockfile --prod

COPY --from=builder /app/apps/svc-matching/dist ./apps/svc-matching/dist

WORKDIR /app/apps/svc-matching

CMD ["node", "dist/main"]
