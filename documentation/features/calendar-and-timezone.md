# Calendar and timezone

## Status

Holidays/weekly offs CAL-01–03, CAL-07 Confirmed. TZ-04 EST Confirmed. TZ-01 authoritative clock Proposed. Working-hours section in the refinement is **empty**. **HTTP implemented** for `/api/v1/holidays` and `/api/v1/org-settings` (no authz; leave day-count not wired).

## Purpose

HR configures holidays and weekly offs used in leave day-count and attendance derivation. Org timezone for dashboards/reports/notifications is EST.

## Users and Roles

Admin configures. All roles read holidays/settings as needed (Proposed).

## Business Rules

CAL-07: holidays/weekly offs **do not** sandwich-fill as leave. BR-08: include/exclude weekends/holidays in leave calc is configurable.

## Timezone

- Confirmed: dashboards, reports, notifications in **EST**.
- TD-03: IANA `America/New_York` (includes EDT). Not separately signed.
- Proposed TZ-01 / BR-21: server/NTP clock for punches; device time is not final.
- No per-employee timezone in v1.

## API Endpoints

Implemented (Proposed contract): `GET/PATCH /org-settings`, `GET/POST /holidays`, `DELETE /holidays/{id}`. Integer `holidayId`. No JWT.

## Database Impact

Live Prisma: `Holiday`, `ConfigurationSetting` (category `organisation`). Pack `org_settings` / `public_holidays` not added.

## Open Questions

Section 13 working hours/shifts empty; BRD §8 cited later without a filled refinement table. Full shift master for overnight 18:30–02:30. CAL-04–06 rows unrecoverable — do not invent.

## Change History

2026-09-01 — Holiday and organisation-settings HTTP APIs.
2026-08-27 — Extracted from source documentation.
