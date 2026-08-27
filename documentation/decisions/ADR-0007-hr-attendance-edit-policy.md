# ADR-0007: HR attendance edit policy

## Status

Conflict / Pending Decision. Do not implement one side as if it were the only requirement.

## Context

| Source | Statement |
| --- | --- |
| Stakeholder note (source file header) | HR can only change attendance upon request |
| BR-11 Confirmed | Employee attendance changes go through correction-request |
| AT-COR-11 Confirmed | HR/Admin **can** directly modify attendance without a correction |
| BR-20 Proposed | HR should only modify via approved correction |
| Engineering pack | Employee corrections **and** admin `PATCH /attendance/{id}` |

BR-10 Confirmed: employees cannot directly modify attendance.

## Decision

**None.** Product must pick:

1. Admin PATCH allowed (AT-COR-11), with audit (BR-12); and/or
2. Admin only via correction workflow (stakeholder + BR-20).

Until then, AI must not silently omit or add admin PATCH as settled policy. Employee correction requests remain Confirmed.

## Alternatives Considered

Listed above; none selected.

## Security Impact

Direct PATCH is a privileged mutation; if allowed, require admin role, audit before/after, and optional `admin_modified` flag (Proposed column).

## Performance Impact

None.

## Operational Impact

HR process and mobile/admin UI differ substantially between the two options.

## Consequences

`documentation/api/attendance.md` marks PATCH as Conflict.

## Rollback / Migration Path

Depends on the chosen option; both are additive to employee corrections.

## Date

2026-08-27

## Approved By

Not approved. Human decision required.
