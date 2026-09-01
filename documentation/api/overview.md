# API overview

**Entire inventory is Proposed** from the engineering pack. Not BRD-confirmed. Not implemented. Do not invent additional fields.

- Base path: `/api/v1`. Implemented so far: departments and employees (see [auth-and-employees](auth-and-employees.md)). Other inventory is still unimplemented.
- Pack assumed UUID ids; **live Prisma models use integer PKs**.
- Civil dates `YYYY-MM-DD` in org TZ; datetimes ISO-8601 UTC `Z` (Proposed)
- Pagination `page` / `pageSize` default 20 max 100 — **requires confirmation**
- `Idempotency-Key` on leave submit and punches — Proposed
- Optimistic concurrency `rowVersion` / `If-Match` — **requires confirmation**

## HTTP (Proposed)

200 GET/PATCH, 201 create, 204 logout/delete, 400 bad JSON, 401 token, 403 forbidden, 404 unknown id, 409 overlap/transition/duplicate/version, 422 validation, 429 rate limit.

## Error codes (Proposed)

`INVALID_CREDENTIALS`, `USER_INACTIVE`, `LEAVE_OVERLAP`, `MEDICAL_DOCUMENT_REQUIRED`, `MANAGER_PROOF_REQUIRED`, `LEAVE_TYPE_NOT_ELIGIBLE`, `TOO_FAR_AHEAD`, `LEAVE_DAYS_ZERO`, `LEAVE_INVALID_TRANSITION`, `VERSION_CONFLICT`, `ALREADY_CHECKED_IN`, `NO_CHECK_IN`, `FILE_TOO_LARGE`, `UNSUPPORTED_MEDIA_TYPE`, `SELF_APPROVAL_FORBIDDEN`, `EMAIL_IN_USE`.

## Role legend

`*` authenticated; `E` employee; `A` admin; `G` guest_admin; `public` unauthenticated.

## Not in this API

Leave-balance, overtime, Teams/Slack, manager-approve, LV-APP-18 HR-absence.

Files: [auth-and-employees](auth-and-employees.md), [leave](leave.md), [attendance](attendance.md), [reports-notifications-audit](reports-notifications-audit.md).
