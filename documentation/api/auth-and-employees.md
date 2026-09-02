# Auth, employees, org, documents (Proposed)

Auth, leave types, and documents are not implemented. **Department, employee, holiday, and organisation-settings HTTP APIs are implemented** under `/api/v1` against `backend/prisma/schema.prisma` (integer IDs, not pack UUIDs). Role checks (A/G/self) are **not** enforced yet — AUTH-10 is still Open. Error JSON is produced only by `errorMiddleware` (see [overview](overview.md)).

Bodies listed only where the pack specified them, plus fields required by the Prisma models.

## Departments (not in the pack inventory; required by Prisma `Department`)

| Method | Path | Purpose | Auth |
| --- | --- | --- | --- |
| GET | `/departments` | List (`page`, `pageSize`, `includeObsolete`) | unimplemented |
| POST | `/departments` | `{departmentName}` → 201 | unimplemented |
| GET | `/departments/{id}` | Get | unimplemented |
| PATCH | `/departments/{id}` | `{departmentName?, obsolete?}` | unimplemented |

Soft-obsolete via PATCH. No DELETE. Default list omits `obsolete: true`. Pagination default 20, max 100 (Proposed; unconfirmed).

## Auth

| Method | Path | Purpose | Auth |
| --- | --- | --- | --- |
| POST | `/auth/login` | Email/password → `{accessToken, expiresIn, user}` | public |
| POST | `/auth/refresh` | Refresh session | refresh token |
| POST | `/auth/logout` | End session → 204 | Bearer * |
| POST | `/auth/forgot-password` | Reset email; 204 always (TD) | public |
| POST | `/auth/update-password` | `{newPassword}` | Bearer * |
| GET | `/auth/me` | Current user + employee | Bearer * |

Security: rate-limit login (Proposed). Do not log passwords.

## Employees

| Method | Path | Purpose | Auth |
| --- | --- | --- | --- |
| GET | `/employees` | List (`department` = departmentId, `isActive`, `page`, `pageSize`) | A G (not enforced) |
| POST | `/employees` | Create employee; hashes `password` into `passwordHash`; no Auth user table | A (not enforced) |
| GET | `/employees/{id}` | Get | A G or self (not enforced) |
| PATCH | `/employees/{id}` | Update/deactivate (`obsolete`, `status`) | A (not enforced) |

Employee JSON never includes `passwordHash`. `isActive=true` maps to `obsolete=false`. Prisma requires `departmentId` (pack said department nullable). `role` is `employee` \| `admin` \| `guest_admin`. `status` defaults to `ACTIVE`. Duplicate email → 409 `EMAIL_IN_USE`. Password min length 8 is a **TD** (AUTH-10 provisioning Open).

## Leave types

| Method | Path | Purpose | Auth |
| --- | --- | --- | --- |
| GET | `/leave-types` | List (E: active only) | * |
| POST | `/leave-types` | Create | A |
| PATCH | `/leave-types/{id}` | Edit/deactivate | A |
| DELETE | `/leave-types/{id}` | Delete if unused | A |

## Org settings and holidays

Implemented (no JWT/RBAC). Holidays use Prisma `Holiday` (`holidayId`, `holidayName`, `holidayDate` UNIQUE). POST body is pack `{date, name}`. Duplicate date → 409 `CONFLICT`. DELETE → 204.

Org settings use Prisma `ConfigurationSetting` key-value (`settingCategory` = `organisation`), not a pack `org_settings` table. GET returns defaults when keys are missing (`timezone` `America/New_York`, `graceMinutes` 0, `medicalDocOptional1To2Days` true, `medicalDocExceedsDays` 2, `maxAdvanceDays` 4 TD). `workStart`/`workEnd` are `HH:MM` or null. `weeklyOffDow` is ISO 1–7. Leave day-count is **not** applied here.

| Method | Path | Purpose | Auth |
| --- | --- | --- | --- |
| GET | `/org-settings` | Policy/hours | unimplemented |
| PATCH | `/org-settings` | Configure | unimplemented |
| GET | `/holidays` | List `from`,`to` | unimplemented |
| POST | `/holidays` | `{date, name}` → 201 | unimplemented |
| DELETE | `/holidays/{id}` | Remove → 204 | unimplemented |

## Documents

| Method | Path | Purpose | Auth |
| --- | --- | --- | --- |
| POST | `/documents` | multipart file, optional kind | E A |
| GET | `/documents/{id}` | Download; medical 403 for employee | A G; E own non-medical |
