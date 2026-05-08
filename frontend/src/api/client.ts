import { getApiBaseUrl } from './env'

const BASE_URL = getApiBaseUrl()

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, init)
  if (!response.ok) {
    const body = await response.json().catch(() => null)
    const message = body?.error ?? `API error ${response.status}: ${response.statusText}`
    throw new Error(message)
  }
  return response.json() as Promise<T>
}
