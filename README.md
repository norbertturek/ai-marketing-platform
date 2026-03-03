# AI Marketing Platform

Monorepo: Angular 21 frontend + NestJS 11 API, PostgreSQL, Prisma, Turborepo.

## Quick start

```bash
pnpm install
cp apps/api/.env.example apps/api/.env   # edit secrets for production
pnpm docker:up                          # Postgres + API
# In another terminal:
pnpm dev                                 # web (4200) + api (3000)
```

## Stack

| Layer      | Tech                         |
|-----------|------------------------------|
| Frontend  | Angular 21, Signals, spartan-ng, Tailwind v4 |
| Backend   | NestJS 11, Prisma           |
| Database  | PostgreSQL 16               |
| Storage   | Cloudflare R2 (S3-compatible) for post media |
| AI        | Runware (image/video), OpenAI (text) |

## Commands (from repo root)

| Command | Description |
|---------|-------------|
| `pnpm dev` | All apps in watch mode |
| `pnpm dev:api` | API only |
| `pnpm build` | Build all |
| `pnpm lint` | Lint all |
| `pnpm check-types` | TypeScript check |
| `pnpm format` | Prettier |
| `pnpm docker:up` | Postgres + API (Docker) |
| `pnpm docker:down` | Stop containers |

**Tests:**
- Web: `pnpm --filter web test` (Vitest)
- API: `pnpm --filter api test -- --watchAll=false` (Jest)

**Prisma (from `apps/api` or `pnpm --filter api`):**
- `prisma:migrate` — run migrations
- `prisma:generate` — regenerate client after schema changes

## Env vars

Copy `apps/api/.env.example` to `apps/api/.env`. Canonical list of keys:

- **Wymagane:** `DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`
- **Opcjonalne:** `PORT`, `CORS_ORIGIN`, `JWT_*_TTL_SECONDS`, `BCRYPT_ROUNDS`, `RUNWARE_API_KEY`, `OPENAI_API_KEY`, `R2_*`

## Docs

- `docs/README.md` — docs index
- `docs/architecture.md` — architecture
- `docs/railway-deploy.md` — Railway deployment
- `CLAUDE.md` — AI/Claude context

## License

MIT
