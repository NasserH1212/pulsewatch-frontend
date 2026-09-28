import type { ApiErrorBody, ApiErrorDetail } from './types'

// The access token lives in memory only (never localStorage/sessionStorage),
// so a page reload always starts from zero and relies on refreshSession().
let accessToken: string | null = null

export const getAccessToken = () => accessToken
export const setAccessToken = (token: string | null) => {
  accessToken = token
}

// Called once by AuthProvider so the client can react to a hard logout
// (refresh failed) without importing React/router code itself.
let onAuthFailure: (() => void) | null = null
export const setOnAuthFailure = (fn: (() => void) | null) => {
  onAuthFailure = fn
}

export class ApiError extends Error {
  status: number
  details?: ApiErrorDetail[]

  constructor(status: number, message: string, details?: ApiErrorDetail[]) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
  }
}

const parseBody = async (res: Response): Promise<unknown> => {
  const text = await res.text()
  return text ? JSON.parse(text) : undefined
}

// No retry logic: the building block every other function is written in
// terms of. Used directly by login/register/refresh, where a 401 means
// "bad credentials" or "logged out", not "needs a token refresh".
export async function rawRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers)
  if (init.body) headers.set('Content-Type', 'application/json')
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`)

  const res = await fetch(path, { ...init, headers, credentials: 'include' })
  if (res.status === 204) return undefined as T

  const body = (await parseBody(res)) as ApiErrorBody | T | undefined
  if (!res.ok) {
    const errorBody = body as ApiErrorBody | undefined
    throw new ApiError(res.status, errorBody?.error ?? 'Request failed', errorBody?.details)
  }
  return body as T
}

interface RefreshResult {
  accessToken: string
  user: import('./types').User
}

// Single-flight guard: every caller during an in-flight refresh awaits the
// same promise instead of firing its own request. The backend rotates
// refresh tokens and treats a reused token as theft (it revokes every
// session), so two concurrent refresh calls would log the user out. This
// must hold even when React StrictMode invokes effects twice, which it does
// because the promise is assigned synchronously before the first `await`.
let refreshPromise: Promise<RefreshResult> | null = null

export function refreshSession(): Promise<RefreshResult> {
  if (!refreshPromise) {
    refreshPromise = rawRequest<RefreshResult>('/api/auth/refresh', { method: 'POST' })
      .then((result) => {
        setAccessToken(result.accessToken)
        return result
      })
      .finally(() => {
        refreshPromise = null
      })
  }
  return refreshPromise
}

// For everything except login/register/refresh: on a 401, refresh once and
// retry the original request once. If the refresh itself fails, the session
// is gone - clear the token, tell the app, and surface the original error.
export async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  try {
    return await rawRequest<T>(path, init)
  } catch (err) {
    if (!(err instanceof ApiError) || err.status !== 401) throw err

    try {
      await refreshSession()
    } catch {
      setAccessToken(null)
      onAuthFailure?.()
      throw err
    }

    return rawRequest<T>(path, init)
  }
}
