import { apiFetch } from './client'
import { getApiBaseUrl } from './env'

function adminHeaders(method?: string): HeadersInit {
  const token = sessionStorage.getItem('admin_token') ?? ''
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
  }
  if (method === 'POST' || method === 'PATCH') {
    headers['Content-Type'] = 'application/json'
  }
  return headers
}

export type RegistrationListItem = {
  id: string
  company_name: string
  cvr_number: string
  contact_name: string
  contact_email: string
  membership_type: string | null
  created_at: string
  status: 'pending' | 'approved' | 'rejected'
  reviewed_at: string | null
}

export type RegistrationDetail = RegistrationListItem & {
  contact_phone: string | null
  industry_code: string | null
  employee_count: number | null
  website: string | null
  address: { street: string; zip: string; city: string } | null
  answers: Record<string, unknown>
  reviewed_by: string | null
  notes: string | null
  reviewer_name: string | null
}

export type RegistrationDocument = {
  id: string
  file_name: string
  content_type: string
  file_size_bytes: number
  uploaded_at: string
}

export function listRegistrations(
  status?: 'pending' | 'approved' | 'rejected',
): Promise<RegistrationListItem[]> {
  const qs = status ? `?status=${status}` : ''
  return apiFetch<RegistrationListItem[]>(`/admin/registrations${qs}`, {
    headers: adminHeaders(),
  })
}

export function getRegistration(id: string): Promise<RegistrationDetail> {
  return apiFetch<RegistrationDetail>(`/admin/registrations/${id}`, {
    headers: adminHeaders(),
  })
}

export function getRegistrationDocuments(id: string): Promise<RegistrationDocument[]> {
  return apiFetch<RegistrationDocument[]>(`/admin/registrations/${id}/documents`, {
    headers: adminHeaders(),
  })
}

export function approveRegistration(
  id: string,
): Promise<{ id: string; status: string; reviewed_at: string }> {
  return apiFetch(`/admin/registrations/${id}/approve`, {
    method: 'POST',
    headers: adminHeaders('POST'),
  })
}

export function rejectRegistration(
  id: string,
  notes: string,
): Promise<{ id: string; status: string; reviewed_at: string; notes: string }> {
  return apiFetch(`/admin/registrations/${id}/reject`, {
    method: 'POST',
    headers: adminHeaders('POST'),
    body: JSON.stringify({ notes }),
  })
}

export type RegistrationUpdate = {
  company_name?: string
  contact_name?: string
  contact_email?: string
  contact_phone?: string | null
  industry_code?: string | null
  employee_count?: number | null
  website?: string | null
  address?: { street: string; zip: string; city: string } | null
}

export function updateRegistration(id: string, data: RegistrationUpdate): Promise<RegistrationDetail> {
  return apiFetch<RegistrationDetail>(`/admin/registrations/${id}`, {
    method: 'PATCH',
    headers: adminHeaders('PATCH'),
    body: JSON.stringify(data),
  })
}

export type AdminStats = {
  total: number
  pending: number
  approved: number
  rejected: number
}

export type RegistrationNote = {
  id: string
  content: string
  admin_name: string
  created_at: string
}

export type ActivityEntry = {
  type: 'approval' | 'rejection' | 'note' | 'edit' | 'application_started' | 'application_submitted'
  registration_id: string
  company_name: string
  admin_name: string | null
  content: string | null
  created_at: string
}

export function getStats(): Promise<AdminStats> {
  return apiFetch<AdminStats>('/admin/stats', { headers: adminHeaders() })
}

export function getNotes(registrationId: string): Promise<RegistrationNote[]> {
  return apiFetch<RegistrationNote[]>(`/admin/registrations/${registrationId}/notes`, {
    headers: adminHeaders(),
  })
}

export function addNote(registrationId: string, content: string): Promise<RegistrationNote> {
  return apiFetch<RegistrationNote>(`/admin/registrations/${registrationId}/notes`, {
    method: 'POST',
    headers: adminHeaders('POST'),
    body: JSON.stringify({ content }),
  })
}

export function getActivity(): Promise<ActivityEntry[]> {
  return apiFetch<ActivityEntry[]>('/admin/activity', { headers: adminHeaders() })
}

export type SessionListItem = {
  id: string
  company_cvr: string | null
  current_step: number
  contact_name: string | null
  contact_email: string | null
  tier: string | null
  created_at: string
  updated_at: string
  expires_at: string
}

export type SessionDetail = SessionListItem & {
  step_data: Record<string, unknown>
  flags: Record<string, unknown>
  email_verified: boolean
}

export function listSessions(): Promise<SessionListItem[]> {
  return apiFetch<SessionListItem[]>('/admin/sessions', { headers: adminHeaders() })
}

export function getSessionDetail(id: string): Promise<SessionDetail> {
  return apiFetch<SessionDetail>(`/admin/sessions/${id}`, { headers: adminHeaders() })
}

export async function fetchDocumentBlob(documentId: string): Promise<{ blob: Blob; contentType: string }> {
  const res = await fetch(`${getApiBaseUrl()}/admin/documents/${documentId}`, {
    headers: adminHeaders(),
  })
  if (!res.ok) throw new Error(`${res.status}`)
  const blob = await res.blob()
  const contentType = res.headers.get('Content-Type') ?? 'application/octet-stream'
  return { blob, contentType }
}
