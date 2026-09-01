# Documentation

Permanent project documentation for the Leave Application & Attendance Management System.

## Read order for AI work

1. `AGENTS.md` (repo root)
2. `memory.md` (repo root)
3. This index
4. The feature / API / database file for the task
5. Existing code

## Status legend

| Label | Meaning |
| --- | --- |
| **Confirmed** | Explicitly stated in the BRD refinement (requirement IDs such as AUTH-01, BR-12). |
| **Proposed** | Engineering interpretation or later implementation pack. Not signed policy. |
| **Clarification Required / Open Question** | BRD does not define behavior enough. |
| **Future** | Not MVP. |
| **Assumption / TD** | Technical decision in the engineering pack. Requires confirmation where noted. |
| **Conflict** | Two sources disagree. Do not silently pick a side. |

Source requirements were **not yet business-confirmed**. Later schema and API sections are a blueprint, not a signed contract.

## Current vs planned

| Area | Current repo | Documentation |
| --- | --- | --- |
| Mobile | Expo shell, mock auth | `ui/current-mobile.md` |
| Backend | Three-module folder scaffold (placeholders) | `architecture/overview.md`, ADR-0008 |
| API / DB | Not implemented | `api/`, `database/` (**Proposed**) |

## Contents

- [Architecture](architecture/overview.md)
- [Features](features/auth-and-roles.md)
- [API (Proposed)](api/overview.md)
- [Database (Proposed)](database/overview.md)
- [Security](security/model.md)
- [UI](ui/current-mobile.md)
- [Testing](testing/strategy.md)
- [Deployment](deployment/environments.md)
- [Decisions](decisions/ADR-0001-express-supabase-stack.md) (through [ADR-0008](decisions/ADR-0008-three-backend-modules.md))
- [Out of scope](features/out-of-scope.md)

Empty `docs/` at the repository root is unused legacy. Do not treat `ai-input/` as live truth after this transfer.
