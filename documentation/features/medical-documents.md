# Medical documents

## Status

Confirmed MED-01–05, MED-09. Size/retention/day-count interpretation Open. **Not implemented.**

## Purpose

Attach supporting files to medical leave (and other kinds in the Proposed schema).

## Users and Roles

Employee uploads on own leave. Only HR/Admin view/download medical docs (MED-09 Confirm). Proposed: guest_admin may GET medical; employee may GET own **non-medical** files.

## Scope

Mandatory for medical leave **exceeding two days** (BR-03). Optional for 1–2 days per company policy (BR-05). Formats PDF, JPG, JPEG, PNG (BR-06). Block submit if mandatory doc missing (BR-04).

## Out of Scope

Storing medical bytes in notification payloads. Public buckets.

## Business Rules

BR-03–06. Notify if medical missing before submit (NOTIF Confirmed).

## API Endpoints

Proposed: `POST /documents` multipart; `GET /documents/{id}` download.

## Database Impact

Proposed `documents` metadata; bytes in Storage `leave-documents`.

## Validation Rules

Allowlist MIME/extensions. Proposed magic-byte check. Technical cap 10 MiB (TD-17) until MED-06 decided.

## Authorization Rules

Employee medical GET forbidden.

## Security Risks

Path traversal; oversize uploads; filename leaking in logs; unsigned URLs.

## Open Questions

MED-06 max size. MED-10 retention. MED-12 “exceeding two days” vs weekends/holidays (TD-24: `calculated_days > 2`).

## Change History

2026-08-27 — Extracted from source documentation.
