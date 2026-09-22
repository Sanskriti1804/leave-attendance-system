# HR dashboard

## Status

Confirmed HR-DASH-01–09. **Not implemented.**

## Purpose

Organization snapshot for HR/Admin: totals for employees, present, on leave, absent, unmarked, late, missing checkout, pending leave. Timezone IST (`Asia/Kolkata`, UTC+05:30).

## Users and Roles

Admin and guest_admin (Proposed for guest). Employees do not see org dashboard (AUTH-03).

## API Endpoints

Proposed: `GET /hr/dashboard`.

## Open Questions

Exact “unmarked” vs Absent vs Missing Check-In (depends on attendance status Open Questions).

## Change History

2026-09-22 — Web HR Dashboard quick actions use an equal-size icon grid. Same routes and live leave/employee counts. Android dashboard unchanged.

2026-09-21 — Dashboard chrome restyled (tokens, cards, stats, pending-review panel). No API or workforce logic changes.

2026-09-18 — Admin dashboard pending-review count uses live `PENDING_HR_REVIEW` + `SUBMITTED` leave lists. HR Quick Actions navigate to existing leave review, org settings (holidays), attendance corrections, people, and organisation settings.

2026-09-18 — Admin dashboard workforce uses live employee list plus approved leave covering today. Search filters the directory. Present = active employees not on approved leave (org punch APIs are not available).

2026-08-27 — Extracted from source documentation.
