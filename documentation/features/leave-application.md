# Leave application

## Status

Confirmed LV-APP-01–17, duration LV-DUR, dates LV-DATE-01–02/06–07, overlap LV-OVR-01. **Not implemented.**

## Purpose

Employee submits a leave request with type, dates, duration, reason, and documents as required.

## Users and Roles

Employee submits own applications. Admin/guest_admin list org-wide (Proposed).

## Scope

Form validations; half day (first/second), full day, multiple days; auto day count; configurable include/exclude of weekends/holidays; max advance **½ week** (numeric Open); prevent overlapping leave.

## Out of Scope

In-app manager approval. Leave balance checks. Sandwich-filling weekends/holidays (CAL-07).

## User Flow

1. Prefill name, department, manager when present.
2. Choose type, dates, duration mode, reason.
3. Attach medical docs if medical leave rules apply.
4. Attach manager-approval proof if a manager exists (workflow feature).
5. Submit or save draft (draft API is Proposed).

## Business Rules

| ID | Rule | Status |
| --- | --- | --- |
| BR-01 | Cannot submit without required dates | Confirmed |
| BR-02 | Cannot submit without a reason | Confirmed |
| BR-07 | No overlapping leave | Confirmed |
| BR-08 | Weekend/holiday inclusion configurable | Confirmed |
| LV-DUR-09 | First 4 hours = first half; remaining 4 hours = second half | Confirmed |
| LV-DATE-06 | Advance apply max ½ week | Confirmed (numeric Open) |

## Validation Rules

start ≤ end; half-day needs session and start = end; full-day start = end (Proposed CHECKs). Half-day `calculated_days = 0.5` is TD-08.

## API Endpoints

Proposed: `POST /leaves`, drafts, `GET /leaves`, `GET/PATCH /leaves/{id}`, `POST .../submit`.

## Error States

Proposed codes: `LEAVE_OVERLAP`, `TOO_FAR_AHEAD`, `LEAVE_DAYS_ZERO`, `LEAVE_TYPE_NOT_ELIGIBLE`, `MEDICAL_DOCUMENT_REQUIRED`, `MANAGER_PROOF_REQUIRED`.

## Edge Cases

Employees with no department/manager. Two half-days same date — not explicitly confirmed; TD-23 allows first+second.

## Open Questions

LV-OVR-03/04 which statuses block overlap. LV-APP-18 HR-absent path. MED-12 “exceeding two days” vs weekends. Unrecoverable blank BRD rows must not be invented.

## Change History

2026-08-27 — Extracted from source documentation.
