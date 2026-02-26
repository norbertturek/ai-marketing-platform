---
name: nestjs-backend
description: Build and review NestJS backend features with clear module boundaries, DTO validation, service-first business logic, and robust error handling. Use when working in apps/api or implementing API endpoints and services.
---

# NestJS Backend

## Use This Skill When

- The task touches `apps/api`.
- The user asks for endpoint, module, service, guard, interceptor, or data-layer work.
- A backend review is requested.

## Implementation Workflow

1. Define the contract first (request/response DTOs, status codes, errors).
2. Keep controllers thin and place business rules in services.
3. Validate input and sanitize boundary data.
4. Keep persistence logic behind repository/service abstractions.
5. Map domain errors to meaningful HTTP exceptions.
6. Add unit tests for services and e2e coverage for critical endpoints.

## Quality Gates

- No untyped `any` in public paths.
- Timeouts/retries are explicit for external I/O.
- Logs include context without leaking secrets.
- Module dependencies are acyclic and intentional.
- Behavior changes have tests or documented risk acceptance.
