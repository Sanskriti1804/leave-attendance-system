# Implied UI surfaces

Derived from **Confirmed** requirements. This is **not** a signed wireframe or visual spec. The engineering pack did not include a frontend specification. The repo UI is Expo, not a web app.

## Employee

- Login (email/password)
- Leave apply: auto name/department/manager when present; type; start/end; half/full/multi; first/second half; reason; medical upload; submit; status list
- Proof of external manager approval on submit when a manager exists
- Check-in / check-out controls (stakeholder: disable to prevent double punch)
- Attendance dashboard: today, login/logout times, monthly present/absent/leave, late, missing; timezone EST
- Attendance correction request form
- In-app notifications list

## HR / Admin

- Employee management
- Leave review: approve, reject, request clarification; view/download medical docs
- HR dashboard counts (employees, present, on leave, absent, unmarked, late, missing checkout, pending leave) in EST
- Reports with Excel/CSV/PDF export
- Leave type / holiday / weekly-off / working-hours configuration
- Attendance correction review
- Direct attendance edit **or** request-only — **Conflict** (ADR-0007)

## Guest admin (Proposed mapping of AUTH-08)

Org-wide dashboards, reports, leave/attendance/medical **view**; no mutations.

## UI states to implement when screens are built

Loading, empty, error, success, disabled (especially punch buttons). No leave-balance widgets.
