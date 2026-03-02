---
name: code-review-gate
description: Run structured code reviews focused on correctness, security, regressions, and missing tests with severity-ranked findings. Use when the user asks for review, PR feedback, or change-risk analysis.
---

# Code Review Gate

## Review Priorities

1. **Correctness** — behavior regressions, logic errors, off-by-one, null/undefined.
2. **Security** — data exposure, injection, auth bypass, secrets in code.
3. **Reliability** — failure modes, missing error handling, retry/timeout gaps.
4. **Test completeness** — behavior changes without test updates.
5. **Maintainability** — coupling, abstraction leaks, breaking changes.

## Severity Model

- **Blocker**: Must be fixed before merge. Broken behavior, security vulnerability, data loss risk.
- **Major**: High-risk defect or missing test coverage for critical path.
- **Minor**: Improvement recommended before merge if feasible.
- **Suggestion**: Optional improvement, style preference, or future consideration.

## Review Workflow

1. **Read all changed files** — understand the full scope of the change.
2. **Trace connected dependencies** — check callers, imports, and downstream effects.
3. **Check project conventions** — verify patterns match the codebase:
   - Frontend: standalone components, `inject()`, signals, `@if`/`@for`, Vitest, spartan-ng
   - Backend: thin controllers, service logic, repository for Prisma, DTOs with class-validator, Jest
4. **Enumerate findings** in severity order with concrete fix guidance.
5. **Call out missing tests** and required scenarios.
6. **State assumptions and open questions** explicitly.
7. **Provide residual risk summary.**

## Project-Specific Checks

### Frontend (`apps/web`)
- Uses `inject()` not constructor injection?
- Signals for state, not `Subject`/`BehaviorSubject`?
- Loading, error, and empty states handled in template?
- Form validation with per-field error getters?
- API calls in services, not components?
- Vitest mocks use `vi.fn()`?
- spartan-ng components imported correctly?

### Backend (`apps/api`)
- Controller is thin — logic in service?
- Prisma calls only in repository, not service/controller?
- DTOs have class-validator decorators?
- Service throws typed NestJS exceptions?
- Prisma unique violations caught as `ConflictException`?
- Not-found cases throw `NotFoundException`?
- Jest mocks use `jest.fn()`?
- Schema changes include migration?

### Both
- Types used (not `any`) in public paths?
- Error handling explicit — no swallowed exceptions?
- Tests cover happy path, error path, edge cases?
- No secrets or credentials in code?
- Imports at top of file?

## Output Template

```markdown
## Review: [Change Title]

### Findings (highest severity first)

1) **[Blocker]** Title
   - Why it matters: ...
   - Suggested fix: ...
   - File: `path/to/file.ts:42`

2) **[Major]** Title
   - Why it matters: ...
   - Suggested fix: ...

3) **[Minor]** Title
   - Suggested fix: ...

### Open Questions / Assumptions
- ...

### Residual Risk
- ...

### Summary
- Blockers: N | Major: N | Minor: N | Suggestions: N
- Recommendation: Approve / Request changes / Needs discussion
```
