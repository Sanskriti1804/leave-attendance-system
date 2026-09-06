# Leave types

## Status

Confirmed LV-TYPE-01–07. **HTTP implemented** for Prisma `LeaveType` (`allowedSex` nullable). Eligibility is enforced server-side when applying for leave.

## Purpose

Configurable leave categories. Seed Casual, Sick, Emergency, Planned. HR create/edit/deactivate/delete.

## Users and Roles

All authenticated users can read types needed to apply (employees see non-obsolete by default). Admin mutates. `guest_admin` is read-only.

## Scope

Paid vs unpaid; extra types (Unpaid, Maternity, Paternity, Compensatory) via **configuration**, not hardcoded (LV-TYPE-05). Gender eligibility: males cannot apply for maternity (LV-TYPE-06) when `allowedSex` is `female`. Leave without prior information = unpaid (LV-TYPE-07) is not a separate type module.

## Out of Scope

Leave balances / entitlements (not defined). Hardcoded maternity/paternity modules.

## Business Rules

DELETE only if unused; otherwise deactivate (`obsolete`). Sick as medical uses `requiresMedicalDocument` (Sick as `is_medical` remains TD-11).

## API Endpoints

Implemented: `GET/POST /api/v1/leave-types`, `GET/PATCH/DELETE /api/v1/leave-types/{id}`.

## Validation Rules

`allowedSex` null or `unspecified` = all; `male` / `female` restricts by `Employee.sex`. Values: `male`, `female`, `unspecified`. Pack unique `code` is not on the live Prisma model.

## Open Questions

Per-type `max_advance_days` vs org default (LV-DATE-07).

## Change History

2026-09-04 — Implemented leave-type CRUD, `allowedSex`, and eligibility used by leave applications.
2026-08-27 — Extracted from source documentation.
