# Backend API testing

How to exercise the live Express APIs in a realistic order (Postman, Insomnia, or curl). Contract details also live under `documentation/api/`.

Base URL: `http://localhost:3000`  
JSON APIs: `http://localhost:3000/api/v1`  
Auth header: `Authorization: Bearer <accessToken>`

---

## 0. Start the stack

From the **repo root**:

```bash
docker compose up -d
```

From **`backend/`** (needs `backend/.env` with `DATABASE_URL` pointing at that Postgres):

```bash
npx prisma migrate deploy
npm run seed
npm start
```

Automated suite (needs DB): `npm test`

Leave dates must fall in **today … today + 14 calendar days** in `APP_TIMEZONE` (default `America/New_York`). Use `YYYY-MM-DD`.

---

## Seed accounts

| Role | Email | Password |
| --- | --- | --- |
| admin | `alice.admin@example.com` | `AdminPassword123!` |
| employee | `bob.employee@example.com` | `EmployeePassword123!` |
| guest_admin | `charlie.guest@example.com` | `GuestPassword123!` |

Seed also creates department **Engineering** and leave types **Casual**, **Sick**, **Emergency**, **Planned**.

`guest_admin` may **GET** org-wide data; mutations should return **403**.

---

## 1. Health

`GET /health/health` → `{ "status": "ok", "message": "Server is Healthy" }`  
(No auth. Path is `/health` + router `/health`.)

---

## 2. Auth

Keep three tokens: Alice, Bob, Charlie.

1. `POST /api/v1/auth/login` `{ "email": "...", "password": "..." }` → save `accessToken` and `refreshToken`.
2. `GET /api/v1/auth/me` (Bearer) → current employee.
3. `POST /api/v1/auth/refresh` `{ "refreshToken": "..." }` → new pair; old refresh is invalid.
4. `POST /api/v1/auth/change-password` (Bearer) `{ "currentPassword": "...", "newPassword": "NewPass123!" }` then log in with the new password (or seed again to restore).
5. `POST /api/v1/auth/forgot-password` `{ "email": "bob.employee@example.com" }` → always 200; reset **token is emailed** (not in JSON). Without SMTP, use `npm test` (`test-all-apis.ts`) for that path.
6. `POST /api/v1/auth/reset-password` `{ "token": "<from email>", "newPassword": "ResetPass123!" }`
7. `POST /api/v1/auth/logout` (Bearer) optional `{ "refreshToken": "..." }` → **204**.

Login is rate-limited (10 / 15 min).

---

## 3. Org setup (admin)

Use **Alice**.

1. `GET /api/v1/departments` then `POST /api/v1/departments` `{ "departmentName": "QA" }` → `departmentId`.
2. `GET /api/v1/departments/:id` / `PATCH /api/v1/departments/:id` `{ "departmentName": "QA Lab" }`.
3. `GET /api/v1/org-settings` then `PATCH /api/v1/org-settings` e.g. `{ "medicalDocOptional1To2Days": true, "maxAdvanceDays": 14 }`.
4. `POST /api/v1/holidays` `{ "date": "YYYY-MM-DD", "name": "Test Holiday" }` (date inside the 14-day window if you will test holiday exclusion). `GET /api/v1/holidays?from=&to=` / `DELETE /api/v1/holidays/:id`.

---

## 4. Employees (admin)

1. `GET /api/v1/employees`
2. Create a **manager**, then a **reporter** (needed for in-app manager approval):

```json
POST /api/v1/employees
{
  "firstName": "Mgr",
  "lastName": "One",
  "email": "mgr.one@example.com",
  "password": "ManagerPass123!",
  "departmentId": <engineeringId>,
  "role": "employee",
  "sex": "male"
}
```

```json
POST /api/v1/employees
{
  "firstName": "Emp",
  "lastName": "Two",
  "email": "emp.two@example.com",
  "password": "Employee2Pass123!",
  "departmentId": <engineeringId>,
  "role": "employee",
  "managerId": <mgr.one employeeId>,
  "sex": "female"
}
```

3. `GET /api/v1/employees/:id` — owner, admin, or guest_admin.
4. `PATCH /api/v1/employees/:id` e.g. `{ "sex": "female" }`.
5. Confirm Bob **cannot** `GET /api/v1/employees` (403) and **cannot** read another employee’s id (403).

