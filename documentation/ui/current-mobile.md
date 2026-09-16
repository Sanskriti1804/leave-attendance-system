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
- Employee: Home `/(tabs)`, Leave `/leave/list`, Apply `/leave/apply`, Attendance `/(tabs)/attendance` and `/attendance` (monthly ledger via `/api/v1/attendance/me`), corrections `/attendance-corrections`, Alerts `/(tabs)/notifications`, Profile `/(tabs)/profile`
- Admin / guest_admin: Dashboard `/admin`, Leave review `/leave/admin-review`, People `/people`, Reports `/reports`, More `/settings`. From More: `/admin-profile`, `/org-settings` (GET live; PATCH admin-only).

Expo tab bar is hidden. Roles use the shared pill bottom nav. Leave APIs are live. Guest admin leave review is read-only. Medical GET remains forbidden for employees (MED-09). Home punch buttons are still local simulation; attendance history/corrections call live endpoints.

## Theme tokens (from design.md)

primary `#000000`, background/secondary `#FFFFFF`, text `#111111`, muted `#6B7280`, error `#DC2626`, border `#E5E7EB`. System fonts.
