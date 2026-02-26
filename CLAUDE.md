# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

**From repo root (Turborepo):**
```bash
pnpm dev              # start all apps in watch mode
pnpm dev:api          # start only the API in watch mode
pnpm build            # build all apps
pnpm lint             # lint all apps
pnpm check-types      # typecheck all apps
pnpm format           # format all files with Prettier
pnpm docker:up        # start Postgres + API via Docker Compose
pnpm docker:down      # stop containers
```

**Frontend (`apps/web`) — run from that directory or via filter:**
```bash
pnpm --filter web test          # run all Vitest unit tests
pnpm --filter web test -- --run # run once (no watch)
ng test                         # same, from inside apps/web
ng serve                        # dev server on port 4200
```

**Backend (`apps/api`) — run from that directory or via filter:**
```bash
pnpm --filter api test               # run Jest unit tests
pnpm --filter api test:e2e           # run e2e tests
pnpm --filter api test -- --testPathPattern=auth  # run a specific test file
pnpm --filter api prisma:migrate     # run Prisma migrations (dev)
pnpm --filter api prisma:generate    # regenerate Prisma client after schema changes
```

## Architecture

**Monorepo layout:**
- `apps/web` — Angular 21 frontend (port 4200)
- `apps/api` — NestJS 11 backend (port 3000; Docker maps to 3001)
- `packages/eslint-config`, `packages/typescript-config` — shared tooling
- Orchestrated by Turborepo; package manager is `pnpm@9`.

**Request flow:** Angular UI → HTTP/JSON → NestJS API (prefix `/api`) → Prisma → PostgreSQL 16.

**API bootstrap** ([apps/api/src/main.ts](apps/api/src/main.ts)): global prefix `/api`, CORS enabled, global `ValidationPipe` with `whitelist: true`, `forbidNonWhitelisted: true`, `transform: true`.

**Auth system:**
- API issues short-lived JWT access tokens (default 15 min) and long-lived refresh tokens (default 7 days) via `AuthService`. Secrets and TTLs come from env vars (`JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `JWT_ACCESS_TTL_SECONDS`, `JWT_REFRESH_TTL_SECONDS`). Refresh tokens are bcrypt-hashed and stored in `User.refreshTokenHash`.
- Frontend stores the auth session (access + refresh tokens + user info) in `localStorage` via `AuthStoreService` (signal-based). The `authInterceptor` attaches `Authorization: Bearer` to all non-auth requests and automatically retries on 401 by refreshing tokens once before clearing the session.

**Frontend patterns:**
- All pages use standalone components with `inject()` for DI, Signals for reactive state, and `OnPush` change detection.
- Routes are lazy-loaded (`loadComponent`). The `dashboard` route is guarded by `authGuard`.
- HTTP access is encapsulated in `*ApiService` classes; components never construct request details directly.
- UI components come from **spartan-ng** (headless `@spartan-ng/brain` + styled `@spartan-ng/helm` layer). The helm layer lives in `apps/web/libs/ui/` and is aliased as `@spartan-ng/helm`. Add new components with `npx spartan-cli add <component>`.
- Tailwind v4 is used for styling; SCSS for component-level styles.

**Backend patterns:**
- Module structure: one `Module` + `Controller` + `Service` + `Repository` per domain. Prisma calls are confined to repository classes.
- DTOs are validated with `class-validator` / `class-transformer`. Domain errors are mapped to NestJS HTTP exceptions in the service layer.
- `PrismaModule` is global; import it into feature modules that need DB access.

**Local dev database:** `docker compose up` starts a `postgres:16-alpine` container. Copy `apps/api/.env.example` to `apps/api/.env` before first run. Default `DATABASE_URL`: `postgresql://postgres:postgres@localhost:5432/marketing?schema=public`.

## Coding Standards

### General
- Pure functions and small composable units over large imperative flows.
- Validate external input only at boundaries (HTTP, env, DB). Do not validate internal calls.
- Handle errors explicitly; never swallow exceptions — log context and preserve the original cause.
- Remove dead code; avoid speculative abstractions.

### NestJS Backend (`apps/api/**/*.ts`)
- Keep controllers thin; all business logic in services.
- Keep data access in repository classes; no Prisma calls in controllers or services directly.
- Centralize cross-cutting concerns in guards, interceptors, and filters.
- Add unit tests for services and e2e tests for endpoint contracts.

### Angular Frontend (`apps/web/**/*.{ts,html,scss}`)
- Standalone components, directives, and pipes only — no `NgModule`-based declarations.
- Signals (`signal`, `computed`, `effect`) for reactive state; avoid `Subject`/`BehaviorSubject` for local state.
- `OnPush` change detection by default.
- Typed reactive forms (`FormGroup` / `FormControl`) for non-trivial forms.
- Use Angular Router guards and resolvers for route-level concerns.
- Add unit tests for components/services and integration tests for critical user flows.

## Hooks

After every edit to `apps/web/src/`, the full Angular unit test suite runs automatically. **If tests fail, fix the source code — never modify tests to make them pass.** Tests document intended behavior; failing tests mean the change broke something.
