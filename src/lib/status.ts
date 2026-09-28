import type { Monitor } from '../api/types'

export type StatusTone = 'up' | 'down' | 'checking' | 'pending' | 'paused'

export interface StatusDisplay {
  label: string
  tone: StatusTone
}

// Mirrors CLAUDE.md "How to show status": paused wins over everything else,
// then a null lastStatus is "Pending", then UP with an unconfirmed failure
// streak reads as "Checking" rather than a flat green UP.
export function getMonitorStatusDisplay(
  monitor: Pick<Monitor, 'paused' | 'lastStatus' | 'consecutiveFailures'>,
): StatusDisplay {
  if (monitor.paused) return { label: 'Paused', tone: 'paused' }
  if (monitor.lastStatus === null) return { label: 'Pending', tone: 'pending' }
  if (monitor.lastStatus === 'UP') {
    return monitor.consecutiveFailures > 0
      ? { label: 'Checking', tone: 'checking' }
      : { label: 'Up', tone: 'up' }
  }
  return { label: 'Down', tone: 'down' }
}

export interface MonitorSummary {
  total: number
  up: number
  down: number
  paused: number
}

export function summarizeMonitors(monitors: Monitor[]): MonitorSummary {
  return monitors.reduce<MonitorSummary>(
    (acc, monitor) => {
      acc.total += 1
      if (monitor.paused) acc.paused += 1
      else if (monitor.lastStatus === 'UP') acc.up += 1
      else if (monitor.lastStatus === 'DOWN') acc.down += 1
      return acc
    },
    { total: 0, up: 0, down: 0, paused: 0 },
  )
}

const MINUTE = 60
const HOUR = MINUTE * 60
const DAY = HOUR * 24

// A short, human relative time ("2 min ago"). `now` is injectable for tests.
export function formatRelativeTime(iso: string | null, now: number = Date.now()): string {
  if (!iso) return 'Never'

  const diffSeconds = Math.round((now - new Date(iso).getTime()) / 1000)
  if (diffSeconds < 5) return 'Just now'
  if (diffSeconds < MINUTE) return `${diffSeconds}s ago`
  if (diffSeconds < HOUR) return `${Math.round(diffSeconds / MINUTE)} min ago`
  if (diffSeconds < DAY) return `${Math.round(diffSeconds / HOUR)}h ago`
  return `${Math.round(diffSeconds / DAY)}d ago`
}
