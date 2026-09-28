import { useQuery } from '@tanstack/react-query'
import { getMonitors } from '../api/monitors'
import { useAuth } from '../auth/AuthContext'

export const monitorsQueryKey = ['monitors'] as const

export function useMonitors() {
  const { status } = useAuth()
  return useQuery({
    queryKey: monitorsQueryKey,
    queryFn: getMonitors,
    enabled: status === 'authenticated',
  })
}
