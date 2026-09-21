# Reports, notifications, audit API (Proposed)

Notifications list and mark-read are implemented. Audit GET is implemented for admin. Reports remain unimplemented.

## Notifications

| Method | Path | Purpose | Auth |
| --- | --- | --- | --- |
| GET | `/api/v1/notifications` | In-app list (own rows) plus `unreadCount` | authenticated |
| POST | `/api/v1/notifications/{id}/read` | Mark read | owner |

## Reports

`GET /reports/{slug}` — A G (TD until REP-15 signed). Format `xlsx|csv|pdf`.

Slugs: `leave-employee`, `leave-department`, `leave-monthly`, `leave-type`, `leave-decisions`, `attendance-daily`, `attendance-monthly`, `attendance-employee`, `attendance-late`, `attendance-missing-logout`.

## Audit

| Method | Path | Purpose | Auth |
| --- | --- | --- | --- |
| GET | `/api/v1/audit` | Audit viewer | A (guest_admin 403; AUD-08 still Open) |
