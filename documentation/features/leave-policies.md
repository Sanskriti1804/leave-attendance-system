# Leave policies

## Status

**Implemented** HTTP API for Prisma `LeavePolicy`. Org-level leave defaults live in organisation settings (`maxAdvanceDays` default 14 from `LEAVE_MAX_ADVANCE_DAYS`, medical 1–2 day optionality, weekend/holiday exclusion). Holiday dates remain in the shared holidays module (owner-provided Indian calendar; not generated).

## Purpose

Per-leave-type rules (`medicalDocumentAfterDays`, weekend/holiday flags, `maxDays`) plus a single place for leave applications and documents to read org leave configuration.

## Users and Roles

Authenticated users can GET. Admin creates/updates. `guest_admin` is read-only.

## Scope

Preserve existing `LeavePolicy` fields. Medical-document threshold uses `medicalDocumentAfterDays` with org `medicalDocExceedsDays` fallback. Do not invent a second medical-policy table. Do not store holiday lists on the policy.

## Out of Scope

Leave type CRUD. Automatic holiday calendars. Per-type max-advance override (LV-DATE-07 still Open). Enforcing `maxDays` on submit.

## API Endpoints

`GET/POST /api/v1/leave-policies`, `GET/PATCH /api/v1/leave-policies/{id}`.

## Change History

2026-09-04 — Implemented leave-policy module; advance window 14 days via env + org settings; medical rules consumed by leave documents.
