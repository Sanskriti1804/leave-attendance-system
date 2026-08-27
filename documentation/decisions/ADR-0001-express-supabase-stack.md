# ADR-0001: Express + Supabase stack

## Status

Proposed / Pending Approval.

The repository currently has Express 5 **CommonJS** with no server file and **no Supabase**. The engineering pack proposes Express **TypeScript** + Supabase Auth, PostgreSQL, and Storage.

## Context

Backend must enforce leave and attendance rules, store documents, and authenticate users. No database exists yet.

## Decision

**Until approved:** keep the existing Express CommonJS package. Do not migrate to TypeScript or add Supabase in code merely because the pack recommended it.

If this ADR is approved later, the target is Express API `/api/v1` with Supabase Auth JWT, PostgreSQL, and private Storage.

## Alternatives Considered

- Continue without a database (cannot meet Confirmed persistence rules).
- Different auth/db vendors (not specified in BRD).

## Security Impact

Service-role keys must not be shared across environments. JWT validation and server-side RBAC required if adopted.

## Performance Impact

Not evaluated.

## Operational Impact

Separate Supabase projects per environment (Proposed).

## Consequences

Unsigned schema/API must not be treated as BRD. First implementation of a server should still start from `backend/` Express without extra frameworks unless this ADR is approved to add them.

## Rollback / Migration Path

If Supabase is added and later rejected, that would require a new ADR and data migration.

## Date

2026-08-27

## Approved By

Not approved.
