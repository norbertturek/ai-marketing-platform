---
name: angular21-frontend
description: Build and review Angular 21 frontend code using standalone APIs, signals, typed forms, and test-first changes. Use when working in apps/web, Angular pages/components/services, or frontend refactors.
---

# Angular 21 Frontend

## Use This Skill When

- The task touches `apps/web`.
- The user asks for Angular component/service/routing/form changes.
- A frontend review is requested.

## Implementation Workflow

1. Confirm scope: component, service, router, form, state, or tests.
2. Prefer standalone APIs and colocated feature structure.
3. Use signals/computed/effect for local state; keep effects minimal.
4. Keep templates simple and move non-trivial logic to TypeScript.
5. Keep data access in services/facades, not components.
6. Add or update tests for changed behavior.

## Quality Gates

- Inputs and outputs are typed end-to-end.
- Form validation is explicit and user-facing messages are clear.
- Loading, empty, and error states are handled.
- Accessibility basics are covered (labels, keyboard flow, semantic markup).
- No inline imports or hidden side effects.