---

## 5. Leave types and policies (admin)

1. `GET /api/v1/leave-types` → note `leaveTypeId` for Casual and Sick.
2. Optional: `POST /api/v1/leave-types` `{ "name": "Maternity", "allowedSex": "female" }`.
3. `PATCH /api/v1/leave-types/:id` / `DELETE /api/v1/leave-types/:id` (unused → 204; in use → deactivated).
4. `POST /api/v1/leave-policies` `{ "leaveTypeId": <sickId>, "medicalDocumentAfterDays": 2 }`.
5. `GET /api/v1/leave-policies?leaveTypeId=` / `PATCH /api/v1/leave-policies/:id`.

Guest may GET these; POST/PATCH/DELETE → 403.

---

## 6. Leave application — casual (happy path)

Log in as **emp.two** (has a manager). Dates = tomorrow (or any day in the 14-day window).

1. `POST /api/v1/leaves`

```json
{
  "leaveTypeId": <casualId>,
  "reason": "Personal work",
  "selectedDates": [{ "date": "YYYY-MM-DD", "session": "FULL_DAY" }]
}
```

Expect **201**, `status: SUBMITTED`, `managerApprovalStatus: PENDING`. Save `leaveId`.

2. `GET /api/v1/leaves/:id` and `GET /api/v1/leaves/:id/history`
3. Log in as **mgr.one** → `POST /api/v1/leaves/:id/manager-approve` `{}` → `PENDING_HR_REVIEW`
4. Log in as **Alice** → `POST /api/v1/leaves/:id/approve` `{ "comment": "OK" }` → `APPROVED`  
   Alice **cannot** approve her **own** leave (`SELF_APPROVAL_FORBIDDEN`); her self-submit auto-approves.

### Other transitions (use a **new** leave / dates to avoid overlap)

| Who | Call | Typical result |
| --- | --- | --- |
| Manager | `POST .../manager-reject` `{ "comment": "No" }` | `REJECTED` |
| Owner | `POST .../withdraw` | `WITHDRAWN` |
| Owner or admin | `POST .../cancel` | `CANCELLED` |
| Employee with **no** manager | `POST /leaves` | `PENDING_HR_REVIEW` |
| Admin on **own** leave | `POST /leaves` | `APPROVED` immediately |

Drafts: `POST /leaves/drafts` → `PATCH /leaves/:id` → `POST /leaves/:id/submit`.

Sessions: `FULL_DAY` \| `FIRST_HALF` \| `SECOND_HALF`. Zigzag example: several `selectedDates` (only those days count). Overlap of SUBMITTED / PENDING_HR_REVIEW / APPROVED → **409** `LEAVE_OVERLAP`. First half + second half on the **same** date is allowed.

---

## 7. Medical leave + documents

Sick type requires a document when calculated days **> 2** (or 1–2 days if org `medicalDocOptional1To2Days` is `false`).

1. Employee: `POST /api/v1/leaves/drafts` with Sick and **three** `FULL_DAY` dates → `leaveId`.
2. `POST /api/v1/documents` as **multipart**: field `leaveId`, field `file` (PDF / JPG / JPEG / PNG).
3. `POST /api/v1/leaves/:id/submit`.
4. `GET /api/v1/documents/:id` — **employee 403** for medical files; **admin / guest_admin 200** (file bytes).

Direct `POST /leaves` for required medical leave **without** a prior upload → **422** `MEDICAL_DOCUMENT_REQUIRED`.

---

## 8. Suggested negative checks

- No token / bad token → 401.
- Guest `POST` departments, employees, holidays, leave-types, policies, documents → 403.
- Male employee + Maternity `allowedSex: female` → 422 `LEAVE_TYPE_NOT_ELIGIBLE`.
- Date beyond `maxAdvanceDays` → 422 `TOO_FAR_AHEAD`.
- Duplicate punch of the same blocking leave dates → 409 `LEAVE_OVERLAP`.

---

## Roles cheat sheet

| | employee | admin | guest_admin |
| --- | --- | --- | --- |
| Own leave / punches (when built) | yes | own + org | read org |
| Org mutations | no | yes | no |
| Medical document download | no | yes | yes |
| Approve HR leave | no | yes (not own) | no |
| Manager approve | only if snapshot reporting manager | — | no |
