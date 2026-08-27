# ADR-0006: Organization timezone EST / America/New_York

## Status

Dashboards, reports, and notifications in **EST**: Confirmed (TZ-04, AT-DASH-10, HR-DASH-09). Mapping EST → IANA `America/New_York` (including EDT): **TD-03, Pending Confirmation**. Authoritative punch clock on the server: **Proposed** (TZ-01 / BR-21).

## Context

The BRD says EST. Device/phone date must not automatically be treated as the source of truth.

## Decision

- Display and report in Eastern Time as Confirmed.
- Until TD-03 is signed, document the IANA zone as a technical recommendation, not a silent extra requirement.
- Do not implement per-employee timezones.

## Alternatives Considered

- Store and display only UTC (would violate Confirmed EST dashboards).
- Trust device clock (rejected as final policy by requirements notes).

## Security Impact

Clients must not set punch timestamps that the server blindly trusts if TZ-01 is adopted.

## Performance Impact

None.

## Operational Impact

Overnight shift `work_date` = Eastern date of check-in is TD-05; full shift master still Open.

## Consequences

`org_settings.timezone` default `'America/New_York'` in the Proposed schema follows TD-03.

## Rollback / Migration Path

Changing org TZ later needs a data/display review.

## Date

2026-08-27

## Approved By

EST display: Confirmed. IANA identifier and server clock: not fully approved.
