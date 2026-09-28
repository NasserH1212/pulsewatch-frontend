import { describe, expect, it } from 'vitest'
import type { Monitor } from '../api/types'
import { formatRelativeTime, getMonitorStatusDisplay, summarizeMonitors } from './status'

const baseMonitor: Monitor = {
  id: '1',
  name: 'API',
  type: 'HTTP',
  target: 'https://example.com',
  intervalSeconds: 60,
  failureThreshold: 2,
  paused: false,
  lastStatus: null,
  lastCheckedAt: null,
  consecutiveFailures: 0,
  createdAt: '2026-01-01T00:00:00.000Z',
}

const makeMonitor = (overrides: Partial<Monitor>): Monitor => ({ ...baseMonitor, ...overrides })

describe('getMonitorStatusDisplay', () => {
  it('shows Paused for a paused monitor regardless of its last status', () => {
    expect(
      getMonitorStatusDisplay(makeMonitor({ paused: true, lastStatus: 'DOWN', consecutiveFailures: 3 })),
    ).toEqual({ label: 'Paused', tone: 'paused' })
  })

  it('shows Pending when there is no check yet', () => {
    expect(getMonitorStatusDisplay(makeMonitor({ lastStatus: null }))).toEqual({
      label: 'Pending',
      tone: 'pending',
    })
  })

  it('shows Up for a healthy monitor', () => {
    expect(getMonitorStatusDisplay(makeMonitor({ lastStatus: 'UP', consecutiveFailures: 0 }))).toEqual({
      label: 'Up',
      tone: 'up',
    })
  })

  it('shows Checking when UP but a failure streak is still being confirmed', () => {
    expect(getMonitorStatusDisplay(makeMonitor({ lastStatus: 'UP', consecutiveFailures: 1 }))).toEqual({
      label: 'Checking',
      tone: 'checking',
    })
  })

  it('shows Down for a confirmed outage', () => {
    expect(getMonitorStatusDisplay(makeMonitor({ lastStatus: 'DOWN', consecutiveFailures: 2 }))).toEqual({
      label: 'Down',
      tone: 'down',
    })
  })
})

describe('summarizeMonitors', () => {
  it('counts monitors by state, with paused taking priority', () => {
    const monitors = [
      makeMonitor({ paused: true, lastStatus: 'UP' }),
      makeMonitor({ paused: false, lastStatus: 'UP' }),
      makeMonitor({ paused: false, lastStatus: 'DOWN' }),
      makeMonitor({ paused: false, lastStatus: null }),
    ]
    expect(summarizeMonitors(monitors)).toEqual({ total: 4, up: 1, down: 1, paused: 1 })
  })

  it('returns all zeros for an empty list', () => {
    expect(summarizeMonitors([])).toEqual({ total: 0, up: 0, down: 0, paused: 0 })
  })
})

describe('formatRelativeTime', () => {
  const now = new Date('2026-01-01T00:10:00Z').getTime()

  it('returns "Never" for a null timestamp', () => {
    expect(formatRelativeTime(null, now)).toBe('Never')
  })

  it('returns "Just now" for very recent checks', () => {
    expect(formatRelativeTime(new Date(now - 2_000).toISOString(), now)).toBe('Just now')
  })

  it('formats seconds', () => {
    expect(formatRelativeTime(new Date(now - 30_000).toISOString(), now)).toBe('30s ago')
  })

  it('formats minutes', () => {
    expect(formatRelativeTime(new Date(now - 5 * 60_000).toISOString(), now)).toBe('5 min ago')
  })

  it('formats hours', () => {
    expect(formatRelativeTime(new Date(now - 3 * 60 * 60_000).toISOString(), now)).toBe('3h ago')
  })

  it('formats days', () => {
    expect(formatRelativeTime(new Date(now - 2 * 24 * 60 * 60_000).toISOString(), now)).toBe('2d ago')
  })
})
