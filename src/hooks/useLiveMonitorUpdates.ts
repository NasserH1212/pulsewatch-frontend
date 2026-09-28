import { useEffect } from 'react'
import { io } from 'socket.io-client'
import { useQueryClient } from '@tanstack/react-query'
import { getAccessToken, refreshSession } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import type { CheckUpdatePayload, Monitor } from '../api/types'
import { monitorsQueryKey } from './useMonitors'

// Merges `check:update` events into the monitors query cache instead of
// refetching the list - there are no socket events for create/edit/delete,
// those still go through query invalidation after their mutations.
export function useLiveMonitorUpdates() {
  const { status } = useAuth()
  const queryClient = useQueryClient()

  useEffect(() => {
    if (status !== 'authenticated') return

    // `auth` as a function is called on every (re)connect attempt, so a
    // reconnect after a token refresh always sends the current token.
    const socket = io({
      auth: (cb) => cb({ token: getAccessToken() ?? '' }),
    })

    // The server disconnects a socket when its access token expires and does
    // not reconnect on its own afterwards - refresh (single-flight, shared
    // with the API client) then reconnect manually.
    const reconnectWithFreshToken = () => {
      refreshSession()
        .then(() => socket.connect())
        .catch(() => {
          // Refresh failing here also fails it for every other call, which
          // triggers the API client's onAuthFailure and logs the user out.
        })
    }

    socket.on('disconnect', (reason) => {
      if (reason === 'io server disconnect') reconnectWithFreshToken()
    })

    socket.on('connect_error', (err) => {
      if (err.message === 'Unauthorized') reconnectWithFreshToken()
    })

    socket.on('check:update', (payload: CheckUpdatePayload) => {
      queryClient.setQueryData<Monitor[]>(monitorsQueryKey, (monitors) =>
        monitors?.map((monitor) =>
          monitor.id === payload.monitorId
            ? {
                ...monitor,
                lastStatus: payload.status,
                consecutiveFailures: payload.consecutiveFailures,
                lastCheckedAt: payload.checkedAt,
              }
            : monitor,
        ),
      )
    })

    return () => {
      socket.disconnect()
    }
  }, [status, queryClient])
}
