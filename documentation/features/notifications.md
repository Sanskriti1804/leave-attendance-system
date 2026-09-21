# Notifications

## Status

NOTIF-01–07 Confirmed. Teams/Slack Future. Reminder schedule Open. **In-app list, mark-read, and leave submit / medical-required / approve / reject notifications implemented.** Unmarked attendance / missing logout reminders are not.

## Purpose

Notify people about leave decisions, missing medical before submit, unmarked attendance, and missing logout.

## Users and Roles

Recipients are the involved employee and HR as implied by each event. In-app list is own notifications only (Proposed).

## Scope

Confirmed events: leave submit; approve; reject with comments; medical missing before submit; unmarked attendance; missing logout.

## Out of Scope

Microsoft Teams / Slack (NOTIF-10 Future).

## API Endpoints

Implemented: `GET /api/v1/notifications` (own rows; JWT; `unreadCount`). `POST /api/v1/notifications/:id/read` marks the caller’s row. Leave submit / medical-required / approve / reject with dedupe. Notification write failures do not fail the leave mutation.

## Database Impact

Proposed `notifications` with channels IN_APP | EMAIL. Payload jsonb must not include medical bytes.

## Open Questions

NOTIF-12 clock times for reminders. NOTIF-08/09/11 rows unrecoverable — do not invent. Email vs in-app only until channels are signed (pack TD: both).

## Change History

2026-09-21 — Employee-facing leave notification copy: submitted successfully / approved / rejected, without leave IDs. Existing event types unchanged.

2026-09-21 — Notification copy is concise (submitted / requires review / approved / rejected) without leave numbers in the message. Submit also notifies the employee. Type includes leave id for dedupe.

2026-09-21 — Implemented mark-read and unreadCount. Leave notification writes are isolated from leave mutation success.

2026-09-20 — Implemented: `GET /api/v1/notifications` lists the caller’s in-app rows. Leave submit notifies manager or HR; missing medical, manager reject, and HR approve/reject notify the employee (duplicate title+message skipped).

2026-09-18 — `GET /api/v1/notifications` lists the caller’s in-app rows. HR approve/reject writes a leave-decision notification to the employee (duplicate title+message skipped). Reject does not require an HR comment; comments are stored only when supplied.

2026-09-18 — Employee Alerts screens show an empty state. No notification HTTP API exists; sample leave/punch events were removed so the UI does not imply live data.

2026-08-27 — Extracted from source documentation.
