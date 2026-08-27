# Reports

## Status

REP-01–13 Confirmed (leave and attendance report kinds; Excel/CSV/PDF). Filters and cancelled/withdrawn treatment Open. **Not implemented.**

## Purpose

Org reports for HR/Admin.

## Users and Roles

AUTH-07 Confirmed HR/Admin generate reports. Pack TD-18: admin + guest_admin. REP-15 access Open.

## Scope

Leave: employee, department, monthly, type, approved-rejected. Attendance: daily, monthly, employee, late, missing-logout. Formats Excel/CSV/PDF.

## Out of Scope

Payroll extracts. Invented report types.

## API Endpoints

Proposed `GET /reports/{slug}` with slugs: `leave-employee`, `leave-department`, `leave-monthly`, `leave-type`, `leave-decisions`, `attendance-daily`, `attendance-monthly`, `attendance-employee`, `attendance-late`, `attendance-missing-logout`. Format `xlsx|csv|pdf`.

## Edge Cases

Null department grouped as Unassigned (EDGE-02). Export max 366 days is TD, not BRD. `from`/`to` required until REP-14 signed (TD).

## Open Questions

REP-14 filters. REP-16 cancelled/withdrawn/corrected treatment. Report access list.

## Change History

2026-08-27 — Extracted from source documentation.
