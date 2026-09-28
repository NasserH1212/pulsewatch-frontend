# PulseWatch frontend

React dashboard for the PulseWatch uptime-monitoring API (see `../pulsewatch-backend`).

## Stack

Vite + React + TypeScript (strict) · Tailwind CSS · React Router · TanStack Query ·
socket.io-client · Vitest + React Testing Library · ESLint.

## Getting started

1. Start the backend (port 4000): `npm run dev` in `../pulsewatch-backend`.
2. Install and run the frontend:

   ```
   npm install
   npm run dev
   ```

3. Open http://localhost:5173. The dev server proxies `/api` and `/socket.io`
   to the backend, so the app only ever calls relative URLs.

## Scripts

- `npm run dev` — start the Vite dev server
- `npm run lint` — ESLint
- `npm test` — run the Vitest suite once
- `npm run test:watch` — Vitest in watch mode
- `npm run build` — type-check and build for production

## What's here (phase 1)

- **Auth** (`src/api/client.ts`, `src/auth/`): the access token is kept in
  memory only; the refresh token is an httpOnly cookie. Session restore runs
  once on load, and any 401 triggers a single-flight refresh + one retry.
  Register creates an account (no session); log in afterwards.
- **Dashboard** (`src/pages/DashboardPage.tsx`): summary tiles (total, up,
  down, paused) and the monitor list, updated live over Socket.io
  (`check:update`) without refetching.

## Project layout

```
src/api/        fetch client, typed endpoints, types.ts (mirrors the backend)
src/auth/       AuthContext, ProtectedRoute
src/hooks/      useMonitors, useLiveMonitorUpdates
src/components/ presentational pieces (StatusBadge, MonitorList, ...)
src/pages/      LoginPage, RegisterPage, DashboardPage
src/lib/        pure helpers (status display, relative time, summaries)
```
