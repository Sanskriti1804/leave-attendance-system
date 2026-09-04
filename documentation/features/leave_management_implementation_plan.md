# Leave Management BRD Updates — Implementation Plan

This plan details the **documentation-only** changes required to align the existing Leave Management implementation plan with the corrected BRD decisions below. No code, schema, migration, or environment changes are included — only planning.

> [!IMPORTANT]
> Everything else in the existing Leave Management implementation plan remains **exactly as-is**. Only the sections below are modified or added.

---

## 1. Holiday Calendar

**Decision:** The system will use the **Indian holiday calendar**.

- The exact holiday list will be provided separately by the project owner.
- The existing `holidays` shared module (`backend/src/modules/shared/holidays/`) will be used to store and manage holiday data.
- Do not hardcode a different country's calendar. Do not auto-generate holidays from an external calendar.
- Holiday data will be loaded via the existing `POST /api/v1/holidays` API or seed script once the project owner provides the list.

> [!NOTE]
> Replaces the previous "Florida holiday calendar" reference. The Indian calendar is a project decision and should be reflected wherever the documentation references holiday data.

---

## 2. HR/Admin Self-Leave — Automatic Approval

**Decision:** HR/Admin users can apply for their own leave. Their application is **automatically approved by the system**.

- When an HR/Admin user submits a leave application where the applicant is themselves:
  - The application is created normally (all validations still apply).
  - The status transitions directly to `APPROVED` without manual HR review.
  - HR/Admin must **not** manually approve their own leave.
