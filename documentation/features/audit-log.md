# Audit log

## Status

AUD-01 / BR-12 Confirmed (every change recorded). Actor/time/before-after/scope Proposed. Who can view Open. **Not implemented.**

## Purpose

Traceability for leave, attendance, documents, and configuration changes.

## Users and Roles

Viewing the audit API is **Clarification Required** (AUD-08). Pack recommends admin only, not guest_admin.

## Scope

Every change (BR-12). Proposed fields: actor, time, before/after JSON, request id, ip. Append-only; no UPDATE/DELETE on audit rows (Proposed).

## API Endpoints

Proposed `GET /audit`.

## Database Impact

Proposed `audit_events`.

## Security Risks

Audit payloads must not store passwords or medical file bytes. MEDICAL download should itself be an audit action (TD).

## Open Questions

AUD-08 who can view. AUD-02–07 detailed field list Proposed.

## Change History

2026-08-27 — Extracted from source documentation.
