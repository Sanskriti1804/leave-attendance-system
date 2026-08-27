# Attendance

## Status

Confirmed AT-01–05, dashboard AT-DASH-01–10, status **labels** Confirmed; qualification of statuses Clarification Required. Punch uniqueness Proposed. **Not implemented.**

## Purpose

Daily check-in/check-out with date and exact times; employee dashboard in EST.

## Users and Roles

Employee punches and views own dashboard/history. Admin/guest_admin view org attendance (Proposed). Employees cannot PATCH days (BR-10).

## Scope

Statuses (labels Confirmed): Present, Absent, On Leave, Half-Day, Holiday, Weekly Off, Missing Check-In, Missing Check-Out.

Stakeholder note: disable check-in/check-out buttons to prevent double check-in/out.

Proposed button table:

| State | Check-In | Check-Out |
| --- | --- | --- |
| Not checked in | Enabled | Disabled |
| Checked in | Disabled | Enabled |
| Checked out | Disabled | Disabled |

## Out of Scope

Overtime. Multiple punch events per day. Biometric devices. Treating device clock as final (Proposed).

## Business Rules

AT-01–05 Confirmed (daily in/out, date + times, tied to employee). AT-06–08 duplicate / out-without-in **Proposed**. TZ-04 / AT-DASH-10 dashboards in EST **Confirmed**.

## API Endpoints

Proposed: `POST /attendance/check-in`, `POST /attendance/check-out`, `GET /attendance/me`, `GET /attendance/me/dashboard`, `GET /attendance`. Admin `PATCH /attendance/{id}` is **Conflict** (ADR-0007).

## Database Impact

Proposed one `attendance_days` row per employee per `work_date`. Unique constraint is technical integrity, not signed UX policy.

## Error States

Proposed: `ALREADY_CHECKED_IN`, `NO_CHECK_IN`.

## Edge Cases

Overnight 18:30–02:30: pack TD-05 `work_date` = Eastern date of check-in; full shift master **Open**. Do **not** invent “Unauthorized Absence” as a stored status.

## Open Questions

Absent vs Missing Check-In when no punch and no leave. Exact missing in/out triggers. AT-06/07/08 vs button-disable extra.

## Change History

2026-08-27 — Extracted from source documentation.
