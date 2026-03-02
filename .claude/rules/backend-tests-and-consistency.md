---
paths:
  - "apps/api/**/*.ts"
---

# Backend Tests and Consistency

- **Run unit tests after backend changes.** After editing or generating code under `apps/api`, run the test suite (e.g. `pnpm test` in `apps/api` or `pnpm --filter api test`) and fix any failures before considering the change done.
- **Treat tests as the consistency gate.** The API must work consistently; any generated or refactored code must not break behavior that worked before. The existing unit and e2e tests are the primary check for that.
- **When generating or refactoring code:** run the full backend test suite afterward and address failures. Do not leave failing tests or assume behavior is unchanged without running tests.
- **When adding or changing behavior:** add or update the relevant tests so the suite continues to guard against regressions.
- **When tests fail after a code change: fix the code, not the tests.** Do not change or relax tests to make them pass. The tests encode the intended behavior; if they fail, the application code is wrong and must be fixed to satisfy the tests.
