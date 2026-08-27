# Auth, employees, org, documents (Proposed)

None of these endpoints exist in code. Bodies listed only where the pack specified them.

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
| GET | `/employees` | List (`department`, `isActive`, page) | A G |
| POST | `/employees` | Provision Auth + users + employees | A |
| GET | `/employees/{id}` | Get | A G or self |
| PATCH | `/employees/{id}` | Update/deactivate | A |

## Leave types

| Method | Path | Purpose | Auth |
| --- | --- | --- | --- |
| GET | `/leave-types` | List (E: active only) | * |
| POST | `/leave-types` | Create | A |
| PATCH | `/leave-types/{id}` | Edit/deactivate | A |
| DELETE | `/leave-types/{id}` | Delete if unused | A |

## Org settings and holidays

| Method | Path | Purpose | Auth |
| --- | --- | --- | --- |
| GET | `/org-settings` | Policy/hours | * |
| PATCH | `/org-settings` | Configure | A |
| GET | `/holidays` | List `from`,`to` | * |
| POST | `/holidays` | `{date, name}` | A |
| DELETE | `/holidays/{id}` | Remove | A |

## Documents

| Method | Path | Purpose | Auth |
| --- | --- | --- | --- |
| POST | `/documents` | multipart file, optional kind | E A |
| GET | `/documents/{id}` | Download; medical 403 for employee | A G; E own non-medical |
