# Calendar and timezone

## Status

Holidays/weekly offs CAL-01–03, CAL-07 Confirmed. The 2026-09-15 user requirement sets IST as the global operational timezone. TZ-01 authoritative clock Proposed. Working-hours section in the refinement is **empty**. **HTTP implemented** for `/api/v1/holidays` and `/api/v1/org-settings`. Leave applications consume weekend/holiday flags and owner-provided holiday rows (Indian calendar; not generated). `maxAdvanceDays` default is **14**.

## Purpose

HR configures holidays and weekly offs used in leave day-count and attendance derivation. Org timezone for dashboards/reports/notifications is IST.

## Users and Roles

Admin configures. All roles read holidays/settings as needed (Proposed).

## Business Rules

CAL-07: holidays/weekly offs **do not** sandwich-fill as leave. BR-08: include/exclude weekends/holidays in leave calc is configurable.

## Timezone

- Global requirement: dashboards, reports, notifications, work dates, and shift calculations use **IST** (`Asia/Kolkata`, UTC+05:30).
- Database instants remain UTC; API timestamp responses include the `+05:30` offset.
- Proposed TZ-01 / BR-21: server/NTP clock for punches; device time is not final.
- No per-employee timezone in v1.

## API Endpoints

Implemented (Proposed contract): `GET/PATCH /org-settings`, `GET/POST /holidays`, `DELETE /holidays/{id}`. Integer `holidayId`. No JWT.

## Database Impact

Live Prisma: `Holiday`, `ConfigurationSetting` (category `organisation`). Pack `org_settings` / `public_holidays` not added.

## Open Questions

Section 13 working hours/shifts empty; BRD §8 cited later without a filled refinement table. Full shift master for overnight 18:30–02:30. CAL-04–06 rows unrecoverable — do not invent.

## Change History

2026-09-09 — Leave day-count also reads per-type `LeavePolicy` weekend/holiday include flags from the database.
2026-09-04 — Leave day-count uses org weekend/holiday flags and shared holidays; max advance default 14; Indian holiday list is owner-provided.
2026-09-01 — Holiday and organisation-settings HTTP APIs.
2026-08-27 — Extracted from source documentation.
