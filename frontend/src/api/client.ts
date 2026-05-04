import { getApiBaseUrl } from './env'

const BASE_URL = getApiBaseUrl()

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, init)
  if (!response.ok) {
    throw new Error(`API error ${response.status}: ${response.statusText}`)
  }
  return response.json() as Promise<T>
}
