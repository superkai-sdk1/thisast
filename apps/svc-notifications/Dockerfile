FROM node:20-alpine AS deps
RUN corepack enable && corepack prepare pnpm@9 --activate
WORKDIR /app
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/shared-types/package.json   ./packages/shared-types/
COPY packages/shared-core/package.json    ./packages/shared-core/
COPY apps/svc-notifications/package.json  ./apps/svc-notifications/
RUN pnpm install --frozen-lockfile

FROM deps AS builder
WORKDIR /app
COPY tsconfig.base.json ./
COPY packages/shared-types    ./packages/shared-types
COPY packages/shared-core     ./packages/shared-core
COPY apps/svc-notifications   ./apps/svc-notifications
RUN pnpm --filter @crm/shared-types build
RUN pnpm --filter @crm/shared-core  build
RUN pnpm --filter @crm/svc-notifications build
RUN pnpm --filter @crm/svc-notifications deploy --prod /deploy

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nestjs && adduser --system --uid 1001 nestjs
COPY --from=builder --chown=nestjs:nestjs /app/apps/svc-notifications/dist ./dist
COPY --from=builder --chown=nestjs:nestjs /deploy/node_modules ./node_modules
USER nestjs
EXPOSE 3006
CMD ["node", "dist/main"]
