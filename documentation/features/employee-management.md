# Employee management

## Status

Confirmed EMP-01–04, EMP-06. **HTTP create/list/get/patch implemented** against Prisma `Employee` / `Department`. Authz, audit, and Auth provisioning are not implemented.

## Purpose

HR/Admin manage the employee directory used by leave and attendance.

## Users and Roles

Admin mutates. Guest admin may list/get (Proposed). Employees may get self (Proposed).

## Scope

Create/update/deactivate employees. Fields confirmed in BRD: name; department/team; reporting manager shown on leave form. Employees **may have no department and no manager**.

## Out of Scope (pack)

Department as a signed BRD entity. Teams as first-class records. Multi-company.

The **Prisma schema already has `Department`**, and employees require `departmentId`, so department APIs exist as engineering, not as a signed BRD table.

## Business Rules

- AUTH-05: HR/Admin manage employees.
- Soft-deactivate rather than delete Auth users in v1 is a **TD**, not BRD.
- `sex` used for maternity eligibility (LV-TYPE-06) — schema field is Proposed.

## API Endpoints

Implemented (Proposed contract, Prisma IDs): `GET/POST /api/v1/employees`, `GET/PATCH /api/v1/employees/{id}`. Departments: `GET/POST /api/v1/departments`, `GET/PATCH /api/v1/departments/{id}` because the live schema requires `departmentId`. See `documentation/api/auth-and-employees.md`.

## Database Impact

Proposed `users` + `employees` (1:1 with Auth UUID).

## Validation Rules

Email unique (Proposed). Department nullable. Manager FK optional SET NULL.

## Authorization Rules

Employee must not list the org directory (not granted by AUTH-02).

## Open Questions

Provisioning method (invite vs temp password).

## Change History

2026-09-01 — Implemented department and employee Express APIs (Prisma integer IDs; no RBAC/audit yet).
2026-08-27 — Extracted from source documentation.
