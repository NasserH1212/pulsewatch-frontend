export type Role = 'ADMIN' | 'VIEWER'

export interface User {
  id: string
  name: string
  email: string
  role: Role
}

export type MonitorType = 'HTTP' | 'PORT' | 'PING'
export type CheckStatus = 'UP' | 'DOWN'

export interface Check {
  id: string
  status: CheckStatus
  responseTimeMs: number | null
  checkedAt: string
}

export interface Monitor {
  id: string
  name: string
  type: MonitorType
  target: string
  intervalSeconds: number
  failureThreshold: number
  paused: boolean
  lastStatus: CheckStatus | null
  lastCheckedAt: string | null
  consecutiveFailures: number
  createdAt: string
  checks?: Check[]
}

export interface Incident {
  id: string
  startedAt: string
  resolvedAt: string | null
  cause: string
}

export interface ApiErrorDetail {
  field: string
  message: string
}

export interface ApiErrorBody {
  error: string
  details?: ApiErrorDetail[]
}

// Payload of the `check:update` socket event. `status` is the confirmed
// monitor state; `checkStatus` is the raw result of this one check.
export interface CheckUpdatePayload {
  monitorId: string
  status: CheckStatus | null
  checkStatus: CheckStatus
  consecutiveFailures: number
  responseTimeMs: number | null
  checkedAt: string
}
