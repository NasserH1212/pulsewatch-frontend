import { request } from './client'
import type { Monitor } from './types'

export async function getMonitors(): Promise<Monitor[]> {
  return request<Monitor[]>('/api/monitors')
}
