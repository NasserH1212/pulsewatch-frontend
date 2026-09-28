import { useEffect, useState, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import * as authApi from '../api/auth'
import { refreshSession, setOnAuthFailure } from '../api/client'
import type { User } from '../api/types'
import { AuthContext, type AuthStatus } from './AuthContext'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [status, setStatus] = useState<AuthStatus>('loading')
  const queryClient = useQueryClient()

  useEffect(() => {
    setOnAuthFailure(() => {
      setUser(null)
      setStatus('unauthenticated')
      queryClient.clear()
    })

    refreshSession()
      .then((result) => {
        setUser(result.user)
        setStatus('authenticated')
      })
      .catch(() => {
        setStatus('unauthenticated')
      })

    return () => setOnAuthFailure(null)
  }, [queryClient])

  const login = async (email: string, password: string) => {
    const loggedInUser = await authApi.login(email, password)
    setUser(loggedInUser)
    setStatus('authenticated')
  }

  const register = async (name: string, email: string, password: string) => {
    await authApi.register(name, email, password)
  }

  const logout = async () => {
    await authApi.logout()
    setUser(null)
    setStatus('unauthenticated')
    queryClient.clear()
  }

  return (
    <AuthContext.Provider value={{ user, status, login, register, logout }}>{children}</AuthContext.Provider>
  )
}
