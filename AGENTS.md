# AGENTS.md

Universal rules for every AI coding task in this repository.

## Mandatory reading order

1. This file
2. `memory.md`
3. Relevant files under `documentation/`
4. Existing code in the area being changed

Do not implement from memory of other projects. This is a Leave Application & Attendance Management System.

## Documentation-first

- Product truth lives in `documentation/`. Status labels matter: **Confirmed**, **Proposed**, **Clarification Required**, **Future**, **Assumption**, **Technical Decision (TD)**, **Open Question**.
- Do not treat Proposed/TD items as signed business policy.
- Do not invent APIs, tables, fields, roles, workflows, or UI behavior.
- After transferring requirements, do not cite `ai-input/` as the permanent source of truth.

## Architecture

- Preserve the existing stack: Expo SDK 54 mobile app in `mobile/`, Express 5 (CommonJS) stub in `backend/`.
- Do not replace Expo with a web app, migrate backend to TypeScript, add frameworks, or restructure modules unless an ADR is approved.
- Reuse existing screens, components, theme tokens, and services before creating new ones.
- Business rules belong on the server, not only in the client.

## Security

- Never hardcode secrets. Never commit `.env` files or service-role keys.
- Never log passwords, tokens, OTPs, or medical document contents/filenames in info logs.
- Validate all external input. Enforce authorization server-side. Never trust client-provided role or ownership.
- Employees must not access other employees' leave/attendance (AUTH-03) or medical documents (MED-09).
- Record every change in the audit log when that capability exists (BR-12).

## Database and APIs

- Schema and `/api/v1` contracts in `documentation/` are a **Proposed** blueprint until approved.
- Schema changes require migrations. No in-place edits of applied migrations. No destructive production rollback — add a forward migration.
- Do not create leave-balance, overtime, payroll, multi-tenant `org_id`, or sandwich-fill behavior.
- Do not break existing API contracts without approval.

## Approval required

Ask a human before: destructive database changes; deleting production data; schema deletion; breaking API changes; authentication or authorization model changes; production configuration; major dependency replacements; architecture changes; irreversible migrations.

Ordinary isolated implementation does not need approval.

## Implementation

- Plan before coding. Prefer the smallest change that solves the task.
- Identify security, database, and API impact before editing.
- After implementation: test, review the diff, update matching documentation, update `memory.md` when project state changed.

## Testing

Do not claim a task complete without reporting: tests executed, passed, failed, skipped, and remaining risks. If tests cannot be run, say why. There is currently no test runner (Pending Decision).
