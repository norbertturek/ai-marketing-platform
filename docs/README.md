# AI Marketing Platform Docs

This folder contains project documentation for product, architecture, development, and operations.

## Index

- `architecture.md` - current system architecture (source of truth for high-level design)
- `adr/README.md` - Architecture Decision Records process and template

## Planned Documents

- `api.md` - API surface, contracts, versioning, and error model
- `data-model.md` - Prisma schema overview and migration strategy
- `frontend.md` - Angular architecture, routing, state, and UI conventions
- `deployment.md` - local, staging, and production deployment flows
- `observability.md` - logging, metrics, tracing, and alerting
- `security.md` - authentication, authorization, and secret handling standards

## Documentation Rules

- Keep docs close to current implementation; update docs in the same PR as behavior changes.
- Prefer small, focused docs over one large catch-all file.
- Include diagrams for architecture and data flow changes.