- The automatic approval transition must be recorded in `LeaveStatusHistory` (e.g., `SUBMITTED → APPROVED`, actor = system or the HR/Admin's own ID with a system flag).
- The normal `LeaveApplication` record is created and retained as with any other employee's leave.

**Affected service:** Leave Application service/workflow — add self-application detection based on the applicant's role.

---

## 3. Manager Approval — In-App Workflow

**Decision:** Manager approval is an **in-app feature**. It is **not** external, offline, or outside the application.

- The leave workflow supports a manager approval step **inside the application** before the HR review/approval step where applicable.
- The existing manager-related fields and workflow requirements in the BRD/implementation plan remain part of the Leave Management workflow:
  - `reporting_manager_employee_id` snapshot on `LeaveApplication`
  - `manager_approval_attested` or equivalent manager-approval state
  - Manager-related API endpoints and authorization
- If no reporting manager is assigned, the application goes directly to HR review (existing rule LV-WF-13 unchanged).

> [!WARNING]
> This corrects the previous plan which stated manager approval was "outside the application" (see `leave-workflow.md` line 21 and `out-of-scope.md` line 16). Those documentation references will need to be updated to reflect in-app manager approval when the broader documentation is revised.

**Affected documentation files (for future update, not now):**
- [leave-workflow.md](file:///a:/APP/SYMB/leave-attendance-system/documentation/features/leave-workflow.md) — lines 9, 21, 25
- [leave-application.md](file:///a:/APP/SYMB/leave-attendance-system/documentation/features/leave-application.md) — line 21
- [out-of-scope.md](file:///a:/APP/SYMB/leave-attendance-system/documentation/features/out-of-scope.md) — line 16

---

## 4. Leave Status History — New Module

**Decision:** Implement `LeaveStatusHistory` to record all leave-status transitions for audit purposes.

### Planned Schema

The existing proposed schema in [schema.md](file:///a:/APP/SYMB/leave-attendance-system/documentation/database/schema.md) (line 33–35) already defines `leave_status_history`. The Prisma model will be:

```prisma
model LeaveStatusHistory {
  historyId   Int      @id @default(autoincrement())
  leaveId     Int
  changedById Int?     // Employee who triggered the change (null for system actions)
  oldStatus   String?  @db.VarChar(30)
  newStatus   String   @db.VarChar(30)
  reason      String?
  changedAt   DateTime @default(now())

  leave     LeaveApplication @relation(fields: [leaveId], references: [leaveId], onDelete: Cascade)
  changedBy Employee?        @relation(fields: [changedById], references: [employeeId])

  @@index([leaveId])
}
```

### Planned Module Structure

Create a new folder: `backend/src/modules/leave-management/leave-status-history/`

| File | Purpose |
|------|---------|
| `route.ts` | Express router — read-only endpoints for querying history by leave ID |
| `controller.ts` | Request handling, delegates to service |
| `service.ts` | Business logic — creating history entries is **internal-only** (called by the leave application service during status transitions, not directly by external API callers) |
| `repository.ts` | Prisma queries for `LeaveStatusHistory` |
| `validation.ts` | Zod schemas for query parameters |

### Recorded Transitions

History must be created internally whenever a leave application's status changes:

- `DRAFT → SUBMITTED`
- `SUBMITTED → PENDING_HR_REVIEW`
- `PENDING_HR_REVIEW → APPROVED`
- `PENDING_HR_REVIEW → REJECTED`
- `SUBMITTED → APPROVED` (HR/Admin self-leave auto-approval)
- `* → CANCELLED`
- `* → WITHDRAWN`

Do **not** create arbitrary history-editing functionality. Records represent actual workflow transitions.

### Registration

Register the route in `app.ts` under `/api/v1/leave-status-history` (or nested under `/api/v1/leaves/:id/history`).

---

## 5. Employee — `sex` Field

**Decision:** Add a `sex` field to the `Employee` model because leave-type eligibility may depend on `allowedSex` (e.g., maternity leave restricted to female employees, per LV-TYPE-06).

### Planned Schema Change

```prisma
// Add to the Employee model:
sex String? @db.VarChar(10) // nullable; values: 'male', 'female', 'unspecified'
```

- Follows the existing proposed schema convention in [schema.md](file:///a:/APP/SYMB/leave-attendance-system/documentation/database/schema.md) line 15: `sex CHECK male|female|unspecified nullable`.
- The `LeaveType` model's `allowedSex` field (already in the proposed schema, line 19) will be used during leave-application validation to check eligibility.
- No unrelated Employee fields are added.

---

## 6. LeaveDocument — Metadata Fields

**Decision:** Add `contentType` and `fileSize` to the `LeaveDocument` model.

### Planned Schema Change

```prisma
// Add to the LeaveDocument model:
contentType String @db.VarChar(100)  // MIME type, e.g. 'application/pdf', 'image/jpeg'
fileSize    Int                       // File size in bytes
```

- Aligns with the existing proposed schema in [schema.md](file:///a:/APP/SYMB/leave-attendance-system/documentation/database/schema.md) line 39: `content_type`, `byte_size > 0`.
- Continue supporting formats: **PDF, JPG, JPEG, PNG**.
- No unrelated document fields are added.

---

## 7. Medical Document Rules

**Decision:** Keep the existing BRD rules (unchanged):

| Condition | Requirement |
|-----------|-------------|
| Medical leave **> 2 days** (`calculated_days > 2`) | Document **required** |
| Medical leave **1–2 days** | Document **optional** according to policy (`medical_doc_optional_1_to_2_days` in org settings) |

- Enforce these rules during the leave submission workflow.
- Block submission if a mandatory document is missing (BR-04).
- Do not create a separate medical-document policy system; use the existing `LeavePolicy.medicalDocumentAfterDays` and org settings configuration.

---

## 8. Maximum Advance Leave Date

**Decision:** Leave can be applied for **today through the next 14 calendar days**.

### Planned Configuration

```
APP_TIMEZONE=America/New_York
LEAVE_MAX_ADVANCE_DAYS=14
```

- Add `LEAVE_MAX_ADVANCE_DAYS` to `env.ts` with a default of `14`.
- Use this configuration in the leave-application validation service rather than hardcoding.
- Replaces the previous "½ week / approximately 4 days" interpretation (`max_advance_days` default 4 in the proposed schema).

> [!NOTE]
> This replaces the `max_advance_days default 4 (TD for ½ week)` in [schema.md](file:///a:/APP/SYMB/leave-attendance-system/documentation/database/schema.md) line 7. The org-settings default should be updated to `14`.

---

## 9. Leave Overlap — Status-Aware Rules

**Decision:** Overlap validation must consider the existing leave's status:

### Block Overlap

A new leave application must be **blocked** when an existing overlapping leave has any of these statuses:

- `SUBMITTED`
- `PENDING_HR_REVIEW`
- `APPROVED`

### Rejected Leave

If the overlapping leave is `REJECTED`:

- Do **not** block the new application.
- Show a **warning** that a previous application for those dates was rejected.
- Allow the employee to continue submitting.

### Cancelled / Withdrawn Leave

If the overlapping leave is `CANCELLED` or `WITHDRAWN`:

- These statuses do **not** reserve the dates.
- Do **not** block a new application.
- No warning is needed.

> [!NOTE]
> This resolves the open question in [leave-application.md](file:///a:/APP/SYMB/leave-attendance-system/documentation/features/leave-application.md) line 60: "LV-OVR-03/04 which statuses block overlap."

---

## 10. Half-Day Overlap

**Decision:** Overlap validation must consider the selected half-day session, not only the overall date range.

For the **same date**:

| Existing Leave | New Leave | Result |
|---------------|-----------|--------|
| `FIRST_HALF` | `SECOND_HALF` | ✅ Allowed |
| `FIRST_HALF` | `FIRST_HALF` | ❌ Blocked |
| `SECOND_HALF` | `SECOND_HALF` | ❌ Blocked |
| `FULL_DAY` | Any leave | ❌ Blocked |

> [!NOTE]
> This confirms the edge case in [leave-application.md](file:///a:/APP/SYMB/leave-attendance-system/documentation/features/leave-application.md) line 56: "Two half-days same date — TD-23 allows first+second."

---

## 11. Single-Day Leave Duration

**Decision:** Keep existing rules (unchanged):

- Full day → `1.0`
- First half → `0.5`
- Second half → `0.5`

No changes to the existing duration constants or calculation logic.

---

## 12. Multiple-Day Leave

**Decision:** Keep the existing multiple-day calculation and weekend/holiday behavior.

- Weekend and holiday inclusion/exclusion continues to use the existing organization settings.
- Holiday data will use the **Indian holiday list** provided by the project owner (see §1).
- Do **not** introduce sandwich-fill behavior (CAL-07 confirmed no).

---

## 13. Zigzag / Non-Consecutive Leave

**Decision:** Leave applications must support explicitly selected, non-consecutive dates.

### Example

| Date | Session | Duration |
|------|---------|----------|
| Sep 1 | First Half | 0.5 |
| Sep 2 | Full Day | 1.0 |
| Sep 5 | Second Half | 0.5 |

- Only explicitly selected dates count as leave. Do **not** infer leave for every date between `startDate` and `endDate`.
- The total `numberOfDays` is the sum of the individual date units.

### Planned Schema — `LeaveDateSelection`

```prisma
model LeaveDateSelection {
  id      Int      @id @default(autoincrement())
  leaveId Int
  date    DateTime @db.Date
  unit    Decimal  @db.Decimal(3, 1)  // 0.5 or 1.0
  session String   @db.VarChar(30)    // 'FIRST_HALF', 'SECOND_HALF', 'FULL_DAY'

  leave LeaveApplication @relation(fields: [leaveId], references: [leaveId], onDelete: Cascade)

  @@unique([leaveId, date])
}
```

### Relationship to Existing Fields

- `startDate` and `endDate` on `LeaveApplication` are **retained** as summary/query fields (min/max of selected dates).
- `numberOfDays` on `LeaveApplication` is **retained** as the computed sum of all `LeaveDateSelection.unit` values.
- These fields enable efficient date-range queries without joining `LeaveDateSelection`.

### Leave Application Service

- Accept an array of `{ date, session }` in the leave submission payload.
- Compute `unit` from `session` (`FULL_DAY` → 1.0, `FIRST_HALF`/`SECOND_HALF` → 0.5).
- Store individual rows in `LeaveDateSelection`.
- Derive `startDate`, `endDate`, `numberOfDays` from the selections.
- Overlap validation queries `LeaveDateSelection` to check session-level conflicts.

---

## 14. Timezone

**Decision:** Use `APP_TIMEZONE=America/New_York`.

### Planned Configuration

Add to `env.ts`:
```typescript
appTimezone: process.env.APP_TIMEZONE ?? "America/New_York",
```

### Existing Rules (Unchanged)

- Store timestamps in **UTC**.
- Use PostgreSQL `timestamptz` for all timestamps.
- Leave dates and holiday dates remain civil `date` values — do **not** convert leave dates into timestamps for timezone handling.
- Use the configured timezone for display/reporting where applicable.
- No per-employee timezone in v1.

---

## 15. Document Retention

**Decision:** No automated medical-document retention or deletion feature is required for the current release.

- Do **not** implement automatic document expiry.
- Do **not** implement scheduled deletion.
- Do **not** implement retention jobs.
- This may be revisited in a future release.

---

## 16. Planned Database Changes (Summary)

All changes will be applied through a **new forward Prisma migration**. The existing initial migration will **not** be modified.

| Model | Change | Type |
|-------|--------|------|
| `Employee` | Add `sex String? @db.VarChar(10)` | MODIFY |
| `LeaveType` | Add `allowedSex String? @db.VarChar(10)` | MODIFY |
| `LeaveDocument` | Add `contentType String @db.VarChar(100)` | MODIFY |
| `LeaveDocument` | Add `fileSize Int` | MODIFY |
| `LeaveApplication` | Add `updatedAt DateTime @updatedAt` | MODIFY |
| `LeaveApplication` | Add relations to `LeaveStatusHistory`, `LeaveDateSelection` | MODIFY |
| `Employee` | Add relation to `LeaveStatusHistory` (changedBy) | MODIFY |
| `LeaveStatusHistory` | New model (see §4) | NEW |
| `LeaveDateSelection` | New model (see §13) | NEW |

Existing `createdAt`, `updatedAt`, and `rowVersion` conventions apply where required.

Use the existing project's autoincrement integer IDs (matching the current `schema.prisma` conventions).

---

## 17. Migration Approach

> Create a new forward Prisma migration for the approved schema changes. Do not modify the existing initial migration.

After migration:
1. Generate the Prisma client.
2. Verify TypeScript builds (`npm run typecheck`).
3. Run the existing tests.

---

## 18. Environment / Configuration (Summary)

| Variable | Default | Purpose |
|----------|---------|---------|
| `APP_TIMEZONE` | `America/New_York` | Display/reporting timezone |
| `LEAVE_MAX_ADVANCE_DAYS` | `14` | Maximum calendar days in advance for leave applications |

Add to:
- `env.ts` — with defaults
- `.env` / `.env.example` — with values

---

## 19. Preservation Rule

> [!CAUTION]
> **Everything else in the existing Leave Management implementation plan remains unchanged.** No other architectural, database, folder-structure, API, workflow, or BRD changes are made unless directly required by the items above.

### Summary of Changes

| # | Change |
|---|--------|
| 1 | Indian holiday calendar (replacing Florida) |
| 2 | HR/Admin self-leave → automatic approval |
| 3 | Manager approval → in-app workflow (correcting "outside the app") |
| 4 | Leave Status History → new module under `leave-management/` |
| 5 | Employee `sex` field |
| 6 | LeaveDocument `contentType` and `fileSize` |
| 7 | Medical document rules (unchanged, restated for clarity) |
| 8 | 14-day maximum advance (replacing ½ week / 4 days) |
| 9 | Status-aware overlap behavior |
| 10 | Half-day session-aware overlap |
| 11 | Single-day duration (unchanged, restated for clarity) |
| 12 | Multiple-day calculation uses Indian holidays |
| 13 | Zigzag/non-consecutive leave-date support (`LeaveDateSelection`) |
| 14 | `America/New_York` timezone configuration |
| 15 | No automated document retention |
| 16 | Database migration for schema additions |
| 17 | Migration approach (forward only) |
| 18 | Environment configuration additions |
