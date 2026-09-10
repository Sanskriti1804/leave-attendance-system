# Medical documents

## Status

Confirmed MED-01–05, MED-09. Size/retention/day-count interpretation Open. **Upload and medical-submit rules implemented.** No automated retention.

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

Implemented: `POST /api/v1/documents` multipart (`leaveId`, `file`); `GET /api/v1/documents/{id}` download.

## Database Impact

Prisma `LeaveDocument` metadata including `contentType` and `fileSize` (CHECK > 0). Bytes on local disk under `LEAVE_DOCUMENTS_DIR`.

## Validation Rules

Allowlist MIME/extensions and magic bytes for PDF, JPEG, PNG. Technical cap 10 MiB (TD-17) until MED-06 decided. Empty files rejected.

## Authorization Rules

Employee medical GET forbidden.

## Security Risks

Path traversal; oversize uploads; filename leaking in logs; unsigned URLs.

## Open Questions

MED-06 max size. MED-10 retention. MED-12 “exceeding two days” vs weekends/holidays (TD-24: `calculated_days > 2`).

## Change History

2026-09-04 — Implemented upload/download, `contentType`/`fileSize`, medical submit rules using `LeavePolicy.medicalDocumentAfterDays` and org settings. No retention job.
2026-08-27 — Extracted from source documentation.
