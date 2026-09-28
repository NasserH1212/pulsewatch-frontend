import { rawRequest, request, setAccessToken } from './client'
import type { User } from './types'

export async function register(name: string, email: string, password: string): Promise<User> {
  return rawRequest<{ id: string; name: string; email: string }>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
  }).then((user) => ({ ...user, role: 'VIEWER' }))
}

export async function login(email: string, password: string): Promise<User> {
  const result = await rawRequest<{ accessToken: string; user: User }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
  setAccessToken(result.accessToken)
  return result.user
}

export async function logout(): Promise<void> {
  await request<void>('/api/auth/logout', { method: 'POST' })
  setAccessToken(null)
}
