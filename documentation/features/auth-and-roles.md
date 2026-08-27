# Auth and roles

## Status

Confirmed capability; values for session and provisioning Open. **Not implemented** (mock login only).

## Purpose

Separate Employee and HR/Admin capabilities; authenticate users; restrict data by role.

## Users and Roles

| ID | Rule | Status |
| --- | --- | --- |
| AUTH-01 | Separate Employee and HR/Admin capabilities | Confirmed |
| AUTH-02 | Employees access own leave and attendance | Confirmed |
| AUTH-03 | Employees cannot view others’ leave or attendance | Confirmed |
| AUTH-04 | HR/Admin org-wide access | Confirmed |
| AUTH-05 | HR/Admin manage employees | Confirmed |
| AUTH-06 | HR/Admin access medical documents | Confirmed |
| AUTH-07 | HR/Admin generate org reports | Confirmed |
| AUTH-08 | Distinguish HR vs Admin if separate; read-only called out | Confirmed |
| AUTH-09 | Three roles: employee, admin, guest admin | Confirmed |
| AUTH-10 | Email/password; session expiry, password management, provisioning shall be defined | Confirmed that it must be defined; **values Open** |

**Proposed mapping:** `employee` (own mutations), `admin` (full HR), `guest_admin` (org read-only, no mutations). `guest_admin` punches only if an employee row exists (TD-25).

## Scope

Login, session, password reset/update, `/me`, role checks on every API.

## Out of Scope

SSO / external IdP. Manager-as-approver inside the app.

## User Flow

See `documentation/architecture/authentication-flow.md`.

## Authorization Rules

Server-side only. Never trust client role. Employees: own resources. Admin: mutations. Guest admin: GET org data including medical (Proposed), no writes.

## Security Risks

Mock tokens; unguarded tabs; Pass bypass on login. Proposed 404 for foreign employee UUIDs needs confirmation.

## Open Questions

Session TTL; invite vs temporary password; self-approval of own leave by admin (pack recommends `SELF_APPROVAL_FORBIDDEN`).

## Change History

2026-08-27 — Extracted from source documentation.
