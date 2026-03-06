---
name: playwright-e2e
description: Run and author Playwright browser e2e tests. Use when testing full-stack flows, auth, projects, or content generator in a real browser.
---

# Playwright E2E

## Use This Skill When

- The user asks to run or write browser/e2e tests.
- Testing auth, projects, playground, or save-to-project flows.
- Debugging full-stack behavior that unit tests don't cover.

## Prerequisites

1. **Docker:** `pnpm docker:up` — Postgres must be running.
2. **Config:** `playwright.config.ts` starts `pnpm dev` as webServer (web + API).

## Commands

```bash
pnpm docker:up      # Start Postgres first
pnpm test:e2e       # Run all e2e tests (headless)
pnpm test:e2e:ui    # Run with Playwright UI
pnpm exec playwright test e2e/auth.spec.ts   # Single file
```

## Test Layout

```
e2e/
├── auth.spec.ts           # Signup, signin
├── projects.spec.ts      # Create project
├── playground.spec.ts   # Content generator UI
└── video-generation.spec.ts  # Video generation flow (mocked API)
```

## Patterns

- Use `getByRole`, `getByPlaceholder`, `getByText` — avoid brittle CSS selectors.
- Signup with unique email: `` `e2e-${Date.now()}@example.com` `` to avoid conflicts.
- `test.beforeEach` for shared auth when needed.
- Assert URLs: `await expect(page).toHaveURL(/\/projects/);`
- Assert visibility: `await expect(element).toBeVisible({ timeout: 5000 });`

## When Adding Tests

- Add to existing spec file or create `e2e/<feature>.spec.ts`.
- Keep tests independent; each can sign up a fresh user if needed.
- Do not rely on shared state across tests.
