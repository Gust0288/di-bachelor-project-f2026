import { apiFetch } from './client'

export function sendLoginOtp(email: string): Promise<{ session_exists: boolean }> {
  return apiFetch('/auth/otp/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  })
}

export function verifyLoginOtp(
  email: string,
  code: string,
): Promise<{ session_id: string }> {
  return apiFetch('/auth/otp/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, code }),
  })
}

export function adminLogin(
  email: string,
  password: string,
): Promise<{ token: string; admin_id: string }> {
  return apiFetch('/auth/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
}
