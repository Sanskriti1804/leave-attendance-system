# Environments and deployment

## Facts

There is **no** CI/CD, Dockerfile, or hosting config in the repository. The source pipeline listed CI/CD and Deployment but did not specify a host, cloud, or pipeline.

## Proposed (unsigned engineering pack)

- Local, Staging, Production = **separate Supabase projects**.
- Never share service-role keys across environments.
- Migrations via Supabase CLI `supabase/migrations`; timestamped filenames; do not edit applied files in place; no destructive production rollback — forward migrations only.
- First admin created **out-of-band**.
- Seed: four leave types (Casual, Sick, Emergency, Planned) plus one `org_settings` row.
- The pack said not to implement migrations in that documentation phase.

## Existing app run (implemented)

- Mobile: `cd mobile && npm start` (Expo). Use Expo Go matching SDK 54.
- Backend: no start script and no `index.js`; cannot run a server yet.

## Operational jobs (Proposed)

Unmarked attendance reminder (NOTIF-06) and missing logout (NOTIF-07). Schedules (NOTIF-12) are **Clarification Required**. Pack: persist notifications in the transaction; send email after commit.
