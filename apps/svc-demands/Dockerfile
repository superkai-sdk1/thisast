FROM node:20-alpine AS deps
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/shared-types/package.json ./packages/shared-types/
COPY packages/shared-core/package.json  ./packages/shared-core/
COPY apps/svc-demands/package.json      ./apps/svc-demands/
RUN pnpm install --frozen-lockfile

FROM deps AS builder
WORKDIR /app
COPY tsconfig.base.json ./
COPY packages/shared-types ./packages/shared-types
COPY packages/shared-core  ./packages/shared-core
COPY apps/svc-demands      ./apps/svc-demands
RUN pnpm --filter @crm/shared-types build
RUN pnpm --filter @crm/shared-core  build
RUN pnpm --filter @crm/svc-demands  build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nestjs && adduser --system --uid 1001 nestjs
COPY --from=builder --chown=nestjs:nestjs /app/apps/svc-demands/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
USER nestjs
CMD ["node", "dist/main.js"]
