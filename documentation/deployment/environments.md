# Environments and deployment

## Facts

There is **no** CI/CD, application Dockerfile, or hosting config. Local PostgreSQL 16 is defined in root `docker-compose.yml` (named volume, bind `127.0.0.1:5432`). Copy `.env.example` → `.env` and `backend/.env.example` → `backend/.env`. Do not commit those files. The source pipeline listed CI/CD and Deployment but did not specify a host, cloud, or pipeline.

## Proposed (unsigned engineering pack)

- Local, Staging, Production = **separate Supabase projects**.
- Never share service-role keys across environments.
- Migrations via Supabase CLI `supabase/migrations`; timestamped filenames; do not edit applied files in place; no destructive production rollback — forward migrations only.
- First admin created **out-of-band**.
- Seed: four leave types (Casual, Sick, Emergency, Planned) plus one `org_settings` row.
- The pack said not to implement migrations in that documentation phase.

## Existing app run (implemented)

- Postgres (local): from repo root, `docker compose up -d` then `docker compose ps`. Stop with `docker compose stop`. See commands in Change History below.
- Mobile: `cd mobile && npm start` (Expo). Use Expo Go matching SDK 54.
- Backend: from `backend/`, `npm start` (`tsx src/index.ts`, default port 3000). Requires `DATABASE_URL` in `backend/.env` matching Compose. Department and employee routes are live; other modules are still placeholders.

## Change History

| Date | Change |
| --- | --- |
| 2026-09-01 | `npm start` for Express; department and employee APIs on `/api/v1`. |
| 2026-09-01 | Added root `docker-compose.yml` for PostgreSQL 16 (`leave_management` / `app_user`). Credentials via `.env`, not YAML. Prisma schema and backend source unchanged. |

## Operational jobs (Proposed)

Unmarked attendance reminder (NOTIF-06) and missing logout (NOTIF-07). Schedules (NOTIF-12) are **Clarification Required**. Pack: persist notifications in the transaction; send email after commit.
