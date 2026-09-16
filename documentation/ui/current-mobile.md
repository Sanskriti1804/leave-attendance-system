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

The employee attendance home shows the IST clock, shift state, punch controls, today’s metrics, and workforce actions. Its **View All Attendance** action opens `/attendance`, an IST-formatted monthly ledger with month navigation, status filters, pagination, and an attendance-detail sheet. It reads the employee-only `/api/v1/attendance/me` endpoint.

## Theme tokens (from design.md)

primary `#000000`, background/secondary `#FFFFFF`, text `#111111`, muted `#6B7280`, error `#DC2626`, border `#E5E7EB`. System fonts.
