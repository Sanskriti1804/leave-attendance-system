# Database overview

**Entire schema is Proposed** (implementation pack). Concepts such as employees, leave applications, punches, documents, audit are implied by Confirmed BRD IDs; table/column lists are not signed.

There is **no applied migration**. Prisma models live at `backend/prisma/schema.prisma` (not signed BRD). CLI connection and migration path are in `backend/prisma.config.ts` (`DATABASE_URL` from `backend/.env`). The lists below remain the pack blueprint and may not match that file.

## Conventions (Proposed)

- UUID PK `gen_random_uuid()`; `users.id` = `auth.users.id`
- `created_at` / `updated_at`; mutable rows `row_version`
- Statuses `text` + CHECK
- JSON only on `audit_events.before_json` / `after_json`
- Instants `timestamptz` UTC; civil dates `date`

## Explicitly omitted

`leave_balances`, overtime, teams, permission/role tables, multi-tenant `org_id`, `LeaveApplicationDay`, Approval entity, multiple punches per day, Department table.

## Integrity notes

- Unique `(employee_id, work_date)` is technical integrity, not signed duplicate-punch UX.
- Complex rules in Express; RLS is defense in depth if using service role.
- Migrations required; no destructive prod rollback.

See [schema](schema.md) and [ERD](erd.md).
