# Leave types

## Status

Confirmed LV-TYPE-01–07. **Not implemented.**

## Purpose

Configurable leave categories. Seed Casual, Sick, Emergency, Planned. HR create/edit/deactivate/delete.

## Users and Roles

All authenticated users can read types needed to apply (Proposed: employees see active only). Admin mutates.

## Scope

Paid vs unpaid; extra types (Unpaid, Maternity, Paternity, Compensatory) via **configuration**, not hardcoded (LV-TYPE-05). Gender eligibility: males cannot apply for maternity (LV-TYPE-06). Leave without prior information = unpaid (LV-TYPE-07).

## Out of Scope

Leave balances / entitlements (not defined). Hardcoded maternity/paternity modules.

## Business Rules

DELETE only if unused; otherwise deactivate (Proposed schema rule). Sick as `is_medical` is TD-11 — HR must agree.

## API Endpoints

Proposed: `GET/POST /leave-types`, `PATCH/DELETE /leave-types/{id}`.

## Validation Rules

Unique code. `allowed_sex` null = all, or female for maternity (Proposed).

## Open Questions

Per-type `max_advance_days` vs org default (LV-DATE-07).

## Change History

2026-08-27 — Extracted from source documentation.
