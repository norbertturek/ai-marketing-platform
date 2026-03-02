# AGENTS.md

## Cursor Cloud specific instructions

### Services overview

| Service | Port | Start command |
|---|---|---|
| PostgreSQL 16 | 5432 | `sudo docker compose up -d postgres` (from repo root) |
| NestJS API | 3000 | `pnpm --filter api dev` |
| Angular Frontend | 4200 | `cd apps/web && npx ng serve --port 4200` |

### Prerequisites before starting services

- PostgreSQL must be running before the API starts. Docker must be started first: `sudo dockerd &>/tmp/dockerd.log &` then `sudo docker compose up -d postgres`.
- Copy `apps/api/.env.example` to `apps/api/.env` if `.env` doesn't exist yet.
- Run `pnpm --filter api prisma:generate` after any Prisma schema change.
- Run `pnpm --filter api prisma:migrate` to apply migrations against a fresh database.

### Gotchas

- The frontend calls the API at `http://localhost:3000/api` (hardcoded default in `apps/web/src/app/core/auth/auth-api.service.ts`). There is no proxy config; the API must run on port 3000.
- Auth endpoints are at `/api/auth/register`, `/api/auth/signin`, `/api/auth/refresh`, `/api/auth/signout`, `/api/auth/me` (not `/sign-up`).
- `pnpm lint` has pre-existing lint errors in `apps/api/test/app.e2e-spec.ts` (`@typescript-eslint/no-unsafe-assignment`). These are not caused by cloud agent setup.
- The web app has no `lint` script; only the API is linted via `pnpm lint`.
- Frontend tests use Vitest via Angular builder: `cd apps/web && npx ng test --no-watch`. The `--run` flag documented in `CLAUDE.md` does not work with `ng test`; use `--no-watch` instead.
- `pnpm install` (not `--frozen-lockfile`) is needed because the lockfile can drift from `package.json` on this branch.
- Docker runs inside a Firecracker VM. Use `fuse-overlayfs` storage driver and `iptables-legacy` for compatibility. The daemon.json and iptables alternatives are configured during initial setup.

### Commands reference

See `CLAUDE.md` for the full command reference. Key deviations from that doc:
- Frontend tests: use `npx ng test --no-watch` (not `pnpm --filter web test -- --run`).
