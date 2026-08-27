# Notifications

## Status

NOTIF-01–07 Confirmed. Teams/Slack Future. Reminder schedule Open. **Not implemented.**

## Purpose

Notify people about leave decisions, missing medical before submit, unmarked attendance, and missing logout.

## Users and Roles

Recipients are the involved employee and HR as implied by each event. In-app list is own notifications only (Proposed).

## Scope

Confirmed events: leave submit; approve; reject with comments; medical missing before submit; unmarked attendance; missing logout.

## Out of Scope

Microsoft Teams / Slack (NOTIF-10 Future).

## API Endpoints

Proposed: `GET /notifications`, `POST /notifications/{id}/read`.

## Database Impact

Proposed `notifications` with channels IN_APP | EMAIL. Payload jsonb must not include medical bytes.

## Open Questions

NOTIF-12 clock times for reminders. NOTIF-08/09/11 rows unrecoverable — do not invent. Email vs in-app only until channels are signed (pack TD: both).

## Change History

2026-08-27 — Extracted from source documentation.
