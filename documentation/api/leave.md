# Leave API

Leave applications are implemented under `/api/v1/leaves` against Prisma integer IDs. Leave types and documents remain out of this module except lookup/count used by validation.

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

Body: `{ leaveTypeId, reason, selectedDates: [{ date, session }] }` where `session` is `FULL_DAY` \| `FIRST_HALF` \| `SECOND_HALF`. `startDate` / `endDate` / `numberOfDays` are derived from selections. Overlap of `SUBMITTED` / `PENDING_HR_REVIEW` / `APPROVED` → 409 `LEAVE_OVERLAP`. Rejected overlap returns `warnings`. Advance window from `LEAVE_MAX_ADVANCE_DAYS` and `APP_TIMEZONE`.

## Change History

2026-09-04 — Leave applications, zigzag selections, in-app manager approval, status history.
