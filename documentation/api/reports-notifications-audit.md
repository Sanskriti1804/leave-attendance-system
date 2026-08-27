# Reports, notifications, audit API (Proposed)

Not implemented.

## Notifications

| Method | Path | Purpose | Auth |
| --- | --- | --- | --- |
| GET | `/notifications` | In-app list | * |
| POST | `/notifications/{id}/read` | Mark read | owner |

## Reports

`GET /reports/{slug}` — A G (TD until REP-15 signed). Format `xlsx|csv|pdf`.

Slugs: `leave-employee`, `leave-department`, `leave-monthly`, `leave-type`, `leave-decisions`, `attendance-daily`, `attendance-monthly`, `attendance-employee`, `attendance-late`, `attendance-missing-logout`.

## Audit

| Method | Path | Purpose | Auth |
| --- | --- | --- | --- |
| GET | `/audit` | Audit viewer | A; AUD-08 Open |
