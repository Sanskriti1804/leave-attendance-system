# Attendance correction

## Status

Confirmed AT-COR-01–08, AT-COR-10. AT-COR-11 Confirmed **and** in conflict with stakeholder note / Proposed BR-20. **Not implemented.**

## Purpose

Employees request attendance changes; they cannot edit punches directly (BR-10, BR-11).

## Users and Roles

Employee creates requests for self. Admin reviews. Guest admin read (Proposed).

## Scope

Request includes date, type, times, reason, optional docs. HR approve/reject.

## Conflict — HR direct edit

| Source | Statement |
| --- | --- |
| Stakeholder extra | HR can only change attendance upon request |
| BR-11 Confirmed | Employee changes go through correction-request |
| AT-COR-11 Confirmed | HR/Admin **can** modify without a correction |
| BR-20 Proposed | HR should only modify via approved correction |
| Engineering pack | Implements employee corrections **and** `PATCH /attendance/{id}` for admin |

Do not implement admin PATCH as the only path or omit it as policy until a human chooses. See ADR-0007.

## API Endpoints

Proposed: `POST/GET /attendance/corrections`, `GET /attendance/corrections/{id}`, `POST .../approve|reject`.

## Database Impact

Proposed `attendance_corrections` + `correction_status_history`. Correction outcomes SUBMITTED/APPROVED/REJECTED are **technical necessity (TD)**. Partial unique one SUBMITTED per (employee, date) is TD.

## Validation Rules

Correction type closed list **Open** (AT-COR-03). When supporting doc required **Open** (AT-COR-07).

## Audit Events

AT-COR-12 audit of HR attendance changes is **Proposed** (BR-12 already Confirmed for every change).

## Open Questions

Correction types; docs required when; HR direct-edit policy.

## Change History

2026-08-27 — Extracted from source documentation.
