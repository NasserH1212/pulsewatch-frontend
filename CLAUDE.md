# PulseWatch frontend

React dashboard for the PulseWatch uptime-monitoring API. The backend lives in
`../pulsewatch-backend` (github.com/NasserH1212/pulsewatch-backend); its README and
`src/modules/` are the source of truth for the API. Portfolio project for a co-op
application, so code quality, security, accessibility and tests matter.

## Stack

Vite + React + TypeScript (strict) · Tailwind CSS · React Router · TanStack Query ·
Recharts · socket.io-client · Vitest + React Testing Library · ESLint.
Use current stable versions and follow the docs of the version actually installed.

## Running (Windows, PowerShell)

- The backend must be running: `npm run dev` in `../pulsewatch-backend` (port 4000).
- `npm run dev` here serves the app on http://localhost:5173.
- The Vite dev server proxies `/api` and `/socket.io` (with `ws: true`) to
  http://localhost:4000. The app only calls relative URLs (`/api/...`), so there
  is no CORS or cross-site cookie problem in development.
- `npm run lint`, `npm test` and `npm run build` must pass before you finish.

## Backend API

Errors are always `{ error: string, details?: { field, message }[] }`. `details`
comes with 400s from validation: show each message under its form field.

| Method | Path | Who | Body / result |
|---|---|---|---|
| POST | `/api/auth/register` | anyone | `{ name, email, password }` → 201 `{ id, name, email }` (role VIEWER) |
| POST | `/api/auth/login` | anyone | `{ email, password }` → `{ accessToken, user }`, sets refresh cookie |
| POST | `/api/auth/refresh` | cookie | → `{ accessToken, user }`, rotates the cookie; 401 = logged out |
| POST | `/api/auth/logout` | cookie | → 204, clears the cookie |
| GET | `/api/auth/me` | logged in | → `user` = `{ id, name, email, role: 'ADMIN' \| 'VIEWER' }` |
| GET | `/api/monitors` | logged in | → `Monitor[]`, each with `checks: [latestCheck]` |
| GET | `/api/monitors/:id` | logged in | → `Monitor` with `checks` (last 100, newest first) and `incidents` (last 20) |
| GET | `/api/monitors/:id/stats?period=24h\|7d\|30d` | logged in | → `{ period, totalChecks, uptimePercent \| null, avgResponseTimeMs \| null, incidentCount, downtimeSeconds }` |
| POST | `/api/monitors` | ADMIN | `{ name, type: 'HTTP'\|'PORT'\|'PING', target, intervalSeconds?, failureThreshold? }` → 201 `Monitor` |
| PATCH | `/api/monitors/:id` | ADMIN | any of `{ name, target, intervalSeconds, failureThreshold, paused }` → `Monitor` (type can't change) |
| DELETE | `/api/monitors/:id` | ADMIN | → 204 |

`Monitor` = `{ id, name, type, target, intervalSeconds, failureThreshold, paused,
lastStatus: 'UP'|'DOWN'|null, lastCheckedAt, consecutiveFailures, createdAt }`.
`Check` = `{ id, status: 'UP'|'DOWN', responseTimeMs, checkedAt }`.
`Incident` = `{ id, startedAt, resolvedAt | null, cause }`.
Target formats: HTTP `https://example.com/health`, PORT `db.example.com:5432`,
PING `8.8.8.8` or `example.com`. `intervalSeconds` 10–86400 (default 60),
`failureThreshold` 1–10 (default 2).
Rate limits: login 10 per 15 min, register 5 per hour, refresh 60 per 15 min.

## Auth rules (important)

- The access token (15 min) lives in memory only. Never put it in localStorage or
  sessionStorage.
- The refresh token is an httpOnly cookie scoped to `/api/auth`. JavaScript can't
  read it; same-origin requests send it automatically.
- On app load, call `POST /api/auth/refresh` to restore the session.
- On a 401 from any other call: refresh once, retry the request once, and if the
  refresh fails, clear everything and go to the login page.
- **Single-flight refresh is required.** The backend rotates refresh tokens and
  treats a reused token as theft: it revokes every session of that user. Two
  refresh calls at the same time therefore log the user out. Every refresh must
  go through one shared in-flight promise. React StrictMode runs effects twice in
  development, so this guard must hold there too. Cover it with a test.
- ADMIN can create, edit, pause and delete monitors; VIEWER is read-only. Hide
  admin controls from VIEWER (the backend enforces it regardless).
- Logout: call `/api/auth/logout`, drop the token and clear the query cache.

## Live updates (Socket.io)

- Connect through the proxy with `auth` as a function that returns the current
  access token, so every reconnect sends a fresh one.
- The server disconnects a socket when its token expires. After a server-side
  disconnect (`reason === 'io server disconnect'`) socket.io does not reconnect on
  its own: refresh the token (same single-flight refresh), then `socket.connect()`.
  Do the same on `connect_error` with message `Unauthorized`.
- Event `check:update` → `{ monitorId, status, checkStatus, consecutiveFailures,
  responseTimeMs, checkedAt }`. `status` is the confirmed state (`'UP' | 'DOWN' |
  null`); `checkStatus` is the raw result of that single check. Merge each event
  into the TanStack Query cache instead of refetching the list.
- There are no socket events for create, edit, pause or delete: invalidate the
  relevant queries after those mutations.

## How to show status

- `paused` → "Paused" (gray). `lastStatus` null → "Pending". UP → green, DOWN → red.
- UP with `consecutiveFailures > 0` → "Checking" (amber): a failure is being confirmed.
- Never use color alone: always pair it with a text label or icon.
- Relative times ("2 min ago") with the exact time on hover.

## Conventions

- `src/api/` (fetch client, typed endpoints, `types.ts` mirroring the backend),
  `src/auth/`, `src/hooks/`, `src/components/`, `src/pages/`.
- Accessible by default: labelled inputs, real buttons, visible keyboard focus.
- Responsive down to phone width.
- Tests for the API client, auth flow and pure helpers (status, formatting).
- Comments explain why, not what.

## Safety rules

- Do not commit or push. Stop when the work is done; Nasser reviews and commits.
- No secrets in the frontend and no `.env` needed for development.
- Don't change the backend from here. If the frontend needs a backend change,
  stop and describe it.

## Working with Nasser

Nasser is a software engineering student. When you finish, explain what you built
and how to try it in short, simple Gulf Arabic, keeping technical terms in English.
