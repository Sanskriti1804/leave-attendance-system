# Backend API testing

How to run automated coverage of the **implemented** Express routes, and how to import the Postman collection for manual checks. Contracts: [API overview](../api/overview.md).

This is **not** a signed test specification. Test framework choice remains a **Pending Decision**; the suite uses Node `assert` + `tsx` (`backend/test-all-apis.ts`).

Attendance HTTP APIs exist but were not changed in this integration pass. Notifications, report GET, and audit list/mark-read are covered by `test-all-apis.ts`.

---

## Prerequisites

1. PostgreSQL available (`docker compose up -d` from the repo root).
2. `backend/.env` with `DATABASE_URL` (never commit this file).
3. From `backend/`:

```bash
npx prisma migrate deploy
npm run seed
```

Leave dates must fall in **today … today + maxAdvanceDays** in `APP_TIMEZONE` (default `Asia/Kolkata`). Use `YYYY-MM-DD`.

---

## Automated suite (all live APIs)

Starts an in-process Express app on an ephemeral port. Creates isolated employees/types (email/name suffix) and deletes them afterwards.

```bash
cd backend
npm run test:apis
```

Script: `backend/test-all-apis.ts`.

Cases include (multiple per area):

| Area | Examples |
| --- | --- |
| Health / 404 | `GET /health/health`; unknown `/api/v1` path |
| Auth | login validation/401, `/me`, refresh rotation, forgot/reset, change-password, logout |
| Departments | 401, list, guest/employee cannot POST/PATCH, create/get/patch, missing id 404 |
| Employees | employee cannot list or read another id (403); admin create/patch; guest cannot POST |
| Org settings | GET; guest cannot PATCH; empty body 422 |
| Holidays | range validation, guest cannot POST/DELETE, duplicate date 409, DELETE 204 |
| Leave types | GET, guest cannot POST, CRUD unused type |
| Leave policies | GET as guest, POST/PATCH as admin |
| Leaves | 401/422, `TOO_FAR_AHEAD`, `LEAVE_TYPE_NOT_ELIGIBLE`, overlap 409, owner vs other (404), history, manager approve/reject, HR approve/reject, withdraw, cancel, drafts |
| Documents | medical required without file, multipart upload, guest cannot upload, employee cannot GET medical (403), admin/guest can download |

`npm test` runs the same suite as `npm run test:apis` (`backend/test-all-apis.ts` only).

---

## Postman collection

Files (import these; they **are** the export):

- `backend/postman/Leave-Attendance-API.postman_collection.json`
- `backend/postman/local.postman_environment.json`

Copies for the documentation tree: `documentation/testing/postman/`.

### Import

1. Start the API: `npm start` in `backend/` (default `http://localhost:3000`).
2. Postman → **Import** → select both JSON files.
3. Select environment **Leave Attendance Local**.
4. Run folder **0. Auth — login (run first)** so access tokens are stored on the environment.
5. Run other folders, or use **Collection Runner**.

### Seed accounts (after `npm run seed`)

| Role | Email | Password |
| --- | --- | --- |
| admin | `alice.admin@example.com` | `AdminPassword123!` |
| employee | `bob.employee@example.com` | `EmployeePassword123!` |
| employee | `dana.employee@example.com` | `EmployeePassword123!` |
| employee | `eve.employee@example.com` | `EmployeePassword123!` |
| guest_admin | `charlie.guest@example.com` | `GuestPassword123!` |

Set `leaveDate` to a civil date inside the advance window. Set `leaveTypeId` / `sickLeaveTypeId` / `departmentId` from GET responses (seed types: Casual, Sick, Emergency, Planned). Seed also creates organisation settings, holidays, one leave policy per type, Bob/Dana/Eve reporting to Alice, sample leave rows (`[seed] …` reasons), attendance punches, and attendance-correction requests (pending / approved / rejected).

### What the collection covers

Every mounted route under `/health` and `/api/v1`, with happy-path and negative requests (no token, guest mutations, validation errors). Multipart document upload uses Postman’s form-data `file` field — attach a small PDF/JPG/PNG locally.

Password change / reset requests are included but **will alter seed passwords** if you send them; prefer the automated script for those paths.

Login is rate-limited (10 / 15 min). Collection Runner on the login folder can hit 429.

---

## Change History

| Date | Change |
| --- | --- |
| 2026-09-15 | Seed: extra employees Dana/Eve, more leave rows, attendance punches and correction requests. |
| 2026-09-15 | Seed: org settings, holidays, leave policies, manager link, sample leave applications. |
| 2026-09-09 | Added `npm run test:apis`, Postman collection + local environment, this page. |
| 2026-09-09 | Removed per-module `test-auth.ts` / leave `tsx` scripts; `npm test` is `test-all-apis.ts` only. |
