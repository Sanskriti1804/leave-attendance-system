# Audit log

## Status

AUD-01 / BR-12 Confirmed (every change recorded). Actor/time/before-after/scope Proposed. Who can view Open. **Write path implemented** for leave, employee, department, holiday, org-settings, leave-type, and document mutations. Attendance punch/correction audit writes already existed and were not changed. `GET /api/v1/audit` is admin-only while AUD-08 remains Open.

## Purpose

Traceability for leave, attendance, documents, and configuration changes.

## Users and Roles

Viewing the audit API is **Clarification Required** (AUD-08). Pack recommends admin only, not guest_admin.

## Scope

Every change (BR-12). Proposed fields: actor, time, before/after JSON, request id, ip. Append-only; no UPDATE/DELETE on audit rows (Proposed).

## API Endpoints

Implemented `GET /api/v1/audit` (admin only; pagination). Guest_admin and employees receive 403.

## Database Impact

Proposed `audit_events`.

## Security Risks

Audit payloads must not store passwords or medical file bytes. MEDICAL download should itself be an audit action (TD).

## Open Questions

AUD-08 who can view. AUD-02–07 detailed field list Proposed.

## Change History

2026-09-21 — Audit writes on leave status changes and org configuration mutations. Admin GET list. Attendance punch/correction audit writes were already present and were not changed.

2026-08-27 — Extracted from source documentation.
