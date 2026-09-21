# Leave API

Leave applications are implemented under `/api/v1/leaves` against Prisma integer IDs. Leave types are under `/api/v1/leave-types`. Documents are under `/api/v1/documents`.

| Method | Path | Purpose | Auth |
| --- | --- | --- | --- |
| POST | `/leaves` | Submit selected dates | E A (own) |
| POST | `/leaves/drafts` | Save draft | E A (own) |
| GET | `/leaves` | List | E own; A G all; reporting manager can GET by id |
| GET | `/leaves/{id}` | Detail | owner, reporting manager, A, G |
| GET | `/leaves/{id}/history` | Status history (read-only) | same as detail |
| PATCH | `/leaves/{id}` | Edit draft | E/A owner |
| POST | `/leaves/{id}/submit` | Draft → workflow | owner |
| POST | `/leaves/{id}/manager-approve` | In-app manager approve | reporting manager snapshot |
| POST | `/leaves/{id}/manager-reject` | In-app manager reject | reporting manager snapshot |
| POST | `/leaves/{id}/approve` | HR approve | A (not own leave) |
| POST | `/leaves/{id}/reject` | HR reject `{comment?}` | A (not own leave) |
| POST | `/leaves/{id}/withdraw` | Withdraw | owner |
| POST | `/leaves/{id}/cancel` | Cancel | owner or A |

Body: `{ leaveTypeId, reason, selectedDates: [{ date, session }] }` where `session` is `FULL_DAY` \| `FIRST_HALF` \| `SECOND_HALF`. `startDate` / `endDate` / `numberOfDays` are derived from selections. Leave JSON includes `documents` and `statusHistory`. Status transitions write `LeaveStatusHistory` and BR-12 `AuditLog`. Overlap of `SUBMITTED` / `PENDING_HR_REVIEW` / `APPROVED` → 409 `LEAVE_OVERLAP`. Rejected overlap returns `warnings`. Advance window from organisation `maxAdvanceDays` (default `LEAVE_MAX_ADVANCE_DAYS` / 14) and organisation `timezone` (default `APP_TIMEZONE`). Medical leave uses `LeaveType.requiresMedicalDocument`, `LeavePolicy.medicalDocumentAfterDays` (fallback `medicalDocExceedsDays`), and `medicalDocOptional1To2Days`. Weekend/holiday exclusion uses org `leaveCountExcludesWeekends` / `leaveCountExcludesHolidays` plus `Holiday` rows, overridden per type when that type’s active policy has `includeWeekends` / `includeHolidays` true. Submit is blocked with `MEDICAL_DOCUMENT_REQUIRED` when a document is mandatory and none is attached to the draft. Immediate `POST /leaves` cannot attach a file in the same request.

## Leave types

| Method | Path | Purpose | Auth |
| --- | --- | --- | --- |
| GET | `/leave-types` | List; query `includeObsolete` (employees see active by default) | * |
| POST | `/leave-types` | Create `{ name, description?, requiresMedicalDocument?, allowedSex? }` | A |
| GET | `/leave-types/{id}` | Detail | * |
| PATCH | `/leave-types/{id}` | Update fields or `obsolete` | A |
| DELETE | `/leave-types/{id}` | Delete if unused; otherwise deactivate (`obsolete`) | A |

`allowedSex` is `male` \| `female` \| `unspecified` or null (unrestricted). Eligibility is enforced in the leave-types module and applied on leave application create/submit (`LEAVE_TYPE_NOT_ELIGIBLE`).

## Leave policies

| Method | Path | Purpose | Auth |
| --- | --- | --- | --- |
| GET | `/leave-policies` | List; query `leaveTypeId`, `includeObsolete` | * |
| POST | `/leave-policies` | Create `{ leaveTypeId, medicalDocumentAfterDays?, includeWeekends?, includeHolidays?, maxDays? }` | A |
| GET | `/leave-policies/{id}` | Detail | * |
| PATCH | `/leave-policies/{id}` | Update fields or `obsolete` | A |

## Documents

| Method | Path | Purpose | Auth |
| --- | --- | --- | --- |
| POST | `/documents` | multipart `leaveId` + `file` (PDF/JPG/JPEG/PNG) | E A (own draft, or admin on a draft) |
| GET | `/documents/{id}` | Download bytes; medical 403 for employee | A G; E own non-medical |

Stored metadata: `contentType` (MIME), `fileSize` (bytes > 0), `fileType` (extension), `fileName`, `filePath` (local disk under `LEAVE_DOCUMENTS_DIR`). Cap `LEAVE_DOCUMENT_MAX_BYTES` default 10 MiB (TD-17). No retention/deletion job.

## Change History

2026-09-20 — Leave list for employees includes reporting-manager queue. Leave responses include document metadata. Submit notifies manager/HR.

2026-09-09 — Leave day-count reads active `LeavePolicy.includeWeekends` / `includeHolidays` from the database (org exclude flags still apply when those are false).
2026-09-04 — Leave types CRUD and `allowedSex` eligibility consumed by leave applications.
2026-09-04 — Leave policies API; advance window and medical rules resolved through the leave-policies module.
2026-09-04 — Leave documents upload/download, medical-document submit rules.
2026-09-04 — Leave applications, zigzag selections, in-app manager approval, status history.
