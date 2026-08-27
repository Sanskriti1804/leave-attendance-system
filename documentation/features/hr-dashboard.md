# HR dashboard

## Status

Confirmed HR-DASH-01–09. **Not implemented.**

## Purpose

Organization snapshot for HR/Admin: totals for employees, present, on leave, absent, unmarked, late, missing checkout, pending leave. Timezone EST (HR-DASH-09).

## Users and Roles

Admin and guest_admin (Proposed for guest). Employees do not see org dashboard (AUTH-03).

## API Endpoints

Proposed: `GET /hr/dashboard`.

## Open Questions

Exact “unmarked” vs Absent vs Missing Check-In (depends on attendance status Open Questions).

## Change History

2026-08-27 — Extracted from source documentation.
