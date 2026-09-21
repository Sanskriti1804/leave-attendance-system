# Current mobile UI

Facts from the repository. Not a product design spec.

## Stack

Expo SDK 54, Expo Router 6, React 19, React Native 0.81, TypeScript. Theme from MaxStarter (`mobile/public/design.md` → `mobile/src/maxstarter/theme/`).

## Navigation

```text
Stack (header hidden)
  /                 splash (~1800ms) → replace /login
  /login            email/password + Login + Pass (dev)
  /(tabs)
    index           Employee attendance home
    profile         Profile
    settings        Settings
  /attendance       Employee attendance ledger
```

Files: `mobile/app/_layout.tsx`, `mobile/app/index.tsx`, `mobile/app/login.tsx`, `mobile/app/(tabs)/`.

## Components

`Button` (primary/secondary, loading), `Input`, `AppIcon` (Ionicons). Barrel: `mobile/components/index.ts`.

## Auth UX

Client-side validation: non-empty email/password, email contains `@`. Errors shown on the form. Success navigates to tabs and stores a mock session in memory. `getSession()` is null until login in the current JS runtime; splash goes to login on a cold start.

## Assets

- `mobile/public/logo.png` — tiny placeholder
- `mobile/public/design.md` — colors, splash duration, login/home copy
- `mobile/src/maxstarter/Logo.tsx`, `assets.ts`

MaxStarter owns `src/maxstarter/` and `MAXSTARTER:BEGIN/END` regions.

## Domain UI

`frontend/` Expo Router app (Stitch-aligned):

- Splash `/` and Login `/login`
- Employee: Home `/(tabs)`, Leave `/leave/list`, Apply `/leave/apply`, Attendance `/(tabs)/attendance` (monthly ledger via `/api/v1/attendance/me`; `/attendance` redirects here), corrections `/attendance-corrections`, Alerts `/(tabs)/notifications`, Profile `/(tabs)/profile`
- Admin / guest_admin: Dashboard `/admin`, Leave review `/leave/admin-review`, People `/people`, Reports `/reports`, More `/settings`. From More: `/admin-profile`, `/org-settings` (GET live; PATCH admin-only).

Expo tab bar is hidden. Roles use the shared pill bottom nav. Leave APIs are live. Guest admin leave review is read-only. Medical GET remains forbidden for employees (MED-09). Home punch buttons call `POST /api/v1/attendance/check-in` and `check-out`, with enabled/disabled state from `GET /api/v1/attendance/me/dashboard`. Attendance history/corrections call live endpoints. Notification list is an empty state because notification HTTP APIs are not implemented. Reports remain a stub for the same reason.

Sticky `TopNavBar` uses the page gradient plus a bottom boundary so scrolled content sits under the header, not over title/controls. Login shows **LAMS SCG** at the top with **Version 4.12.0** at the bottom and a themed Forgot Password dialog (existing `/forgot-password` API). Apply Leave shows **Approver — S Raman**. Profile hero is a large centered photo/initials with name below; Employee tag is on Work Information. Employee Leave lists name then Leave Records without a gray wrap around chips. Alerts keep My Updates / Yesterday with simpler attendance copy.

On **web** (`expo start --web`), the same routes render a separate desktop UI under `frontend/src/web/` (sidebar + content canvas). Mobile screen files under `frontend/src/modules/` are unchanged. Shared services and `/api/v1` calls are reused. Attendance history and correction requests have web counterparts that call the same live endpoints.

Leave list and apply keep live `/api/v1` leave calls. Admin review approve/reject is admin-only; guest_admin is read-only. Medical document bytes are not fetched for employees (MED-09). Apply Leave uploads via `POST /api/v1/documents` after the file picker. Home punch buttons use live check-in/check-out and dashboard APIs; reports APIs are not implemented.

## Theme tokens (live `frontend/src/theme`)

Ink primary `#1A1A1A`, cream canvas `#F3EEE6`, teal accent `#0F766E`, session blue `#2563EB`. Page gradient blends sand, cream, teal wash, and mist. Shared chrome: ink/teal bottom nav, dark web sidebar, editorial kickers, restrained radii (8–10px), left-accent surfaces. Attendance punch logic is unchanged; Home clock/punch chrome is visual only.
