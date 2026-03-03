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
pnpm --filter api test -- --watchAll=false        # run Jest unit tests (no watch)
pnpm --filter api test:e2e                        # run e2e tests
pnpm --filter api test -- --testPathPattern=auth   # run a specific test file
pnpm --filter api prisma:migrate                  # run Prisma migrations (dev)
pnpm --filter api prisma:generate                  # regenerate Prisma client after schema changes
```

## Architecture

**Monorepo layout:**
- `apps/web` — Angular 21 frontend (port 4200)
- `apps/api` — NestJS 11 backend (port 3000; Docker maps to 3001)
- `packages/eslint-config`, `packages/typescript-config` — shared tooling
- Orchestrated by Turborepo; package manager is `pnpm@9`.

**Request flow:** Angular UI → HTTP/JSON → NestJS API (prefix `/api`) → Prisma → PostgreSQL 16.

**API bootstrap** (`apps/api/src/main.ts`): global prefix `/api`, CORS enabled, global `ValidationPipe` with `whitelist: true`, `forbidNonWhitelisted: true`, `transform: true`.

**Auth system:**
- API issues short-lived JWT access tokens (default 15 min) and long-lived refresh tokens (default 7 days) via `AuthService`. Secrets and TTLs come from env vars (`JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `JWT_ACCESS_TTL_SECONDS`, `JWT_REFRESH_TTL_SECONDS`). Refresh tokens are bcrypt-hashed and stored in `User.refreshTokenHash`.
- Frontend stores the auth session (access + refresh tokens + user info) in `localStorage` via `AuthStoreService` (signal-based). The `authInterceptor` attaches `Authorization: Bearer` to all non-auth requests and automatically retries on 401 by refreshing tokens once before clearing the session.

**Frontend patterns:**
- All pages use standalone components with `inject()` for DI, Signals for reactive state, and `OnPush` change detection.
- Routes are lazy-loaded (`loadComponent`). Protected routes use `authGuard`.
- HTTP access is encapsulated in `*ApiService` classes; components never construct request details directly.
- **Routes:** `''` → redirect to `playground`; `playground` (Content Generator); `projects`; `project/:projectId`; `project/:projectId/post/:postId` (content for specific post); `credits`; `signin` / `signup`.
- **App shell:** Dark theme (`bg-[#0a0a0a]`), sticky header with zinc borders, nav links `text-zinc-400 hover:bg-zinc-800`.
- UI components come from **spartan-ng** (headless `@spartan-ng/brain` + styled `@spartan-ng/helm` layer). The helm layer lives in `apps/web/libs/ui/` and is aliased as `@spartan-ng/helm`. Add new components with `npx spartan-cli add <component>`.
- Tailwind v4 is used for styling; SCSS for component-level styles.

**Backend patterns:**
- Module structure: one `Module` + `Controller` + `Service` + `Repository` per domain. Prisma calls are confined to repository classes.
- DTOs are validated with `class-validator` / `class-transformer`. Domain errors are mapped to NestJS HTTP exceptions in the service layer.
- `PrismaModule` is global; import it into feature modules that need DB access.

**Local dev database:** `docker compose up` starts a `postgres:16-alpine` container. Copy `apps/api/.env.example` to `apps/api/.env` before first run. Default `DATABASE_URL`: `postgresql://postgres:postgres@localhost:5432/marketing?schema=public`. For R2 (post media) and AI (Runware, OpenAI), set the corresponding env vars; see `.env.example` header for canonical key list.

## AI Assistant Behavior

### Proactive Actions
- **Auto-test:** After modifying code, run relevant tests immediately without being asked
- **Auto-lint:** Run linters and fix issues before committing
- **Auto-format:** Apply Prettier formatting to maintain consistency
- **Auto-validate:** Check types with `pnpm check-types` after TypeScript changes
- **Auto-migrate:** Run `prisma generate` after schema changes
- **Dependency check:** Verify imports exist before using libraries
- **Pattern matching:** Look at existing code patterns before implementing new features

### Implementation Philosophy
1. **Read before write:** Always examine existing code patterns and conventions
2. **Test-first mindset:** Write or update tests before implementation when possible
3. **Incremental changes:** Make small, focused changes that can be validated quickly
4. **Error prevention:** Anticipate edge cases and handle them explicitly
5. **Documentation as code:** Keep code self-documenting with clear naming and structure

### Quality Gates (Auto-Applied)
Before considering any task complete:
1. Tests pass (run automatically via hooks)
2. Linting passes (run automatically)
3. Type checking passes (run automatically)
4. Error states handled (loading, empty, error)
5. Edge cases covered (null, undefined, empty arrays)
6. Security validated (no exposed secrets, SQL injection prevented)
7. Performance considered (no N+1 queries, efficient algorithms)

### Context Awareness
- **File patterns:** Automatically detect whether working in frontend/backend
- **Framework detection:** Apply Angular or NestJS best practices based on file location
- **Test framework:** Use Vitest for frontend, Jest for backend
- **Style system:** Apply Tailwind v4 classes in Angular templates
- **Component library:** Use spartan-ng components when available

### Communication Style
- Be concise and action-oriented
- Show relevant code changes with clear explanations
- Highlight potential issues before they become problems
- Suggest improvements proactively but execute current request first
- Provide rationale for non-obvious decisions

## UI and Design

- Treat `docs/ui/styleguide.md` as the **canonical UI reference** for both:
  - Angular frontend (`apps/web`)
  - React bundle (`AI Marketing Platform/`)
- When generating or modifying UI:
  - Reuse the documented **auth full-screen layout**, card patterns, and form styles instead of inventing new ones.
  - For auth/onboarding flows, copy the structure from:
    - `apps/web/src/app/pages/signin.page.ts` and `signup.page.ts`
    - `AI Marketing Platform/src/app/pages/LoginPage.tsx` and `RegisterPage.tsx`
  - The app shell uses a dark theme (`#0a0a0a`, zinc borders); page content follows the same dark treatment. Prefer `zinc-*` and `#0a0a0a` for app pages; reserve semantic tokens where appropriate.
- Keep validation messages, error handling, and feedback (inline errors, toasts) consistent with the patterns described in the styleguide.

## Hooks

After every edit to `apps/web/src/`, the full Angular unit test suite runs automatically.
After every edit to `apps/api/src/`, the NestJS unit test suite runs automatically.
**If tests fail, fix the source code — never modify tests to make them pass.** Tests document intended behavior; failing tests mean the change broke something.

## Advanced Capabilities

### Multi-file Operations
When implementing features that span multiple files:
1. Plan the changes using TodoWrite tool
2. Read all relevant files first to understand context
3. Make changes in logical order (types → services → components)
4. Validate each change before proceeding

### Refactoring Support
When refactoring code:
1. Identify all usages using Grep tool
2. Update imports and references systematically
3. Run tests after each major change
4. Keep commits atomic and focused

### Performance Optimization
When optimizing performance:
1. Profile first to identify bottlenecks
2. Apply Angular OnPush change detection
3. Use Prisma query optimization (select, include)
4. Implement caching where appropriate
5. Measure improvements with benchmarks

### Security Hardening
Always apply these security practices:
1. Validate all inputs with DTOs
2. Sanitize data at boundaries
3. Use parameterized queries (Prisma handles this)
4. Never log sensitive data
5. Apply rate limiting to public endpoints
6. Use CORS appropriately

### Debugging Assistance
When debugging issues:
1. Check error logs first
2. Verify environment variables are set
3. Ensure database migrations are current
4. Validate network requests in browser DevTools
5. Use breakpoints and debugger statements judiciously
