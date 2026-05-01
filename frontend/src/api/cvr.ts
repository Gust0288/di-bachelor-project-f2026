import type { CvrResult } from '../pages/Wizard/wizard.types'
import { apiFetch } from './client'

export function lookupByVat(vat: string): Promise<CvrResult> {
  return apiFetch<CvrResult>(`/cvr/lookup?vat=${encodeURIComponent(vat)}`)
}

export function lookupByName(name: string): Promise<CvrResult> {
  return apiFetch<CvrResult>(`/cvr/lookup?name=${encodeURIComponent(name)}`)
}
