# Leave workflow and statuses

## Status

Confirmed LV-WF-01–09, LV-WF-13, LV-STS-01–07, LV-STS-10. **Leave application workflow implemented** (in-app manager approval per current product plan).

## Purpose

After in-app manager confirmation (when a reporting manager exists), HR reviews leave: approve or reject.

## Users and Roles

Employee submits/withdraws/cancels (cancel-after-approve actor **Open**). Admin reviews. Guest admin read-only (Proposed).

## Scope

Statuses: Draft → Submitted → Pending HR Review → Approved / Rejected / Cancelled / Withdrawn.

## Out of Scope

Manager approval **inside** the application when a reporting manager is assigned. A no-manager path goes to HR review (LV-WF-13).

## User Flow

1. Manager approval occurs in-app when `reportingManagerEmployeeId` is set; otherwise the application goes to HR review. An applicant who is already another active employee’s approver (`managerId`) skips their own manager step and is submitted as `PENDING_HR_REVIEW`. HR can still see `SUBMITTED` requests while approver approval is pending; HR approve/reject stays limited to `PENDING_HR_REVIEW`.
2. No reporting manager → HR-direct (LV-WF-13).
3. HR Approve / Reject. HR/Admin self-leave is auto-approved (`SUBMITTED → APPROVED`); they cannot manually approve their own leave.
4. Approved leave drives attendance (see leave-attendance-integration).
5. Cancel/withdraw **approved** leave → correction request (LV-STS-10).

## Business Rules

BR-15, BR-16. Clarification as a **comment**, not a new status, is TD-07 (unsigned). Persist `PENDING_HR_REVIEW` after submit is TD-06 (unsigned).

## Authorization Rules

Admin cannot be assumed allowed to self-approve own leave — **Clarification Required** (TD-14 recommends 403).

## API Endpoints

Proposed: `POST /leaves/{id}/approve|reject|withdraw|cancel` plus `manager-approve` / `manager-reject`. No API for LV-APP-18 (HR absence).

## Audit Events

Status history append-only (Proposed `leave_status_history`) plus BR-12 audit log.

## Notifications

Submit, approve, reject with comments (NOTIF Confirmed).

## Open Questions

LV-APP-18 HR absence. Who may cancel/withdraw already approved leave.

## Change History

2026-09-22 — Web Leave Review uses aligned columns and distinct action buttons; HR note opens a centered, max-width dialog. Approve/reject/download/manager actions and APIs are unchanged. Android review UI unchanged.

2026-09-21 — Leave Review cards show a truncated HR Note preview when `hrComments` exists.

2026-09-24 — A designated approver’s own leave skips the manager step and goes to HR review. HR review lists `SUBMITTED` requests as approver approval pending and does not decide them until `PENDING_HR_REVIEW`.

2026-09-21 — Employee Profile shows Approver from `managerId`. Admin More tab opens Admin Profile with existing More options below. Blocked Apply Leave dates use a themed dialog. Remove Team Lead clears reports and dialog state.

2026-09-21 — Dummy profile names removed (loading/empty “—” until API). Employee Profile shows Team Lead from `managerId`. Admin People can designate or remove Team Lead via PATCH `managerId`. Apply Leave range uses shared `enumerateCivilRange`; blocked dates stay unselectable with a dismissible reason toast.

2026-09-21 — Apply Leave range highlights all dates from From through To. Approver name uses the employee’s manager (seed fallback Alice Stone). Submit shows a bottom toast; in-app notification copy is concise.

2026-09-21 — Leave status transitions write BR-12 `AuditLog` rows with `LeaveStatusHistory`.

2026-09-20 — `GET /leaves` for employees includes applications where they are the reporting manager. Submit, manager-reject, and HR decisions write in-app notifications. HR approve/reject UI is limited to `PENDING_HR_REVIEW`.

2026-09-18 — HR reject does not require a comment. Optional `comment` is persisted only when the reviewer sends one. Employee receives a `LEAVE_REJECTED` / `LEAVE_APPROVED` in-app notification without duplicates.

2026-09-04 — In-app manager approval and HR/Admin self-leave auto-approval implemented.
2026-08-27 — Extracted from source documentation.
