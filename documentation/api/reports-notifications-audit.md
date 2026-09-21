# Reports, notifications, audit API (Proposed)

Notifications list is implemented. Reports and audit GET remain unimplemented.

## Notifications

| Method | Path | Purpose | Auth |
| --- | --- | --- | --- |
| GET | `/api/v1/notifications` | In-app list (own rows) | authenticated |
| POST | `/notifications/{id}/read` | Mark read | owner (Proposed, not implemented) |

## Reports

`GET /reports/{slug}` — A G (TD until REP-15 signed). Format `xlsx|csv|pdf`.

Slugs: `leave-employee`, `leave-department`, `leave-monthly`, `leave-type`, `leave-decisions`, `attendance-daily`, `attendance-monthly`, `attendance-employee`, `attendance-late`, `attendance-missing-logout`.

## Audit

| Method | Path | Purpose | Auth |
| --- | --- | --- | --- |
| GET | `/audit` | Audit viewer | A; AUD-08 Open |
