# PulseWatch frontend

[![CI](https://github.com/NasserH1212/pulsewatch-frontend/actions/workflows/ci.yml/badge.svg)](https://github.com/NasserH1212/pulsewatch-frontend/actions/workflows/ci.yml)
![React](https://img.shields.io/badge/React-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

React dashboard for the [PulseWatch uptime-monitoring API](https://github.com/NasserH1212/pulsewatch-backend): live monitor status over WebSockets, with the access token kept in memory and a single-flight refresh that respects the backend's refresh-token rotation.

## Stack

Vite + React + TypeScript (strict) · Tailwind CSS · React Router · TanStack Query ·
socket.io-client · Vitest + React Testing Library · ESLint.

## Getting started

1. Start the [backend](https://github.com/NasserH1212/pulsewatch-backend) (port 4000): `npm run dev` in `../pulsewatch-backend`.
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

## License

[MIT](LICENSE)
