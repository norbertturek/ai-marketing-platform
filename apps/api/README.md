# API (NestJS)

Backend for AI Marketing Platform. NestJS 11, Prisma, PostgreSQL, R2, Runware, OpenAI.

## Setup

```bash
# From repo root
pnpm install
cp .env.example .env   # edit secrets
pnpm prisma:migrate    # apply migrations
pnpm prisma:generate   # regenerate client
```

## Env vars

Copy `.env.example` to `.env`. See header in `.env.example` for canonical key list. Required: `DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`.

## Modules

- **Auth** — JWT access/refresh, bcrypt, `JwtAuthGuard`
- **Projects** — CRUD, ownership by user
- **Posts** — create, list, get, update; media upload to R2
- **Content** — Runware (image/video), OpenAI (text)
- **Storage** — R2 (S3-compatible) for post media

## Commands

```bash
pnpm dev              # watch mode (port 3000)
pnpm start            # run once
pnpm test -- --watchAll=false   # unit tests
pnpm test:e2e         # e2e tests
pnpm prisma:migrate   # migrations
pnpm prisma:generate # regenerate Prisma client
pnpm prisma:studio    # DB GUI
```

## Docker

Run from repo root: `pnpm docker:up` (Postgres + API). API maps to port 3001 in Docker; locally use port 3000.
