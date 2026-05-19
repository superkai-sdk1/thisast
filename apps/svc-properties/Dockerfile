FROM node:20-alpine AS deps
RUN corepack enable && corepack prepare pnpm@9 --activate
WORKDIR /app
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/shared-types/package.json ./packages/shared-types/
COPY packages/shared-core/package.json  ./packages/shared-core/
COPY apps/svc-properties/package.json   ./apps/svc-properties/
RUN pnpm install --frozen-lockfile

FROM deps AS builder
WORKDIR /app
COPY tsconfig.base.json ./
COPY packages/shared-types ./packages/shared-types
COPY packages/shared-core  ./packages/shared-core
COPY apps/svc-properties   ./apps/svc-properties
RUN pnpm --filter @crm/shared-types build
RUN pnpm --filter @crm/shared-core  build
RUN pnpm --filter @crm/svc-properties build

FROM node:20-slim AS runner
RUN apt-get update && apt-get install -y chromium && rm -rf /var/lib/apt/lists/*
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV NODE_ENV=production
WORKDIR /app
RUN addgroup --system --gid 1001 nestjs && adduser --system --uid 1001 nestjs
COPY --from=builder --chown=nestjs:nestjs /app/apps/svc-properties/dist ./dist
COPY --from=builder --chown=nestjs:nestjs /app/apps/svc-properties/src/pdf/templates ./dist/pdf/templates
COPY --from=builder /app/node_modules ./node_modules
USER nestjs
EXPOSE 3003
CMD ["node", "dist/main"]
