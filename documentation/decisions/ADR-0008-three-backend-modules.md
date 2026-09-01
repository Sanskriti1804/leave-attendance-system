# ADR-0008: Three backend modules

## Status

Implemented in the repository as folder layout only. Domain code is still placeholders. Not a signed BRD.

## Context

Backend source lived under `backend/src/app/routes/` as a flat list of feature folders. Leave, attendance, and platform concerns were mixed at the same level.

## Decision

Organize `backend/src/modules/` into exactly three modules:

1. `leave-management` — leave types, leave policies, leave applications, leave documents.
2. `attendance-management` — attendance, attendance corrections.
3. `shared` — auth, employees, departments, holidays, organisation settings, notifications, audit logs, reports, health, Prisma client, middleware, types, utilities, and leave↔attendance sync.

Leave and attendance must not import each other’s internals. Cross-feature writes (for example approved leave marking attendance On Leave, INT-01) go through `shared/integrations`.

Per-feature files stay `route.ts`, `controller.ts`, `service.ts`, `repository.ts`, `validation.ts`.

## Alternatives Considered

- Keep a single `app/routes` tree (harder ownership as features grow).
- More than three modules (split reports, calendar, documents) — rejected to keep the requested boundary of three.

## Security Impact

None by itself. Authorization still belongs in `shared` middleware when implemented.

## Performance Impact

None.

## Operational Impact

None. Prisma schema and generated client stay at `backend/prisma/` and `backend/src/generated/`.

## Consequences

New leave work goes under `leave-management`. New punch/correction work goes under `attendance-management`. New users, auth, DB, and cross-cutting work goes under `shared`.

## Rollback / Migration Path

Move folders back under a single `app/routes` tree if this layout is rejected.

## Date

2026-09-01

## Approved By

Not a signed business approval. Layout requested in engineering discussion and applied in the repo.
