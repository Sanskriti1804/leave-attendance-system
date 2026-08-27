# Major data flows

All server-side writes below are **not implemented**. Flows combine Confirmed business rules with Proposed API/schema names.

## Leave submit (Confirmed LV-APP, BR-01–07, LV-WF)

1. Employee fills type, dates, duration (half/full/multi), reason; medical upload when required (BR-03–05).
2. If the employee has a reporting manager, manager approval happens **outside the app** (BR-15). Proof of that approval is required on submit (LV-WF-09). If no manager, HR-direct (LV-WF-13).
3. Server validates overlap (BR-07), eligibility, documents, day count.
4. Status becomes pending HR review (pack TD-06: persist `PENDING_HR_REVIEW`; `SUBMITTED` only in history — unsigned).
5. Notify HR (NOTIF Confirmed that notifications exist; channel details partial).

## Leave HR decision (Confirmed LV-WF, INT-01, INT-03)

- Approve → attendance days for the leave range become On Leave (INT-01). If punches already exist, raise a **correction request**; do not silently overwrite (INT-03).
- Reject / request clarification with comments.
- Cancel/withdraw of **approved** leave → correction request (LV-STS-10). Who may cancel approved leave is **Open**.

## Attendance punch (Confirmed AT-01–05; UX Proposed / stakeholder)

1. Employee check-in stores date + exact time tied to the employee.
2. Check-out requires an in (Proposed AT-08 / BR-19). Duplicate in/out prevention is Proposed; stakeholder note asks to **disable buttons**.
3. Authoritative clock: do not treat device time as final (Proposed TZ-01). Dashboards use EST (TZ-04 Confirmed).

## Attendance correction (Confirmed AT-COR)

Employee cannot PATCH attendance (BR-10). Employee submits a correction request; HR reviews.

**Conflict:** Confirmed AT-COR-11 allows HR to modify attendance without a request. Stakeholder note and Proposed BR-20 say HR only upon request. See ADR-0007.

## Audit and notifications

Every change is audited (BR-12). Notifications for leave submit/approve/reject, missing medical before submit, unmarked attendance, missing logout (NOTIF-01–07 Confirmed). Teams/Slack is Future.
