# ADR-0002: Three roles — employee, admin, guest_admin

## Status

**Roles Confirmed (AUTH-09).** Permission matrix and `guest_admin` = read-only HR mapping are **Proposed** (AUTH-08 interpretation). Pending confirmation of the matrix.

## Context

BRD requires Employee vs HR/Admin capabilities and three roles including a read-only distinction.

## Decision

Use three roles: `employee`, `admin`, `guest_admin`. Treat the engineering permission matrix as a working draft until signed: guest_admin has no mutations; employees are isolated to own data; admin has HR mutations.

## Alternatives Considered

- Two roles only (insufficient vs AUTH-09).
- Separate HR and Admin with different mutation sets (AUTH-08 says distinguish if separate; pack collapsed HR into `admin`).

## Security Impact

Server must not trust client-supplied role. Guest_admin write must 403.

## Performance Impact

None.

## Operational Impact

First admin provisioned out-of-band (Proposed).

## Consequences

Do not invent a fourth role or a permission table in v1 (pack omitted role tables).

## Rollback / Migration Path

If HR and Admin split later, that is a new authorization model (requires approval).

## Date

2026-08-27

## Approved By

Role names: Confirmed in BRD. Matrix: not approved.
