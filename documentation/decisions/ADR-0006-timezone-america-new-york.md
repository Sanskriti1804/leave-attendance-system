# ADR-0006: Organization timezone IST / Asia/Kolkata

## Status

**Superseded** by the 2026-09-15 global IST timezone change. Dashboards, reports, notifications, civil work dates, and shift calculations use `Asia/Kolkata` (IST, UTC+05:30). The authoritative punch clock on the server remains **Proposed** (TZ-01 / BR-21).

## Context

The prior BRD-derived EST setting has been replaced by the user's explicit global IST requirement. Device/phone date must not automatically be treated as the source of truth.

## Decision

- Display and report in IST using IANA `Asia/Kolkata`.
- Store instants in UTC and serialize API timestamps with the explicit `+05:30` offset.
- Do not implement per-employee timezones.

## Alternatives Considered

- Store and display only UTC (would violate the required IST dashboards).
- Trust device clock (rejected as final policy by requirements notes).

## Security Impact

Clients must not set punch timestamps that the server blindly trusts if TZ-01 is adopted.

## Performance Impact

None.

## Operational Impact

Overnight shift `work_date` = Eastern date of check-in is TD-05; full shift master still Open.

## Consequences

`org_settings.timezone` defaults to `Asia/Kolkata`.

## Rollback / Migration Path

Changing org TZ later needs a data/display review.

## Date

2026-08-27

## Approved By

IST display and IANA identifier: implemented from the 2026-09-15 user requirement. Server clock: not fully approved.
