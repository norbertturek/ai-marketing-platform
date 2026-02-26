FROM node:20-alpine AS base

RUN corepack enable

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/api/package.json apps/api/package.json
COPY packages/eslint-config/package.json packages/eslint-config/package.json
COPY packages/typescript-config/package.json packages/typescript-config/package.json

RUN pnpm install --no-frozen-lockfile --filter api...

COPY apps/api apps/api
COPY packages packages

RUN DATABASE_URL=postgresql://dummy:dummy@localhost:5432/dummy pnpm --filter api prisma:generate
RUN pnpm --filter api build

COPY apps/api/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["/docker-entrypoint.sh"]
