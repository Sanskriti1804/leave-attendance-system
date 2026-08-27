# Leave workflow and statuses

## Status

Confirmed LV-WF-01–09, LV-WF-13, LV-STS-01–07, LV-STS-10. **Not implemented.**

## Purpose

After external manager confirmation (when applicable), HR reviews leave: approve, reject, or request clarification.

## Users and Roles

Employee submits/withdraws/cancels (cancel-after-approve actor **Open**). Admin reviews. Guest admin read-only (Proposed).

## Scope

Statuses: Draft → Submitted → Pending HR Review → Approved / Rejected / Cancelled / Withdrawn.

## Out of Scope

Manager approval **inside** the application (BR-15, LV-WF-01). A later pack sentence that says managers approve in-app is **wrong**; trust Confirmed IDs.

## User Flow

1. Manager approval occurs outside the app; employee attests/proof (LV-WF-09).
2. No reporting manager → HR-direct, no manager proof (LV-WF-13).
3. HR Approve / Reject / Request Clarification.
4. Approved leave drives attendance (see leave-attendance-integration).
5. Cancel/withdraw **approved** leave → correction request (LV-STS-10).

## Business Rules

BR-15, BR-16. Clarification as a **comment**, not a new status, is TD-07 (unsigned). Persist `PENDING_HR_REVIEW` after submit is TD-06 (unsigned).

## Authorization Rules

Admin cannot be assumed allowed to self-approve own leave — **Clarification Required** (TD-14 recommends 403).

## API Endpoints

Proposed: `POST /leaves/{id}/approve|reject|clarification|withdraw|cancel`. No API for LV-APP-18 (HR absence).

## Audit Events

Status history append-only (Proposed `leave_status_history`) plus BR-12 audit log.

## Notifications

Submit, approve, reject with comments (NOTIF Confirmed).

## Open Questions

LV-APP-18 HR absence. Who may cancel/withdraw already approved leave.

## Change History

2026-08-27 — Extracted from source documentation.
