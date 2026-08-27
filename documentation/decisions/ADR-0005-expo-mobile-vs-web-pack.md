# ADR-0005: Keep Expo mobile as the client

## Status

Pending Approval for long-term platform. **Default until approved otherwise: keep Expo.**

## Context

- Repository: MaxStarter Expo SDK 54 app is the only UI.
- Engineering pack: “mobile apps out of scope”; described a web frontend; application UI out of scope for that backend pack.
- Task rule: preserve existing technology stack unless documentation explicitly requires a change. The pack does not require deleting mobile.

## Decision

Do not replace Expo with a web app and do not add a second frontend without human approval. Domain screens should be added in `mobile/` when implemented.

## Alternatives Considered

- New web client (would abandon existing scaffold).
- Dual web + mobile (out of scope / overengineering).

## Security Impact

Mobile mock auth and unguarded tabs remain until a real API exists.

## Performance Impact

None.

## Operational Impact

Developers run Expo Go SDK 54.

## Consequences

Implied surfaces in `documentation/ui/` are implemented as Expo screens, not as an unspecified web SPA.

## Rollback / Migration Path

A later web app would be a new architecture ADR.

## Date

2026-08-27

## Approved By

Not approved. Default follows existing repo.
